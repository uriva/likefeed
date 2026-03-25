import { db, id } from "../db.ts";
import type { CreateReactionInput, ApiResponse } from "../types.ts";

const getOrCreateItem = async (
  url: string,
  title?: string,
): Promise<string> => {
  const { items } = await db.query({
    items: { $: { where: { url } } },
  });
  if (items[0]) return items[0].id;
  const itemId = id();
  await db.transact([
    db.tx.items[itemId]!.update({
      url,
      title: title ?? "",
      createdAt: Date.now(),
    }),
  ]);
  return itemId;
};

const createReaction = async (
  req: Request,
  _params: Record<string, string>,
  userId: string,
): Promise<Response> => {
  const input = (await req.json()) as CreateReactionInput;
  const itemId = await getOrCreateItem(input.url, input.title);

  // Remove existing reaction from this user on this item
  const { reactions: existing } = await db.query({
    reactions: {
      $: { where: { "user.id": userId, "item.id": itemId } },
    },
  });
  const deleteTxs = existing.map((r: any) => db.tx.reactions[r.id]!.delete());

  const reactionId = id();
  await db.transact([
    ...deleteTxs,
    db.tx.reactions[reactionId]!.update({
      type: input.type,
      createdAt: Date.now(),
    }),
    db.tx.reactions[reactionId]!.link({ user: userId, item: itemId }),
  ]);

  return Response.json(
    { data: { id: reactionId, type: input.type, url: input.url } } satisfies ApiResponse<unknown>,
    { status: 201 },
  );
};

const listReactions = async (
  _req: Request,
  _params: Record<string, string>,
  userId: string,
): Promise<Response> => {
  const { reactions } = await db.query({
    reactions: {
      $: { where: { "user.id": userId }, order: { createdAt: "desc" } },
      item: {},
    },
  });
  return Response.json({
    data: reactions.map((r: any) => ({
      id: r.id,
      type: r.type,
      url: r.item?.url ?? "",
      title: r.item?.title ?? "",
      createdAt: r.createdAt,
    })),
  } satisfies ApiResponse<unknown>);
};

const deleteReaction = async (
  _req: Request,
  params: Record<string, string>,
  userId: string,
): Promise<Response> => {
  const { reactions } = await db.query({
    reactions: {
      $: { where: { id: params.reactionId!, "user.id": userId } },
    },
  });
  if (!reactions[0]) {
    return Response.json(
      { error: "Reaction not found", code: "NOT_FOUND" },
      { status: 404 },
    );
  }
  await db.transact([db.tx.reactions[reactions[0].id]!.delete()]);
  return new Response(null, { status: 204 });
};

export { createReaction, listReactions, deleteReaction, getOrCreateItem };
