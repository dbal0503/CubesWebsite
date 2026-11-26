import type { Meta, StoryObj } from "@storybook/preact-vite";
import { BINGO_LINES, getCard } from "../../lib/bingo";
import BingoGrid from "./BingoGrid";
import "./bingo.css";
import { STORY_IMAGES } from "./story-images";

// The card the caller shows when checking a winner's number.

const meta: Meta<typeof BingoGrid> = {
  title: "Bingo/Card check",
  component: BingoGrid,
  decorators: [
    (Story) => (
      <div style={{ maxWidth: "34rem", margin: "2rem auto", padding: "1rem" }}>
        <Story />
      </div>
    ),
  ],
  args: { squares: getCard(1) ?? [], cubies: STORY_IMAGES, winning: new Set() },
};
export default meta;

type Story = StoryObj<typeof BingoGrid>;

export const NothingCalled: Story = { args: { called: () => false } };

export const SomeCalled: Story = {
  args: { called: (sq) => [0, 3, 6, 12, 14, 18, 21].includes(sq) },
};

const row1 = BINGO_LINES[0]?.squares ?? [];

export const Bingo: Story = {
  args: { called: (sq) => row1.includes(sq) || sq === 12, winning: new Set(row1) },
};
