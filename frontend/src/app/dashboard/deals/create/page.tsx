import { getActiveBusiness } from "@/actions/business";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import CloseDealForm from "./CloseDealForm";

export default async function CreateDealPage() {
  const context = await getActiveBusiness();
  if (!context) redirect("/onboarding");
  const businessId = context.business.id;

  if (context.membership.role === "PARTNER_VIEW") {
    redirect("/dashboard/deals");
  }

  const cars = await prisma.car.findMany({ 
    where: { status: { not: "Sold" }, businessId } 
  });
  
  const customers = await prisma.customer.findMany({ 
    where: { stage: { not: "Deal Closed" }, businessId } 
  });

  const bankAccounts = await prisma.bankAccount.findMany({
    where: { businessId }
  });

  return (
    <div>
      <h2 style={{ marginBottom: '32px' }}>Close a Deal</h2>
      <CloseDealForm cars={cars} customers={customers} bankAccounts={bankAccounts} />
    </div>
  );
}
