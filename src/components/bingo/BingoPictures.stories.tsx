import type { Meta, StoryObj } from "@storybook/preact-vite";
import { BINGO_CALLS, type CallId } from "../../data/bingo";
import { STORY_IMAGES } from "./story-images";

// Every picture from src/assets/bingo/, built by scripts/make-bingo-art.mjs.
// After rebuilding the art, Storybook reloads with the new files.

const PICTURED = BINGO_CALLS.filter((c) => STORY_IMAGES[c.id as CallId]);

const tile = {
  display: "grid",
  justifyItems: "center",
  alignContent: "start",
  gap: "0.5rem",
  padding: "1rem",
  borderRadius: "0.75rem",
  background: "var(--paper)",
  boxShadow: "var(--shadow)",
  fontFamily: "var(--font-heading)",
  fontWeight: 700,
  color: "var(--maroon)",
  textAlign: "center",
} as const;

function Gallery({ kind }: { kind: "all" | "cubie" | "word" }) {
  const calls = PICTURED.filter((c) => kind === "all" || c.kind === kind);
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(13rem, 1fr))",
        gap: "1.25rem",
        padding: "1.5rem",
        background: "var(--cream)",
        minHeight: "100vh",
      }}
    >
      {calls.map((c) => (
        <figure key={c.id} style={{ ...tile, margin: 0 }}>
          <img
            src={STORY_IMAGES[c.id as CallId]}
            alt=""
            style={{ height: "12rem", width: "100%", objectFit: "contain" }}
          />
          <figcaption>
            {c.letter} · {c.label}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

function Single({ id, background }: { id: CallId; background: string }) {
  return (
    <div style={{ display: "grid", placeItems: "center", minHeight: "100vh", background }}>
      <img
        src={STORY_IMAGES[id]}
        alt=""
        style={{ height: "80vh", maxWidth: "90vw", objectFit: "contain" }}
      />
    </div>
  );
}

const meta: Meta = {
  title: "Bingo/Pictures",
};
export default meta;

export const All: StoryObj<typeof Gallery> = {
  render: (args) => <Gallery {...args} />,
  args: { kind: "all" },
  argTypes: { kind: { control: "inline-radio", options: ["all", "cubie", "word"] } },
};

export const Cubies: StoryObj<typeof Gallery> = { ...All, args: { kind: "cubie" } };

export const Words: StoryObj<typeof Gallery> = { ...All, args: { kind: "word" } };

/** One picture at projector size; pick it in the controls. */
export const OnePicture: StoryObj<typeof Single> = {
  render: (args) => <Single {...args} />,
  args: { id: "santa-cubie", background: "#fbf8ee" },
  argTypes: {
    id: { control: "select", options: PICTURED.map((c) => c.id) },
    background: { control: "color" },
  },
};
