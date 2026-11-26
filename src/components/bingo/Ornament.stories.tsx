import type { Meta, StoryObj } from "@storybook/preact-vite";
import { BINGO_LETTERS } from "../../data/bingo";
import "./bingo.css";
import { Ornament } from "./icons";

const meta: Meta<typeof Ornament> = {
  title: "Bingo/Ornament",
  component: Ornament,
};
export default meta;

/** The caller's letter ornaments, one colour per letter. */
export const AllLetters: StoryObj = {
  render: () => (
    <div style={{ display: "flex", gap: "3rem", padding: "3rem", background: "var(--paper)" }}>
      {BINGO_LETTERS.map((letter) => (
        <Ornament key={letter} letter={letter} class="bh-ball" />
      ))}
    </div>
  ),
};
