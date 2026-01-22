import { z } from "zod";

export const createCircleSchema = z.object({
  name: z.string().min(2, "Circle name is required")
});

export const joinCircleSchema = z.object({
  displayName: z.string().min(2, "Display name is required"),
  timezone: z.string().min(1, "Timezone is required")
});

export const eventSchema = z
  .object({
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
  })
  .refine((data) => data.endAt > data.startAt, {
    message: "End time must be after start time",
    path: ["endAt"]
  });
