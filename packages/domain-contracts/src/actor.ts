import { z } from "zod";
import { USER_ROLES } from "./roles.js";

/**
 * Command-caller identity. Shared by every command service (case, document, …).
 * Actor roles are supplied by the caller: authentication/authorization
 * infrastructure is upstream and does not exist yet — documented assumption.
 */
export const CommandActorSchema = z
  .object({
    actorId: z.string().min(1),
    actorType: z.enum(["USER", "AGENT", "SYSTEM"]).default("USER"),
    roles: z.array(z.enum(USER_ROLES)).default([]),
  })
  .strict();
export type CommandActor = z.input<typeof CommandActorSchema>;
