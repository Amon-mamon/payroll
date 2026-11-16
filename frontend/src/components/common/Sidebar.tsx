import { NavLink, useLocation } from "react-router-dom";
import { ChevronsUpDown, LogOut } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { NAV_GROUPS, ROLE_LABEL } from "@/constant/navigation";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { useLogout } from "@/features/auth/hooks/useLogout";
import { initials } from "@/lib/format";

export const AppSidebar = () => {
  const { user, role, organization } = useCurrentUser();
  const { pathname } = useLocation();
  const { setOpenMobile } = useSidebar();
  const { mutate: logout, isLoading: isPending } = useLogout();

  if (!user || !role) return null;
  const groups = NAV_GROUPS.filter((g) => g.roles.includes(role));

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<NavLink to="/dashboard" />}>
              <span className="brand-mark size-8 text-sm">{(organization?.name ?? "F").charAt(0).toUpperCase()}</span>
              <div className="grid flex-1 text-left leading-tight">
                <span className="truncate font-semibold">{organization?.name ?? "Flowify Payroll"}</span>
                <span className="truncate text-xs text-muted-foreground">Flowify · {ROLE_LABEL[role]}</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {groups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton
                      tooltip={item.title}
                      isActive={pathname === item.to || pathname.startsWith(`${item.to}/`)}
                      render={<NavLink to={item.to} onClick={() => setOpenMobile(false)} />}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger render={<SidebarMenuButton size="lg" />}>
                <Avatar className="size-8 rounded-lg">
                  <AvatarFallback className="rounded-lg">{initials(user.full_name)}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.full_name}</span>
                  <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                </div>
                <ChevronsUpDown className="ml-auto size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="min-w-56">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>
                    <div className="text-sm font-medium text-foreground">{user.full_name}</div>
                    <div className="text-xs font-normal">{ROLE_LABEL[role]}</div>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" disabled={isPending} onClick={() => logout()}>
                  <LogOut /> {isPending ? "Signing out…" : "Sign out"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};
