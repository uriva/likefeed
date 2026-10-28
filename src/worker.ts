import { handleRequest } from "./main.ts";

type AssetFetcher = {
  fetch: (req: Request) => Promise<Response>;
};

type WorkerEnv = Record<string, string | AssetFetcher | undefined> & {
  ASSETS?: AssetFetcher;
};

const syncEnv = (env: WorkerEnv) => {
  Object.entries(env).forEach(([k, v]) => {
    if (typeof v === "string") {
      Deno.env.set(k, v);
    }
  });
};

export const worker = {
  fetch: async (req: Request, env: WorkerEnv) => {
    syncEnv(env);
    const response = await handleRequest(req);
    if (response.status === 404) {
      const url = new URL(req.url);
      const isApiPath = url.pathname.startsWith("/v1/") ||
        url.pathname === "/health";
      if (
        !isApiPath &&
        (req.method === "GET" || req.method === "HEAD") &&
        env.ASSETS
      ) {
        return await env.ASSETS.fetch(req);
      }
    }
    return response;
  },
};

export default worker;
