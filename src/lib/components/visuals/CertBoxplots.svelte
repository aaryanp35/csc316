<!-- Sketch 15: Certified vs not (box plots)
Encodings: small multiples for carbon, water, waste, price; box = IQR, whiskers = 1.5 IQR, dots = outliers.
Needs plain-language annotations per the process book.
-->
<script lang="ts">
  import ChartFrame from "../ui/ChartFrame.svelte";
  import type { BrandRow } from "../../data/types";

  interface Props { data: BrandRow[] }
  let { data }: Props = $props();
</script>

<ChartFrame label="TODO: describe the chart for screen readers" aspect={0.6}>
  {#snippet children({ width, height })}
    <!-- TODO: draw with d3 scales ({width} x {height} inner area; {data.length} rows) -->
    <text x="0" y="16">Sketch 15 placeholder</text>
  {/snippet}
</ChartFrame>
