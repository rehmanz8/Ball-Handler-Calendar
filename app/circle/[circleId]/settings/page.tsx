import { notFound, redirect } from "next/navigation";
import CircleSettings from "@/components/calendar/CircleSettings";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function CircleSettingsPage({
  params
}: {
  params: { circleId: string };
}) {
  const supabase = createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) {
    redirect(`/auth?redirect=/circle/${params.circleId}/settings`);
  }

  const { data: circle } = await supabase
    .from("circles")
    .select("*")
    .eq("id", params.circleId)
    .maybeSingle();

  if (!circle) {
    notFound();
  }

  const { data: members } = await supabase
    .from("circle_members")
    .select("*")
    .eq("circle_id", params.circleId);

  const currentMember = members?.find((member) => member.user_id === auth.user!.id);
  if (!currentMember) {
    redirect(`/join/${params.circleId}`);
  }

  return (
    <main className="mx-auto min-h-screen max-w-4xl space-y-6 px-6 py-12">
      <div>
        <h1 className="text-3xl font-semibold">Circle settings</h1>
        <p className="text-slate-300">Manage members and circle details.</p>
      </div>
      <CircleSettings
        circle={circle}
        members={(members || []) as any}
        currentUserId={auth.user!.id}
      />
    </main>
  );
}
