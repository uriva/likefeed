import { db, id } from "../db.ts";
import type { CreateCommentInput, ApiResponse } from "../types.ts";
import { getOrCreateItem } from "./reactions.ts";

const createComment = async (
  req: Request,
  _params: Record<string, string>,
  userId: string,
): Promise<Response> => {
  const input = (await req.json()) as CreateCommentInput;
  const itemId = await getOrCreateItem(input.url, input.title);

  const commentId = id();
  await db.transact([
    db.tx.comments[commentId]!.update({
      text: input.text,
      createdAt: Date.now(),
    }),
    db.tx.comments[commentId]!.link({ user: userId, item: itemId }),
  ]);

  return Response.json(
    { data: { id: commentId, text: input.text, url: input.url } } satisfies ApiResponse<unknown>,
    { status: 201 },
  );
};

const listComments = async (
  _req: Request,
  _params: Record<string, string>,
  userId: string,
): Promise<Response> => {
  const { comments } = await db.query({
    comments: {
      $: { where: { "user.id": userId }, order: { createdAt: "desc" } },
      item: {},
    },
  });
  return Response.json({
    data: comments.map((c) => ({
      id: c.id,
      text: c.text,
      url: c.item?.url ?? "",
      title: c.item?.title ?? "",
      createdAt: c.createdAt,
    })),
  } satisfies ApiResponse<unknown>);
};

const deleteComment = async (
  _req: Request,
  params: Record<string, string>,
  userId: string,
): Promise<Response> => {
  const { comments } = await db.query({
    comments: {
      $: { where: { id: params.commentId!, "user.id": userId } },
    },
  });
  if (!comments[0]) {
    return Response.json(
      { error: "Comment not found", code: "NOT_FOUND" },
      { status: 404 },
    );
  }
  await db.transact([db.tx.comments[comments[0].id]!.delete()]);
  return new Response(null, { status: 204 });
};

export { createComment, listComments, deleteComment };
