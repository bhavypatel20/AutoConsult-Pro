import { getActiveBusiness } from "@/actions/business";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, Car, Camera, MapPin, Calendar, Fuel, Receipt, Info } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import PhotoUploader from "./PhotoUploader";
import ShareCarButton from "./ShareCarButton";

export default async function CarDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const context = await getActiveBusiness();
  if (!context) redirect("/onboarding");
  const businessId = context.business.id;

  const car = await prisma.car.findUnique({
    where: { id },
    include: { expenses: true, deals: { include: { customer: true } } }
  });

  if (!car || car.businessId !== businessId) return notFound();

  // Financial Math
  const totalExpenses = car.expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const breakEvenCost = car.purchasePrice + totalExpenses;

  return (
    <div style={{ paddingBottom: '64px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px', flexWrap: 'wrap' }}>
        <Link href="/dashboard/inventory" style={{ color: 'var(--text-muted)' }}><ArrowLeft size={24} /></Link>
        <h2>{car.year} {car.brand} {car.model}</h2>
        <span style={{ 
          padding: '6px 12px', borderRadius: 99, fontSize: '0.85rem', fontWeight: 600,
          background: car.status === 'Available' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
          color: car.status === 'Available' ? '#10b981' : '#f59e0b'
        }}>
          {car.status}
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <ShareCarButton car={car} />
          <Link href={`/dashboard/inventory/${car.id}/edit`} className="btn-primary" style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.1)', color: 'var(--text-main)', boxShadow: 'none' }}>
             Edit Details
          </Link>
        </div>
      </div>


      <div className="responsive-chart-grid-1">
        
        {/* Left Column: Photos and Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Photo Section */}
          <div className="glass-card" style={{ padding: car.images ? '0' : '32px', background: 'rgba(255,255,255,0.02)', overflow: 'hidden' }}>
             {car.images ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={car.images} alt="Car Photo" style={{ width: '100%', display: 'block', maxHeight: '400px', objectFit: 'cover' }} />
             ) : (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '48px 0' }}>
                   <Camera size={48} style={{ opacity: 0.5, marginBottom: '16px' }} />
                   <div>No vehicle photo provided.</div>
                </div>
             )}
          </div>

          {/* Specs */}
          <div className="glass-card">
            <h3 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}><Info size={18}/> Vehicle Specifications</h3>
            <div className="responsive-grid-2">
              <div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Registration Number</div>
                <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{car.registrationNum}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}><Fuel size={14} style={{display:'inline'}}/> Fuel Type</div>
                <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{car.fuelType}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Variant / Sub-model</div>
                <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{car.variant || "N/A"}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Owner Type</div>
                <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{car.ownerType || "1st Owner"}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}><MapPin size={14} style={{display:'inline'}}/> KM Driven</div>
                <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{car.kmDriven.toLocaleString()} km</div>
              </div>
              <div>
                 <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Expected Selling Price</div>
                 <div style={{ fontWeight: 600, fontSize: '1.1rem', color: 'var(--primary)' }}>₹ {car.expectedSellPrice.toLocaleString()}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}><Calendar size={14} style={{display:'inline', marginRight:'4px'}}/> Purchase Date</div>
                <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{new Date(car.createdAt).toLocaleDateString("en-IN")}</div>
              </div>
              {car.status === "Sold" && car.deals[0] && (
                <div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}><Calendar size={14} style={{display:'inline', marginRight:'4px'}}/> Sold Date</div>
                  <div style={{ fontWeight: 600, fontSize: '1.1rem', color: '#10b981' }}>{new Date(car.deals[0].dealDate).toLocaleDateString("en-IN")}</div>
                </div>
              )}
              <div style={{ gridColumn: '1 / -1' }}>
                 <hr style={{ border: 'none', borderTop: '1px solid var(--border-light)', margin: '0 0 16px 0' }} />
                 <h4 style={{ fontSize: '0.9rem', marginBottom: '16px', color: 'var(--text-muted)' }}>Seller Information</h4>
                 <div className="responsive-grid-2">
                   <div>
                     <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Seller Name</div>
                     <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{car.sellerName || "N/A"}</div>
                   </div>
                   <div>
                     <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Seller Address</div>
                     <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{car.sellerAddress || "N/A"}</div>
                   </div>
                 </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Financial Math */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
             <div style={{ background: 'rgba(255,255,255,0.03)', padding: '24px', borderBottom: '1px solid var(--border-light)' }}>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}><Receipt size={18}/> Financial Sheet</h3>
             </div>
             
             <div style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Original Buy Price</span>
                  <span style={{ fontWeight: 600 }}>₹ {car.purchasePrice.toLocaleString()}</span>
                </div>

                {car.expenses.length > 0 && (
                  <div style={{ margin: '24px 0', padding: '16px', background: 'rgba(244, 63, 94, 0.05)', borderRadius: '12px', border: '1px solid rgba(244, 63, 94, 0.1)' }}>
                    <div style={{ fontSize: '0.8rem', color: '#f43f5e', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, marginBottom: '12px' }}>Added Expenses</div>
                    {car.expenses.map((exp) => {
                      const expDate = new Date(exp.date).toLocaleDateString("en-IN");
                      return (
                        <div key={exp.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
                          <span>
                            {exp.expenseType}{" "}
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                              ({expDate}{exp.description ? ` - ${exp.description}` : ""})
                            </span>
                          </span>
                          <span style={{ color: '#f43f5e' }}>+ ₹ {exp.amount.toLocaleString()}</span>
                        </div>
                      );
                    })}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', paddingTop: '12px', borderTop: '1px dashed rgba(244, 63, 94, 0.3)', fontWeight: 600, color: '#f43f5e' }}>
                      <span>Total Expenses</span>
                      <span>+ ₹ {totalExpenses.toLocaleString()}</span>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--border-light)' }}>
                  <span style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }}>True Break-Even Cost</span>
                  <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)' }}>₹ {breakEvenCost.toLocaleString()}</span>
                </div>

                {car.status === "Sold" && car.deals[0] && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', padding: '16px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                    <span style={{ fontSize: '1.1rem', color: '#10b981', fontWeight: 600 }}>Final Sold Price</span>
                    <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#10b981' }}>₹ {car.finalSellPrice?.toLocaleString()}</span>
                  </div>
                )}
                
                {car.status === "Sold" && car.deals[0] && (
                   <div style={{ textAlign: 'right', marginTop: '12px', fontSize: '0.9rem', color: 'var(--secondary)' }}>
                     Net Profit on Car: <strong>₹ {((car.finalSellPrice || 0) - breakEvenCost).toLocaleString()}</strong>
                   </div>
                )}
             </div>
          </div>

        </div>

      </div>
    </div>
  );
}
