import type { Decorator, Meta, StoryObj } from "@storybook/preact-vite";
import type { CallId } from "../../data/bingo";
import BingoHost from "./BingoHost";
import { STORY_IMAGES } from "./story-images";

// The caller as it looks on the projector. Each story starts from a set of
// calls (the last one is the current call); the buttons and keyboard work
// as on the real page. Use Storybook's viewport menu for other screen sizes.

const STORAGE_KEY = "cubes-bingo-host";

const withCalls: Decorator = (Story, { parameters }) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parameters.calls ?? []));
  } catch {}
  return <Story />;
};

const meta: Meta<typeof BingoHost> = {
  title: "Bingo/Caller",
  component: BingoHost,
  decorators: [withCalls],
  args: {
    images: STORY_IMAGES,
    idleImage: STORY_IMAGES["santa-cubie"] ?? "",
    backUrl: "#",
  },
};
export default meta;

type Story = StoryObj<typeof BingoHost>;

const EARLIER: CallId[] = ["sleigh", "mistletoe", "fireplace", "let-it-snow"];

export const BeforeTheFirstCall: Story = { parameters: { calls: [] } };

export const CubieCall: Story = { parameters: { calls: [...EARLIER, "reindeer-cubie"] } };

export const WordCall: Story = { parameters: { calls: [...EARLIER, "nutcracker"] } };

export const SongCall: Story = { parameters: { calls: [...EARLIER, "feliz-navidad"] } };

export const FilmCall: Story = { parameters: { calls: [...EARLIER, "home-alone"] } };

/** The longest name, which wraps to three lines. */
export const LongName: Story = { parameters: { calls: [...EARLIER, "gift-wrapped-cubie"] } };
