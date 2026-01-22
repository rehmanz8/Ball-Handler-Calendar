import { DateTime, Interval } from "luxon";

export function toUtc(date: DateTime) {
  return date.toUTC();
}

export function fromUtc(iso: string, timezone: string) {
  return DateTime.fromISO(iso, { zone: "utc" }).setZone(timezone);
}

export function formatTimeRange(start: DateTime, end: DateTime) {
  return `${start.toFormat("h:mm a")} – ${end.toFormat("h:mm a")}`;
}

export function startOfWeek(date: DateTime) {
  return date.startOf("week");
}

export function getWeekRange(date: DateTime) {
  const start = startOfWeek(date);
  return Interval.fromDateTimes(start, start.plus({ days: 7 }));
}

export function clampToDay(date: DateTime) {
  return date.startOf("day");
}
