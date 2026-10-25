import { describe, expect, it } from "vitest";
import { withBase } from "./url";

describe("withBase", () => {
  it("prefixes site paths with a subpath base", () => {
    expect(withBase("/sponsors", "/CubesWebsite")).toBe("/CubesWebsite/sponsors");
    expect(withBase("shop/hoodie", "/CubesWebsite/")).toBe("/CubesWebsite/shop/hoodie");
  });

  it("maps the home path to the base root", () => {
    expect(withBase("/", "/CubesWebsite")).toBe("/CubesWebsite/");
  });

  it("works once the site moves to a custom domain root", () => {
    expect(withBase("/sponsors", "/")).toBe("/sponsors");
    expect(withBase("/", "/")).toBe("/");
  });

  it("leaves external links, mailto and fragments untouched", () => {
    expect(withBase("https://www.instagram.com/cubes.eca/", "/CubesWebsite")).toBe(
      "https://www.instagram.com/cubes.eca/",
    );
    expect(withBase("mailto:cubes@example.com", "/CubesWebsite")).toBe("mailto:cubes@example.com");
    expect(withBase("#faq", "/CubesWebsite")).toBe("#faq");
  });
});
