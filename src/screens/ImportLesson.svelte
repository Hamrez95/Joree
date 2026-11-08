<script lang="ts">
  import Icon from '../lib/Icon.svelte';
  import Heading from '../lib/Heading.svelte';
  import Decor from '../lib/Decor.svelte';
  import { parseLesson, fa, type Collection, type Course } from '../lib/lessons';
  type CollectionNode = { collection: Collection; depth: number };
  export let onimport: (course: Course) => void;
  export let onerror: (message: string) => void;
  export let collections: Collection[] = [];
  export let initialCollectionId: string | null = null;
  let collectionSelection = '';
  $: collectionSelection = initialCollectionId ?? '';
  function flatten(parentId: string | null = null, depth = 0, path: Set<string> = new Set()): CollectionNode[] {
    return collections
      .filter((item) => item.parentId === parentId && !path.has(item.id))
      .flatMap((item) => {
        const nextPath = new Set(path).add(item.id);
        return [{ collection: item, depth }, ...flatten(item.id, depth + 1, nextPath)];
      });
  }
  $: collectionTree = flatten();
  let mode = 'file';
  let markdown = '';
  let name = '';
  let filename = '';
  let error = '';
  let preview: Course | null = null;
  let dragging = false;
  let fileInput: HTMLInputElement;
  let loading = false;
  let copied = false;
  const sample = '# عنوان کارت\nمتن کوتاه و واضح کارت.\n\n---\n\n# کارت بعدی\nمتن کارت بعدی.';
  function inspect() {
    try {
      preview = parseLesson(markdown, name || filename.replace(/\.md$/i, ''));
      name = preview.title;
      error = '';
    } catch (cause) {
      error = cause instanceof Error ? cause.message : String(cause);
      preview = null;
    }
  }
  async function readFile(file: File | undefined) {
    if (!file) return;
    if (!/\.(md|markdown|txt)$/i.test(file.name)) {
      error = 'فایل Markdown با پسوند .md انتخاب کن.';
      return;
    }
    loading = true;
    try {
      if (file.size > 2_000_000)
        throw new Error('فایل بزرگ‌تر از ۲ مگابایت است. فایل کوچک‌تری انتخاب کن.');
      filename = file.name;
      markdown = await file.text();
      inspect();
    } catch (cause) {
      error = String(cause);
    } finally {
      loading = false;
    }
  }
  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(
        'یک درس فارسی کوتاه با قالب Markdown بساز. هر کارت یک عنوان با # و یک توضیح کوتاه داشته باشد. کارت‌ها را با خط --- جدا کن.',
      );
      copied = true;
    } catch {
      onerror('کپی انجام نشد؛ دسترسی کلیپ‌بورد را بررسی کن.');
    }
  }
</script>

<div class="import-page page">
  <Heading
    title={error ? 'این فایل نیاز به اصلاح دارد' : preview ? 'پیش‌نمایش درس' : 'افزودن درس'}
  />
  <div class="import-steps">
    <span class:current={!preview && !error}><b>{preview || error ? '✓' : '۱'}</b>انتخاب فایل</span
    ><i></i><span class:current={!!preview || !!error}><b>۲</b>بررسی</span><i></i><span
      ><b>۳</b>افزودن</span
    >
  </div>
  <label class="import-collection">کالکشن درس
    <select aria-label="کالکشن درس" bind:value={collectionSelection}>
      <option value="">بدون کالکشن</option>
      {#each collectionTree as node}<option value={node.collection.id}
          >{'　'.repeat(node.depth)}{node.collection.name}</option
        >{/each}
    </select>
  </label>
  <input
    class="visually-hidden"
    type="file"
    accept=".md,.markdown,.txt"
    bind:this={fileInput}
    onchange={(event) => readFile(event.currentTarget.files?.[0])}
  />
  {#if preview}<div class="import-preview">
      <div class="import-metadata">
        <h3 dir="ltr"><Icon name="file" />{filename || 'متن آماده'}</h3>
        <label>نام درس<input bind:value={name} aria-label="نام درس" /></label>
        <p>
          <Icon name="cards" />{fa(new Set(preview.cards.map((card) => card.chapter)).size)} فصل · {fa(
            preview.cards.length,
          )} کارت
        </p>
      </div>
      <div class="preview-card">
        <h2>{preview.cards[0].title}</h2>
        <p>{preview.cards[0].body}</p>
      </div>
    </div>
    <div class="preview-list">
      {#each preview.cards.slice(1) as card, index}<div>
          <span>{fa(index + 2)}</span>{card.title}{#if card.body.length > 500}<small
              >کارت طولانی</small
            >{/if}
        </div>{/each}
    </div>
    <div class="import-footer">
      <button
        class="yellow"
        onclick={() => onimport({ ...preview!, title: name.trim() || preview!.title, collectionId: collectionSelection || null })}
        ><Icon name="plus" />افزودن به کتابخانه</button
      ><button
        class="cream"
        onclick={() => {
          preview = null;
          markdown = '';
        }}>انتخاب دوباره</button
      >
    </div>
  {:else if error}<div class="import-error">
      <div class="error-message">
        <Icon name="info" size={44} />
        <h2>{error}</h2>
      </div>
      <pre dir="rtl">{sample}</pre>
    </div>
    <button
      class="coral choose-file"
      onclick={() => {
        error = '';
        fileInput.click();
      }}><Icon name="folder" />انتخاب فایل دیگر</button
    ><button
      class="cream template-button"
      onclick={() => {
        error = '';
        mode = 'text';
        markdown = sample;
      }}>دیدن قالب نمونه<Icon name="file" /></button
    >
  {:else}<div class="segmented import-tabs">
      <button class:yellow={mode === 'file'} onclick={() => (mode = 'file')}
        ><Icon name="file" />فایل Markdown</button
      ><button class:yellow={mode === 'text'} onclick={() => (mode = 'text')}
        ><Icon name="file" />متن آماده</button
      >
    </div>
    {#if mode === 'file'}<div class="drop-decoration"><Decor /><Decor /></div>
      <button
        class="file-drop"
        class:dragging
        ondragover={(event) => {
          event.preventDefault();
          dragging = true;
        }}
        ondragleave={() => (dragging = false)}
        ondrop={(event) => {
          event.preventDefault();
          dragging = false;
          readFile(event.dataTransfer?.files[0]);
        }}
        onclick={() => fileInput.click()}
        ><span class="drop-screws"><i></i><i></i><i></i><i></i></span><span class="drop-slots"
          >▏▏▏▏▏</span
        ><span class="file-paper"><Icon name="file" size={65} /><b>MD</b></span><strong
          >{loading ? 'در حال خواندن فایل…' : 'فایل درس را اینجا رها کن'}</strong
        ></button
      ><button class="coral choose-file" onclick={() => fileInput.click()}
        ><Icon name="folder" />انتخاب فایل</button
      >
      <div class="import-star"><Decor type="star" /></div>
    {:else}<label class="paste-label"
        >متن درس<textarea placeholder={sample} bind:value={markdown} aria-label="متن Markdown درس"
        ></textarea></label
      ><button class="yellow choose-file" onclick={inspect}><Icon name="eye" />بررسی متن درس</button
      >{/if}
    <div class="import-prompt">
      <button class="blue" onclick={copyPrompt}
        ><Icon name="copy" />{copied ? 'دستور کپی شد' : 'کپی دستور ساخت درس برای AI'}</button
      >
    </div>{/if}
</div>
