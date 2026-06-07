import { getAnalyticsData } from "@/lib/analytics";
import { ProfitBarChart, SalesLineChart, ExpensePieChart } from "./components/Charts";
import { AlertCircle, IndianRupee, CarFront, Target, Receipt } from "lucide-react";

export default async function AnalyticsPage() {
  const data = await getAnalyticsData();

  return (
    <div style={{ paddingBottom: '64px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
        <div>
          <h2>Business Intelligence</h2>
          <p style={{ color: 'var(--text-muted)' }}>Real-time analytics & dealership performance</p>
        </div>
      </div>

      {/* Smart Alerts */}
      {data.warnings.length > 0 && (
        <div style={{ marginBottom: '32px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {data.warnings.map((warn, i) => (
            <div key={i} style={{ padding: '16px 24px', background: warn.includes("CRITICAL") ? 'rgba(244, 63, 94, 0.1)' : 'rgba(245, 158, 11, 0.1)', border: `1px solid ${warn.includes("CRITICAL") ? 'rgba(244, 63, 94, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`, borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px', color: warn.includes("CRITICAL") ? '#f43f5e' : '#f59e0b' }}>
              <AlertCircle size={20} />
              <span style={{ fontWeight: 500 }}>{warn}</span>
            </div>
          ))}
        </div>
      )}

      {/* KPI Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        
        <div className="glass-card" style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
          <div style={{ background: 'rgba(56, 189, 248, 0.1)', padding: '16px', borderRadius: '12px', color: '#38bdf8' }}><IndianRupee size={24} /></div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '4px' }}>Total Net Profit</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>₹{data.profit.total.toLocaleString()}</div>
            <div style={{ fontSize: '0.8rem', color: '#10b981', marginTop: '4px' }}>Avg ₹{Math.round(data.profit.perCar).toLocaleString()} / car</div>
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '16px', borderRadius: '12px', color: '#10b981' }}><CarFront size={24} /></div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '4px' }}>Total Cars Sold</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{data.sales.totalCarsSold}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>{data.inventory.available} still available</div>
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
          <div style={{ background: 'rgba(168, 85, 247, 0.1)', padding: '16px', borderRadius: '12px', color: '#a855f7' }}><Target size={24} /></div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '4px' }}>Conversion Rate</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{data.sales.conversionRate.toFixed(1)}%</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>{data.customers.total} Total Inquiries</div>
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
          <div style={{ background: 'rgba(244, 63, 94, 0.1)', padding: '16px', borderRadius: '12px', color: '#f43f5e' }}><Receipt size={24} /></div>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '4px' }}>Total Outflow (Expenses)</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>₹{data.expenses.total.toLocaleString()}</div>
          </div>
        </div>

      </div>

      {/* Charts Row 1 */}
      <div className="responsive-chart-grid-1" style={{ marginBottom: '32px' }}>
        <div className="glass-card">
          <h3 style={{ marginBottom: '24px' }}>Monthly Profit Yield</h3>
          <ProfitBarChart data={data.profit.trend} />
        </div>
        <div className="glass-card">
          <h3 style={{ marginBottom: '24px' }}>Expense Allocation</h3>
          <ExpensePieChart data={data.expenses.byCategory} />
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="responsive-chart-grid-2">
        <div className="glass-card">
          <h3 style={{ marginBottom: '24px' }}>Sales Velocity</h3>
          <SalesLineChart data={data.sales.trend} />
        </div>
        
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginBottom: '24px' }}>Partner Contributions</h3>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
             {data.partners.expensesByPartner.length > 0 ? data.partners.expensesByPartner.map((partner, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                   <span style={{ fontWeight: 600 }}>{partner.name || "Company"}</span>
                   <span style={{ color: '#38bdf8', fontWeight: 700 }}>₹{partner.value.toLocaleString()} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>paid out</span></span>
                </div>
             )) : (
                <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '32px 0' }}>No partner funds logged</div>
             )}
          </div>
        </div>
      </div>

    </div>
  );
}
