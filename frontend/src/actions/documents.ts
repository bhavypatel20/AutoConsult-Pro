"use server";

import { revalidatePath } from "next/cache";
import { getActiveBusiness } from "./business";
import { redirect } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export async function uploadCarDocument(formData: FormData) {
  try {
    const context = await getActiveBusiness();
    if (!context) redirect("/onboarding");
    if (context.membership.role === "PARTNER_VIEW") {
      return { success: false, error: "Unauthorized: View-only partners cannot upload documents." };
    }

    formData.append("businessId", context.business.id);

    const file = formData.get("file") as File | null;
    if (file && file.size > 0) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const base64File = buffer.toString("base64");
      const dataUrl = `data:${file.type};base64,${base64File}`;
      formData.set("file", dataUrl);
    } else {
      formData.delete("file");
    }

    const res = await fetch(`${API_URL}/documents`, {
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

    revalidatePath("/dashboard/documents");
    return { success: true };
  } catch (error: any) {
    if (error.digest?.startsWith("NEXT_REDIRECT")) {
      throw error;
    }
    console.error("uploadCarDocument failed:", error);
    return { success: false, error: error.message || "An unexpected error occurred." };
  }
}
