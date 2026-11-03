"use server";

import { revalidatePath } from "next/cache";
import { AppError } from "@/lib/errors";
import { requireStaffUser } from "@/lib/auth/dal";
import { OrderService } from "@/lib/services/order.service";
import { updateOrderStatusSchema } from "@/lib/validators/order.schema";

export type UpdateStatusState = { ok: true } | { ok: false; error: string } | undefined;

/**
 * Server Actions are public POST endpoints, so authorization is re-checked
 * here instead of trusting that only the dashboard renders the form.
 */
export async function updateOrderStatusAction(
  _prev: UpdateStatusState,
  formData: FormData,
): Promise<UpdateStatusState> {
  await requireStaffUser();

  const parsed = updateOrderStatusSchema.safeParse({
    id: formData.get("id"),
    // Disabled selects (final orders) aren't submitted at all.
    status: formData.get("status") || undefined,
    paymentStatus: formData.get("paymentStatus") || undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { id, status, paymentStatus } = parsed.data;
  try {
    await OrderService.updateOrderStatus(id, { status, paymentStatus });
  } catch (error) {
    if (error instanceof AppError) return { ok: false, error: error.message };
    throw error;
  }

  // The order also feeds the list and the overview stats.
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}
