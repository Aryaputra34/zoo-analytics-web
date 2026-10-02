import { readFile } from "node:fs/promises";
import { join } from "node:path";

export async function GET() {
  try {
    const filePath = join(process.cwd(), "docs", "openapi.yaml");
    const content = await readFile(filePath, "utf-8");
    return new Response(content, {
      headers: {
        "Content-Type": "application/yaml; charset=utf-8",
        "Cache-Control": "public, max-age=60",
      },
    });
  } catch {
    return Response.json({ error: "openapi.yaml not found" }, { status: 404 });
  }
}
