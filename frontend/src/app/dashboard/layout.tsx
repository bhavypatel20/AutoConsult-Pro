import { getActiveBusiness } from "@/actions/business";
import { redirect } from "next/navigation";
import Sidebar from "./components/Sidebar";
import SafeUserButton from "./components/SafeUserButton";
import styles from "./dashboard.module.css";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const context = await getActiveBusiness();

  // Redirect to onboarding if no business is registered for the user
  if (!context) {
    redirect("/onboarding");
  }

  const { business, membership } = context;

  return (
    <div className={styles.layout}>
      <Sidebar 
        businessName={business.name} 
        logoUrl={business.logo} 
        role={membership.role} 
        plan={business.plan}
      />
      <main className={styles.main}>
        <header className={styles.header}>
          <div className={styles.mobileBrand}>
            {business.logo ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img 
                src={business.logo} 
                alt="Business Logo" 
                className={styles.mobileLogo} 
              />
            ) : (
              <div style={{ 
                width: 32, 
                height: 32, 
                borderRadius: "50%", 
                background: "linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: "0.95rem",
                color: "#080c14",
                textTransform: "uppercase",
                flexShrink: 0
              }}>
                {(business.name.split(" ")[0] || "M").charAt(0).toUpperCase()}
              </div>
            )}
            <span className={styles.mobileName}>{business.name}</span>
          </div>
          <div style={{ marginLeft: "auto" }}>
            <SafeUserButton />
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}

