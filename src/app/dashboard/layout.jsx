import Navbar from "../components/Navbar";


export default function DashboardLayout({ children }) {
  return (
    <div className="flex flex-col">
      <Navbar />
      <div className="relative h-[calc(100vh-76px)]">
        {children}
      </div>
    </div>
  );
}