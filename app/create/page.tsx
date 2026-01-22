import { redirect } from "next/navigation";
import CreateCircleForm from "@/components/forms/CreateCircleForm";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function CreatePage() {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/auth?redirect=/create");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-6 px-6">
      <h1 className="text-3xl font-semibold">Create a Circle</h1>
      <p className="text-slate-300">
        Spin up a shared calendar and invite anyone with your link.
      </p>
      <CreateCircleForm />
    </main>
  );
}
