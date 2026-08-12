import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getActiveCompanyContext } from "@/server/queries/company-context";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const context = await getActiveCompanyContext();

  return (
    <DashboardShell
      companyCode={context.companyCode}
      companyName={context.companyName}
      permissions={context.permissions}
      userEmail={context.userEmail}
    >
      {children}
    </DashboardShell>
  );
}
