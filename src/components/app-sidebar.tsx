import { Link, useRouterState } from "@tanstack/react-router";
import { Users, Wallet, Dumbbell, ChevronDown, Leaf, Baby, History, Settings } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { CATEGORIES, useEnrollmentStats } from "@/lib/store";
import { Badge } from "@/components/ui/badge";

const CATEGORY_ICONS: Record<string, typeof Dumbbell> = {
  pilates: Dumbbell,
  yoga: Leaf,
  "yoga-kids": Baby,
};

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (p: string) => pathname === p;
  const startsWith = (p: string) => pathname.startsWith(p);

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader className="px-4 pt-5 pb-3">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Dumbbell className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold">Estudio CRM</div>
            <div className="text-xs text-muted-foreground">Gestión de clientes</div>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/")}>
                  <Link to="/">
                    <Users />
                    <span>Clientes</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Inscripción</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {Object.entries(CATEGORIES).map(([catSlug, cat]) => {
                const Icon = CATEGORY_ICONS[catSlug] ?? Wallet;
                const open = startsWith(`/pagos/${catSlug}`);
                return (
                  <Collapsible key={catSlug} defaultOpen={open} className="group/collapsible">
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton>
                          <Icon />
                          <span>{cat.label}</span>
                          <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {cat.subcategories.map((sub) => {
                            const to = `/pagos/${catSlug}/${sub.slug}`;
                            const { enrolledCount, clientsWithDebtCount } = useEnrollmentStats(catSlug, sub.slug);
                            return (
                              <SidebarMenuSubItem key={sub.slug}>
                                  <SidebarMenuSubButton asChild isActive={isActive(to)}>
                                  <Link to={`/pagos/${catSlug}/${sub.slug}`}>
                                    <div className="flex items-center gap-2">
                                      <span>{sub.label}</span>
                                      <span className="inline-flex items-center justify-center rounded-full bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5">{enrolledCount}</span>
                                      <span className="inline-flex items-center justify-center rounded-full bg-red-100 text-red-700 text-xs font-medium px-2 py-0.5">{clientsWithDebtCount}</span>
                                    </div>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            );
                          })}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Pagos</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/pagos/historial")}>
                  <Link to="/pagos/historial">
                    <History />
                    <span>Historial de pagos</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Configuración</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/accesibilidad")}>
                  <Link to="/accesibilidad">
                    <Settings />
                    <span>Accesibilidad</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
