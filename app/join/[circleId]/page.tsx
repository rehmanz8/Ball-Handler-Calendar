import { redirect } from "next/navigation";
import JoinCircleForm from "@/components/forms/JoinCircleForm";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function JoinCirclePage({ params }: { params: { circleId: string } }) {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect(`/auth?redirect=/join/${params.circleId}`);
  }

  const { data: existing } = await supabase
    .from("circle_members")
    .select("id")
    .eq("circle_id", params.circleId)
    .eq("user_id", data.user.id)
    .maybeSingle();

  if (existing) {
    redirect(`/circle/${params.circleId}`);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-6 px-6">
      <h1 className="text-3xl font-semibold">Join this circle</h1>
      <p className="text-slate-300">
        Add your display name and timezone to start scheduling.
      </p>
      <JoinCircleForm circleId={params.circleId} />
    </main>
  );
}
