import Link from "next/link";
import { getCars } from "@/actions/car";
import { getActiveBusiness } from "@/actions/business";
import { redirect } from "next/navigation";
import { Plus, Search } from "lucide-react";

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

      {cars.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '64px', color: 'var(--text-muted)' }}>
          <p>No cars in inventory yet. Add your first vehicle.</p>
        </div>
      ) : (
        <div className="glass-card table-responsive-wrapper" style={{ padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-light)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                <th style={{ padding: '16px 24px', fontWeight: 600 }}>Vehicle Info</th>
                <th style={{ padding: '16px 24px', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '16px 24px', fontWeight: 600 }}>Price</th>
                <th style={{ padding: '16px 24px', fontWeight: 600 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {cars.map((car) => (
                <tr key={car.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <td style={{ padding: '16px 24px' }}>
                    <strong>{car.year} {car.brand} {car.model}</strong>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>
                      {car.fuelType} • {car.kmDriven.toLocaleString()} km • {car.registrationNum}
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <span style={{ 
                      padding: '4px 10px', 
                      borderRadius: 99, 
                      fontSize: '0.8rem', 
                      background: car.status === 'Available' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                      color: car.status === 'Available' ? '#10b981' : '#f59e0b'
                    }}>
                      {car.status}
                    </span>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ fontSize: '0.9rem' }}>₹{car.expectedSellPrice.toLocaleString()}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cost: ₹{car.purchasePrice.toLocaleString()}</div>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <Link href={`/dashboard/inventory/${car.id}`} style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}>
                      View Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
