"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Phone, MessageSquare } from "lucide-react";
import CustomerActions from "./CustomerActions";
import { getWhatsAppUrl, getTelUrl } from "@/lib/crmUtils";

interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string | null;
  type: string;
  stage: string;
  notes: string | null;
  nextFollowUp: string | null;
}

interface CustomersClientProps {
  customers: Customer[];
  role: string;
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

export default function CustomersClient({ customers, role }: CustomersClientProps) {
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("All");

  const filteredCustomers = customers.filter(cust => {
    const matchesSearch = 
      cust.name.toLowerCase().includes(search.toLowerCase()) ||
      cust.phone.includes(search) ||
      (cust.notes && cust.notes.toLowerCase().includes(search.toLowerCase()));
      
    const matchesStage = stageFilter === "All" || cust.stage === stageFilter;
    
    return matchesSearch && matchesStage;
  });

  return (
    <div>
      {/* Search & Filter Bar */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '28px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
          <input 
            type="text" 
            placeholder="Search by name, phone number, notes..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ ...inputStyle, width: '100%', paddingLeft: '44px' }}
          />
          <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        </div>
        <div style={{ width: '180px', position: 'relative' }}>
          <select 
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            style={{ ...selectStyle, width: '100%' }}
          >
            <option value="All">All Stages</option>
            <option value="Inquiry">Inquiry</option>
            <option value="Negotiation">Negotiation</option>
            <option value="Deal Closed">Deal Closed</option>
            <option value="Lost">Lost</option>
          </select>
        </div>
      </div>

      {filteredCustomers.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '64px', color: 'var(--text-muted)' }}>
          <p>{customers.length === 0 ? "Your pipeline is empty. Add your first customer inquiry." : "No customers match your search or filter criteria."}</p>
        </div>
      ) : (
        <div className="glass-card table-responsive-wrapper" style={{ padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-light)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                <th style={{ padding: '16px 24px', fontWeight: 600 }}>Name & Contact</th>
                <th style={{ padding: '16px 24px', fontWeight: 600 }}>Type</th>
                <th style={{ padding: '16px 24px', fontWeight: 600 }}>Deal Stage</th>
                <th style={{ padding: '16px 24px', fontWeight: 600 }}>Follow-Up & Notes</th>
                <th style={{ padding: '16px 24px', fontWeight: 600 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((cust) => (
                <tr key={cust.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <td style={{ padding: '16px 24px' }}>
                    <Link href={`/dashboard/customers/${cust.id}`} style={{ color: 'var(--primary)', textDecoration: 'none' }}>
                      <strong>{cust.name}</strong>
                    </Link>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4, display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span>{cust.phone}</span>
                      <a href={getTelUrl(cust.phone)} style={{ color: 'var(--secondary)', display: 'inline-flex', alignItems: 'center' }} title="Call Customer">
                        <Phone size={13} />
                      </a>
                      <a href={getWhatsAppUrl(cust.phone)} target="_blank" rel="noopener noreferrer" style={{ color: '#25d366', display: 'inline-flex', alignItems: 'center' }} title="WhatsApp Chat">
                        <MessageSquare size={13} />
                      </a>
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    {cust.type}
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <span style={{ 
                       padding: '4px 10px', 
                       borderRadius: 99, 
                       fontSize: '0.8rem', 
                       background: 'rgba(6, 182, 212, 0.15)',
                       color: 'var(--primary)'
                    }}>
                      {cust.stage}
                    </span>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{cust.nextFollowUp ? new Date(cust.nextFollowUp).toLocaleDateString("en-IN") : 'None setup'}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{cust.notes || '-'}</div>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <CustomerActions id={cust.id} role={role} />
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
