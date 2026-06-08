"use client";

import { useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";

interface Car {
  id: string;
  brand: string;
  model: string;
  year: number;
  fuelType: string;
  kmDriven: number;
  registrationNum: string;
  status: string;
  purchasePrice: number;
  expectedSellPrice: number;
  variant?: string | null;
}

interface InventoryClientProps {
  cars: Car[];
}

const inputStyle = {
  padding: '12px 16px',
  borderRadius: '12px',
  background: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid var(--border-light)',
  color: 'var(--text-main)',
  outline: 'none',
  fontSize: '0.95rem'
};

const selectStyle = {
  ...inputStyle,
  WebkitAppearance: 'none' as any,
  MozAppearance: 'none' as any,
  appearance: 'none' as any,
  backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23a1a1aa' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 16px center',
  backgroundSize: '16px',
  paddingRight: '40px',
  cursor: 'pointer'
};

export default function InventoryClient({ cars }: InventoryClientProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const filteredCars = cars.filter(car => {
    const matchesSearch = 
      car.brand.toLowerCase().includes(search.toLowerCase()) ||
      car.model.toLowerCase().includes(search.toLowerCase()) ||
      car.registrationNum.toLowerCase().includes(search.toLowerCase()) ||
      (car.variant && car.variant.toLowerCase().includes(search.toLowerCase())) ||
      car.year.toString().includes(search);
      
    const matchesStatus = statusFilter === "All" || car.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      {/* Search & Filter Bar */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '28px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
          <input 
            type="text" 
            placeholder="Search by brand, model, registration, variant or year..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ ...inputStyle, width: '100%', paddingLeft: '44px' }}
          />
          <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        </div>
        <div style={{ width: '180px', position: 'relative' }}>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ ...selectStyle, width: '100%' }}
          >
            <option value="All">All Statuses</option>
            <option value="Available">Available</option>
            <option value="Sold">Sold</option>
            <option value="Booked">Booked</option>
          </select>
        </div>
      </div>

      {filteredCars.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '64px', color: 'var(--text-muted)' }}>
          <p>{cars.length === 0 ? "No cars in inventory yet. Add your first vehicle." : "No vehicles match your search or filter criteria."}</p>
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
              {filteredCars.map((car) => (
                <tr key={car.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <td style={{ padding: '16px 24px' }}>
                    <strong>{car.year} {car.brand} {car.model}</strong> {car.variant && <span style={{ fontSize: '0.85rem', color: 'var(--primary)', marginLeft: '6px' }}>({car.variant})</span>}
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
                    <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>₹{car.expectedSellPrice.toLocaleString()}</div>
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
