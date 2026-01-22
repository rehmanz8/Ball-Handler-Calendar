import { z } from "zod";
import type { Resolver } from "react-hook-form";

type FieldErrors = Record<string, { type: string; message?: string }>;

export const zodResolver = <T extends z.ZodTypeAny>(schema: T): Resolver<z.infer<T>> => {
  return async (values) => {
    const result = schema.safeParse(values);
    if (result.success) {
      return { values: result.data, errors: {} };
    }

    const flattened = result.error.flatten().fieldErrors;
    const errors: FieldErrors = {};
    for (const [key, messages] of Object.entries(flattened)) {
      if (!messages?.length) continue;
      errors[key] = { type: "validation", message: messages[0] };
    }

    return { values: {}, errors };
  };
};
