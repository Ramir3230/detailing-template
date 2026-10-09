import Link from "next/link";

type Crumb = { name: string; href: string };

/**
 * Хлебные крошки внутренней страницы: «Usługi / Lakier». Текущая страница — последней,
 * без ссылки. Цель ссылки — 44 px высотой за счёт полей, вёрстку она не раздувает.
 */
export function Breadcrumbs({ label, trail, current }: { label: string; trail: Crumb[]; current: string }) {
  return (
    <nav aria-label={label} className="text-13 text-muted lg:text-14">
      <ol className="flex flex-wrap items-baseline gap-x-2">
        {trail.map(({ name, href }) => (
          <li key={href} className="flex items-baseline gap-2">
            <Link
              href={href}
              className="-my-3 inline-block py-3 underline underline-offset-4 transition-colors hover:text-fg"
            >
              {name}
            </Link>
            <span aria-hidden="true">/</span>
          </li>
        ))}
        <li aria-current="page">{current}</li>
      </ol>
    </nav>
  );
}
