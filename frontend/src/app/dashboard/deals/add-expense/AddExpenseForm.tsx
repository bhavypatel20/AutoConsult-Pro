"use client";

import { useState } from "react";
import { addExpense } from "@/actions/finance";
import FormSubmitButton from "@/components/FormSubmitButton";

interface Car {
  id: string;
  brand: string;
  model: string;
  registrationNum: string;
  status: string;
}

interface Partner {
  id: string;
  name: string;
}

interface AddExpenseFormProps {
  cars: Car[];
  partners: Partner[];
}

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

export default function AddExpenseForm({ cars, partners }: AddExpenseFormProps) {
  const [expenseType, setExpenseType] = useState("Repair");
  const [customExpenseType, setCustomExpenseType] = useState("");

  return (
    <form action={addExpense} className="glass-card" style={{ maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      <label>Select Car
        <select name="carId" required defaultValue="" style={{...inputStyle, WebkitAppearance: 'none'}}>
          <option value="" disabled>Select a vehicle...</option>
          {cars.map((car) => (
            <option key={car.id} value={car.id}>
              {car.brand} {car.model} - {car.registrationNum} ({car.status})
            </option>
          ))}
        </select>
      </label>

      <div className="responsive-grid-2">
        <label>Expense Type
          <select 
            name={expenseType === "Other" ? "expenseTypeSelect" : "expenseType"} 
            required 
            value={expenseType}
            onChange={(e) => setExpenseType(e.target.value)}
            style={{...inputStyle, WebkitAppearance: 'none'}}
          >
            <option value="Repair">Repair / Maintenance</option>
            <option value="Service">Service</option>
            <option value="Transport">Transport / Logistics</option>
            <option value="RTO">RTO / Paperwork</option>
            <option value="Fuel">Fuel Cost</option>
            <option value="Other">Other</option>
          </select>
        </label>
        <label>Amount (₹) <input type="number" name="amount" required style={inputStyle} placeholder="e.g. 4500" /></label>
      </div>

      {expenseType === "Other" && (
        <label>Specify Custom Expense Type
          <input 
            type="text" 
            name="expenseType" 
            required 
            value={customExpenseType} 
            onChange={(e) => setCustomExpenseType(e.target.value)} 
            style={inputStyle} 
            placeholder="e.g. Detailing, Insurance" 
          />
        </label>
      )}

      {partners.length > 1 ? (
        <label>Paid By (Partner Tracked)
            <select name="paidBy" required style={{...inputStyle, WebkitAppearance: 'none', background: 'rgba(245, 158, 11, 0.05)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)'}}>
              <option value="Company">Company Account (Default)</option>
              {partners.map((partner) => (
                <option key={partner.id} value={partner.name}>{partner.name}</option>
              ))}
            </select>
        </label>
      ) : (
        <input type="hidden" name="paidBy" value="Company" />
      )}

      <label>Description <br/><textarea name="description" rows={3} style={{...inputStyle, resize: 'vertical'}} placeholder="What was the expense for?" /></label>

      <FormSubmitButton 
        label="Save Expense" 
        pendingLabel="Logging vehicle maintenance expense..." 
        style={{ alignSelf: 'flex-start', marginTop: '16px' }} 
      />
    </form>
  );
}
