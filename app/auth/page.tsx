import AuthForm from "@/components/forms/AuthForm";

export default function AuthPage({
  searchParams
}: {
  searchParams: { redirect?: string };
}) {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-6 px-6">
      <h1 className="text-3xl font-semibold">Sign in to Circle Calendar</h1>
      <p className="text-slate-300">
        Use your email to get a magic link. We&apos;ll take you right back to the circle you
        wanted.
      </p>
      <AuthForm redirectTo={searchParams?.redirect} />
    </main>
  );
}
