import { describe, expect, it } from "vitest";
import type { ServiceGroup } from "@/content/types";
import { groupPath, hasGroupPage } from "@/lib/nav";

const group = (intro?: string): ServiceGroup => ({
  slug: "lakier",
  name: { pl: "Lakier" },
  ...(intro === undefined ? {} : { intro: { pl: intro } }),
  services: [],
});

describe("groupPath", () => {
  it("leads to the group page once the group has one", () => {
    expect(hasGroupPage(group("Korekta usuwa rysy."))).toBe(true);
    expect(groupPath(group("Korekta usuwa rysy."))).toBe("/uslugi/lakier");
  });

  it("leads to the group's place in the home price list until then", () => {
    expect(hasGroupPage(group())).toBe(false);
    expect(groupPath(group())).toBe("/#lakier");
  });
});
