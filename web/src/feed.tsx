import { useState, useEffect } from "preact/hooks";
import { useRoute } from "preact-iso";

// @ts-ignore: Vite injects import.meta.env at build time
const API_BASE: string = import.meta.env.VITE_API_BASE_URL ?? "";

type FeedEntry = {
  readonly kind: "reaction" | "comment" | "link";
  readonly createdAt: number;
  readonly url: string;
  readonly title: string;
  readonly detail: string;
};

type FeedData = {
  readonly user: { readonly id: string; readonly email: string };
  readonly entries: readonly FeedEntry[];
};

const KindBadge = ({ kind }: { kind: string }) => {
  const colors: Record<string, string> = {
    reaction: "bg-green-900/50 text-green-300",
    comment: "bg-blue-900/50 text-blue-300",
    link: "bg-purple-900/50 text-purple-300",
  };

  return (
    <span
      class={`text-xs px-2 py-0.5 rounded font-medium ${colors[kind] ?? "bg-slate-700 text-slate-300"}`}
    >
      {kind}
    </span>
  );
};

const FeedItem = ({ entry }: { entry: FeedEntry }) => (
  <div class="p-4 bg-slate-900 rounded-lg border border-slate-700">
    <div class="flex items-center gap-2 mb-2">
      <KindBadge kind={entry.kind} />
      <span class="text-xs text-slate-500">
        {new Date(entry.createdAt).toLocaleDateString()}
      </span>
    </div>
    <a
      href={entry.url}
      target="_blank"
      rel="noopener noreferrer"
      class="text-sm text-blue-400 hover:text-blue-300 block mb-1"
    >
      {entry.title || entry.url}
    </a>
    <p class="text-sm text-slate-400">{entry.detail}</p>
  </div>
);

const Feed = () => {
  const { params } = useRoute();
  const userId = params.userId ?? "";
  const [data, setData] = useState<FeedData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        const base = API_BASE || window.location.origin;
        const res = await fetch(`${base}/v1/feed/${userId}`);
        if (!res.ok) throw new Error("Failed to load feed");
        const json = await res.json();
        setData(json);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };
    fetchFeed();
  }, [userId]);

  if (loading) {
    return (
      <div class="flex items-center justify-center h-64">
        <div class="text-slate-400">Loading feed...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div class="flex items-center justify-center h-64">
        <div class="text-red-400">{error}</div>
      </div>
    );
  }

  if (!data) return null;

  const rssUrl = `${API_BASE || window.location.origin}/v1/feed/${userId}/rss`;

  return (
    <div class="max-w-2xl mx-auto">
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-white mb-1">
          {data.user.email}'s feed
        </h1>
        <a
          href={rssUrl}
          class="text-sm text-blue-400 hover:text-blue-300"
        >
          RSS feed
        </a>
      </div>
      {data.entries.length === 0 ? (
        <div class="text-slate-500 text-center py-12">
          This feed is empty.
        </div>
      ) : (
        <div class="space-y-3">
          {data.entries.map((entry, i) => (
            <FeedItem key={`${entry.url}-${entry.createdAt}-${i}`} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
};

export { Feed };
