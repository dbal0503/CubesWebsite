import type { StorybookConfig } from "@storybook/preact-vite";

// Storybook is only for checking designs locally (`pnpm storybook`); it isn't
// part of the site build.
const config: StorybookConfig = {
  framework: "@storybook/preact-vite",
  stories: ["../src/**/*.stories.tsx"],
};

export default config;
