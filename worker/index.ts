interface D1Statement {
  bind(...values: unknown[]): D1Statement;
  first<T>(): Promise<T | null>;
  run(): Promise<unknown>;
}

interface D1Database {
  prepare(query: string): D1Statement;
}

interface Env {
  DB: D1Database;
  ASSETS: {
    fetch(request: Request): Promise<Response>;
  };
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store"
    }
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/stats" && request.method === "GET") {
      try {
        const result = await env.DB
          .prepare("SELECT total_exports FROM usage_stats WHERE id = 1")
          .first<{ total_exports: number }>();

        return json({
          totalExports: result?.total_exports ?? 0
        });
      } catch {
        return json({ error: "Could not load statistics" }, 500);
      }
    }

    if (url.pathname === "/api/export" && request.method === "POST") {
      try {
        const body = await request.json() as { format?: string };

        if (body.format !== "svg" && body.format !== "png") {
          return json({ error: "Invalid export format" }, 400);
        }

        await env.DB
          .prepare(
            "UPDATE usage_stats SET total_exports = total_exports + 1 WHERE id = 1"
          )
          .run();

        return json({ success: true });
      } catch {
        return json({ error: "Could not record export" }, 500);
      }
    }

    return env.ASSETS.fetch(request);
  }
};

