# Visualization drafts

Updated designs for two storyboard frames that are not built into the site yet. Each draft is a standalone page drawn
with D3 from the same cleaned data as the site (`public/data/`). The PNGs are the screenshots to hand in. These pages
are not part of the website build.

| Frame | Draft | Screenshot | Design |
| --- | --- | --- | --- |
| 2. Making the fabric | `frame2-fabric.html` | `frame2-fabric.png` | Horizontal stacked bars (cotton, polyester, wool): kg CO₂e per kg of knitted T-shirt by factory stage; sewing is the thin red sliver, about 1%. Updates Sketch 11 (vertical stacks, placeholder stages) to Carbonfact stages with direct labels. |
| 7. Thrown out, still wearable | `frame7-wearable.html` | `frame7-wearable.png` | Unit chart: 100 garment icons in a bin, coloured by condition on a diverging scale (wearable blue, worn-out red, noticeable wear grey), best condition at the bottom; bracket marks the 69 still-wearable garments. |

To re-render: `npm run dev`, open `http://localhost:5173/drafts/<name>.html`, or capture with headless Edge/Chrome:
`msedge --headless=new --force-device-scale-factor=2 --virtual-time-budget=10000 --window-size=1104,760 --screenshot=out.png <url>`
