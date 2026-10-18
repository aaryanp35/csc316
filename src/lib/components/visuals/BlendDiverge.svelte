<!-- Sketch 3: Blends vs 100% cotton (diverging bars)
Encodings: two panels (CO2, water); bar length = % change vs 100% cotton, red = worse, green = better.
Tooltip: fabric, % change, n_garments.
-->
<script lang="ts">
  import ChartFrame from "../ui/ChartFrame.svelte";
  import type { BlendRow } from "../../data/types";

  interface Props { data: BlendRow[] }
  let { data }: Props = $props();
</script>

<ChartFrame label="TODO: describe the chart for screen readers" aspect={0.6}>
  {#snippet children({ width, height })}
    <!-- TODO: draw with d3 scales ({width} x {height} inner area; {data.length} rows) -->
    <text x="0" y="16">Sketch 3 placeholder</text>
  {/snippet}
</ChartFrame>
