<!-- Sketch 11: Stacked bars by supply-chain stage
Encodings: x = material, y = kg CO2e or litres (metric toggle), stacked colour = stage (stageColors).
Controls: garment select, metric toggle. Tooltip: stage, value, share of total.
-->
<script lang="ts">
  import ChartFrame from "../ui/ChartFrame.svelte";
  import type { StageRow } from "../../data/types";

  interface Props { data: StageRow[] }
  let { data }: Props = $props();
</script>

<ChartFrame label="TODO: describe the chart for screen readers" aspect={0.6}>
  {#snippet children({ width, height })}
    <!-- TODO: draw with d3 scales ({width} x {height} inner area; {data.length} rows) -->
    <text x="0" y="16">Sketch 11 placeholder</text>
  {/snippet}
</ChartFrame>
