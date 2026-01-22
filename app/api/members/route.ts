import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { pickMemberColor } from "@/lib/colors";

const joinSchema = z.object({
  circleId: z.string().min(1),
  displayName: z.string().min(2),
  timezone: z.string().min(1)
});

const removeSchema = z.object({
  circleId: z.string().min(1),
  userId: z.string().min(1)
});

export async function POST(request: Request) {
  const supabase = createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = joinSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }

  const { circleId, displayName, timezone } = parsed.data;
  const { data: existingColors, error: colorsError } = await supabase
    .from("circle_members")
    .select("color")
    .eq("circle_id", circleId);

  if (colorsError) {
    return NextResponse.json({ error: colorsError.message }, { status: 400 });
  }

  const color = pickMemberColor(existingColors?.map((row) => row.color) ?? []);

  const { error } = await supabase.from("circle_members").insert({
    circle_id: circleId,
    user_id: auth.user.id,
    display_name: displayName,
    color,
    timezone,
    role: "member"
  });

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

  const parsed = removeSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }

  const { circleId, userId } = parsed.data;
  const { data: currentMember, error: memberError } = await supabase
    .from("circle_members")
    .select("role")
    .eq("circle_id", circleId)
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (memberError) {
    return NextResponse.json({ error: memberError.message }, { status: 400 });
  }

  if (!currentMember || (currentMember.role !== "host" && auth.user.id !== userId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await supabase
    .from("circle_members")
    .delete()
    .eq("circle_id", circleId)
    .eq("user_id", userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
