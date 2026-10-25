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

## Images

The originals (full-resolution photos and QB poses) live on the **CUBES shared Google Drive**. The repo only stores web-sized masters.

To add or update images:

1. Add the original to the Drive folder.
2. Download the Drive folder locally. The `assets/` folder in the repo root is gitignored, so it works as the local copy.
3. Run `pnpm export-masters` (or `pnpm export-masters path/to/drive-folder`).
4. Commit the changed files in `src/assets/`.

| Drive folder | Output | Processing |
|---|---|---|
| `Chosen pictures/*.jpg` | `src/assets/photos/img-0406.jpg` | Max 2000 px, JPEG q85, metadata stripped (no GPS) |
| `Cubes Design/<n>.png` | `src/assets/qb/qb-NN.webp` | Trimmed, max 1000 px, WebP with transparency |
| `cubeslogo.png` | `src/assets/brand/cubes-logo.png` | Trimmed, max 1200 px |

Never commit originals; the export script exists to keep the repo small.

## Merch price changes

Zeffy processes payments and keeps its own copy of every price. When a product or option price changes:

- [ ] Update the product entry in the repo.
- [ ] Update the same item and option in the Zeffy form.
- [ ] Update `zeffyPricesCheckedAt` on the product entry.
- [ ] Open the product page and the Zeffy checkout, and confirm the totals match.
