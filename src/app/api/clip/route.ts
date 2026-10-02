// Event clip from MediaMTX's playback server (zoo-monitor configs/mediamtx.yml):
// ?path=<recordingPath>&ts=<event ms>  ->  MP4 from 15 s before to 15 s after the event.
const BEFORE_SEC = 15;
const DURATION_SEC = 30;

export async function GET(req: Request) {
  const base = process.env.MEDIAMTX_PLAYBACK_URL;
  if (!base) return Response.json({ error: "MEDIAMTX_PLAYBACK_URL is not set" }, { status: 404 });

  const sp = new URL(req.url).searchParams;
  const path = sp.get("path") ?? "";
  const ts = Number(sp.get("ts"));
  if (!/^[\w-]+(?:\/[\w-]+)*$/.test(path) || !Number.isFinite(ts))
    return Response.json({ error: "bad path or ts" }, { status: 400 });

  const q = new URLSearchParams({
    path,
    start: new Date(ts - BEFORE_SEC * 1000).toISOString(),
    duration: String(DURATION_SEC),
    format: "mp4",
  });
  let upstream: Response;
  try {
    upstream = await fetch(`${base.replace(/\/+$/, "")}/get?${q}`, { cache: "no-store", signal: req.signal });
  } catch {
    return Response.json({ error: "MediaMTX unreachable" }, { status: 502 });
  }
  if (!upstream.ok) return Response.json({ error: "recording not available" }, { status: 404 });

  // A clip that reaches into the future is still growing: don't let the browser keep the short version.
  const complete = ts + (DURATION_SEC - BEFORE_SEC) * 1000 < Date.now();
  return new Response(upstream.body, {
    headers: { "Content-Type": "video/mp4", "Cache-Control": complete ? "private, max-age=3600" : "no-store" },
  });
}
