import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Bell, 
  HelpCircle, 
  Menu, 
  Search 
} from "lucide-react";
import { Input } from "@/components/ui/input";

interface HeaderProps {
  toggleMobileSidebar?: () => void;
}

export default function Header({ toggleMobileSidebar }: HeaderProps) {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  
  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
      {/* Mobile menu button */}
      <Button variant="ghost" size="icon" className="md:hidden">
        <Menu className="h-5 w-5 text-gray-500" />
        <span className="sr-only">Toggle menu</span>
      </Button>
      
      <div className="md:hidden text-xl font-bold text-blue-600 flex-1 text-center">Skills Tracker</div>
      
      {/* Search Bar (Desktop) */}
      <div className={`hidden md:flex items-center flex-1 px-4 ${isSearchFocused ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}`}>
        <div className="relative w-full max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-gray-400" />
          </span>
          <Input
            type="text"
            placeholder="Search..."
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
          />
        </div>
      </div>
      
      {/* Right-side actions */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon">
          <Bell className="h-5 w-5 text-gray-500" />
          <span className="sr-only">Notifications</span>
        </Button>
        <Button variant="ghost" size="icon">
          <HelpCircle className="h-5 w-5 text-gray-500" />
          <span className="sr-only">Help</span>
        </Button>
        {/* User profile dropdown (Desktop only) */}
        <div className="hidden md:block relative">
          <Button variant="ghost" className="p-0 h-8 w-8 rounded-full">
            <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-gray-600">A</span>
            </div>
          </Button>
        </div>
      </div>
    </header>
  );
}
