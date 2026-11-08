import { isSavedState, type SavedState } from './lessons';

type WebViewTransport = { postMessage(message: unknown): void; addEventListener(type: 'message', listener: (event: MessageEvent) => void): void };
declare global {
  interface Window { __JOREE_DESKTOP__?: boolean; chrome?: { webview?: WebViewTransport }; }
}
const pending = new Map<string, { resolve: (value: unknown) => void; reject: (error: Error) => void; timeout: ReturnType<typeof setTimeout> }>();
let connected = false;
let writes: Promise<unknown> = Promise.resolve();
export const isWindowsHost = () => window.__JOREE_DESKTOP__ === true;

/** Calls one bounded native command. Only the local WebView transport has this interface. */
export function nativeRequest<T = unknown>(action: string, payload: unknown = {}): Promise<T> {
  const transport = window.chrome?.webview;
  if (!isWindowsHost() || !transport) return Promise.reject(new Error('میزبان ویندوز در دسترس نیست.'));
  if (!connected) {
    transport.addEventListener('message', event => {
      const response = event.data;
      if (!response || typeof response.id !== 'string') return;
      const operation = pending.get(response.id);
      if (!operation) return;
      clearTimeout(operation.timeout); pending.delete(response.id);
      if (typeof response.error === 'string') operation.reject(new Error(response.error));
      else operation.resolve(response.result);
    });
    connected = true;
  }
  return new Promise<T>((resolve, reject) => {
    const id = crypto.randomUUID();
    const timeout = setTimeout(() => { pending.delete(id); reject(new Error('پاسخ برنامه دریافت نشد؛ دوباره تلاش کن.')); }, 30_000);
    pending.set(id, { resolve: value => resolve(value as T), reject, timeout });
    transport.postMessage({ id, action, payload });
  });
}
export async function hydrateWindowsState(): Promise<void> {
  if (!isWindowsHost()) return;
  const raw = await nativeRequest<string | null>('loadState');
  if (raw === null) return;
  const value: unknown = JSON.parse(raw);
  if (!isSavedState(value)) throw new Error('اطلاعات ذخیره‌شده سازگار نیست؛ دادهٔ اصلی حفظ شده است.');
  localStorage.setItem('joree-v1', raw);
}
/** Writes are serialized so fast card changes cannot overwrite newer state with an older snapshot. */
export function persistWindowsState(state: SavedState): Promise<unknown> {
  const snapshot = JSON.parse(JSON.stringify(state));
  // Each failed operation is reported by its caller; the next write can still succeed.
  writes = writes.catch(() => undefined).then(() => nativeRequest('saveState', { state: snapshot }));
  return writes;
}
export function flushWindowsState(): Promise<unknown> { return writes; }

export function attachWindowsChrome(onError: (error: unknown) => void): () => void {
  if (!isWindowsHost()) return () => undefined;
  const stage = document.querySelector('.console-stage');
  const shape = () => {
    if (!stage) return;
    const bounds = stage.getBoundingClientRect();
    void nativeRequest('shape', { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height }).catch(onError);
  };
  const observer = new ResizeObserver(shape);
  if (stage) observer.observe(stage);
  const drag = (event: MouseEvent) => {
    if (event.button !== 0 || !(event.target instanceof Element)) return;
    if (event.target.closest('button,input,textarea,select,a') || !event.target.closest('[data-tauri-drag-region]')) return;
    void nativeRequest('drag').catch(onError);
  };
  document.addEventListener('mousedown', drag);
  void nativeRequest('ready').then(shape).catch(onError);
  return () => { observer.disconnect(); document.removeEventListener('mousedown', drag); };
}
