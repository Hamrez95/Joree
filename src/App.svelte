<script lang="ts">
  import { onMount } from 'svelte';
  import { createButtonSound } from './lib/sound';
  import { attachWindowsChrome, isWindowsHost, persistWindowsState } from './lib/nativeHost';
  import ConsoleShell from './lib/ConsoleShell.svelte';
  import Dialog from './lib/Dialog.svelte';
  import Icon from './lib/Icon.svelte';
  import Heading from './lib/Heading.svelte';
  import Decor from './lib/Decor.svelte';
  import Library from './screens/Library.svelte';
  import CourseDetail from './screens/CourseDetail.svelte';
  import Study from './screens/Study.svelte';
  import ImportLesson from './screens/ImportLesson.svelte';
  import ReviewPage from './screens/Review.svelte';
  import ProgressPage from './screens/Progress.svelte';
  import Settings from './screens/Settings.svelte';
  import Note from './screens/Note.svelte';
  import {
    initialState,
    migrateCurriculum,
    loadState,
    isSavedState,
    scheduleReview,
    type SavedState,
    type Course,
    type Card,
    type Review,
  } from './lib/lessons';
  import { isDesktop, windowAction } from './lib/desktop';
  let state: SavedState = initialState();
  let page = 'library';
  let selectedId = 'company-ai-01';
  let revealed = false;
  let compact = false;
  let settingsTheme = false;
  let scale = 1;
  let layoutWidth = 824;
  let layoutHeight = 824;
  let smallViewport = false;
  let toast = '';
  let toastError = false;
  let toastTimeout: ReturnType<typeof setTimeout>;
  let loaded = false;
  let dialog: {
    title: string;
    message: string;
    label: string;
    destructive: boolean;
    action: () => void;
  } | null = null;
  let restoreInput: HTMLInputElement;
  let pendingRestore: SavedState | null = null;
  let reviewQueue: { course: Course; card: Card; index: number }[] = [];
  let reviewIndex = 0;
  let reviewMode = false;
  let noteBack = 'study';
  let reminderShown = '';
  let Arcade: typeof import('./screens/Arcade.svelte').default | undefined;
  $: selected = state.courses.find((course) => course.id === selectedId) ?? state.courses[0];
  $: card = selected?.cards[selected.position];
  $: shellPage = page === 'note' ? 'review' : page === 'complete' ? 'progress' : page;
  $: if (loaded) {
    persist(state);
  }
  function notify(message: string, error = false) {
    toast = message;
    toastError = error;
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => (toast = ''), 5000);
  }
  function persist(value: SavedState) {
    try {
      localStorage.setItem('joree-v1', JSON.stringify(value));
      if (isWindowsHost()) void persistWindowsState(value).catch(error => notify('ذخیره در پایگاه داده انجام نشد: '+String(error),true));
    } catch (error) {
      notify(
        'ذخیره انجام نشد؛ فضای مرورگر یا دسترسی ذخیره‌سازی را بررسی کن. ' + String(error),
        true,
      );
    }
  }
  function resize() {
    const availableWidth = Math.max(280, window.innerWidth - 40);
    const availableHeight = Math.max(300, window.innerHeight - 39);
    const baseWidth = compact ? 540 : Math.min(824, Math.max(600, availableWidth));
    scale = Math.min(1, availableWidth / baseWidth, availableHeight / (compact ? 430 : 620));
    layoutWidth = availableWidth / scale;
    layoutHeight = availableHeight / scale;
    smallViewport = window.innerWidth <= 700 || window.innerHeight <= 550;
  }
  $: if (loaded) {
    page;
    compact;
    settingsTheme;
    resize();
  }
  onMount(() => {
    try {
      state = loadState();
    } catch (error) {
      notify(String(error), true);
    }
    loaded = true;
    const detachWindows = attachWindowsChrome(error => notify(String(error),true));
    const nativeNavigate = (event:Event) => { const destination=(event as CustomEvent).detail; if(['library','arcade','settings'].includes(destination))void navigate(destination); };
    window.addEventListener('joree-navigate',nativeNavigate);
    const buttonSound = createButtonSound((message) => {
      notify(message, true);
      state = { ...state, preferences: { ...state.preferences, sound: false } };
    });
    const onButtonClick = (event: MouseEvent) => {
      if (
        state.preferences.sound &&
        event.target instanceof Element &&
        event.target.closest('button')
      )
        void buttonSound.play();
    };
    document.addEventListener('click', onButtonClick);
    resize();
    window.addEventListener('resize', resize);
    const reminder = setInterval(() => {
      const now = new Date();
      const time = now.toTimeString().slice(0, 5);
      const day = now.toLocaleDateString('en-CA');
      if (
        state.preferences.reminder &&
        time === state.preferences.reminderTime &&
        reminderShown !== day &&
        page !== 'arcade'
      ) {
        reminderShown = day;
        notify('وقت یک جرعه یادگیریه؛ از کتابخانه ادامه بده.');
      }
    }, 30_000);
    if (isDesktop())
      windowAction('pin', state.preferences.pinned).catch((error) => notify(String(error), true));
    return () => {
      detachWindows(); window.removeEventListener('joree-navigate',nativeNavigate);
      window.removeEventListener('resize', resize);
      document.removeEventListener('click', onButtonClick);
      buttonSound.dispose();
      clearInterval(reminder);
      clearTimeout(toastTimeout);
    };
  });
  async function navigate(destination: string) {
    if(destination==='settings'&&page!=='settings')settingsTheme=false;
    if(destination==='study'&&!selected)destination='library';
    if (destination === 'arcade' && !Arcade) {
      try {
        Arcade = (await import('./screens/Arcade.svelte')).default;
      } catch (error) {
        notify('بازی‌ها بارگیری نشدند. ' + String(error), true);
        return;
      }
    }
    page = destination;
    revealed = false;
    if (destination !== 'study' && destination !== 'note') reviewMode = false;
  }
  function updateCourse(updated: Course) {
    state = {
      ...state,
      courses: state.courses.map((course) => (course.id === updated.id ? updated : course)),
    };
  }
  function study(course: Course, position = course.position) {
    const currentCard = course.cards[position];
    const seen = course.seen.includes(currentCard.id)
      ? course.seen
      : [...course.seen, currentCard.id];
    selectedId = course.id;
    updateCourse({ ...course, position, seen });
    const day = new Date().toLocaleDateString('en-CA');
    if (!state.studyDays.includes(day)) state = { ...state, studyDays: [...state.studyDays, day] };
    page = 'study';
    revealed = false;
  }
  function nextCard() {
    if (reviewMode) {
      advanceReview();
      return;
    }
    if (selected.position >= selected.cards.length - 1) {
      page = 'complete';
      return;
    }
    study(selected, selected.position + 1);
  }
  function previousCard() {
    if (selected.position > 0) study(selected, selected.position - 1);
  }
  function bookmark() {
    if (!card) return;
    const exists = state.bookmarks.includes(card.id);
    state = {
      ...state,
      bookmarks: exists
        ? state.bookmarks.filter((id) => id !== card.id)
        : [...state.bookmarks, card.id],
    };
    notify(exists ? 'نشان کارت برداشته شد' : 'کارت نشان شد');
  }
  function rate(rating: Review['rating']) {
    if (!revealed) return;
    state = {
      ...state,
      reviews: { ...state.reviews, [card.id]: scheduleReview(rating, new Date()) },
    };
    revealed = false;
    nextCard();
  }
  function advanceReview() {
    reviewIndex++;
    if (reviewIndex >= reviewQueue.length) {
      reviewMode = false;
      page = 'complete';
      return;
    }
    const item = reviewQueue[reviewIndex];
    study(state.courses.find((course) => course.id === item.course.id)!, item.index);
  }
  function startReview(items: typeof reviewQueue) {
    if (!items.length) return;
    reviewQueue = items;
    reviewIndex = 0;
    reviewMode = true;
    study(items[0].course, items[0].index);
  }
  async function togglePin() {
    const value = !state.preferences.pinned;
    try {
      await windowAction('pin', value);
      state = { ...state, preferences: { ...state.preferences, pinned: value } };
      if (!isDesktop()) notify('تنظیم ذخیره شد؛ همیشه‌بالا بودن در نسخهٔ دسکتاپ فعال می‌شود.');
    } catch (error) {
      notify('تغییر حالت پنجره انجام نشد. ' + String(error), true);
    }
  }
  async function toggleCompact() {
    const value = !compact;
    try {
      await windowAction('compact', value);
      compact = value;
      if (compact && selected) study(selected);
      resize();
    } catch (error) {
      notify(String(error), true);
    }
  }
  function importCourse(course: Course) {
    const duplicate = state.courses.find((item) => item.title === course.title);
    if (duplicate) {
      dialog = {
        title: 'درسی با این نام وجود دارد',
        message: 'نسخهٔ جدید به‌عنوان یک درس جداگانه اضافه شود؟ درس قبلی و پیشرفت آن حفظ می‌شوند.',
        label: 'افزودن نسخهٔ جدید',
        destructive: false,
        action: () => saveCourse({ ...course, title: course.title + ' (نسخهٔ جدید)' }),
      };
      return;
    }
    saveCourse(course);
  }
  function saveCourse(course: Course) {
    state = { ...state, courses: [...state.courses, course] };
    page = 'library';
    notify('درس به کتابخانه اضافه شد');
  }
  function archive() {
    const archived = !selected.archived;
    updateCourse({ ...selected, archived });
    page = 'library';
    notify(archived ? 'درس بایگانی شد' : 'درس به کتابخانه برگشت');
  }
  function removeCourse() {
    dialog = {
      title: 'حذف درس',
      message: `«${selected.title}» همراه با پیشرفت، مرورها و یادداشت‌هایش حذف شود؟ این کار قابل بازگشت نیست.`,
      label: 'حذف درس',
      destructive: true,
      action: () => {
        const ids = new Set(selected.cards.map((item) => item.id));
        state = {
          ...state,
          courses: state.courses.filter((course) => course.id !== selected.id),
          bookmarks: state.bookmarks.filter((id) => !ids.has(id)),
          notes: Object.fromEntries(Object.entries(state.notes).filter(([id]) => !ids.has(id))),
          reviews: Object.fromEntries(Object.entries(state.reviews).filter(([id]) => !ids.has(id))),
        };
        page = 'library';
        notify('درس حذف شد');
      },
    };
  }
  function backup() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `joree-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify('فایل پشتیبان برای دانلود آماده شد');
  }
  async function inspectBackup(file: File | undefined) {
    if (!file) return;
    try {
      if (file.size > 20_000_000) throw new Error('فایل پشتیبان خیلی بزرگ است.');
      const parsed: unknown = JSON.parse(await file.text());
      if (!isSavedState(parsed)) throw new Error('قالب فایل پشتیبان با این نسخه سازگار نیست.');
      pendingRestore = parsed;
      dialog = {
        title: 'بازیابی نسخهٔ پشتیبان',
        message:
          'اطلاعات فعلی با اطلاعات این فایل جایگزین شود؟ پیش از ادامه می‌توانی از اطلاعات فعلی پشتیبان بگیری.',
        label: 'بازیابی اطلاعات',
        destructive: true,
        action: () => {
          state = migrateCurriculum(pendingRestore!);
          pendingRestore = null;
          selectedId = state.courses[0]?.id ?? '';
          page = 'library';
          notify('نسخهٔ پشتیبان بازیابی شد');
        },
      };
    } catch (error) {
      notify('بازیابی انجام نشد: ' + String(error), true);
    } finally {
      restoreInput.value = '';
    }
  }
  function openNote() {
    noteBack = page;
    page = 'note';
  }
  function saveNote(text: string, source: string) {
    if (source) {
      try {
        const url = new URL(source);
        if (!['https:', 'http:'].includes(url.protocol)) throw new Error();
      } catch {
        notify('پیوند باید یک نشانی معتبر با http یا https باشد.', true);
        return;
      }
    }
    state = { ...state, notes: { ...state.notes, [card.id]: { text, source } } };
    page = noteBack;
    notify('یادداشت ذخیره شد');
  }
</script>

<div class="desktop-backdrop" aria-hidden="true"></div>
<div
  class="workspace"
  style:--scale={scale}
  style:--layout-width={`${layoutWidth}px`}
  style:--layout-height={`${layoutHeight}px`}
  class:small-viewport={smallViewport}
  class:motion-off={state.preferences.motion === 'off'}
  class:motion-reduced={state.preferences.motion === 'reduced'}
  class:small-mode={compact}
>
  <ConsoleShell
    page={shellPage}
    pinned={state.preferences.pinned}
    {compact}
    color={state.preferences.color}
    onnav={navigate}
    onpin={togglePin}
    {settingsTheme}
    oncompact={toggleCompact}
    onerror={(message) => notify(message, true)}
  >
    {#if page === 'library'}<Library
        courses={state.courses}
        onopen={(course) => {
          selectedId = course.id;
          page = 'detail';
        }}
        onstudy={(course) => study(course)}
        onadd={() => (page = 'import')}
      />
    {:else if page === 'detail' && selected}<CourseDetail
        course={selected}
        onstudy={(position) => study(selected, position)}
        onback={() => (page = 'library')}
        onarchive={archive}
        ondelete={removeCourse}
        onrename={(title) => updateCourse({ ...selected, title })}
      />
    {:else if page === 'study' && selected && card}<Study
        course={selected}
        {card}
        {revealed}
        isBookmarked={state.bookmarks.includes(card.id)}
        textSize={state.preferences.textSize}
        onnext={nextCard}
        onprevious={previousCard}
        onreveal={() => (revealed = true)}
        onbookmark={bookmark}
        onnote={openNote}
        ontextsize={() =>
          (state = {
            ...state,
            preferences: { ...state.preferences, textSize: (state.preferences.textSize + 1) % 3 },
          })}
        onback={() => (page = 'detail')}
        onrate={rate}
      />
    {:else if page === 'import'}<ImportLesson
        onimport={importCourse}
        onerror={(message) => notify(message, true)}
      />
    {:else if page === 'review'}<ReviewPage
        {state}
        onopen={(course, index) => study(course, index)}
        onstart={startReview}
      />
    {:else if page === 'progress'}<ProgressPage {state} />
    {:else if page === 'settings'}<Settings
        ontheme={open=>settingsTheme=open}
        preferences={state.preferences}
        onchange={(preferences) => (state = { ...state, preferences })}
        onbackup={backup}
        onrestore={() => restoreInput.click()}
        onpin={togglePin}
      />
    {:else if page === 'note' && card}<Note
        title={card.title}
        text={state.notes[card.id]?.text ?? ''}
        source={state.notes[card.id]?.source ?? ''}
        onsave={saveNote}
        oncancel={() => (page = noteBack)}
      />
    {:else if page === 'arcade' && Arcade}<svelte:component
        this={Arcade}
        onback={() => (selected ? study(selected) : navigate('library'))}
        onerror={(message) => notify(message, true)}
      />
    {:else if page === 'complete'}<div class="complete-page page">
        <div class="completion-medal"><Icon name="star" size={64} /><i></i><i></i></div>
        <Heading title="این درس تمام شد!" />
        <div class="blue completion-summary">
          <Icon name="cards" />{selected?.seen.length.toLocaleString('fa-IR') ?? '۰'} کارت خواندی · با
          سرعت خودت پیش برو
        </div>
        <div class="completion-actions">
          <button
            class="yellow"
            onclick={() => {
              if (selected) study(selected, 0);
            }}><Icon name="repeat" />مطالعهٔ دوباره</button
          ><button class="coral" onclick={() => (page = 'library')}
            ><Icon name="arrow" />بازگشت به کتابخانه</button
          >
        </div>
        <Decor />
      </div>{/if}
  </ConsoleShell>
</div>
<input
  class="visually-hidden"
  type="file"
  accept=".json"
  aria-label="فایل پشتیبان"
  bind:this={restoreInput}
  onchange={(event) => inspectBackup(event.currentTarget.files?.[0])}
/>
{#if toast}<div class="toast" class:error={toastError} role={toastError ? 'alert' : 'status'}>
    <Icon name={toastError ? 'info' : 'check'} size={24} /><span>{toast}</span><button
      aria-label="بستن پیام"
      onclick={() => (toast = '')}><Icon name="close" size={19} /></button
    >
  </div>{/if}
{#if dialog}<Dialog
    title={dialog.title}
    message={dialog.message}
    confirmLabel={dialog.label}
    destructive={dialog.destructive}
    onconfirm={() => {
      const action = dialog!.action;
      dialog = null;
      action();
    }}
    oncancel={() => {
      dialog = null;
      pendingRestore = null;
    }}
  />{/if}
