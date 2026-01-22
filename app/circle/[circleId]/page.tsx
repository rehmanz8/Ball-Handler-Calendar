import { notFound, redirect } from "next/navigation";
import CircleCalendar from "@/components/calendar/CircleCalendar";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function CirclePage({ params }: { params: { circleId: string } }) {
  const supabase = createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) {
    redirect(`/auth?redirect=/circle/${params.circleId}`);
  }

  const { data: circle } = await supabase
    .from("circles")
    .select("*")
    .eq("id", params.circleId)
    .maybeSingle();

  if (!circle) {
    notFound();
  }

  const { data: membership } = await supabase
    .from("circle_members")
    .select("id")
    .eq("circle_id", params.circleId)
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (!membership) {
    redirect(`/join/${params.circleId}`);
  }

  const [{ data: members }, { data: events }] = await Promise.all([
    supabase.from("circle_members").select("*").eq("circle_id", params.circleId),
    supabase.from("events").select("*").eq("circle_id", params.circleId)
  ]);

  return (
    <CircleCalendar
      circle={circle}
      members={(members || []) as any}
      events={(events || []) as any}
      currentUserId={auth.user.id}
    />
  );
}
