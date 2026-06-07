"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createBusiness } from "@/actions/business";
import { Plus, Trash2, Building, Users, Star, ArrowRight, Upload, Loader2, Image as ImageIcon } from "lucide-react";
import { SignOutButton } from "@clerk/nextjs";
import AutoLoader from "@/components/AutoLoader";
import { compressImage } from "@/lib/image";

const inputStyle = {
  width: "100%",
  padding: "12px 16px",
  borderRadius: "12px",
  background: "rgba(255, 255, 255, 0.05)",
  border: "1px solid var(--border-light)",
  color: "var(--text-main)",
  marginTop: "8px",
  outline: "none",
};

function OnboardingWizardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan") || "Trial";

  const [loading, setLoading] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  
  // Dynamic partners listing
  const [partners, setPartners] = useState<Array<{ name: string; email: string; role: string }>>([
    { name: "", email: "", role: "PARTNER_EDIT" }
  ]);

  const handleAddPartnerRow = () => {
    setPartners([...partners, { name: "", email: "", role: "PARTNER_EDIT" }]);
  };

  const handleRemovePartnerRow = (index: number) => {
    const updated = partners.filter((_, idx) => idx !== index);
    setPartners(updated);
  };

  const handlePartnerChange = (index: number, field: string, value: string) => {
    const updated = [...partners];
    (updated[index] as any)[field] = value;
    setPartners(updated);
  };

  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    try {
      const compressedBase64 = await compressImage(file, 800, 800, 0.75);
      setLogoUrl(compressedBase64);
    } catch (err: any) {
      alert(err.message || "Failed to compress logo");
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName) return alert("Business name is required!");

    setLoading(true);
    try {
      // Filter out any blank partner entries
      const validPartners = partners.filter(p => p.name.trim() && p.email.trim());
      const res = await createBusiness({
        name: businessName,
        logoUrl: logoUrl || undefined,
        plan: plan,
        partners: validPartners,
      });
      if (res?.success) {
        window.location.href = "/dashboard/inventory";
      } else {
        throw new Error("Failed to initialize business");
      }
    } catch (err: any) {
      alert(err.message || "Failed to create business");
      setLoading(false);
    }
  };

  const handleLaunchDemo = async () => {
    setLoading(true);
    try {
      const res = await createBusiness({
        name: "AutoConsult Pro (Demo)",
        logoUrl: undefined,
        plan: plan,
        partners: [],
      });
      if (res?.success) {
        window.location.href = "/dashboard/inventory";
      } else {
        throw new Error("Failed to initialize demo business");
      }
    } catch (err: any) {
      alert(err.message || "Failed to create demo business");
      setLoading(false);
    }
  };

  return (
    <main className="container" style={{ padding: "80px 20px", display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
      {/* Top-Right Sign Out Button */}
      <div className="onboarding-signout-container">
        <SignOutButton redirectUrl="/">
          <button className="onboarding-signout-btn">
            Sign Out
          </button>
        </SignOutButton>
      </div>

      <div style={{ textAlign: "center", marginBottom: "40px" }}>
        <h1 style={{ fontSize: "2.8rem", marginBottom: "12px", fontWeight: 800 }}>
          Launch Your <span style={{ color: "var(--primary)" }}>Dealership SaaS</span>
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "1.1rem", maxWidth: "600px" }}>
          Establish your business, add branding, and invite your consultancy partners to start tracking deals in real time.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ maxWidth: "680px", width: "100%", display: "flex", flexDirection: "column", gap: "28px" }}>
        
        {/* Selected Plan Highlight Banner */}
        <div className="glass-card" style={{ 
          background: "linear-gradient(135deg, rgba(6, 182, 212, 0.08) 0%, rgba(16, 185, 129, 0.08) 100%)",
          border: "1px solid rgba(6, 182, 212, 0.25)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px 24px"
        }}>
          <div>
            <div style={{ fontSize: "0.75rem", color: "var(--primary)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px" }}>Selected Plan</div>
            <h4 style={{ fontSize: "1.1rem", fontWeight: 700, margin: "4px 0 0 0", color: "#fff" }}>
              {plan === "Starter" ? "Starter Plan" : plan === "Pro" ? "Professional Plan" : plan === "Enterprise" ? "Enterprise Plan" : "Free Trial Plan"}
            </h4>
          </div>
          <span style={{ 
            background: "linear-gradient(135deg, #06b6d4 0%, #10b981 100%)",
            color: "#080c14",
            padding: "6px 14px",
            borderRadius: "999px",
            fontSize: "0.85rem",
            fontWeight: 800
          }}>
            {plan === "Starter" ? "₹1,499 / mo" : plan === "Pro" ? "₹3,999 / mo" : plan === "Enterprise" ? "₹9,999 / mo" : "Free Trial"}
          </span>
        </div>
        
        {/* Step 1: Branding */}
        <div className="glass-card">
          <h3 style={{ borderBottom: "1px solid var(--border-light)", paddingBottom: "16px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
            <Building size={20} color="var(--primary)" /> Business Profile
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <label style={{ fontWeight: 600 }}>
              Dealership / Business Name *
              <input 
                type="text" 
                required 
                value={businessName} 
                onChange={(e) => setBusinessName(e.target.value)} 
                style={inputStyle} 
                placeholder="e.g. Apex Auto Consult" 
              />
            </label>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <span style={{ fontWeight: 600, fontSize: "0.95rem" }}>Business Logo (Optional)</span>
              <div style={{ display: "flex", alignItems: "center", gap: "24px", marginTop: "8px" }}>
                {/* Logo Preview */}
                <div 
                  style={{ 
                    position: "relative",
                    width: "80px", 
                    height: "80px", 
                    borderRadius: "16px", 
                    background: "rgba(255, 255, 255, 0.03)", 
                    border: "2px dashed var(--border-light)", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center",
                    overflow: "hidden"
                  }}
                >
                  {uploadingLogo ? (
                    <Loader2 className="animate-spin" size={24} color="var(--primary)" />
                  ) : logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                      src={logoUrl} 
                      alt="Logo Preview" 
                      style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                    />
                  ) : (
                    <ImageIcon size={28} style={{ opacity: 0.3 }} />
                  )}
                </div>

                {/* Upload Actions */}
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
                  <div style={{ display: "flex", gap: "12px" }}>
                    <label 
                      htmlFor="logo-file-input" 
                      className="btn-primary" 
                      style={{ 
                        padding: "8px 16px", 
                        fontSize: "0.85rem", 
                        cursor: "pointer", 
                        display: "flex", 
                        alignItems: "center", 
                        gap: "6px",
                        background: "rgba(255, 255, 255, 0.05)",
                        border: "1px solid var(--border-light)",
                        color: "var(--text-main)",
                        boxShadow: "none",
                      }}
                    >
                      <Upload size={14} />
                      Select Logo File
                    </label>
                    <input 
                      id="logo-file-input"
                      type="file" 
                      accept="image/*" 
                      onChange={handleLogoFileChange} 
                      style={{ display: "none" }} 
                      disabled={uploadingLogo}
                    />

                    {logoUrl && (
                      <button 
                        type="button" 
                        onClick={() => setLogoUrl("")}
                        className="btn-primary"
                        style={{ 
                          padding: "8px 16px", 
                          fontSize: "0.85rem", 
                          background: "rgba(244, 63, 94, 0.1)", 
                          color: "#f43f5e", 
                          boxShadow: "none", 
                          border: "none" 
                        }}
                      >
                        <Trash2 size={14} style={{ marginRight: 6 }} />
                        Remove
                      </button>
                    )}
                  </div>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    Select an image from your device. Max size 5MB.
                  </span>
                </div>
              </div>
              
              <details style={{ marginTop: "12px" }}>
                <summary style={{ fontSize: "0.8rem", color: "var(--text-muted)", cursor: "pointer", userSelect: "none" }}>
                  Or paste a logo URL instead
                </summary>
                <input 
                  type="text" 
                  value={logoUrl} 
                  onChange={(e) => setLogoUrl(e.target.value)} 
                  style={{ ...inputStyle, marginTop: "8px", fontSize: "0.85rem" }} 
                  placeholder="e.g. https://yourdomain.com/logo.png" 
                />
              </details>
            </div>
          </div>
        </div>

        {/* Step 2: Partners Setup */}
        <div className="glass-card">
          <h3 style={{ borderBottom: "1px solid var(--border-light)", paddingBottom: "16px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
            <Users size={20} color="var(--secondary)" /> Partner Roster (Invite Team)
          </h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "20px" }}>
            Enter partner emails. They can sign in to view and edit data according to the selected permission tier.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {partners.map((partner, idx) => (
              <div key={idx} className="partner-input-row">
                <label style={{ fontSize: "0.85rem", fontWeight: 600 }}>
                  Partner Name
                  <input 
                    type="text" 
                    value={partner.name} 
                    onChange={(e) => handlePartnerChange(idx, "name", e.target.value)} 
                    style={{ ...inputStyle, marginTop: "6px" }} 
                    placeholder="Name" 
                  />
                </label>
                <label style={{ fontSize: "0.85rem", fontWeight: 600 }}>
                  Email Address
                  <input 
                    type="email" 
                    value={partner.email} 
                    onChange={(e) => handlePartnerChange(idx, "email", e.target.value)} 
                    style={{ ...inputStyle, marginTop: "6px" }} 
                    placeholder="partner@email.com" 
                  />
                </label>
                <label style={{ fontSize: "0.85rem", fontWeight: 600 }}>
                  Permissions
                  <select 
                    value={partner.role} 
                    onChange={(e) => handlePartnerChange(idx, "role", e.target.value)} 
                    style={{ ...inputStyle, marginTop: "6px", WebkitAppearance: "none" }}
                  >
                    <option value="PARTNER_EDIT">Read-Write</option>
                    <option value="PARTNER_VIEW">View-Only</option>
                  </select>
                </label>
                
                {partners.length > 1 && (
                  <button 
                    type="button" 
                    onClick={() => handleRemovePartnerRow(idx)} 
                    className="btn-primary" 
                    style={{ padding: "12px", background: "rgba(244, 63, 94, 0.1)", color: "#f43f5e", boxShadow: "none", border: "none" }}
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <button 
            type="button" 
            onClick={handleAddPartnerRow} 
            className="btn-primary" 
            style={{ marginTop: "20px", display: "flex", gap: "8px", alignItems: "center", background: "rgba(255,255,255,0.04)", border: "1px dashed var(--border-light)", color: "var(--text-main)", boxShadow: "none", width: "100%" }}
          >
            <Plus size={16} /> Add Partner Profile
          </button>
        </div>

        <button 
          type="submit" 
          disabled={loading || uploadingLogo} 
          className="btn-primary" 
          style={{ width: "100%", padding: "16px", fontSize: "1.1rem", display: "flex", gap: "8px", justifyContent: "center", alignItems: "center" }}
        >
          {loading ? "Spinning Engine..." : (
            <>
              Launch Dealership Engine <ArrowRight size={18} />
            </>
          )}
        </button>

        <div style={{ textAlign: "center", marginTop: "8px" }}>
          <button
            type="button"
            onClick={handleLaunchDemo}
            disabled={loading || uploadingLogo}
            style={{
              background: "none",
              border: "none",
              color: "var(--primary)",
              cursor: "pointer",
              fontSize: "0.95rem",
              textDecoration: "underline",
              fontWeight: 500,
              padding: "8px 16px"
            }}
          >
            Launch with a Demo Business (Quick Start)
          </button>
        </div>

      </form>

      {loading && <AutoLoader fullscreen={true} message="Tuning business configurations and starting engine..." />}
      {uploadingLogo && <AutoLoader fullscreen={true} message="Uploading logo to server garage..." />}
    </main>
  );
}

export default function OnboardingWizard() {
  return (
    <Suspense fallback={<AutoLoader fullscreen={true} message="Initializing onboarding portal..." />}>
      <OnboardingWizardContent />
    </Suspense>
  );
}
