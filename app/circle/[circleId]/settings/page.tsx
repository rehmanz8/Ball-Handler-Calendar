"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CircleSettings from "@/components/calendar/CircleSettings";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Circle, CircleMember } from "@/lib/types";

export default function CircleSettingsPage({ params }: { params: { circleId: string } }) {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "ready" | "not-found">("loading");
  const [circle, setCircle] = useState<Circle | null>(null);
  const [members, setMembers] = useState<CircleMember[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const supabase = createSupabaseBrowserClient();
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        router.replace(`/auth?redirect=/circle/${params.circleId}/settings`);
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

      const { data: membersData } = await supabase
        .from("circle_members")
        .select("*")
        .eq("circle_id", params.circleId);

      const membership = membersData?.find((member) => member.user_id === auth.user!.id);
      if (!membership) {
        router.replace(`/join/${params.circleId}`);
        return;
      }

      setCircle(circleData as Circle);
      setMembers((membersData || []) as CircleMember[]);
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
    <main className="mx-auto min-h-screen max-w-4xl space-y-6 px-6 py-12">
      <div>
        <h1 className="text-3xl font-semibold">Circle settings</h1>
        <p className="text-slate-300">Manage members and circle details.</p>
      </div>
      <CircleSettings circle={circle} members={members} currentUserId={currentUserId} />
    </main>
  );
}
