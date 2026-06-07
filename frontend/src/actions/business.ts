"use server";

import prisma from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { promises as fs } from "fs";
import path from "path";
import { cache } from "react";

const delay = (ms: number) => Promise.resolve();

/**
 * Helper to sync BusinessMember profiles into the Partner table (for ERP/ledger dropdowns).
 */
async function selfHealPartners(businessId: string, members: any[]) {
  try {
    for (const member of members) {
      if (member.email) {
        const exists = await prisma.partner.findFirst({
          where: { businessId, email: member.email }
        });
        if (!exists) {
          await prisma.partner.create({
            data: {
              businessId,
              name: member.name,
              email: member.email,
              phone: '0000000000',
              ownershipPercent: member.role === 'OWNER' ? 100 : 0
            }
          });
        }
      }
    }
  } catch (error) {
    console.error("selfHealPartners failed:", error);
  }
}

/**
 * Helper to fetch the current user's business and membership role.
 */
export const getActiveBusiness = cache(async () => {
  const { userId } = await auth();
  if (!userId) return null;

  const user = await currentUser();
  const primaryEmail = (user?.emailAddresses[0]?.emailAddress || "").toLowerCase().trim();

  // 1. Check if they are the direct owner of a business
  let business = await prisma.business.findFirst({
    where: { ownerId: userId },
    include: { members: true },
  });

  if (business) {
    if (primaryEmail === "bhavypatel2945@gmail.com") {
      business.plan = "Enterprise";
    }
    const ownerMember = business.members.find(m => m.clerkUserId === userId || m.role === "OWNER");
    await selfHealPartners(business.id, business.members);
    return {
      business,
      membership: ownerMember || {
        id: "owner-id",
        businessId: business.id,
        name: "Owner",
        email: null,
        clerkUserId: userId,
        role: "OWNER",
        createdAt: business.createdAt,
        updatedAt: business.updatedAt,
      },
    };
  }

  // 2. Otherwise, check if they are a linked member of a business
  const member = await prisma.businessMember.findFirst({
    where: { clerkUserId: userId },
    include: { business: { include: { members: true } } },
  });

  if (member) {
    if (primaryEmail === "bhavypatel2945@gmail.com") {
      member.business.plan = "Enterprise";
    }
    await selfHealPartners(member.business.id, member.business.members);
    return {
      business: member.business,
      membership: member,
    };
  }

  // 3. Fallback: Check if there is an unlinked member profile matching their primary Clerk email address
  if (primaryEmail) {
    const pendingMember = await prisma.businessMember.findFirst({
      where: { email: primaryEmail, clerkUserId: null },
      include: { business: { include: { members: true } } },
    });

    if (pendingMember) {
      // Auto-link their Clerk User ID to this member profile!
      const updatedMember = await prisma.businessMember.update({
        where: { id: pendingMember.id },
        data: { clerkUserId: userId },
        include: { business: { include: { members: true } } },
      });

      if (primaryEmail === "bhavypatel2945@gmail.com") {
        updatedMember.business.plan = "Enterprise";
      }

      await selfHealPartners(updatedMember.business.id, updatedMember.business.members);

      return {
        business: updatedMember.business,
        membership: updatedMember,
      };
    }
  }

  return null;
});

/**
 * Server Action to register/create a new business and seed initial partners.
 */
export async function createBusiness(data: { name: string; logoUrl?: string; plan?: string; partners: Array<{ name: string; email: string; role: string }> }) {
  await delay(1500);
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await currentUser();
  const ownerName = user?.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : "Owner";
  const ownerEmail = (user?.emailAddresses[0]?.emailAddress || "").toLowerCase().trim();

  // Deduplicate partners by email, and filter out empty emails or owner's email
  const uniquePartnersMap = new Map<string, { name: string; email: string; role: string }>();
  for (const partner of data.partners) {
    const email = partner.email.toLowerCase().trim();
    if (!email) continue;
    if (email === ownerEmail) continue; // Owner is automatically registered
    uniquePartnersMap.set(email, {
      name: partner.name,
      email,
      role: partner.role,
    });
  }
  const filteredPartners = Array.from(uniquePartnersMap.values());

  // 1. Create the business and associate the owner as member
  const business = await prisma.business.create({
    data: {
      name: data.name,
      logo: data.logoUrl || null,
      ownerId: userId,
      plan: ownerEmail === "bhavypatel2945@gmail.com" ? "Enterprise" : (data.plan || "Trial"),
      subscriptionStatus: "Active",
      members: {
        create: [
          {
            name: ownerName,
            email: ownerEmail || null,
            clerkUserId: userId,
            role: "OWNER",
          },
          ...filteredPartners.map((partner) => ({
            name: partner.name,
            email: partner.email,
            role: partner.role, // "PARTNER_EDIT" or "PARTNER_VIEW"
          })),
        ],
      },
    },
  });

  // Create corresponding Partner record in Partner table for erp/ledgers
  await prisma.partner.create({
    data: {
      businessId: business.id,
      name: ownerName,
      email: ownerEmail || 'owner@autoconsult.com',
      phone: '0000000000',
      ownershipPercent: 100
    }
  });

  // Also create Partner records for all invited partners immediately
  for (const partner of filteredPartners) {
    await prisma.partner.create({
      data: {
        businessId: business.id,
        name: partner.name,
        email: partner.email,
        phone: '0000000000',
        ownershipPercent: 0
      }
    });
  }

  revalidatePath("/dashboard", "layout");
  return { success: true };
}

/**
 * Updates dynamic branding metadata.
 */
export async function updateBusinessBranding(formData: FormData) {
  await delay(1500);
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const name = formData.get("name") as string;
  const logo = formData.get("logo") as string;

  const context = await getActiveBusiness();
  if (!context || context.membership.role !== "OWNER") {
    throw new Error("Only the Business Owner can update business settings");
  }

  await prisma.business.update({
    where: { id: context.business.id },
    data: {
      name,
      logo: logo || null,
    },
  });

  revalidatePath("/dashboard", "layout");
}

/**
 * Adds a new partner profile securely.
 */
export async function addBusinessPartner(formData: FormData) {
  await delay(1500);
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const name = formData.get("name") as string;
  const email = (formData.get("email") as string).toLowerCase().trim();
  const role = formData.get("role") as string; // PARTNER_EDIT or PARTNER_VIEW

  const context = await getActiveBusiness();
  if (!context || context.membership.role !== "OWNER") {
    throw new Error("Only the Business Owner can add partners");
  }

  // Prevent duplicate emails
  const existing = await prisma.businessMember.findFirst({
    where: { businessId: context.business.id, email },
  });

  if (existing) {
    throw new Error("A partner with this email is already registered.");
  }

  await prisma.businessMember.create({
    data: {
      businessId: context.business.id,
      name,
      email,
      role,
    },
  });

  // Also create corresponding Partner record immediately!
  await prisma.partner.create({
    data: {
      businessId: context.business.id,
      name,
      email,
      phone: '0000000000',
      ownershipPercent: 0
    }
  });

  revalidatePath("/dashboard/settings");
}

/**
 * Deletes a partner profile securely.
 */
export async function removeBusinessPartner(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const memberId = formData.get("memberId") as string;

  const context = await getActiveBusiness();
  if (!context || context.membership.role !== "OWNER") {
    throw new Error("Only the Business Owner can remove partners");
  }

  const target = await prisma.businessMember.findUnique({
    where: { id: memberId },
  });

  if (!target || target.businessId !== context.business.id) {
    throw new Error("Member not found in your business");
  }

  if (target.role === "OWNER") {
    throw new Error("The Owner member profile cannot be removed.");
  }

  // Delete from Partner table if email is present
  if (target.email) {
    await prisma.partner.deleteMany({
      where: { businessId: context.business.id, email: target.email }
    });
  }

  await prisma.businessMember.delete({
    where: { id: memberId },
  });

  revalidatePath("/dashboard/settings");
}

/**
 * Toggles/updates a partner's permission role.
 */
export async function updatePartnerRole(memberId: string, role: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const context = await getActiveBusiness();
  if (!context || context.membership.role !== "OWNER") {
    throw new Error("Only the Business Owner can change permissions");
  }

  const target = await prisma.businessMember.findUnique({
    where: { id: memberId },
  });

  if (!target || target.businessId !== context.business.id) {
    throw new Error("Member not found in your business");
  }

  if (target.role === "OWNER") {
    throw new Error("Cannot alter owner permissions.");
  }

  if (role === "OWNER") {
    if (!target.clerkUserId) {
      throw new Error("This partner must sign in and activate their profile first before they can become the owner.");
    }

    // Perform ownership transfer in a Prisma transaction
    await prisma.$transaction([
      // 1. Downgrade current owner member role to PARTNER_EDIT
      prisma.businessMember.update({
        where: { id: context.membership.id },
        data: { role: "PARTNER_EDIT" }
      }),
      // 2. Upgrade target member role to OWNER
      prisma.businessMember.update({
        where: { id: memberId },
        data: { role: "OWNER" }
      }),
      // 3. Update Business ownerId field to the new owner's Clerk User ID
      prisma.business.update({
        where: { id: context.business.id },
        data: { ownerId: target.clerkUserId }
      })
    ]);
  } else {
    // Normal role update (e.g. PARTNER_EDIT <-> PARTNER_VIEW)
    await prisma.businessMember.update({
      where: { id: memberId },
      data: { role },
    });
  }

  revalidatePath("/dashboard/settings");
}

/**
 * Server Action to upload a business logo from a client device.
 */
export async function uploadLogo(formData: FormData) {
  await delay(1500);
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) {
    throw new Error("No file uploaded");
  }

  // Validate file type is image
  if (!file.type.startsWith("image/")) {
    throw new Error("Only image files are allowed");
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const uploadDir = path.join(process.cwd(), "public", "logos");

  // Ensure upload directory exists
  try {
    await fs.access(uploadDir);
  } catch {
    await fs.mkdir(uploadDir, { recursive: true });
  }

  const fileExtension = file.name.split(".").pop();
  const safeName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExtension}`;
  const filePath = path.join(uploadDir, safeName);

  await fs.writeFile(filePath, buffer);

  return { url: `/logos/${safeName}` };
}

/**
 * Deletes the active business and all associated data permanently.
 * Only the Business Owner can perform this action.
 */
export async function deleteActiveBusiness() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const context = await getActiveBusiness();
  if (!context || context.membership.role !== "OWNER") {
    throw new Error("Only the Business Owner can delete the business");
  }

  const businessId = context.business.id;

  await prisma.$transaction(async (tx) => {
    // 1. Get all cars in this business to delete their expenses
    const cars = await tx.car.findMany({
      where: { businessId },
      select: { id: true },
    });
    const carIds = cars.map(c => c.id);

    // 2. Delete all Expenses linked to these cars
    await tx.expense.deleteMany({
      where: { carId: { in: carIds } },
    });

    // 3. Delete all Deals linked to this business
    await tx.deal.deleteMany({
      where: { businessId },
    });

    // 4. Delete all Cars linked to this business
    await tx.car.deleteMany({
      where: { businessId },
    });

    // 5. Get all customers in this business to delete preferences, inquiries, and interactions
    const customers = await tx.customer.findMany({
      where: { businessId },
      select: { id: true },
    });
    const customerIds = customers.map(c => c.id);

    // 6. Delete customer sub-records
    await tx.customerPreference.deleteMany({
      where: { customerId: { in: customerIds } },
    });
    await tx.customerInquiry.deleteMany({
      where: { customerId: { in: customerIds } },
    });
    await tx.customerInteraction.deleteMany({
      where: { customerId: { in: customerIds } },
    });

    // 7. Delete all Customers linked to this business
    await tx.customer.deleteMany({
      where: { businessId },
    });

    // 8. Delete all Business Members
    await tx.businessMember.deleteMany({
      where: { businessId },
    });

    // 9. Delete the Business itself
    await tx.business.delete({
      where: { id: businessId },
    });
  });

  revalidatePath("/dashboard", "layout");
  revalidatePath("/onboarding");
  
  redirect("/onboarding");
}
