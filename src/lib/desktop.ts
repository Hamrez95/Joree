import { getCurrentWindow, LogicalSize } from '@tauri-apps/api/window';
import { isWindowsHost, nativeRequest, flushWindowsState } from './nativeHost';
export const isDesktop = () => '__TAURI_INTERNALS__' in window || isWindowsHost();
export async function windowAction(
  action: 'close' | 'minimize' | 'pin' | 'compact',
  enabled = false,
): Promise<void> {
  if (!isDesktop()) return;
  if (isWindowsHost()) {
    if (action === 'close') await flushWindowsState();
    await nativeRequest(action, { enabled });
    return;
  }
  const appWindow = getCurrentWindow();
  if (action === 'close') await appWindow.close();
  if (action === 'minimize') await appWindow.minimize();
  if (action === 'pin') await appWindow.setAlwaysOnTop(enabled);
  if (action === 'compact')
    await appWindow.setSize(new LogicalSize(enabled ? 570 : 860, enabled ? 465 : 880));
}
