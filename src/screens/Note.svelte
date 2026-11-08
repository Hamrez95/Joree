<script lang="ts">
  import Icon from '../lib/Icon.svelte';
  export let title = '';
  export let text = '';
  export let source = '';
  export let onsave: (text: string, source: string) => void;
  export let oncancel: () => void;
  let draft = text;
  let link = source;
</script>

<div class="note-page page">
  <div class="note-heading">
    <h1>یادداشت کارت</h1>
    <button class="coral" aria-label="بازگشت" onclick={oncancel}><Icon name="arrow" /></button>
  </div>
  <div class="note-card-title blue">«{title}»</div>
  <label class="note-label"
    ><span><Icon name="note" />یادداشت من</span><textarea
      bind:value={draft}
      placeholder="یادداشت خودت را اینجا بنویس…"
    ></textarea></label
  ><label class="note-source"
    ><span><Icon name="link" />منبع / پیوند</span><input
      dir="ltr"
      type="url"
      placeholder="https://…"
      bind:value={link}
    /></label
  >
  <div class="note-actions">
    <button class="yellow" onclick={() => onsave(draft, link)}
      ><Icon name="check" />ذخیرهٔ یادداشت</button
    ><button class="coral" onclick={oncancel}><Icon name="close" />انصراف</button>
  </div>
</div>
