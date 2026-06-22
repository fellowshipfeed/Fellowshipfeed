import Link from 'next/link';

const features = [
  {
    title: 'Member feed',
    description: 'Share updates with your groups and stay connected between Sundays.',
  },
  {
    title: 'Thoughtful moderation',
    description: 'Group admins review posts before they go live — keeping conversation kind and on-mission.',
  },
  {
    title: 'Built for parishes',
    description: 'Head admins and owners get the tools to run groups, assign leaders, and oversee the community.',
  },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <header className="px-6 py-5 border-b border-line/60 bg-cream/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent text-white flex items-center justify-center font-display font-semibold shadow-sm">
              F
            </div>
            <span className="font-display text-xl font-medium tracking-tight text-ink">FellowshipFeed</span>
          </div>
          <Link
            href="/login"
            className="text-sm font-medium text-accent hover:text-accent-hover transition-colors"
          >
            Sign in
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <section className="max-w-3xl mx-auto px-6 pt-20 pb-16 text-center">
          <p className="text-xs uppercase tracking-[0.2em] font-semibold text-accent mb-5">
            Faith community platform
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-medium tracking-tight text-ink leading-[1.15] mb-6">
            The operating system for your faith community
          </h1>
          <p className="text-lg text-ink-soft leading-relaxed mb-10 max-w-2xl mx-auto">
            FellowshipFeed brings your parish together in one place — a warm, moderated feed for members,
            simple tools for group leaders, and clear oversight for those who shepherd the community.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 bg-accent text-white font-medium px-7 py-3 rounded-lg hover:bg-accent-hover transition-colors shadow-sm"
          >
            Sign in
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <p className="text-xs text-ink-muted mt-4">Magic-link sign-in · No password required</p>
        </section>

        <section className="border-t border-line/60 bg-cream-soft">
          <div className="max-w-5xl mx-auto px-6 py-16">
            <div className="grid sm:grid-cols-3 gap-5">
              {features.map(feature => (
                <div
                  key={feature.title}
                  className="bg-white border border-line rounded-xl p-6 text-left shadow-sm"
                >
                  <div className="w-8 h-8 rounded-md bg-accent-soft text-accent flex items-center justify-center mb-4">
                    <span className="w-2 h-2 rounded-full bg-current" />
                  </div>
                  <h2 className="font-display text-lg font-medium text-ink mb-2">{feature.title}</h2>
                  <p className="text-sm text-ink-soft leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="px-6 py-6 border-t border-line/60">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-xs text-ink-muted">
          <span className="font-display text-ink-soft">FellowshipFeed</span>
          <span>Built for parishes, groups, and fellowship</span>
        </div>
      </footer>
    </div>
  );
}
