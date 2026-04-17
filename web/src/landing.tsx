import { useAuth } from "./db.ts";

const Landing = () => {
  const { user } = useAuth();
  const ctaHref = user ? "/app" : "/login";

  return (
    <div>
      <section class="pt-24 pb-12 text-center px-4">
        <h1 class="text-5xl sm:text-6xl font-extrabold text-white tracking-tight mb-6">
          share what you like
        </h1>
        <p class="text-xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed">
          Social media gave us curation but took away control. LLMs can now do
          the curation. All that's left is the social signal: what do the people
          you trust actually like?
        </p>
        <p class="text-lg text-slate-400 max-w-xl mx-auto mb-10">
          likefeed lets you publish your likes, dislikes, and comments on any
          URL as a public RSS feed. Subscribe to people whose taste you trust.
          No algorithm. No feed manipulation. Just RSS.
        </p>
        <div class="flex gap-4 justify-center flex-wrap">
          <a
            href={ctaHref}
            class="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors"
          >
            Get started
          </a>
          <a
            href="#how-it-works"
            class="px-6 py-3 border border-slate-600 hover:border-slate-400 text-slate-300 font-medium rounded-lg transition-colors"
          >
            How it works
          </a>
        </div>
      </section>

      <section class="py-16 px-4" id="how-it-works">
        <div class="max-w-3xl mx-auto">
          <h2 class="text-3xl font-bold text-white mb-4 text-center">
            how it works
          </h2>
          <p class="text-slate-400 text-center mb-10 max-w-xl mx-auto">
            React to URLs, add comments, link related things together. Your
            activity becomes a public feed anyone can subscribe to.
          </p>
          <div class="grid sm:grid-cols-3 gap-6">
            <div class="bg-slate-800/50 border border-slate-700 rounded-xl p-6 text-center">
              <div class="text-3xl mb-3">1</div>
              <h3 class="text-white font-medium mb-2">React to URLs</h3>
              <p class="text-slate-400 text-sm">
                Like or dislike any URL. Add comments. Link related items
                together.
              </p>
            </div>
            <div class="bg-slate-800/50 border border-slate-700 rounded-xl p-6 text-center">
              <div class="text-3xl mb-3">2</div>
              <h3 class="text-white font-medium mb-2">Get your feed URL</h3>
              <p class="text-slate-400 text-sm">
                Your activity is published as an RSS feed. Share the URL with
                anyone.
              </p>
            </div>
            <div class="bg-slate-800/50 border border-slate-700 rounded-xl p-6 text-center">
              <div class="text-3xl mb-3">3</div>
              <h3 class="text-white font-medium mb-2">Subscribe to others</h3>
              <p class="text-slate-400 text-sm">
                Add other people's feed URLs to your RSS reader. See what they
                like.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section class="py-16 px-4">
        <div class="max-w-3xl mx-auto">
          <h2 class="text-3xl font-bold text-white mb-6 text-center">
            why RSS again?
          </h2>
          <div class="text-slate-400 leading-relaxed space-y-4 text-center max-w-2xl mx-auto">
            <p>
              Social media won because it solved curation. Following people
              whose taste you trust was better than browsing the open web
              randomly. But it came with a cost: the platform owns your feed,
              your attention, your data.
            </p>
            <p>
              Now LLMs can curate the open web for you. The one thing they can't
              replace is the social signal. What did your friend think about
              that article? What tools is that developer you respect actually
              using?
            </p>
            <p class="text-slate-300">
              likefeed gives that social layer back to RSS. No platform needed.
              Just people sharing what they find interesting, in a format any
              reader can consume.
            </p>
          </div>
        </div>
      </section>

      <section class="py-16 px-4">
        <div class="max-w-3xl mx-auto">
          <h2 class="text-3xl font-bold text-white mb-6 text-center">
            API access
          </h2>
          <div class="text-slate-400 leading-relaxed space-y-4 text-center max-w-2xl mx-auto">
            <p>
              Everything works via REST API too. Generate an API key from your
              dashboard and integrate likefeed into your workflow, browser
              extension, or bot.
            </p>
            <p class="text-slate-300">
              POST reactions, comments, and links. GET your feed as JSON or RSS.
              Simple endpoints, no SDK required.
            </p>
          </div>
        </div>
      </section>

      <section class="text-center pb-24 px-4">
        <h2 class="text-3xl font-bold text-white mb-4">
          start sharing your taste
        </h2>
        <p class="text-slate-400 mb-8">
          Sign up, react to some URLs, share your feed. Takes about a minute.
        </p>
        <a
          href={ctaHref}
          class="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors text-lg"
        >
          Get started
        </a>
      </section>

      <footer class="border-t border-slate-800 py-8 px-4 text-center text-slate-500 text-sm">
        <p>likefeed -- share what you like, via RSS</p>
      </footer>
    </div>
  );
};

export { Landing };
