import { getActiveBusiness } from "@/actions/business";
import prisma from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { getTopRecommendations } from "@/lib/recommendations";
import { User, Phone, MessageSquare, Zap, Battery, Car, Target, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { getWhatsAppUrl, getTelUrl } from "@/lib/crmUtils";

export default async function CustomerDashboardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const context = await getActiveBusiness();
  if (!context) redirect("/onboarding");
  const businessId = context.business.id;

  // @ts-ignore
  const customer = await prisma.customer.findUnique({
    where: { id },
    // @ts-ignore
    include: { preference: true, interactions: true, inquiries: true, deals: { include: { car: true } } }
  });

  if (!customer || customer.businessId !== businessId) return notFound();

  const recommendations = await getTopRecommendations(id);
  const pref = customer.preference;

  return (
    <div style={{ paddingBottom: '64px' }}>
       <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
          <div>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><User size={28} /> {customer.name}</h2>
            <div style={{ color: 'var(--text-muted)', display: 'flex', gap: '16px', alignItems: 'center', marginTop: '8px', fontSize: '0.9rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Phone size={14}/> {customer.phone}</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <a href={getTelUrl(customer.phone)} style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }} title="Call Customer">
                  <Phone size={12}/> Call
                </a>
                <a href={getWhatsAppUrl(customer.phone)} target="_blank" rel="noopener noreferrer" style={{ background: 'rgba(37, 211, 102, 0.15)', color: '#25d366', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }} title="WhatsApp Chat">
                  <MessageSquare size={12}/> WhatsApp
                </a>
              </div>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--primary)' }}><Target size={14}/> Stage: {customer.stage}</span>
            </div>
          </div>
          <Link href={`/dashboard/customers/${customer.id}/edit`} className="btn-primary" style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--text-main)', boxShadow: 'none' }}>
            Edit Core Details
          </Link>
       </div>


       <div className="responsive-customer-grid">
         
         {/* Left Column: Preferences */}
         <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="glass-card">
               <h3 style={{ marginBottom: '24px', fontSize: '1.1rem' }}>Preference Vector</h3>
               {pref ? (
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '8px' }}>
                     <span style={{ color: 'var(--text-muted)' }}>Budget</span>
                     <span style={{ fontWeight: 600 }}>₹{pref.budgetMin?.toLocaleString() || 0} - ₹{pref.budgetMax?.toLocaleString() || "Max"}</span>
                   </div>
                   <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '8px' }}>
                     <span style={{ color: 'var(--text-muted)' }}>Primary Priority</span>
                     <span style={{ fontWeight: 600, color: '#38bdf8' }}>{pref.priority}</span>
                   </div>
                   <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '8px' }}>
                     <span style={{ color: 'var(--text-muted)' }}>Usage</span>
                     <span style={{ fontWeight: 600 }}>{pref.purpose || "Not Specified"} {pref.usageType ? `(${pref.usageType})` : ""}</span>
                   </div>
                   <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '8px' }}>
                     <span style={{ color: 'var(--text-muted)' }}>Financing</span>
                     <span style={{ fontWeight: 600 }}>{pref.paymentMode || "Not Specified"} {pref.loanRequired ? "(Needs Loan)" : ""}</span>
                   </div>
                 </div>
               ) : (
                 <div style={{ color: 'var(--text-muted)' }}>No advanced preferences logged.</div>
               )}
            </div>

            <div className="glass-card">
               <h3 style={{ marginBottom: '24px', fontSize: '1.1rem' }}>Timeline</h3>
               {customer.inquiries.map((inq: any) => (
                  <div key={inq.id} style={{ marginBottom: '16px', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>{new Date(inq.createdAt).toLocaleDateString()}</div>
                    <div>{inq.notes || "No notes provided"}</div>
                  </div>
               ))}
               {customer.interactions.map((inter: any) => (
                  <div key={inter.id} style={{ fontSize: '0.9rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    • Recorded {inter.type} on {new Date(inter.date).toLocaleDateString()}
                  </div>
               ))}
            </div>
         </div>

         {/* Right Column: AI Recommendations */}
         <div className="glass-card" style={{ background: 'rgba(168, 85, 247, 0.05)', border: '1px solid rgba(168, 85, 247, 0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
               <Zap size={24} color="#a855f7" />
               <h3 style={{ margin: 0, color: '#c084fc', fontSize: '1.3rem' }}>Algorithm Matches</h3>
            </div>
            
            {!pref ? (
               <div style={{ color: 'var(--text-muted)' }}>Cannot run recommendation engine without preference vectors.</div>
            ) : recommendations.length === 0 ? (
               <div style={{ color: 'var(--text-muted)' }}>No vehicles in the current inventory safely match the customer budget and threshold constraints.</div>
            ) : (
               <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                 {recommendations.map((rec, idx) => (
                   <Link href={`/dashboard/inventory/${rec.car.id}`} key={rec.car.id} style={{ display: 'flex', gap: '20px', padding: '24px', background: 'var(--surface-color)', borderRadius: '12px', border: '1px solid var(--border-light)', textDecoration: 'none', color: 'inherit' }} className="hover-lift">
                      
                      {/* Score Circle */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: '80px', borderRight: '1px solid var(--border-light)', paddingRight: '20px' }}>
                         <div style={{ fontSize: '2rem', fontWeight: 800, color: rec.score >= 80 ? '#10b981' : rec.score >= 50 ? '#f59e0b' : '#f43f5e' }}>{Math.round(rec.score)}%</div>
                         <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Match</div>
                      </div>

                      {/* Details */}
                      <div style={{ flex: 1 }}>
                         <div style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '4px' }}>{rec.car.year} {rec.car.brand} {rec.car.model}</div>
                         <div style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '1.1rem', marginBottom: '12px' }}>₹{rec.car.expectedSellPrice.toLocaleString()}</div>
                         
                         <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                           {rec.reasons.map((rsn, i) => (
                              <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', padding: '4px 8px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: '4px' }}>
                                <CheckCircle2 size={12} /> {rsn}
                              </span>
                           ))}
                         </div>
                      </div>
                   </Link>
                 ))}
               </div>
            )}
         </div>

       </div>
    </div>
  );
}
