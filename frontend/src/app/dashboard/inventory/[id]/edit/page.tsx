import { getActiveBusiness } from "@/actions/business";
import prisma from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import EditCarForm from "./EditCarForm";

export default async function EditCarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const context = await getActiveBusiness();
  if (!context) redirect("/onboarding");
  const businessId = context.business.id;

  // Enforce role permission check
  if (context.membership.role === "PARTNER_VIEW") {
    redirect(`/dashboard/inventory/${id}`);
  }

  const car = await prisma.car.findUnique({
    where: { id }
  });

  if (!car || car.businessId !== businessId) return notFound();

  // Serialize dates to prevent Next.js Client Component warnings
  const serializedCar = {
    id: car.id,
    brand: car.brand,
    model: car.model,
    year: car.year,
    fuelType: car.fuelType,
    kmDriven: car.kmDriven,
    registrationNum: car.registrationNum,
    status: car.status,
    sellerName: car.sellerName,
    sellerAddress: car.sellerAddress,
    purchasePrice: car.purchasePrice,
    expectedSellPrice: car.expectedSellPrice,
    createdAt: car.createdAt.toISOString(),
    ownerType: car.ownerType,
    variant: car.variant,
  };

  return (
    <div>
      <h2 style={{ marginBottom: '32px' }}>Edit Vehicle Details</h2>
      <EditCarForm car={serializedCar} />
    </div>
  );
}

