import { afterEach, describe, expect, it, vi } from "vitest";
import { alternates, siteUrl } from "@/lib/seo";

describe("alternates", () => {
  it("points every language to the same page and the default to Polish", () => {
    expect(alternates("ru", "/uslugi/lakier", ["pl", "ru"])).toEqual({
      canonical: "/ru/uslugi/lakier",
      languages: { pl: "/uslugi/lakier", ru: "/ru/uslugi/lakier", "x-default": "/uslugi/lakier" },
    });
    expect(alternates("pl", "/", ["pl", "ru"])).toEqual({
      canonical: "/",
      languages: { pl: "/", ru: "/ru", "x-default": "/" },
    });
  });

  it("gives a one-language studio a canonical only", () => {
    expect(alternates("pl", "/kontakt", ["pl"])).toEqual({ canonical: "/kontakt" });
  });
});

describe("siteUrl", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("takes the production domain on Vercel, previews included", () => {
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "studio.pl");
    expect(siteUrl().href).toBe("https://studio.pl/");
  });

  it("falls back to localhost outside Vercel", () => {
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "");
    vi.stubEnv("PORT", "");
    expect(siteUrl().href).toBe("http://localhost:3000/");
  });
});
