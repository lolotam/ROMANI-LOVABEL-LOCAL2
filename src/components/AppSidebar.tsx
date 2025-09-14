import { NavLink, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Settings,
  Building2,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Home
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const mainItems = [
  { title: "لوحة التحكم", url: "/dashboard", icon: LayoutDashboard },
  { title: "الموظفين", url: "/employees", icon: Users },
  { title: "الوثائق", url: "/documents", icon: FileText },
  { title: "الإعدادات", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const { logout } = useAuth();

  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-primary/10 text-primary font-medium border-r-2 border-primary" 
      : "hover:bg-accent/50 text-muted-foreground hover:text-foreground";

  return (
    <Sidebar
      className={`${collapsed ? "w-16" : "w-64"} transition-all duration-300 border-r border-border/50 bg-card/50 backdrop-blur-sm`}
    >
      <SidebarContent className="p-0">
        {/* Header */}
        <div className={`p-4 border-b border-border/50 ${collapsed ? "px-2" : "px-4"}`}>
          <div className="flex items-center justify-between">
            <div className={`flex items-center space-x-3 ${collapsed ? "justify-center" : ""}`}>
              <div className="p-2 bg-primary/10 rounded-lg">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              {!collapsed && (
                <div>
                  <h2 className="text-lg font-bold text-gradient">Romani CureMed</h2>
                  <p className="text-xs text-muted-foreground">نظام إدارة الوثائق</p>
                </div>
              )}
            </div>
            <SidebarTrigger className="h-8 w-8 rounded-md hover:bg-accent">
              {collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </SidebarTrigger>
          </div>
        </div>

        {/* Navigation Menu */}
        <SidebarGroup className="px-0">
          <SidebarGroupLabel className={`px-4 text-xs uppercase tracking-wide text-muted-foreground ${collapsed ? "sr-only" : ""}`}>
            القائمة الرئيسية
          </SidebarGroupLabel>
          <SidebarGroupContent className="px-2">
            <SidebarMenu className="space-y-1">
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="h-auto">
                    <NavLink 
                      to={item.url} 
                      end 
                      className={`${getNavCls({ isActive: isActive(item.url) })} flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200 ${collapsed ? "justify-center" : ""}`}
                    >
                      <item.icon className={`h-5 w-5 ${collapsed ? "" : "ml-3"}`} />
                      {!collapsed && <span className="font-medium">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Footer */}
        <div className="mt-auto p-2 border-t border-border/50">
          <Button
            variant="ghost"
            onClick={logout}
            className={`w-full ${collapsed ? "px-2" : "px-3"} py-3 text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors`}
          >
            <LogOut className={`h-5 w-5 ${collapsed ? "" : "ml-2"}`} />
            {!collapsed && <span>تسجيل الخروج</span>}
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}