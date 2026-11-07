<!-- Shared tooltip. Visuals set x/y (client coords) and visible on pointer events and pass the body as children,
     so labels from CSVs are rendered as text, never as HTML. Flips left/up near the viewport edge. -->
<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props { x: number; y: number; visible: boolean; children: Snippet }
  let { x, y, visible, children }: Props = $props();

  let tipWidth = $state(0);
  let tipHeight = $state(0);
  const left = $derived(x + 16 + tipWidth > window.innerWidth - 8 ? x - 16 - tipWidth : x + 16);
  const top = $derived(y + 16 + tipHeight > window.innerHeight - 8 ? y - 16 - tipHeight : y + 16);
</script>

<div class="tip" role="tooltip" bind:clientWidth={tipWidth} bind:clientHeight={tipHeight}
  style:left="{left}px" style:top="{top}px" style:opacity={visible ? 1 : 0}>
  {@render children()}
</div>

<style>
  .tip {
    position: fixed; pointer-events: none; z-index: 10; background: var(--tip-bg); color: var(--tip-ink);
    padding: 8px 10px; border-radius: 6px; font-size: 12px; line-height: 1.45; max-width: 260px;
    transition: opacity 120ms ease; font-variant-numeric: tabular-nums;
  }
</style>
