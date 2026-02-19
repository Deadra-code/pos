import { Link, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Home, ShoppingBag, Utensils, Receipt, Settings } from 'lucide-react';

const menuItems = [
  {
    title: 'Dashboard',
    icon: Home,
    link: '/',
  },
  {
    title: 'Kasir',
    icon: ShoppingBag,
    link: '/kasir',
  },
  {
    title: 'Manajemen Menu',
    icon: Utensils,
    link: '/menu',
  },
  {
    title: 'Laporan',
    icon: Receipt,
    link: '/laporan',
  },
  {
    title: 'Pengaturan',
    icon: Settings,
    link: '/pengaturan',
  },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" variant="sidebar">
        <SidebarHeader className="border-b border-sidebar-border">
          <div className="flex items-center gap-2 px-2 py-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Utensils className="h-4 w-4" />
            </div>
            <div className="flex flex-col group-data-[collapsible=icon]:hidden">
              <span className="text-sm font-semibold">WarungPOS</span>
              <span className="text-xs text-muted-foreground">v1.0</span>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {menuItems.map((item) => {
                  const isActive = location.pathname === item.link;
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.title}
                      >
                        <Link to={item.link}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t border-sidebar-border">
          <div className="p-2 group-data-[collapsible=icon]:hidden">
            <p className="text-xs text-muted-foreground text-center">
              Warung Makan Edition
            </p>
          </div>
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>

      <SidebarTrigger className="absolute top-3 left-3 z-50" />

      <main className="flex-1 flex flex-col min-h-screen">
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </main>
    </SidebarProvider>
  );
}
