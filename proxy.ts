import { NextResponse, type NextRequest } from "next/server";
import { proxyAction } from "@/lib/routing";

/* Куда ведёт адрес — решает lib/routing.ts: язык по префиксу и сразу 404 незнакомому. */
export function proxy(request: NextRequest) {
  const action = proxyAction(request.nextUrl.pathname);
  if (action.kind === "next") return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = action.pathname;
  return action.kind === "redirect" ? NextResponse.redirect(url, 308) : NextResponse.rewrite(url);
}

export const config = {
  /* Всё, кроме служебных путей Next и Vercel, маршрутов в корне app/ вне [lang]
     (/icon без расширения, будущие api/ и apple-icon) и файлов из public/ по их
     расширениям. Адрес с другой точкой — старый `.html` или `.php` — получает 404 студии,
     а не стандартную Next. Новый маршрут в корне app/ или новый тип файла в public/ —
     добавить сюда, иначе адрес перепишется в /pl/… и отдаст 404. */
  matcher: ["/((?!_next/|_vercel/|api/|icon$|apple-icon$|.*\\.(?:webp|png|jpe?g|svg|ico|txt|xml|webmanifest)$).*)"],
};
