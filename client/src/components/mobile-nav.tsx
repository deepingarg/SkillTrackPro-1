import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  BarChart2, 
  Users, 
  Brain, 
  Settings, 
  Gauge 
} from "lucide-react";

export default function MobileNav() {
  const [location] = useLocation();
  
  // Navigation items
  const navItems = [
    {
      href: "/",
      label: "Dashboard",
      icon: <BarChart2 className="h-5 w-5" />,
    },
    {
      href: "/team-members",
      label: "Team",
      icon: <Users className="h-5 w-5" />,
    },
    {
      href: "/skills",
      label: "Skills",
      icon: <Brain className="h-5 w-5" />,
    },
    {
      href: "/settings",
      label: "Settings",
      icon: <Settings className="h-5 w-5" />,
    },
  ];
  
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center z-50">
      {navItems.map((item) => (
        <Link key={item.href} href={item.href}>
          <a className={cn(
            "flex flex-col items-center py-2",
            location === item.href ? "text-blue-600" : "text-gray-500"
          )}>
            {item.icon}
            <span className="text-xs mt-1">{item.label}</span>
          </a>
        </Link>
      ))}
    </nav>
  );
}
