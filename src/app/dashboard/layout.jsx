import Navbar from "../components/Navbar/Navbar";
import SenseiModal from "../components/Sensei/SenseiModal";
import { TASKSENSEI_ENABLED } from "@/lib/featureFlags";

export default function DashboardLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-background">
      <Navbar />
      <main className="relative mx-auto w-full min-w-0 max-w-7xl flex-1 overflow-x-hidden px-4 py-6 md:px-6 md:py-8">
        <div className="min-w-0 transition-all duration-500">
          {children}
        </div>
        {TASKSENSEI_ENABLED && <SenseiModal />}
      </main>
    </div>
  );
}
