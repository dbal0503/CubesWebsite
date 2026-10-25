# Contributing

## Workflow

1. Branch from `main` (`feat/...`, `fix/...`, `content/...`).
2. Before pushing, run `pnpm lint:fix && pnpm check && pnpm test`.
3. Open a PR. CI must pass before merging.
4. Merging to `main` deploys the site.

## Links

The site is served from `/CubesWebsite/` until the custom domain exists.

- Internal links must go through `withBase()` from `src/lib/url.ts`. A bare `href="/sponsors"` breaks on GitHub Pages.
- Images must be imported from `src/assets/` and rendered with Astro's `<Image>`, which handles the base path automatically.

## Content

All site content lives in `src/content/`. Schemas in `src/lib/content-schemas.ts` check it at build time, so a missing or misspelled field fails the build with a message naming the file and field.

| What | Where | Format |
|---|---|---|
| Events | `src/content/events.yaml` | One list item per event: an exact `start`, or just a `month` until the date is set. Mark maybe-events `tentative: true`. Upcoming vs past is computed in the browser. |
| Team | `src/content/team.yaml` | One item per exec, sorted by `order` then name. |
| Committees | `src/content/committees.yaml` | One group photo per committee. |
| Sponsors | `src/content/sponsors.yaml` | One item per sponsor; logos go in `src/assets/sponsors/`. |
| Merch | `src/content/products/<slug>.md` | Frontmatter for price and options; the body is the description. |
| FAQ (QB chat) | `src/content/faq/<id>.md` | Frontmatter for question, keywords and sources; the body is the answer. |
| Links, email, office | `src/data/site.ts` | Set a value to `null` to hide that link everywhere. |

Each file starts with a comment listing its fields; copy an existing entry to add a new one.

- **Drafts:** `draft: true` keeps an entry visible in `pnpm dev` and out of the live site.
- **FAQ review:** `reviewed: false` marks answers no CUBES exec has checked against the sources yet.
- **Merch and Zeffy:** Zeffy options can't change prices, so each priced choice maps to a Zeffy item (`zeffyItem`) or add-on (`zeffyAddOn`). The build rejects a product whose selections don't resolve to exactly one Zeffy item.

## Images

The originals (full-resolution photos and QB poses) live on the **CUBES shared Google Drive**. The repo only stores web-sized masters.

To add or update images:

1. Add the original to the Drive folder.
2. Download the Drive folder locally. The `assets/` folder in the repo root is gitignored, so it works as the local copy.
3. Run `pnpm export-masters` (or `pnpm export-masters path/to/drive-folder`).
4. Commit the changed files in `src/assets/`.

| Drive folder | Output | Processing |
|---|---|---|
| `Chosen pictures/*.jpg` | `src/assets/photos/<same name>.jpg` | Max 2000 px, JPEG q85, metadata stripped (no GPS). Name files after the person or group, e.g. `Ailema_Jimenez.jpg`. |
| `Merch/*.jpg` | `src/assets/merch/<same name>.jpg` | Same as photos |
| `Merch/*.png` | `src/assets/merch/<same name>.webp` | Product shots: max 1200 px, WebP with transparency |
| `Cubes Design/<n>.png` | `src/assets/qb/qb-NN.webp` | Trimmed, max 1000 px, WebP with transparency |
| `cubeslogo.png` | `src/assets/brand/cubes-logo.png` | Trimmed, max 1200 px |

Never commit originals; the export script exists to keep the repo small.

## Merch price changes

Zeffy processes payments and keeps its own copy of every price. When a product or option price changes:

- [ ] Update the product entry in the repo.
- [ ] Update the same item and option in the Zeffy form.
- [ ] Update `zeffyPricesCheckedAt` on the product entry.
- [ ] Open the product page and the Zeffy checkout, and confirm the totals match.
