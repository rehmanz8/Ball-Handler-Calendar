"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CircleCalendar from "@/components/calendar/CircleCalendar";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Circle, CircleMember, EventRecord } from "@/lib/types";

export default function CirclePage({ params }: { params: { circleId: string } }) {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "ready" | "not-found">("loading");
  const [circle, setCircle] = useState<Circle | null>(null);
  const [members, setMembers] = useState<CircleMember[]>([]);
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const supabase = createSupabaseBrowserClient();
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        router.replace(`/auth?redirect=/circle/${params.circleId}`);
        return;
      }

      setCurrentUserId(auth.user.id);

      const { data: circleData } = await supabase
        .from("circles")
        .select("*")
        .eq("id", params.circleId)
        .maybeSingle();

      if (!circleData) {
        setStatus("not-found");
        return;
      }

      const { data: membership } = await supabase
        .from("circle_members")
        .select("id")
        .eq("circle_id", params.circleId)
        .eq("user_id", auth.user.id)
        .maybeSingle();

      if (!membership) {
        router.replace(`/join/${params.circleId}`);
        return;
      }

      const [{ data: membersData }, { data: eventsData }] = await Promise.all([
        supabase.from("circle_members").select("*").eq("circle_id", params.circleId),
        supabase.from("events").select("*").eq("circle_id", params.circleId)
      ]);

      setCircle(circleData as Circle);
      setMembers((membersData || []) as CircleMember[]);
      setEvents((eventsData || []) as EventRecord[]);
      setStatus("ready");
    };

    loadData();
  }, [params.circleId, router]);

  if (status === "not-found") {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-4 px-6 text-center">
        <h1 className="text-3xl font-semibold">Circle not found</h1>
        <p className="text-slate-300">We couldn&apos;t find that circle.</p>
      </main>
    );
  }

  if (status !== "ready" || !circle || !currentUserId) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-4 px-6 text-center">
        <p className="text-slate-300">Loading...</p>
      </main>
    );
  }

  return (
    <CircleCalendar
      circle={circle}
      members={members}
      events={events}
      currentUserId={currentUserId}
    />
  );
}
