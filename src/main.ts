import { mount } from 'svelte';
import { hydrateWindowsState, isWindowsHost, nativeRequest } from './lib/nativeHost';
import { isDesktop } from './lib/desktop';
import '@fontsource/vazirmatn/arabic-400.css';
import '@fontsource/vazirmatn/arabic-500.css';
import '@fontsource/vazirmatn/arabic-700.css';
import '@fontsource/vazirmatn/arabic-800.css';
import '@fontsource/vazirmatn/arabic-900.css';
import './styles.css';
import App from './App.svelte';
document.documentElement.classList.toggle('native', isDesktop());
async function start() {
  try {
    await hydrateWindowsState();
    mount(App, { target: document.getElementById('app')! });
  } catch (error) {
    document.getElementById('app')!.textContent = 'جرعه باز نشد: ' + String(error);
    document.body.style.background = '#fff5e5';
    if(isWindowsHost())void nativeRequest('ready');
  }
}
void start();
