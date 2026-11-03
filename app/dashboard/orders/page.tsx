import Link from "next/link";
import { redirect } from "next/navigation";
import { OrderStatus, PaymentStatus } from "@store/db";
import { requireStaffUser } from "@/lib/auth/dal";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { OrderService } from "@/lib/services/order.service";
import { listOrdersSchema } from "@/lib/validators/order.schema";
import { buttonClass, inputClass, secondaryButtonClass } from "../_components/form-styles";
import { Pagination } from "../_components/pagination";
import { StatusBadge } from "../_components/status-badge";

const BASE_PATH = "/dashboard/orders";

type SearchParams = Record<string, string | string[] | undefined>;

/** First value of each param, with empty values (blank form fields) dropped. */
function cleanParams(searchParams: SearchParams) {
  const clean: Record<string, string> = {};
  for (const [key, value] of Object.entries(searchParams)) {
    const first = Array.isArray(value) ? value[0] : value;
    if (first) clean[key] = first;
  }
  return clean;
}

const label = (value: string) => value.charAt(0) + value.slice(1).toLowerCase();

export default async function OrdersPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireStaffUser();

  const params = cleanParams(await searchParams);
  const parsed = listOrdersSchema.safeParse(params);
  // Bad filters (e.g. hand-edited URLs) fall back to the defaults.
  const query = parsed.success ? parsed.data : listOrdersSchema.parse({});

  const result = await OrderService.getAllOrders(query);

  // A stale link to a page that no longer exists: jump to the last one.
  if (result.totalPages > 0 && query.page > result.totalPages) {
    const last = new URLSearchParams(params);
    last.set("page", String(result.totalPages));
    redirect(`${BASE_PATH}?${last.toString()}`);
  }

  const hasFilters = Object.keys(params).some((key) => key !== "page" && key !== "limit");

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Orders</h1>

      {!parsed.success && (
        <p role="alert" className="text-sm text-amber-700 dark:text-amber-400">
          Some filters were invalid and have been ignored.
        </p>
      )}

      {/* Plain GET form: filters live in the URL, so they're shareable and need no JS. */}
      <form method="get" action={BASE_PATH} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <input
          name="search"
          defaultValue={params.search}
          placeholder="Customer or order ID"
          aria-label="Search"
          className={`${inputClass} lg:col-span-2`}
        />
        <select
          name="status"
          defaultValue={params.status ?? ""}
          aria-label="Order status"
          className={inputClass}
        >
          <option value="">All statuses</option>
          {Object.values(OrderStatus).map((s) => (
            <option key={s} value={s}>
              {label(s)}
            </option>
          ))}
        </select>
        <select
          name="paymentStatus"
          defaultValue={params.paymentStatus ?? ""}
          aria-label="Payment status"
          className={inputClass}
        >
          <option value="">All payments</option>
          {Object.values(PaymentStatus).map((s) => (
            <option key={s} value={s}>
              {label(s)}
            </option>
          ))}
        </select>
        <input name="from" type="date" defaultValue={params.from} aria-label="From date" className={inputClass} />
        <input name="to" type="date" defaultValue={params.to} aria-label="To date" className={inputClass} />

        <div className="flex gap-2 sm:col-span-2 lg:col-span-6">
          <button type="submit" className={buttonClass}>
            Apply filters
          </button>
          {hasFilters && (
            <Link href={BASE_PATH} className={secondaryButtonClass}>
              Reset
            </Link>
          )}
        </div>
      </form>

      {result.items.length === 0 ? (
        <p className="rounded-xl border border-foreground/10 p-6 text-center text-sm text-foreground/60">
          {hasFilters ? "No orders match these filters." : "No orders yet."}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-foreground/10">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-foreground/10 text-xs text-foreground/60 uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 text-right font-medium">Items</th>
                <th className="px-4 py-3 text-right font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Payment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-foreground/10">
              {result.items.map((order) => (
                <tr key={order.id}>
                  <td className="px-4 py-3 font-mono text-xs">{order.id.slice(0, 8).toUpperCase()}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium">
                      {order.user.firstName} {order.user.lastName}
                    </p>
                    <p className="text-xs text-foreground/60">{order.user.email}</p>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">{formatDateTime(order.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    {order.items.reduce((sum, item) => sum + item.quantity, 0)}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">{formatCurrency(order.totalAmount)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge value={order.status} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge value={order.paymentStatus} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination
        basePath={BASE_PATH}
        params={params}
        page={result.page}
        limit={result.limit}
        total={result.total}
        totalPages={result.totalPages}
      />
    </div>
  );
}
