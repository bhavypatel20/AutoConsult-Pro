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

export async function addExpense(formData: FormData) {
  await delay(1500);
  const context = await getActiveBusiness();
  if (!context) redirect("/onboarding");
  if (context.membership.role === "PARTNER_VIEW") {
    throw new Error("Unauthorized: View-only partners cannot add expenses.");
  }

  const payload = formDataToJson(formData);
  payload.businessId = context.business.id;

  const res = await fetch(`${API_URL}/finance/expense`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.BACKEND_API_KEY}`
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to add expense");
  }

  revalidatePath("/dashboard/deals");
  redirect("/dashboard/deals");
}

export async function addDeal(formData: FormData) {
  await delay(1500);
  try {
    const context = await getActiveBusiness();
    if (!context) redirect("/onboarding");
    if (context.membership.role === "PARTNER_VIEW") {
      return { success: false, error: "Unauthorized: View-only partners cannot add deals." };
    }

    const payload = formDataToJson(formData);
    payload.businessId = context.business.id;

    const res = await fetch(`${API_URL}/finance/deal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.BACKEND_API_KEY}`
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return { success: false, error: errorData.error || "Failed to add deal" };
    }

    revalidatePath("/dashboard/deals");
    return { success: true };
  } catch (error: any) {
    if (error.digest?.startsWith("NEXT_REDIRECT")) {
      throw error;
    }
    console.error("addDeal failed:", error);
    return { success: false, error: error.message || "An unexpected error occurred." };
  }
}

export async function getFinancialSummary() {
  try {
    const context = await getActiveBusiness();
    if (!context) redirect("/onboarding");
    const businessId = context.business.id;

    const res = await fetch(`${API_URL}/finance/summary?businessId=${businessId}`, {
      cache: 'no-store',
      headers: {
        'Authorization': `Bearer ${process.env.BACKEND_API_KEY}`
      }
    });
    if (!res.ok) return { deals: [], expenses: [] };
    return await res.json();
  } catch (error) {
    console.error("getFinancialSummary fetch failed:", error);
    return { deals: [], expenses: [] };
  }
}

export async function editExpense(formData: FormData) {
  await delay(1000);
  const context = await getActiveBusiness();
  if (!context) redirect("/onboarding");
  if (context.membership.role === "PARTNER_VIEW") {
    throw new Error("Unauthorized: View-only partners cannot edit expenses.");
  }

  const id = formData.get("id") as string;
  const payload = formDataToJson(formData);
  payload.businessId = context.business.id;

  const res = await fetch(`${API_URL}/finance/expense/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.BACKEND_API_KEY}`
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to edit expense");
  }

  revalidatePath("/dashboard/deals");
}

export async function deleteExpense(expenseId: string) {
  await delay(1000);
  const context = await getActiveBusiness();
  if (!context) redirect("/onboarding");
  if (context.membership.role === "PARTNER_VIEW") {
    throw new Error("Unauthorized: View-only partners cannot delete expenses.");
  }

  const res = await fetch(`${API_URL}/finance/expense/${expenseId}?businessId=${context.business.id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${process.env.BACKEND_API_KEY}`
    }
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to delete expense");
  }

  revalidatePath("/dashboard/deals");
}

export async function editDeal(formData: FormData) {
  await delay(1000);
  const context = await getActiveBusiness();
  if (!context) redirect("/onboarding");
  if (context.membership.role === "PARTNER_VIEW") {
    throw new Error("Unauthorized: View-only partners cannot edit deals.");
  }

  const id = formData.get("id") as string;
  const payload = formDataToJson(formData);
  payload.businessId = context.business.id;

  const res = await fetch(`${API_URL}/finance/deal/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.BACKEND_API_KEY}`
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to edit deal");
  }

  revalidatePath("/dashboard/deals");
}

export async function deleteDeal(dealId: string) {
  await delay(1000);
  const context = await getActiveBusiness();
  if (!context) redirect("/onboarding");
  if (context.membership.role === "PARTNER_VIEW") {
    throw new Error("Unauthorized: View-only partners cannot delete deals.");
  }

  const res = await fetch(`${API_URL}/finance/deal/${dealId}?businessId=${context.business.id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${process.env.BACKEND_API_KEY}`
    }
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to delete deal");
  }

  revalidatePath("/dashboard/deals");
  revalidatePath("/dashboard/inventory");
}

