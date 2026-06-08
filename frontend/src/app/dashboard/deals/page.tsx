import Link from "next/link";
import { getFinancialSummary } from "@/actions/finance";
import { getActiveBusiness } from "@/actions/business";
import { redirect } from "next/navigation";
import { Plus, IndianRupee, PieChart } from "lucide-react";
import DealsClient from "./DealsClient";
import prisma from "@/lib/prisma";

export default async function DealsPage() {
  const context = await getActiveBusiness();
  if (!context) redirect("/onboarding");

  const isReadOnly = context.membership.role === "PARTNER_VIEW";
  const { deals, expenses } = await getFinancialSummary();

  // Calculate metrics
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
  const memberCount = context.business.members?.length || 1;
  const partnerShare = totalProfit / memberCount;

  const partnerInvestments: Record<string, number> = {};
  expenses.forEach(exp => {
    if (exp.paidBy && exp.paidBy !== "Company") {
       partnerInvestments[exp.paidBy] = (partnerInvestments[exp.paidBy] || 0) + exp.amount;
    }
  });

  // Serialize properties to avoid date serialization warnings in client components
  const serializedDeals = deals.map((deal: any) => ({
    id: deal.id,
    dealDate: new Date(deal.dealDate).toISOString(),
    finalPrice: deal.finalPrice,
    paymentStatus: deal.paymentStatus,
    advanceReceived: deal.advanceReceived || 0,
    car: {
      id: deal.car.id,
      brand: deal.car.brand,
      model: deal.car.model,
      registrationNum: deal.car.registrationNum,
      purchasePrice: deal.car.purchasePrice,
      year: deal.car.year,
      fuelType: deal.car.fuelType,
    },
    customer: {
      id: deal.customer.id,
      name: deal.customer.name,
      phone: deal.customer.phone,
    }
  }));

  const serializedExpenses = expenses.map((exp: any) => ({
    id: exp.id,
    date: new Date(exp.date).toISOString(),
    car: {
      id: exp.car.id,
      brand: exp.car.brand,
      model: exp.car.model,
      registrationNum: exp.car.registrationNum,
      purchasePrice: exp.car.purchasePrice,
    },
    paidBy: exp.paidBy,
    expenseType: exp.expenseType,
    description: exp.description,
    amount: exp.amount,
  }));

  // Fetch registered ERP partners instead of Clerk members
  const partners = await prisma.partner.findMany({
    where: { businessId: context.business.id, isActive: true },
    select: { id: true, name: true }
  });

  const serializedMembers = partners.map((p: any) => ({
    id: p.id,
    name: p.name,
  }));

  const bankAccounts = await prisma.bankAccount.findMany({
    where: { businessId: context.business.id }
  });

  const serializedBankAccounts = bankAccounts.map((acc: any) => ({
    id: acc.id,
    name: acc.name,
    balance: acc.balance
  }));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h2>Deals & Profit Center</h2>
          <p style={{ color: 'var(--text-muted)' }}>Track transactions, expenses, and partner payouts.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          {!isReadOnly && (
            <>
              <Link href="/dashboard/deals/add-expense" className="btn-primary" style={{ background: 'rgba(255,255,255,0.1)', boxShadow: 'none' }}>
                <Plus size={18} style={{ marginRight: 8 }} /> Add Expense
              </Link>
              <Link href="/dashboard/deals/create" className="btn-primary">
                <Plus size={18} style={{ marginRight: 8 }} /> Close Deal
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="responsive-grid-3" style={{ marginBottom: '32px' }}>
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '8px' }}>Total Profit</div>
          <div style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--secondary)' }}>₹ {totalProfit.toLocaleString()}</div>
        </div>
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '8px' }}>Total Cars Investment</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 600 }}>₹ {totalInvestment.toLocaleString()}</div>
        </div>
        <div className="glass-card" style={{ padding: '24px', background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1), rgba(16, 185, 129, 0.1))' }}>
          <div style={{ color: 'var(--primary)', fontSize: '0.9rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: 6 }}><PieChart size={16}/> Partner Share ({memberCount} ways)</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 600, color: 'var(--text-main)' }}>₹ {partnerShare.toLocaleString()} <span style={{fontSize:'1rem', color:'var(--text-muted)'}}>/each</span></div>
        </div>
      </div>

      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ marginBottom: '16px', fontSize: '1.2rem' }}>Partner Cash-Flow (Out-of-Pocket Tracked)</h3>
        {Object.keys(partnerInvestments).length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No individual partner expenses logged yet. All expenses marked as Company.</p>
        ) : (
          <div className="responsive-grid-4">
            {Object.entries(partnerInvestments).map(([partner, total]) => (
              <div key={partner} className="glass-card" style={{ padding: '20px', border: '1px solid rgba(245, 158, 11, 0.2)', borderLeft: '4px solid #f59e0b' }}>
                 <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '8px' }}>{partner} Spent</div>
                 <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>₹ {total.toLocaleString()}</div>
                 <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '4px' }}>To be reimbursed</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <DealsClient 
        deals={serializedDeals} 
        expenses={serializedExpenses} 
        members={serializedMembers} 
        isReadOnly={isReadOnly} 
        businessName={context.business.name}
        businessLogo={context.business.logo}
        bankAccounts={serializedBankAccounts}
      />
    </div>
  );
}

