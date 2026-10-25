/**
 * Prefixes a site-relative path with Astro's `base`, so links keep working
 * while the site is served from a subpath (dbal0503.github.io/CubesWebsite).
 */
export function withBase(path: string, base: string = import.meta.env.BASE_URL): string {
  if (/^[a-z][a-z\d+.-]*:/i.test(path) || path.startsWith("#")) return path;

  const trimmedBase = base.replace(/\/+$/, "");
  const trimmedPath = path.replace(/^\/+/, "");
  return `${trimmedBase}/${trimmedPath}`;
}
