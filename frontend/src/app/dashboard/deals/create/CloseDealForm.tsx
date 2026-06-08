"use client";

import { addDeal } from "@/actions/finance";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import FormSubmitButton from "@/components/FormSubmitButton";
import AutoLoader from "@/components/AutoLoader";
import SearchableCarSelect from "@/components/SearchableCarSelect";

interface Car {
  id: string;
  brand: string;
  model: string;
  registrationNum: string;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
}

interface BankAccount {
  id: string;
  name: string;
  accountNumber: string | null;
  balance: number;
}

interface CloseDealFormProps {
  cars: Car[];
  customers: Customer[];
  bankAccounts: BankAccount[];
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

export default function CloseDealForm({ cars, customers, bankAccounts }: CloseDealFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState("Paid");
  const [finalPrice, setFinalPrice] = useState("");
  const [receivedAmount, setReceivedAmount] = useState("");
  const [dealDate, setDealDate] = useState(new Date().toISOString().substring(0, 10));
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().substring(0, 10));

  // Sync receivedAmount to finalPrice if fully Paid
  useEffect(() => {
    if (paymentStatus === "Paid") {
      setReceivedAmount(finalPrice);
    } else if (paymentStatus === "Pending") {
      setReceivedAmount("0");
    } else if (paymentStatus === "Partial") {
      setReceivedAmount(""); // Clear so they can easily enter the first installment/advance amount
    }
  }, [paymentStatus, finalPrice]);

  // Sync paymentDate to dealDate by default
  useEffect(() => {
    setPaymentDate(dealDate);
  }, [dealDate]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      const res = await addDeal(formData);
      if (res && !res.success) {
        alert(res.error || "Failed to finalize deal.");
        setLoading(false);
      } else {
        router.push("/dashboard/deals");
      }
    } catch (err: any) {
      if (!err.message?.includes("NEXT_REDIRECT")) {
        alert(err.message || "An unexpected error occurred.");
        setLoading(false);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="glass-card" style={{ maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      <label>Select Car 
         <SearchableCarSelect 
           cars={cars} 
           name="carId" 
           required 
           placeholder="Search by brand, model, or registration number..." 
         />
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
        <label>Final Sold Price (₹) 
          <input 
            type="number" 
            name="finalPrice" 
            required 
            value={finalPrice} 
            onChange={(e) => setFinalPrice(e.target.value)} 
            style={inputStyle} 
            placeholder="e.g. 550000"
          />
        </label>
        <label>Deal Date
          <input 
            type="date" 
            name="dealDate" 
            required 
            value={dealDate} 
            onChange={(e) => setDealDate(e.target.value)} 
            style={inputStyle} 
          />
        </label>
      </div>

      <label>Payment Status
        <select 
          name="paymentStatus" 
          required 
          value={paymentStatus}
          onChange={(e) => setPaymentStatus(e.target.value)}
          style={{...inputStyle, WebkitAppearance: 'none'}}
        >
          <option value="Paid">Paid Fully</option>
          <option value="Partial">Partial</option>
          <option value="Pending">Pending</option>
        </select>
      </label>

      {/* Conditional Payment details logging block */}
      {(paymentStatus === "Paid" || paymentStatus === "Partial") && (
        <div style={{ padding: '20px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '12px', border: '1px solid var(--border-light)', marginTop: '8px' }}>
          <h4 style={{ color: 'var(--primary)', marginBottom: '16px' }}>Received Payment Logging</h4>
          
          <div className="responsive-grid-2" style={{ marginBottom: '16px' }}>
            <label>Amount Received (₹)
              <input 
                type="number" 
                name="receivedAmount" 
                required
                value={receivedAmount}
                onChange={(e) => {
                  if (paymentStatus === "Partial") {
                    setReceivedAmount(e.target.value);
                  }
                }}
                disabled={paymentStatus === "Paid"}
                style={{
                  ...inputStyle,
                  background: paymentStatus === "Paid" ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.05)',
                  cursor: paymentStatus === "Paid" ? 'not-allowed' : 'text'
                }} 
              />
              {/* Ensure value is still submitted if input is disabled */}
              {paymentStatus === "Paid" && <input type="hidden" name="receivedAmount" value={receivedAmount} />}
            </label>
            <label>Payment Date
              <input 
                type="date" 
                name="paymentDate" 
                required 
                value={paymentDate} 
                onChange={(e) => setPaymentDate(e.target.value)} 
                style={inputStyle} 
              />
            </label>
          </div>

          <div className="responsive-grid-2">
            <label>Payment Mode / Type
              <select name="paymentMode" required defaultValue="CASH" style={{...inputStyle, WebkitAppearance: 'none'}}>
                <option value="CASH">Cash</option>
                <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                <option value="BANK_TRANSFER">Bank Transfer (IMPS / NEFT)</option>
                <option value="CHEQUE">Cheque</option>
              </select>
            </label>
            <label>Received Into Account
              <select name="bankAccountId" required defaultValue="" style={{...inputStyle, WebkitAppearance: 'none'}}>
                <option value="" disabled>Select account...</option>
                {bankAccounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>{acc.name} (Bal: ₹{acc.balance})</option>
                ))}
              </select>
            </label>
          </div>
        </div>
      )}

      <button 
        type="submit" 
        disabled={loading} 
        className="btn-primary" 
        style={{ alignSelf: 'flex-start', marginTop: '16px' }}
      >
        {loading ? "Finalizing..." : "Finalize Deal"}
      </button>
      {loading && <AutoLoader fullscreen={true} message="Locking final deal terms..." />}
    </form>
  );
}
