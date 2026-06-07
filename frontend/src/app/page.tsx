"use client";

import { useState, useEffect } from "react";
import { useAuth, SignUpButton } from "@clerk/nextjs";
import Link from "next/link";
import { 
  Sparkles, 
  Car, 
  TrendingUp, 
  Users, 
  Check, 
  ChevronRight, 
  CreditCard, 
  Lock, 
  X, 
  Loader2, 
  Building,
  FileText,
  Activity
} from "lucide-react";

export default function Home() {
  const { isLoaded, userId } = useAuth();
  
  // Billing frequency
  const [isYearly, setIsYearly] = useState(false);
  
  // Selected plan for checkout modal
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  
  // Checkout Modal inputs
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"card" | "upi">("card");
  const [upiId, setUpiId] = useState("");
  
  // Checkout Processing States
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [formError, setFormError] = useState("");

  // Smooth scroll helper
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Format Card Number (adds space every 4 digits)
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 16) value = value.slice(0, 16);
    let formatted = value.match(/.{1,4}/g)?.join(" ") || value;
    setCardNumber(formatted);
  };

  // Format Expiry Date (adds '/' after 2 digits)
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 4) value = value.slice(0, 4);
    if (value.length >= 2) {
      value = value.slice(0, 2) + "/" + value.slice(2);
    }
    setCardExpiry(value);
  };

  // Format CVC (max 3 digits)
  const handleCvcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 3) value = value.slice(0, 3);
    setCardCvc(value);
  };

  // Simulate Checkout steps
  useEffect(() => {
    if (!isProcessing) return;
    
    const steps = [
      "Contacting secure payment gateway...",
      "Validating card information...",
      "Authorizing subscription amount...",
      "Provisioning secure business workspace...",
      "Success! Activating account..."
    ];

    if (processingStep < steps.length - 1) {
      const timer = setTimeout(() => {
        setProcessingStep(prev => prev + 1);
      }, 700);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        setIsProcessing(false);
        setCheckoutSuccess(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [isProcessing, processingStep]);

  // Handle Purchase Submit
  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!fullName.trim()) return setFormError("Full Name is required");
    if (!email.trim() || !email.includes("@")) return setFormError("Enter a valid email address");
    
    if (paymentMethod === "card") {
      if (cardNumber.replace(/\s/g, "").length !== 16) return setFormError("Card number must be 16 digits");
      if (cardExpiry.length !== 5) return setFormError("Enter expiry date in MM/YY format");
      if (cardCvc.length !== 3) return setFormError("CVC must be 3 digits");
    } else {
      if (!upiId.trim() || !upiId.includes("@")) return setFormError("Enter a valid UPI ID (e.g. name@upi)");
    }

    setIsProcessing(true);
    setProcessingStep(0);
  };

  // Open checkout modal
  const openCheckout = (planName: string) => {
    setSelectedPlan(planName);
    setFormError("");
    setCheckoutSuccess(false);
    setIsProcessing(false);
    setProcessingStep(0);
  };

  // Close modal and reset
  const closeCheckout = () => {
    if (isProcessing) return; // Prevent closing while paying
    setSelectedPlan(null);
    setFullName("");
    setEmail("");
    setCardNumber("");
    setCardExpiry("");
    setCardCvc("");
    setPaymentMethod("card");
    setUpiId("");
    setFormError("");
  };

  const getPlanPrice = (planName: string) => {
    if (planName === "Starter") return isYearly ? "₹14,990" : "₹1,499";
    if (planName === "Pro") return isYearly ? "₹39,990" : "₹3,999";
    return isYearly ? "₹99,990" : "₹9,999";
  };

  return (
    <div style={{ minHeight: "100vh", position: "relative", overflowX: "hidden" }}>
      
      {/* Navigation Header */}
      <header className="marketing-header">
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Building size={28} color="var(--primary)" />
          <span style={{ fontSize: "1.3rem", fontWeight: 800, letterSpacing: "-0.5px" }}>
            AutoConsult <span style={{ color: "var(--primary)" }}>Pro</span>
          </span>
        </div>
        
        <nav className="marketing-nav">
          <button onClick={() => scrollToSection("features")} className="marketing-nav-link" style={{ background: "none", border: "none", cursor: "pointer" }}>Features</button>
          <button onClick={() => scrollToSection("pricing")} className="marketing-nav-link" style={{ background: "none", border: "none", cursor: "pointer" }}>Pricing</button>
          {isLoaded && userId ? (
            <Link href="/dashboard/inventory" className="btn-primary" style={{ padding: "8px 20px", fontSize: "0.9rem" }}>
              Go to Dashboard
            </Link>
          ) : (
            <SignUpButton mode="modal" forceRedirectUrl="/onboarding">
              <button className="btn-primary" style={{ padding: "8px 20px", fontSize: "0.9rem" }}>Get Started</button>
            </SignUpButton>
          )}
        </nav>
      </header>

      {/* Hero Section */}
      <section className="marketing-hero">
        <div className="marketing-badge">
          <Sparkles size={14} /> Next-Gen Dealership & Agency Intelligence
        </div>
        <h1 style={{ fontSize: "3.8rem", fontWeight: 800, lineHeight: 1.15, marginBottom: "20px", letterSpacing: "-1px" }}>
          Scale Your Auto Consultancy <br />
          With <span style={{ color: "var(--primary)", background: "linear-gradient(135deg, #06b6d4 0%, #10b981 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Absolute Clarity</span>
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "1.25rem", maxWidth: "720px", margin: "0 auto 40px", lineHeight: 1.6 }}>
          The premium workspace engineered for independent auto consultants and dealerships. Manage live vehicle catalogs, generate customer lead pipelines, automate complex profit sheets, and secure corporate documents.
        </p>
        <div style={{ display: "flex", gap: "16px", justifyContent: "center" }}>
          <button onClick={() => scrollToSection("pricing")} className="btn-primary" style={{ padding: "16px 36px", fontSize: "1.1rem", display: "flex", alignItems: "center", gap: "8px" }}>
            Explore Plans <ChevronRight size={18} />
          </button>
          <button 
            onClick={() => scrollToSection("features")} 
            className="btn-primary" 
            style={{ 
              padding: "16px 36px", 
              fontSize: "1.1rem", 
              background: "rgba(255, 255, 255, 0.05)", 
              border: "1px solid var(--border-light)", 
              color: "var(--text-main)", 
              boxShadow: "none" 
            }}
          >
            See Functionalities
          </button>
        </div>
      </section>

      {/* Features Showcase Section */}
      <section id="features" className="container" style={{ padding: "80px 20px" }}>
        <div style={{ textAlign: "center", marginBottom: "60px" }}>
          <h2 style={{ fontSize: "2.4rem", fontWeight: 800, marginBottom: "12px" }}>Built to Power Auto Consultancies</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "1.1rem" }}>A unified platform replacement for spreadsheets, message logs, and physical paperwork.</p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <Car size={24} />
            </div>
            <h3 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: "12px" }}>Inventory Control Center</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", lineHeight: 1.5 }}>
              Track vehicles with precise status badges (Available, Under Review, Sold). Store expected and actual purchase margins, fuel specs, odometer records, and media catalogs.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <Activity size={24} />
            </div>
            <h3 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: "12px" }}>Smart Lead Pipelines</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", lineHeight: 1.5 }}>
              Collect buyer requirements including budget constraints, brand choices, and loan settings. Match leads to your garage automatically and log next-visit calendars.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <TrendingUp size={24} />
            </div>
            <h3 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: "12px" }}>Financial Ledger Hub</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", lineHeight: 1.5 }}>
              Manage car-specific repair expenses and dynamic dealer fees. Access a central business command dashboard that computes instant net profits and transaction logs.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <Users size={24} />
            </div>
            <h3 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: "12px" }}>Roster & Permissions</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", lineHeight: 1.5 }}>
              Add partners to your dealership roster. Control team access levels (Read-Write vs. View-Only permissions) and securely serve transaction files from a locked backend.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Table Section */}
      <section id="pricing" className="container" style={{ padding: "80px 20px" }}>
        <div style={{ textAlign: "center" }}>
          <h2 style={{ fontSize: "2.4rem", fontWeight: 800, marginBottom: "12px" }}>Flexible Plans for Growing Agencies</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "1.1rem" }}>Select the tier that matches your dealership size. Cancel or switch subscription terms anytime.</p>
          
          {/* Monthly / Yearly Billing Toggle */}
          <div className="pricing-toggle-container">
            <span style={{ fontSize: "0.95rem", fontWeight: 600, color: !isYearly ? "var(--text-main)" : "var(--text-muted)" }}>Monthly Billing</span>
            <button 
              onClick={() => setIsYearly(!isYearly)} 
              className={`pricing-toggle-button ${isYearly ? "active" : ""}`}
              aria-label="Toggle annual pricing"
            >
              <div className="pricing-toggle-circle" />
            </button>
            <span style={{ fontSize: "0.95rem", fontWeight: 600, color: isYearly ? "var(--text-main)" : "var(--text-muted)", display: "flex", alignItems: "center", gap: "8px" }}>
              Yearly Billing
              <span style={{ background: "rgba(16, 185, 129, 0.15)", color: "var(--secondary)", padding: "2px 8px", borderRadius: "99px", fontSize: "0.75rem", fontWeight: 700 }}>Save 20%</span>
            </span>
          </div>
        </div>

        <div className="pricing-grid">
          {/* Starter Plan */}
          <div className="pricing-card">
            <h3 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: "8px" }}>Starter Plan</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "24px" }}>Essential inventory and transaction tracking for individual agents.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginBottom: "28px" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                <span style={{ fontSize: "2.6rem", fontWeight: 800 }}>{getPlanPrice("Starter")}</span>
                <span style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>{isYearly ? "/ year" : "/ month"}</span>
              </div>
              {isYearly ? (
                <span style={{ color: "var(--secondary)", fontSize: "0.85rem", fontWeight: 600 }}>
                  Equivalent to ₹1,249/month, billed annually
                </span>
              ) : (
                <span style={{ height: "1.2rem", display: "block" }} />
              )}
            </div>
            <button onClick={() => openCheckout("Starter")} className="btn-primary" style={{ width: "100%", padding: "12px", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-light)", color: "var(--text-main)", boxShadow: "none" }}>
              Subscribe Starter
            </button>
            <ul className="pricing-features-list">
              <li className="pricing-feature-item"><Check size={16} /> <span>Up to 15 Active Cars</span></li>
              <li className="pricing-feature-item"><Check size={16} /> <span>1 Partner seat</span></li>
              <li className="pricing-feature-item"><Check size={16} /> <span>Basic inventory tracking</span></li>
              <li className="pricing-feature-item"><Check size={16} /> <span>Expense & Sale ledger</span></li>
            </ul>
          </div>

          {/* Pro Plan */}
          <div className="pricing-card pricing-card-popular">
            <h3 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: "8px" }}>Professional Plan</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "24px" }}>Standard package for expanding consultancies and active yards.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginBottom: "28px" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                <span style={{ fontSize: "2.6rem", fontWeight: 800 }}>{getPlanPrice("Pro")}</span>
                <span style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>{isYearly ? "/ year" : "/ month"}</span>
              </div>
              {isYearly ? (
                <span style={{ color: "var(--secondary)", fontSize: "0.85rem", fontWeight: 600 }}>
                  Equivalent to ₹3,332/month, billed annually
                </span>
              ) : (
                <span style={{ height: "1.2rem", display: "block" }} />
              )}
            </div>
            <button onClick={() => openCheckout("Pro")} className="btn-primary" style={{ width: "100%", padding: "12px" }}>
              Subscribe Professional
            </button>
            <ul className="pricing-features-list">
              <li className="pricing-feature-item"><Check size={16} /> <span><strong>Unlimited</strong> Active Cars</span></li>
              <li className="pricing-feature-item"><Check size={16} /> <span>Up to 5 Partner seats</span></li>
              <li className="pricing-feature-item"><Check size={16} /> <span>Advanced CRM preference match</span></li>
              <li className="pricing-feature-item"><Check size={16} /> <span>Secure File upload & vaults</span></li>
              <li className="pricing-feature-item"><Check size={16} /> <span>Real-time permission roles</span></li>
            </ul>
          </div>

          {/* Enterprise Plan */}
          <div className="pricing-card">
            <h3 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: "8px" }}>Enterprise Plan</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "24px" }}>Custom configurations for multi-branch dealerships.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginBottom: "28px" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                <span style={{ fontSize: "2.6rem", fontWeight: 800 }}>{getPlanPrice("Enterprise")}</span>
                <span style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>{isYearly ? "/ year" : "/ month"}</span>
              </div>
              {isYearly ? (
                <span style={{ color: "var(--secondary)", fontSize: "0.85rem", fontWeight: 600 }}>
                  Equivalent to ₹8,332/month, billed annually
                </span>
              ) : (
                <span style={{ height: "1.2rem", display: "block" }} />
              )}
            </div>
            <button onClick={() => openCheckout("Enterprise")} className="btn-primary" style={{ width: "100%", padding: "12px", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-light)", color: "var(--text-main)", boxShadow: "none" }}>
              Subscribe Enterprise
            </button>
            <ul className="pricing-features-list">
              <li className="pricing-feature-item"><Check size={16} /> <span><strong>Unlimited</strong> Active Cars</span></li>
              <li className="pricing-feature-item"><Check size={16} /> <span><strong>Unlimited</strong> Partner seats</span></li>
              <li className="pricing-feature-item"><Check size={16} /> <span>Priority server performance</span></li>
              <li className="pricing-feature-item"><Check size={16} /> <span>Dedicated account strategist</span></li>
              <li className="pricing-feature-item"><Check size={16} /> <span>Custom portal branding</span></li>
            </ul>
          </div>
        </div>
      </section>

      {/* Simulated Stripe Checkout Modal */}
      {selectedPlan && (
        <div className="checkout-modal-backdrop" onClick={closeCheckout}>
          <div className="checkout-modal animate-fade-in" onClick={(e) => e.stopPropagation()} style={{ animation: "0.2s ease-out" }}>
            
            {/* Modal Header */}
            <div style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.08)", padding: "24px 32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "1px", color: "var(--primary)", fontWeight: 700 }}>Stripe Secure Payment</span>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#fff", marginTop: "4px" }}>Subscribe to {selectedPlan}</h3>
              </div>
              <button onClick={closeCheckout} disabled={isProcessing} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            {!checkoutSuccess ? (
              <form onSubmit={handleCheckoutSubmit} style={{ padding: "32px" }}>
                
                {/* Plan Pricing Summary */}
                <div style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid var(--border-light)", borderRadius: "12px", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                  <div>
                    <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Total Due Now:</span>
                    <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#fff" }}>
                      {getPlanPrice(selectedPlan)}<span style={{ fontSize: "0.85rem", fontWeight: 500, color: "var(--text-muted)" }}>{isYearly ? " / year" : " / month"}</span>
                    </div>
                  </div>
                  <span style={{ background: "rgba(6, 182, 212, 0.15)", color: "var(--primary)", fontSize: "0.8rem", padding: "4px 10px", borderRadius: "6px", fontWeight: 700 }}>
                    {isYearly ? "Annual Plan (20% Off)" : "Monthly Plan"}
                  </span>
                </div>

                {formError && (
                  <div style={{ background: "rgba(244, 63, 94, 0.1)", border: "1px solid rgba(244, 63, 94, 0.3)", borderRadius: "8px", padding: "10px 14px", color: "#f43f5e", fontSize: "0.85rem", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <span>⚠️</span> {formError}
                  </div>
                )}

                {/* Payment Method Selector */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
                  <button 
                    type="button" 
                    onClick={() => setPaymentMethod("card")} 
                    style={{
                      padding: "10px",
                      borderRadius: "8px",
                      border: "1px solid " + (paymentMethod === "card" ? "var(--primary)" : "var(--border-light)"),
                      background: paymentMethod === "card" ? "rgba(6, 182, 212, 0.1)" : "rgba(255,255,255,0.02)",
                      color: paymentMethod === "card" ? "#fff" : "var(--text-muted)",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    💳 Card (Credit/Debit)
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setPaymentMethod("upi")} 
                    style={{
                      padding: "10px",
                      borderRadius: "8px",
                      border: "1px solid " + (paymentMethod === "upi" ? "var(--primary)" : "var(--border-light)"),
                      background: paymentMethod === "upi" ? "rgba(6, 182, 212, 0.1)" : "rgba(255,255,255,0.02)",
                      color: paymentMethod === "upi" ? "#fff" : "var(--text-muted)",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    📱 UPI Payment
                  </button>
                </div>

                {/* Form Fields */}
                <div className="checkout-input-group">
                  <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600 }}>PAYER NAME</label>
                  <input 
                    type="text" 
                    className="checkout-input" 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Bhavy Patel"
                    disabled={isProcessing}
                    style={{ marginTop: "6px" }}
                  />
                </div>

                <div className="checkout-input-group">
                  <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600 }}>EMAIL ADDRESS</label>
                  <input 
                    type="email" 
                    className="checkout-input" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="bhavy@example.com"
                    disabled={isProcessing}
                    style={{ marginTop: "6px" }}
                  />
                </div>

                {paymentMethod === "card" ? (
                  <>
                    <div className="checkout-input-group">
                      <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600 }}>CARD NUMBER</label>
                      <div style={{ position: "relative" }}>
                        <input 
                          type="text" 
                          className="checkout-input" 
                          value={cardNumber}
                          onChange={handleCardNumberChange}
                          placeholder="4242 4242 4242 4242"
                          disabled={isProcessing}
                          style={{ marginTop: "6px", paddingLeft: "42px" }}
                        />
                        <CreditCard size={18} style={{ position: "absolute", left: "14px", top: "18px", color: "var(--text-muted)" }} />
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "32px" }}>
                      <div>
                        <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600 }}>EXPIRATION DATE</label>
                        <input 
                          type="text" 
                          className="checkout-input" 
                          value={cardExpiry}
                          onChange={handleExpiryChange}
                          placeholder="MM/YY"
                          disabled={isProcessing}
                          style={{ marginTop: "6px" }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600 }}>CVC CODE</label>
                        <input 
                          type="text" 
                          className="checkout-input" 
                          value={cardCvc}
                          onChange={handleCvcChange}
                          placeholder="123"
                          disabled={isProcessing}
                          style={{ marginTop: "6px" }}
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="checkout-input-group">
                      <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600 }}>UPI ID / VPA</label>
                      <input 
                        type="text" 
                        className="checkout-input" 
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="e.g. bhavy@upi"
                        disabled={isProcessing}
                        style={{ marginTop: "6px" }}
                      />
                    </div>
                    
                    <div style={{ textAlign: "center", margin: "20px 0 32px", padding: "16px", background: "rgba(255,255,255,0.02)", border: "1px dashed var(--border-light)", borderRadius: "12px" }}>
                      <div style={{ width: "110px", height: "110px", background: "#fff", margin: "0 auto 12px", padding: "8px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: "2px", width: "100%", height: "100%" }}>
                          {Array.from({ length: 64 }).map((_, i) => (
                            <div key={i} style={{ background: (Math.random() > 0.4 || i % 7 === 0 || i % 9 === 0) && !(i > 20 && i < 28) && !(i > 35 && i < 44) ? "#000" : "#fff" }} />
                          ))}
                        </div>
                      </div>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Scan QR using any UPI app (GPay, PhonePe, Paytm, BHIM) to complete checkout</span>
                    </div>
                  </>
                )}

                {isProcessing ? (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", padding: "12px 0" }}>
                    <Loader2 className="animate-spin" size={28} color="var(--primary)" />
                    <span style={{ fontSize: "0.9rem", color: "#fff", fontWeight: 500 }}>
                      {["Contacting secure payment gateway...", "Validating card information...", "Authorizing subscription amount...", "Provisioning secure business workspace...", "Success! Activating account..."][processingStep]}
                    </span>
                  </div>
                ) : (
                  <button type="submit" className="btn-primary" style={{ width: "100%", padding: "14px", fontSize: "1rem", display: "flex", gap: "8px", justifyContent: "center", alignItems: "center" }}>
                    <Lock size={16} /> Complete Checkout
                  </button>
                )}

                <div style={{ textAlign: "center", marginTop: "16px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  <span>🔒 PCI-DSS Compliant 256-bit SSL Encryption</span>
                </div>

              </form>
            ) : (
              // Checkout Success screen
              <div style={{ padding: "32px", display: "flex", flexDirection: "column", alignItems: "center" }}>
                
                {/* Success Animated Check */}
                <div style={{ 
                  width: "56px", 
                  height: "56px", 
                  borderRadius: "50%", 
                  background: "rgba(16, 185, 129, 0.1)", 
                  border: "2px solid var(--secondary)", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center",
                  marginBottom: "16px",
                  color: "var(--secondary)"
                }}>
                  <Check size={28} strokeWidth={3} />
                </div>

                <h3 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#fff", marginBottom: "4px" }}>Payment Successful!</h3>
                <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "20px", textAlign: "center" }}>
                  A proper receipt has been emailed to <strong style={{ color: "#fff" }}>{email}</strong>
                </p>

                {/* Receipt Box */}
                <div style={{ 
                  width: "100%", 
                  background: "rgba(255, 255, 255, 0.02)", 
                  border: "1px solid var(--border-light)", 
                  borderRadius: "12px", 
                  padding: "20px 24px",
                  marginBottom: "24px",
                  textAlign: "left",
                  fontSize: "0.85rem",
                  fontFamily: "monospace"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed var(--border-light)", paddingBottom: "12px", marginBottom: "12px" }}>
                    <span style={{ fontWeight: 700, color: "var(--primary)" }}>AUTOCONSULT PRO</span>
                    <span style={{ color: "#10b981", fontWeight: 700 }}>PAID RECEIPT</span>
                  </div>
                  
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ color: "var(--text-muted)" }}>Invoice No:</span>
                    <span style={{ color: "#fff" }}>ACP-{Math.floor(100000 + Math.random() * 900000)}</span>
                  </div>
                  
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ color: "var(--text-muted)" }}>Date:</span>
                    <span style={{ color: "#fff" }}>{new Date().toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ color: "var(--text-muted)" }}>Customer:</span>
                    <span style={{ color: "#fff" }}>{fullName}</span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ color: "var(--text-muted)" }}>Plan:</span>
                    <span style={{ color: "#fff" }}>{selectedPlan} Plan ({isYearly ? "Annual" : "Monthly"})</span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", borderBottom: "1px dashed var(--border-light)", paddingBottom: "12px" }}>
                    <span style={{ color: "var(--text-muted)" }}>Payment Mode:</span>
                    <span style={{ color: "#fff" }}>
                      {paymentMethod === "card" ? `Card (•••• ${cardNumber.slice(-4) || "4242"})` : `UPI ID (${upiId})`}
                    </span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.05rem", fontWeight: 700 }}>
                    <span style={{ color: "#fff" }}>Total Paid:</span>
                    <span style={{ color: "var(--secondary)" }}>{getPlanPrice(selectedPlan)}</span>
                  </div>
                </div>

                {/* Print/Download Button */}
                <button 
                  onClick={() => window.print()} 
                  className="btn-primary" 
                  style={{ 
                    width: "100%", 
                    padding: "12px", 
                    fontSize: "0.9rem", 
                    background: "rgba(255,255,255,0.05)", 
                    border: "1px solid var(--border-light)", 
                    color: "var(--text-main)", 
                    boxShadow: "none",
                    marginBottom: "16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px"
                  }}
                >
                  🖨️ Print or Save Receipt
                </button>

                {userId ? (
                  // User already signed in, proceed to onboarding
                  <button 
                    onClick={() => window.location.href = `/onboarding?plan=${selectedPlan}`} 
                    className="btn-primary" 
                    style={{ width: "100%", padding: "14px", fontSize: "1rem" }}
                  >
                    Proceed to Onboarding
                  </button>
                ) : (
                  // User needs to sign up
                  <SignUpButton mode="modal" forceRedirectUrl={`/onboarding?plan=${selectedPlan}`}>
                    <button className="btn-primary" style={{ width: "100%", padding: "14px", fontSize: "1rem" }}>
                      Create Secure Account
                    </button>
                  </SignUpButton>
                )}
              </div>
            )}

          </div>
        </div>
      )}

      {/* Footer */}
      <footer style={{ borderTop: "1px solid var(--border-light)", padding: "40px 20px", background: "rgba(0,0,0,0.2)" }}>
        <div className="container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Building size={20} color="var(--primary)" />
            <span style={{ fontSize: "1rem", fontWeight: 700 }}>AutoConsult Pro Platform</span>
          </div>
          <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
            © {new Date().getFullYear()} AutoConsult Pro. All rights reserved. Secure Cloud Hosting.
          </span>
        </div>
      </footer>

    </div>
  );
}
