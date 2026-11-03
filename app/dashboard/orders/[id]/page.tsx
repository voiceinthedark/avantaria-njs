import Link from "next/link";
import { notFound } from "next/navigation";
import { PaymentStatus } from "@store/db";
import { requireStaffUser } from "@/lib/auth/dal";
import { AppError } from "@/lib/errors";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { ORDER_TRANSITIONS, OrderService } from "@/lib/services/order.service";
import { getOrderByIdSchema } from "@/lib/validators/order.schema";
import { StatusBadge } from "../../_components/status-badge";
import { StatusForm } from "./status-form";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 rounded-xl border border-foreground/10 p-4">
      <h2 className="font-medium">{title}</h2>
      {children}
    </section>
  );
}

async function loadOrder(id: string) {
  try {
    return await OrderService.getOrderDetail(id);
  } catch (error) {
    if (error instanceof AppError && error.status === 404) notFound();
    throw error;
  }
}

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireStaffUser();

  const parsed = getOrderByIdSchema.safeParse(await params);
  if (!parsed.success) notFound();

  const order = await loadOrder(parsed.data.id);
  const { user, address } = order;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Link href="/dashboard/orders" className="text-sm text-foreground/60 hover:text-foreground">
          ← Back to orders
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-mono text-xl font-semibold">{order.id.slice(0, 8).toUpperCase()}</h1>
          <StatusBadge value={order.status} />
          <StatusBadge value={order.paymentStatus} />
        </div>
        <p className="text-sm text-foreground/60">Placed {formatDateTime(order.createdAt)}</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Section title="Items">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-foreground/10 text-xs text-foreground/60 uppercase">
                  <tr>
                    <th className="py-2 pr-4 font-medium">Product</th>
                    <th className="py-2 pr-4 text-right font-medium">Qty</th>
                    <th className="py-2 pr-4 text-right font-medium">Unit price</th>
                    <th className="py-2 text-right font-medium">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-foreground/10">
                  {order.items.map((item) => (
                    <tr key={item.id}>
                      <td className="py-3 pr-4">
                        <p className="font-medium">{item.variant.product.name}</p>
                        <p className="text-xs text-foreground/60">
                          {item.variant.size} / {item.variant.color} · {item.variant.sku}
                        </p>
                      </td>
                      <td className="py-3 pr-4 text-right">{item.quantity}</td>
                      {/* The price paid at order time, not the variant's current price. */}
                      <td className="py-3 pr-4 text-right whitespace-nowrap">
                        {formatCurrency(item.price)}
                      </td>
                      <td className="py-3 text-right whitespace-nowrap">
                        {formatCurrency(Number(item.price.toString()) * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-foreground/20 font-semibold">
                    <td colSpan={3} className="pt-3 pr-4 text-right">
                      Total
                    </td>
                    <td className="pt-3 text-right whitespace-nowrap">
                      {formatCurrency(order.totalAmount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Section>

          <div className="grid gap-6 sm:grid-cols-2">
            <Section title="Customer">
              <div className="space-y-1 text-sm">
                <p className="font-medium">
                  {user.firstName} {user.lastName}
                </p>
                <p>
                  <a href={`mailto:${user.email}`} className="underline">
                    {user.email}
                  </a>
                </p>
                <p>{user.phone}</p>
              </div>
            </Section>

            <Section title="Delivery address">
              <address className="space-y-0.5 text-sm not-italic">
                <p className="font-medium">{address.fullName}</p>
                <p>{address.line1}</p>
                {address.line2 && <p>{address.line2}</p>}
                <p>{[address.city, address.state, address.postalCode].filter(Boolean).join(", ")}</p>
                <p>{address.country}</p>
                <p className="pt-1 text-foreground/60">{address.phone}</p>
              </address>
            </Section>
          </div>
        </div>

        <Section title="Update status">
          {/* key remounts the form when the saved values change after an update. */}
          <StatusForm
            key={`${order.status}-${order.paymentStatus}`}
            orderId={order.id}
            status={order.status}
            paymentStatus={order.paymentStatus}
            allowedStatuses={ORDER_TRANSITIONS[order.status]}
            paymentOptions={Object.values(PaymentStatus)}
          />
        </Section>
      </div>
    </div>
  );
}
