import { redirect } from "next/navigation";
import { getActiveBusiness } from "@/actions/business";
import prisma from "@/lib/prisma";
import {
  getPartners,
  getBankAccounts,
  getTransactions,
  getCustomerLedgers,
  getSellerLedgers,
  getIncomeEntries,
  getExpenseEntries,
} from "@/actions/erp";
import FinanceClient from "./FinanceClient";

export default async function FinancePage() {
  const context = await getActiveBusiness();
  if (!context) redirect("/onboarding");

  const businessId = context.business.id;
  const isReadOnly = context.membership.role === "PARTNER_VIEW";
  const role = context.membership.role;

  // Gather ERP dataset in parallel for rapid page rendering
  const [
    partners,
    bankAccounts,
    transactions,
    customerLedgers,
    sellerLedgers,
    incomeEntries,
    expenseEntries,
  ] = await Promise.all([
    getPartners(),
    getBankAccounts(),
    getTransactions(),
    getCustomerLedgers(),
    getSellerLedgers(),
    getIncomeEntries(),
    getExpenseEntries(),
  ]);

  // Fetch all cars for select boxes in forms
  const cars = await prisma.car.findMany({
    where: { businessId },
    select: {
      id: true,
      brand: true,
      model: true,
      year: true,
      registrationNum: true,
      purchasePrice: true,
      status: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div style={{ marginBottom: "32px" }}>
        <h2>Finance ERP Control Center</h2>
        <p style={{ color: "var(--text-muted)" }}>
          Manage cash book, bank accounts, partner ledgers, customer installments, and office expense tracking.
        </p>
      </div>

      <FinanceClient
        initialPartners={partners}
        initialBankAccounts={bankAccounts}
        initialTransactions={transactions}
        initialCustomerLedgers={customerLedgers}
        initialSellerLedgers={sellerLedgers}
        initialIncomeEntries={incomeEntries}
        initialExpenseEntries={expenseEntries}
        cars={cars}
        isReadOnly={isReadOnly}
        role={role}
      />
    </div>
  );
}
