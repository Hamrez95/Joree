<script lang="ts">
  import { lessonBlocks } from './lessonMarkdown';
  import LessonInline from './LessonInline.svelte';
  export let text: string;
</script>

<div class="lesson-content" dir="rtl">
  {#each lessonBlocks(text) as block}
    {#if block.kind === 'code'}<pre dir="ltr"><code>{block.text}</code></pre>
    {:else if block.kind === 'heading'}<h2><LessonInline text={block.text} /></h2>
    {:else if block.kind === 'list'}<ul>{#each block.items ?? [] as item}<li><LessonInline text={item} /></li>{/each}</ul>
    {:else if block.kind === 'image'}<figure><img src={block.src} alt={block.text} loading="lazy" /><figcaption>{block.text}</figcaption></figure>
    {:else}<p><LessonInline text={block.text} /></p>{/if}
  {/each}
</div>
