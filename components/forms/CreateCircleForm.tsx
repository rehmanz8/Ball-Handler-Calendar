"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@/lib/zod-resolver";
import { getTimezones } from "@/lib/timezones";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const schema = z.object({
  name: z.string().min(2, "Circle name is required"),
  displayName: z.string().min(2, "Display name is required"),
  timezone: z.string().min(1, "Timezone is required")
});

type FormValues = z.infer<typeof schema>;

export default function CreateCircleForm() {
  const [error, setError] = useState<string | null>(null);
  const timezones = useMemo(() => getTimezones(), []);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    }
  });

  const onSubmit = async (values: FormValues) => {
    setError(null);
    const supabase = createSupabaseBrowserClient();
    const { data } = await supabase.auth.getSession();
    const accessToken = data.session?.access_token;
    const response = await fetch("/api/circles", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
      },
      body: JSON.stringify(values)
    });

    if (!response.ok) {
      const payload = await response.json();
      setError(payload.error || "Unable to create circle");
      return;
    }

    const payload = await response.json();
    window.location.href = `/circle/${payload.circleId}`;
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-200">Circle name</label>
        <input
          className="w-full rounded-md border border-slate-700 bg-white px-3 py-2 text-sm"
          placeholder="Studio Team"
          {...register("name")}
        />
        {errors.name && <p className="text-sm text-rose-300">{errors.name.message}</p>}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-200">Display name</label>
          <input
            className="w-full rounded-md border border-slate-700 bg-white px-3 py-2 text-sm"
            placeholder="Avery"
            {...register("displayName")}
          />
          {errors.displayName && (
            <p className="text-sm text-rose-300">{errors.displayName.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-200">Timezone</label>
          <select
            className="w-full rounded-md border border-slate-700 bg-white px-3 py-2 text-sm"
            {...register("timezone")}
          >
            {timezones.map((timezone) => (
              <option key={timezone} value={timezone}>
                {timezone}
              </option>
            ))}
          </select>
          {errors.timezone && (
            <p className="text-sm text-rose-300">{errors.timezone.message}</p>
          )}
        </div>
      </div>
      <button
        type="submit"
        className="w-full rounded-md bg-white px-4 py-2 text-sm font-semibold text-slate-900"
        disabled={isSubmitting}
      >
        Create circle
      </button>
      {error && <p className="text-sm text-rose-300">{error}</p>}
    </form>
  );
}
