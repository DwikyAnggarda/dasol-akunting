import Link from "next/link";
import { EntityPage } from "@/components/common/EntityPage";
import { StatusBadge } from "@/components/common/ModulePage";
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/features/notifications/actions";
import { detailCardClass } from "@/features/master/page-ui";
import { getActiveCompanyContext } from "@/server/queries/company-context";
import { getNotifications } from "@/server/queries/notifications";

const entityPath = (type: string | null, id: string | null) => {
  if (!type || !id) return null;
  if (type === "sales_invoice") return `/sales/invoices/${id}`;
  if (type === "purchase_invoice") return `/purchases/invoices/${id}`;
  if (type === "customer_receipts") return `/sales/receipts/${id}`;
  if (type === "supplier_payments") return `/purchases/payments/${id}`;
  if (type === "inventory_adjustment") return `/inventory/adjustments/${id}`;
  if (type === "inventory_transfer") return `/inventory/transfers/${id}`;
  if (type === "stock_count") return `/inventory/opname/${id}`;
  if (type === "cash_transaction" || type === "cash_transactions")
    return `/cash-bank/transactions/${id}`;
  if (type === "sales_quotation") return `/sales/quotations/${id}`;
  if (type === "sales_order") return `/sales/orders/${id}`;
  if (type === "sales_delivery") return `/sales/deliveries/${id}`;
  if (type === "purchase_request") return `/purchases/requests/${id}`;
  if (type === "purchase_order") return `/purchases/orders/${id}`;
  if (type === "goods_receipt") return `/purchases/receipts/${id}`;
  if (type === "product") return "/inventory/stock";
  return null;
};

export default async function NotificationsPage() {
  const context = await getActiveCompanyContext(),
    notifications = await getNotifications(context.companyId),
    unread = notifications.filter((row) => !row.read_at).length;
  return (
    <EntityPage
      description="Notifikasi durable untuk approval, posting, pembayaran, reversal, dan stok minimum."
      title={`Notifikasi (${unread} belum dibaca)`}
    >
      <div className="mb-4 flex justify-end">
        <form action={markAllNotificationsReadAction}>
          <button
            className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold"
            type="submit"
          >
            Tandai semua dibaca
          </button>
        </form>
      </div>
      <section
        className={`${detailCardClass} divide-y divide-gray-100 p-0 dark:divide-gray-800`}
      >
        {notifications.length === 0 ? (
          <div className="p-8 text-center">
            <h2 className="font-semibold">Belum ada notifikasi</h2>
            <p className="mt-2 text-sm text-gray-500">
              Aktivitas approval dan transaksi berikutnya akan muncul di sini.
            </p>
          </div>
        ) : (
          notifications.map((notification) => {
            const path = entityPath(
              notification.entity_type,
              notification.entity_id,
            );
            return (
              <article
                className={`flex flex-wrap items-start justify-between gap-4 p-5 ${notification.read_at ? "opacity-65" : "bg-brand-50/40 dark:bg-brand-950/10"}`}
                key={notification.id}
              >
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <h2 className="font-semibold">{notification.title}</h2>
                    <StatusBadge value={notification.notification_type} />
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {notification.message}
                  </p>
                  <p className="mt-2 text-xs text-gray-400">
                    {new Date(notification.created_at).toLocaleString("id-ID")}
                  </p>
                </div>
                <div className="flex gap-2">
                  {path ? (
                    <Link
                      className="text-brand-600 rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold"
                      href={path}
                    >
                      Buka dokumen
                    </Link>
                  ) : null}
                  {!notification.read_at ? (
                    <form action={markNotificationReadAction}>
                      <input name="id" type="hidden" value={notification.id} />
                      <button
                        className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold"
                        type="submit"
                      >
                        Tandai dibaca
                      </button>
                    </form>
                  ) : null}
                </div>
              </article>
            );
          })
        )}
      </section>
    </EntityPage>
  );
}
