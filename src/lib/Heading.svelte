<script lang="ts">
  import Decor from './Decor.svelte';
  export let title = '';
  export let subtitle = '';
</script>

<div class="page-heading">
  <Decor />
  <h1><span class="rays left"></span>{title}<span class="rays right"></span></h1>
  <Decor />{#if subtitle}<p>{subtitle}</p>{/if}
</div>
