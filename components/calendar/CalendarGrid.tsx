"use client";

import { DateTime } from "luxon";
import clsx from "clsx";
import { DEFAULT_TIME_SLOTS, WEEKDAY_LABELS } from "@/lib/constants";
import { EventOccurrence } from "@/lib/types";

type MemberMap = Record<string, { color: string; name: string }>;

type Props = {
  view: "week" | "day";
  baseDate: DateTime;
  timezone: string;
  events: EventOccurrence[];
  members: MemberMap;
  onSelectEvent: (event: EventOccurrence) => void;
  onNewEvent: (start: DateTime, end: DateTime) => void;
};

const hours = DEFAULT_TIME_SLOTS;

export default function CalendarGrid({
  view,
  baseDate,
  timezone,
  events,
  members,
  onSelectEvent,
  onNewEvent
}: Props) {
  const days = view === "week" ? 7 : 1;
  const start = view === "week" ? baseDate.startOf("week") : baseDate.startOf("day");

  const handleSlotClick = (dayIndex: number, hour: number) => {
    const startAt = start.plus({ days: dayIndex }).set({ hour, minute: 0 });
    const endAt = startAt.plus({ hours: 1 });
    onNewEvent(startAt, endAt);
  };

  const gridTemplate = `80px repeat(${days}, minmax(0, 1fr))`;

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
      <div
        className="grid border-b border-slate-800 text-xs text-slate-400"
        style={{ gridTemplateColumns: gridTemplate }}
      >
        <div className="px-3 py-2">Time</div>
        {Array.from({ length: days }).map((_, index) => {
          const day = start.plus({ days: index });
          return (
            <div key={day.toISODate()} className="px-3 py-2">
              <p className="text-slate-200">{WEEKDAY_LABELS[day.weekday - 1]}</p>
              <p>{day.toFormat("LLL d")}</p>
            </div>
          );
        })}
      </div>
      <div className="grid flex-1 overflow-y-auto" style={{ gridTemplateColumns: gridTemplate }}>
        <div className="flex flex-col border-r border-slate-800 text-xs text-slate-400">
          {hours.map((hour) => (
            <div
              key={hour}
              className="flex h-16 items-start justify-end px-3 pt-1"
            >
              {DateTime.fromObject({ hour }).toFormat("h a")}
            </div>
          ))}
        </div>
        {Array.from({ length: days }).map((_, dayIndex) => (
          <div key={dayIndex} className="relative border-r border-slate-800">
            {hours.map((hour) => (
              <button
                key={hour}
                type="button"
                onClick={() => handleSlotClick(dayIndex, hour)}
                className="flex h-16 w-full border-b border-slate-800 transition hover:bg-slate-800/60"
              />
            ))}
            {events
              .filter((event) => {
                const startAt = DateTime.fromISO(event.occurrence_start, { zone: "utc" }).setZone(
                  timezone
                );
                return startAt.hasSame(start.plus({ days: dayIndex }), "day");
              })
              .map((event) => {
                const startAt = DateTime.fromISO(event.occurrence_start, { zone: "utc" }).setZone(
                  timezone
                );
                const endAt = DateTime.fromISO(event.occurrence_end, { zone: "utc" }).setZone(
                  timezone
                );
                const top = ((startAt.hour - hours[0]) * 60 + startAt.minute) / (hours.length * 60);
                const height = endAt.diff(startAt, "minutes").minutes / (hours.length * 60);
                const member = members[event.owner_user_id];

                return (
                  <button
                    key={event.occurrence_id}
                    type="button"
                    onClick={() => onSelectEvent(event)}
                    className={clsx(
                      "absolute left-2 right-2 rounded-md p-2 text-left text-xs text-white shadow",
                      "transition hover:opacity-90"
                    )}
                    style={{
                      top: `${top * 100}%`,
                      height: `${Math.max(height * 100, 6)}%`,
                      backgroundColor: member?.color || "#64748B"
                    }}
                  >
                    <p className="font-semibold">{event.title}</p>
                    <p className="text-[11px] opacity-80">{member?.name}</p>
                  </button>
                );
              })}
          </div>
        ))}
      </div>
    </div>
  );
}
