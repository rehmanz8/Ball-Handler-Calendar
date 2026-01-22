"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CreateCircleForm from "@/components/forms/CreateCircleForm";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function CreatePage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createSupabaseBrowserClient();
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.replace("/auth?redirect=/create");
        return;
      }
      setReady(true);
    };

    checkUser();
  }, [router]);

  if (!ready) {
    return (
      <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-6 px-6">
        <p className="text-slate-300">Loading...</p>
      </main>
    );
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
