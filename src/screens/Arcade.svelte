<script lang="ts">
  import { onMount } from 'svelte';
  import Icon from '../lib/Icon.svelte';
  import Heading from '../lib/Heading.svelte';
  import { ArcadeEngine, shapePreview, type GameKind } from '../lib/games';
  import { fa } from '../lib/lessons';
  export let onback: () => void;
  export let onerror: (message: string) => void;
  let kind: GameKind | null = null;
  let canvas: HTMLCanvasElement;
  let engine: ArcadeEngine;
  let paused = false;
  let score = 0;
  let over = false;
  let speed = 1;
  let elapsed = 0;
  let best = 0;
  let nextShape=0;
  $: nextCells=shapePreview(nextShape);
  let confirmRestart = false;
  const games = [
    { id: 'blocks' as const, title: 'بلوک‌ها' },
    { id: 'snake' as const, title: 'مار' },
    { id: 'pong' as const, title: 'پونگ' },
  ];
  function start(game: GameKind) {
    kind = game;
    engine = new ArcadeEngine(game);
    paused = false;
    over = false;
    score = 0;
    elapsed = 0;
    requestAnimationFrame(() => canvas?.focus());
    try {
      best = Number(localStorage.getItem('joree-best-' + game) || 0);
    } catch (error) {
      onerror(String(error));
    }
  }
  function keyboard(event: KeyboardEvent) {
    if (!kind || document.activeElement !== canvas) return;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Escape'].includes(event.key))
      event.preventDefault();
    if (event.key === 'Escape') {
      paused = !paused;
      return;
    }
    if (paused || over) return;
    if (kind === 'pong') {
      if (event.key === 'ArrowUp') engine.movePaddle(engine.paddle - 22);
      if (event.key === 'ArrowDown') engine.movePaddle(engine.paddle + 22);
    } else engine.key(event.key);
  }
  function movePaddle(event: PointerEvent) {
    if (kind !== 'pong' || paused || over) return;
    const bounds = canvas.getBoundingClientRect();
    engine.movePaddle(((event.clientY - bounds.top) / bounds.height) * 460 - 40);
  }
  onMount(() => {
    let frame = 0;
    let last = 0;
    let accumulated = 0;
    let lastSecond = 0;
    function loop(time: number) {
      frame = requestAnimationFrame(loop);
      if (!kind || !canvas) return;
      if (!last) last = time;
      const delta = Math.min(100, time - last);
      last = time;
      if (!paused && !over) {
        accumulated += delta;
        lastSecond += delta;
        if (lastSecond >= 1000) {
          elapsed++;
          lastSecond -= 1000;
        }
        while (accumulated >= 16.67) {
          engine.tick(speed);
          accumulated -= 16.67;
        }
        score = engine.score;
        nextShape=engine.nextShape;
        over = engine.over;
        if (score > best) {
          best = score;
          try {
            localStorage.setItem('joree-best-' + kind, String(best));
          } catch (error) {
            onerror(String(error));
          }
        }
      }
      const context = canvas.getContext('2d');
      if (context) engine.draw(context);
    }
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  });
</script>

<svelte:window
  onkeydown={keyboard}
  onblur={() => {
    if (kind) paused = true;
  }}
/>
<div class="arcade-page page">
  {#if !kind}<Heading title="زنگ تفریح" subtitle="یک استراحت کوتاه، به انتخاب خودت" />
    <div class="arcade-options">
      <Icon name="clock" size={23} /><span>با سرعت خودت بازی کن</span><select
        aria-label="درجهٔ سختی"
        bind:value={speed}
        ><option value={1}>آرام</option><option value={2}>معمولی</option><option value={3}
          >سریع</option
        ></select
      >
    </div>
    <div class="game-cards">
      {#each games as game}<article class="game-cartridge {game.id}">
          <div class="game-grip"></div>
          <div class="game-preview">
            <svg viewBox="0 0 140 100" aria-hidden="true"
              >{#if game.id === 'blocks'}<g stroke="#faf5e9" stroke-width="1"
                  ><path
                    d="M6 80h16v16H6Zm17 0h16v16H23Zm17 0h16v16H40Zm17 0h16v16H57Z"
                    fill="#ffdf7d"
                  /><path
                    d="M74 80h16v16H74Zm17 0h16v16H91Zm17 0h16v16h-16ZM91 63h16v16H91Zm17 0h16v16h-16Z"
                    fill="#9ce6ef"
                  /><path d="M74 20h16v16H74Zm0 17h16v16H74Zm-17 0h16v16H57Z" fill="#efaddd" /></g
                >{:else if game.id === 'snake'}<path
                  d="M20 65V40h60"
                  stroke="#8dda65"
                  fill="none"
                  stroke-width="14"
                  stroke-linejoin="round"
                  stroke-dasharray="13 1"
                /><rect x="112" y="44" width="12" height="12" fill="#ff9eae" />{:else}<path
                  d="M70 4v92"
                  stroke="#f5ebd8"
                  stroke-width="2"
                  stroke-dasharray="5 5"
                /><rect x="15" y="26" width="8" height="35" rx="2" fill="#99ecf0" /><rect
                  x="116"
                  y="39"
                  width="8"
                  height="35"
                  rx="2"
                  fill="#ffb3ce"
                /><rect x="84" y="42" width="7" height="7" fill="#fff7e7" />{/if}</svg
            >
          </div>
          <h2>{game.title}</h2>
          <button class="yellow" onclick={() => start(game.id)}
            ><Icon name="play" size={19} />شروع</button
          >
        </article>{/each}
    </div>
    <button class="cream arcade-back" onclick={onback}><Icon name="arrow" />بازگشت به درس</button>
  {:else}<div class="game-heading">
      <h1>
        {games.find((game) => game.id === kind)?.title}<Icon
          name={kind === 'blocks' ? 'grid' : 'game'}
          size={37}
        />
      </h1>
      <button class="coral" onclick={() => (paused = !paused)}
        ><Icon name={paused ? 'play' : 'pause'} size={22} />{paused ? 'ادامه' : 'توقف'}</button
      ><span class="blue"
        ><Icon name="clock" />{fa(Math.floor(elapsed / 60))}:{String(elapsed % 60)
          .padStart(2, '0')
          .replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[+d])}</span
      >
    </div>
    <div class="game-layout">
      <aside class="game-sidebar">
        <div class="score-panel">
          <h2>امتیاز</h2>
          <b>{fa(score)}</b>
        </div>
        <div class="score-panel best-score">
          {#if kind==='blocks'}<h2>بعدی</h2><div class="next-piece"><svg viewBox="0 0 120 85" aria-label="قطعهٔ بعدی">{#each nextCells as cell}<rect x={12+cell.x*24} y={6+cell.y*24} width="23" height="23" rx="4" fill="#ffdc72" stroke="#c19a3f" stroke-width="2"/>{/each}</svg></div>{:else}<h2>بهترین</h2><b>{fa(best)}</b>{/if}
        </div>
        <h3>جهت‌ها:</h3>
        <div class="arrow-keys">
          <kbd>↑</kbd>
          <div><kbd>←</kbd><kbd>↓</kbd><kbd>→</kbd></div>
        </div>
        <p>
          {kind === 'blocks'
            ? 'حرکت · چرخش: بالا\nفاصله: رهاکردن'
            : kind === 'pong'
              ? 'ماوس یا جهت بالا و پایین\n۵ امتیاز برای پیروزی'
              : 'حرکت با کلیدهای جهت'}
        </p>
        <button class="blue" onclick={() => (paused = true)}>Escape: مکث</button>
      </aside>
      <div class="game-board">
        <canvas
          width="400"
          height="460"
          bind:this={canvas}
          onpointermove={movePaddle}
          aria-label={`صفحهٔ بازی ${kind}`}
          tabindex="0"
        ></canvas>
      </div>
    </div>
    <div class="game-footer">
      <button
        class="cream"
        onclick={() => {
          kind = null;
        }}>انتخاب بازی<Icon name="game" size={21} /></button
      ><span>صدا خاموش</span><button class="cream" onclick={onback}
        >بازگشت به درس<Icon name="arrow" size={21} /></button
      >
    </div>
    {#if paused || over}<div class="game-overlay">
        <div class="pause-dialog">
          <Icon name={over ? 'trophy' : 'pause'} size={30} /><Heading
            title={over ? 'بازی تمام شد' : 'بازی متوقف شد'}
          />
          <p>
            {over
              ? `امتیاز شما: ${fa(score)}`
              : confirmRestart
                ? 'بازی فعلی از ابتدا شروع شود؟'
                : ''}
          </p>
          {#if !over && !confirmRestart}<button
              class="yellow"
              onclick={() => {
                paused = false;
                canvas.focus();
              }}><Icon name="play" />ادامهٔ بازی</button
            >{/if}<button
            class="coral"
            onclick={() => {
              if (over || confirmRestart) {
                start(kind!);
                confirmRestart = false;
              } else confirmRestart = true;
            }}><Icon name="repeat" />{confirmRestart ? 'بله، شروع دوباره' : 'شروع دوباره'}</button
          >{#if confirmRestart}<button class="cream" onclick={() => (confirmRestart = false)}
              >انصراف</button
            >{/if}<button class="cream" onclick={onback}><Icon name="arrow" />بازگشت به درس</button>
          <p class="sound-off"><Icon name="sound" size={20} />صدا خاموش</p>
        </div>
      </div>{/if}{/if}
</div>
