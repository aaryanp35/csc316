<!-- Sketch 14: Country production vs carbon (bubbles)
Encodings: x = avg monthly production, y = monthly CO2e, colour = carbon-intensity tier (terciles), label = country.
Controls: year slider (lift year state to App or a shared state module).
-->
<script lang="ts">
  import ChartFrame from "../ui/ChartFrame.svelte";
  import type { CountryRow } from "../../data/types";

  interface Props { data: CountryRow[] }
  let { data }: Props = $props();
</script>

<ChartFrame label="TODO: describe the chart for screen readers" aspect={0.6}>
  {#snippet children({ width, height })}
    <!-- TODO: draw with d3 scales ({width} x {height} inner area; {data.length} rows) -->
    <text x="0" y="16">Sketch 14 placeholder</text>
  {/snippet}
</ChartFrame>
