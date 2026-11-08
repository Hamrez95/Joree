<script lang="ts">
  import Heading from '../lib/Heading.svelte';
  import Icon from '../lib/Icon.svelte';
  import Decor from '../lib/Decor.svelte';
  import { fa, type SavedState } from '../lib/lessons';
  export let state: SavedState;
  let period = 'week';
  let rewards = false;
  $: total = state.courses.reduce((sum, course) => sum + course.seen.length, 0);
  $: good = Object.values(state.reviews).filter((review) => review.rating === 'good').length;
  $: completed = state.courses.filter(
    (course) => course.seen.length === course.cards.length,
  ).length;
  $: milestones = [
    { title: 'درس اول', description: 'مطالعهٔ اولین درس', icon: 'book', achieved: total > 0 },
    {
      title: '۵ روز مطالعه',
      description: 'مطالعه در ۵ روز مختلف',
      icon: 'calendar',
      achieved: state.studyDays.length >= 5,
    },
    {
      title: 'تکمیل یک دوره',
      description: 'مطالعهٔ همهٔ فصل‌ها',
      icon: 'book',
      achieved: completed > 0,
    },
    { title: '۳ فصل', description: 'تکمیل ۳ فصل', icon: 'star', achieved: completed >= 3 },
    {
      title: '۵۰ کارت',
      description: 'مطالعهٔ مجموع ۵۰ کارت',
      icon: 'cards',
      achieved: total >= 50,
    },
    { title: 'مرور منظم', description: '۳ پاسخ بلدم در مرور', icon: 'trophy', achieved: good >= 3 },
  ];
  $: dayCount = period === 'week' ? 7 : 30;
  $: days = Array.from({ length: dayCount }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (dayCount - 1 - index));
    return {
      label: new Intl.DateTimeFormat('fa', { weekday: 'narrow' }).format(date),
      active: state.studyDays.includes(date.toLocaleDateString('en-CA')),
    };
  });
</script>

<div class="progress-page page">
  <Heading
    title={rewards ? 'یادگاری‌های مسیر' : 'مسیر یادگیری'}
    subtitle={rewards
      ? 'نشانه‌هایی از گام‌های یادگیری شما در جرعه'
      : 'نگاهی به روند مطالعه و پیشرفت در دوره‌های شما'}
  />{#if rewards}<div class="reward-grid">
      {#each milestones as milestone}<article class:earned={milestone.achieved} class="reward-card">
          <div class="medal"><Icon name={milestone.icon} size={49} /></div>
          <h2>{milestone.title}</h2>
          <p>{milestone.description}</p>
          <small>{milestone.achieved ? 'به دست آوردی' : 'هنوز کامل نشده'}</small>
        </article>{/each}
    </div>
    <button class="blue rewards-back" onclick={() => (rewards = false)}
      >بازگشت به مسیر یادگیری<Icon name="arrow" /></button
    >{:else}<div class="segmented period-switch">
      <button class:yellow={period === 'week'} onclick={() => (period = 'week')}
        >{#if period === 'week'}<Icon name="check" size={23} />{/if}هفته</button
      ><button class:yellow={period === 'month'} onclick={() => (period = 'month')}>ماه</button>
    </div>
    <div class="stats-grid">
      <article>
        <Icon name="cards" size={42} /><b>{fa(total)}</b><span>کارت مطالعه‌شده</span>
      </article>
      <article><Icon name="check" size={42} /><b>{fa(good)}</b><span>پاسخ بلدم</span></article>
      <article>
        <Icon name="calendar" size={42} /><b>{fa(state.studyDays.length)}</b><span>روز یادگیری</span
        >
      </article>
    </div>
    <div class="progress-panels">
      <section class="activity-panel">
        <h2>فعالیت روزهای {period === 'week' ? 'هفته' : 'ماه'}</h2>
        <div class="activity-chart" class:month={period === 'month'}>
          {#each days as day}<div>
              <i class:studied={day.active} style:height={day.active ? '105px' : '5px'}></i><span
                >{day.label}</span
              >
            </div>{/each}
        </div>
      </section>
      <section class="course-progress-panel">
        <h2>پیشرفت دوره‌ها</h2>
        {#each state.courses.slice(0, 3) as course}<article>
            <div>
              <Icon
                name={course.kind === 'ai' ? 'chip' : course.kind === 'excel' ? 'grid' : 'book'}
                size={28}
              /><strong
                >{course.kind === 'ai'
                  ? 'AI'
                  : course.kind === 'english'
                    ? 'English'
                    : course.title}</strong
              ><span>{fa(course.seen.length)} از {fa(course.cards.length)}</span>
            </div>
            <progress max={course.cards.length} value={course.seen.length}></progress>
          </article>{/each}
      </section>
    </div>
    <button class="progress-tip" onclick={() => (rewards = true)}
      ><Decor type="star" /><span
        >«کارت مطالعه‌شده» یعنی کارت را دیده‌ای؛<br />«پاسخ بلدم» ارزیابی شما از یادآوری آن است.</span
      ><Icon name="info" size={23} /><Decor /></button
    >{/if}
</div>
