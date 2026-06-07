"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getActiveBusiness } from "./business";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const delay = (ms: number) => Promise.resolve();

export async function uploadCarImage(formData: FormData) {
  await delay(1500);
  try {
    const context = await getActiveBusiness();
    if (!context) redirect("/onboarding");
    if (context.membership.role === "PARTNER_VIEW") {
      return { success: false, error: "Unauthorized: View-only partners cannot upload images." };
    }

    const carId = formData.get("carId") as string;
    formData.append("businessId", context.business.id);

    const file = formData.get("file") as File | null;
    if (file && file.size > 0) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const base64Image = buffer.toString("base64");
      const dataUrl = `data:${file.type};base64,${base64Image}`;
      formData.set("file", dataUrl);
    } else {
      formData.delete("file");
    }

    const res = await fetch(`${API_URL}/cars/${carId}/image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.BACKEND_API_KEY}`
      },
      body: formData,
    });

    if (!res.ok) {
      const text = await res.text();
      return { success: false, error: `Backend error (${res.status}): ${text}` };
    }

    revalidatePath(`/dashboard/inventory/${carId}`);
    return { success: true };
  } catch (error: any) {
    if (error.digest?.startsWith("NEXT_REDIRECT")) {
      throw error;
    }
    console.error("uploadCarImage failed:", error);
    return { success: false, error: error.message || "An unexpected error occurred." };
  }
}

export async function updateCar(formData: FormData) {
  await delay(1500);
  try {
    const context = await getActiveBusiness();
    if (!context) redirect("/onboarding");
    if (context.membership.role === "PARTNER_VIEW") {
      return { success: false, error: "Unauthorized: View-only partners cannot edit vehicle information." };
    }

    const carId = formData.get("id") as string;
    formData.set("businessId", context.business.id);

    const image = formData.get("image") as File | null;
    if (image && image.size > 0) {
      const bytes = await image.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const base64Image = buffer.toString("base64");
      const dataUrl = `data:${image.type};base64,${base64Image}`;
      formData.set("image", dataUrl);
    } else {
      formData.delete("image");
    }

    const res = await fetch(`${API_URL}/cars/${carId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${process.env.BACKEND_API_KEY}`
      },
      body: formData,
    });

    if (!res.ok) {
      const text = await res.text();
      return { success: false, error: `Backend error (${res.status}): ${text}` };
    }

    revalidatePath("/dashboard/inventory");
    return { success: true, carId };
  } catch (error: any) {
    if (error.digest?.startsWith("NEXT_REDIRECT")) {
      throw error;
    }
    console.error("updateCar failed:", error);
    return { success: false, error: error.message || "An unexpected error occurred." };
  }
}

export async function addCar(formData: FormData) {
  await delay(1500);
  try {
    const context = await getActiveBusiness();
    if (!context) redirect("/onboarding");
    if (context.membership.role === "PARTNER_VIEW") {
      return { success: false, error: "Unauthorized: View-only partners cannot add vehicles." };
    }
    
    formData.append('clerkUserId', context.membership.clerkUserId || "default_user");
    formData.append('businessId', context.business.id);

    const image = formData.get("image") as File | null;
    if (image && image.size > 0) {
      const bytes = await image.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const base64Image = buffer.toString("base64");
      const dataUrl = `data:${image.type};base64,${base64Image}`;
      formData.set("image", dataUrl);
    } else {
      formData.delete("image");
    }

    const res = await fetch(`${API_URL}/cars`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.BACKEND_API_KEY}`
      },
      body: formData,
    });

    if (!res.ok) {
      const text = await res.text();
      return { success: false, error: `Backend error (${res.status}): ${text}` };
    }

    revalidatePath("/dashboard/inventory");
    return { success: true };
  } catch (error: any) {
    if (error.digest?.startsWith("NEXT_REDIRECT")) {
      throw error;
    }
    console.error("addCar failed:", error);
    return { success: false, error: error.message || "An unexpected error occurred." };
  }
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
