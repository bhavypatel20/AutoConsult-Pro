import prisma from "@/lib/prisma";
import DocumentClient from "./DocumentClient";
import { getActiveBusiness } from "@/actions/business";
import { redirect } from "next/navigation";

export default async function DocumentsHub() {
  const context = await getActiveBusiness();
  if (!context) redirect("/onboarding");
  const businessId = context.business.id;

  const cars = await prisma.car.findMany({
    where: { businessId },
    orderBy: { createdAt: "desc" }
  });

  return (
    <DocumentClient cars={cars} role={context.membership.role} />
  );
}
