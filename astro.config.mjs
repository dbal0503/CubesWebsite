// @ts-check
import preact from "@astrojs/preact";
import { defineConfig } from "astro/config";

// Served from dbal0503.github.io/CubesWebsite
export default defineConfig({
  site: "https://dbal0503.github.io",
  base: "/CubesWebsite",
  integrations: [preact()],
});
