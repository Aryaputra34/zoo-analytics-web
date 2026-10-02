// Dashboard login: one shared password (DASHBOARD_PASSWORD). Unset = no login, for local development.
// The session cookie is "<expiry ms>.<HMAC>" keyed by the password, so changing it signs everyone out.
import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "zoo_session";
export const SESSION_MAX_AGE_SEC = 7 * 86_400;

export const authEnabled = () => !!process.env.DASHBOARD_PASSWORD;

const sha256 = (s: string) => createHash("sha256").update(s).digest();
const sign = (exp: string) =>
  createHmac("sha256", sha256(`zoo-session:${process.env.DASHBOARD_PASSWORD}`)).update(exp).digest("base64url");

export function newSessionValue() {
  const exp = String(Date.now() + SESSION_MAX_AGE_SEC * 1000);
  return `${exp}.${sign(exp)}`;
}

export function validSession(value: string | undefined) {
  const [exp, mac] = (value ?? "").split(".");
  if (!exp || !mac || !(Number(exp) > Date.now())) return false;
  const got = Buffer.from(mac);
  const want = Buffer.from(sign(exp));
  return got.length === want.length && timingSafeEqual(got, want);
}

export function passwordMatches(input: string) {
  const want = process.env.DASHBOARD_PASSWORD;
  return !!want && timingSafeEqual(sha256(input), sha256(want));
}
