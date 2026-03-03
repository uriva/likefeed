import { db } from "../db.ts";

const isValidUuid = (s: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

type FeedEntry = {
  readonly kind: "reaction" | "comment" | "link";
  readonly createdAt: number;
  readonly url: string;
  readonly title: string;
  readonly detail: string;
};

const buildFeedEntries = async (userId: string): Promise<readonly FeedEntry[]> => {
  const [reactionsResult, commentsResult, linksResult] = await Promise.all([
    db.query({
      reactions: {
        $: { where: { "user.id": userId }, order: { createdAt: "desc" } },
        item: {},
      },
    }),
    db.query({
      comments: {
        $: { where: { "user.id": userId }, order: { createdAt: "desc" } },
        item: {},
      },
    }),
    db.query({
      itemLinks: {
        $: { where: { "user.id": userId }, order: { createdAt: "desc" } },
        sourceItem: {},
        targetItem: {},
      },
    }),
  ]);

  const reactionEntries: FeedEntry[] = reactionsResult.reactions.map((r) => ({
    kind: "reaction",
    createdAt: r.createdAt,
    url: r.item?.url ?? "",
    title: r.item?.title ?? r.item?.url ?? "",
    detail: r.type,
  }));

  const commentEntries: FeedEntry[] = commentsResult.comments.map((c) => ({
    kind: "comment",
    createdAt: c.createdAt,
    url: c.item?.url ?? "",
    title: c.item?.title ?? c.item?.url ?? "",
    detail: c.text,
  }));

  const linkEntries: FeedEntry[] = linksResult.itemLinks.map((l) => ({
    kind: "link",
    createdAt: l.createdAt,
    url: l.sourceItem?.url ?? "",
    title: `${l.sourceItem?.title || l.sourceItem?.url} → ${l.targetItem?.title || l.targetItem?.url}`,
    detail: l.targetItem?.url ?? "",
  }));

  return [...reactionEntries, ...commentEntries, ...linkEntries].sort(
    (a, b) => b.createdAt - a.createdAt,
  );
};

const getUserEmail = async (userId: string): Promise<string> => {
  const { $users } = await db.query({
    $users: { $: { where: { id: userId } } },
  });
  return $users[0]?.email ?? "unknown";
};

const getFeed = async (
  _req: Request,
  params: Record<string, string>,
): Promise<Response> => {
  const userId = params.userId!;
  if (!isValidUuid(userId))
    return Response.json(
      { error: "Invalid user ID", code: "INVALID_INPUT" },
      { status: 400 },
    );
  const [entries, email] = await Promise.all([
    buildFeedEntries(userId),
    getUserEmail(userId),
  ]);
  return Response.json({ user: { id: userId, email }, entries });
};

const escapeXml = (s: string): string =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const entryToRssItem = (entry: FeedEntry): string => {
  const date = new Date(entry.createdAt).toUTCString();
  const description =
    entry.kind === "reaction"
      ? `${entry.detail}d ${entry.url}`
      : entry.kind === "comment"
        ? entry.detail
        : `linked to ${entry.detail}`;
  return `    <item>
      <title>${escapeXml(entry.title)}</title>
      <link>${escapeXml(entry.url)}</link>
      <description>${escapeXml(description)}</description>
      <pubDate>${date}</pubDate>
      <guid>${escapeXml(entry.url)}-${entry.createdAt}</guid>
    </item>`;
};

const getFeedRss = async (
  _req: Request,
  params: Record<string, string>,
): Promise<Response> => {
  const userId = params.userId!;
  if (!isValidUuid(userId))
    return Response.json(
      { error: "Invalid user ID", code: "INVALID_INPUT" },
      { status: 400 },
    );
  const [entries, email] = await Promise.all([
    buildFeedEntries(userId),
    getUserEmail(userId),
  ]);

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>likefeed - ${escapeXml(email)}</title>
    <description>likes, comments, and links from ${escapeXml(email)}</description>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${entries.map(entryToRssItem).join("\n")}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: { "content-type": "application/rss+xml; charset=utf-8" },
  });
};

export { getFeed, getFeedRss };
