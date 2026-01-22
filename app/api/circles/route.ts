import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { pickMemberColor } from "@/lib/colors";

const schema = z.object({
  name: z.string().min(2),
  displayName: z.string().min(2),
  timezone: z.string().min(1)
});

export async function POST(request: Request) {
  const accessToken = request.headers.get("Authorization")?.replace("Bearer ", "");
  const supabase = createSupabaseServerClient(accessToken);
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await request.json();
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }

  const { name, displayName, timezone } = parsed.data;
  const { data: circle, error } = await supabase
    .from("circles")
    .insert({ name, created_by: auth.user.id })
    .select("id")
    .single();

  if (error || !circle) {
    return NextResponse.json({ error: error?.message || "Unable to create circle" }, { status: 400 });
  }

  const color = pickMemberColor([]);
  const { error: memberError } = await supabase.from("circle_members").insert({
    circle_id: circle.id,
    user_id: auth.user.id,
    display_name: displayName,
    color,
    timezone,
    role: "host"
  });

  if (memberError) {
    return NextResponse.json({ error: memberError.message }, { status: 400 });
  }

  return NextResponse.json({ circleId: circle.id });
}
