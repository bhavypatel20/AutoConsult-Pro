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
          <div /> {/* Spacer */}
          <SafeUserButton />
        </header>
        {children}
      </main>
    </div>
  );
}

