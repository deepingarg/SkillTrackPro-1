import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  BarChart2, 
  Users, 
  Brain, 
  LineChart, 
  Settings, 
  User,
  Gauge,
  FileSpreadsheet
} from "lucide-react";

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  isActive: boolean;
}

const SidebarItem = ({ icon, label, href, isActive }: SidebarItemProps) => {
  return (
    <Link href={href}>
      <div
        className={cn(
          "flex items-center px-4 py-2 text-gray-600 rounded-md transition-colors cursor-pointer",
          isActive 
            ? "bg-gray-100 text-blue-600 font-medium" 
            : "hover:bg-gray-100"
        )}
      >
        <span className={cn("mr-3", isActive ? "text-blue-600" : "text-gray-500")}>{icon}</span>
        {label}
      </div>
    </Link>
  );
};

export default function Sidebar() {
  const [location] = useLocation();
  
  return (
    <aside className="hidden md:flex md:w-64 flex-col bg-white border-r border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-xl font-bold text-blue-600 flex items-center">
          <Gauge className="mr-2 h-6 w-6" />
          Skills Tracker
        </h1>
      </div>
      
      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-1">
          <li>
            <SidebarItem 
              icon={<BarChart2 size={20} />} 
              label="Dashboard" 
              href="/" 
              isActive={location === "/"} 
            />
          </li>
          <li>
            <SidebarItem 
              icon={<Users size={20} />} 
              label="Team Members" 
              href="/team-members" 
              isActive={location === "/team-members"} 
            />
          </li>
          <li>
            <SidebarItem 
              icon={<Brain size={20} />} 
              label="Skills" 
              href="/skills" 
              isActive={location === "/skills"} 
            />
          </li>
          <li>
            <SidebarItem 
              icon={<LineChart size={20} />} 
              label="Reports" 
              href="/reports" 
              isActive={location === "/reports"} 
            />
          </li>
          <li>
            <SidebarItem 
              icon={<FileSpreadsheet size={20} />} 
              label="Import Data" 
              href="/import-data" 
              isActive={location === "/import-data"} 
            />
          </li>
          <li>
            <SidebarItem 
              icon={<Settings size={20} />} 
              label="Settings" 
              href="/settings" 
              isActive={location === "/settings"} 
            />
          </li>
        </ul>
      </nav>
      
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center">
            <User className="h-4 w-4 text-gray-600" />
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-700">Admin User</p>
            <p className="text-xs text-gray-500">Administrator</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
