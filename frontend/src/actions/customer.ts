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

export async function deleteCustomer(formData: FormData) {
  const context = await getActiveBusiness();
  if (!context) redirect("/onboarding");
  if (context.membership.role === "PARTNER_VIEW") {
    throw new Error("Unauthorized: View-only partners cannot delete customers.");
  }

  const id = formData.get("id") as string;
  const res = await fetch(`${API_URL}/customers/${id}?businessId=${context.business.id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${process.env.BACKEND_API_KEY}`
    }
  });
  
  if (!res.ok) {
    // Ignore error
  }
  revalidatePath("/dashboard/customers");
  redirect("/dashboard/customers");
}

export async function updateCustomer(formData: FormData) {
  await delay(1500);
  const context = await getActiveBusiness();
  if (!context) redirect("/onboarding");
  if (context.membership.role === "PARTNER_VIEW") {
    throw new Error("Unauthorized: View-only partners cannot update customers.");
  }

  const id = formData.get("id") as string;
  const payload = formDataToJson(formData);
  payload.businessId = context.business.id;
  
  const res = await fetch(`${API_URL}/customers/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.BACKEND_API_KEY}`
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) throw new Error("Failed to update customer");

  revalidatePath("/dashboard/customers");
  redirect("/dashboard/customers");
}

export async function saveAdvancedInquiry(data: any) {
  await delay(1500);
  const context = await getActiveBusiness();
  if (!context) redirect("/onboarding");
  if (context.membership.role === "PARTNER_VIEW") {
    throw new Error("Unauthorized: View-only partners cannot save inquiries.");
  }

  const payload = { ...data, businessId: context.business.id };

  const res = await fetch(`${API_URL}/customers/advanced-inquiry`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.BACKEND_API_KEY}`
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) throw new Error("Failed to save advanced inquiry");

  const customer = await res.json();
  revalidatePath("/dashboard/customers");
  redirect(`/dashboard/customers/${customer.id}`);
}

export async function addCustomer(formData: FormData) {
  await delay(1500);
  const context = await getActiveBusiness();
  if (!context) redirect("/onboarding");
  if (context.membership.role === "PARTNER_VIEW") {
    throw new Error("Unauthorized: View-only partners cannot add customers.");
  }

  const payload = formDataToJson(formData);
  payload.businessId = context.business.id;

  const res = await fetch(`${API_URL}/customers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.BACKEND_API_KEY}`
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) throw new Error("Failed to add customer");

  revalidatePath("/dashboard/customers");
  return { success: true };
}

export async function getCustomers() {
  try {
    const context = await getActiveBusiness();
    if (!context) redirect("/onboarding");
    const businessId = context.business.id;

    const res = await fetch(`${API_URL}/customers?businessId=${businessId}`, {
      cache: 'no-store',
      headers: {
        'Authorization': `Bearer ${process.env.BACKEND_API_KEY}`
      }
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error("getCustomers fetch failed:", error);
    return [];
  }
}
