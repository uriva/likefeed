import type { ComponentChildren } from "preact";
import { useState } from "preact/hooks";
import { useQuery, useAuth } from "./db.ts";

// @ts-ignore: Vite injects import.meta.env at build time
const API_BASE: string = import.meta.env.VITE_API_BASE_URL ?? "";

const apiHeaders = (userToken: string) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${userToken}`,
});

const Card = ({
  title,
  children,
}: {
  title: string;
  children: ComponentChildren;
}) => (
  <div class="bg-slate-800 rounded-xl border border-slate-700 p-6">
    <h2 class="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4">
      {title}
    </h2>
    {children}
  </div>
);

const FeedUrls = ({ userId }: { userId: string }) => {
  const [copied, setCopied] = useState<string | null>(null);
  const feedJson = `${API_BASE || window.location.origin}/v1/feed/${userId}`;
  const feedRss = `${API_BASE || window.location.origin}/v1/feed/${userId}/rss`;
  const feedPage = `${window.location.origin}/feed/${userId}`;

  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <Card title="Your feed">
      <div class="space-y-3">
        <div>
          <div class="text-xs text-slate-400 mb-1">RSS feed (for readers)</div>
          <div class="flex items-center gap-2">
            <code class="flex-1 bg-slate-900 text-blue-300 px-3 py-2 rounded font-mono text-xs break-all select-all">
              {feedRss}
            </code>
            <button
              onClick={() => handleCopy(feedRss, "rss")}
              class="px-2 py-1 bg-blue-700 hover:bg-blue-600 text-white text-xs rounded transition-colors flex-shrink-0"
            >
              {copied === "rss" ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
        <div>
          <div class="text-xs text-slate-400 mb-1">JSON feed (for APIs)</div>
          <div class="flex items-center gap-2">
            <code class="flex-1 bg-slate-900 text-blue-300 px-3 py-2 rounded font-mono text-xs break-all select-all">
              {feedJson}
            </code>
            <button
              onClick={() => handleCopy(feedJson, "json")}
              class="px-2 py-1 bg-blue-700 hover:bg-blue-600 text-white text-xs rounded transition-colors flex-shrink-0"
            >
              {copied === "json" ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
        <div>
          <div class="text-xs text-slate-400 mb-1">Web page</div>
          <a
            href={feedPage}
            class="text-blue-400 hover:text-blue-300 text-sm"
          >
            {feedPage}
          </a>
        </div>
      </div>
    </Card>
  );
};

const AddReaction = ({ userToken }: { userToken: string }) => {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (type: "like" | "dislike") => {
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/v1/reactions`, {
        method: "POST",
        headers: apiHeaders(userToken),
        body: JSON.stringify({ url: url.trim(), type, title: title.trim() || undefined }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to add reaction");
      }
      setUrl("");
      setTitle("");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="Add reaction">
      <div class="space-y-3">
        <input
          type="text"
          value={url}
          onInput={(e: Event) => setUrl((e.target as HTMLInputElement).value)}
          placeholder="URL (e.g. https://example.com/article)"
          class="w-full bg-slate-900 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
        />
        <input
          type="text"
          value={title}
          onInput={(e: Event) => setTitle((e.target as HTMLInputElement).value)}
          placeholder="Title (optional)"
          class="w-full bg-slate-900 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
        />
        <div class="flex gap-2">
          <button
            onClick={() => submit("like")}
            disabled={loading || !url.trim()}
            class="flex-1 py-2 px-4 bg-green-700 hover:bg-green-600 disabled:bg-slate-700 disabled:text-slate-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {loading ? "..." : "Like"}
          </button>
          <button
            onClick={() => submit("dislike")}
            disabled={loading || !url.trim()}
            class="flex-1 py-2 px-4 bg-red-700 hover:bg-red-600 disabled:bg-slate-700 disabled:text-slate-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {loading ? "..." : "Dislike"}
          </button>
        </div>
        {error && <div class="text-red-400 text-sm">{error}</div>}
      </div>
    </Card>
  );
};

const AddComment = ({ userToken }: { userToken: string }) => {
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!url.trim() || !text.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/v1/comments`, {
        method: "POST",
        headers: apiHeaders(userToken),
        body: JSON.stringify({ url: url.trim(), text: text.trim(), title: title.trim() || undefined }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to add comment");
      }
      setUrl("");
      setText("");
      setTitle("");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="Add comment">
      <div class="space-y-3">
        <input
          type="text"
          value={url}
          onInput={(e: Event) => setUrl((e.target as HTMLInputElement).value)}
          placeholder="URL"
          class="w-full bg-slate-900 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
        />
        <input
          type="text"
          value={title}
          onInput={(e: Event) => setTitle((e.target as HTMLInputElement).value)}
          placeholder="Title (optional)"
          class="w-full bg-slate-900 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
        />
        <textarea
          value={text}
          onInput={(e: Event) => setText((e.target as HTMLTextAreaElement).value)}
          placeholder="Your comment"
          rows={3}
          class="w-full bg-slate-900 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 placeholder-slate-500 focus:border-blue-500 focus:outline-none resize-none"
        />
        <button
          onClick={submit}
          disabled={loading || !url.trim() || !text.trim()}
          class="w-full py-2 px-4 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {loading ? "Adding..." : "Add comment"}
        </button>
        {error && <div class="text-red-400 text-sm">{error}</div>}
      </div>
    </Card>
  );
};

const AddLink = ({ userToken }: { userToken: string }) => {
  const [sourceUrl, setSourceUrl] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [sourceTitle, setSourceTitle] = useState("");
  const [targetTitle, setTargetTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!sourceUrl.trim() || !targetUrl.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/v1/links`, {
        method: "POST",
        headers: apiHeaders(userToken),
        body: JSON.stringify({
          sourceUrl: sourceUrl.trim(),
          targetUrl: targetUrl.trim(),
          sourceTitle: sourceTitle.trim() || undefined,
          targetTitle: targetTitle.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to add link");
      }
      setSourceUrl("");
      setTargetUrl("");
      setSourceTitle("");
      setTargetTitle("");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="Link items">
      <div class="space-y-3">
        <div class="grid grid-cols-2 gap-3">
          <input
            type="text"
            value={sourceUrl}
            onInput={(e: Event) => setSourceUrl((e.target as HTMLInputElement).value)}
            placeholder="Source URL"
            class="bg-slate-900 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
          />
          <input
            type="text"
            value={targetUrl}
            onInput={(e: Event) => setTargetUrl((e.target as HTMLInputElement).value)}
            placeholder="Target URL"
            class="bg-slate-900 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
          />
          <input
            type="text"
            value={sourceTitle}
            onInput={(e: Event) => setSourceTitle((e.target as HTMLInputElement).value)}
            placeholder="Source title (optional)"
            class="bg-slate-900 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
          />
          <input
            type="text"
            value={targetTitle}
            onInput={(e: Event) => setTargetTitle((e.target as HTMLInputElement).value)}
            placeholder="Target title (optional)"
            class="bg-slate-900 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
          />
        </div>
        <button
          onClick={submit}
          disabled={loading || !sourceUrl.trim() || !targetUrl.trim()}
          class="w-full py-2 px-4 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 disabled:text-slate-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {loading ? "Linking..." : "Link items"}
        </button>
        {error && <div class="text-red-400 text-sm">{error}</div>}
      </div>
    </Card>
  );
};

const ReactionsList = ({ userId }: { userId: string }) => {
  const { isLoading, error, data } = useQuery({
    reactions: {
      $: { where: { "user.id": userId }, order: { createdAt: "desc" } },
      item: {},
    },
  });

  if (isLoading) return <div class="text-slate-400">Loading reactions...</div>;
  if (error) return <div class="text-red-400">Error: {error.message}</div>;

  const reactions = data?.reactions ?? [];

  return (
    <Card title={`Reactions (${reactions.length})`}>
      {reactions.length === 0 ? (
        <div class="text-slate-500 text-center py-4">
          No reactions yet. Like or dislike a URL above.
        </div>
      ) : (
        <div class="space-y-2">
          {reactions.map(
            (r: { id: string; type: string; createdAt: number; item?: { url: string; title?: string } }) => (
              <div
                key={r.id}
                class="flex items-center gap-3 p-3 bg-slate-900 rounded-lg border border-slate-700"
              >
                <span
                  class={`text-lg ${r.type === "like" ? "text-green-400" : "text-red-400"}`}
                >
                  {r.type === "like" ? "+" : "-"}
                </span>
                <div class="flex-1 min-w-0">
                  <a
                    href={r.item?.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-sm text-blue-400 hover:text-blue-300 truncate block"
                  >
                    {r.item?.title || r.item?.url || ""}
                  </a>
                </div>
                <span class="text-xs text-slate-500 flex-shrink-0">
                  {new Date(r.createdAt).toLocaleDateString()}
                </span>
              </div>
            ),
          )}
        </div>
      )}
    </Card>
  );
};

const CommentsList = ({ userId }: { userId: string }) => {
  const { isLoading, error, data } = useQuery({
    comments: {
      $: { where: { "user.id": userId }, order: { createdAt: "desc" } },
      item: {},
    },
  });

  if (isLoading) return <div class="text-slate-400">Loading comments...</div>;
  if (error) return <div class="text-red-400">Error: {error.message}</div>;

  const comments = data?.comments ?? [];

  return (
    <Card title={`Comments (${comments.length})`}>
      {comments.length === 0 ? (
        <div class="text-slate-500 text-center py-4">
          No comments yet.
        </div>
      ) : (
        <div class="space-y-2">
          {comments.map(
            (c: { id: string; text: string; createdAt: number; item?: { url: string; title?: string } }) => (
              <div
                key={c.id}
                class="p-3 bg-slate-900 rounded-lg border border-slate-700"
              >
                <a
                  href={c.item?.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-xs text-blue-400 hover:text-blue-300 truncate block mb-1"
                >
                  {c.item?.title || c.item?.url || ""}
                </a>
                <p class="text-sm text-slate-300">{c.text}</p>
                <span class="text-xs text-slate-500">
                  {new Date(c.createdAt).toLocaleDateString()}
                </span>
              </div>
            ),
          )}
        </div>
      )}
    </Card>
  );
};

const ApiKeySection = ({ userToken }: { userToken: string }) => {
  const { user } = useAuth();
  const { isLoading, data } = useQuery({
    apiKeys: {
      $: { where: { "user.id": user?.id ?? "" } },
    },
  });

  const [creating, setCreating] = useState(false);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCreate = async () => {
    setCreating(true);
    setCreateError(null);
    try {
      const res = await fetch(`${API_BASE}/v1/api-keys`, {
        method: "POST",
        headers: apiHeaders(userToken),
        body: JSON.stringify({ name: "API key" }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create API key");
      }
      const { data: keyData } = await res.json();
      setCreatedKey(keyData.key);
    } catch (e: unknown) {
      setCreateError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (apiKeyId: string) => {
    setDeletingId(apiKeyId);
    try {
      await fetch(`${API_BASE}/v1/api-keys/${apiKeyId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${userToken}` },
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const keys = data?.apiKeys ?? [];

  return (
    <Card title="API keys">
      {createdKey && (
        <div class="p-3 bg-emerald-900/30 border border-emerald-700 rounded-lg mb-4">
          <div class="text-emerald-300 text-sm mb-1">
            Key created. Copy it now -- it won't be shown again.
          </div>
          <div class="flex items-center gap-2">
            <code class="flex-1 bg-slate-900 text-emerald-200 px-3 py-2 rounded font-mono text-xs break-all select-all">
              {createdKey}
            </code>
            <button
              onClick={() => handleCopy(createdKey)}
              class="px-2 py-1 bg-emerald-700 hover:bg-emerald-600 text-white text-xs rounded transition-colors flex-shrink-0"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <button
            onClick={() => setCreatedKey(null)}
            class="block mt-2 text-xs text-slate-400 hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}

      {!isLoading && keys.length > 0 && (
        <div class="space-y-2 mb-4">
          {keys.map(
            (k: { id: string; prefix: string; name: string; createdAt: number }) => (
              <div
                key={k.id}
                class="flex items-center justify-between p-2 bg-slate-900 rounded border border-slate-700"
              >
                <span class="text-sm text-white font-mono">
                  {k.prefix}...
                </span>
                <button
                  onClick={() => handleDelete(k.id)}
                  disabled={deletingId === k.id}
                  class="text-xs text-red-400 hover:text-red-300 disabled:text-slate-600 transition-colors"
                >
                  {deletingId === k.id ? "..." : "Delete"}
                </button>
              </div>
            ),
          )}
        </div>
      )}

      <button
        onClick={handleCreate}
        disabled={creating}
        class="w-full px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white text-sm font-medium rounded-lg transition-colors"
      >
        {creating ? "Creating..." : "Generate API key"}
      </button>

      {createError && <div class="text-red-400 text-sm mt-2">{createError}</div>}
    </Card>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  // @ts-ignore: user.token exists at runtime from InstantDB auth
  const userToken: string = user?.token ?? "";
  const userId = user?.id ?? "";

  return (
    <div class="space-y-6">
      <FeedUrls userId={userId} />
      <div class="grid sm:grid-cols-3 gap-6">
        <AddReaction userToken={userToken} />
        <AddComment userToken={userToken} />
        <AddLink userToken={userToken} />
      </div>
      <ReactionsList userId={userId} />
      <CommentsList userId={userId} />
      <ApiKeySection userToken={userToken} />
    </div>
  );
};

export { Dashboard };
