<script lang="ts">
  import Heading from '../lib/Heading.svelte';
  import Icon from '../lib/Icon.svelte';
  import Decor from '../lib/Decor.svelte';
  import { fa, type SavedState, type Card, type Course } from '../lib/lessons';
  export let state: SavedState;
  export let onopen: (course: Course, index: number) => void;
  export let onstart: (cards: { course: Course; card: Card; index: number }[]) => void;
  let filter = 'due';
  let scope = 'all';
  $: allCards = state.courses
    .filter((course) => !course.archived)
    .flatMap((course) => course.cards.map((card, index) => ({ course, card, index })));
  $: eligible = allCards.filter((item) => scope === 'all' || item.course.id === scope);
  $: due = eligible.filter(
    (item) =>
      state.reviews[item.card.id] && Date.parse(state.reviews[item.card.id].due) <= Date.now(),
  );
  $: items =
    filter === 'bookmarks'
      ? eligible.filter((item) => state.bookmarks.includes(item.card.id))
      : filter === 'practice'
        ? eligible.filter((item) => state.reviews[item.card.id]?.rating === 'again')
        : due;
</script>

<div class="review-page page">
  <Heading title={filter === 'bookmarks' ? 'نشان‌شده‌ها' : 'مرور کارت‌ها'} />
  <div class="review-summary">
    <span class="blue"
      ><Icon name="cards" />{fa(items.length)} کارت برای {filter === 'bookmarks'
        ? 'مرور'
        : 'امروز'}</span
    ><span class="blue"><Icon name="clock" />حدود {fa(Math.ceil(items.length * 0.4))} دقیقه</span>
  </div>
  <label class="review-scope"
    >دامنهٔ مرور:<select bind:value={scope}
      ><option value="all">همهٔ درس‌ها</option>{#each state.courses as course}<option
          value={course.id}>{course.title}</option
        >{/each}</select
    ></label
  >
  <div class="review-tabs">
    {#each [{ id: 'due', label: 'موعد امروز', icon: 'calendar' }, { id: 'practice', label: 'نیاز به تمرین', icon: 'repeat' }, { id: 'bookmarks', label: 'نشان‌شده‌ها', icon: 'bookmark' }] as item}<button
        class:yellow={filter === item.id}
        class:blue={filter !== item.id}
        onclick={() => (filter = item.id)}><Icon name={item.icon} size={24} />{item.label}</button
      >{/each}
  </div>
  <div class="review-list">
    {#each items as item}<button class="review-row" onclick={() => onopen(item.course, item.index)}
        ><span class="course-tag"
          ><Icon
            name={item.course.kind === 'ai'
              ? 'chip'
              : item.course.kind === 'excel'
                ? 'grid'
                : 'book'}
            size={24}
          />{item.course.kind === 'ai'
            ? 'AI'
            : item.course.kind === 'excel'
              ? 'Excel'
              : item.course.kind === 'english'
                ? 'English'
                : 'تفکر'}</span
        ><strong>{item.card.title}</strong><Icon name="back" size={23} /></button
      >{/each}
  </div>
  {#if !items.length}<div class="empty-state review-empty">
      <Decor type="star" />
      <h2>
        {filter === 'bookmarks'
          ? 'هنوز کارتی نشان نکرده‌ای'
          : filter === 'practice'
            ? 'کارتی برای تمرین دوباره نیست'
            : 'مرورهای امروزت تمام شده!'}
      </h2>
      <p>
        {filter === 'bookmarks'
          ? 'با دکمهٔ نشان در صفحهٔ مطالعه کارت‌ها را نگه دار.'
          : 'با مطالعه و پاسخ به کارت‌ها، مرور بعدی تنظیم می‌شود.'}
      </p>
    </div>{/if}<button
    class="yellow start-review"
    disabled={!items.length}
    onclick={() => onstart(items)}><Icon name="play" />شروع مرور</button
  >
  <div class="review-info">
    <Decor /><span class="blue"
      ><Icon name="info" size={23} />مرورها بر اساس پاسخ‌های خودت تنظیم می‌شوند.</span
    ><Decor />
  </div>
</div>
