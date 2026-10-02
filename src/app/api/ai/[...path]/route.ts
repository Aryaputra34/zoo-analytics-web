// Pass-through to the zoo-monitor AI engine (core/api_server.py): live preview, frames, event snapshots,
// health. Browsers only talk to the dashboard (behind its login); the engine's key stays server-side.
const ENDPOINTS = new Set(["health", "frame", "stream", "snapshots"]);

export async function GET(req: Request, ctx: RouteContext<"/api/ai/[...path]">) {
  const { path } = await ctx.params;
  const base = process.env.AI_ENGINE_URL;
  if (!base) return Response.json({ error: "AI_ENGINE_URL is not set" }, { status: 404 });
  if (!ENDPOINTS.has(path[0]) || path.some((p) => p === "." || p === ".."))
    return Response.json({ error: "not found" }, { status: 404 });

  const key = process.env.AI_ENGINE_API_KEY;
  let upstream: Response;
  try {
    upstream = await fetch(`${base.replace(/\/+$/, "")}/${path.map(encodeURIComponent).join("/")}`, {
      headers: key ? { Authorization: `Bearer ${key}` } : {},
      cache: "no-store",
      signal: req.signal, // viewer closed the preview -> stop pulling the MJPEG stream
    });
  } catch {
    return Response.json({ error: "AI engine unreachable" }, { status: 502 });
  }

  const headers = new Headers({ "Cache-Control": upstream.headers.get("cache-control") ?? "no-store" });
  const type = upstream.headers.get("content-type");
  if (type) headers.set("Content-Type", type);
  return new Response(upstream.body, { status: upstream.status, headers });
}
