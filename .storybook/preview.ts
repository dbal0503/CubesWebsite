import type { Preview } from "@storybook/preact-vite";
import "../src/styles/global.css";

const preview: Preview = {
  parameters: {
    layout: "fullscreen",
  },
};

export default preview;
