<script lang="ts">
  export let type = 'cloud';
</script>

{#if type === 'cloud'}<svg class="pixel-cloud" viewBox="0 0 80 44" aria-hidden="true"
    ><path
      d="M4 36V25h11V15h15V5h21v10h12v10h12v11H4Z"
      fill="#fff7e6"
      stroke="#afd5ff"
      stroke-width="5"
      stroke-linejoin="miter"
    /></svg
  >
{:else}<img
    class="pixel-star"
    src="/assets/star.png"
    alt=""
    width="78"
    height="72"
    draggable="false"
  />{/if}
