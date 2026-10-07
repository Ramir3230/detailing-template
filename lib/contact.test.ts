import { describe, expect, it } from "vitest";
import { messengerHref, telHref } from "@/lib/contact";

describe("contact links", () => {
  it("builds a tel: link", () => {
    expect(telHref("+48123456789")).toBe("tel:+48123456789");
  });

  it("builds messenger links by username or by phone", () => {
    expect(messengerHref({ kind: "telegram", username: "studio_x" })).toBe("https://t.me/studio_x");
    expect(messengerHref({ kind: "telegram", phone: "+48123456789" })).toBe("https://t.me/+48123456789");
    expect(messengerHref({ kind: "whatsapp", phone: "+48123456789" })).toBe("https://wa.me/48123456789");
    expect(messengerHref({ kind: "instagram", username: "studio.x" })).toBe(
      "https://www.instagram.com/studio.x/",
    );
  });
});
