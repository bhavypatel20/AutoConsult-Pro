"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CarFront, LayoutDashboard, Users, Receipt, FileText, Settings, Shield, IndianRupee, FileSpreadsheet } from "lucide-react";
import styles from "../dashboard.module.css";

interface SidebarProps {
  businessName: string;
  logoUrl: string | null;
  role: string;
  plan?: string;
}

export default function Sidebar({ businessName, logoUrl, role, plan = "Trial" }: SidebarProps) {
  const pathname = usePathname();

  // Helper to split name for two lines if long, or show nicely
  const displayNameFirst = businessName.split(" ")[0] || "My";
  const displayNameRest = businessName.split(" ").slice(1).join(" ") || "Dealership";
  const firstLetter = displayNameFirst.charAt(0).toUpperCase();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand} style={{ gap: "12px", fontSize: "1.2rem" }}>
        {logoUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img 
            src={logoUrl} 
            alt="Business Logo" 
            style={{ width: 42, height: 42, borderRadius: "50%", objectFit: "cover" }} 
          />
        ) : (
          <div style={{ 
            width: 42, 
            height: 42, 
            borderRadius: "50%", 
            background: "linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 800,
            fontSize: "1.2rem",
            color: "#080c14",
            textTransform: "uppercase",
            flexShrink: 0
          }}>
            {firstLetter}
          </div>
        )}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontWeight: 800 }}>{displayNameFirst}</span>
            <span style={{ 
              fontSize: "0.62rem", 
              fontWeight: 800, 
              padding: "2px 6px", 
              borderRadius: "4px",
              background: plan === "Starter" ? "rgba(6, 182, 212, 0.15)" : plan === "Pro" ? "linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(16, 185, 129, 0.2) 100%)" : plan === "Enterprise" ? "linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(249, 115, 22, 0.2) 100%)" : "rgba(255,255,255,0.08)",
              border: `1px solid ${plan === "Starter" ? "rgba(6, 182, 212, 0.3)" : plan === "Pro" ? "rgba(16, 185, 129, 0.3)" : plan === "Enterprise" ? "rgba(168, 85, 247, 0.3)" : "rgba(255,255,255,0.15)"}`,
              color: plan === "Starter" ? "var(--primary)" : plan === "Pro" ? "var(--secondary)" : plan === "Enterprise" ? "#a855f7" : "var(--text-muted)",
              textTransform: "uppercase"
            }}>
              {plan}
            </span>
          </div>
          <div style={{ fontSize: "0.8rem", fontWeight: 500, color: "var(--text-muted)" }}>{displayNameRest}</div>
        </div>
      </div>
      
      <nav className={styles.nav}>
        <Link href="/dashboard" className={`${styles.navLink} ${pathname === "/dashboard" ? styles.active : ""}`}>
          <LayoutDashboard size={20} /> Dashboard
        </Link>
        <Link href="/dashboard/inventory" className={`${styles.navLink} ${pathname.includes("/inventory") ? styles.active : ""}`}>
          <CarFront size={20} /> Inventory
        </Link>
        <Link href="/dashboard/customers" className={`${styles.navLink} ${pathname.includes("/customers") ? styles.active : ""}`}>
          <Users size={20} /> Customers
        </Link>
        <Link href="/dashboard/deals" className={`${styles.navLink} ${pathname.includes("/deals") ? styles.active : ""}`}>
          <Receipt size={20} /> Deals & Expenses
        </Link>
        <Link href="/dashboard/finance" className={`${styles.navLink} ${pathname.includes("/finance") ? styles.active : ""}`}>
          <IndianRupee size={20} /> Finance ERP
        </Link>
        <Link href="/dashboard/reports" className={`${styles.navLink} ${pathname.includes("/reports") ? styles.active : ""}`}>
          <FileSpreadsheet size={20} /> Financial Reports
        </Link>
        <Link href="/dashboard/analytics" className={`${styles.navLink} ${pathname.includes("/analytics") ? styles.active : ""}`}>
          <LayoutDashboard size={20} /> Advanced Analytics
        </Link>
        <Link href="/dashboard/documents" className={`${styles.navLink} ${pathname.includes("/documents") ? styles.active : ""}`}>
          <FileText size={20} /> Documents
        </Link>
        <Link href="/dashboard/settings" className={`${styles.navLink} ${pathname.includes("/settings") ? styles.active : ""}`}>
          <Settings size={20} /> Settings
        </Link>
      </nav>
      
      <div className={styles.roleProfile}>
        <Shield size={16} color={role === "OWNER" ? "#38bdf8" : "var(--text-muted)"} />
        <div style={{ fontSize: "0.8rem", fontWeight: 500 }}>
          <div style={{ color: "var(--text-main)" }}>Role Profile</div>
          <div style={{ color: "var(--text-muted)", textTransform: "capitalize" }}>{role === "OWNER" ? "Owner" : role === "PARTNER_EDIT" ? "Partner (Edit)" : "Partner (View)"}</div>
        </div>
      </div>
    </aside>
  );
}
