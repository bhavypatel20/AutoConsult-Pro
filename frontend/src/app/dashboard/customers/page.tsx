import Link from "next/link";
import { getCustomers } from "@/actions/customer";
import { getActiveBusiness } from "@/actions/business";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import CustomersClient from "./CustomersClient";

export default async function CustomersPage() {
  const context = await getActiveBusiness();
  if (!context) redirect("/onboarding");
  const isReadOnly = context.membership.role === "PARTNER_VIEW";

  const customers = await getCustomers();

  const serializedCustomers = customers.map((c: any) => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    address: c.address,
    type: c.type,
    stage: c.stage,
    notes: c.notes,
    nextFollowUp: c.nextFollowUp ? new Date(c.nextFollowUp).toISOString() : null,
  }));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h2>Customer Pipeline</h2>
        {!isReadOnly && (
          <Link href="/dashboard/customers/add-inquiry" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={20} /> Add Inquiry
          </Link>
        )}
      </div>

      <CustomersClient customers={serializedCustomers} role={context.membership.role} />
    </div>
  );
}

