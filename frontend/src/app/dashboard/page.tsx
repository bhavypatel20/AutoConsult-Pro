import Link from "next/link";
import { getActiveBusiness } from "@/actions/business";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { CarFront, Users, Receipt, Plus, Phone, MessageSquare } from "lucide-react";
import { getWhatsAppUrl, getTelUrl } from "@/lib/crmUtils";

export default async function DashboardMainPage() {
  const context = await getActiveBusiness();
  if (!context) {
    redirect("/onboarding");
  }
  const businessId = context.business.id;

  // Aggregate High Level Data
  const availableCars = await prisma.car.count({ where: { status: "Available", businessId } });
  const activeLeads = await prisma.customer.count({ where: { stage: { in: ["Inquiry", "Negotiation"] }, businessId } });
  
  const deals = await prisma.deal.findMany({ 
    where: { businessId },
    include: { car: { include: { expenses: true } } } 
  });
  
  let totalRevenue = 0;
  let totalInvestment = 0;
  
  deals.forEach(deal => {
    totalRevenue += deal.finalPrice;
    totalInvestment += deal.car.purchasePrice;
    deal.car.expenses.forEach(exp => {
      totalInvestment += exp.amount;
    });
  });

  const totalProfit = totalRevenue - totalInvestment;

  // ERP Financial aggregates
  const bankAccounts = await prisma.bankAccount.findMany({ where: { businessId } });
  const totalCashBank = bankAccounts.reduce((sum, acc) => sum + acc.balance, 0);

  const customerLedgers = await prisma.customerLedger.findMany({ where: { businessId } });
  const outstandingReceivables = customerLedgers.reduce((sum, l) => sum + l.remainingAmount, 0);

  const sellerLedgers = await prisma.sellerLedger.findMany({ where: { businessId } });
  const outstandingPayables = sellerLedgers.reduce((sum, l) => sum + l.pendingAmount, 0);

  const availableVehicles = await prisma.car.findMany({ where: { businessId, status: "Available" } });
  const inventoryStockValue = availableVehicles.reduce((sum, car) => sum + car.purchasePrice, 0);

  // Fetch High Priority Follow-ups
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  const pendingFollowups = await prisma.customer.findMany({
    where: {
      businessId,
      nextFollowUp: {
        lte: endOfToday,
        not: null
      },
      stage: {
        notIn: ["Deal Closed", "Cancelled"]
      }
    },
    orderBy: {
      nextFollowUp: "asc"
    },
    take: 5
  });

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h2>AutoConsult Command Center</h2>
        <p style={{ color: 'var(--text-muted)' }}>Welcome back. Here is your dealership snapshot.</p>
      </div>

      {/* Operations Snapshot Cards */}
      <h3 style={{ marginBottom: '16px', fontSize: '1.1rem' }}>Operational Snapshot</h3>
      <div className="responsive-grid-3" style={{ marginBottom: '32px' }}>
        <Link href="/dashboard/inventory" style={{ textDecoration: 'none' }}>
           <div className="glass-card flex" style={{ padding: '24px', transition: 'all 0.2s', cursor: 'pointer' }}>
             <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '16px', borderRadius: '12px', marginRight: '16px' }}>
                <CarFront size={28} />
             </div>
             <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '4px' }}>Available Cars</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-main)' }}>{availableCars}</div>
             </div>
           </div>
        </Link>

        <Link href="/dashboard/customers" style={{ textDecoration: 'none' }}>
           <div className="glass-card flex" style={{ padding: '24px', transition: 'all 0.2s', cursor: 'pointer' }}>
             <div style={{ background: 'rgba(6, 182, 212, 0.1)', color: 'var(--primary)', padding: '16px', borderRadius: '12px', marginRight: '16px' }}>
                <Users size={28} />
             </div>
             <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '4px' }}>Active Inquiries</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-main)' }}>{activeLeads}</div>
             </div>
           </div>
        </Link>

        <Link href="/dashboard/deals" style={{ textDecoration: 'none' }}>
           <div className="glass-card flex" style={{ padding: '24px', transition: 'all 0.2s', cursor: 'pointer' }}>
             <div style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', padding: '16px', borderRadius: '12px', marginRight: '16px' }}>
                <Receipt size={28} />
             </div>
             <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '4px' }}>Total Profit (All Time)</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)' }}>₹ {totalProfit.toLocaleString()}</div>
             </div>
           </div>
        </Link>
      </div>

      {/* Financial Snapshot Cards */}
      <h3 style={{ marginBottom: '16px', fontSize: '1.1rem' }}>ERP Financial & Liquidity Snapshot</h3>
      <div className="responsive-grid-4" style={{ marginBottom: '48px' }}>
        <Link href="/dashboard/finance" style={{ textDecoration: 'none' }}>
          <div className="glass-card" style={{ padding: '20px', transition: 'all 0.2s', cursor: 'pointer' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '6px' }}>Liquid Cash & Bank</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--primary)' }}>₹ {totalCashBank.toLocaleString()}</div>
          </div>
        </Link>
        <Link href="/dashboard/finance" style={{ textDecoration: 'none' }}>
          <div className="glass-card" style={{ padding: '20px', transition: 'all 0.2s', cursor: 'pointer' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '6px' }}>Customer Receivables</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--secondary)' }}>₹ {outstandingReceivables.toLocaleString()}</div>
          </div>
        </Link>
        <Link href="/dashboard/finance" style={{ textDecoration: 'none' }}>
          <div className="glass-card" style={{ padding: '20px', transition: 'all 0.2s', cursor: 'pointer' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '6px' }}>Supplier Liabilities</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#ef4444' }}>₹ {outstandingPayables.toLocaleString()}</div>
          </div>
        </Link>
        <Link href="/dashboard/reports" style={{ textDecoration: 'none' }}>
          <div className="glass-card" style={{ padding: '20px', transition: 'all 0.2s', cursor: 'pointer' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '6px' }}>Inventory Asset Valuation</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#c084fc' }}>₹ {inventoryStockValue.toLocaleString()}</div>
          </div>
        </Link>
      </div>

      <h3 style={{ marginBottom: '24px' }}>Quick Actions</h3>
      <div className="responsive-grid-3" style={{ gap: '16px', marginBottom: '48px' }}>
        <Link href="/dashboard/inventory/add" className="btn-primary" style={{ textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '16px' }}>
           <Plus size={18}/> New Vehicle
        </Link>
        <Link href="/dashboard/customers/add" className="btn-primary" style={{ background: 'rgba(255,255,255,0.05)', boxShadow: 'none', color: 'var(--text-main)', textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '16px' }}>
           <Plus size={18}/> New Customer
        </Link>
        <Link href="/dashboard/deals/create" className="btn-primary" style={{ background: 'rgba(255,255,255,0.05)', boxShadow: 'none', color: 'var(--text-main)', textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '16px' }}>
           <Receipt size={18}/> Close Deal
        </Link>
      </div>

      {/* Follow-up Center Widget */}
      <div>
        <h3 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Users size={22} style={{ color: 'var(--primary)' }} /> High-Priority Follow-ups
        </h3>
        
        {pendingFollowups.length === 0 ? (
          <div className="glass-card" style={{ padding: '24px', color: 'var(--text-muted)', textAlign: 'center' }}>
            🎉 No pending follow-ups for today! Good job keeping up with your pipeline.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {pendingFollowups.map((cust) => {
              const isOverdue = cust.nextFollowUp ? new Date(cust.nextFollowUp) < new Date(new Date().setHours(0,0,0,0)) : false;
              return (
                <div key={cust.id} className="glass-card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: isOverdue ? '4px solid #f43f5e' : '4px solid #10b981', flexWrap: 'wrap', gap: '16px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Link href={`/dashboard/customers/${cust.id}`} style={{ textDecoration: 'none', color: 'var(--text-main)', fontWeight: 700 }}>
                        {cust.name}
                      </Link>
                      <span style={{ 
                        fontSize: '0.75rem', 
                        padding: '2px 8px', 
                        borderRadius: '4px',
                        background: isOverdue ? 'rgba(244, 63, 94, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                        color: isOverdue ? '#f43f5e' : '#10b981',
                        fontWeight: 600
                      }}>
                        {isOverdue ? 'Overdue' : 'Due Today'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Scheduled: {cust.nextFollowUp ? new Date(cust.nextFollowUp).toLocaleDateString() : 'N/A'} • {cust.notes || 'No notes logged'}
                    </div>
                  </div>
                  
                  {/* Action Links */}
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <a href={getTelUrl(cust.phone)} className="btn-primary" style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-main)', boxShadow: 'none', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Phone size={14}/> Call
                    </a>
                    <a href={getWhatsAppUrl(cust.phone)} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ padding: '8px 16px', background: 'rgba(37, 211, 102, 0.1)', color: '#25d366', boxShadow: 'none', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <MessageSquare size={14}/> WhatsApp
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}

