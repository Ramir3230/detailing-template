import type { ReactNode } from "react";
import type { Messenger } from "@/content/types";

type IconProps = { size?: number };

function Icon({ size = 20, children }: IconProps & { children: ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
    >
      {children}
    </svg>
  );
}

/* Залитые: звезда рейтинга, пауза и пуск отзывов. */
function SolidIcon({ size = 20, children }: IconProps & { children: ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      className="shrink-0"
    >
      {children}
    </svg>
  );
}

export function StarIcon(props: IconProps) {
  return (
    <SolidIcon {...props}>
      <path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8z" />
    </SolidIcon>
  );
}

export function PauseIcon(props: IconProps) {
  return (
    <SolidIcon {...props}>
      <path d="M7 4.5h3.5v15H7zM13.5 4.5H17v15h-3.5z" />
    </SolidIcon>
  );
}

export function PlayIcon(props: IconProps) {
  return (
    <SolidIcon {...props}>
      <path d="M7.5 5v14l11-7z" />
    </SolidIcon>
  );
}

export function ChevronIcon({ back, ...props }: IconProps & { back?: boolean }) {
  return (
    <Icon {...props}>
      <path d={back ? "M15 5.5 8.5 12l6.5 6.5" : "M9 5.5 15.5 12 9 18.5"} />
    </Icon>
  );
}

/** Ссылка уходит на другой сайт. */
export function ExternalIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M7.5 16.5 16.5 7.5M9 7.5h7.5V15" />
    </Icon>
  );
}

export function ArrowIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </Icon>
  );
}

/** «Sprawdź cenę»: вниз, к прайсу на этой же странице. */
export function ArrowDownIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 5v14M6 13l6 6 6-6" />
    </Icon>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 8h16M4 16h16" />
    </Icon>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6 6l12 12M18 6 6 18" />
    </Icon>
  );
}

export function PhoneIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </Icon>
  );
}

function TelegramIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
    </Icon>
  );
}

function WhatsAppIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
    </Icon>
  );
}

function InstagramIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <path d="M17.5 6.5h.01" />
    </Icon>
  );
}

export const messengerIcons: Record<Messenger["kind"], (props: IconProps) => ReactNode> = {
  telegram: TelegramIcon,
  whatsapp: WhatsAppIcon,
  instagram: InstagramIcon,
};
