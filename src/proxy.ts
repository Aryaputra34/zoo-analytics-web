import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, authEnabled, validSession } from "@/lib/session";

const PUBLIC_ASSET = /\.(?:svg|png|jpg|jpeg|webp|ico)$/;

// Login gate for every page and API route. Exceptions: the login page, public/ images, and the event
// ingest from zoo-vision (POST /api/events), which has its own bearer key (INGEST_API_KEY).
export function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const isApi = pathname.startsWith("/api/");
  if (
    !authEnabled() ||
    pathname === "/login" ||
    pathname.startsWith("/api-docs") ||
    pathname === "/api/openapi.yaml" ||
    (!isApi && PUBLIC_ASSET.test(pathname)) ||
    (pathname === "/api/events" && req.method === "POST") ||
    validSession(req.cookies.get(SESSION_COOKIE)?.value)
  )
    return NextResponse.next();

  if (isApi) return NextResponse.json({ error: "login required" }, { status: 401 });
  const login = new URL("/login", req.url);
  if (pathname !== "/") login.searchParams.set("next", pathname + search);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
