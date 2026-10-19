<!--
  Shared responsive SVG wrapper. Measures its container, applies margins, and hands the inner
  width/height to the visual through the `children` snippet, so each visual only draws.
  Use D3 for scales/axes/shapes and Svelte for the DOM (or bind a <g> and let D3 draw into it).
-->
<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    aspect?: number;
    margin?: { top: number; right: number; bottom: number; left: number };
    label: string;
    children: Snippet<[{ width: number; height: number }]>;
  }

  let { aspect = 0.6, margin = { top: 24, right: 24, bottom: 48, left: 64 }, label, children }: Props = $props();

  let clientWidth = $state(640);
  const outerWidth = $derived(Math.max(280, clientWidth));
  const outerHeight = $derived(Math.round(outerWidth * aspect));
  const width = $derived(outerWidth - margin.left - margin.right);
  const height = $derived(outerHeight - margin.top - margin.bottom);
</script>

<div class="frame" bind:clientWidth>
  <svg viewBox="0 0 {outerWidth} {outerHeight}" role="img" aria-label={label}>
    <g transform="translate({margin.left},{margin.top})">
      {@render children({ width, height })}
    </g>
  </svg>
</div>

<style>
  .frame { width: 100%; }
  svg { width: 100%; height: auto; display: block; }
</style>
