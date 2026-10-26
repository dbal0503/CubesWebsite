import { useEffect, useLayoutEffect, useRef, useState } from "preact/hooks";
import {
  deserializeEvent,
  formatWhen,
  isPast,
  nextEvent,
  type SerializedEvent,
  type TimedEvent,
} from "../lib/events";
import { type MatchableFaq, matchQuestion } from "../lib/faq-match";
import "./QbChat.css";

export interface ChatFaq extends MatchableFaq {
  suggested: boolean;
  order: number;
  sources: { label: string; url: string }[];
  dynamic?: "nextEvent";
  /** The answer, rendered from Markdown at build time. */
  html: string;
}

interface Props {
  faqs: ChatFaq[];
  events: SerializedEvent[];
  eventsUrl: string;
  contactEmail: string | null;
  avatarSrc: string;
  launcherSrc: string;
}

type Message =
  | { from: "user"; text: string }
  | { from: "qb"; kind: "greeting" }
  | { from: "qb"; kind: "faq"; id: string }
  | { from: "qb"; kind: "event"; id: string }
  | { from: "qb"; kind: "choose"; ids: string[] }
  | { from: "qb"; kind: "none" };

interface Saved {
  open: boolean;
  messages: Message[];
}

const STORAGE_KEY = "qb-chat";
const GREETING: Message[] = [{ from: "qb", kind: "greeting" }];

function load(): Saved | undefined {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Saved) : undefined;
  } catch {
    return undefined;
  }
}

function save(state: Saved) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Private mode or storage disabled: the chat still works, it just won't persist.
  }
}

export default function QbChat({
  faqs,
  events,
  eventsUrl,
  contactEmail,
  avatarSrc,
  launcherSrc,
}: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(GREETING);
  const [draft, setDraft] = useState("");
  const launcher = useRef<HTMLButtonElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const log = useRef<HTMLDivElement>(null);
  const restored = useRef(false);
  const returnFocus = useRef(false);

  const timed: TimedEvent[] = events.map(deserializeEvent);
  const byId = new Map(faqs.map((faq) => [faq.id, faq]));
  const suggestions = faqs.filter((f) => f.suggested).sort((a, b) => a.order - b.order);

  // Restore the conversation when moving between pages.
  useEffect(() => {
    const saved = load();
    if (saved) {
      setOpen(saved.open);
      setMessages(saved.messages.length > 0 ? saved.messages : GREETING);
    }
    restored.current = true;
  }, []);

  // Save as part of the render that changed the conversation, so a click on a
  // link right after asking can't outrun it. Skip until restored, or the first
  // render would overwrite the saved chat with the greeting.
  useLayoutEffect(() => {
    if (restored.current) save({ open, messages });
  }, [open, messages]);

  // Focus the launcher once the panel is gone: on phones the open panel hides it.
  useLayoutEffect(() => {
    if (!open && returnFocus.current) {
      returnFocus.current = false;
      launcher.current?.focus();
    }
  }, [open]);

  // Layout effect: listen for Escape from the moment the panel exists.
  useLayoutEffect(() => {
    if (!open) return;
    input.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    log.current?.scrollTo({ top: log.current.scrollHeight });
  }, [messages, open]);

  const close = () => {
    returnFocus.current = true;
    setOpen(false);
  };

  const reply = (userText: string, answer: Message) =>
    setMessages((current) => [...current, { from: "user", text: userText }, answer]);

  const ask = (text: string) => {
    const question = text.trim();
    if (!question) return;
    const result = matchQuestion(question, faqs, upcomingFirst(timed));
    const answer: Message =
      result.kind === "answer"
        ? { from: "qb", kind: "faq", id: result.id }
        : result.kind === "event"
          ? { from: "qb", kind: "event", id: result.id }
          : result.kind === "choose"
            ? { from: "qb", kind: "choose", ids: result.ids }
            : { from: "qb", kind: "none" };
    reply(question, answer);
    setDraft("");
  };

  const pickFaq = (id: string) => {
    const faq = byId.get(id);
    if (faq) reply(faq.question, { from: "qb", kind: "faq", id });
  };

  const lastAnswered = [...messages].reverse().find((m) => m.from === "qb" && m.kind === "faq");
  const chips = suggestions
    .filter((f) => !(lastAnswered && "id" in lastAnswered && lastAnswered.id === f.id))
    .slice(0, 4);

  return (
    <div class="qb-chat">
      {open && (
        <section id="qb-chat-panel" class="qb-panel" aria-label="Chat with QB">
          <header class="qb-head">
            <img src={avatarSrc} alt="" width={40} height={40} />
            <div>
              <p class="qb-name">QB</p>
              <p class="qb-role">Cubesville's guide · not a real person</p>
            </div>
            <button type="button" class="qb-close" aria-label="Close chat" onClick={close}>
              ×
            </button>
          </header>

          <div class="qb-log" ref={log} role="log" aria-live="polite">
            {messages.map((message, i) =>
              message.from === "user" ? (
                <p key={i} class="qb-msg qb-user">
                  <span class="visually-hidden">You: </span>
                  {message.text}
                </p>
              ) : (
                <div key={i} class="qb-msg qb-bot">
                  <span class="visually-hidden">QB: </span>
                  <Answer
                    message={message}
                    byId={byId}
                    events={timed}
                    eventsUrl={eventsUrl}
                    contactEmail={contactEmail}
                    onPick={pickFaq}
                  />
                </div>
              ),
            )}
          </div>

          {chips.length > 0 && (
            <div class="qb-chips">
              {chips.map((faq) => (
                <button key={faq.id} type="button" class="qb-chip" onClick={() => pickFaq(faq.id)}>
                  {faq.question}
                </button>
              ))}
            </div>
          )}

          <form
            class="qb-form"
            onSubmit={(e) => {
              e.preventDefault();
              ask(draft);
            }}
          >
            <label class="visually-hidden" for="qb-input">
              Ask QB a question
            </label>
            <input
              id="qb-input"
              ref={input}
              value={draft}
              onInput={(e) => setDraft((e.target as HTMLInputElement).value)}
              placeholder="Ask QB a question…"
              autocomplete="off"
              maxLength={200}
            />
            <button type="submit" class="qb-send" aria-label="Send">
              ➤
            </button>
          </form>
        </section>
      )}

      <button
        ref={launcher}
        type="button"
        class="qb-launcher"
        aria-expanded={open}
        aria-controls="qb-chat-panel"
        onClick={() => (open ? close() : setOpen(true))}
      >
        <img src={launcherSrc} alt="" width={56} height={56} />
        <span class="visually-hidden">{open ? "Close chat with QB" : "Chat with QB"}</span>
      </button>
    </div>
  );
}

function upcomingFirst(events: TimedEvent[]): TimedEvent[] {
  const now = new Date();
  return [...events.filter((e) => !isPast(e, now)), ...events.filter((e) => isPast(e, now))];
}

interface AnswerProps {
  message: Exclude<Message, { from: "user" }>;
  byId: Map<string, ChatFaq>;
  events: TimedEvent[];
  eventsUrl: string;
  contactEmail: string | null;
  onPick: (id: string) => void;
}

function Answer({ message, byId, events, eventsUrl, contactEmail, onPick }: AnswerProps) {
  switch (message.kind) {
    case "greeting":
      return (
        <p>
          Hi, I'm QB, Cubesville's guide! Ask me about CUBES, our events, or building engineering at
          Concordia.
        </p>
      );

    case "faq": {
      const faq = byId.get(message.id);
      if (!faq) return <NoAnswer contactEmail={contactEmail} />;
      if (faq.dynamic === "nextEvent") {
        const next = nextEvent(events, new Date());
        if (next) return <EventAnswer event={next} prefix="Next up:" eventsUrl={eventsUrl} />;
      }
      return (
        <>
          {/* Safe: our own FAQ Markdown, rendered to HTML at build time. */}
          <div class="qb-answer" dangerouslySetInnerHTML={{ __html: faq.html }} />
          {faq.sources.length > 0 && (
            <p class="qb-sources">
              Source:{" "}
              {faq.sources.map((s, i) => (
                <span key={s.url}>
                  {i > 0 && " · "}
                  <a href={s.url} target="_blank" rel="noopener">
                    {s.label}
                  </a>
                </span>
              ))}
            </p>
          )}
        </>
      );
    }

    case "event": {
      const event = events.find((e) => e.id === message.id);
      if (!event) return <NoAnswer contactEmail={contactEmail} />;
      return <EventAnswer event={event} eventsUrl={eventsUrl} />;
    }

    case "choose":
      return (
        <>
          <p>Did you mean:</p>
          <div class="qb-options">
            {message.ids.map((id) => {
              const faq = byId.get(id);
              return (
                faq && (
                  <button key={id} type="button" class="qb-chip" onClick={() => onPick(id)}>
                    {faq.question}
                  </button>
                )
              );
            })}
          </div>
        </>
      );

    case "none":
      return <NoAnswer contactEmail={contactEmail} />;
  }
}

function EventAnswer({
  event,
  prefix,
  eventsUrl,
}: {
  event: TimedEvent;
  prefix?: string;
  eventsUrl: string;
}) {
  const past = isPast(event, new Date());
  return (
    <p>
      {prefix && `${prefix} `}
      <strong>{event.title}</strong>
      {past ? " already happened" : ""} ({formatWhen(event)})
      {event.tentative && !past ? ", still tentative" : ""}. <a href={eventsUrl}>See all events</a>
    </p>
  );
}

function NoAnswer({ contactEmail }: { contactEmail: string | null }) {
  return (
    <p>
      I don't know that one yet. Try one of the questions below
      {contactEmail && (
        <>
          , or email <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
        </>
      )}
      .
    </p>
  );
}
