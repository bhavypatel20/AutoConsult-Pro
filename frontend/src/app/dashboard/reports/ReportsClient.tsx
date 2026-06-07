"use client";

import React, { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  FileSpreadsheet,
  Printer,
  Calendar,
  TrendingUp,
  TrendingDown,
  Scale,
  Car,
  UserCheck,
  Download,
  AlertCircle,
  HelpCircle,
  Users,
} from "lucide-react";

interface PLRevenue {
  carSaleRevenue: number;
  otherIncome: number;
  totalRevenue: number;
}

interface PLCOGS {
  carPurchaseCost: number;
  carPrepExpenses: number;
  totalCogs: number;
}

interface ProfitAndLoss {
  revenue: PLRevenue;
  cogs: PLCOGS;
  operatingExpenses: number;
  netProfit: number;
}

interface PartnerLedgerEntry {
  id: string;
  date: string;
  type: string;
  amount: number;
  notes: string | null;
  carId: string | null;
}

interface EquityBreakdown {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  isActive: boolean;
  equity: number;
  ledgerEntries: PartnerLedgerEntry[];
}

interface BalanceSheet {
  assets: {
    bankCashBalance: number;
    inventoryAssetValue: number;
    accountsReceivableValue: number;
    totalAssets: number;
  };
  liabilities: {
    accountsPayableValue: number;
  };
  equity: {
    partnerCapitalBreakdown: EquityBreakdown[];
    totalEquity: number;
  };
  totalLiabilitiesAndEquity: number;
}

interface CarProfitItem {
  id: string;
  brand: string;
  model: string;
  year: number;
  registrationNum: string;
  purchasePrice: number;
  expenses: number;
  totalInvestment: number;
  salePrice: number;
  netProfit: number;
  status: string;
}

interface CustomerReceivable {
  id: string;
  customerName: string;
  phone: string;
  total: number;
  remaining: number;
  status: string;
  dueDate: string | null;
}

interface SellerPayable {
  id: string;
  sellerName: string;
  carSpec: string;
  total: number;
  remaining: number;
  status: string;
}

interface ReportData {
  reportingPeriod: {
    year: string;
    month: string;
  };
  profitAndLoss: ProfitAndLoss;
  balanceSheet: BalanceSheet;
  carProfitSheet: CarProfitItem[];
  customerReceivables: CustomerReceivable[];
  sellerPayables: SellerPayable[];
}

interface ReportsClientProps {
  initialData: ReportData;
  selectedYear?: string;
  selectedMonth?: string;
}

const REPORT_TABS = [
  { id: "pl", label: "Profit & Loss", icon: TrendingUp },
  { id: "bs", label: "Balance Sheet", icon: Scale },
  { id: "car-profit", label: "Car Profits", icon: Car },
  { id: "receivables-payables", label: "Receivables & Payables", icon: UserCheck },
  { id: "partner-statement", label: "Partner Statements", icon: Users },
];

export default function ReportsClient({
  initialData,
  selectedYear = "",
  selectedMonth = "",
}: ReportsClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState("pl");
  const [selectedPartnerId, setSelectedPartnerId] = useState("");

  // Local state for dropdown filters
  const [filterYear, setFilterYear] = useState(selectedYear);
  const [filterMonth, setFilterMonth] = useState(selectedMonth);

  const applyFilters = (year: string, month: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (year) {
      params.set("year", year);
    } else {
      params.delete("year");
    }
    if (month) {
      params.set("month", month);
    } else {
      params.delete("month");
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const y = e.target.value;
    setFilterYear(y);
    applyFilters(y, filterMonth);
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const m = e.target.value;
    setFilterMonth(m);
    applyFilters(filterYear, m);
  };

  const resetFilters = () => {
    setFilterYear("");
    setFilterMonth("");
    router.push(pathname);
  };

  // CSV Exporter Helper
  const downloadCSV = () => {
    let csvContent = "";
    let filename = `Report_${activeTab}`;

    if (activeTab === "pl") {
      filename += `_PL_${filterYear || "All"}_${filterMonth || "All"}.csv`;
      const pl = initialData.profitAndLoss;
      csvContent = [
        ["PROFIT & LOSS STATEMENT", ""],
        ["Period", `Year: ${initialData.reportingPeriod.year}, Month: ${initialData.reportingPeriod.month}`],
        [],
        ["1. REVENUE", ""],
        ["Car Sales Revenue", pl.revenue.carSaleRevenue],
        ["Other Auxiliary Income", pl.revenue.otherIncome],
        ["TOTAL REVENUE (A)", pl.revenue.totalRevenue],
        [],
        ["2. COST OF GOODS SOLD (COGS)", ""],
        ["Car Purchase Costs", pl.cogs.carPurchaseCost],
        ["Car Prep & Repair Expenses", pl.cogs.carPrepExpenses],
        ["TOTAL COGS (B)", pl.cogs.totalCogs],
        [],
        ["GROSS PROFIT (A - B)", pl.revenue.totalRevenue - pl.cogs.totalCogs],
        [],
        ["3. OPERATING OVERHEAD EXPENSES", ""],
        ["Salaries, Rent, Utilities, travel", pl.operatingExpenses],
        ["TOTAL OPERATING EXPENSES (C)", pl.operatingExpenses],
        [],
        ["NET BUSINESS PROFIT (A - B - C)", pl.netProfit],
      ]
        .map((e) => e.join(","))
        .join("\n");
    } else if (activeTab === "bs") {
      filename += `_BalanceSheet.csv`;
      const bs = initialData.balanceSheet;
      csvContent = [
        ["BALANCE SHEET", ""],
        ["AS OF TODAY", ""],
        [],
        ["ASSETS", ""],
        ["Bank & Cash balances", bs.assets.bankCashBalance],
        ["Inventory Stock Value (at Cost)", bs.assets.inventoryAssetValue],
        ["Accounts Receivable Value (Customers)", bs.assets.accountsReceivableValue],
        ["TOTAL ASSETS", bs.assets.totalAssets],
        [],
        ["LIABILITIES", ""],
        ["Accounts Payable Value (Sellers)", bs.liabilities.accountsPayableValue],
        ["TOTAL LIABILITIES", bs.liabilities.accountsPayableValue],
        [],
        ["EQUITY", ""],
        ...bs.equity.partnerCapitalBreakdown.map((p) => [
          `Partner Capital: ${p.name}`,
          p.equity,
        ]),
        ["TOTAL EQUITY", bs.equity.totalEquity],
        [],
        ["TOTAL LIABILITIES & EQUITY", bs.totalLiabilitiesAndEquity],
      ]
        .map((e) => e.join(","))
        .join("\n");
    } else if (activeTab === "car-profit") {
      filename += `_CarProfitSheet.csv`;
      const headers = [
        "Registration",
        "Year",
        "Brand",
        "Model",
        "Purchase Price",
        "Expenses",
        "Total Investment",
        "Sale Price",
        "Net Profit",
        "Status",
      ];
      const rows = initialData.carProfitSheet.map((car) => [
        car.registrationNum,
        car.year,
        car.brand,
        car.model,
        car.purchasePrice,
        car.expenses,
        car.totalInvestment,
        car.salePrice,
        car.netProfit,
        car.status,
      ]);
      csvContent = [headers, ...rows].map((e) => e.join(",")).join("\n");
    } else if (activeTab === "partner-statement") {
      const selectedPartner = bs.equity.partnerCapitalBreakdown.find(p => p.id === selectedPartnerId) || bs.equity.partnerCapitalBreakdown[0];
      if (selectedPartner) {
        filename += `_PartnerStatement_${selectedPartner.name.replace(/\s+/g, "_")}.csv`;
        csvContent += `PARTNER STATEMENT FOR ${selectedPartner.name.toUpperCase()}\n`;
        csvContent += `Contact: ${selectedPartner.phone || "-"} | Email: ${selectedPartner.email || "-"}\n`;
        csvContent += `Net Equity Capital Balance: ${selectedPartner.equity}\n\n`;
        csvContent += "Date,Type,Amount,Notes\n";
        selectedPartner.ledgerEntries.forEach((e) => {
          csvContent += `${new Date(e.date).toLocaleDateString()},${e.type},${e.amount},"${e.notes || ""}"\n`;
        });
      }
    } else {
      filename += `_OutstandingBalances.csv`;
      csvContent += "CUSTOMER RECEIVABLES\n";
      csvContent += "Name,Phone,Total Deal,Remaining Outstanding,Status\n";
      initialData.customerReceivables.forEach((r) => {
        csvContent += `${r.customerName},${r.phone},${r.total},${r.remaining},${r.status}\n`;
      });
      csvContent += "\nSELLER PAYABLES\n";
      csvContent += "Name,Car Specifications,Total Purchase,Pending Payout,Status\n";
      initialData.sellerPayables.forEach((p) => {
        csvContent += `${p.sellerName},"${p.carSpec}",${p.total},${p.remaining},${p.status}\n`;
      });
    }

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const pl = initialData.profitAndLoss;
  const bs = initialData.balanceSheet;

  return (
    <div>
      {/* Printable Sheet Style Block */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            aside, header, footer, nav, .filter-bar, .tab-buttons, .action-buttons {
              display: none !important;
            }
            .print-only-header {
              display: block !important;
              margin-bottom: 24px;
              color: #000 !important;
              font-family: sans-serif;
            }
            body {
              background: #ffffff !important;
              color: #000000 !important;
              font-family: sans-serif;
            }
            .glass-card {
              background: transparent !important;
              border: none !important;
              box-shadow: none !important;
              backdrop-filter: none !important;
              padding: 0 !important;
              margin: 0 !important;
              color: #000000 !important;
            }
            table {
              width: 100% !important;
              border-collapse: collapse !important;
              color: #000000 !important;
            }
            th, td {
              border-bottom: 1px solid #999 !important;
              padding: 10px !important;
              color: #000000 !important;
            }
            h2, h3, h4 {
              color: #000000 !important;
            }
            .text-green {
              color: #008000 !important;
            }
            .text-red {
              color: #ff0000 !important;
            }
            .print-container {
              display: block !important;
              width: 100% !important;
            }
          }
          .text-green { color: #10b981; }
          .text-red { color: #ef4444; }
        `
      }} />

      {/* Print-Only Header Logo */}
      <div className="print-only-header" style={{ display: "none" }}>
        <h1 style={{ fontSize: "1.8rem", fontWeight: 800, textTransform: "uppercase" }}>AutoConsult ERP Ledger Report</h1>
        <p style={{ fontSize: "0.9rem", color: "#666" }}>
          Reporting Period &bull; Year: {initialData.reportingPeriod.year} | Month: {initialData.reportingPeriod.month}
        </p>
        <hr style={{ border: "1px solid #000", marginTop: "12px" }} />
      </div>

      {/* Dynamic Filter Bar */}
      <div
        className="glass-card filter-bar"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "16px",
          flexWrap: "wrap",
          padding: "16px 24px",
          marginBottom: "32px",
        }}
      >
        <div style={{ display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Calendar size={18} style={{ color: "var(--primary)" }} />
            <span style={{ fontSize: "0.9rem", fontWeight: 600 }}>Filter:</span>
          </div>

          <select
            value={filterYear}
            onChange={handleYearChange}
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid var(--border-light)",
              color: "var(--text-main)",
              fontSize: "0.9rem",
              cursor: "pointer",
              width: "140px",
            }}
          >
            <option value="">All Years</option>
            <option value="2026">2026</option>
            <option value="2025">2025</option>
            <option value="2024">2024</option>
          </select>

          <select
            value={filterMonth}
            onChange={handleMonthChange}
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid var(--border-light)",
              color: "var(--text-main)",
              fontSize: "0.9rem",
              cursor: "pointer",
              width: "160px",
            }}
          >
            <option value="">All Months</option>
            <option value="1">January</option>
            <option value="2">February</option>
            <option value="3">March</option>
            <option value="4">April</option>
            <option value="5">May</option>
            <option value="6">June</option>
            <option value="7">July</option>
            <option value="8">August</option>
            <option value="9">September</option>
            <option value="10">October</option>
            <option value="11">November</option>
            <option value="12">December</option>
          </select>

          {(filterYear || filterMonth) && (
            <button
              onClick={resetFilters}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--text-muted)",
                fontSize: "0.85rem",
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Action buttons (Print / CSV) */}
        <div className="action-buttons" style={{ display: "flex", gap: "12px" }}>
          <button
            onClick={downloadCSV}
            className="btn-primary"
            style={{
              padding: "8px 16px",
              background: "rgba(255,255,255,0.05)",
              color: "var(--text-main)",
              boxShadow: "none",
              fontSize: "0.85rem",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <FileSpreadsheet size={16} /> Export CSV
          </button>
          <button
            onClick={() => window.print()}
            className="btn-primary"
            style={{
              padding: "8px 16px",
              fontSize: "0.85rem",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <Printer size={16} /> Print Report
          </button>
        </div>
      </div>

      {/* Tab Selectors */}
      <div
        className="glass-card tab-buttons"
        style={{
          padding: "6px",
          display: "flex",
          gap: "6px",
          marginBottom: "32px",
          overflowX: "auto",
          borderRadius: "12px",
        }}
      >
        {REPORT_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 16px",
                borderRadius: "8px",
                border: "none",
                background: isActive ? "rgba(6, 182, 212, 0.15)" : "transparent",
                color: isActive ? "var(--primary)" : "var(--text-muted)",
                fontWeight: 600,
                fontSize: "0.85rem",
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.15s ease",
              }}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* REPORT CONTENT VIEWPORT */}
      <div className="glass-card print-container" style={{ padding: "32px" }}>
        
        {/* ==================================================== */}
        {/* 1. PROFIT & LOSS STATEMENT */}
        {/* ==================================================== */}
        {activeTab === "pl" && (
          <div>
            <h3 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: "4px" }}>Profit & Loss (P&L) Statement</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "32px" }}>
              Summary of dealership revenues, cost of goods sold, and operating overheads.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              {/* Revenue Section */}
              <div>
                <h4 style={{ borderBottom: "1px solid var(--border-light)", paddingBottom: "8px", marginBottom: "12px", color: "var(--primary)", textTransform: "uppercase", fontSize: "0.9rem", letterSpacing: 0.5 }}>
                  1. Revenues
                </h4>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", fontSize: "0.95rem" }}>
                  <span>Car Deal Sales Profit Revenues</span>
                  <strong>₹ {pl.revenue.carSaleRevenue.toLocaleString("en-IN")}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", fontSize: "0.95rem" }}>
                  <span>Other Auxiliary Fees & Commissions Income</span>
                  <strong>₹ {pl.revenue.otherIncome.toLocaleString("en-IN")}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px dashed var(--border-light)", padding: "12px 0 4px 0", marginTop: "4px", fontSize: "1rem", fontWeight: 700 }}>
                  <span>Total Revenues (A)</span>
                  <span className="text-green">₹ {pl.revenue.totalRevenue.toLocaleString("en-IN")}</span>
                </div>
              </div>

              {/* COGS Section */}
              <div>
                <h4 style={{ borderBottom: "1px solid var(--border-light)", paddingBottom: "8px", marginBottom: "12px", color: "#f59e0b", textTransform: "uppercase", fontSize: "0.9rem", letterSpacing: 0.5 }}>
                  2. Cost of Goods Sold (COGS)
                </h4>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", fontSize: "0.95rem" }}>
                  <span>Car Purchase Acquisition Cost</span>
                  <strong>₹ {pl.cogs.carPurchaseCost.toLocaleString("en-IN")}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", fontSize: "0.95rem" }}>
                  <span>Car Pre-sale Repairs & Logistics Expenses</span>
                  <strong>₹ {pl.cogs.carPrepExpenses.toLocaleString("en-IN")}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px dashed var(--border-light)", padding: "12px 0 4px 0", marginTop: "4px", fontSize: "1rem", fontWeight: 700 }}>
                  <span>Total Cost of Goods Sold (B)</span>
                  <span className="text-red">₹ {pl.cogs.totalCogs.toLocaleString("en-IN")}</span>
                </div>
              </div>

              {/* Gross Profit Callout */}
              <div
                style={{
                  background: "rgba(255,255,255,0.01)",
                  border: "1px solid var(--border-light)",
                  borderRadius: "12px",
                  padding: "16px 20px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: "1.05rem",
                  fontWeight: 700,
                }}
              >
                <span>Gross Trading Margin / Profit (A - B)</span>
                <span className={pl.revenue.totalRevenue - pl.cogs.totalCogs >= 0 ? "text-green" : "text-red"}>
                  ₹ {(pl.revenue.totalRevenue - pl.cogs.totalCogs).toLocaleString("en-IN")}
                </span>
              </div>

              {/* Overhead Expenses */}
              <div>
                <h4 style={{ borderBottom: "1px solid var(--border-light)", paddingBottom: "8px", marginBottom: "12px", color: "#ef4444", textTransform: "uppercase", fontSize: "0.9rem", letterSpacing: 0.5 }}>
                  3. Operating Expenses & Overheads
                </h4>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", fontSize: "0.95rem" }}>
                  <span>Office Rent, Salaries, Electricity, travel & marketing</span>
                  <strong>₹ {pl.operatingExpenses.toLocaleString("en-IN")}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px dashed var(--border-light)", padding: "12px 0 4px 0", marginTop: "4px", fontSize: "1rem", fontWeight: 700 }}>
                  <span>Total Operating Expenses (C)</span>
                  <span className="text-red">₹ {pl.operatingExpenses.toLocaleString("en-IN")}</span>
                </div>
              </div>

              {/* Net Profit Summary */}
              <div
                style={{
                  background: pl.netProfit >= 0 ? "rgba(16, 185, 129, 0.08)" : "rgba(239, 68, 68, 0.08)",
                  border: pl.netProfit >= 0 ? "1px solid rgba(16, 185, 129, 0.2)" : "1px solid rgba(239, 68, 68, 0.2)",
                  borderRadius: "14px",
                  padding: "24px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: "1.25rem",
                  fontWeight: 800,
                  marginTop: "12px",
                }}
              >
                <span>Net Business Profit (A - B - C)</span>
                <span className={pl.netProfit >= 0 ? "text-green" : "text-red"} style={{ fontSize: "1.45rem" }}>
                  ₹ {pl.netProfit.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* 2. BALANCE SHEET */}
        {/* ==================================================== */}
        {activeTab === "bs" && (
          <div>
            <h3 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: "4px" }}>Balance Sheet</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "32px" }}>
              Accounting snapshot of the dealership assets, outstanding liabilities, and partner capital equities.
            </p>

            <div className="responsive-grid-2" style={{ gap: "48px", alignItems: "flex-start" }}>
              {/* Left Column: Assets */}
              <div>
                <h4 style={{ borderBottom: "2px solid var(--primary)", paddingBottom: "8px", marginBottom: "16px", color: "var(--primary)", textTransform: "uppercase", fontSize: "0.95rem", letterSpacing: 0.5 }}>
                  Assets (What the Business Owns)
                </h4>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border-light)", fontSize: "0.95rem" }}>
                  <span>Liquid Cash & Bank Balances</span>
                  <strong>₹ {bs.assets.bankCashBalance.toLocaleString("en-IN")}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border-light)", fontSize: "0.95rem" }}>
                  <span>Inventory Stock Value (Vehicles at cost)</span>
                  <strong>₹ {bs.assets.inventoryAssetValue.toLocaleString("en-IN")}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border-light)", fontSize: "0.95rem" }}>
                  <span>Accounts Receivable (Customer Outstandings)</span>
                  <strong>₹ {bs.assets.accountsReceivableValue.toLocaleString("en-IN")}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "16px 0 4px 0", fontSize: "1.1rem", fontWeight: 700 }}>
                  <span>TOTAL ASSETS</span>
                  <span className="text-green">₹ {bs.assets.totalAssets.toLocaleString("en-IN")}</span>
                </div>
              </div>

              {/* Right Column: Liabilities & Equity */}
              <div>
                {/* Liabilities */}
                <div style={{ marginBottom: "24px" }}>
                  <h4 style={{ borderBottom: "2px solid #ef4444", paddingBottom: "8px", marginBottom: "16px", color: "#f87171", textTransform: "uppercase", fontSize: "0.95rem", letterSpacing: 0.5 }}>
                    Liabilities (What is Owed)
                  </h4>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border-light)", fontSize: "0.95rem" }}>
                    <span>Accounts Payable (Seller Payouts Due)</span>
                    <strong>₹ {bs.liabilities.accountsPayableValue.toLocaleString("en-IN")}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0 4px 0", fontSize: "1rem", fontWeight: 700 }}>
                    <span>Total Liabilities</span>
                    <span className="text-red">₹ {bs.liabilities.accountsPayableValue.toLocaleString("en-IN")}</span>
                  </div>
                </div>

                {/* Equity */}
                <div>
                  <h4 style={{ borderBottom: "2px solid #a855f7", paddingBottom: "8px", marginBottom: "16px", color: "#c084fc", textTransform: "uppercase", fontSize: "0.95rem", letterSpacing: 0.5 }}>
                    Capital Equity (Partners Share)
                  </h4>
                  {bs.equity.partnerCapitalBreakdown.map((p) => (
                    <div key={p.id} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border-light)", fontSize: "0.95rem" }}>
                      <span>Capital: {p.name}</span>
                      <strong>₹ {p.equity.toLocaleString("en-IN")}</strong>
                    </div>
                  ))}
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0 4px 0", fontSize: "1rem", fontWeight: 700 }}>
                    <span>Total Capital Equity</span>
                    <span style={{ color: "#c084fc" }}>₹ {bs.equity.totalEquity.toLocaleString("en-IN")}</span>
                  </div>
                </div>

                {/* Liabilities & Equity Total */}
                <div style={{ borderTop: "2px solid var(--text-muted)", marginTop: "24px", paddingTop: "16px", display: "flex", justifyContent: "space-between", fontSize: "1.1rem", fontWeight: 700 }}>
                  <span>TOTAL LIABILITIES & EQUITY</span>
                  <span className="text-green">₹ {bs.totalLiabilitiesAndEquity.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>

            {/* Balancing Check Alert */}
            {Math.abs(bs.assets.totalAssets - bs.totalLiabilitiesAndEquity) > 1 && (
              <div
                style={{
                  marginTop: "32px",
                  background: "rgba(245, 158, 11, 0.08)",
                  border: "1px solid rgba(245, 158, 11, 0.2)",
                  padding: "12px 16px",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  fontSize: "0.85rem",
                  color: "#fbbf24",
                }}
              >
                <AlertCircle size={16} />
                <span>
                  <strong>Accounting Balance Check:</strong> Asset value and Liabilities+Equity values differ slightly by ₹ {Math.abs(bs.assets.totalAssets - bs.totalLiabilitiesAndEquity).toFixed(2)}. Verify all adjusting entries.
                </span>
              </div>
            )}
          </div>
        )}

        {/* ==================================================== */}
        {/* 3. CAR PROFIT SHEET */}
        {/* ==================================================== */}
        {activeTab === "car-profit" && (
          <div>
            <h3 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: "4px" }}>Vehicle Margins Worksheet</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "24px" }}>
              Performance breakdown of each individual car from inventory (Purchase + Repairs vs Sale price).
            </p>

            <div className="table-responsive-wrapper">
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-light)", background: "rgba(255, 255, 255, 0.01)" }}>
                    <th style={{ padding: "12px 16px", fontSize: "0.85rem", color: "var(--text-muted)" }}>Vehicle Context</th>
                    <th style={{ padding: "12px 16px", fontSize: "0.85rem", color: "var(--text-muted)", textAlign: "right" }}>Buy Cost</th>
                    <th style={{ padding: "12px 16px", fontSize: "0.85rem", color: "var(--text-muted)", textAlign: "right" }}>Repair Prep Cost</th>
                    <th style={{ padding: "12px 16px", fontSize: "0.85rem", color: "var(--text-muted)", textAlign: "right" }}>Total Investment</th>
                    <th style={{ padding: "12px 16px", fontSize: "0.85rem", color: "var(--text-muted)", textAlign: "right" }}>Final Sell Price</th>
                    <th style={{ padding: "12px 16px", fontSize: "0.85rem", color: "var(--text-muted)", textAlign: "right" }}>Net Profit</th>
                    <th style={{ padding: "12px 16px", fontSize: "0.85rem", color: "var(--text-muted)" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {initialData.carProfitSheet.map((car) => (
                    <tr key={car.id} style={{ borderBottom: "1px solid var(--border-light)" }}>
                      <td style={{ padding: "12px 16px", fontSize: "0.9rem" }}>
                        <strong>{car.brand} {car.model}</strong> ({car.year})
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>{car.registrationNum}</div>
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: "0.9rem", textAlign: "right" }}>₹ {car.purchasePrice.toLocaleString("en-IN")}</td>
                      <td style={{ padding: "12px 16px", fontSize: "0.9rem", textAlign: "right", color: car.expenses > 0 ? "#f87171" : "var(--text-muted)" }}>
                        ₹ {car.expenses.toLocaleString("en-IN")}
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: "0.9rem", fontWeight: 600, textAlign: "right" }}>₹ {car.totalInvestment.toLocaleString("en-IN")}</td>
                      <td style={{ padding: "12px 16px", fontSize: "0.9rem", textAlign: "right", fontWeight: car.salePrice > 0 ? 600 : 400 }}>
                        {car.salePrice > 0 ? `₹ ${car.salePrice.toLocaleString("en-IN")}` : <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>-</span>}
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: "0.95rem", fontWeight: 700, textAlign: "right", color: car.netProfit > 0 ? "#10b981" : car.status === "Sold" ? "#ef4444" : "var(--text-muted)" }}>
                        {car.status === "Sold" ? `₹ ${car.netProfit.toLocaleString("en-IN")}` : <span style={{ fontSize: "0.8rem", fontWeight: 400 }}>Unrealized</span>}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span
                          style={{
                            padding: "2px 6px",
                            borderRadius: "4px",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            background: car.status === "Sold" ? "rgba(16, 185, 129, 0.15)" : "rgba(6, 182, 212, 0.15)",
                            color: car.status === "Sold" ? "#10b981" : "var(--primary)",
                          }}
                        >
                          {car.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {initialData.carProfitSheet.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ padding: "24px", textAlign: "center", color: "var(--text-muted)", fontSize: "0.9rem" }}>
                        No inventory vehicles tracked in the ERP worksheet yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* 4. OUTSTANDINGS (RECEIVABLES & PAYABLES) */}
        {/* ==================================================== */}
        {activeTab === "receivables-payables" && (
          <div className="responsive-grid-2" style={{ gap: "48px" }}>
            
            {/* Customer Receivables */}
            <div>
              <h4 style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "16px", color: "var(--primary)" }}>
                <TrendingUp size={16} /> Customer Accounts Receivable
              </h4>
              <div className="table-responsive-wrapper">
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border-light)", background: "rgba(255,255,255,0.01)" }}>
                      <th style={{ padding: "10px 12px", textAlign: "left", fontSize: "0.8rem", color: "var(--text-muted)" }}>Customer Name</th>
                      <th style={{ padding: "10px 12px", textAlign: "right", fontSize: "0.8rem", color: "var(--text-muted)" }}>Agreement Total</th>
                      <th style={{ padding: "10px 12px", textAlign: "right", fontSize: "0.8rem", color: "var(--text-muted)" }}>Outstanding</th>
                    </tr>
                  </thead>
                  <tbody>
                    {initialData.customerReceivables.map((r) => (
                      <tr key={r.id} style={{ borderBottom: "1px solid var(--border-light)" }}>
                        <td style={{ padding: "10px 12px", fontSize: "0.85rem" }}>
                          <strong>{r.customerName}</strong>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>{r.phone}</div>
                        </td>
                        <td style={{ padding: "10px 12px", fontSize: "0.85rem", textAlign: "right" }}>₹ {r.total.toLocaleString("en-IN")}</td>
                        <td style={{ padding: "10px 12px", fontSize: "0.85rem", fontWeight: 700, color: r.remaining > 0 ? "#f59e0b" : "var(--text-muted)", textAlign: "right" }}>
                          ₹ {r.remaining.toLocaleString("en-IN")}
                        </td>
                      </tr>
                    ))}
                    {initialData.customerReceivables.length === 0 && (
                      <tr>
                        <td colSpan={3} style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)", fontSize: "0.8rem" }}>
                          No customer outstandings.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Supplier Payables */}
            <div>
              <h4 style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "16px", color: "#f87171" }}>
                <TrendingDown size={16} /> Supplier Accounts Payable
              </h4>
              <div className="table-responsive-wrapper">
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border-light)", background: "rgba(255,255,255,0.01)" }}>
                      <th style={{ padding: "10px 12px", textAlign: "left", fontSize: "0.8rem", color: "var(--text-muted)" }}>Seller Detail</th>
                      <th style={{ padding: "10px 12px", textAlign: "right", fontSize: "0.8rem", color: "var(--text-muted)" }}>Agreement Total</th>
                      <th style={{ padding: "10px 12px", textAlign: "right", fontSize: "0.8rem", color: "var(--text-muted)" }}>Outstanding</th>
                    </tr>
                  </thead>
                  <tbody>
                    {initialData.sellerPayables.map((p) => (
                      <tr key={p.id} style={{ borderBottom: "1px solid var(--border-light)" }}>
                        <td style={{ padding: "10px 12px", fontSize: "0.85rem" }}>
                          <strong>{p.sellerName}</strong>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>{p.carSpec}</div>
                        </td>
                        <td style={{ padding: "10px 12px", fontSize: "0.85rem", textAlign: "right" }}>₹ {p.total.toLocaleString("en-IN")}</td>
                        <td style={{ padding: "10px 12px", fontSize: "0.85rem", fontWeight: 700, color: p.remaining > 0 ? "#ef4444" : "var(--text-muted)", textAlign: "right" }}>
                          ₹ {p.remaining.toLocaleString("en-IN")}
                        </td>
                      </tr>
                    ))}
                    {initialData.sellerPayables.length === 0 && (
                      <tr>
                        <td colSpan={3} style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)", fontSize: "0.8rem" }}>
                          No supplier outstandings.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ==================================================== */}
        {/* 5. PARTNER FINANCIAL STATEMENTS */}
        {/* ==================================================== */}
        {activeTab === "partner-statement" && (
          <div>
            <div className="filter-bar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", flexWrap: "wrap", marginBottom: "24px" }}>
              <div>
                <h3 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: "4px" }}>Partner Financial Statements</h3>
                <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                  Detailed audit reports of capital contributions, personal expenses, and cash withdrawals for each partner.
                </p>
              </div>
              <div>
                <select
                  value={selectedPartnerId}
                  onChange={(e) => setSelectedPartnerId(e.target.value)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "10px",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid var(--border-light)",
                    color: "var(--text-main)",
                    fontSize: "0.9rem",
                    cursor: "pointer",
                    width: "220px",
                  }}
                >
                  <option value="">Select Partner...</option>
                  {bs.equity.partnerCapitalBreakdown.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {(() => {
              const selectedPartner = bs.equity.partnerCapitalBreakdown.find(p => p.id === selectedPartnerId) || bs.equity.partnerCapitalBreakdown[0];
              if (!selectedPartner) {
                return (
                  <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
                    No partners registered in this business.
                  </div>
                );
              }

              // Compute metrics for the partner
              let totalInvested = 0;
              let totalExpenses = 0;
              let totalProfitShares = 0;
              let totalWithdrawn = 0;

              (selectedPartner.ledgerEntries || []).forEach((e) => {
                if (e.type === "CAPITAL_INVESTMENT") totalInvested += e.amount;
                else if (e.type === "EXPENSE_PAID_BY_PARTNER") totalExpenses += e.amount;
                else if (e.type === "PROFIT_SHARE") totalProfitShares += e.amount;
                else if (e.type === "WITHDRAWAL" || e.type === "CAPITAL_RETURN") totalWithdrawn += e.amount;
              });

              return (
                <div>
                  {/* Summary row */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.01)", border: "1px solid var(--border-light)", padding: "16px 20px", borderRadius: "12px", marginBottom: "24px" }}>
                    <div>
                      <strong style={{ fontSize: "1.1rem" }}>{selectedPartner.name}</strong>
                      <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "2px" }}>
                        {selectedPartner.phone || "No Contact"} &bull; {selectedPartner.email || "No Email"}
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Net Capital Balance: </span>
                      <strong style={{ fontSize: "1.2rem", color: selectedPartner.equity >= 0 ? "#10b981" : "#ef4444" }}>
                        ₹ {selectedPartner.equity.toLocaleString("en-IN")}
                      </strong>
                    </div>
                  </div>

                  <div className="responsive-grid-4" style={{ marginBottom: "32px", gap: "16px" }}>
                    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-light)", padding: "16px", borderRadius: "12px" }}>
                      <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "4px" }}>Total Capital Invested</div>
                      <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "#10b981" }}>₹ {totalInvested.toLocaleString("en-IN")}</div>
                    </div>
                    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-light)", padding: "16px", borderRadius: "12px" }}>
                      <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "4px" }}>Expenses Paid Personally</div>
                      <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--primary)" }}>₹ {totalExpenses.toLocaleString("en-IN")}</div>
                    </div>
                    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-light)", padding: "16px", borderRadius: "12px" }}>
                      <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "4px" }}>Profit Shares Allocated</div>
                      <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "#c084fc" }}>₹ {totalProfitShares.toLocaleString("en-IN")}</div>
                    </div>
                    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-light)", padding: "16px", borderRadius: "12px" }}>
                      <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "4px" }}>Capital Withdrawals</div>
                      <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "#ef4444" }}>₹ {totalWithdrawn.toLocaleString("en-IN")}</div>
                    </div>
                  </div>

                  <h4 style={{ marginBottom: "16px", fontSize: "1.1rem" }}>Granular Ledger Statement</h4>
                  <div className="table-responsive-wrapper">
                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid var(--border-light)", background: "rgba(255,255,255,0.01)" }}>
                          <th style={{ padding: "10px 12px", fontSize: "0.8rem", color: "var(--text-muted)" }}>Date</th>
                          <th style={{ padding: "10px 12px", fontSize: "0.8rem", color: "var(--text-muted)" }}>Type</th>
                          <th style={{ padding: "10px 12px", fontSize: "0.8rem", color: "var(--text-muted)" }}>Notes</th>
                          <th style={{ padding: "10px 12px", fontSize: "0.8rem", color: "var(--text-muted)", textAlign: "right" }}>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(selectedPartner.ledgerEntries || []).map((e) => {
                          const isAdd = ["CAPITAL_INVESTMENT", "EXPENSE_PAID_BY_PARTNER", "PROFIT_SHARE"].includes(e.type);
                          return (
                            <tr key={e.id} style={{ borderBottom: "1px solid var(--border-light)" }}>
                              <td style={{ padding: "10px 12px", fontSize: "0.85rem" }}>{new Date(e.date).toLocaleDateString()}</td>
                              <td style={{ padding: "10px 12px", fontSize: "0.85rem" }}>
                                <span style={{
                                  padding: "2px 6px",
                                  borderRadius: "4px",
                                  background: isAdd ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
                                  color: isAdd ? "#10b981" : "#ef4444",
                                  fontSize: "0.75rem",
                                  fontWeight: 600
                                }}>
                                  {e.type.replace(/_/g, " ")}
                                </span>
                              </td>
                              <td style={{ padding: "10px 12px", fontSize: "0.85rem", color: "var(--text-muted)" }}>{e.notes || "-"}</td>
                              <td style={{ padding: "10px 12px", fontSize: "0.85rem", fontWeight: 600, textAlign: "right", color: isAdd ? "#10b981" : "#ef4444" }}>
                                {isAdd ? "+" : "-"} ₹ {e.amount.toLocaleString("en-IN")}
                              </td>
                            </tr>
                          );
                        })}
                        {(!selectedPartner.ledgerEntries || selectedPartner.ledgerEntries.length === 0) && (
                          <tr>
                            <td colSpan={4} style={{ padding: "24px", textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                              No ledger entries posted for this partner.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

      </div>
    </div>
  );
}
