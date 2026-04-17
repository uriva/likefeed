import { db, id } from "../db.ts";
import type { ApiResponse, CreateLinkInput } from "../types.ts";
import { getOrCreateItem } from "./reactions.ts";

const createItemLink = async (
  req: Request,
  _params: Record<string, string>,
  userId: string,
): Promise<Response> => {
  const input = (await req.json()) as CreateLinkInput;
  const sourceId = await getOrCreateItem(input.sourceUrl, input.sourceTitle);
  const targetId = await getOrCreateItem(input.targetUrl, input.targetTitle);

  const linkId = id();
  await db.transact([
    db.tx.itemLinks[linkId]!.update({ createdAt: Date.now() }),
    db.tx.itemLinks[linkId]!.link({
      user: userId,
      sourceItem: sourceId,
      targetItem: targetId,
    }),
  ]);

  return Response.json(
    {
      data: {
        id: linkId,
        sourceUrl: input.sourceUrl,
        targetUrl: input.targetUrl,
      },
    } satisfies ApiResponse<unknown>,
    { status: 201 },
  );
};

const listItemLinks = async (
  _req: Request,
  _params: Record<string, string>,
  userId: string,
): Promise<Response> => {
  const { itemLinks } = await db.query({
    itemLinks: {
      $: { where: { "user.id": userId }, order: { createdAt: "desc" } },
      sourceItem: {},
      targetItem: {},
    },
  });
  return Response.json(
    {
      data: itemLinks.map((l: any) => ({
        id: l.id,
        sourceUrl: l.sourceItem?.url ?? "",
        sourceTitle: l.sourceItem?.title ?? "",
        targetUrl: l.targetItem?.url ?? "",
        targetTitle: l.targetItem?.title ?? "",
        createdAt: l.createdAt,
      })),
    } satisfies ApiResponse<unknown>,
  );
};

const deleteItemLink = async (
  _req: Request,
  params: Record<string, string>,
  userId: string,
): Promise<Response> => {
  const { itemLinks } = await db.query({
    itemLinks: {
      $: { where: { id: params.linkId!, "user.id": userId } },
    },
  });
  if (!itemLinks[0]) {
    return Response.json(
      { error: "Link not found", code: "NOT_FOUND" },
      { status: 404 },
    );
  }
  await db.transact([db.tx.itemLinks[itemLinks[0].id]!.delete()]);
  return new Response(null, { status: 204 });
};

export { createItemLink, deleteItemLink, listItemLinks };
