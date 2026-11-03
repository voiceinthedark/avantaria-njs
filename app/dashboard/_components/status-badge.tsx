const STYLES: Record<string, string> = {
  PENDING: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  PROCESSING: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  SHIPPED: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-400",
  DELIVERED: "bg-green-500/15 text-green-700 dark:text-green-400",
  COMPLETED: "bg-green-500/15 text-green-700 dark:text-green-400",
  CANCELLED: "bg-red-500/15 text-red-700 dark:text-red-400",
  FAILED: "bg-red-500/15 text-red-700 dark:text-red-400",
  REFUNDED: "bg-foreground/10 text-foreground/70",
};

/** Colored pill for an order or payment status. */
export function StatusBadge({ value }: { value: string }) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
        STYLES[value] ?? "bg-foreground/10"
      }`}
    >
      {value.charAt(0) + value.slice(1).toLowerCase()}
    </span>
  );
}
