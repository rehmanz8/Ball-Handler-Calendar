import { DateTime, Interval } from "luxon";
import { EventOccurrence, EventRecord } from "./types";

const WEEKDAY_MAP: Record<string, number> = {
  MO: 1,
  TU: 2,
  WE: 3,
  TH: 4,
  FR: 5,
  SA: 6,
  SU: 7
};

export function parseRecurrence(rule: string | null) {
  if (!rule) return null;
  const parts = rule.split(";");
  const data: Record<string, string> = {};
  for (const part of parts) {
    const [key, value] = part.split("=");
    if (key && value) data[key] = value;
  }
  if (data.FREQ !== "WEEKLY") return null;
  const interval = Number(data.INTERVAL || 1);
  const byDay = (data.BYDAY || "").split(",").filter(Boolean);
  return { interval, byDay };
}

export function expandRecurringEvent(
  event: EventRecord,
  range: Interval,
  timezone: string
): EventOccurrence[] {
  const rule = parseRecurrence(event.recurrence_rule);
  if (!rule || !event.recurrence_start || !event.recurrence_end) return [];

  const startDate = DateTime.fromISO(event.recurrence_start, { zone: timezone });
  const endDate = DateTime.fromISO(event.recurrence_end, { zone: timezone }).endOf("day");
  const eventStart = DateTime.fromISO(event.start_at, { zone: "utc" }).setZone(timezone);
  const eventEnd = DateTime.fromISO(event.end_at, { zone: "utc" }).setZone(timezone);

  const occurrences: EventOccurrence[] = [];
  let cursor = startDate.startOf("week");
  const days = rule.byDay.map((day) => WEEKDAY_MAP[day]).filter(Boolean);

  while (cursor <= endDate) {
    for (const weekday of days) {
      const day = cursor.plus({ days: weekday - 1 });
      if (day < startDate || day > endDate) continue;
      if (!range.contains(day)) continue;
      const start = day.set({ hour: eventStart.hour, minute: eventStart.minute });
      const duration = eventEnd.diff(eventStart);
      const end = start.plus(duration);

      occurrences.push({
        ...event,
        occurrence_id: `${event.id}_${day.toISODate()}`,
        occurrence_start: start.toUTC().toISO(),
        occurrence_end: end.toUTC().toISO()
      });
    }
    cursor = cursor.plus({ weeks: rule.interval });
  }

  return occurrences;
}

export function expandEvents(
  events: EventRecord[],
  range: Interval,
  timezone: string
): EventOccurrence[] {
  const occurrences: EventOccurrence[] = [];
  for (const event of events) {
    if (event.recurrence_rule) {
      occurrences.push(...expandRecurringEvent(event, range, timezone));
    } else {
      occurrences.push({
        ...event,
        occurrence_id: event.id,
        occurrence_start: event.start_at,
        occurrence_end: event.end_at
      });
    }
  }
  return occurrences;
}
