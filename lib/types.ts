export type Circle = {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
};

export type CircleMember = {
  id: string;
  circle_id: string;
  user_id: string;
  display_name: string;
  color: string;
  timezone: string;
  role: "host" | "member";
  created_at: string;
};

export type EventRecord = {
  id: string;
  circle_id: string;
  owner_user_id: string;
  title: string;
  description: string | null;
  start_at: string;
  end_at: string;
  is_all_day: boolean;
  recurrence_rule: string | null;
  recurrence_start: string | null;
  recurrence_end: string | null;
  created_at: string;
};

export type EventOccurrence = EventRecord & {
  occurrence_id: string;
  occurrence_start: string;
  occurrence_end: string;
};
