import { z } from "zod";

import type { DashboardMetrics } from "@/features/dashboard/types";
import { requireUser } from "@/server/auth/require-user";

const decimalString = z.union([z.string(), z.number()]).transform(String);

const dashboardMetricsSchema = z.object({
  accounts_payable: decimalString,
  accounts_receivable: decimalString,
  cash_balance: decimalString,
  expenses_this_month: decimalString,
  gross_profit: decimalString,
  low_stock_count: z.number().int().nonnegative(),
  net_profit: decimalString,
  overdue_payable: decimalString,
  overdue_receivable: decimalString,
  pending_approvals: z.number().int().nonnegative(),
  recent_transactions: z.array(
    z.object({
      amount: decimalString,
      date: z.string(),
      document_number: z.string(),
      description: z.string(),
      status: z.string(),
    }),
  ),
  revenue_this_month: decimalString,
});

export async function getDashboardMetrics(
  companyId: string,
): Promise<DashboardMetrics> {
  const { supabase } = await requireUser();
  const { data, error } = await supabase.rpc("get_dashboard_metrics", {
    p_company_id: companyId,
  });
  if (error) throw new Error("Data Dasbor tidak dapat dimuat.");

  const parsed = dashboardMetricsSchema.safeParse(data);
  if (!parsed.success) throw new Error("Respons Dasbor tidak valid.");

  return {
    accountsPayable: parsed.data.accounts_payable,
    accountsReceivable: parsed.data.accounts_receivable,
    cashBalance: parsed.data.cash_balance,
    expensesThisMonth: parsed.data.expenses_this_month,
    grossProfit: parsed.data.gross_profit,
    lowStockCount: parsed.data.low_stock_count,
    netProfit: parsed.data.net_profit,
    overduePayable: parsed.data.overdue_payable,
    overdueReceivable: parsed.data.overdue_receivable,
    pendingApprovals: parsed.data.pending_approvals,
    recentTransactions: parsed.data.recent_transactions.map((transaction) => ({
      amount: transaction.amount,
      date: transaction.date,
      description: transaction.description,
      documentNumber: transaction.document_number,
      status: transaction.status,
    })),
    revenueThisMonth: parsed.data.revenue_this_month,
  };
}
