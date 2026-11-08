<script lang="ts">
  import Heading from '../lib/Heading.svelte';
  import Icon from '../lib/Icon.svelte';
  import { type Preferences } from '../lib/lessons';
  export let preferences: Preferences;
  export let onchange: (preferences: Preferences) => void;
  export let onbackup: () => void;
  export let onrestore: () => void;
  export let onpin: () => void;
  export let ontheme: (open: boolean) => void;
  let tab = 'display';
  let themePage = false;
  function update(values: Partial<Preferences>) {
    onchange({ ...preferences, ...values });
  }
</script>

<div class="settings-page page" class:theme-page={themePage}>
  <Heading title={themePage ? 'پوسته‌ها' : 'تنظیمات'} />{#if themePage}<div class="theme-options">
      <button class="theme-card selected" aria-pressed="true"
        ><span class="theme-check yellow"><Icon name="check" /></span>
        <h2>کنسول جیبی</h2>
        <div class="mini-console">
          <div class="mini-console-logo">جرعه</div>
          <div></div>
          <i></i><i></i><i></i>
        </div></button
      >
      <article class="theme-card garden">
        <h2>باغچه</h2>
        <svg viewBox="0 0 260 120" aria-hidden="true"
          ><path d="M10 115Q130 75 250 115" fill="#9bb984" /><path
            d="M40 100 23 20M220 100l15-80"
            stroke="#7f9b64"
            stroke-width="5"
          /><g fill="#a9bb89"
            ><ellipse cx="25" cy="40" rx="9" ry="17" transform="rotate(-30 25 40)" /><ellipse
              cx="45"
              cy="60"
              rx="9"
              ry="17"
              transform="rotate(30 45 60)"
            /><ellipse cx="232" cy="42" rx="9" ry="17" transform="rotate(30 232 42)" /><ellipse
              cx="212"
              cy="66"
              rx="9"
              ry="17"
              transform="rotate(-30 212 66)"
            /></g
          ><path
            d="m90 78 80 8m-83 5 80 8M96 72l-5 37m75-29-4 34"
            stroke="#b48e68"
            stroke-width="10"
          /></svg
        ><span class="coming-soon">به‌زودی</span>
      </article>
    </div>
    <div class="console-colors">
      <strong>رنگ کنسول:</strong>
      <div>
        {#each ['blue', 'lavender'] as color}<button
            class="color-swatch {color}"
            class:selected={preferences.color === color}
            aria-label={color === 'blue' ? 'آبی' : 'بنفش'}
            aria-pressed={preferences.color === color}
            onclick={() => update({ color })}
          ></button>{/each}
      </div>
    </div>
    <button class="cream settings-back" onclick={() => {themePage = false;ontheme(false);}}
      ><Icon name="arrow" />بازگشت به تنظیمات</button
    >{:else}<div class="settings-layout">
      <aside class="settings-tabs">
        {#each [{ id: 'display', icon: 'grid', label: 'نمایش' }, { id: 'motion', icon: 'sound', label: 'صدا و حرکت' }, { id: 'reminder', icon: 'bell', label: 'یادآوری' }, { id: 'backup', icon: 'cloud', label: 'پشتیبان‌گیری' }] as item}<button
            class:yellow={tab === item.id}
            onclick={() => {
              tab = item.id;
              document
                .getElementById('setting-' + item.id)
                ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }}><Icon name={item.icon} size={26} />{item.label}</button
          >{/each}
      </aside>
      <div class="settings-content">
        <section id="setting-display">
          <h2>اندازهٔ نوشته</h2>
          <div class="radio-options">
            {#each ['معمولی', 'بزرگ', 'خیلی بزرگ'] as label, index}<button
                class:yellow={preferences.textSize === index}
                aria-pressed={preferences.textSize === index}
                onclick={() => update({ textSize: index })}
                ><i class:checked={preferences.textSize === index}></i>{label}</button
              >{/each}
          </div>
          <p class="text-preview blue" style:font-size={`${21 + preferences.textSize * 2}px`}>
            این یک نمونه متن برای مشاهدهٔ اندازه<br />و خوانایی نوشته در جرعه است.
          </p>
        </section>
        <section id="setting-motion">
          <h2>حرکت‌ها</h2>
          <div class="radio-options">
            {#each [{ id: 'full', label: 'کامل' }, { id: 'reduced', label: 'کم' }, { id: 'off', label: 'خاموش' }] as motion}<button
                class:yellow={preferences.motion === motion.id}
                aria-pressed={preferences.motion === motion.id}
                onclick={() => update({ motion: motion.id })}
                ><i class:checked={preferences.motion === motion.id}></i>{motion.label}</button
              >{/each}
          </div>
        </section>
        <section class="setting-row">
          <div><h2><Icon name="sound" size={23} />صدای دکمه‌ها</h2></div>
          <button
            class="switch-label"
            role="switch"
            aria-checked={preferences.sound}
            onclick={() => update({ sound: !preferences.sound })}
            ><span>{preferences.sound ? 'روشن' : 'خاموش'}</span><i
              class="toggle"
              class:on={preferences.sound}
            ></i></button
          >
        </section>
        <section class="setting-row">
          <div>
            <h2><Icon name="pin" size={22} />همیشه روی پنجره‌ها</h2>
            <p>جرعه همیشه بالای سایر پنجره‌ها نمایش داده شود.</p>
          </div>
          <button
            class="switch-label"
            role="switch"
            aria-checked={preferences.pinned}
            onclick={onpin}
            ><span>{preferences.pinned ? 'روشن' : 'خاموش'}</span><i
              class="toggle"
              class:on={preferences.pinned}
            ></i></button
          >
        </section>
        <section id="setting-reminder" class="reminder-setting">
          <div class="setting-row">
            <h2><Icon name="bell" size={24} />یادآوری مطالعه</h2>
            <button
              class="switch-label"
              role="switch"
              aria-checked={preferences.reminder}
              onclick={() => update({ reminder: !preferences.reminder })}
              ><span>{preferences.reminder ? 'روشن' : 'خاموش'}</span><i
                class="toggle"
                class:on={preferences.reminder}
              ></i></button
            >
          </div>
          <label
            >ساعت یادآوری (در زمان بازبودن برنامه):<input
              type="time"
              value={preferences.reminderTime}
              disabled={!preferences.reminder}
              onchange={(event) => update({ reminderTime: event.currentTarget.value })}
            /></label
          >
        </section>
        <section id="setting-backup" class="backup-setting">
          <div>
            <h2><Icon name="cloud" size={25} />پشتیبان‌گیری</h2>
            <p>از داده‌های مطالعهٔ خود نسخهٔ پشتیبان بگیرید<br />یا نسخهٔ قبلی را بازیابی کنید.</p>
          </div>
          <div class="backup-buttons">
            <button class="yellow" onclick={onbackup}
              ><Icon name="download" size={22} />گرفتن نسخهٔ پشتیبان</button
            ><button class="coral" onclick={onrestore}
              ><Icon name="repeat" size={23} />بازیابی</button
            >
          </div>
        </section>
        <button class="blue theme-link" onclick={() => {themePage = true;ontheme(true);}}
          >پوسته‌ها و رنگ کنسول<Icon name="next" size={22} /></button
        >
      </div>
    </div>{/if}
</div>
