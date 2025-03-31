import Navbar from "../components/Navbar/Navbar";


export default function DashboardLayout({ children }) {
  return (
    <div className="flex flex-col">
      <Navbar />
      <div className="relative h-[calc(100vh-80px)]">
        {children}
      </div>
    </div>
  );
}