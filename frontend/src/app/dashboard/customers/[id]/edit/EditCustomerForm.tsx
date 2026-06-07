"use client";

import { useState } from "react";
import { updateCustomer } from "@/actions/customer";
import { User, Car, Wallet, Target } from "lucide-react";
import FormSubmitButton from "@/components/FormSubmitButton";

interface EditCustomerFormProps {
  customer: {
    id: string;
    name: string;
    phone: string;
    address: string | null;
    type: string;
    stage: string;
    notes: string | null;
    nextFollowUp: Date | string | null;
    preference: {
      budgetMin: number | null;
      budgetMax: number | null;
      carType: string | null;
      preferredBrands: string | null;
      fuelType: string | null;
      purpose: string | null;
      usageType: string | null;
      seatingCapacity: number | null;
      paymentMode: string | null;
      loanRequired: boolean;
      downPayment: number | null;
      exchangeRequired: boolean;
      priority: string | null;
    } | null;
  };
}

const inputStyle = {
  width: '100%',
  padding: '12px 16px',
  borderRadius: '12px',
  background: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid var(--border-light)',
  color: 'var(--text-main)',
  marginTop: '8px',
  outline: 'none',
  WebkitAppearance: 'none' as any
};

export default function EditCustomerForm({ customer }: EditCustomerFormProps) {
  const pref = (customer.preference || {}) as any;
  const dateStr = customer.nextFollowUp 
    ? new Date(customer.nextFollowUp).toISOString().split("T")[0] 
    : "";

  // Parse initial values
  let initialBaseFuel = pref.fuelType || "";
  let initialFitting = "Company Fitted";

  if (pref.fuelType) {
    if (pref.fuelType.includes("Petrol+CNG")) {
      initialBaseFuel = "PETROL_CNG";
    } else if (pref.fuelType.includes("CNG")) {
      initialBaseFuel = "CNG";
    }

    if (pref.fuelType.includes("Without Company Fitted")) {
      initialFitting = "Without Company Fitted";
    } else if (pref.fuelType.includes("Company Fitted")) {
      initialFitting = "Company Fitted";
    }
  }

  const standardCarTypes = ["", "HATCHBACK", "SEDAN", "SUV", "LUXURY", "MPV"];
  let initialCarType = pref.carType || "";
  let isCustom = false;

  if (initialCarType && !standardCarTypes.includes(initialCarType)) {
    isCustom = true;
    initialCarType = "Other";
  }

  const [carType, setCarType] = useState(initialCarType);
  const [customCarType, setCustomCarType] = useState(isCustom ? (pref.carType || "") : "");
  const [fuelType, setFuelType] = useState(initialBaseFuel);
  const [cngFitting, setCngFitting] = useState(initialFitting);

  const handleSubmitAction = async (formData: FormData) => {
    const fuel = formData.get("fuelType") as string;
    if (fuel === "CNG" || fuel === "PETROL_CNG") {
      const fuelLabel = fuel === "PETROL_CNG" ? "Petrol+CNG" : "CNG";
      formData.set("fuelType", `${fuelLabel} (${cngFitting})`);
    }
    await updateCustomer(formData);
  };

  return (
    <form action={handleSubmitAction} style={{ maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      <input type="hidden" name="id" value={customer.id} />

      {/* Core Identity */}
      <div className="glass-card">
        <h3 style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '16px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <User size={20} /> Core Identity
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="responsive-grid-2">
            <label>Full Name <input name="name" required defaultValue={customer.name} style={inputStyle} /></label>
            <label>Phone / WhatsApp <input name="phone" required defaultValue={customer.phone} style={inputStyle} /></label>
          </div>
          <label>Address <input name="address" defaultValue={customer.address || ""} style={inputStyle} placeholder="Optional" /></label>
          <div className="responsive-grid-2">
            <label>Customer Type
              <select name="type" required defaultValue={customer.type} style={inputStyle}>
                <option value="Buyer">Buyer</option>
                <option value="Seller">Seller</option>
                <option value="Both">Both (Exchange)</option>
              </select>
            </label>
            <label>Deal Stage
              <select name="stage" required defaultValue={customer.stage} style={inputStyle}>
                <option value="Inquiry">Inquiry</option>
                <option value="Negotiation">Negotiation</option>
                <option value="Deal Closed">Deal Closed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </label>
          </div>
          <div className="responsive-grid-2">
            <label>Next Follow-Up Date <input type="date" name="nextFollowUp" defaultValue={dateStr} style={inputStyle} /></label>
            <label>Notes <input name="notes" defaultValue={customer.notes || ""} style={inputStyle} /></label>
          </div>
        </div>
      </div>

      {/* Vehicle Requirements */}
      <div className="glass-card">
        <h3 style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '16px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Car size={20} /> Vehicle Requirements
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="responsive-grid-2">
            <label>Car Type
               <select 
                 name={carType === "Other" ? "carTypeSelect" : "carType"} 
                 value={carType}
                 onChange={(e) => setCarType(e.target.value)}
                 style={inputStyle}
               >
                 <option value="">Any</option>
                 <option value="HATCHBACK">Hatchback</option>
                 <option value="SEDAN">Sedan</option>
                 <option value="SUV">SUV</option>
                 <option value="LUXURY">Luxury</option>
                 <option value="MPV">MPV</option>
                 <option value="Other">Other</option>
               </select>
            </label>
            <label>Fuel Preference
               <select 
                 name="fuelType" 
                 value={fuelType}
                 onChange={(e) => setFuelType(e.target.value)}
                 style={inputStyle}
               >
                 <option value="">Any</option>
                 <option value="PETROL">Petrol</option>
                 <option value="DIESEL">Diesel</option>
                 <option value="CNG">CNG</option>
                 <option value="PETROL_CNG">Petrol+CNG</option>
                 <option value="ELECTRIC">Electric</option>
               </select>
            </label>
          </div>

          {carType === "Other" && (
            <label>Specify Custom Car Type
              <input 
                type="text" 
                name="carType" 
                required 
                value={customCarType} 
                onChange={(e) => setCustomCarType(e.target.value)} 
                style={inputStyle} 
                placeholder="e.g. Crossover, Convertible" 
              />
            </label>
          )}

          {(fuelType === "CNG" || fuelType === "PETROL_CNG") && (
            <div className="responsive-grid-2">
              <label>CNG/Petrol+CNG Fitting Preference
                <select 
                  value={cngFitting} 
                  onChange={(e) => setCngFitting(e.target.value)} 
                  style={inputStyle}
                >
                  <option value="Company Fitted">Company Fitted</option>
                  <option value="Without Company Fitted">Without Company Fitted</option>
                </select>
              </label>
              <div></div>
            </div>
          )}

          <div className="responsive-grid-2">
             <label>Purpose
               <select name="purpose" defaultValue={pref.purpose || ""} style={inputStyle}>
                 <option value="">Any</option><option value="PERSONAL">Personal Commute</option><option value="FAMILY">Family Use</option><option value="COMMERCIAL">Commercial</option>
               </select>
             </label>
             <label>Usage Area
               <select name="usageType" defaultValue={pref.usageType || ""} style={inputStyle}>
                 <option value="">Any</option><option value="CITY">Strictly City</option><option value="HIGHWAY">Heavy Highway</option><option value="MIXED">Mixed</option>
               </select>
             </label>
          </div>
          <div className="responsive-grid-2">
             <label>Minimum Seats <input type="number" name="seatingCapacity" defaultValue={pref.seatingCapacity || ""} style={inputStyle} placeholder="e.g. 5" /></label>
             <label>Preferred Brands <input name="preferredBrands" defaultValue={pref.preferredBrands || ""} style={inputStyle} placeholder="e.g. Hyundai, Honda" /></label>
          </div>
        </div>
      </div>

      {/* Financial Profile */}
      <div className="glass-card">
        <h3 style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '16px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Wallet size={20} /> Financial Profile
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="responsive-grid-2">
             <label>Min Budget (₹) <input type="number" name="budgetMin" defaultValue={pref.budgetMin || ""} style={inputStyle} /></label>
             <label>Max Budget (₹) <input type="number" name="budgetMax" defaultValue={pref.budgetMax || ""} style={inputStyle} /></label>
          </div>
          <div className="responsive-grid-2">
             <label>Payment Method
               <select name="paymentMode" defaultValue={pref.paymentMode || ""} style={inputStyle}>
                 <option value="">Any</option><option value="CASH">Cash</option><option value="LOAN">Bank Loan</option>
               </select>
             </label>
             <label>Available Down Payment (₹) <input type="number" name="downPayment" defaultValue={pref.downPayment || ""} style={inputStyle} /></label>
          </div>
          <div style={{ display: 'flex', gap: '24px' }}>
             <label style={{ display: 'flex', gap: '12px', alignItems: 'center', cursor: 'pointer' }}>
               <input type="checkbox" name="loanRequired" defaultChecked={pref.loanRequired} value="true" style={{ width: 20, height: 20 }} /> Requires Loan
             </label>
             <label style={{ display: 'flex', gap: '12px', alignItems: 'center', cursor: 'pointer' }}>
               <input type="checkbox" name="exchangeRequired" defaultChecked={pref.exchangeRequired} value="true" style={{ width: 20, height: 20 }} /> Exchange Old Car
             </label>
          </div>
        </div>
      </div>

      {/* Priorities */}
      <div className="glass-card">
        <h3 style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '16px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Target size={20} /> Top Priority
        </h3>
        <label>What matters most?
          <select name="priority" defaultValue={pref.priority || ""} style={inputStyle}>
            <option value="">Not Specified</option>
            <option value="PRICE">Best Price / Value</option>
            <option value="MILEAGE">Fuel Economy / Mileage</option>
            <option value="COMFORT">Comfort & Features</option>
            <option value="BRAND">Brand Value</option>
            <option value="RESALE">Resale Value</option>
          </select>
        </label>
      </div>

      <FormSubmitButton 
        label="Save Updated Profile" 
        pendingLabel="Tuning customer profile updates..." 
        style={{ padding: '16px 32px', fontSize: '1.1rem', marginTop: '16px', width: '100%' }} 
      />
    </form>
  );
}
