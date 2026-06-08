"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getActiveBusiness } from "./business";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const delay = (ms: number) => Promise.resolve();

function formDataToJson(formData: FormData) {
  const obj: any = {};
  formData.forEach((value, key) => {
    obj[key] = value;
  });
  return obj;
}

// 1. Partners actions
export async function getPartners() {
  try {
    const context = await getActiveBusiness();
    if (!context) redirect("/onboarding");
    const businessId = context.business.id;

    const res = await fetch(`${API_URL}/erp/partners?businessId=${businessId}`, {
      cache: 'no-store',
      headers: {
        'Authorization': `Bearer ${process.env.BACKEND_API_KEY}`
      }
    });

    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error("getPartners fetch failed:", error);
    return [];
  }
}

export async function createPartner(formData: FormData) {
  await delay(1000);
  const context = await getActiveBusiness();
  if (!context) redirect("/onboarding");
  if (context.membership.role === "PARTNER_VIEW") {
    throw new Error("Unauthorized: View-only partners cannot add partners.");
  }

  const payload = formDataToJson(formData);
  payload.businessId = context.business.id;

  const res = await fetch(`${API_URL}/erp/partners`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.BACKEND_API_KEY}`
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Failed to create partner");
  }

  revalidatePath("/dashboard/finance");
}

export async function updatePartner(formData: FormData) {
  await delay(1000);
  const context = await getActiveBusiness();
  if (!context) redirect("/onboarding");
  if (context.membership.role !== "OWNER") {
    throw new Error("Unauthorized: Only business owners can edit partner details.");
  }

  const id = formData.get("id") as string;
  const payload = formDataToJson(formData);
  payload.businessId = context.business.id;

  const res = await fetch(`${API_URL}/erp/partners/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.BACKEND_API_KEY}`
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Failed to update partner");
  }

  revalidatePath("/dashboard/finance");
}

// 2. Partner Ledger actions
export async function getPartnerLedger(partnerId: string) {
  try {
    const context = await getActiveBusiness();
    if (!context) redirect("/onboarding");
    const businessId = context.business.id;

    const res = await fetch(`${API_URL}/erp/partners/${partnerId}/ledger?businessId=${businessId}`, {
      cache: 'no-store',
      headers: {
        'Authorization': `Bearer ${process.env.BACKEND_API_KEY}`
      }
    });

    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error("getPartnerLedger fetch failed:", error);
    return [];
  }
}

export async function addPartnerLedgerEntry(formData: FormData) {
  await delay(1000);
  const context = await getActiveBusiness();
  if (!context) redirect("/onboarding");
  if (context.membership.role === "PARTNER_VIEW") {
    throw new Error("Unauthorized: View-only partners cannot add ledger entries.");
  }

  const partnerId = formData.get("partnerId") as string;
  const payload = formDataToJson(formData);
  payload.businessId = context.business.id;

  const res = await fetch(`${API_URL}/erp/partners/${partnerId}/ledger`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.BACKEND_API_KEY}`
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Failed to add ledger entry");
  }

  revalidatePath("/dashboard/finance");
  revalidatePath("/dashboard");
}

// 3. Bank Account actions
export async function getBankAccounts() {
  try {
    const context = await getActiveBusiness();
    if (!context) redirect("/onboarding");
    const businessId = context.business.id;

    const res = await fetch(`${API_URL}/erp/bank-accounts?businessId=${businessId}`, {
      cache: 'no-store',
      headers: {
        'Authorization': `Bearer ${process.env.BACKEND_API_KEY}`
      }
    });

    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error("getBankAccounts fetch failed:", error);
    return [];
  }
}

export async function createBankAccount(formData: FormData) {
  await delay(1000);
  const context = await getActiveBusiness();
  if (!context) redirect("/onboarding");
  if (context.membership.role === "PARTNER_VIEW") {
    throw new Error("Unauthorized: View-only partners cannot create bank accounts.");
  }

  const payload = formDataToJson(formData);
  payload.businessId = context.business.id;

  const res = await fetch(`${API_URL}/erp/bank-accounts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.BACKEND_API_KEY}`
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Failed to create bank account");
  }

  revalidatePath("/dashboard/finance");
}

export async function transferBankAccountFunds(formData: FormData) {
  await delay(1000);
  const context = await getActiveBusiness();
  if (!context) redirect("/onboarding");
  if (context.membership.role === "PARTNER_VIEW") {
    throw new Error("Unauthorized: View-only partners cannot make fund transfers.");
  }

  const payload = formDataToJson(formData);
  payload.businessId = context.business.id;

  const res = await fetch(`${API_URL}/erp/bank-accounts/transfer`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.BACKEND_API_KEY}`
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Failed to transfer funds");
  }

  revalidatePath("/dashboard/finance");
  revalidatePath("/dashboard");
}

// 4. Master Transactions
export async function getTransactions() {
  try {
    const context = await getActiveBusiness();
    if (!context) redirect("/onboarding");
    const businessId = context.business.id;

    const res = await fetch(`${API_URL}/erp/transactions?businessId=${businessId}`, {
      cache: 'no-store',
      headers: {
        'Authorization': `Bearer ${process.env.BACKEND_API_KEY}`
      }
    });

    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error("getTransactions fetch failed:", error);
    return [];
  }
}

// 5. Customer Ledgers
export async function getCustomerLedgers() {
  try {
    const context = await getActiveBusiness();
    if (!context) redirect("/onboarding");
    const businessId = context.business.id;

    const res = await fetch(`${API_URL}/erp/customer-ledgers?businessId=${businessId}`, {
      cache: 'no-store',
      headers: {
        'Authorization': `Bearer ${process.env.BACKEND_API_KEY}`
      }
    });

    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error("getCustomerLedgers fetch failed:", error);
    return [];
  }
}

export async function addCustomerPayment(formData: FormData) {
  await delay(1000);
  const context = await getActiveBusiness();
  if (!context) redirect("/onboarding");
  if (context.membership.role === "PARTNER_VIEW") {
    throw new Error("Unauthorized: View-only partners cannot log payments.");
  }

  const ledgerId = formData.get("ledgerId") as string;
  const payload = formDataToJson(formData);
  payload.businessId = context.business.id;

  const res = await fetch(`${API_URL}/erp/customer-ledgers/${ledgerId}/payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.BACKEND_API_KEY}`
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Failed to log customer payment");
  }

  revalidatePath("/dashboard/finance");
  revalidatePath("/dashboard");
}

// 6. Seller Ledgers
export async function getSellerLedgers() {
  try {
    const context = await getActiveBusiness();
    if (!context) redirect("/onboarding");
    const businessId = context.business.id;

    const res = await fetch(`${API_URL}/erp/seller-ledgers?businessId=${businessId}`, {
      cache: 'no-store',
      headers: {
        'Authorization': `Bearer ${process.env.BACKEND_API_KEY}`
      }
    });

    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error("getSellerLedgers fetch failed:", error);
    return [];
  }
}

export async function addSellerPayment(formData: FormData) {
  await delay(1000);
  const context = await getActiveBusiness();
  if (!context) redirect("/onboarding");
  if (context.membership.role === "PARTNER_VIEW") {
    throw new Error("Unauthorized: View-only partners cannot log payouts.");
  }

  const ledgerId = formData.get("ledgerId") as string;
  const payload = formDataToJson(formData);
  payload.businessId = context.business.id;

  const res = await fetch(`${API_URL}/erp/seller-ledgers/${ledgerId}/payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.BACKEND_API_KEY}`
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Failed to log seller payment");
  }

  revalidatePath("/dashboard/finance");
  revalidatePath("/dashboard");
}

// 7. Income actions
export async function getIncomeEntries() {
  try {
    const context = await getActiveBusiness();
    if (!context) redirect("/onboarding");
    const businessId = context.business.id;

    const res = await fetch(`${API_URL}/erp/income?businessId=${businessId}`, {
      cache: 'no-store',
      headers: {
        'Authorization': `Bearer ${process.env.BACKEND_API_KEY}`
      }
    });

    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error("getIncomeEntries fetch failed:", error);
    return [];
  }
}

export async function createIncomeEntry(formData: FormData) {
  await delay(1000);
  const context = await getActiveBusiness();
  if (!context) redirect("/onboarding");
  if (context.membership.role === "PARTNER_VIEW") {
    throw new Error("Unauthorized: View-only partners cannot log income.");
  }

  const payload = formDataToJson(formData);
  payload.businessId = context.business.id;

  const res = await fetch(`${API_URL}/erp/income`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.BACKEND_API_KEY}`
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Failed to log income");
  }

  revalidatePath("/dashboard/finance");
  revalidatePath("/dashboard");
}

// 8. Expense actions
export async function getExpenseEntries() {
  try {
    const context = await getActiveBusiness();
    if (!context) redirect("/onboarding");
    const businessId = context.business.id;

    const res = await fetch(`${API_URL}/erp/expenses?businessId=${businessId}`, {
      cache: 'no-store',
      headers: {
        'Authorization': `Bearer ${process.env.BACKEND_API_KEY}`
      }
    });

    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error("getExpenseEntries fetch failed:", error);
    return [];
  }
}

export async function createExpenseEntry(formData: FormData) {
  await delay(1000);
  const context = await getActiveBusiness();
  if (!context) redirect("/onboarding");
  if (context.membership.role === "PARTNER_VIEW") {
    throw new Error("Unauthorized: View-only partners cannot log expenses.");
  }

  formData.append("businessId", context.business.id);

  const res = await fetch(`${API_URL}/erp/expenses`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.BACKEND_API_KEY}`
    },
    body: formData // Form data handles file uploads automatically
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Failed to log expense");
  }

  revalidatePath("/dashboard/finance");
  revalidatePath("/dashboard");
}

// 9. Financial Reports
export async function getReportData(year?: string, month?: string) {
  try {
    const context = await getActiveBusiness();
    if (!context) redirect("/onboarding");
    const businessId = context.business.id;

    let query = `?businessId=${businessId}`;
    if (year) query += `&year=${year}`;
    if (month) query += `&month=${month}`;

    const res = await fetch(`${API_URL}/erp/reports${query}`, {
      cache: 'no-store',
      headers: {
        'Authorization': `Bearer ${process.env.BACKEND_API_KEY}`
      }
    });

    if (!res.ok) {
      return {
        reportingPeriod: { year: year || 'All', month: month || 'All' },
        profitAndLoss: { revenue: { carSaleRevenue: 0, otherIncome: 0, totalRevenue: 0 }, cogs: { carPurchaseCost: 0, carPrepExpenses: 0, totalCogs: 0 }, operatingExpenses: 0, netProfit: 0 },
        balanceSheet: { assets: { bankCashBalance: 0, inventoryAssetValue: 0, accountsReceivableValue: 0, totalAssets: 0 }, liabilities: { accountsPayableValue: 0 }, equity: { partnerCapitalBreakdown: [], totalEquity: 0 }, totalLiabilitiesAndEquity: 0 },
        carProfitSheet: [],
        customerReceivables: [],
        sellerPayables: []
      };
    }

    return await res.json();
  } catch (error) {
    console.error("getReportData fetch failed:", error);
    return {
      reportingPeriod: { year: year || 'All', month: month || 'All' },
      profitAndLoss: { revenue: { carSaleRevenue: 0, otherIncome: 0, totalRevenue: 0 }, cogs: { carPurchaseCost: 0, carPrepExpenses: 0, totalCogs: 0 }, operatingExpenses: 0, netProfit: 0 },
      balanceSheet: { assets: { bankCashBalance: 0, inventoryAssetValue: 0, accountsReceivableValue: 0, totalAssets: 0 }, liabilities: { accountsPayableValue: 0 }, equity: { partnerCapitalBreakdown: [], totalEquity: 0 }, totalLiabilitiesAndEquity: 0 },
      carProfitSheet: [],
      customerReceivables: [],
      sellerPayables: []
    };
  }
}

export async function deleteIncomeEntry(id: string) {
  const context = await getActiveBusiness();
  if (!context) redirect("/onboarding");
  if (context.membership.role !== "OWNER") {
    throw new Error("Unauthorized: Only owners can delete income entries.");
  }

  const res = await fetch(`${API_URL}/erp/income/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${process.env.BACKEND_API_KEY}`
    }
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Failed to delete income entry");
  }

  revalidatePath("/dashboard/finance");
  revalidatePath("/dashboard");
}

export async function deleteExpenseEntry(id: string) {
  const context = await getActiveBusiness();
  if (!context) redirect("/onboarding");
  if (context.membership.role !== "OWNER") {
    throw new Error("Unauthorized: Only owners can delete expense entries.");
  }

  const res = await fetch(`${API_URL}/erp/expenses/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${process.env.BACKEND_API_KEY}`
    }
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Failed to delete expense entry");
  }

  revalidatePath("/dashboard/finance");
  revalidatePath("/dashboard");
}
