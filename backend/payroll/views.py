from django.db import transaction
from django.db.models import Count, Q, Sum
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from common.mixins import EmployeeScopedMixin
from common.permissions import IsAdmin, IsHRorAdmin
from common.scoping import org_employees

from .models import PayrollRun, Payslip
from .serializers import PayrollRunSerializer, PayslipSerializer
from .services import compute_employee_payslip

FINAL_STATUSES = ["approved", "paid", "locked"]


class PayrollRunViewSet(viewsets.ModelViewSet):
    """HR prepares and computes payroll runs; only admins approve and mark them paid."""

    serializer_class = PayrollRunSerializer
    permission_classes = [permissions.IsAuthenticated, IsHRorAdmin]
    filterset_fields = ["status"]
    ordering_fields = ["period_start", "created_at"]

    def get_queryset(self):
        return (
            PayrollRun.objects.filter(is_deleted=False, organization_id=self.request.user.organization_id)
            .select_related("created_by", "approved_by")
            .annotate(
                payslip_count=Count("payslips", filter=Q(payslips__is_deleted=False)),
                total_gross=Sum("payslips__gross_pay", filter=Q(payslips__is_deleted=False)),
                total_net=Sum("payslips__net_pay", filter=Q(payslips__is_deleted=False)),
            )
        )

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, organization=self.request.user.organization)

    def _require_draft(self, run, verb):
        if run.status != "draft":
            return Response({"detail": f"Only draft payrolls can be {verb}."}, status=status.HTTP_400_BAD_REQUEST)
        return None

    def update(self, request, *args, **kwargs):
        denied = self._require_draft(self.get_object(), "edited")
        return denied or super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        run = self.get_object()
        denied = self._require_draft(run, "deleted")
        if denied:
            return denied
        run.payslips.all().delete()
        run.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["post"])
    def compute(self, request, pk=None):
        run = self.get_object()
        denied = self._require_draft(run, "computed")
        if denied:
            return denied

        employees = org_employees(request.user).filter(user__is_active=True, hire_date__lte=run.period_end)
        with transaction.atomic():
            run.payslips.all().delete()
            payslips = [compute_employee_payslip(e, run) for e in employees]
            Payslip.objects.bulk_create(payslips)

        return Response({"detail": f"Computed {len(payslips)} payslip(s)."})

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated, IsAdmin])
    def approve(self, request, pk=None):
        run = self.get_object()
        denied = self._require_draft(run, "approved")
        if denied:
            return denied
        if not run.payslips.exists():
            return Response({"detail": "Compute the payroll before approving it."}, status=status.HTTP_400_BAD_REQUEST)

        run.status = "approved"
        run.approved_by = request.user
        run.save(update_fields=["status", "approved_by", "updated_at"])
        return Response({"detail": "Payroll run approved."})

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated, IsAdmin])
    def mark_paid(self, request, pk=None):
        run = self.get_object()
        if run.status != "approved":
            return Response({"detail": "Only approved payrolls can be marked as paid."}, status=status.HTTP_400_BAD_REQUEST)
        run.status = "paid"
        run.save(update_fields=["status", "updated_at"])
        return Response({"detail": "Payroll run marked as paid."})


class PayslipViewSet(EmployeeScopedMixin, viewsets.ReadOnlyModelViewSet):
    serializer_class = PayslipSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ["payroll_run", "employee"]
    search_fields = ["employee__first_name", "employee__last_name", "employee__employee_no"]

    def get_queryset(self):
        qs = Payslip.objects.filter(is_deleted=False, payroll_run__is_deleted=False).select_related(
            "payroll_run", "employee", "employee__user"
        )
        qs = self.scope(qs)

        user = self.request.user
        own_view = not user.is_hr_or_admin or self.request.query_params.get("mine") in ("1", "true", "True")
        if own_view:
            # Employees only see payslips once payroll has been approved.
            qs = qs.filter(payroll_run__status__in=FINAL_STATUSES)
        return qs.order_by("-payroll_run__period_start", "employee__last_name")
