<script lang="ts">
  import { inlineParts } from './lessonMarkdown';
  export let text: string;
</script>

{#each inlineParts(text) as part}{#if part.kind === 'link'}<a href={part.href} target={part.download ? undefined : '_blank'} rel="noopener noreferrer" download={part.download ? part.href?.split('/').at(-1) : undefined}>{part.text}</a>{:else if part.kind === 'code'}<code dir="auto">{part.text}</code>{:else if part.kind === 'strong'}<strong>{part.text}</strong>{:else}{part.text}{/if}{/each}
