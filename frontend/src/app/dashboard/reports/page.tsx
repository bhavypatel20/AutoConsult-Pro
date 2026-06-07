import { redirect } from "next/navigation";
import { getActiveBusiness } from "@/actions/business";
import { getReportData } from "@/actions/erp";
import ReportsClient from "./ReportsClient";

interface PageProps {
  searchParams: Promise<{ year?: string; month?: string }>;
}

export default async function ReportsPage({ searchParams }: PageProps) {
  const context = await getActiveBusiness();
  if (!context) redirect("/onboarding");

  // Read search parameters for year and month filters (unwrapping Promise in Next.js 15+)
  const resolvedParams = await searchParams;
  const year = resolvedParams.year;
  const month = resolvedParams.month;

  const reportData = await getReportData(year, month);

  return (
    <div>
      <div style={{ marginBottom: "32px" }}>
        <h2>Financial Reports Center</h2>
        <p style={{ color: "var(--text-muted)" }}>
          Generate, filter, print, and export P&L Statements, Balance Sheets, Car Profit Worksheets, and Outstanding balances.
        </p>
      </div>

      <ReportsClient
        initialData={reportData}
        selectedYear={year}
        selectedMonth={month}
      />
    </div>
  );
}
