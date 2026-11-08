<script lang="ts">
  import type { Snippet } from 'svelte';
  import Icon from './Icon.svelte';
  import { isDesktop, windowAction } from './desktop';
  export let page = 'library';
  export let pinned = false;
  export let compact = false;
  export let color = 'blue';
  export let settingsTheme = false;
  export let onnav: (page: string) => void;
  export let onpin: () => void;
  export let oncompact: () => void;
  export let onerror: (message: string) => void;
  export let children: Snippet;
  let minimized = false;
  const tabs = [
    { id: 'library', label: 'کتابخانه', icon: 'book' },
    { id: 'review', label: 'مرور کارت‌ها', icon: 'cards' },
    { id: 'progress', label: 'پیشرفت', icon: 'chart' },
    { id: 'settings', label: 'تنظیمات', icon: 'settings' },
  ];
  async function nativeAction(action: 'close' | 'minimize') {
    try {
      if (isDesktop()) await windowAction(action);
      else minimized = true;
    } catch (error) {
      onerror(String(error));
    }
  }
</script>

{#if minimized}<button class="restore-console yellow" onclick={() => (minimized = false)}
    ><Icon name="book" />بازکردن جرعه</button
  >{/if}
<div
  class="console-stage"
  class:hidden={minimized}
  class:compact
  class:tall-settings={page === 'settings' && !settingsTheme}
  class:themes-screen={page === 'settings' && settingsTheme}
  class:arcade-shell={page === 'arcade'}
  class:tall-import={page === 'import'}
>
  <main class="console theme-{color}" class:compact aria-label="کنسول یادگیری جرعه">
    <div class="peach-edge"><i></i><i></i><i></i></div>
    <header class="console-header" data-tauri-drag-region>
      <button class="brand" aria-label="کتابخانهٔ جرعه" onclick={() => onnav('library')}
        ><img src="/assets/logo.png" alt="جرعه" width="155" height="63" draggable="false" /></button
      >
      <button class="arcade-link" class:active={page === 'arcade'} onclick={() => onnav('arcade')}
        ><Icon name="game" size={24} />زنگ تفریح</button
      >
      <div class="speaker top-speaker" aria-hidden="true">
        {#each Array(14) as _}<i></i>{/each}
      </div>
      <div class="window-controls">
        <button aria-label="همیشه روی پنجره‌ها" class:active={pinned} onclick={onpin}
          ><Icon name="pin" size={21} /></button
        ><button aria-label="کوچک‌کردن پنجره" onclick={() => nativeAction('minimize')}
          ><Icon name="minus" size={23} /></button
        ><button aria-label="بستن پنجره" onclick={() => nativeAction('close')}
          ><Icon name="close" size={23} /></button
        >
      </div>
    </header>
    <section class="console-screen" aria-label="صفحهٔ کنسول">{@render children()}</section>
    <nav class="console-nav" class:arcade-nav={page === 'arcade'} aria-label="ناوبری اصلی">
      {#each tabs as tab, index}<button
          class:active={page === tab.id ||
            (tab.id === 'library' && ['import', 'detail'].includes(page)) ||
            (tab.id === 'review' && page === 'study')}
          onclick={() => onnav(tab.id)}
          ><Icon name={tab.icon} size={33} /><span>{tab.label}</span></button
        >{#if index === 1 && page !== 'arcade'}<div class="speaker bottom-speaker" aria-hidden="true">
            {#each Array(15) as _}<i></i>{/each}
          </div>{/if}{/each}
      {#if page === 'arcade'}<button class="active" onclick={() => onnav('arcade')}><Icon name="game" size={33}/><span>زنگ تفریح</span></button>{/if}
    </nav>
    {#if page === 'arcade'}<div class="arcade-hardware"><button class="cream hardware-game" aria-label="کتابخانهٔ درس‌ها" onclick={()=>onnav('library')}><Icon name="book" size={34}/></button><button class="coral" aria-label="بازگشت به کتابخانه" onclick={()=>onnav('library')}><Icon name="arrow" size={37}/></button><div class="speaker" aria-hidden="true">{#each Array(30) as _}<i></i>{/each}</div><button class="yellow" aria-label="ادامهٔ مطالعه" onclick={()=>onnav('study')}><Icon name="next" size={39}/></button><button class="cream hardware-grid" aria-label="تنظیمات بازی و کنسول" onclick={()=>onnav('settings')}><Icon name="grid" size={27}/></button></div>{/if}
    <button
      class="compact-control"
      aria-label={compact ? 'حالت بزرگ' : 'حالت کوچک مطالعه'}
      title={compact ? 'حالت بزرگ' : 'حالت کوچک مطالعه'}
      onclick={oncompact}><Icon name="expand" size={16} /></button
    >
  </main>
</div>
