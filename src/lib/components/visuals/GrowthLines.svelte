<!-- Sketch 2: Indexed growth since 2000 (lines)
Encodings: x = year, y = index (2000 = 100); lines: production, water, wears per garment; dashed baseline at 100.
Optional inset: emissions_index trend.
-->
<script lang="ts">
  import ChartFrame from "../ui/ChartFrame.svelte";
  import type { TrendRow } from "../../data/types";

  interface Props { data: TrendRow[] }
  let { data }: Props = $props();
</script>

<ChartFrame label="TODO: describe the chart for screen readers" aspect={0.6}>
  {#snippet children({ width, height })}
    <!-- TODO: draw with d3 scales ({width} x {height} inner area; {data.length} rows) -->
    <text x="0" y="16">Sketch 2 placeholder</text>
  {/snippet}
</ChartFrame>
