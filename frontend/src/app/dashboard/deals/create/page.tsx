import { addDeal } from "@/actions/finance";
import { getActiveBusiness } from "@/actions/business";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import FormSubmitButton from "@/components/FormSubmitButton";

const inputStyle = {
  width: '100%',
  padding: '12px 16px',
  borderRadius: '12px',
  background: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid var(--border-light)',
  color: 'var(--text-main)',
  marginTop: '8px',
  outline: 'none'
};

export default async function CreateDealPage() {
  const context = await getActiveBusiness();
  if (!context) redirect("/onboarding");
  const businessId = context.business.id;

  if (context.membership.role === "PARTNER_VIEW") {
    redirect("/dashboard/deals");
  }

  const cars = await prisma.car.findMany({ 
    where: { status: { not: "Sold" }, businessId } 
  });
  
  const customers = await prisma.customer.findMany({ 
    where: { stage: { not: "Deal Closed" }, businessId } 
  });

  return (
    <div>
      <h2 style={{ marginBottom: '32px' }}>Close a Deal</h2>
      
      <form action={addDeal} className="glass-card" style={{ maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        <label>Select Car 
           <select name="carId" required defaultValue="" style={{...inputStyle, WebkitAppearance: 'none'}}>
             <option value="" disabled>Select a vehicle...</option>
             {cars.map((car) => (
                <option key={car.id} value={car.id}>{car.brand} {car.model} - {car.registrationNum}</option>
             ))}
           </select>
        </label>
        
        <label>Select Customer
           <select name="customerId" required defaultValue="" style={{...inputStyle, WebkitAppearance: 'none'}}>
             <option value="" disabled>Select a customer...</option>
             {customers.map((cust) => (
                <option key={cust.id} value={cust.id}>{cust.name} - {cust.phone}</option>
             ))}
           </select>
        </label>

        <div className="responsive-grid-2">
          <label>Final Sold Price (₹) <input type="number" name="finalPrice" required style={inputStyle} /></label>
          <label>Deal Date
            <input type="date" name="dealDate" required defaultValue={new Date().toISOString().substring(0, 10)} style={inputStyle} />
          </label>
        </div>

        <label>Payment Status
          <select name="paymentStatus" required style={{...inputStyle, WebkitAppearance: 'none'}}>
            <option value="Paid">Paid Fully</option>
            <option value="Partial">Partial</option>
            <option value="Pending">Pending</option>
          </select>
        </label>

        <FormSubmitButton 
          label="Finalize Deal" 
          pendingLabel="Locking final deal terms..." 
          style={{ alignSelf: 'flex-start', marginTop: '16px' }} 
        />
      </form>
    </div>
  );
}
