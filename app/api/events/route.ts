import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const eventSchema = z.object({
  id: z.string().optional(),
  circleId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  startAt: z.string().min(1),
  endAt: z.string().min(1),
  isAllDay: z.boolean(),
  recurrenceRule: z.string().optional().nullable(),
  recurrenceStart: z.string().optional().nullable(),
  recurrenceEnd: z.string().optional().nullable()
});

export async function POST(request: Request) {
  const supabase = createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = eventSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }

  const payload = parsed.data;
  const { error } = await supabase.from("events").insert({
    circle_id: payload.circleId,
    owner_user_id: auth.user.id,
    title: payload.title,
    description: payload.description ?? null,
    start_at: payload.startAt,
    end_at: payload.endAt,
    is_all_day: payload.isAllDay,
    recurrence_rule: payload.recurrenceRule ?? null,
    recurrence_start: payload.recurrenceStart ?? null,
    recurrence_end: payload.recurrenceEnd ?? null
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}

export async function PATCH(request: Request) {
  const supabase = createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = eventSchema.safeParse(await request.json());
  if (!parsed.success || !parsed.data.id) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const payload = parsed.data;
  const { error } = await supabase
    .from("events")
    .update({
      title: payload.title,
      description: payload.description ?? null,
      start_at: payload.startAt,
      end_at: payload.endAt,
      is_all_day: payload.isAllDay,
      recurrence_rule: payload.recurrenceRule ?? null,
      recurrence_start: payload.recurrenceStart ?? null,
      recurrence_end: payload.recurrenceEnd ?? null
    })
    .eq("id", payload.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const supabase = createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await request.json();
  if (!id) {
    return NextResponse.json({ error: "Missing event id" }, { status: 400 });
  }

  const { error } = await supabase.from("events").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
