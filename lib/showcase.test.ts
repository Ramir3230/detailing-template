import { describe, expect, it } from "vitest";
import type { Showcase } from "@/content/types";
import {
  markScript,
  markShowcase,
  pointReturn,
  returnHref,
  returnHrefs,
  returnScript,
  type ShowcaseWindow,
} from "@/lib/showcase";

/* Своё портфолио теста: проверяется логика, а не данные Afterdark */
const showcase: Showcase = {
  site: "https://portfolio.example",
  path: "/projects/case",
  anchor: "finale",
  langs: ["pl", "uk", "ru"],
};

type Storage = "open" | "closed" | "full";

/* Окно браузера на адресе: хранилище вкладки открыто, закрыто (доступ к нему бросает) или
   переполнено (бросает запись); replaceState запоминает адреса */
function browser(href: string, { storage = "open", stored }: { storage?: Storage; stored?: string } = {}) {
  const items = new Map<string, string>(stored === undefined ? [] : [["showcase", stored]]);
  const attributes = new Map<string, string>();
  const replaced: string[] = [];
  const state = { next: "router state" };
  let current: unknown = state;
  const win = {
    location: { href },
    history: {
      get state() {
        return current;
      },
      replaceState(next: unknown, _title: string, url: string) {
        current = next;
        replaced.push(url);
      },
    },
    get sessionStorage() {
      if (storage === "closed") throw new DOMException("closed", "SecurityError");
      return {
        getItem: (key: string) => items.get(key) ?? null,
        setItem: (key: string, value: string) => {
          if (storage === "full") throw new DOMException("full", "QuotaExceededError");
          items.set(key, value);
        },
      };
    },
    document: { documentElement: { setAttribute: (name: string, value: string) => attributes.set(name, value) } },
  };
  return {
    win: win as unknown as ShowcaseWindow,
    mark: () => attributes.get("data-showcase"),
    stored: () => items.get("showcase"),
    replaced,
    stateKept: () => current === state,
  };
}

describe("showcase mark", () => {
  it("shows the strip to a visitor from the portfolio and cleans the address without a history step", () => {
    const page = browser("https://demo.example/?from=pl");
    markShowcase(page.win, showcase.langs);
    expect(page.mark()).toBe("pl");
    expect(page.stored()).toBe("pl");
    expect(page.replaced).toEqual(["/"]);
    // Состояние шага истории — роутера Next — остаётся прежним
    expect(page.stateKept()).toBe(true);
  });

  it("keeps the rest of the address: the path, other parameters and the anchor", () => {
    const page = browser("https://demo.example/ru/kontakt?fbclid=abc&from=uk#mapa");
    markShowcase(page.win, showcase.langs);
    expect(page.mark()).toBe("uk");
    expect(page.replaced).toEqual(["/ru/kontakt?fbclid=abc#mapa"]);
  });

  it("takes only the portfolio languages from the field: anything else is no mark", () => {
    for (const from of ["x", "PL", "", "pl ", "en", "pl,uk"]) {
      const page = browser(`https://demo.example/?from=${encodeURIComponent(from)}`);
      markShowcase(page.win, showcase.langs);
      expect(page.mark(), `?from=${from}`).toBeUndefined();
      expect(page.stored(), `?from=${from}`).toBeUndefined();
      // Чужая отметка — не наша: адрес не трогаем
      expect(page.replaced, `?from=${from}`).toEqual([]);
    }
    const page = browser("https://demo.example/?from=ru");
    markShowcase(page.win, ["pl"]);
    expect(page.mark()).toBeUndefined();
  });

  it("remembers the mark for the tab: other pages and a reload keep the strip", () => {
    const page = browser("https://demo.example/uslugi/lakier", { stored: "uk" });
    markShowcase(page.win, showcase.langs);
    expect(page.mark()).toBe("uk");
    expect(page.replaced).toEqual([]);
  });

  it("treats a foreign value as no mark: the one remembered in the tab stays", () => {
    const page = browser("https://demo.example/?from=x", { stored: "ru" });
    markShowcase(page.win, showcase.langs);
    expect(page.mark()).toBe("ru");
  });

  it("lets a new mark replace the remembered one", () => {
    const page = browser("https://demo.example/?from=pl", { stored: "ru" });
    markShowcase(page.win, showcase.langs);
    expect(page.mark()).toBe("pl");
    expect(page.stored()).toBe("pl");
  });

  it("ignores a remembered value that is not a portfolio language", () => {
    const page = browser("https://demo.example/", { stored: "x" });
    markShowcase(page.win, showcase.langs);
    expect(page.mark()).toBeUndefined();
  });

  it("without a tab storage keeps the mark in the address: the strip stays on this page", () => {
    for (const storage of ["closed", "full"] as const) {
      const page = browser("https://demo.example/?from=pl", { storage });
      expect(() => markShowcase(page.win, showcase.langs)).not.toThrow();
      expect(page.mark(), storage).toBe("pl");
      expect(page.replaced, storage).toEqual([]);
    }
    const page = browser("https://demo.example/", { storage: "closed" });
    expect(() => markShowcase(page.win, showcase.langs)).not.toThrow();
    expect(page.mark()).toBeUndefined();
  });

  it("works as the inline script it goes out as: on its own, without the module", () => {
    const page = browser("https://demo.example/?from=uk");
    new Function("window", markScript(showcase))(page.win);
    expect(page.mark()).toBe("uk");
    expect(page.replaced).toEqual(["/"]);
  });
});

/* Документ с атрибутом на <html> и ссылкой возврата */
function documentWith(mark: string | null) {
  const link = { href: "server", setAttribute: (_name: string, value: string) => (link.href = value) };
  const doc = {
    documentElement: { getAttribute: (name: string) => (name === "data-showcase" ? mark : null) },
    getElementById: (id: string) => (id === "showcase-return" ? link : null),
  };
  return { doc: doc as unknown as Document, link };
}

describe("showcase return link", () => {
  it("leads to the end of the case in each portfolio language", () => {
    expect(returnHref(showcase, "uk")).toBe("https://portfolio.example/uk/projects/case#finale");
    expect(Object.keys(returnHrefs(showcase))).toEqual(["pl", "uk", "ru"]);
    for (const [lang, href] of Object.entries(returnHrefs(showcase))) expect(href).toBe(returnHref(showcase, lang));
  });

  it("is pointed to the language of the mark", () => {
    const { doc, link } = documentWith("ru");
    pointReturn(doc, returnHrefs(showcase));
    expect(link.href).toBe(returnHref(showcase, "ru"));
  });

  it("stays as the server sent it without a mark or with an unknown one", () => {
    for (const mark of [null, "x", "constructor"]) {
      const { doc, link } = documentWith(mark);
      pointReturn(doc, returnHrefs(showcase));
      expect(link.href, String(mark)).toBe("server");
    }
  });

  it("works as the inline script it goes out as, and data cannot close the script tag", () => {
    const { doc, link } = documentWith("uk");
    new Function("document", returnScript(showcase))(doc);
    expect(link.href).toBe(returnHref(showcase, "uk"));
    const hostile = { ...showcase, path: "/</script><script>alert(1)//" };
    expect(returnScript(hostile)).not.toMatch(/<\/script/i);
    expect(markScript({ ...showcase, langs: ["</script>"] })).not.toMatch(/<\/script/i);
  });
});
