import { useLocation, useNavigate } from "@tanstack/react-router";
import {
  Activity,
  AlertTriangle,
  Clock,
  Key,
  LayoutDashboard,
  Moon,
  PanelLeft,
  PanelLeftClose,
  Server,
  Shield,
  Sun,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

interface NavItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  end?: boolean;
}

const mainItems: NavItem[] = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard, end: true },
  { title: "Key Browser", url: "/keys", icon: Key },
  { title: "Leases", url: "/leases", icon: Clock },
];

const authItems: NavItem[] = [
  { title: "Users", url: "/auth/users", icon: Users },
  { title: "Roles", url: "/auth/roles", icon: Shield },
];

const clusterItems: NavItem[] = [
  { title: "Members", url: "/cluster/members", icon: Server },
  { title: "Endpoints", url: "/cluster/endpoints", icon: Activity },
  { title: "Alarms", url: "/cluster/alarms", icon: AlertTriangle },
];

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toggleSidebar, state } = useSidebar();
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window !== "undefined") {
      return document.documentElement.classList.contains("dark")
        ? "dark"
        : "light";
    }
    return "light";
  });

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const isActive = (url: string, end?: boolean) => {
    if (end) return location.pathname === url;
    return location.pathname.startsWith(url);
  };

  const renderMenuItems = (items: NavItem[]) => (
    <SidebarMenu>
      {items.map((item) => (
        <SidebarMenuItem key={item.url}>
          <SidebarMenuButton
            onClick={() => navigate({ to: item.url })}
            isActive={isActive(item.url, item.end)}
            tooltip={item.title}
          >
            <item.icon className="h-4 w-4" />
            <span>{item.title}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-sidebar-accent-foreground tracking-tight group-data-[collapsible=icon]:hidden">
            etcd{" "}
            <span className="font-normal text-sidebar-foreground/80">
              explorer
            </span>
          </h1>
          <button
            type="button"
            onClick={toggleSidebar}
            className="flex h-7 w-7 items-center justify-center rounded-md text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
          >
            {state === "expanded" ? (
              <PanelLeftClose className="h-4 w-4" />
            ) : (
              <PanelLeft className="h-4 w-4" />
            )}
          </button>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Main navigation */}
        <SidebarGroup>
          <SidebarGroupContent>
            {renderMenuItems(mainItems)}
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Auth section */}
        <SidebarGroup>
          <SidebarGroupLabel>Auth</SidebarGroupLabel>
          <SidebarGroupContent>
            {renderMenuItems(authItems)}
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Cluster section */}
        <SidebarGroup>
          <SidebarGroupLabel>Cluster</SidebarGroupLabel>
          <SidebarGroupContent>
            {renderMenuItems(clusterItems)}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border px-3 py-3">
        <div className="flex items-center justify-between group-data-[collapsible=icon]:justify-center">
          <p className="text-xs text-sidebar-foreground/50 group-data-[collapsible=icon]:hidden">
            {/*etcd v3.5.12*/}
          </p>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            {theme === "light" ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
