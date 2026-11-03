import { requireStaffUser } from "@/lib/auth/dal";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { DashboardService } from "@/lib/services/dashboard.service";
import { StatusBadge } from "./_components/status-badge";

const STATS_DAYS = 30; // Stats for a month duration
const LOW_STOCK_THRESHOLD = 5; // Minimum stock quantity

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-foreground/10 p-4">
      <p className="text-sm text-foreground/60">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
      {hint && <p className="mt-1 text-xs text-foreground/50">{hint}</p>}
    </div>
  );
}

export default async function DashboardPage() {
  await requireStaffUser();
  const stats = await DashboardService.getStats({
    days: STATS_DAYS,
    lowStockThreshold: LOW_STOCK_THRESHOLD,
  });

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-semibold">Overview</h1>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={`Revenue (${STATS_DAYS} days)`}
          value={formatCurrency(stats.revenue.period)}
          hint={`${formatCurrency(stats.revenue.total)} all time`}
        />
        <StatCard
          label="Orders"
          value={String(stats.orders.total)}
          hint={`${stats.orders.byStatus.PENDING} pending`}
        />
        <StatCard label="Customers" value={String(stats.customers)} />
        <StatCard
          label="Low stock variants"
          value={String(stats.lowStock.count)}
          hint={`${stats.activeProducts} active products`}
        />
      </section>

      <div className="grid gap-8 xl:grid-cols-2">
        <section className="space-y-3">
          <h2 className="font-medium">Recent orders</h2>
          {stats.recentOrders.length === 0 ? (
            <p className="text-sm text-foreground/60">No orders yet.</p>
          ) : (
            <ul className="divide-y divide-foreground/10 rounded-xl border border-foreground/10">
              {stats.recentOrders.map((order) => (
                <li key={order.id} className="flex items-center justify-between gap-4 p-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {order.user.firstName} {order.user.lastName}
                    </p>
                    <p className="text-xs text-foreground/60">{formatDateTime(order.createdAt)}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <StatusBadge value={order.status} />
                    <span className="w-20 text-right">{formatCurrency(order.totalAmount)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="font-medium">Low stock (≤ {stats.lowStock.threshold})</h2>
          {stats.lowStock.items.length === 0 ? (
            <p className="text-sm text-foreground/60">Everything is well stocked.</p>
          ) : (
            <ul className="divide-y divide-foreground/10 rounded-xl border border-foreground/10">
              {stats.lowStock.items.map((variant) => (
                <li
                  key={variant.id}
                  className="flex items-center justify-between gap-4 p-3 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{variant.product.name}</p>
                    <p className="text-xs text-foreground/60">
                      {variant.size} / {variant.color} · {variant.sku}
                    </p>
                  </div>
                  <span className="shrink-0 font-medium">{variant.stockQty} left</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
