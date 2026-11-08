<script lang="ts">
  import { onMount } from 'svelte';
  import Icon from './Icon.svelte';
  export let title = '';
  export let message = '';
  export let confirmLabel = 'تأیید';
  export let destructive = false;
  export let onconfirm: () => void;
  export let oncancel: () => void;
  let element: HTMLDialogElement;
  onMount(() => {
    element.showModal();
    return () => element.close();
  });
</script>

<dialog
  bind:this={element}
  oncancel={(event) => {
    event.preventDefault();
    oncancel();
  }}
>
  <div class="dialog-content">
    <button class="dialog-close cream icon-button" aria-label="بستن" onclick={oncancel}
      ><Icon name="close" /></button
    >
    <h2>{title}</h2>
    <p>{message}</p>
    <div class="dialog-actions">
      <button class:coral={destructive} class:yellow={!destructive} onclick={onconfirm}
        >{confirmLabel}</button
      ><button class="cream" onclick={oncancel}>انصراف</button>
    </div>
  </div>
</dialog>
