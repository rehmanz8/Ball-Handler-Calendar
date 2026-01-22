"use client";

import { CircleMember } from "@/lib/types";

export default function MemberFilter({
  members,
  activeIds,
  onChange
}: {
  members: CircleMember[];
  activeIds: string[];
  onChange: (ids: string[]) => void;
}) {
  const toggle = (id: string) => {
    if (activeIds.includes(id)) {
      onChange(activeIds.filter((memberId) => memberId !== id));
    } else {
      onChange([...activeIds, id]);
    }
  };

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-slate-200">Filter by members</h3>
      <div className="space-y-2">
        {members.map((member) => (
          <label key={member.id} className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={activeIds.includes(member.user_id)}
              onChange={() => toggle(member.user_id)}
            />
            {member.display_name}
          </label>
        ))}
      </div>
    </div>
  );
}
