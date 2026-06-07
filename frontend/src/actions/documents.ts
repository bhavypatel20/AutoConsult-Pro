"use server";

import { revalidatePath } from "next/cache";
import { getActiveBusiness } from "./business";
import { redirect } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export async function uploadCarDocument(formData: FormData) {
  const context = await getActiveBusiness();
  if (!context) redirect("/onboarding");
  if (context.membership.role === "PARTNER_VIEW") {
    throw new Error("Unauthorized: View-only partners cannot upload documents.");
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
    throw new Error("Failed to upload document");
  }

  revalidatePath("/dashboard/documents");
}
