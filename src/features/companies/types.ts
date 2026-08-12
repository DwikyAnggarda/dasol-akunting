export type CompanyMembershipSummary = {
  companyCode: string;
  companyId: string;
  companyName: string;
  membershipId: string;
  roleName: string;
};

export type ActiveCompanyContext = CompanyMembershipSummary & {
  permissions: string[];
  userEmail: string;
  userId: string;
};
