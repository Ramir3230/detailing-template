import { describe, expect, it } from "vitest";
import type { Service, ServiceGroup } from "@/content/types";
import { homePairServices, maxPairs } from "@/lib/compare";

const frame = (src: string) => ({ src, width: 1040, height: 1300, alt: { pl: src }, ai: false });

const service = (name: string, withPair: boolean): Service => ({
  name: { pl: name },
  price: { kind: "fixed", amount: 100 },
  ...(withPair
    ? { beforeAfter: { label: { pl: name }, before: frame(`/${name}/przed.webp`), after: frame(`/${name}/po.webp`) } }
    : {}),
});

const group = (slug: string, services: Service[]): ServiceGroup => ({ slug, name: { pl: slug }, services });

const names = (services: Service[]) => services.map(({ name }) => name.pl);

describe("homePairServices", () => {
  it("takes the first pair of each group in price order", () => {
    const groups = [
      group("mycie", [service("Mycie", false), service("Szyby", true)]),
      group("wnetrze", []),
      group("felgi", [service("Felgi", true), service("Silnik", true)]),
    ];
    expect(names(homePairServices(groups))).toEqual(["Szyby", "Felgi"]);
  });

  it("keeps the home tabs within the limit", () => {
    const slugs = Array.from({ length: maxPairs + 1 }, (_, i) => `g${i}`);
    const groups = slugs.map((slug) => group(slug, [service(slug, true)]));
    expect(names(homePairServices(groups))).toEqual(slugs.slice(0, maxPairs));
  });
});
