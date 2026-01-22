import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center gap-10 px-6 py-16">
      <section className="space-y-4">
        <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Circle Calendar</p>
        <h1 className="text-4xl font-semibold md:text-6xl">
          Shared schedules for every circle in your life.
        </h1>
        <p className="max-w-2xl text-lg text-slate-300">
          Create a shared calendar, invite anyone with a link, and keep everyone in sync.
          Week and day views make it easy to see overlaps without friction.
        </p>
      </section>
      <section className="flex flex-wrap gap-4">
        <Link
          className="rounded-md bg-white px-6 py-3 text-sm font-semibold text-slate-900"
          href="/create"
        >
          Create a Circle
        </Link>
        <Link
          className="rounded-md border border-slate-700 px-6 py-3 text-sm font-semibold text-white"
          href="/auth"
        >
          Join a Circle
        </Link>
      </section>
    </main>
  );
}
