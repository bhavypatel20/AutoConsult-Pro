import { getActiveBusiness } from "@/actions/business";
import prisma from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import EditCustomerForm from "./EditCustomerForm";

export default async function EditCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const context = await getActiveBusiness();
  if (!context) redirect("/onboarding");
  const businessId = context.business.id;

  // Enforce role permission check
  if (context.membership.role === "PARTNER_VIEW") {
    redirect(`/dashboard/customers/${id}`);
  }

  // @ts-ignore
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: { preference: true }
  });

  if (!customer || customer.businessId !== businessId) return notFound();

  return (
    <div style={{ paddingBottom: '64px' }}>
      <h2 style={{ marginBottom: '32px' }}>Edit Customer Profile</h2>
      <EditCustomerForm customer={customer} />
    </div>
  );
}
