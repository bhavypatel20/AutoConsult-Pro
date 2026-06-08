"use client";

import React, { useState, useTransition, useMemo } from "react";
import {
  Plus,
  ArrowUpDown,
  UserCheck,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Landmark,
  Users,
  Search,
  FileText,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  IndianRupee,
  X,
  ShieldAlert,
} from "lucide-react";
import {
  createPartner,
  updatePartner,
  addPartnerLedgerEntry,
  createBankAccount,
  transferBankAccountFunds,
  addCustomerPayment,
  addSellerPayment,
  createIncomeEntry,
  createExpenseEntry,
} from "@/actions/erp";

interface Car {
  id: string;
  brand: string;
  model: string;
  year: number;
  registrationNum: string;
  purchasePrice: number;
  status: string;
}

interface Partner {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  ownershipPercent: number | null;
  isActive: boolean;
  currentBalance: number;
}

interface BankAccount {
  id: string;
  name: string;
  accountNumber: string | null;
  balance: number;
}

interface Transaction {
  id: string;
  transactionNum: string;
  date: string;
  type: string;
  amount: number;
  paymentMode: string;
  notes: string | null;
  fromAccountId: string | null;
  toAccountId: string | null;
  relatedEntityId: string | null;
}

interface CustomerLedger {
  id: string;
  totalAmount: number;
  advanceReceived: number;
  remainingAmount: number;
  status: string;
  dueDate: string | null;
  customer: {
    id: string;
    name: string;
    phone: string;
  };
}

interface SellerLedger {
  id: string;
  sellerName: string;
  totalPurchaseAmount: number;
  paidAmount: number;
  pendingAmount: number;
  status: string;
  car: {
    id: string;
    brand: string;
    model: string;
    year: number;
    registrationNum: string;
  };
}

interface IncomeEntry {
  id: string;
  amount: number;
  category: string;
  paymentMode: string;
  date: string;
  notes: string | null;
}

interface ExpenseEntry {
  id: string;
  amount: number;
  category: string;
  paidBy: string;
  billUrl: string | null;
  date: string;
  notes: string | null;
}

interface FinanceClientProps {
  initialPartners: Partner[];
  initialBankAccounts: BankAccount[];
  initialTransactions: Transaction[];
  initialCustomerLedgers: CustomerLedger[];
  initialSellerLedgers: SellerLedger[];
  initialIncomeEntries: IncomeEntry[];
  initialExpenseEntries: ExpenseEntry[];
  cars: Car[];
  isReadOnly: boolean;
  role: string;
}

const TABS = [
  { id: "cash-bank", label: "Cash & Banks", icon: Landmark },
  { id: "income-expense", label: "Income & Expenses", icon: ReceiptIcon },
  { id: "partners", label: "Partner Accounts", icon: Users },
  { id: "customers", label: "Customer Ledger", icon: UserCheck },
  { id: "sellers", label: "Seller Ledger", icon: TrendingDown },
  { id: "transactions", label: "Universal Ledger", icon: FileText },
];

function ReceiptIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
      <path d="M16 8H8" />
      <path d="M16 12H8" />
      <path d="M13 16H8" />
    </svg>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 16px",
  borderRadius: "12px",
  background: "rgba(255, 255, 255, 0.05)",
  border: "1px solid var(--border-light)",
  color: "var(--text-main)",
  outline: "none",
  fontSize: "0.95rem",
  marginTop: "6px",
};

const labelStyle: React.CSSProperties = {
  fontSize: "0.85rem",
  color: "var(--text-muted)",
  display: "flex",
  flexDirection: "column",
  gap: "4px",
};

const modalBackdropStyle: React.CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: "rgba(9, 9, 11, 0.85)",
  backdropFilter: "blur(12px)",
  zIndex: 1000,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "20px",
};

const modalContentStyle: React.CSSProperties = {
  background: "#18181b",
  border: "1px solid var(--border-light)",
  borderRadius: "20px",
  width: "100%",
  maxWidth: "520px",
  boxShadow: "0 20px 50px rgba(0, 0, 0, 0.5)",
  overflow: "hidden",
  maxHeight: "min(720px, calc(100vh - 40px))",
  display: "flex",
  flexDirection: "column",
};

const modalFormStyle: React.CSSProperties = {
  padding: "24px",
  display: "flex",
  flexDirection: "column",
  gap: "16px",
  overflowY: "auto",
  flexGrow: 1,
  minHeight: 0,
};

export default function FinanceClient({
  initialPartners,
  initialBankAccounts,
  initialTransactions,
  initialCustomerLedgers,
  initialSellerLedgers,
  initialIncomeEntries,
  initialExpenseEntries,
  cars,
  isReadOnly,
  role,
}: FinanceClientProps) {
  const [activeTab, setActiveTab] = useState("cash-bank");
  const [isPending, startTransition] = useTransition();

  // State arrays derived from pages (or mutated through transitions refresh)
  const [partners, setPartners] = useState(initialPartners);
  const [bankAccounts, setBankAccounts] = useState(initialBankAccounts);
  const [transactions, setTransactions] = useState(initialTransactions);
  const [customerLedgers, setCustomerLedgers] = useState(initialCustomerLedgers);
  const [sellerLedgers, setSellerLedgers] = useState(initialSellerLedgers);
  const [incomeEntries, setIncomeEntries] = useState(initialIncomeEntries);
  const [expenseEntries, setExpenseEntries] = useState(initialExpenseEntries);

  // Active Modals
  const [activeModal, setActiveModal] = useState<string | null>(null);
  
  // Specific Selected Elements for Modal actions
  const [selectedCustomerLedger, setSelectedCustomerLedger] = useState<CustomerLedger | null>(null);
  const [selectedSellerLedger, setSelectedSellerLedger] = useState<SellerLedger | null>(null);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);

  // Filters
  const [txnSearch, setTxnSearch] = useState("");
  const [txnTypeFilter, setTxnTypeFilter] = useState("ALL");
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState("ALL");

  // Expense Form Reactive State
  const [expensePaidBy, setExpensePaidBy] = useState("Company");
  const [expenseCategory, setExpenseCategory] = useState("RENT");
  const [customExpenseCategory, setCustomExpenseCategory] = useState("");
  const [selectedCarId, setSelectedCarId] = useState("");

  React.useEffect(() => {
    if (activeModal !== "log-expense") {
      setExpensePaidBy("Company");
      setExpenseCategory("RENT");
      setCustomExpenseCategory("");
      setSelectedCarId("");
    }
  }, [activeModal]);

  // Summary Metrics calculations
  const totalCashBankBalance = useMemo(() => {
    return bankAccounts.reduce((sum, acc) => sum + acc.balance, 0);
  }, [bankAccounts]);

  const visibleTabs = useMemo(() => {
    if (partners.length <= 1) {
      return TABS.filter((t) => t.id !== "partners");
    }
    return TABS;
  }, [partners]);

  const totalOutstandingReceivables = useMemo(() => {
    return customerLedgers.reduce((sum, l) => sum + l.remainingAmount, 0);
  }, [customerLedgers]);

  const totalOutstandingPayables = useMemo(() => {
    return sellerLedgers.reduce((sum, l) => sum + l.pendingAmount, 0);
  }, [sellerLedgers]);

  // Form submission helpers wrapping actions
  const runAction = (actionFn: (fd: FormData) => Promise<any>, successMsg: string) => {
    return async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      startTransition(async () => {
        try {
          await actionFn(fd);
          alert(successMsg);
          // Reset forms and close modal
          setActiveModal(null);
          setSelectedCustomerLedger(null);
          setSelectedSellerLedger(null);
          setSelectedPartner(null);
          // Let Next.js revalidation refresh server side states, but update local state temporarily/optimistically if needed
          window.location.reload();
        } catch (err: any) {
          alert(err.message || "Action failed");
        }
      });
    };
  };

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const matchesSearch =
        t.transactionNum.toLowerCase().includes(txnSearch.toLowerCase()) ||
        (t.notes && t.notes.toLowerCase().includes(txnSearch.toLowerCase()));
      const matchesType = txnTypeFilter === "ALL" || t.type === txnTypeFilter;
      return matchesSearch && matchesType;
    });
  }, [transactions, txnSearch, txnTypeFilter]);

  return (
    <div>
      {/* Role Alert / Banner for View-Only */}
      {isReadOnly && (
        <div
          className="glass-card flex"
          style={{
            background: "rgba(239, 68, 68, 0.08)",
            border: "1px solid rgba(239, 68, 68, 0.2)",
            marginBottom: "24px",
            alignItems: "center",
            padding: "16px 20px",
          }}
        >
          <ShieldAlert size={20} style={{ color: "#ef4444", marginRight: "12px", flexShrink: 0 }} />
          <div style={{ fontSize: "0.9rem", color: "#f87171" }}>
            <strong>View-Only Privilege:</strong> You are logged in with partner view-only rights. You can inspect ledgers and audit histories, but financial modifications and logging payouts are restricted.
          </div>
        </div>
      )}

      {/* Main ERP Quick Summary */}
      <div className="responsive-grid-3" style={{ marginBottom: "32px" }}>
        <div className="glass-card" style={{ padding: "20px 24px" }}>
          <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "6px" }}>
            Total Available Cash & Bank
          </div>
          <div style={{ fontSize: "1.8rem", fontWeight: 700, color: "var(--primary)" }}>
            ₹ {totalCashBankBalance.toLocaleString("en-IN")}
          </div>
        </div>
        <div className="glass-card" style={{ padding: "20px 24px" }}>
          <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "6px" }}>
            Outstanding Customer Receivables
          </div>
          <div style={{ fontSize: "1.8rem", fontWeight: 700, color: "var(--secondary)" }}>
            ₹ {totalOutstandingReceivables.toLocaleString("en-IN")}
          </div>
        </div>
        <div className="glass-card" style={{ padding: "20px 24px" }}>
          <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "6px" }}>
            Outstanding Supplier Payables
          </div>
          <div style={{ fontSize: "1.8rem", fontWeight: 700, color: "#f59e0b" }}>
            ₹ {totalOutstandingPayables.toLocaleString("en-IN")}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div
        className="glass-card"
        style={{
          padding: "8px",
          display: "flex",
          gap: "8px",
          marginBottom: "32px",
          overflowX: "auto",
          borderRadius: "14px",
        }}
      >
        {visibleTabs.map((tab) => {
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
                padding: "10px 20px",
                borderRadius: "10px",
                border: "none",
                background: isActive ? "linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)" : "transparent",
                color: isActive ? "#fff" : "var(--text-muted)",
                fontWeight: 600,
                fontSize: "0.9rem",
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.2s ease",
              }}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENTS */}
      <div className="glass-card" style={{ padding: "24px", minHeight: "400px" }}>
        
        {/* ==================================================== */}
        {/* 1. CASH & BANKS TAB */}
        {/* ==================================================== */}
        {activeTab === "cash-bank" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 600 }}>Accounts & Cash Book</h3>
              {!isReadOnly && (
                <div style={{ display: "flex", gap: "12px" }}>
                  <button onClick={() => setActiveModal("transfer")} className="btn-primary" style={{ padding: "8px 16px", background: "rgba(255,255,255,0.05)", color: "var(--text-main)", boxShadow: "none", fontSize: "0.85rem" }}>
                    Transfer Funds
                  </button>
                  <button onClick={() => setActiveModal("create-account")} className="btn-primary" style={{ padding: "8px 16px", fontSize: "0.85rem" }}>
                    <Plus size={16} style={{ marginRight: 6 }} /> New Bank
                  </button>
                </div>
              )}
            </div>

            <div className="responsive-grid-3" style={{ marginBottom: "32px" }}>
              {bankAccounts.map((acc) => (
                <div
                  key={acc.id}
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid var(--border-light)",
                    borderRadius: "16px",
                    padding: "20px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    position: "relative",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "8px" }}>
                      {acc.name === "Cash" ? <IndianRupee size={16} style={{ color: "#10b981" }} /> : <Landmark size={16} style={{ color: "var(--primary)" }} />}
                      {acc.name} Ledger
                    </div>
                    {acc.accountNumber && (
                      <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "12px" }}>
                        Acc: {acc.accountNumber}
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: "1.6rem", fontWeight: 700, color: "var(--text-main)", marginTop: "10px" }}>
                    ₹ {acc.balance.toLocaleString("en-IN")}
                  </div>
                </div>
              ))}
            </div>

            <h4 style={{ marginBottom: "16px", fontSize: "1.1rem" }}>Cash/Bank Account Movements</h4>
            <div className="table-responsive-wrapper">
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-light)", background: "rgba(255,255,255,0.01)" }}>
                    <th style={{ padding: "12px 16px", fontSize: "0.85rem", color: "var(--text-muted)" }}>Date</th>
                    <th style={{ padding: "12px 16px", fontSize: "0.85rem", color: "var(--text-muted)" }}>Txn ID</th>
                    <th style={{ padding: "12px 16px", fontSize: "0.85rem", color: "var(--text-muted)" }}>Type</th>
                    <th style={{ padding: "12px 16px", fontSize: "0.85rem", color: "var(--text-muted)" }}>Account Swap</th>
                    <th style={{ padding: "12px 16px", fontSize: "0.85rem", color: "var(--text-muted)" }}>Mode</th>
                    <th style={{ padding: "12px 16px", fontSize: "0.85rem", color: "var(--text-muted)", textAlign: "right" }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions
                    .filter((t) => t.fromAccountId || t.toAccountId)
                    .slice(0, 10)
                    .map((t) => {
                      const fromAcc = bankAccounts.find((a) => a.id === t.fromAccountId);
                      const toAcc = bankAccounts.find((a) => a.id === t.toAccountId);
                      return (
                        <tr key={t.id} style={{ borderBottom: "1px solid var(--border-light)" }}>
                          <td style={{ padding: "12px 16px", fontSize: "0.9rem" }}>{new Date(t.date).toLocaleDateString()}</td>
                          <td style={{ padding: "12px 16px", fontSize: "0.85rem", color: "var(--text-muted)" }}>{t.transactionNum}</td>
                          <td style={{ padding: "12px 16px", fontSize: "0.9rem" }}>
                            <span style={{ fontSize: "0.8rem", textTransform: "capitalize" }}>
                              {t.type.replace("_", " ")}
                            </span>
                          </td>
                          <td style={{ padding: "12px 16px", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                            {t.type === "TRANSFER" ? (
                              <span>{fromAcc?.name} &rarr; {toAcc?.name}</span>
                            ) : t.toAccountId ? (
                              <span>Deposit: {toAcc?.name}</span>
                            ) : (
                              <span>Deduction: {fromAcc?.name}</span>
                            )}
                          </td>
                          <td style={{ padding: "12px 16px", fontSize: "0.85rem" }}>
                            <span style={{ padding: "2px 6px", borderRadius: 4, background: "rgba(255,255,255,0.05)" }}>
                              {t.paymentMode}
                            </span>
                          </td>
                          <td style={{ padding: "12px 16px", fontSize: "0.9rem", fontWeight: 600, textAlign: "right", color: t.toAccountId && t.type !== "TRANSFER" ? "#10b981" : t.fromAccountId && t.type !== "TRANSFER" ? "#ef4444" : "var(--text-main)" }}>
                            {t.toAccountId && t.type !== "TRANSFER" ? "+" : t.fromAccountId && t.type !== "TRANSFER" ? "-" : ""} ₹ {t.amount.toLocaleString("en-IN")}
                          </td>
                        </tr>
                      );
                    })}
                  {transactions.filter((t) => t.fromAccountId || t.toAccountId).length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ padding: "24px", textAlign: "center", color: "var(--text-muted)", fontSize: "0.9rem" }}>
                        No account entries registered.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* 2. INCOME & EXPENSES TAB */}
        {/* ==================================================== */}
        {activeTab === "income-expense" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 600 }}>Income & Office Overhead Expenditures</h3>
              {!isReadOnly && (
                <div style={{ display: "flex", gap: "12px" }}>
                  <button onClick={() => setActiveModal("log-income")} className="btn-primary" style={{ padding: "8px 16px", background: "rgba(16, 185, 129, 0.1)", color: "#10b981", boxShadow: "none", fontSize: "0.85rem" }}>
                    <Plus size={14} style={{ marginRight: 6 }} /> Log Income
                  </button>
                  <button onClick={() => setActiveModal("log-expense")} className="btn-primary" style={{ padding: "8px 16px", background: "rgba(239, 68, 68, 0.1)", color: "#f87171", boxShadow: "none", fontSize: "0.85rem" }}>
                    <Plus size={14} style={{ marginRight: 6 }} /> Log Expense
                  </button>
                </div>
              )}
            </div>

            <div className="responsive-grid-2" style={{ gap: "32px" }}>
              {/* Left Panel: Income Entries */}
              <div>
                <h4 style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "16px", color: "#10b981" }}>
                  <TrendingUp size={18} /> Dealership Income Log
                </h4>
                <div className="table-responsive-wrapper">
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--border-light)", background: "rgba(255,255,255,0.01)" }}>
                        <th style={{ padding: "10px 12px", textAlign: "left", fontSize: "0.8rem", color: "var(--text-muted)" }}>Date</th>
                        <th style={{ padding: "10px 12px", textAlign: "left", fontSize: "0.8rem", color: "var(--text-muted)" }}>Category</th>
                        <th style={{ padding: "10px 12px", textAlign: "left", fontSize: "0.8rem", color: "var(--text-muted)" }}>Notes</th>
                        <th style={{ padding: "10px 12px", textAlign: "right", fontSize: "0.8rem", color: "var(--text-muted)" }}>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {incomeEntries.map((inc) => (
                        <tr key={inc.id} style={{ borderBottom: "1px solid var(--border-light)" }}>
                          <td style={{ padding: "10px 12px", fontSize: "0.85rem" }}>{new Date(inc.date).toLocaleDateString()}</td>
                          <td style={{ padding: "10px 12px", fontSize: "0.85rem" }}>
                            <span style={{ padding: "2px 6px", borderRadius: 4, background: "rgba(16, 185, 129, 0.1)", color: "#10b981", fontSize: "0.75rem", fontWeight: 600 }}>
                              {inc.category}
                            </span>
                          </td>
                          <td style={{ padding: "10px 12px", fontSize: "0.85rem", color: "var(--text-muted)" }}>{inc.notes || "-"}</td>
                          <td style={{ padding: "10px 12px", fontSize: "0.85rem", fontWeight: 600, color: "#10b981", textAlign: "right" }}>
                            + ₹ {inc.amount.toLocaleString("en-IN")}
                          </td>
                        </tr>
                      ))}
                      {incomeEntries.length === 0 && (
                        <tr>
                          <td colSpan={4} style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)", fontSize: "0.8rem" }}>
                            No income entries logged yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right Panel: Expense Entries */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <h4 style={{ display: "flex", alignItems: "center", gap: 8, color: "#f87171" }}>
                    <TrendingDown size={18} /> Overhead Expenses Log
                  </h4>
                  <select
                    value={expenseCategoryFilter}
                    onChange={(e) => setExpenseCategoryFilter(e.target.value)}
                    style={{
                      padding: "4px 8px",
                      borderRadius: "6px",
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid var(--border-light)",
                      color: "var(--text-main)",
                      fontSize: "0.8rem",
                      cursor: "pointer",
                      width: "auto",
                    }}
                  >
                    <option value="ALL">All Categories</option>
                    <option value="RENT">Rent</option>
                    <option value="SALARY">Salary</option>
                    <option value="ELECTRICITY">Electricity</option>
                    <option value="REPAIR">Car Repair</option>
                    <option value="FUEL">Fuel</option>
                    <option value="TRAVEL">Travel</option>
                    <option value="MARKETING">Marketing</option>
                    <option value="MISCELLANEOUS">Miscellaneous</option>
                  </select>
                </div>
                <div className="table-responsive-wrapper">
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--border-light)", background: "rgba(255,255,255,0.01)" }}>
                        <th style={{ padding: "10px 12px", textAlign: "left", fontSize: "0.8rem", color: "var(--text-muted)" }}>Date</th>
                        <th style={{ padding: "10px 12px", textAlign: "left", fontSize: "0.8rem", color: "var(--text-muted)" }}>Category & PaidBy</th>
                        <th style={{ padding: "10px 12px", textAlign: "left", fontSize: "0.8rem", color: "var(--text-muted)" }}>Attachment</th>
                        <th style={{ padding: "10px 12px", textAlign: "right", fontSize: "0.8rem", color: "var(--text-muted)" }}>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expenseEntries
                        .filter((exp) => expenseCategoryFilter === "ALL" || exp.category === expenseCategoryFilter)
                        .map((exp) => (
                          <tr key={exp.id} style={{ borderBottom: "1px solid var(--border-light)" }}>
                            <td style={{ padding: "10px 12px", fontSize: "0.85rem" }}>{new Date(exp.date).toLocaleDateString()}</td>
                            <td style={{ padding: "10px 12px", fontSize: "0.85rem" }}>
                              <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                                <span style={{ padding: "2px 6px", borderRadius: 4, background: "rgba(239, 68, 68, 0.1)", color: "#f87171", fontSize: "0.75rem", fontWeight: 600 }}>
                                  {exp.category}
                                </span>
                                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                                  via {exp.paidBy}
                                </span>
                              </div>
                              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
                                {exp.notes}
                              </div>
                            </td>
                            <td style={{ padding: "10px 12px", fontSize: "0.85rem" }}>
                              {exp.billUrl ? (
                                <a
                                  href={exp.billUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "4px",
                                    color: "var(--primary)",
                                    fontSize: "0.8rem",
                                    fontWeight: 600,
                                  }}
                                >
                                  <Eye size={12} /> View Bill
                                </a>
                              ) : (
                                <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>None</span>
                              )}
                            </td>
                            <td style={{ padding: "10px 12px", fontSize: "0.85rem", fontWeight: 600, color: "#f87171", textAlign: "right" }}>
                              - ₹ {exp.amount.toLocaleString("en-IN")}
                            </td>
                          </tr>
                        ))}
                      {expenseEntries.filter((exp) => expenseCategoryFilter === "ALL" || exp.category === expenseCategoryFilter).length === 0 && (
                        <tr>
                          <td colSpan={4} style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)", fontSize: "0.8rem" }}>
                            No expenses logged matching category.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* 3. PARTNERS & CAPITAL LEDGER TAB */}
        {/* ==================================================== */}
        {activeTab === "partners" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 600 }}>Dealership Partners & Equity</h3>
              {!isReadOnly && (
                <div style={{ display: "flex", gap: "12px" }}>
                  <button onClick={() => setActiveModal("partner-ledger")} className="btn-primary" style={{ padding: "8px 16px", background: "rgba(255,255,255,0.05)", color: "var(--text-main)", boxShadow: "none", fontSize: "0.85rem" }}>
                    Log Partner Ledger Entry
                  </button>
                  {role === "OWNER" && (
                    <button onClick={() => setActiveModal("add-partner")} className="btn-primary" style={{ padding: "8px 16px", fontSize: "0.85rem" }}>
                      <Plus size={16} style={{ marginRight: 6 }} /> Register Partner
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="responsive-grid-3" style={{ marginBottom: "32px" }}>
              {partners.map((p) => (
                <div
                  key={p.id}
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid var(--border-light)",
                    borderRadius: "16px",
                    padding: "20px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                      <div>
                        <strong style={{ fontSize: "1.05rem", color: "var(--text-main)" }}>{p.name}</strong>
                        <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "2px" }}>
                          {p.phone}
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          padding: "2px 8px",
                          borderRadius: "4px",
                          background: p.isActive ? "rgba(16, 185, 129, 0.15)" : "rgba(255,255,255,0.08)",
                          color: p.isActive ? "#10b981" : "var(--text-muted)",
                          fontWeight: 600,
                        }}
                      >
                        {p.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    {p.email && (
                      <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "6px" }}>
                        Email: {p.email}
                      </div>
                    )}
                    {p.ownershipPercent && (
                      <div style={{ fontSize: "0.85rem", color: "var(--primary)", fontWeight: 600 }}>
                        Ownership Share: {p.ownershipPercent}%
                      </div>
                    )}
                  </div>
                  <div style={{ borderTop: "1px solid var(--border-light)", marginTop: "16px", paddingTop: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Current Balance:</span>
                    <strong style={{ fontSize: "1.15rem", color: p.currentBalance >= 0 ? "#10b981" : "#ef4444" }}>
                      ₹ {p.currentBalance.toLocaleString("en-IN")}
                    </strong>
                  </div>
                  {role === "OWNER" && !isReadOnly && (
                    <button
                      onClick={() => {
                        setSelectedPartner(p);
                        setActiveModal("edit-partner");
                      }}
                      style={{
                        marginTop: "12px",
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid var(--border-light)",
                        padding: "6px",
                        borderRadius: "8px",
                        fontSize: "0.8rem",
                        color: "var(--text-main)",
                        cursor: "pointer",
                      }}
                    >
                      Modify Partner Specs
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Sub-ledger History */}
            <h4 style={{ marginBottom: "16px", fontSize: "1.1rem" }}>Capital Ledgers Audit Trail</h4>
            <div className="table-responsive-wrapper">
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-light)", background: "rgba(255,255,255,0.01)" }}>
                    <th style={{ padding: "12px 16px", fontSize: "0.85rem", color: "var(--text-muted)" }}>Date</th>
                    <th style={{ padding: "12px 16px", fontSize: "0.85rem", color: "var(--text-muted)" }}>Partner Name</th>
                    <th style={{ padding: "12px 16px", fontSize: "0.85rem", color: "var(--text-muted)" }}>Entry Type</th>
                    <th style={{ padding: "12px 16px", fontSize: "0.85rem", color: "var(--text-muted)" }}>Description</th>
                    <th style={{ padding: "12px 16px", fontSize: "0.85rem", color: "var(--text-muted)", textAlign: "right" }}>Ledger Flow</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions
                    .filter((t) => t.type.includes("PARTNER") || t.type.includes("CAPITAL") || t.type.includes("WITHDRAWAL"))
                    .map((t) => {
                      const matchedPartner = partners.find((p) => p.id === t.relatedEntityId);
                      return (
                        <tr key={t.id} style={{ borderBottom: "1px solid var(--border-light)" }}>
                          <td style={{ padding: "12px 16px", fontSize: "0.9rem" }}>{new Date(t.date).toLocaleDateString()}</td>
                          <td style={{ padding: "12px 16px", fontSize: "0.9rem", fontWeight: 600 }}>{matchedPartner?.name || "Dealership"}</td>
                          <td style={{ padding: "12px 16px", fontSize: "0.85rem" }}>
                            <span style={{
                              padding: "2px 6px",
                              borderRadius: 4,
                              background: t.type.includes("INVEST") ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
                              color: t.type.includes("INVEST") ? "#10b981" : "#f87171",
                              fontSize: "0.75rem",
                              fontWeight: 600
                            }}>
                              {t.type.replace("_", " ")}
                            </span>
                          </td>
                          <td style={{ padding: "12px 16px", fontSize: "0.85rem", color: "var(--text-muted)" }}>{t.notes}</td>
                          <td style={{ padding: "12px 16px", fontSize: "0.9rem", fontWeight: 600, textAlign: "right", color: t.type.includes("INVEST") ? "#10b981" : "#ef4444" }}>
                            {t.type.includes("INVEST") ? "+" : "-"} ₹ {t.amount.toLocaleString("en-IN")}
                          </td>
                        </tr>
                      );
                    })}
                  {transactions.filter((t) => t.type.includes("PARTNER") || t.type.includes("CAPITAL") || t.type.includes("WITHDRAWAL")).length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ padding: "24px", textAlign: "center", color: "var(--text-muted)", fontSize: "0.9rem" }}>
                        No partner ledger transactions recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* 4. CUSTOMER LEDGER TAB */}
        {/* ==================================================== */}
        {activeTab === "customers" && (
          <div>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "16px" }}>Outstanding Receivables Ledger</h3>
            <div className="table-responsive-wrapper">
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-light)", background: "rgba(255,255,255,0.01)" }}>
                    <th style={{ padding: "12px 16px", fontSize: "0.85rem", color: "var(--text-muted)" }}>Customer</th>
                    <th style={{ padding: "12px 16px", fontSize: "0.85rem", color: "var(--text-muted)" }}>Due Date</th>
                    <th style={{ padding: "12px 16px", fontSize: "0.85rem", color: "var(--text-muted)" }}>Status</th>
                    <th style={{ padding: "12px 16px", fontSize: "0.85rem", color: "var(--text-muted)" }}>Total Deal Amt</th>
                    <th style={{ padding: "12px 16px", fontSize: "0.85rem", color: "var(--text-muted)" }}>Advance Paid</th>
                    <th style={{ padding: "12px 16px", fontSize: "0.85rem", color: "var(--text-muted)" }}>Outstanding Balance</th>
                    {!isReadOnly && <th style={{ padding: "12px 16px", fontSize: "0.85rem", color: "var(--text-muted)", textAlign: "right" }}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {customerLedgers.map((l) => (
                    <tr key={l.id} style={{ borderBottom: "1px solid var(--border-light)" }}>
                      <td style={{ padding: "12px 16px", fontSize: "0.9rem" }}>
                        <strong>{l.customer.name}</strong>
                        <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "2px" }}>{l.customer.phone}</div>
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: "0.85rem" }}>
                        {l.dueDate ? new Date(l.dueDate).toLocaleDateString() : "No Schedule Set"}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span
                          style={{
                            padding: "2px 8px",
                            borderRadius: "4px",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            background: l.status === "Completed" ? "rgba(16, 185, 129, 0.15)" : l.status === "Partial" ? "rgba(6, 182, 212, 0.15)" : "rgba(245, 158, 11, 0.15)",
                            color: l.status === "Completed" ? "#10b981" : l.status === "Partial" ? "var(--primary)" : "#f59e0b",
                          }}
                        >
                          {l.status}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: "0.9rem" }}>₹ {l.totalAmount.toLocaleString("en-IN")}</td>
                      <td style={{ padding: "12px 16px", fontSize: "0.9rem", color: "#10b981" }}>₹ {l.advanceReceived.toLocaleString("en-IN")}</td>
                      <td style={{ padding: "12px 16px", fontSize: "0.9rem", fontWeight: 700, color: l.remainingAmount > 0 ? "#f59e0b" : "var(--text-muted)" }}>
                        ₹ {l.remainingAmount.toLocaleString("en-IN")}
                      </td>
                      {!isReadOnly && (
                        <td style={{ padding: "12px 16px", textAlign: "right" }}>
                          {l.remainingAmount > 0 ? (
                            <button
                              onClick={() => {
                                setSelectedCustomerLedger(l);
                                setActiveModal("log-customer-payment");
                              }}
                              className="btn-primary"
                              style={{ padding: "6px 12px", borderRadius: "8px", fontSize: "0.8rem" }}
                            >
                              Log Installment
                            </button>
                          ) : (
                            <span style={{ color: "#10b981", fontSize: "0.8rem", display: "inline-flex", alignItems: "center", gap: 4 }}>
                              <CheckCircle2 size={12} /> Settled
                            </span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                  {customerLedgers.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ padding: "24px", textAlign: "center", color: "var(--text-muted)", fontSize: "0.9rem" }}>
                        No customer ledgers created yet. Leads automatically create ledgers when deals close.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* 5. SELLER LEDGER TAB */}
        {/* ==================================================== */}
        {activeTab === "sellers" && (
          <div>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "16px" }}>Outstanding Supplier Payables Ledger</h3>
            <div className="table-responsive-wrapper">
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-light)", background: "rgba(255,255,255,0.01)" }}>
                    <th style={{ padding: "12px 16px", fontSize: "0.85rem", color: "var(--text-muted)" }}>Seller Detail</th>
                    <th style={{ padding: "12px 16px", fontSize: "0.85rem", color: "var(--text-muted)" }}>Vehicle Context</th>
                    <th style={{ padding: "12px 16px", fontSize: "0.85rem", color: "var(--text-muted)" }}>Status</th>
                    <th style={{ padding: "12px 16px", fontSize: "0.85rem", color: "var(--text-muted)" }}>Purchase Agreement Cost</th>
                    <th style={{ padding: "12px 16px", fontSize: "0.85rem", color: "var(--text-muted)" }}>Dealership Paid</th>
                    <th style={{ padding: "12px 16px", fontSize: "0.85rem", color: "var(--text-muted)" }}>Pending Liabilities</th>
                    {!isReadOnly && <th style={{ padding: "12px 16px", fontSize: "0.85rem", color: "var(--text-muted)", textAlign: "right" }}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {sellerLedgers.map((l) => (
                    <tr key={l.id} style={{ borderBottom: "1px solid var(--border-light)" }}>
                      <td style={{ padding: "12px 16px", fontSize: "0.9rem" }}>
                        <strong>{l.sellerName}</strong>
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                        {l.car.year} {l.car.brand} {l.car.model}
                        <div style={{ fontSize: "0.75rem", fontStyle: "italic", marginTop: "2px" }}>{l.car.registrationNum}</div>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span
                          style={{
                            padding: "2px 8px",
                            borderRadius: "4px",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            background: l.status === "Completed" ? "rgba(16, 185, 129, 0.15)" : l.status === "Partial" ? "rgba(6, 182, 212, 0.15)" : "rgba(239, 68, 68, 0.15)",
                            color: l.status === "Completed" ? "#10b981" : l.status === "Partial" ? "var(--primary)" : "#ef4444",
                          }}
                        >
                          {l.status}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: "0.9rem" }}>₹ {l.totalPurchaseAmount.toLocaleString("en-IN")}</td>
                      <td style={{ padding: "12px 16px", fontSize: "0.9rem", color: "#10b981" }}>₹ {l.paidAmount.toLocaleString("en-IN")}</td>
                      <td style={{ padding: "12px 16px", fontSize: "0.9rem", fontWeight: 700, color: l.pendingAmount > 0 ? "#ef4444" : "var(--text-muted)" }}>
                        ₹ {l.pendingAmount.toLocaleString("en-IN")}
                      </td>
                      {!isReadOnly && (
                        <td style={{ padding: "12px 16px", textAlign: "right" }}>
                          {l.pendingAmount > 0 ? (
                            <button
                              onClick={() => {
                                setSelectedSellerLedger(l);
                                setActiveModal("log-seller-payment");
                              }}
                              className="btn-primary"
                              style={{ padding: "6px 12px", borderRadius: "8px", fontSize: "0.8rem", background: "linear-gradient(135deg, #ef4444 0%, #f59e0b 100%)", boxShadow: "none" }}
                            >
                              Log Payout
                            </button>
                          ) : (
                            <span style={{ color: "#10b981", fontSize: "0.8rem", display: "inline-flex", alignItems: "center", gap: 4 }}>
                              <CheckCircle2 size={12} /> Settled
                            </span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                  {sellerLedgers.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ padding: "24px", textAlign: "center", color: "var(--text-muted)", fontSize: "0.9rem" }}>
                        No supplier records logged.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* 6. UNIVERSAL LEDGER TAB */}
        {/* ==================================================== */}
        {activeTab === "transactions" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", flexWrap: "wrap", marginBottom: "24px" }}>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 600 }}>Master Transaction Audit Trail</h3>
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <div style={{ position: "relative" }}>
                  <input
                    type="text"
                    placeholder="Search Transaction ID or Notes..."
                    value={txnSearch}
                    onChange={(e) => setTxnSearch(e.target.value)}
                    style={{
                      padding: "8px 12px 8px 36px",
                      borderRadius: "10px",
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid var(--border-light)",
                      color: "var(--text-main)",
                      fontSize: "0.85rem",
                      width: "240px",
                    }}
                  />
                  <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                </div>
                <select
                  value={txnTypeFilter}
                  onChange={(e) => setTxnTypeFilter(e.target.value)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: "10px",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid var(--border-light)",
                    color: "var(--text-main)",
                    fontSize: "0.85rem",
                    width: "180px",
                    cursor: "pointer",
                  }}
                >
                  <option value="ALL">All Flows</option>
                  <option value="INCOME">Income Only</option>
                  <option value="EXPENSE">Expenses Only</option>
                  <option value="CUSTOMER_PAYMENT">Customer Installments</option>
                  <option value="SELLER_PAYMENT">Seller Payouts</option>
                  <option value="PARTNER_INVESTMENT">Partner Investments</option>
                  <option value="CAPITAL_RETURN">Capital Returns</option>
                  <option value="WITHDRAWAL">Partner Withdrawals</option>
                  <option value="TRANSFER">Internal Transfers</option>
                </select>
              </div>
            </div>

            <div className="table-responsive-wrapper">
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-light)", background: "rgba(255,255,255,0.01)" }}>
                    <th style={{ padding: "12px 16px", fontSize: "0.85rem", color: "var(--text-muted)" }}>Date</th>
                    <th style={{ padding: "12px 16px", fontSize: "0.85rem", color: "var(--text-muted)" }}>Txn Number</th>
                    <th style={{ padding: "12px 16px", fontSize: "0.85rem", color: "var(--text-muted)" }}>Type</th>
                    <th style={{ padding: "12px 16px", fontSize: "0.85rem", color: "var(--text-muted)" }}>Payment Method</th>
                    <th style={{ padding: "12px 16px", fontSize: "0.85rem", color: "var(--text-muted)" }}>Notes / Details</th>
                    <th style={{ padding: "12px 16px", fontSize: "0.85rem", color: "var(--text-muted)", textAlign: "right" }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((t) => {
                    const isIncome = [
                      "INCOME",
                      "CUSTOMER_PAYMENT",
                      "PARTNER_INVESTMENT",
                    ].includes(t.type);
                    const isExpense = [
                      "EXPENSE",
                      "SELLER_PAYMENT",
                      "CAPITAL_RETURN",
                      "WITHDRAWAL",
                    ].includes(t.type);
                    return (
                      <tr key={t.id} style={{ borderBottom: "1px solid var(--border-light)" }}>
                        <td style={{ padding: "12px 16px", fontSize: "0.9rem" }}>{new Date(t.date).toLocaleDateString()}</td>
                        <td style={{ padding: "12px 16px", fontSize: "0.85rem", color: "var(--text-muted)" }}>{t.transactionNum}</td>
                        <td style={{ padding: "12px 16px", fontSize: "0.85rem" }}>
                          <span style={{
                            padding: "2px 6px",
                            borderRadius: 4,
                            background: isIncome ? "rgba(16, 185, 129, 0.15)" : isExpense ? "rgba(239, 68, 68, 0.15)" : "rgba(255,255,255,0.08)",
                            color: isIncome ? "#10b981" : isExpense ? "#f87171" : "var(--text-muted)",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            textTransform: "capitalize",
                          }}>
                            {t.type.replace("_", " ")}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: "0.85rem" }}>
                          <span style={{ padding: "2px 6px", borderRadius: 4, background: "rgba(255,255,255,0.05)" }}>
                            {t.paymentMode}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: "0.85rem", color: "var(--text-muted)" }}>{t.notes}</td>
                        <td style={{ padding: "12px 16px", fontSize: "0.9rem", fontWeight: 700, textAlign: "right", color: isIncome ? "#10b981" : isExpense ? "#ef4444" : "var(--text-main)" }}>
                          {isIncome ? "+" : isExpense ? "-" : ""} ₹ {t.amount.toLocaleString("en-IN")}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredTransactions.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ padding: "24px", textAlign: "center", color: "var(--text-muted)", fontSize: "0.9rem" }}>
                        No matching transactions found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ==================================================== */}
      {/* MODALS OVERLAYS */}
      {/* ==================================================== */}

      {/* 1. Create Bank Account */}
      {activeModal === "create-account" && (
        <div style={modalBackdropStyle} onClick={() => setActiveModal(null)}>
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border-light)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0 }}>Register Dealership Account</h3>
              <button onClick={() => setActiveModal(null)} style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer" }}><X size={18} /></button>
            </div>
            <form onSubmit={runAction(createBankAccount, "Bank Account added successfully")} style={modalFormStyle}>
              <label style={labelStyle}>
                Account Display Name
                <input type="text" name="name" required placeholder="HDFC Current, Office Cash Drawer, etc." style={inputStyle} />
              </label>
              <label style={labelStyle}>
                Account Number (Optional)
                <input type="text" name="accountNumber" placeholder="9180200XXXXXX" style={inputStyle} />
              </label>
              <label style={labelStyle}>
                Opening Balance (₹)
                <input type="number" name="balance" defaultValue="0" min="0" style={inputStyle} />
              </label>
              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "12px" }}>
                <button type="button" onClick={() => setActiveModal(null)} className="btn-primary" style={{ background: "rgba(255,255,255,0.05)", color: "var(--text-main)", boxShadow: "none" }}>Cancel</button>
                <button type="submit" disabled={isPending} className="btn-primary">{isPending ? "Creating..." : "Save Account"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Transfer Funds */}
      {activeModal === "transfer" && (
        <div style={modalBackdropStyle} onClick={() => setActiveModal(null)}>
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border-light)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0 }}>Internal Account Transfer</h3>
              <button onClick={() => setActiveModal(null)} style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer" }}><X size={18} /></button>
            </div>
            <form onSubmit={runAction(transferBankAccountFunds, "Funds transferred successfully")} style={modalFormStyle}>
              <div className="responsive-grid-2">
                <label style={labelStyle}>
                  From Account
                  <select name="fromAccountId" required style={inputStyle}>
                    {bankAccounts.map((a) => (
                      <option key={a.id} value={a.id}>{a.name} (₹ {a.balance})</option>
                    ))}
                  </select>
                </label>
                <label style={labelStyle}>
                  To Account
                  <select name="toAccountId" required style={inputStyle}>
                    {bankAccounts.map((a) => (
                      <option key={a.id} value={a.id}>{a.name} (₹ {a.balance})</option>
                    ))}
                  </select>
                </label>
              </div>
              <label style={labelStyle}>
                Transfer Amount (₹)
                <input type="number" name="amount" required min="1" placeholder="Enter amount to transfer" style={inputStyle} />
              </label>
              <label style={labelStyle}>
                Internal Memo / Notes
                <input type="text" name="notes" placeholder="Transfer for cash box replenishment, etc." style={inputStyle} />
              </label>
              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "12px" }}>
                <button type="button" onClick={() => setActiveModal(null)} className="btn-primary" style={{ background: "rgba(255,255,255,0.05)", color: "var(--text-main)", boxShadow: "none" }}>Cancel</button>
                <button type="submit" disabled={isPending} className="btn-primary">{isPending ? "Transferring..." : "Execute Transfer"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Register Partner */}
      {activeModal === "add-partner" && (
        <div style={modalBackdropStyle} onClick={() => setActiveModal(null)}>
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border-light)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0 }}>Register New Dealership Partner</h3>
              <button onClick={() => setActiveModal(null)} style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer" }}><X size={18} /></button>
            </div>
            <form onSubmit={runAction(createPartner, "Partner registered successfully")} style={modalFormStyle}>
              <label style={labelStyle}>
                Partner Full Name
                <input type="text" name="name" required placeholder="Partner Name" style={inputStyle} />
              </label>
              <div className="responsive-grid-2">
                <label style={labelStyle}>
                  Mobile Number
                  <input type="tel" name="phone" required placeholder="10 Digit Number" style={inputStyle} />
                </label>
                <label style={labelStyle}>
                  Equity Ownership %
                  <input type="number" name="ownershipPercent" min="0" max="100" placeholder="e.g. 25" style={inputStyle} />
                </label>
              </div>
              <label style={labelStyle}>
                Email Address
                <input type="email" name="email" placeholder="partner@autoconsult.com" style={inputStyle} />
              </label>
              <label style={labelStyle}>
                Residential Address
                <input type="text" name="address" placeholder="Residential detail..." style={inputStyle} />
              </label>
              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "12px" }}>
                <button type="button" onClick={() => setActiveModal(null)} className="btn-primary" style={{ background: "rgba(255,255,255,0.05)", color: "var(--text-main)", boxShadow: "none" }}>Cancel</button>
                <button type="submit" disabled={isPending} className="btn-primary">{isPending ? "Saving..." : "Create Partner"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Edit Partner */}
      {activeModal === "edit-partner" && selectedPartner && (
        <div style={modalBackdropStyle} onClick={() => setActiveModal(null)}>
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border-light)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0 }}>Modify Partner Specs</h3>
              <button onClick={() => setActiveModal(null)} style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer" }}><X size={18} /></button>
            </div>
            <form onSubmit={runAction(updatePartner, "Partner details updated successfully")} style={modalFormStyle}>
              <input type="hidden" name="id" value={selectedPartner.id} />
              <label style={labelStyle}>
                Partner Full Name
                <input type="text" name="name" required defaultValue={selectedPartner.name} style={inputStyle} />
              </label>
              <div className="responsive-grid-2">
                <label style={labelStyle}>
                  Mobile Number
                  <input type="tel" name="phone" required defaultValue={selectedPartner.phone} style={inputStyle} />
                </label>
                <label style={labelStyle}>
                  Equity Ownership %
                  <input type="number" name="ownershipPercent" min="0" max="100" defaultValue={selectedPartner.ownershipPercent || ""} style={inputStyle} />
                </label>
              </div>
              <label style={labelStyle}>
                Email Address
                <input type="email" name="email" defaultValue={selectedPartner.email || ""} style={inputStyle} />
              </label>
              <label style={labelStyle}>
                Residential Address
                <input type="text" name="address" defaultValue={selectedPartner.address || ""} style={inputStyle} />
              </label>
              <label style={labelStyle}>
                Active Status
                <select name="isActive" defaultValue={String(selectedPartner.isActive)} style={inputStyle}>
                  <option value="true">Active Partner</option>
                  <option value="false">Deactivated / Silent</option>
                </select>
              </label>
              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "12px" }}>
                <button type="button" onClick={() => setActiveModal(null)} className="btn-primary" style={{ background: "rgba(255,255,255,0.05)", color: "var(--text-main)", boxShadow: "none" }}>Cancel</button>
                <button type="submit" disabled={isPending} className="btn-primary">{isPending ? "Saving..." : "Update Partner"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Log Partner Ledger Entry */}
      {activeModal === "partner-ledger" && (
        <div style={modalBackdropStyle} onClick={() => setActiveModal(null)}>
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border-light)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0 }}>Log Partner Ledger Entry</h3>
              <button onClick={() => setActiveModal(null)} style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer" }}><X size={18} /></button>
            </div>
            <form onSubmit={runAction(addPartnerLedgerEntry, "Partner ledger entry saved")} style={modalFormStyle}>
              <label style={labelStyle}>
                Select Partner
                <select name="partnerId" required style={inputStyle}>
                  {partners.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </label>
              <div className="responsive-grid-2">
                <label style={labelStyle}>
                  Transaction Type
                  <select name="type" required style={inputStyle}>
                    <option value="CAPITAL_INVESTMENT">Capital Investment</option>
                    <option value="CAPITAL_RETURN">Capital Return</option>
                    <option value="WITHDRAWAL">Personal Withdrawal / Profit Payout</option>
                    <option value="ADJUSTMENT">General Ledger Adjustment</option>
                  </select>
                </label>
                <label style={labelStyle}>
                  Associated Cash/Bank Account
                  <select name="bankAccountId" required style={inputStyle}>
                    {bankAccounts.map((a) => (
                      <option key={a.id} value={a.id}>{a.name} (₹ {a.balance})</option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="responsive-grid-2">
                <label style={labelStyle}>
                  Transaction Amount (₹)
                  <input type="number" name="amount" required min="1" placeholder="Enter ledger value" style={inputStyle} />
                </label>
                <label style={labelStyle}>
                  Transaction Date
                  <input type="date" name="date" required defaultValue={new Date().toISOString().substring(0, 10)} style={inputStyle} />
                </label>
              </div>
              <label style={labelStyle}>
                Internal Ledger Notes / Memo
                <input type="text" name="notes" placeholder="Initial franchise investment capital, profit share payout, etc." style={inputStyle} />
              </label>
              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "12px" }}>
                <button type="button" onClick={() => setActiveModal(null)} className="btn-primary" style={{ background: "rgba(255,255,255,0.05)", color: "var(--text-main)", boxShadow: "none" }}>Cancel</button>
                <button type="submit" disabled={isPending} className="btn-primary">{isPending ? "Submitting..." : "Post Transaction"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Log Income */}
      {activeModal === "log-income" && (
        <div style={modalBackdropStyle} onClick={() => setActiveModal(null)}>
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border-light)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0 }}>Log Dealership Income</h3>
              <button onClick={() => setActiveModal(null)} style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer" }}><X size={18} /></button>
            </div>
            <form onSubmit={runAction(createIncomeEntry, "Income entry logged successfully")} style={modalFormStyle}>
              <div className="responsive-grid-2">
                <label style={labelStyle}>
                  Income Category
                  <select name="category" required style={inputStyle}>
                    <option value="COMMISSION">Brokerage Commission</option>
                    <option value="VALUATION_FEES">Car Valuation Fees</option>
                    <option value="INSURANCE_PAYOUT">Insurance Commission</option>
                    <option value="OTHER_SERVICES">Other Auxiliary Services</option>
                  </select>
                </label>
                <label style={labelStyle}>
                  Payment Mode
                  <select name="paymentMode" required style={inputStyle}>
                    <option value="CASH">Cash Payment</option>
                    <option value="BANK_TRANSFER">Bank Wire / Transfer</option>
                    <option value="UPI">UPI Instant Pay</option>
                    <option value="CHEQUE">Cheque Clearance</option>
                  </select>
                </label>
              </div>
              <div className="responsive-grid-2">
                <label style={labelStyle}>
                  Receive Date
                  <input type="date" name="date" required defaultValue={new Date().toISOString().substring(0, 10)} style={inputStyle} />
                </label>
                <label style={labelStyle}>
                  Deposit Destination Account
                  <select name="bankAccountId" required style={inputStyle}>
                    {bankAccounts.map((a) => (
                      <option key={a.id} value={a.id}>{a.name} (₹ {a.balance})</option>
                    ))}
                  </select>
                </label>
              </div>
              <label style={labelStyle}>
                Amount Received (₹)
                <input type="number" name="amount" required min="1" placeholder="₹" style={inputStyle} />
              </label>
              <label style={labelStyle}>
                Description / Memo
                <input type="text" name="notes" placeholder="Income detail..." style={inputStyle} />
              </label>
              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "12px" }}>
                <button type="button" onClick={() => setActiveModal(null)} className="btn-primary" style={{ background: "rgba(255,255,255,0.05)", color: "var(--text-main)", boxShadow: "none" }}>Cancel</button>
                <button type="submit" disabled={isPending} className="btn-primary">{isPending ? "Logging..." : "Log Income"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Log Expense */}
      {activeModal === "log-expense" && (
        <div style={modalBackdropStyle} onClick={() => setActiveModal(null)}>
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border-light)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0 }}>Log Business Expense</h3>
              <button onClick={() => setActiveModal(null)} style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer" }}><X size={18} /></button>
            </div>
            <form onSubmit={runAction(createExpenseEntry, "Expense logged successfully")} style={modalFormStyle}>
              <div className="responsive-grid-2">
                <label style={labelStyle}>
                  Expense Category
                  <select 
                    name={expenseCategory === "Other" ? "categorySelect" : "category"} 
                    required 
                    value={expenseCategory}
                    onChange={(e) => setExpenseCategory(e.target.value)}
                    style={inputStyle}
                  >
                    {!selectedCarId && (
                      <>
                        <option value="RENT">Office Rent</option>
                        <option value="SALARY">Salaries / Wages</option>
                        <option value="ELECTRICITY">Office Utilities / Electricity</option>
                        <option value="MARKETING">Marketing & Advertisements</option>
                      </>
                    )}
                    <option value="PURCHASE">Vehicle Purchase</option>
                    <option value="RTO">RTO / Paperwork</option>
                    <option value="REPAIR">Car Repair / Service</option>
                    <option value="FUEL">Fuel Charges</option>
                    <option value="TRAVEL">Logistics / Travel</option>
                    <option value="MISCELLANEOUS">Miscellaneous / Petty Cash</option>
                    <option value="Other">Other</option>
                  </select>
                </label>
                {partners.length > 1 ? (
                  <label style={labelStyle}>
                    Fund Source (Paid By)
                    <select
                      name="paidBy"
                      required
                      value={expensePaidBy}
                      onChange={(e) => setExpensePaidBy(e.target.value)}
                      style={inputStyle}
                    >
                      <option value="Company">Company Account (Cash/Bank)</option>
                      <option value="Partner">Partner (Out of Pocket)</option>
                    </select>
                  </label>
                ) : (
                  <input type="hidden" name="paidBy" value="Company" />
                )}
              </div>

              {expenseCategory === "Other" && (
                <label style={labelStyle}>
                  Specify Custom Expense Category
                  <input 
                    type="text" 
                    name="category" 
                    required 
                    value={customExpenseCategory} 
                    onChange={(e) => setCustomExpenseCategory(e.target.value)} 
                    style={inputStyle} 
                    placeholder="e.g. Office Supplies, Software" 
                  />
                </label>
              )}

              <div className="responsive-grid-2">
                {expensePaidBy === "Company" ? (
                  <label style={labelStyle}>
                    Source Bank Account
                    <select name="bankAccountId" required style={inputStyle}>
                      {bankAccounts.map((a) => (
                        <option key={a.id} value={a.id}>{a.name} (₹ {a.balance})</option>
                      ))}
                    </select>
                  </label>
                ) : (
                  <label style={labelStyle}>
                    Select Credited Partner
                    <select name="partnerId" required style={inputStyle}>
                      {partners.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </label>
                )}
                <label style={labelStyle}>
                  Attached Vehicle (Optional)
                  <select 
                    name="carId" 
                    value={selectedCarId}
                    onChange={(e) => {
                      const cid = e.target.value;
                      setSelectedCarId(cid);
                      if (cid && !["REPAIR", "FUEL", "TRAVEL", "MISCELLANEOUS", "Other"].includes(expenseCategory)) {
                        setExpenseCategory("REPAIR");
                      }
                    }}
                    style={inputStyle}
                  >
                    <option value="">None (General Overhead)</option>
                    {cars.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.brand} {c.model} ({c.registrationNum})
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="responsive-grid-2">
                <label style={labelStyle}>
                  Expense Date
                  <input type="date" name="date" required defaultValue={new Date().toISOString().substring(0, 10)} style={inputStyle} />
                </label>
                <label style={labelStyle}>
                  Upload Bill Receipt (PDF / Image)
                  <input type="file" name="bill" accept="image/*,application/pdf" style={inputStyle} />
                </label>
              </div>

              <label style={labelStyle}>
                Amount Spent (₹)
                <input type="number" name="amount" required min="1" placeholder="₹" style={inputStyle} />
              </label>

              <label style={labelStyle}>
                Description / Memo {selectedCarId && <span style={{ color: "#ef4444" }}>*</span>}
                <input 
                  type="text" 
                  name="notes" 
                  required={!!selectedCarId}
                  placeholder={selectedCarId ? "Describe the vehicle expense details..." : "e.g. Office chair repairing, June Rent, etc."} 
                  style={inputStyle} 
                />
              </label>

              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "12px" }}>
                <button type="button" onClick={() => setActiveModal(null)} className="btn-primary" style={{ background: "rgba(255,255,255,0.05)", color: "var(--text-main)", boxShadow: "none" }}>Cancel</button>
                <button type="submit" disabled={isPending} className="btn-primary">{isPending ? "Logging..." : "Log Expense"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. Log Customer Installment Payment */}
      {activeModal === "log-customer-payment" && selectedCustomerLedger && (
        <div style={modalBackdropStyle} onClick={() => { setActiveModal(null); setSelectedCustomerLedger(null); }}>
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border-light)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0 }}>Log Customer Payment</h3>
              <button onClick={() => { setActiveModal(null); setSelectedCustomerLedger(null); }} style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer" }}><X size={18} /></button>
            </div>
            <form onSubmit={runAction(addCustomerPayment, "Payment logged successfully")} style={modalFormStyle}>
              <input type="hidden" name="ledgerId" value={selectedCustomerLedger.id} />
              <div style={{ fontSize: "0.9rem", color: "var(--text-muted)", background: "rgba(255,255,255,0.02)", padding: "12px", borderRadius: "8px", border: "1px solid var(--border-light)" }}>
                <div>Customer: <strong>{selectedCustomerLedger.customer.name}</strong></div>
                <div>Outstanding Balance: <strong style={{ color: "#f59e0b" }}>₹ {selectedCustomerLedger.remainingAmount.toLocaleString("en-IN")}</strong></div>
              </div>
              <div className="responsive-grid-2">
                <label style={labelStyle}>
                  Payment Mode
                  <select name="paymentMode" required style={inputStyle}>
                    <option value="CASH">Cash Payment</option>
                    <option value="BANK_TRANSFER">Bank Wire / Transfer</option>
                    <option value="UPI">UPI Instant Pay</option>
                    <option value="CHEQUE">Cheque Clearance</option>
                  </select>
                </label>
                <label style={labelStyle}>
                  Destination Account
                  <select name="bankAccountId" required style={inputStyle}>
                    {bankAccounts.map((a) => (
                      <option key={a.id} value={a.id}>{a.name} (₹ {a.balance})</option>
                    ))}
                  </select>
                </label>
              </div>
              <label style={labelStyle}>
                Installment Amount Paid (₹)
                <input
                  type="number"
                  name="amount"
                  required
                  min="1"
                  max={selectedCustomerLedger.remainingAmount}
                  placeholder={`Max: ₹ ${selectedCustomerLedger.remainingAmount}`}
                  style={inputStyle}
                />
              </label>
              <label style={labelStyle}>
                Reference / Receipt Notes
                <input type="text" name="notes" placeholder="Second installment payment, etc." style={inputStyle} />
              </label>
              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "12px" }}>
                <button type="button" onClick={() => { setActiveModal(null); setSelectedCustomerLedger(null); }} className="btn-primary" style={{ background: "rgba(255,255,255,0.05)", color: "var(--text-main)", boxShadow: "none" }}>Cancel</button>
                <button type="submit" disabled={isPending} className="btn-primary">{isPending ? "Logging..." : "Post Payment"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 9. Log Seller Payment Payout */}
      {activeModal === "log-seller-payment" && selectedSellerLedger && (
        <div style={modalBackdropStyle} onClick={() => { setActiveModal(null); setSelectedSellerLedger(null); }}>
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border-light)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0 }}>Log Supplier Payout</h3>
              <button onClick={() => { setActiveModal(null); setSelectedSellerLedger(null); }} style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer" }}><X size={18} /></button>
            </div>
            <form onSubmit={runAction(addSellerPayment, "Payout logged successfully")} style={modalFormStyle}>
              <input type="hidden" name="ledgerId" value={selectedSellerLedger.id} />
              <div style={{ fontSize: "0.9rem", color: "var(--text-muted)", background: "rgba(255,255,255,0.02)", padding: "12px", borderRadius: "8px", border: "1px solid var(--border-light)" }}>
                <div>Seller / Supplier: <strong>{selectedSellerLedger.sellerName}</strong></div>
                <div>Vehicle: <strong>{selectedSellerLedger.car.year} {selectedSellerLedger.car.brand} {selectedSellerLedger.car.model}</strong></div>
                <div>Liabilities Outstanding: <strong style={{ color: "#ef4444" }}>₹ {selectedSellerLedger.pendingAmount.toLocaleString("en-IN")}</strong></div>
              </div>
              <div className="responsive-grid-2">
                <label style={labelStyle}>
                  Payment Mode
                  <select name="paymentMode" required style={inputStyle}>
                    <option value="CASH">Cash Payout</option>
                    <option value="BANK_TRANSFER">Bank Wire / Transfer</option>
                    <option value="UPI">UPI Instant Pay</option>
                    <option value="CHEQUE">Cheque Clearance</option>
                  </select>
                </label>
                <label style={labelStyle}>
                  Source Account (Deduction)
                  <select name="bankAccountId" required style={inputStyle}>
                    {bankAccounts.map((a) => (
                      <option key={a.id} value={a.id}>{a.name} (₹ {a.balance})</option>
                    ))}
                  </select>
                </label>
              </div>
              <label style={labelStyle}>
                Payout Amount Paid (₹)
                <input
                  type="number"
                  name="amount"
                  required
                  min="1"
                  max={selectedSellerLedger.pendingAmount}
                  placeholder={`Max: ₹ ${selectedSellerLedger.pendingAmount}`}
                  style={inputStyle}
                />
              </label>
              <label style={labelStyle}>
                Reference / Receipt Notes
                <input type="text" name="notes" placeholder="Settlement payout for vehicle, etc." style={inputStyle} />
              </label>
              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "12px" }}>
                <button type="button" onClick={() => { setActiveModal(null); setSelectedSellerLedger(null); }} className="btn-primary" style={{ background: "rgba(255,255,255,0.05)", color: "var(--text-main)", boxShadow: "none" }}>Cancel</button>
                <button type="submit" disabled={isPending} className="btn-primary">{isPending ? "Logging..." : "Log Payout"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
