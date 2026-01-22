"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { getTimezones } from "@/lib/timezones";

const schema = z.object({
  displayName: z.string().min(2, "Display name is required"),
  timezone: z.string().min(1, "Timezone is required")
});

type FormValues = z.infer<typeof schema>;

export default function JoinCircleForm({ circleId }: { circleId: string }) {
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
    const response = await fetch("/api/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ circleId, ...values })
    });

    if (!response.ok) {
      const payload = await response.json();
      setError(payload.error || "Unable to join circle");
      return;
    }

    window.location.href = `/circle/${circleId}`;
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-200">Display name</label>
        <input
          className="w-full rounded-md border border-slate-700 bg-white px-3 py-2 text-sm"
          placeholder="Alex"
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
      <button
        type="submit"
        className="w-full rounded-md bg-white px-4 py-2 text-sm font-semibold text-slate-900"
        disabled={isSubmitting}
      >
        Join circle
      </button>
      {error && <p className="text-sm text-rose-300">{error}</p>}
    </form>
  );
}
