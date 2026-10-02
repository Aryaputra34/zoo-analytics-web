"use server";

import { setTimeout as sleep } from "node:timers/promises";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, SESSION_MAX_AGE_SEC, newSessionValue, passwordMatches } from "@/lib/session";

// Only same-site paths, never "//host" or "/\host".
const safeNext = (v: FormDataEntryValue | null) => {
  const s = String(v ?? "");
  return /^\/(?![/\\])/.test(s) ? s : "/";
};

export async function login(form: FormData) {
  const next = safeNext(form.get("next"));
  if (!passwordMatches(String(form.get("password") ?? ""))) {
    await sleep(1000); // slows down password guessing
    redirect(`/login?error=1&next=${encodeURIComponent(next)}`);
  }
  // Secure cookies are dropped over plain http, which is how the dashboard usually runs on the park LAN.
  const https = ((await headers()).get("origin") ?? "").startsWith("https://");
  (await cookies()).set(SESSION_COOKIE, newSessionValue(), {
    httpOnly: true,
    secure: https,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SEC,
  });
  redirect(next);
}
