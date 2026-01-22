"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import JoinCircleForm from "@/components/forms/JoinCircleForm";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function JoinCirclePage({ params }: { params: { circleId: string } }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createSupabaseBrowserClient();
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.replace(`/auth?redirect=/join/${params.circleId}`);
        return;
      }

      const { data: existing } = await supabase
        .from("circle_members")
        .select("id")
        .eq("circle_id", params.circleId)
        .eq("user_id", data.user.id)
        .maybeSingle();

      if (existing) {
        router.replace(`/circle/${params.circleId}`);
        return;
      }

      setReady(true);
    };

    checkUser();
  }, [params.circleId, router]);

  if (!ready) {
    return (
      <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-6 px-6">
        <p className="text-slate-300">Loading...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-6 px-6">
      <h1 className="text-3xl font-semibold">Join this circle</h1>
      <p className="text-slate-300">Add your display name and timezone to start scheduling.</p>
      <JoinCircleForm circleId={params.circleId} />
    </main>
  );
}
