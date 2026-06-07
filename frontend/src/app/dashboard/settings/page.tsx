import { getActiveBusiness } from "@/actions/business";
import { redirect } from "next/navigation";
import SettingsClient from "./SettingsClient";

export default async function SettingsPage() {
  const context = await getActiveBusiness();

  // If no business profile exists yet, redirect to onboarding
  if (!context) {
    redirect("/onboarding");
  }

  const { business, membership } = context;

  return (
    <SettingsClient 
      business={business} 
      currentMember={membership} 
    />
  );
}
