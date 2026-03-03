import { db } from "./db.ts";
import type { ApiError } from "./types.ts";
import {
  createReaction,
  listReactions,
  deleteReaction,
} from "./handlers/reactions.ts";
import {
  createComment,
  listComments,
  deleteComment,
} from "./handlers/comments.ts";
import {
  createItemLink,
  listItemLinks,
  deleteItemLink,
} from "./handlers/links.ts";
import { getFeed, getFeedRss } from "./handlers/feed.ts";
import {
  createApiKey,
  listApiKeys,
  deleteApiKey,
  hashApiKey,
} from "./handlers/apiKeys.ts";

type AuthType = "apiKey" | "apiKeyOrUserToken" | "userToken" | "none";

type RouteHandler = (
  req: Request,
  params: Record<string, string>,
  userId: string,
) => Promise<Response>;

type Route = {
  readonly method: string;
  readonly pattern: URLPattern;
  readonly handler: RouteHandler;
  readonly authType: AuthType;
};

const authenticateApiKey = async (
  req: Request,
): Promise<string | null> => {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const apiKey = authHeader.slice(7);
  if (!apiKey.startsWith("lf_")) return null;

  const keyHash = await hashApiKey(apiKey);
  const { apiKeys } = await db.query({
    apiKeys: {
      $: { where: { keyHash } },
      user: {},
    },
  });

  const apiKeyRecord = apiKeys[0];
  if (!apiKeyRecord?.user) return null;

  db.transact([
    db.tx.apiKeys[apiKeyRecord.id]!.update({ lastUsedAt: Date.now() }),
  ]);

  return apiKeyRecord.user.id;
};

const authenticateUserToken = async (
  req: Request,
): Promise<string | null> => {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7);
  try {
    const user = await db.auth.verifyToken(token);
    return user?.id ?? null;
  } catch {
    return null;
  }
};

const route = (
  method: string,
  path: string,
  handler: RouteHandler,
  authType: AuthType,
): Route => ({
  method,
  pattern: new URLPattern({ pathname: path }),
  handler,
  authType,
});

const routes: readonly Route[] = [
  // Reactions
  route("POST", "/v1/reactions", createReaction, "apiKeyOrUserToken"),
  route("GET", "/v1/reactions", listReactions, "apiKeyOrUserToken"),
  route("DELETE", "/v1/reactions/:reactionId", deleteReaction, "apiKeyOrUserToken"),

  // Comments
  route("POST", "/v1/comments", createComment, "apiKeyOrUserToken"),
  route("GET", "/v1/comments", listComments, "apiKeyOrUserToken"),
  route("DELETE", "/v1/comments/:commentId", deleteComment, "apiKeyOrUserToken"),

  // Links
  route("POST", "/v1/links", createItemLink, "apiKeyOrUserToken"),
  route("GET", "/v1/links", listItemLinks, "apiKeyOrUserToken"),
  route("DELETE", "/v1/links/:linkId", deleteItemLink, "apiKeyOrUserToken"),

  // API Keys (dashboard only)
  route("POST", "/v1/api-keys", createApiKey, "userToken"),
  route("GET", "/v1/api-keys", listApiKeys, "userToken"),
  route("DELETE", "/v1/api-keys/:apiKeyId", deleteApiKey, "userToken"),

  // Public feed
  route("GET", "/v1/feed/:userId", getFeed, "none"),
  route("GET", "/v1/feed/:userId/rss", getFeedRss, "none"),

  // Health
  route(
    "GET",
    "/health",
    async () => Response.json({ status: "ok" }),
    "none",
  ),
];

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const jsonError = (status: number, error: string, code: string): Response =>
  Response.json({ error, code } satisfies ApiError, {
    status,
    headers: corsHeaders,
  });

const matchRoute = (
  req: Request,
): { route: Route; params: Record<string, string> } | null => {
  const method = req.method;
  for (const r of routes) {
    if (r.method !== method) continue;
    const match = r.pattern.exec(req.url);
    if (match) {
      return {
        route: r,
        params: (match.pathname.groups ?? {}) as Record<string, string>,
      };
    }
  }
  return null;
};

const resolveAuth = async (
  req: Request,
  authType: AuthType,
): Promise<{ userId: string | null; error: Response | null }> => {
  if (authType === "none") return { userId: "", error: null };

  if (authType === "apiKey") {
    const userId = await authenticateApiKey(req);
    return userId
      ? { userId, error: null }
      : { userId: null, error: jsonError(401, "Invalid API key", "UNAUTHORIZED") };
  }

  if (authType === "userToken") {
    const userId = await authenticateUserToken(req);
    return userId
      ? { userId, error: null }
      : { userId: null, error: jsonError(401, "Invalid user token", "UNAUTHORIZED") };
  }

  // apiKeyOrUserToken
  const apiKeyUserId = await authenticateApiKey(req);
  if (apiKeyUserId) return { userId: apiKeyUserId, error: null };

  const tokenUserId = await authenticateUserToken(req);
  return tokenUserId
    ? { userId: tokenUserId, error: null }
    : { userId: null, error: jsonError(401, "Invalid credentials", "UNAUTHORIZED") };
};

const handleRequest = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const matched = matchRoute(req);
  if (!matched) return jsonError(404, "Not found", "NOT_FOUND");

  const { route: matchedRoute, params } = matched;
  const { userId, error: authError } = await resolveAuth(req, matchedRoute.authType);
  if (authError) return authError;

  try {
    const response = await matchedRoute.handler(req, params, userId!);
    for (const [key, value] of Object.entries(corsHeaders)) {
      response.headers.set(key, value);
    }
    return response;
  } catch (err: unknown) {
    if (
      err &&
      typeof err === "object" &&
      "status" in err &&
      "error" in err &&
      "code" in err
    ) {
      const e = err as { status: number; error: string; code: string };
      return jsonError(e.status, e.error, e.code);
    }
    console.error("Unhandled error:", err);
    return jsonError(500, "Internal server error", "INTERNAL_ERROR");
  }
};

const DIST_DIR = new URL("../web/dist", import.meta.url).pathname;

const contentTypeByExt: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".ttf": "font/ttf",
};

const getContentType = (path: string): string => {
  const ext = path.slice(path.lastIndexOf("."));
  return contentTypeByExt[ext] ?? "application/octet-stream";
};

const serveStaticFile = async (filePath: string): Promise<Response | null> => {
  try {
    const data = await Deno.readFile(filePath);
    const isAsset = filePath.includes("/assets/");
    return new Response(data, {
      headers: {
        "content-type": getContentType(filePath),
        ...(isAsset
          ? { "cache-control": "public, max-age=31536000, immutable" }
          : { "cache-control": "no-cache" }),
      },
    });
  } catch {
    return null;
  }
};

const handleStatic = async (req: Request): Promise<Response | null> => {
  const url = new URL(req.url);
  const filePath = `${DIST_DIR}${url.pathname}`;
  const fileResponse = await serveStaticFile(filePath);
  if (fileResponse) return fileResponse;
  return serveStaticFile(`${DIST_DIR}/index.html`);
};

const handler = async (req: Request): Promise<Response> => {
  const response = await handleRequest(req);
  if (response.status === 404) {
    const url = new URL(req.url);
    const isApiPath =
      url.pathname.startsWith("/v1/") || url.pathname === "/health";
    if (!isApiPath && req.method === "GET") {
      const staticResponse = await handleStatic(req);
      if (staticResponse) return staticResponse;
    }
  }
  return response;
};

Deno.serve({ port: Number(Deno.env.get("PORT") ?? 8000) }, handler);
