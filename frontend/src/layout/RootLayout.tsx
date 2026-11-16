import { Outlet } from "react-router-dom";
import { AppSidebar } from "@/components/common/Sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { SubscriptionBanner, SubscriptionGate } from "@/components/saas/SubscriptionGate";
import { formatDate } from "@/lib/format";

const RootLayout = () => (
  <SidebarProvider>
    <AppSidebar />
    <SidebarInset>
      <header className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <span className="text-sm text-muted-foreground">
          {formatDate(new Date().toISOString(), { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
        </span>
      </header>
      <SubscriptionBanner />
      <div className="page-enter mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-4 md:p-6">
        <SubscriptionGate>
          <Outlet />
        </SubscriptionGate>
      </div>
    </SidebarInset>
  </SidebarProvider>
);

export default RootLayout;
