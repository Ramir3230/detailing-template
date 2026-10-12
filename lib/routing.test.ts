import { readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { pageSegments, proxyAction } from "@/lib/routing";
import { config } from "@/proxy";

describe("proxyAction", () => {
  it("serves Polish without a prefix and leads /pl addresses there", () => {
    expect(proxyAction("/")).toEqual({ kind: "rewrite", pathname: "/pl" });
    expect(proxyAction("/kontakt")).toEqual({ kind: "rewrite", pathname: "/pl/kontakt" });
    expect(proxyAction("/uslugi/lakier")).toEqual({ kind: "rewrite", pathname: "/pl/uslugi/lakier" });
    expect(proxyAction("/pl")).toEqual({ kind: "redirect", pathname: "/" });
    expect(proxyAction("/pl/kontakt")).toEqual({ kind: "redirect", pathname: "/kontakt" });
  });

  it("leaves the other languages on their prefixes", () => {
    expect(proxyAction("/ru")).toEqual({ kind: "next" });
    expect(proxyAction("/ru/kontakt")).toEqual({ kind: "next" });
    expect(proxyAction("/ru/uslugi/lakier")).toEqual({ kind: "next" });
  });

  it("gives an unknown first segment the built 404 in the language of the address", () => {
    for (const path of ["/wp-admin", "/stara-strona.php", "/blog/post.html", "/404", "/rus"]) {
      expect(proxyAction(path), path).toEqual({ kind: "rewrite", pathname: "/pl/404" });
    }
    expect(proxyAction("/ru/wp-admin")).toEqual({ kind: "rewrite", pathname: "/ru/404" });
  });

  it("leaves an unknown address under a known page to its route", () => {
    expect(proxyAction("/uslugi/nie-ma")).toEqual({ kind: "rewrite", pathname: "/pl/uslugi/nie-ma" });
    expect(proxyAction("/ru/uslugi/nie-ma")).toEqual({ kind: "next" });
  });
});

describe("proxy matcher", () => {
  it("lets every file type of public/ pass by: an unlisted one would get the studio 404", () => {
    // В копии демо тест идёт после use-studio — уже на фото демо поверх шаблона
    const group = config.matcher[0].match(/\(\?:([^)]+)\)\$/)?.[1];
    expect(group, "в matcher нет списка расширений").toBeDefined();
    const passes = new RegExp(`\\.(?:${group})$`);
    const files = readdirSync(join(process.cwd(), "public"), { recursive: true, withFileTypes: true })
      .filter((entry) => entry.isFile() && !entry.name.startsWith("."))
      .map(({ name }) => name);
    expect(files.length).toBeGreaterThan(0);
    expect(files.filter((name) => !passes.test(name))).toEqual([]);
  });
});

describe("pageSegments", () => {
  it("names every page folder of app/[lang]: a page missing here would answer 404", () => {
    const folders = readdirSync(join(process.cwd(), "app", "[lang]"), { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && !/^[[(@]/.test(entry.name))
      .map(({ name }) => name);
    expect([...pageSegments].sort()).toEqual(folders.sort());
  });
});
