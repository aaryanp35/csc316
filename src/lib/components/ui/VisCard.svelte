<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props { title: string; sketch: number; controls?: Snippet; children: Snippet }
  let { title, sketch, controls, children }: Props = $props();
</script>

<article data-sketch={sketch}>
  <h3>{title}</h3>
  {#if controls}<div class="controls">{@render controls()}</div>{/if}
  {@render children()}
</article>

<style>
  article { background: var(--card); border: 1px solid var(--rule); border-radius: 10px; padding: 20px; margin-bottom: 24px; }
  h3 { margin: 0 0 12px; font-size: 1.1rem; }
  .controls { display: flex; flex-wrap: wrap; gap: 16px; margin-bottom: 12px; font-size: 0.9rem; color: var(--muted); }
</style>
