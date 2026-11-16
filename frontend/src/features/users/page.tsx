import { useState } from "react";
import { Search } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/common/PageHeader";
import { Pager } from "@/components/common/Pager";
import { AppSelect } from "@/components/common/AppSelect";
import { StatusBadge } from "@/components/common/StatusBadge";
import { TableStatusRow } from "@/components/common/States";
import api from "@/lib/api";
import { formatDate } from "@/lib/format";
import { useList } from "@/lib/query";
import { notify } from "@/lib/toast";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import type { Account } from "@/types";

const PAGE_SIZE = 20;

const AccountsPage = () => {
  const { user } = useCurrentUser();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");
  const [page, setPage] = useState(1);
  const { data, isInitialLoading, error } = useList<Account>("accounts", "auth/users/", {
    search,
    role: role === "all" ? undefined : role,
    page,
    page_size: PAGE_SIZE,
  });

  const toggle = useMutation({
    mutationFn: async (a: Account) => (await api.patch<Account>(`auth/users/${a.id}/`, { is_active: !a.is_active })).data,
    onSuccess: (a) => {
      qc.invalidateQueries({ queryKey: ["accounts"] });
      qc.invalidateQueries({ queryKey: ["employees"] });
      notify.success(a.is_active ? "Account activated" : "Account deactivated", a.email);
    },
    onError: (e) => notify.error(e),
  });

  return (
    <>
      <PageHeader
        title="Accounts"
        description="Every login in the system. Create new HR or employee accounts from Employees."
        actions={<Button render={<Link to="/manage/employees" />}>Create account</Button>}
      />
      <Card>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search username, name or email" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
            </div>
            <AppSelect
              className="sm:w-44"
              value={role}
              onChange={(v) => { setRole(v); setPage(1); }}
              options={[
                { value: "all", label: "All roles" },
                { value: "admin", label: "Admins" },
                { value: "hr", label: "HR" },
                { value: "employee", label: "Employees" },
              ]}
            />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Profile</TableHead>
                <TableHead>Last sign-in</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-0" />
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableStatusRow colSpan={6} isLoading={isInitialLoading} error={error} isEmpty={!data?.results.length} emptyTitle="No accounts found" />
              {data?.results.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>
                    <div className="font-medium">{a.full_name}</div>
                    <div className="text-xs text-muted-foreground">{a.username !== a.email ? `${a.username} · ` : ""}{a.email}</div>
                  </TableCell>
                  <TableCell><StatusBadge status={a.role} /></TableCell>
                  <TableCell>
                    {a.employee_id ? (
                      <Link className="text-sm text-primary hover:underline" to={`/manage/employees/${a.employee_id}`}>View profile</Link>
                    ) : (
                      <span className="text-sm text-muted-foreground">No profile</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{a.last_login ? formatDate(a.last_login) : "Never"}</TableCell>
                  <TableCell><StatusBadge status={a.is_active ? "active" : "inactive"} /></TableCell>
                  <TableCell>
                    {a.id !== user?.id && (
                      <Button size="sm" variant={a.is_active ? "destructive" : "outline"} disabled={toggle.isLoading} onClick={() => toggle.mutate(a)}>
                        {a.is_active ? "Deactivate" : "Activate"}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pager page={page} pageSize={PAGE_SIZE} count={data?.count ?? 0} onPageChange={setPage} />
        </CardContent>
      </Card>
    </>
  );
};

export default AccountsPage;
