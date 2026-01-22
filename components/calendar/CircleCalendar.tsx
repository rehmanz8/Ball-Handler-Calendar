"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DateTime, Interval } from "luxon";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Circle, CircleMember, EventOccurrence, EventRecord } from "@/lib/types";
import { expandEvents } from "@/lib/recurrence";
import CalendarGrid from "@/components/calendar/CalendarGrid";
import MemberLegend from "@/components/calendar/MemberLegend";
import MemberFilter from "@/components/calendar/MemberFilter";
import EventModal from "@/components/modals/EventModal";

export default function CircleCalendar({
  circle,
  members: initialMembers,
  events: initialEvents,
  currentUserId
}: {
  circle: Circle;
  members: CircleMember[];
  events: EventRecord[];
  currentUserId: string;
}) {
  const [view, setView] = useState<"week" | "day">("week");
  const [baseDate, setBaseDate] = useState(() => DateTime.local());
  const [members, setMembers] = useState(initialMembers);
  const [events, setEvents] = useState(initialEvents);
  const [activeMembers, setActiveMembers] = useState(
    initialMembers.map((member) => member.user_id)
  );
  const [selectedEvent, setSelectedEvent] = useState<EventOccurrence | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draftRange, setDraftRange] = useState<{ start: DateTime; end: DateTime } | null>(null);
  const [inviteLink, setInviteLink] = useState("");

  const timezone = members.find((member) => member.user_id === currentUserId)?.timezone || "UTC";
  const range = useMemo(() => {
    const start = view === "week" ? baseDate.startOf("week") : baseDate.startOf("day");
    const end = view === "week" ? start.plus({ days: 7 }) : start.plus({ days: 1 });
    return Interval.fromDateTimes(start, end);
  }, [baseDate, view]);

  const occurrenceEvents = useMemo(() => {
    const filtered = events.filter((event) => activeMembers.includes(event.owner_user_id));
    return expandEvents(filtered, range, timezone);
  }, [events, activeMembers, range, timezone]);

  const memberMap = useMemo(() => {
    return members.reduce<Record<string, { color: string; name: string }>>((acc, member) => {
      acc[member.user_id] = { color: member.color, name: member.display_name };
      return acc;
    }, {});
  }, [members]);

  const refreshData = async () => {
    const supabase = createSupabaseBrowserClient();
    const [{ data: eventsData }, { data: membersData }] = await Promise.all([
      supabase.from("events").select("*").eq("circle_id", circle.id),
      supabase.from("circle_members").select("*").eq("circle_id", circle.id)
    ]);

    if (eventsData) setEvents(eventsData as EventRecord[]);
    if (membersData) {
      setMembers(membersData as CircleMember[]);
      setActiveMembers((prev) => {
        const memberIds = (membersData as CircleMember[]).map((member) => member.user_id);
        return prev.filter((id) => memberIds.includes(id));
      });
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      setInviteLink(`${window.location.origin}/join/${circle.id}`);
    }
  }, [circle.id]);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel(`circle-${circle.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "events", filter: `circle_id=eq.${circle.id}` },
        () => refreshData()
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "circle_members",
          filter: `circle_id=eq.${circle.id}`
        },
        () => refreshData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [circle.id]);

  const handleSelectEvent = (event: EventOccurrence) => {
    setSelectedEvent(event);
    setDraftRange(null);
    setIsModalOpen(true);
  };

  const handleNewEvent = (start: DateTime, end: DateTime) => {
    setSelectedEvent(null);
    setDraftRange({ start, end });
    setIsModalOpen(true);
  };

  const handleSubmit = async (values: {
    title: string;
    description?: string;
    startAt: string;
    endAt: string;
    isAllDay: boolean;
    recurrenceRule: string | null;
    recurrenceStart: string | null;
    recurrenceEnd: string | null;
  }) => {
    const supabase = createSupabaseBrowserClient();
    const { data } = await supabase.auth.getSession();
    const accessToken = data.session?.access_token;
    if (selectedEvent) {
      await fetch("/api/events", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
        },
        body: JSON.stringify({
          id: selectedEvent.id,
          circleId: circle.id,
          ...values
        })
      });
    } else {
      await fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
        },
        body: JSON.stringify({
          circleId: circle.id,
          ...values
        })
      });
    }

    setIsModalOpen(false);
  };

  const handleDelete = async () => {
    if (!selectedEvent) return;
    const supabase = createSupabaseBrowserClient();
    const { data } = await supabase.auth.getSession();
    const accessToken = data.session?.access_token;
    await fetch("/api/events", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
      },
      body: JSON.stringify({ id: selectedEvent.id })
    });
    setIsModalOpen(false);
    setSelectedEvent(null);
  };

  const openValues = useMemo(() => {
    if (selectedEvent) return selectedEvent;
    if (!draftRange) return null;

    return {
      id: "draft",
      circle_id: circle.id,
      owner_user_id: currentUserId,
      title: "",
      description: null,
      start_at: draftRange.start.toUTC().toISO(),
      end_at: draftRange.end.toUTC().toISO(),
      is_all_day: false,
      recurrence_rule: null,
      recurrence_start: null,
      recurrence_end: null,
      created_at: DateTime.utc().toISO(),
      occurrence_id: "draft",
      occurrence_start: draftRange.start.toUTC().toISO(),
      occurrence_end: draftRange.end.toUTC().toISO()
    } as EventOccurrence;
  }, [selectedEvent, draftRange, circle.id, currentUserId]);

  const isOwner = selectedEvent ? selectedEvent.owner_user_id === currentUserId : true;

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-white">
      <header className="border-b border-slate-800 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Circle</p>
            <h1 className="text-2xl font-semibold">{circle.name}</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-slate-900"
            >
              + New event
            </button>
          </div>
        </div>
      </header>
      <div className="flex flex-1 gap-6 px-6 py-6">
        <aside className="w-80 space-y-6 rounded-xl border border-slate-800 bg-slate-900 p-4">
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-slate-200">Invite link</h2>
            <div className="flex gap-2">
              <input
                className="flex-1 rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-200"
                readOnly
                value={inviteLink}
              />
              <button
                type="button"
                onClick={() => {
                  if (inviteLink) {
                    navigator.clipboard.writeText(inviteLink);
                  }
                }}
                className="rounded-md border border-slate-700 px-3 py-2 text-xs"
              >
                Copy
              </button>
            </div>
          </div>
          <Link
            href={`/circle/${circle.id}/settings`}
            className="block rounded-md border border-slate-700 px-3 py-2 text-center text-xs"
          >
            Circle settings
          </Link>
          <MemberLegend members={members} />
          <MemberFilter
            members={members}
            activeIds={activeMembers}
            onChange={setActiveMembers}
          />
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-200">View</h3>
            <div className="flex gap-2">
              {(["week", "day"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setView(option)}
                  className={`rounded-md px-3 py-1 text-xs ${
                    view === option ? "bg-white text-slate-900" : "border border-slate-700"
                  }`}
                >
                  {option === "week" ? "Week" : "Day"}
                </button>
              ))}
            </div>
          </div>
        </aside>
        <section className="flex-1">
          <CalendarGrid
            view={view}
            baseDate={baseDate}
            timezone={timezone}
            events={occurrenceEvents}
            members={memberMap}
            onSelectEvent={handleSelectEvent}
            onNewEvent={handleNewEvent}
          />
        </section>
      </div>
      <EventModal
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedEvent(null);
          setDraftRange(null);
        }}
        onSubmit={handleSubmit}
        event={openValues}
        timezone={timezone}
        isOwner={isOwner}
      />
      {selectedEvent && isOwner && (
        <div className="fixed bottom-6 right-6">
          <button
            type="button"
            onClick={handleDelete}
            className="rounded-md border border-rose-400 px-4 py-2 text-sm text-rose-200"
          >
            Delete event
          </button>
        </div>
      )}
    </div>
  );
}
