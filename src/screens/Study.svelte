<script lang="ts">
  import Icon from '../lib/Icon.svelte';
  import LessonContent from '../lib/LessonContent.svelte';
  import { fa, type Card, type Course, type Review } from '../lib/lessons';
  export let course: Course;
  export let card: Card;
  export let revealed = false;
  export let isBookmarked = false;
  export let textSize = 1;
  export let onnext: () => void;
  export let onprevious: () => void;
  export let onreveal: () => void;
  export let onbookmark: () => void;
  export let onnote: () => void;
  export let ontextsize: () => void;
  export let onback: () => void;
  export let onrate: (rating: Review['rating']) => void;
  let touchStart = 0;
  function keyboard(event: KeyboardEvent) {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement)
      return;
    if (event.key === 'ArrowLeft') onnext();
    if (event.key === 'ArrowRight') onprevious();
    if (event.code === 'Space' && card.question && !revealed) {
      event.preventDefault();
      onreveal();
    }
  }
</script>

<svelte:window onkeydown={keyboard} />
<div
  class="study-page page"
  class:question-card={!!card.question}
  class:reading-card={(card.question && revealed ? card.answer?.length ?? 0 : card.body.length) > 500}
  style:--study-size={`${[19, 22, 25, 28, 32][textSize]}px`}
  ontouchstart={(event) => (touchStart = event.touches[0].clientX)}
  ontouchend={(event) => {
    const distance = event.changedTouches[0].clientX - touchStart;
    if (distance > 65) onnext();
    if (distance < -65) onprevious();
  }}
>
  <div class="study-top">
    <button class="blue breadcrumb" onclick={onback}
      ><Icon name="next" />{course.title} / {card.chapter}<Icon name="book" /></button
    ><button
      class="cream icon-button bookmark-button"
      class:selected={isBookmarked}
      aria-label="نشان‌کردن کارت"
      aria-pressed={isBookmarked}
      onclick={onbookmark}><Icon name="bookmark" /></button
    >
  </div>
  {#if card.question}<div class="question-label blue">
      <Icon name={revealed ? 'check' : 'cap'} />{revealed ? 'پاسخ' : 'خودت را امتحان کن'}
    </div>{/if}
  {#key card.id}<div class="flashcard-content">
      <h1>{card.question && revealed ? '' : card.title}</h1>
      <!-- svelte-ignore a11y_no_noninteractive_tabindex (Keyboard users need to focus and scroll the reading region.) -->
      <div class="flashcard-body" tabindex="0" role="region" aria-label="محتوای آموزشی">
        <LessonContent text={card.question && revealed ? card.answer ?? '' : card.body} />
      </div>
    </div>{/key}
  {#if card.question && !revealed}<button class="yellow reveal-button" onclick={onreveal}
      ><Icon name="eye" />نمایش پاسخ</button
    >{:else if card.question && revealed}<div class="rating-buttons">
      <button class="mint" onclick={() => onrate('good')}><Icon name="check" />بلدم</button><button
        class="blue"
        onclick={() => onrate('hard')}><Icon name="clock" />با مکث</button
      ><button class="coral" onclick={() => onrate('again')}><Icon name="repeat" />دوباره</button>
    </div>{:else}<div class="study-bottom">
      <div class="study-progress">
        <progress max={course.cards.length} value={course.position + 1}></progress><span
          >{fa(course.position + 1)} / {fa(course.cards.length)}</span
        >
        <div class="study-tools">
          <button class="cream" aria-label="کوچک‌تر کردن نوشته" title="کوچک‌تر کردن نوشته" onclick={ontextsize}>Aa</button><button
            class="cream"
            aria-label="یادداشت کارت"
            onclick={onnote}><Icon name="note" /></button
          >
        </div>
      </div>
      <div class="study-buttons">
        <button class="yellow next-card" onclick={onnext}
          ><Icon name="next" size={36} />{course.position === course.cards.length - 1
            ? 'پایان درس'
            : 'کارت بعدی'}</button
        ><button
          class="coral previous-card"
          disabled={course.position === 0}
          aria-label="کارت قبلی"
          onclick={onprevious}><Icon name="arrow" size={33} /></button
        >
      </div>
    </div>{/if}
  {#if card.question}<button
      class="question-note cream icon-button"
      aria-label="یادداشت کارت"
      onclick={onnote}><Icon name="note" size={22} /></button
    >{/if}
</div>
