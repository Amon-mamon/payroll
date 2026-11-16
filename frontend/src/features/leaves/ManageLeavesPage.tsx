import { useState } from "react";
import { Check, Loader2, RefreshCw, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/common/PageHeader";
import { Pager } from "@/components/common/Pager";
import { notify } from "@/lib/toast";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import type { LeaveRequest } from "@/types";
import { LeaveTable } from "./components/LeaveTable";
import { useGenerateBalances, useLeaveAction, useLeaveRequests } from "./api";

const PAGE_SIZE = 15;

const ManageLeavesPage = () => {
  const { user, isAdmin } = useCurrentUser();
  const [tab, setTab] = useState("pending");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const action = useLeaveAction();
  const generate = useGenerateBalances();

  const { data, isInitialLoading, error } = useLeaveRequests({
    status: tab === "all" ? undefined : tab,
    search,
    page,
    page_size: PAGE_SIZE,
    ordering: tab === "pending" ? "start_date" : "-created_at",
  });

  const review = (r: LeaveRequest, act: "approve" | "reject") =>
    action.mutate(
      { id: r.id, action: act },
      {
        onSuccess: () => notify.success(act === "approve" ? "Leave approved" : "Leave rejected", r.employee_name),
        onError: (e) => notify.error(e),
      },
    );

  const canReview = (r: LeaveRequest) => r.status === "pending" && (isAdmin || r.employee !== user?.employee_id);

  const year = new Date().getFullYear();
  const onGenerate = () =>
    generate.mutate(year, {
      onSuccess: (res) => notify.success("Leave balances updated", res.detail),
      onError: (e) => notify.error(e),
    });

  return (
    <>
      <PageHeader
        title="Leave requests"
        description="Review and approve leave filed by employees."
        actions={
          <Button variant="outline" onClick={onGenerate} disabled={generate.isLoading}>
            {generate.isLoading ? <Loader2 className="animate-spin" /> : <RefreshCw />} Generate {year} balances
          </Button>
        }
      />
      <Card>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Tabs value={tab} onValueChange={(v) => { setTab(v as string); setPage(1); }}>
              <TabsList>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="approved">Approved</TabsTrigger>
                <TabsTrigger value="rejected">Rejected</TabsTrigger>
                <TabsTrigger value="all">All</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="relative sm:w-72">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search employee" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
            </div>
          </div>
          <LeaveTable
            rows={data?.results ?? []}
            isLoading={isInitialLoading}
            error={error}
            showEmployee
            emptyTitle={tab === "pending" ? "No pending requests. All caught up." : "No requests"}
            actions={(r) =>
              canReview(r) ? (
                <div className="flex justify-end gap-1">
                  <Button size="sm" disabled={action.isLoading} onClick={() => review(r, "approve")}>
                    <Check /> Approve
                  </Button>
                  <Button size="sm" variant="destructive" disabled={action.isLoading} onClick={() => review(r, "reject")}>
                    <X /> Reject
                  </Button>
                </div>
              ) : r.status === "pending" ? (
                <span className="text-xs text-muted-foreground">Needs an admin</span>
              ) : null
            }
          />
          <Pager page={page} pageSize={PAGE_SIZE} count={data?.count ?? 0} onPageChange={setPage} />
        </CardContent>
      </Card>
    </>
  );
};

export default ManageLeavesPage;
