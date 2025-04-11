import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import Sidebar from "@/components/sidebar";
import MobileNav from "@/components/mobile-nav";
import Header from "@/components/header";
import Dashboard from "@/pages/dashboard";
import TeamMembers from "@/pages/team-members";
import Skills from "@/pages/skills";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-4 md:p-6 bg-gray-50">
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/team-members" component={TeamMembers} />
            <Route path="/skills" component={Skills} />
            <Route component={NotFound} />
          </Switch>
        </main>
      </div>
      <MobileNav />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
    </QueryClientProvider>
  );
}

export default App;
