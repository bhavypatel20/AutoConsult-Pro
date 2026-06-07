import AutoLoader from "@/components/AutoLoader";

export default function DashboardLoading() {
  return <AutoLoader fullscreen={true} message="Warming up dealership dashboard engine..." />;
}
