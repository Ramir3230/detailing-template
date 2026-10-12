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

  it("builds a Facebook link by page name or by the id of a page without one", () => {
    expect(messengerHref({ kind: "facebook", username: "studio.x" })).toBe("https://www.facebook.com/studio.x");
    expect(messengerHref({ kind: "facebook", id: "123456789012345" })).toBe(
      "https://www.facebook.com/profile.php?id=123456789012345",
    );
  });
});
