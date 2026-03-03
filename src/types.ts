export type ReactionType = "like" | "dislike";

export type CreateReactionInput = {
  readonly url: string;
  readonly type: ReactionType;
  readonly title?: string;
};

export type CreateCommentInput = {
  readonly url: string;
  readonly text: string;
  readonly title?: string;
};

export type CreateLinkInput = {
  readonly sourceUrl: string;
  readonly targetUrl: string;
  readonly sourceTitle?: string;
  readonly targetTitle?: string;
};

export type ApiResponse<T> = {
  readonly data: T;
};

export type ApiError = {
  readonly error: string;
  readonly code: string;
};
