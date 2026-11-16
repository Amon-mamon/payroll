import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/common/PageHeader";
import { Pager } from "@/components/common/Pager";
import { EmptyState } from "@/components/common/States";
import { notify } from "@/lib/toast";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { BalanceCards } from "./components/BalanceCards";
import { LeaveRequestDialog } from "./components/LeaveRequestDialog";
import { LeaveTable } from "./components/LeaveTable";
import { useLeaveAction, useLeaveBalances, useLeaveRequests } from "./api";

const PAGE_SIZE = 10;

const MyLeavesPage = () => {
  const { hasEmployeeProfile } = useCurrentUser();
  const year = new Date().getFullYear();
  const [page, setPage] = useState(1);
  const balances = useLeaveBalances({ mine: true, year, page_size: 50 });
  const requests = useLeaveRequests({ mine: true, page, page_size: PAGE_SIZE, ordering: "-created_at" });
  const action = useLeaveAction();

  if (!hasEmployeeProfile) {
    return (
      <>
        <PageHeader title="My leaves" />
        <Card><CardContent><EmptyState title="No employee profile" description="Leave requests need an employee profile linked to your account." /></CardContent></Card>
      </>
    );
  }

  const cancel = (id: string) =>
    action.mutate(
      { id, action: "cancel" },
      { onSuccess: () => notify.success("Request cancelled"), onError: (e) => notify.error(e) },
    );

  return (
    <>
      <PageHeader
        title="My leaves"
        description={`Your ${year} balances and leave requests.`}
        actions={<LeaveRequestDialog balances={balances.data?.results ?? []} />}
      />
      <BalanceCards balances={balances.data?.results ?? []} isLoading={balances.isInitialLoading} />
      <Card>
        <CardHeader>
          <CardTitle>Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <LeaveTable
            rows={requests.data?.results ?? []}
            isLoading={requests.isInitialLoading}
            error={requests.error}
            emptyTitle="You haven't requested any leave yet"
            actions={(r) =>
              r.status === "pending" && (
                <Button variant="ghost" size="sm" disabled={action.isLoading} onClick={() => cancel(r.id)}>
                  Cancel
                </Button>
              )
            }
          />
          <Pager page={page} pageSize={PAGE_SIZE} count={requests.data?.count ?? 0} onPageChange={setPage} />
        </CardContent>
      </Card>
    </>
  );
};

export default MyLeavesPage;
