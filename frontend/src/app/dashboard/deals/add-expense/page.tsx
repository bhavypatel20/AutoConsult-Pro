import { getActiveBusiness } from "@/actions/business";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import AddExpenseForm from "./AddExpenseForm";

export default async function AddExpensePage() {
  const context = await getActiveBusiness();
  if (!context) redirect("/onboarding");
  const { business, membership } = context;

  if (membership.role === "PARTNER_VIEW") {
    redirect("/dashboard/deals");
  }

  const cars = await prisma.car.findMany({
    where: { businessId: business.id },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      brand: true,
      model: true,
      registrationNum: true,
      status: true
    }
  });

  // Fetch active ERP partners
  const partners = await prisma.partner.findMany({
    where: { businessId: business.id, isActive: true },
    select: { id: true, name: true }
  });

  return (
    <div>
      <h2 style={{ marginBottom: '32px' }}>Log Vehicle Expense</h2>
      <AddExpenseForm cars={cars} partners={partners} />
    </div>
  );
}
