"use client";

import { useState, useTransition, useEffect } from "react";
import { editExpense, deleteExpense, editDeal, deleteDeal } from "@/actions/finance";
import { Edit2, Trash2, X, AlertTriangle, Printer } from "lucide-react";

interface Car {
  id: string;
  brand: string;
  model: string;
  registrationNum: string;
  purchasePrice: number;
  year: number;
  fuelType: string;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
}

interface Deal {
  id: string;
  dealDate: string;
  finalPrice: number;
  paymentStatus: string;
  advanceReceived: number;
  car: Car;
  customer: Customer;
}

interface Expense {
  id: string;
  date: string;
  car: Car;
  paidBy: string;
  expenseType: string;
  description: string;
  amount: number;
}

interface Member {
  id: string;
  name: string;
}

interface BankAccount {
  id: string;
  name: string;
  balance: number;
}

interface DealsClientProps {
  deals: Deal[];
  expenses: Expense[];
  members: Member[];
  isReadOnly: boolean;
  businessName: string;
  businessLogo: string | null;
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

const selectStyle = {
  ...inputStyle,
  WebkitAppearance: 'none' as any,
  MozAppearance: 'none' as any,
  appearance: 'none' as any,
  backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23a1a1aa' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 16px center',
  backgroundSize: '16px',
  paddingRight: '40px'
};

const cancelBtnStyle = {
  padding: '10px 20px',
  borderRadius: '99px',
  border: '1px solid var(--border-light)',
  background: 'rgba(255,255,255,0.05)',
  color: 'var(--text-main)',
  cursor: 'pointer',
  fontWeight: 600,
  fontSize: '0.9rem'
};

export default function DealsClient({ deals, expenses, members, isReadOnly, businessName, businessLogo, bankAccounts }: DealsClientProps) {
  const [isPending, startTransition] = useTransition();
  const unpaidDeals = deals.filter(deal => deal.paymentStatus !== 'Paid');
  
  // Modals / Editing States
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);
  
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [deletingDeal, setDeletingDeal] = useState<Deal | null>(null);
  const [printingInvoice, setPrintingInvoice] = useState<Deal | null>(null);

  const [editExpenseType, setEditExpenseType] = useState("Repair");
  const [customEditExpenseType, setCustomEditExpenseType] = useState("");

  const standardTypes = ["Repair", "Service", "Transport", "RTO", "Fuel"];

  const [editPaymentStatus, setEditPaymentStatus] = useState("Pending");

  useEffect(() => {
    if (editingExpense) {
      const isStandard = standardTypes.includes(editingExpense.expenseType);
      if (isStandard) {
        setEditExpenseType(editingExpense.expenseType);
        setCustomEditExpenseType("");
      } else {
        setEditExpenseType("Other");
        setCustomEditExpenseType(editingExpense.expenseType);
      }
    }
  }, [editingExpense]);

  useEffect(() => {
    if (editingDeal) {
      setEditPaymentStatus(editingDeal.paymentStatus);
    }
  }, [editingDeal]);

  // Submit Handlers
  const handleEditExpense = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await editExpense(formData);
        setEditingExpense(null);
      } catch (err: any) {
        alert(err.message || "Failed to update expense");
      }
    });
  };

  const handleDeleteExpense = (id: string) => {
    startTransition(async () => {
      try {
        await deleteExpense(id);
        setDeletingExpense(null);
      } catch (err: any) {
        alert(err.message || "Failed to delete expense");
      }
    });
  };

  const handleEditDeal = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        const res = await editDeal(formData);
        if (res && !res.success) {
          alert(res.error || "Failed to update deal");
        } else {
          setEditingDeal(null);
        }
      } catch (err: any) {
        alert(err.message || "Failed to update deal");
      }
    });
  };

  const handleDeleteDeal = (id: string) => {
    startTransition(async () => {
      try {
        await deleteDeal(id);
        setDeletingDeal(null);
      } catch (err: any) {
        alert(err.message || "Failed to delete deal");
      }
    });
  };

  return (
    <>
      {unpaidDeals.length > 0 && (
        <div className="glass-card" style={{
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(239, 68, 68, 0.08))',
          border: '1px solid rgba(245, 158, 11, 0.25)',
          borderLeft: '4px solid #f59e0b',
          padding: '20px 24px',
          borderRadius: '16px',
          marginBottom: '28px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{ color: '#f59e0b', display: 'flex', alignItems: 'center' }}>
            <AlertTriangle size={24} />
          </div>
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: '0 0 4px 0', color: 'var(--text-main)', fontSize: '1rem', fontWeight: 600 }}>Outstanding Installment Payments</h4>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              There {unpaidDeals.length === 1 ? 'is 1 vehicle' : `are ${unpaidDeals.length} vehicles`} with outstanding balances or pending payments. Please review customer ledgers to log incoming installments.
            </p>
          </div>
        </div>
      )}

      {/* 1. Closed Deals Section */}
      <h3 style={{ marginBottom: '16px' }}>Recent Closed Deals</h3>
      {deals.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '42px', color: 'var(--text-muted)', marginBottom: '32px' }}>
          No deals closed yet.
        </div>
      ) : (
        <div className="glass-card table-responsive-wrapper" style={{ padding: 0, marginBottom: '32px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-light)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                <th style={{ padding: '16px 24px', fontWeight: 600 }}>Closed Date</th>
                <th style={{ padding: '16px 24px', fontWeight: 600 }}>Car & Customer</th>
                <th style={{ padding: '16px 24px', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '16px 24px', fontWeight: 600 }}>Revenue</th>
                <th style={{ padding: '16px 24px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {deals.map(deal => (
                <tr key={deal.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <td style={{ padding: '16px 24px' }}>{new Date(deal.dealDate).toLocaleDateString()}</td>
                  <td style={{ padding: '16px 24px' }}>
                    <strong>{deal.car.brand} {deal.car.model}</strong>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Sold to: {deal.customer.name}</div>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                     <span style={{ padding: '4px 10px', borderRadius: 99, fontSize: '0.8rem', background: deal.paymentStatus === 'Paid' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)', color: deal.paymentStatus === 'Paid' ? '#10b981' : '#f59e0b' }}>
                      {deal.paymentStatus}
                    </span>
                  </td>
                  <td style={{ padding: '16px 24px', fontWeight: 'bold' }}>₹ {deal.finalPrice.toLocaleString()}</td>
                  <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', alignItems: 'center' }}>
                      <button 
                        onClick={() => setPrintingInvoice(deal)}
                        style={{ background: 'transparent', border: 'none', color: '#c084fc', cursor: 'pointer', padding: '4px', display: 'inline-flex', alignItems: 'center' }}
                        title="Print Invoice"
                      >
                        <Printer size={16} />
                      </button>
                      {!isReadOnly && (
                        <>
                          <button 
                            onClick={() => setEditingDeal(deal)}
                            style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: '4px', display: 'inline-flex', alignItems: 'center' }}
                            title="Edit Deal"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => setDeletingDeal(deal)}
                            style={{ background: 'transparent', border: 'none', color: '#f43f5e', cursor: 'pointer', padding: '4px', display: 'inline-flex', alignItems: 'center' }}
                            title="Delete Deal"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 2. Logged Expenses Section */}
      <h3 style={{ marginBottom: '16px', marginTop: '16px' }}>Recent Logged Expenses</h3>
      {expenses.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '42px', color: 'var(--text-muted)' }}>
          No expenses recorded yet.
        </div>
      ) : (
        <div className="glass-card table-responsive-wrapper" style={{ padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-light)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                <th style={{ padding: '16px 24px', fontWeight: 600 }}>Date</th>
                <th style={{ padding: '16px 24px', fontWeight: 600 }}>Attached To Car</th>
                <th style={{ padding: '16px 24px', fontWeight: 600 }}>Funded By</th>
                <th style={{ padding: '16px 24px', fontWeight: 600 }}>Type & Description</th>
                <th style={{ padding: '16px 24px', fontWeight: 600 }}>Cost</th>
                {!isReadOnly && <th style={{ padding: '16px 24px', fontWeight: 600, textAlign: 'right' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {expenses.map(exp => (
                <tr key={exp.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <td style={{ padding: '16px 24px' }}>{new Date(exp.date).toLocaleDateString()}</td>
                  <td style={{ padding: '16px 24px' }}>
                    <strong>{exp.car.brand} {exp.car.model}</strong>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{exp.car.registrationNum}</div>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: exp.paidBy && exp.paidBy !== "Company" ? '#f59e0b' : 'var(--text-main)' }}>{exp.paidBy || "Company"}</div>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                     <span style={{ padding: '4px 10px', borderRadius: 99, fontSize: '0.8rem', background: 'rgba(244, 63, 94, 0.15)', color: '#f43f5e', marginRight: '8px' }}>
                      {exp.expenseType}
                    </span>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{exp.description}</span>
                  </td>
                  <td style={{ padding: '16px 24px', fontWeight: 'bold', color: '#f43f5e' }}>- ₹ {exp.amount.toLocaleString()}</td>
                  {!isReadOnly && (
                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button 
                          onClick={() => setEditingExpense(exp)}
                          style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: '4px' }}
                          title="Edit Expense"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => setDeletingExpense(exp)}
                          style={{ background: 'transparent', border: 'none', color: '#f43f5e', cursor: 'pointer', padding: '4px' }}
                          title="Delete Expense"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* --- MODALS --- */}

      {/* A. Edit Expense Modal */}
      {editingExpense && (
        <div className="checkout-modal-backdrop" onClick={() => setEditingExpense(null)}>
          <div className="checkout-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px', maxHeight: 'min(720px, calc(100vh - 40px))', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>Edit Expense</h3>
              <button onClick={() => setEditingExpense(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20}/></button>
            </div>
            
            <form onSubmit={handleEditExpense} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto', flexGrow: 1, minHeight: 0 }}>
              <input type="hidden" name="id" value={editingExpense.id} />
              
              <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                Logged for: <strong>{editingExpense.car.brand} {editingExpense.car.model}</strong> ({editingExpense.car.registrationNum})
              </div>

              <div className="responsive-grid-2">
                <label style={{ fontSize: '0.9rem' }}>Expense Type
                  <select 
                    name={editExpenseType === "Other" ? "expenseTypeSelect" : "expenseType"} 
                    required 
                    value={editExpenseType} 
                    onChange={(e) => setEditExpenseType(e.target.value)}
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
                <label style={{ fontSize: '0.9rem' }}>Amount (₹)
                  <input type="number" name="amount" required defaultValue={editingExpense.amount} style={inputStyle} />
                </label>
              </div>

              {editExpenseType === "Other" && (
                <label style={{ fontSize: '0.9rem' }}>Specify Custom Expense Type
                  <input 
                    type="text" 
                    name="expenseType" 
                    required 
                    value={customEditExpenseType} 
                    onChange={(e) => setCustomEditExpenseType(e.target.value)} 
                    style={inputStyle} 
                    placeholder="e.g. Detailing, Insurance" 
                  />
                </label>
              )}

              <label style={{ fontSize: '0.9rem' }}>Paid By (Partner Tracked)
                <select name="paidBy" required defaultValue={editingExpense.paidBy || "Company"} style={{...inputStyle, WebkitAppearance: 'none', background: 'rgba(245, 158, 11, 0.05)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)'}}>
                  <option value="Company">Company Account (Default)</option>
                  {members.map(m => (
                    <option key={m.id} value={m.name}>{m.name}</option>
                  ))}
                </select>
              </label>

              <label style={{ fontSize: '0.9rem' }}>Description
                <textarea name="description" rows={3} defaultValue={editingExpense.description} style={{...inputStyle, resize: 'vertical'}} />
              </label>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button type="button" onClick={() => setEditingExpense(null)} style={cancelBtnStyle}>Cancel</button>
                <button type="submit" disabled={isPending} className="btn-primary" style={{ padding: '10px 24px', fontSize: '0.9rem' }}>
                  {isPending ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* B. Delete Expense Confirmation Modal */}
      {deletingExpense && (
        <div className="checkout-modal-backdrop" onClick={() => setDeletingExpense(null)}>
          <div className="checkout-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px', padding: '24px' }}>
            <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
              <div style={{ color: '#f43f5e', background: 'rgba(244, 63, 94, 0.1)', padding: '12px', borderRadius: '50%' }}>
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 style={{ margin: '0 0 8px 0' }}>Delete Expense?</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.4' }}>
                  Are you sure you want to delete this expense of <strong>₹ {deletingExpense.amount.toLocaleString()}</strong>? This action cannot be undone and will recalculate profits immediately.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => setDeletingExpense(null)} style={cancelBtnStyle}>Cancel</button>
              <button 
                onClick={() => handleDeleteExpense(deletingExpense.id)} 
                disabled={isPending}
                style={{
                  padding: '10px 24px', borderRadius: '99px', border: 'none', background: '#f43f5e', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem'
                }}
              >
                {isPending ? "Deleting..." : "Delete Expense"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* C. Edit Deal Modal */}
      {editingDeal && (
        <div className="checkout-modal-backdrop" onClick={() => setEditingDeal(null)}>
          <div className="checkout-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px', maxHeight: 'min(720px, calc(100vh - 40px))', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>Edit Deal Specs</h3>
              <button onClick={() => setEditingDeal(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20}/></button>
            </div>
            
            <form onSubmit={handleEditDeal} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto', flexGrow: 1, minHeight: 0 }}>
              <input type="hidden" name="id" value={editingDeal.id} />
              
              <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div>Vehicle: <strong>{editingDeal.car.brand} {editingDeal.car.model}</strong> ({editingDeal.car.registrationNum})</div>
                <div>Customer: <strong>{editingDeal.customer.name}</strong></div>
              </div>

              <div className="responsive-grid-2">
                <label style={{ fontSize: '0.9rem' }}>Final Sell Price (₹)
                  <input type="number" name="finalPrice" required defaultValue={editingDeal.finalPrice} style={inputStyle} />
                </label>
                <label style={{ fontSize: '0.9rem' }}>Deal Date
                  <input type="date" name="dealDate" required defaultValue={editingDeal.dealDate ? new Date(editingDeal.dealDate).toISOString().substring(0, 10) : ""} style={inputStyle} />
                </label>
              </div>

              <label style={{ fontSize: '0.9rem' }}>Payment Status
                <select 
                  name="paymentStatus" 
                  required 
                  value={editPaymentStatus} 
                  onChange={(e) => setEditPaymentStatus(e.target.value)} 
                  style={selectStyle}
                >
                  <option value="Paid">Paid</option>
                  <option value="Partial">Partial</option>
                  <option value="Pending">Pending</option>
                </select>
              </label>

              {(editPaymentStatus === 'Partial' || editPaymentStatus === 'Paid') && (
                <div style={{ padding: '16px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '12px', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <label style={{ fontSize: '0.9rem', margin: 0 }}>Amount Received (₹)
                    <input 
                      type="number" 
                      name="receivedAmount" 
                      required 
                      defaultValue={editingDeal.advanceReceived || 0} 
                      style={inputStyle} 
                    />
                  </label>
                  
                  <div style={{ fontSize: '0.8rem', color: 'var(--primary)', borderTop: '1px dashed var(--border-light)', paddingTop: '12px', marginTop: '4px' }}>
                    Installment Payment Details (if amount is updated)
                  </div>
                  
                  <div className="responsive-grid-2">
                    <label style={{ fontSize: '0.9rem', margin: 0 }}>Payment Date
                      <input 
                        type="date" 
                        name="paymentDate" 
                        defaultValue={new Date().toISOString().substring(0, 10)} 
                        style={inputStyle} 
                      />
                    </label>
                    <label style={{ fontSize: '0.9rem', margin: 0 }}>Payment Mode
                      <select name="paymentMode" defaultValue="CASH" style={selectStyle}>
                        <option value="CASH">Cash</option>
                        <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                        <option value="BANK_TRANSFER">Bank Transfer (IMPS / NEFT)</option>
                        <option value="CHEQUE">Cheque</option>
                      </select>
                    </label>
                  </div>

                  <label style={{ fontSize: '0.9rem', margin: 0 }}>Received Into Account
                    <select name="bankAccountId" defaultValue="" style={selectStyle}>
                      <option value="" disabled>Select account...</option>
                      {bankAccounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>{acc.name} (Bal: ₹{acc.balance})</option>
                      ))}
                    </select>
                  </label>
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button type="button" onClick={() => setEditingDeal(null)} style={cancelBtnStyle}>Cancel</button>
                <button type="submit" disabled={isPending} className="btn-primary" style={{ padding: '10px 24px', fontSize: '0.9rem' }}>
                  {isPending ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* D. Delete Deal Confirmation Modal */}
      {deletingDeal && (
        <div className="checkout-modal-backdrop" onClick={() => setDeletingDeal(null)}>
          <div className="checkout-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px', padding: '24px' }}>
            <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
              <div style={{ color: '#f43f5e', background: 'rgba(244, 63, 94, 0.1)', padding: '12px', borderRadius: '50%', alignSelf: 'flex-start' }}>
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 style={{ margin: '0 0 8px 0' }}>Cancel & Delete Deal?</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.4', marginBottom: '12px' }}>
                  Are you sure you want to delete this deal for the <strong>{deletingDeal.car.brand} {deletingDeal.car.model}</strong>?
                </p>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-light)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  This will automatically:
                  <ul style={{ paddingLeft: '16px', marginTop: '6px' }}>
                    <li style={{ marginBottom: '4px' }}>Revert vehicle status to <strong>Available</strong>.</li>
                    <li>Revert customer stage to <strong>Negotiation</strong>.</li>
                  </ul>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => setDeletingDeal(null)} style={cancelBtnStyle}>Cancel</button>
              <button 
                onClick={() => handleDeleteDeal(deletingDeal.id)} 
                disabled={isPending}
                style={{
                  padding: '10px 24px', borderRadius: '99px', border: 'none', background: '#f43f5e', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem'
                }}
              >
                {isPending ? "Cancelling..." : "Cancel Deal"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* E. Printable Invoice Preview Modal */}
      {printingInvoice && (
        <div className="checkout-modal-backdrop" onClick={() => setPrintingInvoice(null)}>
          <div className="checkout-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '650px', background: 'var(--bg-surface)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>Print Preview</h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => window.print()} className="btn-primary" style={{ padding: '6px 16px', fontSize: '0.85rem' }}>Print / Save PDF</button>
                <button onClick={() => setPrintingInvoice(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20}/></button>
              </div>
            </div>
            
            <div id="printable-invoice-area" style={{ padding: '40px', background: '#ffffff', color: '#000000', fontFamily: 'sans-serif' }}>
              {/* Inline style block specifically for print overlay overrides */}
              <style dangerouslySetInnerHTML={{__html: `
                @media print {
                  body {
                    background: #ffffff !important;
                    color: #000000 !important;
                  }
                  aside, header, footer, button, .checkout-modal-backdrop > *:not(#printable-invoice-area) {
                    display: none !important;
                  }
                  .checkout-modal-backdrop {
                    position: static !important;
                    background: transparent !important;
                    backdrop-filter: none !important;
                    padding: 0 !important;
                  }
                  .checkout-modal {
                    position: static !important;
                    border: none !important;
                    box-shadow: none !important;
                    max-width: 100% !important;
                    background: #ffffff !important;
                  }
                  #printable-invoice-area {
                    display: block !important;
                    width: 100% !important;
                    padding: 0 !important;
                    margin: 0 !important;
                  }
                }
              `}} />
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
                <div>
                  {businessLogo && (
                    <img src={businessLogo} alt="Logo" style={{ maxHeight: '60px', marginBottom: '16px', borderRadius: '8px' }} />
                  )}
                  <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, textTransform: 'uppercase' }}>{businessName}</h2>
                  <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '4px' }}>Authorized Auto Consultant & Dealership</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <h1 style={{ margin: 0, fontSize: '1.2rem', color: '#333', fontWeight: 700 }}>INVOICE / RECEIPT</h1>
                  <div style={{ fontSize: '0.9rem', marginTop: '10px' }}>
                    <strong>Invoice No:</strong> AC-${printingInvoice.id.slice(0, 8).toUpperCase()}<br/>
                    <strong>Date:</strong> ${new Date(printingInvoice.dealDate).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <hr style={{ border: 'none', borderTop: '2px solid #333', marginBottom: '30px' }} />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '40px', fontSize: '0.95rem' }}>
                <div>
                  <h4 style={{ margin: '0 0 10px 0', textTransform: 'uppercase', color: '#555', borderBottom: '1px solid #ddd', paddingBottom: '4px' }}>Buyer Information</h4>
                  <strong>Name:</strong> {printingInvoice.customer.name}<br/>
                  <strong>Contact:</strong> {printingInvoice.customer.phone}
                </div>
                <div>
                  <h4 style={{ margin: '0 0 10px 0', textTransform: 'uppercase', color: '#555', borderBottom: '1px solid #ddd', paddingBottom: '4px' }}>Dealership Details</h4>
                  <strong>Dealer:</strong> {businessName}<br/>
                  <strong>Network:</strong> AutoConsult Pro
                </div>
              </div>

              <h4 style={{ margin: '0 0 12px 0', textTransform: 'uppercase', color: '#555', fontSize: '0.9rem' }}>Vehicle Specifications</h4>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '40px', fontSize: '0.95rem' }}>
                <thead>
                  <tr style={{ background: '#f5f5f5', borderBottom: '2px solid #333' }}>
                    <th style={{ padding: '10px', textAlign: 'left', fontWeight: 600 }}>Description</th>
                    <th style={{ padding: '10px', textAlign: 'left', fontWeight: 600 }}>Details</th>
                    <th style={{ padding: '10px', textAlign: 'right', fontWeight: 600 }}>Registration</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '12px 10px' }}>
                      <strong>{printingInvoice.car.year} {printingInvoice.car.brand} {printingInvoice.car.model}</strong>
                    </td>
                    <td style={{ padding: '12px 10px' }}>
                      Fuel: {printingInvoice.car.fuelType}
                    </td>
                    <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                      {printingInvoice.car.registrationNum}
                    </td>
                  </tr>
                </tbody>
              </table>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '60px' }}>
                <div style={{ width: '300px', border: '1px solid #ddd', borderRadius: '8px', padding: '20px', background: '#fafafa' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.95rem' }}>
                    <span>Settlement Price:</span>
                    <span>₹ {printingInvoice.finalPrice.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.95rem' }}>
                    <span>Tax & Duties:</span>
                    <span>Inclusive / Nil</span>
                  </div>
                  <hr style={{ border: 'none', borderTop: '1px solid #ddd', margin: '12px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.2rem' }}>
                    <span>Total Amount:</span>
                    <span>₹ {printingInvoice.finalPrice.toLocaleString()}</span>
                  </div>
                  <div style={{ textAlign: 'right', color: '#10b981', fontSize: '0.85rem', fontWeight: 'bold', marginTop: '8px', textTransform: 'uppercase' }}>
                    Payment {printingInvoice.paymentStatus}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', marginTop: '40px', fontSize: '0.9rem', textAlign: 'center' }}>
                <div>
                  <div style={{ borderBottom: '1px solid #999', height: '50px' }}></div>
                  <div style={{ marginTop: '8px', fontWeight: 600 }}>Buyer's Signature</div>
                </div>
                <div>
                  <div style={{ borderBottom: '1px solid #999', height: '50px' }}></div>
                  <div style={{ marginTop: '8px', fontWeight: 600 }}>Authorized Signatory</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
