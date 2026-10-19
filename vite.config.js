import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

// base "./" keeps asset paths relative so the built site works from any static host or sub-path.
export default defineConfig({ base: "./", plugins: [svelte()] });
