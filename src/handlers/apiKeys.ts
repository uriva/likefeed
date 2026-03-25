import { db, id } from "../db.ts";
import type { ApiResponse } from "../types.ts";

const generateApiKey = (): string => {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  const key = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `lf_${key}`;
};

const hashApiKey = async (key: string): Promise<string> => {
  const data = new TextEncoder().encode(key);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

const createApiKey = async (
  req: Request,
  _params: Record<string, string>,
  userId: string,
): Promise<Response> => {
  const { name } = (await req.json()) as { name: string };
  const rawKey = generateApiKey();
  const keyHash = await hashApiKey(rawKey);
  const prefix = rawKey.slice(0, 10);

  const keyId = id();
  await db.transact([
    db.tx.apiKeys[keyId]!.update({
      keyHash,
      prefix,
      name,
      createdAt: Date.now(),
    }),
    db.tx.apiKeys[keyId]!.link({ user: userId }),
  ]);

  return Response.json(
    { data: { id: keyId, key: rawKey, name, prefix } } satisfies ApiResponse<unknown>,
    { status: 201 },
  );
};

const listApiKeys = async (
  _req: Request,
  _params: Record<string, string>,
  userId: string,
): Promise<Response> => {
  const { apiKeys } = await db.query({
    apiKeys: {
      $: { where: { "user.id": userId }, order: { createdAt: "desc" } },
    },
  });
  return Response.json({
    data: apiKeys.map((k: any) => ({
      id: k.id,
      prefix: k.prefix,
      name: k.name,
      createdAt: k.createdAt,
      lastUsedAt: k.lastUsedAt ?? null,
    })),
  } satisfies ApiResponse<unknown>);
};

const deleteApiKey = async (
  _req: Request,
  params: Record<string, string>,
  userId: string,
): Promise<Response> => {
  const { apiKeys } = await db.query({
    apiKeys: {
      $: { where: { id: params.apiKeyId!, "user.id": userId } },
    },
  });
  if (!apiKeys[0]) {
    return Response.json(
      { error: "API key not found", code: "NOT_FOUND" },
      { status: 404 },
    );
  }
  await db.transact([db.tx.apiKeys[apiKeys[0].id]!.delete()]);
  return new Response(null, { status: 204 });
};

export { createApiKey, listApiKeys, deleteApiKey, hashApiKey };
