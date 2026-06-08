import Link from "next/link";
import { getCars } from "@/actions/car";
import { getActiveBusiness } from "@/actions/business";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import InventoryClient from "./InventoryClient";

export default async function InventoryPage() {
  const context = await getActiveBusiness();
  if (!context) redirect("/onboarding");
  const isReadOnly = context.membership.role === "PARTNER_VIEW";

  const cars = await getCars();

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h2>Car Inventory</h2>
          <p style={{ color: 'var(--text-muted)' }}>Manage available, booked, and sold cars.</p>
        </div>
        {!isReadOnly && (
          <Link href="/dashboard/inventory/add" className="btn-primary">
            <Plus size={18} style={{ marginRight: 8 }} /> Add Car
          </Link>
        )}
      </div>

      <InventoryClient cars={cars} />
    </div>
  );
}
