"use client";

import { updateBusinessBranding, addBusinessPartner, removeBusinessPartner, updatePartnerRole, deleteActiveBusiness } from "@/actions/business";
import { useState, useTransition } from "react";
import { Building, Users, Shield, Trash2, Plus, RefreshCw, Upload, Loader2, Image as ImageIcon } from "lucide-react";
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

export default function SettingsClient({ business, currentMember }: { business: any; currentMember: any }) {
  const isOwner = currentMember.role === "OWNER";
  const [isPending, startTransition] = useTransition();
  const [brandingMsg, setBrandingMsg] = useState("");
  const [partnerMsg, setPartnerMsg] = useState("");
  const [logoUrl, setLogoUrl] = useState(business.logo || "");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [loadingBranding, setLoadingBranding] = useState(false);
  const [loadingPartner, setLoadingPartner] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);

  const handleDeleteBusiness = async () => {
    if (!isOwner) return;
    const confirmName = prompt(
      `WARNING: This will permanently delete the business "${business.name}" and ALL its data.\n\nTo confirm, please type the business name exactly:`
    );
    
    if (confirmName !== business.name) {
      if (confirmName !== null) {
        alert("Verification name did not match. Deletion cancelled.");
      }
      return;
    }

    setLoadingDelete(true);
    try {
      await deleteActiveBusiness();
    } catch (err: any) {
      alert(err.message || "Failed to delete business");
      setLoadingDelete(false);
    }
  };

  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    setBrandingMsg("");
    try {
      const compressedBase64 = await compressImage(file, 800, 800, 0.75);
      setLogoUrl(compressedBase64);
    } catch (err: any) {
      alert(err.message || "Failed to compress logo");
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleBrandingSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isOwner) return;
    setLoadingBranding(true);
    setBrandingMsg("Saving...");
    const formData = new FormData(e.currentTarget);
    try {
      const res = await updateBusinessBranding(formData);
      if (res && res.success) {
        setBrandingMsg("Branding updated successfully!");
      } else {
        setBrandingMsg(`Error: ${res?.error || "Failed to update branding"}`);
      }
    } catch (err: any) {
      setBrandingMsg(`Error: ${err.message}`);
    } finally {
      setLoadingBranding(false);
    }
  };

  const handleAddPartner = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isOwner) return;
    setLoadingPartner(true);
    setPartnerMsg("Adding partner...");
    const formData = new FormData(e.currentTarget);
    try {
      await addBusinessPartner(formData);
      setPartnerMsg("Partner invited successfully!");
      e.currentTarget.reset();
    } catch (err: any) {
      setPartnerMsg(`Error: ${err.message}`);
    } finally {
      setLoadingPartner(false);
    }
  };

  const handleRoleChange = (memberId: string, newRole: string) => {
    if (!isOwner) return;
    if (newRole === "OWNER") {
      const confirmTransfer = confirm(
        "WARNING: Transferring ownership will make this partner the new business owner. You will be downgraded to Read-Write access. Are you sure you want to proceed?"
      );
      if (!confirmTransfer) {
        window.location.reload();
        return;
      }
    }
    startTransition(async () => {
      try {
        await updatePartnerRole(memberId, newRole);
      } catch (err: any) {
        alert(err.message);
        window.location.reload();
      }
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px", paddingBottom: "64px" }}>
      <div>
        <h2>Business Settings</h2>
        <p style={{ color: "var(--text-muted)" }}>Control dynamic branding, partner lists, and permission access tiers.</p>
      </div>

      <div className="responsive-grid-2">
        
        {/* Dealership Branding Panel */}
        <div className="glass-card" style={{ height: "fit-content" }}>
          <h3 style={{ borderBottom: "1px solid var(--border-light)", paddingBottom: "16px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
            <Building size={20} color="var(--primary)" /> Branding Profile
          </h3>
          
          <form onSubmit={handleBrandingSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <label style={{ fontWeight: 600 }}>
              Business / Dealership Name
              <input 
                type="text" 
                name="name" 
                required 
                disabled={!isOwner}
                defaultValue={business.name} 
                style={inputStyle} 
              />
            </label>
            
            <input type="hidden" name="logo" value={logoUrl} />

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <span style={{ fontWeight: 600, fontSize: "0.95rem" }}>Business Logo</span>
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
                {isOwner && (
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
                )}
              </div>
              
              {isOwner && (
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
              )}
            </div>

            {brandingMsg && (
              <div style={{ fontSize: "0.9rem", color: brandingMsg.includes("Error") ? "#f43f5e" : "#10b981", fontWeight: 500 }}>
                {brandingMsg}
              </div>
            )}

            {isOwner ? (
              <button type="submit" className="btn-primary" style={{ alignSelf: "flex-start", marginTop: "8px" }}>
                Update Branding
              </button>
            ) : (
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Only owners can edit branding information.</p>
            )}
          </form>
        </div>

        {/* Invite New Partner Panel */}
        {isOwner && (
          <div className="glass-card" style={{ height: "fit-content" }}>
            <h3 style={{ borderBottom: "1px solid var(--border-light)", paddingBottom: "16px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
              <Plus size={20} color="var(--secondary)" /> Add Business Partner
            </h3>
            
            <form onSubmit={handleAddPartner} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <label style={{ fontWeight: 600 }}>
                Partner Full Name
                <input 
                  type="text" 
                  name="name" 
                  required 
                  style={inputStyle} 
                  placeholder="e.g. Samir Patel" 
                />
              </label>

              <label style={{ fontWeight: 600 }}>
                Email Address
                <input 
                  type="email" 
                  name="email" 
                  required 
                  style={inputStyle} 
                  placeholder="samir@gmail.com" 
                />
              </label>

              <label style={{ fontWeight: 600 }}>
                Access Permissions
                <select name="role" required style={{ ...inputStyle, WebkitAppearance: "none" }}>
                  <option value="PARTNER_EDIT">Read-Write (Can Edit & Transact)</option>
                  <option value="PARTNER_VIEW">View-Only (Dashboard Read-only)</option>
                </select>
              </label>

              {partnerMsg && (
                <div style={{ fontSize: "0.9rem", color: partnerMsg.includes("Error") ? "#f43f5e" : "#10b981", fontWeight: 500 }}>
                  {partnerMsg}
                </div>
              )}

              <button type="submit" className="btn-primary" style={{ alignSelf: "flex-start", marginTop: "8px" }}>
                Invite Partner
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Partners Roster list */}
      <div className="glass-card">
        <h3 style={{ borderBottom: "1px solid var(--border-light)", paddingBottom: "16px", marginBottom: "24px", display: "flex", alignItems: "center", gap: "10px" }}>
          <Users size={20} color="var(--primary)" /> Partners Roster
        </h3>

        <div className="table-responsive-wrapper">
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-light)", backgroundColor: "rgba(255,255,255,0.02)" }}>
                <th style={{ padding: "16px 24px", fontWeight: 600 }}>Name</th>
                <th style={{ padding: "16px 24px", fontWeight: 600 }}>Email / Clerk ID</th>
                <th style={{ padding: "16px 24px", fontWeight: 600 }}>Role / Access Level</th>
                {isOwner && <th style={{ padding: "16px 24px", fontWeight: 600 }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {business.members.map((member: any) => (
                <tr key={member.id} style={{ borderBottom: "1px solid var(--border-light)" }}>
                  <td style={{ padding: "16px 24px" }}>
                    <strong style={{ color: "var(--text-main)" }}>{member.name}</strong>
                    {member.clerkUserId ? (
                      <span style={{ marginLeft: 8, padding: "2px 6px", borderRadius: 4, background: "rgba(16, 185, 129, 0.15)", color: "#10b981", fontSize: "0.75rem" }}>
                        Active
                      </span>
                    ) : (
                      <span style={{ marginLeft: 8, padding: "2px 6px", borderRadius: 4, background: "rgba(245, 158, 11, 0.15)", color: "#f59e0b", fontSize: "0.75rem" }}>
                        Pending Sign In
                      </span>
                    )}
                  </td>
                  <td style={{ padding: "16px 24px" }}>
                    <div>{member.email || "-"}</div>
                    {member.clerkUserId && <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>ID: {member.clerkUserId}</div>}
                  </td>
                  <td style={{ padding: "16px 24px" }}>
                    {member.role === "OWNER" ? (
                      <span style={{ color: "#38bdf8", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                        <Shield size={14} /> Owner
                      </span>
                    ) : isOwner ? (
                      <select 
                        defaultValue={member.role} 
                        onChange={(e) => handleRoleChange(member.id, e.target.value)} 
                        disabled={isPending}
                        style={{ ...inputStyle, width: "auto", margin: 0, padding: "6px 12px", WebkitAppearance: "none" }}
                      >
                        <option value="PARTNER_EDIT">Read-Write</option>
                        <option value="PARTNER_VIEW">View-Only</option>
                        {member.clerkUserId && <option value="OWNER">Owner (Transfer Ownership)</option>}
                      </select>
                    ) : (
                      <span>{member.role === "PARTNER_EDIT" ? "Read-Write" : "View-Only"}</span>
                    )}
                  </td>
                  {isOwner && (
                    <td style={{ padding: "16px 24px" }}>
                      {member.role !== "OWNER" && (
                        <form action={removeBusinessPartner} onSubmit={(e) => { if (!confirm("Revoke this partner's access permanently?")) e.preventDefault(); }}>
                          <input type="hidden" name="memberId" value={member.id} />
                          <button type="submit" className="btn-primary" style={{ padding: "6px 12px", background: "rgba(244, 63, 94, 0.1)", color: "#f43f5e", boxShadow: "none" }}>
                            <Trash2 size={16} />
                          </button>
                        </form>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Danger Zone Panel */}
      {isOwner && (
        <div className="glass-card" style={{ 
          marginTop: "16px",
          border: "1px solid rgba(244, 63, 94, 0.25)",
          background: "linear-gradient(135deg, rgba(244, 63, 94, 0.03) 0%, rgba(8, 12, 20, 0) 100%)",
        }}>
          <h3 style={{ borderBottom: "1px solid rgba(244, 63, 94, 0.2)", paddingBottom: "16px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px", color: "#f43f5e" }}>
            <Trash2 size={20} /> Danger Zone
          </h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "20px" }}>
            Permanently delete this business dealership, remove all associated cars, transactions, deals, customers, and revoke all partner access. This action is irreversible.
          </p>
          
          <button 
            type="button" 
            onClick={handleDeleteBusiness}
            className="btn-primary" 
            style={{ 
              background: "linear-gradient(135deg, #e11d48 0%, #be123c 100%)", 
              color: "#fff", 
              border: "none",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 4px 12px rgba(225, 29, 72, 0.2)",
              cursor: "pointer"
            }}
          >
            <Trash2 size={16} /> Delete Business Dealership
          </button>
        </div>
      )}

      {loadingBranding && <AutoLoader fullscreen={true} message="Saving branding adjustments..." />}
      {loadingPartner && <AutoLoader fullscreen={true} message="Registering partner credentials..." />}
      {uploadingLogo && <AutoLoader fullscreen={true} message="Uploading logo to server garage..." />}
      {loadingDelete && <AutoLoader fullscreen={true} message="Deleting business dealership and clearing configurations..." />}
    </div>
  );
}
