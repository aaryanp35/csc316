<!-- One storyboard frame: numbered kicker, title (the frame's question or claim), then the chart or placeholder. -->
<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props { title: string; frame: number; id?: string; children: Snippet }
  let { title, frame, id, children }: Props = $props();
</script>

<article {id} data-frame={frame}>
  <p class="kicker">Frame {frame}</p>
  <h3>{title}</h3>
  {@render children()}
</article>

<style>
  article { background: var(--card); border: 1px solid var(--rule); border-radius: 12px; padding: 24px; margin-bottom: 28px; scroll-margin-top: 72px; }
  @media (max-width: 520px) { article { padding: 16px; } }
  .kicker { margin: 0 0 2px; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--faint); }
  h3 { margin: 0 0 12px; font-size: 1.2rem; }
</style>
