<script lang="ts">
  import Icon from '../lib/Icon.svelte';
  import Heading from '../lib/Heading.svelte';
  import Cartridge from '../lib/Cartridge.svelte';
  import { fa, normalizeSearch, type Course } from '../lib/lessons';
  export let courses: Course[];
  export let onopen: (course: Course) => void;
  export let onstudy: (course: Course) => void;
  export let onadd: () => void;
  let search = '';
  let filter = 'all';
  $: active =
    courses.find(
      (course) =>
        !course.archived && course.seen.length > 0 && course.seen.length < course.cards.length,
    ) ?? courses.find((course) => !course.archived);
  $: visible = courses.filter(
    (course) =>
      (filter === 'archived' ? course.archived : !course.archived) &&
      normalizeSearch(course.title).includes(normalizeSearch(search)) &&
      (filter === 'all' ||
        filter === 'archived' ||
        (filter === 'learning'
          ? course.seen.length < course.cards.length
          : course.seen.length === course.cards.length)),
  );
</script>

<div class="library-page page">
  <Heading title="کتابخانه" />
  <div class="library-toolbar">
    <label class="search-box"
      ><Icon name="search" /><input
        aria-label="جست‌وجوی درس"
        placeholder="جست‌وجوی درس..."
        bind:value={search}
      /></label
    ><button class="yellow add-course" onclick={onadd}><Icon name="plus" />افزودن درس</button>
  </div>
  <div class="library-filters" aria-label="فیلتر درس‌ها">
    {#each [{ id: 'all', label: 'همه' }, { id: 'learning', label: 'در حال یادگیری' }, { id: 'done', label: 'تمام‌شده' }] as item}<button
        class:yellow={filter === item.id}
        class:blue={filter !== item.id}
        aria-pressed={filter === item.id}
        onclick={() => (filter = item.id)}>{item.label}</button
      >{/each}{#if courses.some((course) => course.archived)}<button
        class:yellow={filter === 'archived'}
        class:blue={filter !== 'archived'}
        onclick={() => (filter = 'archived')}>بایگانی</button
      >{/if}
  </div>
  {#if active && !search && filter === 'all'}<article class="continue-card">
      <button class="yellow" onclick={() => onstudy(active)}
        ><Icon name="play" size={23} />ادامهٔ یادگیری</button
      >
      <div class="continue-info">
        <h2>ادامهٔ یادگیری</h2>
        <p>{active.title} · فصل: {active.cards[active.position].chapter}</p>
        <div class="course-progress">
          <progress max={active.cards.length} value={active.seen.length}></progress><span
            >{fa(active.seen.length)} از {fa(active.cards.length)} کارت</span
          >
        </div>
      </div>
      <Cartridge kind={active.kind} />
    </article>{/if}
  <div class="course-grid">
    {#each visible as course}<button class="course-card" onclick={() => onopen(course)}
        ><div>
          <h2>{course.title}</h2>
          <p>{fa(course.cards.length)} کارت <small>· {course.description}</small></p>
          {#if course.seen.length}<div class="course-progress">
              <progress value={course.seen.length} max={course.cards.length}></progress><span
                >{fa(course.seen.length)} از {fa(course.cards.length)}</span
              >
            </div>{/if}
        </div>
        <Cartridge kind={course.kind} /><Icon name="back" size={22} /></button
      >{/each}
  </div>
  {#if !visible.length}<div class="empty-state">
      <Icon name="book" size={65} />
      <h2>{search ? 'درسی پیدا نشد' : 'هنوز درسی در این بخش نیست'}</h2>
      <p>{search ? 'نام دیگری را جست‌وجو کن.' : 'اولین درس خودت را اضافه کن.'}</p>
      <button class="yellow" onclick={onadd}>افزودن درس<Icon name="plus" /></button>
    </div>{/if}
</div>
