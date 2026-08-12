export type DashboardTransaction = {
  amount: string;
  date: string;
  documentNumber: string;
  description: string;
  status: string;
};

export type DashboardMetrics = {
  accountsPayable: string;
  accountsReceivable: string;
  cashBalance: string;
  expensesThisMonth: string;
  grossProfit: string;
  lowStockCount: number;
  netProfit: string;
  overduePayable: string;
  overdueReceivable: string;
  pendingApprovals: number;
  recentTransactions: DashboardTransaction[];
  revenueThisMonth: string;
};
