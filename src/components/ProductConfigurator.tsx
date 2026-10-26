import { useEffect, useRef, useState } from "preact/hooks";
import {
  formatPrice,
  initialSelection,
  missingGroups,
  type Selection,
  type ShopProduct,
  selectionToParams,
  totalPrice,
  wouldBeSoldOut,
  zeffyOrder,
} from "../lib/shop";
import "./ProductConfigurator.css";

interface Props {
  product: ShopProduct;
  embedUrl: string;
}

export default function ProductConfigurator({ product, embedUrl }: Props) {
  const [selection, setSelection] = useState<Selection>(() => initialSelection(product));
  const [showMissing, setShowMissing] = useState(false);
  const [checkoutOpened, setCheckoutOpened] = useState(false);
  const [copied, setCopied] = useState(false);
  // Until hydrated, a click would submit the form natively and reload the page.
  const [hydrated, setHydrated] = useState(false);
  const form = useRef<HTMLFormElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);

  // The server render can't see the URL, and visitors can tick radios before
  // the component hydrates. On load, adopt both: a shared link's selection,
  // overridden by any choice ticked away from the server-rendered defaults.
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const defaults = initialSelection(product);
    const checked = form.current?.querySelectorAll<HTMLInputElement>("input[type=radio]:checked");
    for (const input of checked ?? []) {
      if (defaults[input.name] !== input.value) params.set(input.name, input.value);
    }
    setSelection(initialSelection(product, params));
    setHydrated(true);
  }, [product]);

  useEffect(() => {
    const query = selectionToParams(selection).toString();
    history.replaceState(null, "", query ? `?${query}` : location.pathname);
  }, [selection]);

  const missing = missingGroups(product, selection);
  const total = totalPrice(product, selection);

  const choose = (group: string, label: string) => {
    setSelection((current) => ({ ...current, [group]: label }));
    setCopied(false);
  };

  const openCheckout = (event: Event) => {
    event.preventDefault();
    if (missing.length > 0) {
      setShowMissing(true);
      document.getElementById(groupId(missing[0] ?? ""))?.focus();
      return;
    }
    setCheckoutOpened(true);
    dialog.current?.showModal();
  };

  const order = missing.length === 0 ? zeffyOrder(product, selection) : undefined;
  const summaryText = order
    ? [
        `${order.item}: ${order.options.map((o) => `${o.name} ${o.label}`).join(", ")}`,
        ...order.addOns.map((addOn) => `${addOn} x1`),
        `Expected total: ${formatPrice(order.total)}`,
      ].join("\n")
    : "";

  const copySummary = async () => {
    await navigator.clipboard.writeText(summaryText);
    setCopied(true);
  };

  return (
    <form ref={form} class="cfg" onSubmit={openCheckout} noValidate>
      <p class="cfg-price" aria-live="polite">
        {formatPrice(total)}
        <span class="visually-hidden"> total</span>
      </p>

      {product.optionGroups.map((group) => {
        const isMissing = showMissing && missing.includes(group.name);
        return (
          <fieldset
            key={group.name}
            id={groupId(group.name)}
            tabIndex={-1}
            class="cfg-group"
            aria-describedby={isMissing ? `${groupId(group.name)}-error` : undefined}
          >
            <legend>
              {group.name}
              {selection[group.name] && <span class="cfg-picked">: {selection[group.name]}</span>}
            </legend>
            <div class="cfg-choices">
              {group.choices.map((choice) => {
                const soldOut = wouldBeSoldOut(product, selection, group.name, choice.label);
                return (
                  <label
                    key={choice.label}
                    class="cfg-choice"
                    data-swatch={choice.swatch ? "" : undefined}
                  >
                    <input
                      type="radio"
                      name={group.name}
                      value={choice.label}
                      checked={selection[group.name] === choice.label}
                      disabled={soldOut}
                      onChange={() => choose(group.name, choice.label)}
                    />
                    <span class="cfg-pill">
                      {choice.swatch && (
                        <span class="cfg-swatch" style={{ background: choice.swatch }} />
                      )}
                      <span class={choice.swatch ? "visually-hidden" : undefined}>
                        {choice.label}
                      </span>
                      {choice.priceDelta > 0 && (
                        <span class="cfg-delta">+{formatPrice(choice.priceDelta)}</span>
                      )}
                      {soldOut && <span class="cfg-delta">sold out</span>}
                    </span>
                  </label>
                );
              })}
            </div>
            {isMissing && (
              <p class="cfg-error" id={`${groupId(group.name)}-error`}>
                Choose a {group.name.toLowerCase()}.
              </p>
            )}
          </fieldset>
        );
      })}

      <button class="button button-primary cfg-checkout" type="submit" disabled={!hydrated}>
        Checkout · {formatPrice(total)}
      </button>
      <p class="cfg-note">Secure payment through Zeffy, the platform CUBES uses for merch.</p>

      <dialog ref={dialog} class="cfg-drawer" aria-labelledby="cfg-drawer-title">
        <header class="cfg-drawer-head">
          <h2 id="cfg-drawer-title">Checkout</h2>
          <button
            type="button"
            class="cfg-close"
            aria-label="Close checkout"
            onClick={() => dialog.current?.close()}
          >
            ×
          </button>
        </header>
        {order && (
          <section class="cfg-summary" aria-label="What to select on Zeffy">
            <p>In the Zeffy form below, add:</p>
            <ol>
              <li>
                <strong>{order.item}</strong>
                <span>{order.options.map((o) => `${o.name}: ${o.label}`).join(" · ")}</span>
              </li>
              {order.addOns.map((addOn) => (
                <li key={addOn}>
                  <strong>{addOn}</strong> × 1<span>Add the details in Zeffy's notes field.</span>
                </li>
              ))}
            </ol>
            <p class="cfg-total">
              Expected total: <strong>{formatPrice(order.total)}</strong>
            </p>
            <button type="button" class="button button-secondary" onClick={copySummary}>
              {copied ? "Copied" : "Copy summary"}
            </button>
          </section>
        )}
        {checkoutOpened && (
          <iframe class="cfg-frame" src={embedUrl} title="Zeffy checkout" allow="payment" />
        )}
        <p class="cfg-fallback">
          Form not loading?{" "}
          <a href={product.zeffy.formUrl} target="_blank" rel="noopener">
            Open checkout in a new tab
          </a>
        </p>
      </dialog>
    </form>
  );
}

function groupId(name: string): string {
  return `cfg-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}
