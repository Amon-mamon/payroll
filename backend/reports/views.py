from django.db.models import Count, Q, Sum
from django.utils import timezone
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import User
from attendance.models import Attendance
from common.scoping import org_employees, scope_by_employee
from leaves.models import LeaveRequest
from payroll.models import PayrollRun


class DashboardView(APIView):
    """Overview numbers for the HR / Admin dashboard (scoped by role)."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        if not user.is_hr_or_admin:
            return Response({"detail": "Not available for your role."}, status=403)

        today = timezone.localdate()

        employees = org_employees(user).filter(user__is_active=True)
        if not user.is_admin:
            employees = employees.filter(user__role="employee")

        attendance_today = scope_by_employee(
            Attendance.objects.filter(is_deleted=False, date=today), user
        ).aggregate(
            present=Count("id", filter=Q(time_in__isnull=False)),
            late=Count("id", filter=Q(status="late")),
            on_leave=Count("id", filter=Q(status="leave")),
            clocked_out=Count("id", filter=Q(time_out__isnull=False)),
        )

        pending_leaves = scope_by_employee(
            LeaveRequest.objects.filter(is_deleted=False, status="pending"), user
        ).exclude(employee__user=user).count()

        latest_run = (
            PayrollRun.objects.filter(is_deleted=False, organization_id=user.organization_id)
            .annotate(total_net=Sum("payslips__net_pay"), payslip_count=Count("payslips"))
            .order_by("-period_start")
            .first()
        )

        departments = list(
            employees.values("department").annotate(count=Count("id")).order_by("-count")[:8]
        )

        data = {
            "today": today,
            "employees_total": employees.count(),
            "attendance_today": attendance_today,
            "pending_leaves": pending_leaves,
            "departments": departments,
            "latest_payroll": None,
        }
        if latest_run:
            data["latest_payroll"] = {
                "id": str(latest_run.id),
                "period_start": latest_run.period_start,
                "period_end": latest_run.period_end,
                "status": latest_run.status,
                "total_net": latest_run.total_net or 0,
                "payslip_count": latest_run.payslip_count,
            }
        if user.is_admin:
            data["accounts_by_role"] = {
                row["role"]: row["count"]
                for row in User.objects.filter(is_active=True, organization_id=user.organization_id).values("role").annotate(count=Count("id"))
            }
        return Response(data)
