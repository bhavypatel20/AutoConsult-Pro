"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getActiveBusiness } from "./business";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const delay = (ms: number) => Promise.resolve();

export async function uploadCarImage(formData: FormData) {
  await delay(1500);
  const context = await getActiveBusiness();
  if (!context) redirect("/onboarding");
  if (context.membership.role === "PARTNER_VIEW") {
    throw new Error("Unauthorized: View-only partners cannot upload images.");
  }

  const carId = formData.get("carId") as string;
  formData.append("businessId", context.business.id);

  const res = await fetch(`${API_URL}/cars/${carId}/image`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.BACKEND_API_KEY}`
    },
    body: formData,
  });

  if (!res.ok) {
    throw new Error("Failed to upload image");
  }

  revalidatePath(`/dashboard/inventory/${carId}`);
}

export async function updateCar(formData: FormData) {
  await delay(1500);
  const context = await getActiveBusiness();
  if (!context) redirect("/onboarding");
  if (context.membership.role === "PARTNER_VIEW") {
    throw new Error("Unauthorized: View-only partners cannot edit vehicle information.");
  }

  const carId = formData.get("id") as string;
  formData.set("businessId", context.business.id);

  const res = await fetch(`${API_URL}/cars/${carId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${process.env.BACKEND_API_KEY}`
    },
    body: formData,
  });

  if (!res.ok) {
    throw new Error("Failed to update car");
  }

  revalidatePath("/dashboard/inventory");
  redirect(`/dashboard/inventory/${carId}`);
}

export async function addCar(formData: FormData) {
  await delay(1500);
  const context = await getActiveBusiness();
  if (!context) redirect("/onboarding");
  if (context.membership.role === "PARTNER_VIEW") {
    throw new Error("Unauthorized: View-only partners cannot add vehicles.");
  }
  
  formData.append('clerkUserId', context.membership.clerkUserId || "default_user");
  formData.append('businessId', context.business.id);

  const res = await fetch(`${API_URL}/cars`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.BACKEND_API_KEY}`
    },
    body: formData,
  });

  if (!res.ok) {
    throw new Error("Failed to add car");
  }

  revalidatePath("/dashboard/inventory");
  return { success: true };
}

export async function getCars() {
  try {
    const context = await getActiveBusiness();
    if (!context) redirect("/onboarding");
    const businessId = context.business.id;

    const res = await fetch(`${API_URL}/cars?businessId=${businessId}`, {
      cache: 'no-store',
      headers: {
        'Authorization': `Bearer ${process.env.BACKEND_API_KEY}`
      }
    });
    
    if (!res.ok) {
      return [];
    }
    
    return await res.json();
  } catch (error) {
    console.error("getCars fetch failed:", error);
    return [];
  }
}
