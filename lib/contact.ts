import type { Messenger } from "@/content/types";

/** Адрес одной строкой — подпись карты и описание страницы Kontakt: «ul. …, Warszawa-…». */
export function addressLine({ street, area }: { street: string; area: string }): string {
  return `${street}, ${area}`;
}

export function telHref(phone: string): string {
  return `tel:${phone}`;
}

export function messengerHref(messenger: Messenger): string {
  switch (messenger.kind) {
    case "telegram":
      return "username" in messenger
        ? `https://t.me/${messenger.username}`
        : `https://t.me/${messenger.phone}`;
    case "whatsapp":
      return `https://wa.me/${messenger.phone.slice(1)}`;
    case "instagram":
      return `https://www.instagram.com/${messenger.username}/`;
    case "facebook":
      return "username" in messenger
        ? `https://www.facebook.com/${messenger.username}`
        : `https://www.facebook.com/profile.php?id=${messenger.id}`;
  }
}
