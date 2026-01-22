import { CircleMember } from "@/lib/types";

export default function MemberLegend({ members }: { members: CircleMember[] }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-slate-200">Members</h3>
      <div className="space-y-2">
        {members.map((member) => (
          <div key={member.id} className="flex items-center gap-2 text-sm text-slate-200">
            <span
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: member.color }}
            />
            {member.display_name}
          </div>
        ))}
      </div>
    </div>
  );
}
