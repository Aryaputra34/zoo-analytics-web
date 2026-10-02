export async function GET() {
  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Zoo Analytics API Documentation · Swagger UI</title>
  <link rel="icon" type="image/svg+xml" href="/logo-tamansafari.svg">
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  <style>
    body {
      margin: 0;
      padding: 0;
      background: #fafafa;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    .custom-header {
      background: #122416;
      border-bottom: 2px solid #b4dc36;
      color: #ffffff;
      padding: 12px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: sticky;
      top: 0;
      z-index: 1000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    .custom-header-brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .custom-header-title {
      font-size: 15px;
      font-weight: 800;
      letter-spacing: -0.01em;
      color: #ffffff;
    }
    .custom-header-tag {
      font-size: 11px;
      font-weight: 700;
      background: rgba(180, 220, 54, 0.2);
      color: #b4dc36;
      padding: 2px 8px;
      border-radius: 9999px;
      border: 1px solid rgba(180, 220, 54, 0.4);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .custom-header-links {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .custom-header-link {
      font-size: 13px;
      font-weight: 700;
      color: rgba(255, 255, 255, 0.85);
      text-decoration: none;
      padding: 6px 12px;
      border-radius: 8px;
      transition: all 0.2s ease;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.12);
    }
    .custom-header-link:hover {
      background: #b4dc36;
      color: #122416;
      border-color: #b4dc36;
    }
    /* Hide Swagger default topbar since we have our branded header */
    .swagger-ui .topbar {
      display: none;
    }
    /* Improve Swagger UI container padding */
    .swagger-ui .information-container {
      padding-top: 20px;
    }
    .swagger-ui .scheme-container {
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      border-radius: 8px;
      margin: 15px 0;
    }
  </style>
</head>
<body>
  <header class="custom-header">
    <div class="custom-header-brand">
      <div class="custom-header-title">Taman Safari Bogor · Zoo Analytics</div>
      <span class="custom-header-tag">Interactive API Docs</span>
    </div>
    <div class="custom-header-links">
      <a href="/api/openapi.yaml" target="_blank" class="custom-header-link">📄 raw openapi.yaml</a>
      <a href="/" class="custom-header-link">← Kembali ke Dashboard</a>
    </div>
  </header>

  <div id="swagger-ui"></div>

  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      window.ui = SwaggerUIBundle({
        url: '/api/openapi.yaml',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout",
        displayRequestDuration: true,
        persistAuthorization: true,
        defaultModelsExpandDepth: 1,
        defaultModelExpandDepth: 1,
        docExpansion: "list"
      });
    };
  </script>
</body>
</html>`;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
}
