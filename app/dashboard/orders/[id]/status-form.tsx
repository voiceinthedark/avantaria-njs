"use client";

import { useActionState, useState } from "react";
import { updateOrderStatusAction } from "./actions";
import { buttonClass, inputClass } from "../../_components/form-styles";

const label = (value: string) => value.charAt(0) + value.slice(1).toLowerCase();

type Props = {
  orderId: string;
  status: string;
  paymentStatus: string;
  /** Statuses the order may move to from its current one. */
  allowedStatuses: string[];
  paymentOptions: string[];
};

export function StatusForm({
  orderId,
  status,
  paymentStatus,
  allowedStatuses,
  paymentOptions,
}: Props) {
  const [state, action, pending] = useActionState(updateOrderStatusAction, undefined);
  const [selectedStatus, setSelectedStatus] = useState(status);
  const [selectedPayment, setSelectedPayment] = useState(paymentStatus);

  const isFinal = allowedStatuses.length === 0;
  const unchanged = selectedStatus === status && selectedPayment === paymentStatus;

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="id" value={orderId} />

      <div className="space-y-1">
        <label htmlFor="status" className="text-sm font-medium">
          Order status
        </label>
        <select
          id="status"
          name="status"
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          disabled={isFinal}
          className={inputClass}
        >
          {[status, ...allowedStatuses].map((s) => (
            <option key={s} value={s}>
              {label(s)}
            </option>
          ))}
        </select>
        {isFinal && (
          <p className="text-xs text-foreground/60">
            This order is {status.toLowerCase()}, so its status can no longer change.
          </p>
        )}
        {selectedStatus === "CANCELLED" && status !== "CANCELLED" && (
          <p className="text-xs text-amber-700 dark:text-amber-400">
            Cancelling puts the items back in stock and can&apos;t be undone.
          </p>
        )}
      </div>

      <div className="space-y-1">
        <label htmlFor="paymentStatus" className="text-sm font-medium">
          Payment status
        </label>
        <select
          id="paymentStatus"
          name="paymentStatus"
          value={selectedPayment}
          onChange={(e) => setSelectedPayment(e.target.value)}
          className={inputClass}
        >
          {paymentOptions.map((s) => (
            <option key={s} value={s}>
              {label(s)}
            </option>
          ))}
        </select>
      </div>

      {state?.ok === false && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      )}
      {state?.ok === true && unchanged && (
        <p role="status" className="text-sm text-green-700 dark:text-green-400">
          Order updated.
        </p>
      )}

      <button type="submit" disabled={pending || unchanged} className={buttonClass}>
        {pending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
