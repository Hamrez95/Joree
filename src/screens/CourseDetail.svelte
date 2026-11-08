<script lang="ts">
  import Icon from '../lib/Icon.svelte';
  import Cartridge from '../lib/Cartridge.svelte';
  import { fa, type Collection, type Course } from '../lib/lessons';
  type CollectionNode = { collection: Collection; depth: number };
  export let course: Course;
  export let collections: Collection[] = [];
  export let onstudy: (position: number) => void;
  export let onback: () => void;
  export let onarchive: () => void;
  export let ondelete: () => void;
  export let onrename: (title: string) => void;
  export let oncollectionchange: (collectionId: string | null) => void;
  let editing = false;
  let newTitle = course.title;
  $: chapters = [...new Set(course.cards.map((card) => card.chapter))];
  function flatten(parentId: string | null = null, depth = 0, path: Set<string> = new Set()): CollectionNode[] {
    return collections
      .filter((item) => item.parentId === parentId && !path.has(item.id))
      .flatMap((item) => {
        const nextPath = new Set(path).add(item.id);
        return [{ collection: item, depth }, ...flatten(item.id, depth + 1, nextPath)];
      });
  }
  $: collectionTree = flatten();
</script>

<div class="detail-page page">
  <div class="detail-heading">
    <Cartridge small kind={course.kind} />{#if editing}<form
        onsubmit={(event) => {
          event.preventDefault();
          if (newTitle.trim()) {
            onrename(newTitle.trim());
            editing = false;
          }
        }}
      >
        <input aria-label="نام درس" bind:value={newTitle} /><button class="yellow" type="submit"
          ><Icon name="check" size={20} /></button
        >
      </form>{:else}<h1>{course.title}</h1>{/if}<button
      class="cream icon-button"
      aria-label="ویرایش نام درس"
      onclick={() => (editing = !editing)}><Icon name="note" size={23} /></button
    >
  </div>
  <div class="detail-actions">
    <button class="cream" onclick={onback}><Icon name="arrow" size={21} />بازگشت</button><button
      class="cream"
      onclick={onarchive}
      ><Icon name="folder" size={21} />{course.archived ? 'بازگردانی' : 'بایگانی'}</button
    ><button class="cream" onclick={ondelete}><Icon name="trash" size={21} />حذف درس</button>
  </div>
  <p class="detail-summary">
    {course.description} · {fa(chapters.length)} فصل · {fa(course.cards.length)} کارت
  </p>
  <label class="detail-collection">کالکشن درس
    <select aria-label="کالکشن درس" value={course.collectionId ?? ''} onchange={(event) => oncollectionchange(event.currentTarget.value || null)}>
      <option value="">بدون کالکشن</option>
      {#each collectionTree as node}<option value={node.collection.id}
          >{'　'.repeat(node.depth)}{node.collection.name}</option
        >{/each}
    </select>
  </label>
  <div class="chapter-list">
    {#each chapters as chapter, index}{@const cards = course.cards.filter(
        (card) => card.chapter === chapter,
      )}<button
        class="chapter-row"
        onclick={() => onstudy(course.cards.findIndex((card) => card.chapter === chapter))}
        ><b class="chapter-number">{fa(index + 1)}</b><strong>{chapter}</strong><progress
          max={cards.length}
          value={cards.filter((card) => course.seen.includes(card.id)).length}
        ></progress><span
          >{fa(cards.filter((card) => course.seen.includes(card.id)).length)} از {fa(
            cards.length,
          )}</span
        ><Icon name="back" size={21} /></button
      >{/each}
  </div>
  <button class="yellow detail-start" onclick={() => onstudy(course.position)}
    ><Icon name="play" />
    {course.seen.length ? 'ادامهٔ یادگیری' : 'شروع فصل: ' + chapters[0]}</button
  >
</div>
