// @ts-check
import preact from "@astrojs/preact";
import { defineConfig, fontProviders } from "astro/config";

// Served from dbal0503.github.io/CubesWebsite
export default defineConfig({
  site: "https://dbal0503.github.io",
  base: "/CubesWebsite",
  integrations: [preact()],
  // Downloaded at build time and self-hosted, so visitors never hit Google.
  fonts: [
    {
      provider: fontProviders.fontsource(),
      name: "Montserrat",
      cssVariable: "--font-heading",
      weights: ["600", "700"],
      subsets: ["latin"],
      fallbacks: ["system-ui", "sans-serif"],
    },
    {
      provider: fontProviders.fontsource(),
      name: "Inter",
      cssVariable: "--font-body",
      weights: ["400", "500", "600"],
      subsets: ["latin"],
      fallbacks: ["system-ui", "sans-serif"],
    },
  ],
});
