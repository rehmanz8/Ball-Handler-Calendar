"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@/lib/zod-resolver";
import { z } from "zod";
import { DateTime } from "luxon";
import { EventOccurrence } from "@/lib/types";

const schema = z
  .object({
    title: z.string().min(1),
    description: z.string().optional(),
    startAt: z.string().min(1),
    endAt: z.string().min(1),
    isAllDay: z.boolean(),
    recurrence: z.enum(["none", "weekly"]),
    interval: z.string().optional(),
    days: z.array(z.string()).optional(),
    recurrenceStart: z.string().optional(),
    recurrenceEnd: z.string().optional()
  })
  .refine((data) => data.endAt > data.startAt, {
    message: "End must be after start",
    path: ["endAt"]
  });

type FormValues = z.infer<typeof schema>;

const WEEK_DAYS = [
  { label: "Mon", value: "MO" },
  { label: "Tue", value: "TU" },
  { label: "Wed", value: "WE" },
  { label: "Thu", value: "TH" },
  { label: "Fri", value: "FR" },
  { label: "Sat", value: "SA" },
  { label: "Sun", value: "SU" }
];

function toLocalInput(value: string, timezone: string) {
  return DateTime.fromISO(value, { zone: "utc" })
    .setZone(timezone)
    .toFormat("yyyy-LL-dd'T'HH:mm");
}

export default function EventModal({
  open,
  onClose,
  onSubmit,
  timezone,
  event,
  isOwner
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: {
    title: string;
    description?: string;
    startAt: string;
    endAt: string;
    isAllDay: boolean;
    recurrenceRule: string | null;
    recurrenceStart: string | null;
    recurrenceEnd: string | null;
  }) => void;
  timezone: string;
  event?: EventOccurrence | null;
  isOwner: boolean;
}) {
  const defaultValues = useMemo(() => {
    if (!event) return undefined;

    return {
      title: event.title,
      description: event.description ?? "",
      startAt: toLocalInput(event.occurrence_start, timezone),
      endAt: toLocalInput(event.occurrence_end, timezone),
      isAllDay: event.is_all_day,
      recurrence: event.recurrence_rule ? "weekly" : "none",
      interval: event.recurrence_rule?.match(/INTERVAL=(\d+)/)?.[1] ?? "1",
      days: event.recurrence_rule?.match(/BYDAY=([A-Z,]+)/)?.[1]?.split(",") ?? [],
      recurrenceStart: event.recurrence_start ?? "",
      recurrenceEnd: event.recurrence_end ?? ""
    };
  }, [event, timezone]);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors }
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues
  });

  useEffect(() => {
    if (defaultValues) {
      reset(defaultValues);
    }
  }, [defaultValues, reset]);

  const recurrence = watch("recurrence");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6">
      <div className="w-full max-w-xl rounded-xl bg-slate-900 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">{event ? "Event" : "New event"}</h2>
          <button
            type="button"
            className="text-sm text-slate-400"
            onClick={onClose}
          >
            Close
          </button>
        </div>
        <form
          className="mt-4 space-y-4"
          onSubmit={handleSubmit((values) => {
            const startAt = DateTime.fromFormat(values.startAt, "yyyy-LL-dd'T'HH:mm", {
              zone: timezone
            })
              .toUTC()
              .toISO();
            const endAt = DateTime.fromFormat(values.endAt, "yyyy-LL-dd'T'HH:mm", {
              zone: timezone
            })
              .toUTC()
              .toISO();

            const recurrenceRule =
              values.recurrence === "weekly"
                ? `FREQ=WEEKLY;INTERVAL=${values.interval || "1"};BYDAY=${
                    values.days?.join(",") || "MO"
                  }`
                : null;

            onSubmit({
              title: values.title,
              description: values.description,
              startAt: startAt || values.startAt,
              endAt: endAt || values.endAt,
              isAllDay: values.isAllDay,
              recurrenceRule,
              recurrenceStart: recurrenceRule ? values.recurrenceStart || null : null,
              recurrenceEnd: recurrenceRule ? values.recurrenceEnd || null : null
            });
          })}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-slate-200">Title</label>
              <input
                className="w-full rounded-md border border-slate-700 bg-white px-3 py-2 text-sm"
                {...register("title")}
                disabled={!isOwner && !!event}
              />
              {errors.title && <p className="text-sm text-rose-300">{errors.title.message}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-200">Start</label>
              <input
                className="w-full rounded-md border border-slate-700 bg-white px-3 py-2 text-sm"
                type="datetime-local"
                {...register("startAt")}
                disabled={!isOwner && !!event}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-200">End</label>
              <input
                className="w-full rounded-md border border-slate-700 bg-white px-3 py-2 text-sm"
                type="datetime-local"
                {...register("endAt")}
                disabled={!isOwner && !!event}
              />
              {errors.endAt && <p className="text-sm text-rose-300">{errors.endAt.message}</p>}
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-200 md:col-span-2">
              <input type="checkbox" {...register("isAllDay")} disabled={!isOwner && !!event} />
              All day
            </label>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-slate-200">Description</label>
              <textarea
                className="w-full rounded-md border border-slate-700 bg-white px-3 py-2 text-sm"
                rows={3}
                {...register("description")}
                disabled={!isOwner && !!event}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-200">Recurrence</label>
              <select
                className="w-full rounded-md border border-slate-700 bg-white px-3 py-2 text-sm"
                {...register("recurrence")}
                disabled={!isOwner && !!event}
              >
                <option value="none">None</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
            {recurrence === "weekly" && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-200">Interval (weeks)</label>
                  <input
                    className="w-full rounded-md border border-slate-700 bg-white px-3 py-2 text-sm"
                    type="number"
                    min={1}
                    defaultValue={1}
                    {...register("interval")}
                    disabled={!isOwner && !!event}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <p className="text-sm font-medium text-slate-200">Days of week</p>
                  <div className="flex flex-wrap gap-2">
                    {WEEK_DAYS.map((day) => (
                      <label key={day.value} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          value={day.value}
                          {...register("days")}
                          disabled={!isOwner && !!event}
                        />
                        {day.label}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-200">Repeat start</label>
                  <input
                    className="w-full rounded-md border border-slate-700 bg-white px-3 py-2 text-sm"
                    type="date"
                    {...register("recurrenceStart")}
                    disabled={!isOwner && !!event}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-200">Repeat end</label>
                  <input
                    className="w-full rounded-md border border-slate-700 bg-white px-3 py-2 text-sm"
                    type="date"
                    {...register("recurrenceEnd")}
                    disabled={!isOwner && !!event}
                  />
                </div>
              </>
            )}
          </div>
          <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
            <button type="button" className="text-sm text-slate-400" onClick={onClose}>
              Cancel
            </button>
            {isOwner && (
              <button
                type="submit"
                className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-slate-900"
              >
                {event ? "Save changes" : "Create event"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
