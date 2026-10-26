# CUBES Website

Website for CUBES, the building engineering student society at Concordia University. It has a 2D site and, later, Cubesville, a 3D city where QB the mascot shows visitors around.

Live: https://dbal0503.github.io/CubesWebsite/ (until the custom domain is set up)

## Stack

- [Astro](https://docs.astro.build) static site, TypeScript, Preact for interactive islands
- Node.js 24 (see `.nvmrc`), pnpm via Corepack
- Biome for linting and formatting, `astro check` for types
- Vitest (unit) and Playwright (end-to-end)
- GitHub Pages, deployed by GitHub Actions

## Getting started

```sh
nvm use            # Node 24
corepack enable    # provides the pnpm version pinned in package.json
pnpm install
pnpm dev           # http://localhost:4321/CubesWebsite/
```

## Scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Local dev server with hot reload |
| `pnpm build` | Static build into `dist/` |
| `pnpm preview` | Serve the built site locally |
| `pnpm check` | Type-check, including `.astro` files |
| `pnpm lint` / `pnpm lint:fix` | Biome lint and format check / auto-fix |
| `pnpm test` | Unit tests |
| `pnpm test:e2e` | Builds, serves, and runs Playwright tests |
| `pnpm export-masters [dir]` | Regenerates web-sized images from the Drive originals |

## Deployment

- A push to `main` builds and deploys to GitHub Pages (`.github/workflows/deploy.yml`).
- The site also rebuilds daily, which keeps build-time data such as the Instagram feed fresh.
- Pull requests run lint, type-check, tests, and build (`.github/workflows/ci.yml`).

## Images

The original photos and QB artwork live on the CUBES shared Google Drive and are not committed. The repo holds only web-sized copies in `src/assets/`. See [CONTRIBUTING.md](CONTRIBUTING.md#images).
