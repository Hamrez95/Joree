<script lang="ts">
  export let kind = 'ai';
  export let small = false;
</script>

<img
  class="reference-cartridge {kind}"
  class:small
  src={`/assets/cartridge-${['ai', 'english', 'excel', 'brain'].includes(kind) ? kind : 'ai'}.png`}
  alt=""
  width="115"
  height="109"
  draggable="false"
/>
