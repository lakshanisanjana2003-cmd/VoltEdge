import { useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, FolderKanban, Building2, Users, FileStack, MapPin, ClipboardCheck,
  Settings, ShieldCheck, Zap, Menu, Search, Bell, LogOut,
} from "lucide-react";
import { getMyProfessional, getMyProfile, listProjects, signOut } from "@/lib/api";
import { summarizeProjects } from "@/lib/projectHelpers";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/projects", label: "Projects", icon: FolderKanban },
  { to: "/clients", label: "Clients", icon: Building2 },
  { to: "/professionals", label: "Professionals", icon: Users },
  { to: "/drawings", label: "Drawings and Documents", icon: FileStack },
  { to: "/site-visits", label: "Site Visits", icon: MapPin },
  { to: "/testing", label: "Testing and Certification", icon: ClipboardCheck },
  { to: "/settings", label: "Settings / About", icon: Settings },
];

// Shown only to administrators.
const ADMIN_NAV_ITEM = { to: "/users", label: "User Accounts", icon: ShieldCheck };

// The navigation menu.
function SidebarNav({ items, onNavigate }) {
  const { pathname } = useLocation();
  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-5">
        <Zap className="h-5 w-5 text-sidebar-primary" />
        <span className="font-semibold tracking-wide text-sidebar-accent-foreground">VoltEdge</span>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
         {items.map((item) => {
          const active = pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                active && "bg-sidebar-accent font-medium text-sidebar-accent-foreground",
              )}
            >
              <item.icon className={cn("h-4 w-4", active && "text-sidebar-primary")} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

// The frame around every page
export function AppShell() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [overdueCount, setOverdueCount] = useState(0);
  const [profile, setProfile] = useState(null);
  const [hasProfessionalProfile, setHasProfessionalProfile] = useState(true); // true until we know, so the banner does not flash
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // Load signed-in staff member once.
  useEffect(() => {
    getMyProfile().then(setProfile).catch(() => {});
  }, []);

  // Count overdue projects for bell. Reload when page changes, so number stays fresh.
  useEffect(() => {
    listProjects()
      .then((projects) => {
        const today = new Date().toISOString().slice(0, 10);
        setOverdueCount(summarizeProjects(projects, today).overdue.length);
      })
      .catch(() => {});
  }, [pathname]);

    // Show reminder if this user has no professional profile
  useEffect(() => {
    getMyProfessional()
      .then((found) => setHasProfessionalProfile(Boolean(found)))
      .catch(() => {});
  }, [pathname]);

  const navItems = profile?.role === "admin" ? [...NAV_ITEMS, ADMIN_NAV_ITEM] : NAV_ITEMS;
  const currentPage = navItems.find((item) => pathname.startsWith(item.to));

  function handleSearch(event) {
    event.preventDefault();
    navigate(`/projects?q=${encodeURIComponent(search.trim())}`);
  }

  function handleSignOut() {
    signOut();
    navigate("/auth", { replace: true });
  }

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 lg:block">
        <SidebarNav items={navItems} />
      </aside>
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-64 border-0 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarNav items={navItems} onNavigate={() => setMobileMenuOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b bg-card px-4 lg:px-8">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileMenuOpen(true)} aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </Button>
          <form onSubmit={handleSearch} className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search projects by ID or name"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </form>
          <div className="ml-auto flex items-center gap-2">
            <Link to="/dashboard" className="relative rounded-md p-2 hover:bg-muted" aria-label="Notifications">
              <Bell className="h-5 w-5" />
              {overdueCount > 0 && (
                <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] text-destructive-foreground">
                  {overdueCount}
                </span>
              )}
            </Link>
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium leading-tight">{profile?.full_name ?? "…"}</p>
              <p className="font-mono text-xs text-muted-foreground">{profile?.staff_code ?? profile?.officer_id}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={handleSignOut} aria-label="Sign out">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 lg:px-8">
          <p className="mb-2 text-xs text-muted-foreground">
            VoltEdge <span className="mx-1">/</span> {currentPage?.label ?? ""}
            {pathname.split("/").length > 2 && <span> / Details</span>}
          </p>
                    {!hasProfessionalProfile && pathname !== "/settings" && (
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-md border border-dashed bg-card p-3 text-sm">
              <span>You have no professional profile yet.</span>
              <Link to="/settings" className="font-medium underline">Create your professional profile</Link>
            </div>
          )}
          <Outlet context={{ profile }} />
        </main>
      </div>
    </div>
  );
}
