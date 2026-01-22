"use client";

import { useState } from "react";
import { Circle, CircleMember } from "@/lib/types";

export default function CircleSettings({
  circle,
  members,
  currentUserId
}: {
  circle: Circle;
  members: CircleMember[];
  currentUserId: string;
}) {
  const [name, setName] = useState(circle.name);
  const [status, setStatus] = useState<string | null>(null);
  const currentMember = members.find((member) => member.user_id === currentUserId);
  const isHost = currentMember?.role === "host";

  const handleRename = async () => {
    setStatus(null);
    const response = await fetch(`/api/circles/${circle.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name })
    });

    if (!response.ok) {
      const payload = await response.json();
      setStatus(payload.error || "Unable to rename");
      return;
    }

    setStatus("Circle updated.");
  };

  const handleRemove = async (userId: string) => {
    const response = await fetch("/api/members", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ circleId: circle.id, userId })
    });

    if (!response.ok) {
      const payload = await response.json();
      setStatus(payload.error || "Unable to remove member");
      return;
    }

    setStatus("Member removed.");
  };

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Circle name</h2>
        <div className="flex gap-3">
          <input
            className="w-full rounded-md border border-slate-700 bg-white px-3 py-2 text-sm"
            value={name}
            onChange={(event) => setName(event.target.value)}
            disabled={!isHost}
          />
          {isHost && (
            <button
              type="button"
              className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-slate-900"
              onClick={handleRename}
            >
              Save
            </button>
          )}
        </div>
      </section>
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Members</h2>
        <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-900 p-4">
          {members.map((member) => (
            <div key={member.id} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-3">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: member.color }}
                />
                <div>
                  <p className="font-medium text-slate-200">{member.display_name}</p>
                  <p className="text-xs text-slate-400">
                    {member.role} · {member.timezone}
                  </p>
                </div>
              </div>
              {isHost && member.role !== "host" && (
                <button
                  type="button"
                  className="rounded-md border border-rose-500 px-3 py-1 text-xs text-rose-200"
                  onClick={() => handleRemove(member.user_id)}
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
      </section>
      {status && <p className="text-sm text-slate-300">{status}</p>}
    </div>
  );
}
