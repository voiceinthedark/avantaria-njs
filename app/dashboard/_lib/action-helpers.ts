import { revalidatePath } from "next/cache";
import type { ZodError } from "zod";
import { AppError } from "@/lib/errors";
import type { ActionState } from "../_components/form-message";

export const text = (value: FormDataEntryValue | null) =>
  typeof value === "string" ? value.trim() : undefined;

/** Empty inputs become undefined so validation reports them as missing. */
export const number = (value: FormDataEntryValue | null) =>
  typeof value === "string" && value.trim() !== "" ? Number(value) : undefined;

export function issueMessage(error: ZodError) {
  const issue = error.issues[0];
  if (!issue) return "Invalid input.";
  return issue.path.length ? `${issue.path.join(".")}: ${issue.message}` : issue.message;
}

/** Turns expected service errors into form messages; rethrows anything else. */
export function fail(error: unknown): ActionState {
  if (error instanceof AppError) return { ok: false, error: error.message };
  throw error;
}

export const refresh = () => revalidatePath("/dashboard", "layout");
