"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@/lib/zod-resolver";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const schema = z.object({
  email: z.string().email("Enter a valid email")
});

type FormValues = z.infer<typeof schema>;

export default function AuthForm({ redirectTo }: { redirectTo?: string }) {
  const [status, setStatus] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setStatus(null);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: values.email,
      options: {
        emailRedirectTo: redirectTo || `${window.location.origin}/create`
      }
    });

    if (error) {
      setStatus(error.message);
      return;
    }

    setStatus("Magic link sent! Check your email.");
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-200">Email</label>
        <input
          className="w-full rounded-md border border-slate-700 bg-white px-3 py-2 text-sm"
          placeholder="you@example.com"
          type="email"
          {...register("email")}
        />
        {errors.email && <p className="text-sm text-rose-300">{errors.email.message}</p>}
      </div>
      <button
        type="submit"
        className="w-full rounded-md bg-white px-4 py-2 text-sm font-semibold text-slate-900"
        disabled={isSubmitting}
      >
        Send magic link
      </button>
      {status && <p className="text-sm text-slate-300">{status}</p>}
    </form>
  );
}
