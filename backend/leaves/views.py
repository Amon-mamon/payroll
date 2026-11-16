from datetime import timedelta

from django.db import transaction
from django.utils import timezone
from rest_framework import mixins, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from attendance.models import Attendance, AttendanceStatus
from common.mixins import EmployeeScopedMixin
from common.permissions import IsHRorAdmin
from common.scoping import org_employees

from .models import LeaveBalance, LeaveRequest, LeaveStatus, LeaveType
from .serializers import LeaveBalanceSerializer, LeaveRequestSerializer, LeaveTypeSerializer
from .services import WEEKDAY_CODES, ensure_leave_balances


class LeaveTypeViewSet(viewsets.ModelViewSet):
    serializer_class = LeaveTypeSerializer
    pagination_class = None

    def get_queryset(self):
        return LeaveType.objects.filter(is_deleted=False, organization_id=self.request.user.organization_id)

    def perform_create(self, serializer):
        serializer.save(organization=self.request.user.organization)

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [permissions.IsAuthenticated(), IsHRorAdmin()]
        return [permissions.IsAuthenticated()]

    def perform_destroy(self, instance):
        instance.soft_delete()


class LeaveBalanceViewSet(EmployeeScopedMixin, viewsets.ModelViewSet):
    serializer_class = LeaveBalanceSerializer
    filterset_fields = ["employee", "leave_type", "year"]

    def get_queryset(self):
        qs = LeaveBalance.objects.filter(is_deleted=False).select_related("employee", "leave_type")
        return self.scope(qs)

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated(), IsHRorAdmin()]

    def perform_destroy(self, instance):
        instance.soft_delete()

    @action(detail=False, methods=["post"])
    def generate_yearly(self, request):
        year = request.data.get("year")
        try:
            year = int(year)
        except (TypeError, ValueError):
            return Response({"detail": "A valid year is required."}, status=status.HTTP_400_BAD_REQUEST)

        employees = org_employees(request.user)
        created = sum(ensure_leave_balances(e, year) for e in employees)
        return Response({"detail": f"Generated {created} new leave balance(s) for {year}."})


class LeaveRequestViewSet(EmployeeScopedMixin, mixins.CreateModelMixin, mixins.ListModelMixin,
                          mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    serializer_class = LeaveRequestSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ["employee", "leave_type", "status"]
    search_fields = ["employee__first_name", "employee__last_name", "employee__employee_no"]
    ordering_fields = ["start_date", "created_at"]

    def get_queryset(self):
        qs = LeaveRequest.objects.filter(is_deleted=False).select_related(
            "employee", "employee__user", "leave_type", "approved_by"
        )
        return self.scope(qs)

    def _check_reviewer(self, request, leave_request):
        if leave_request.status != LeaveStatus.PENDING:
            return Response({"detail": "Only pending requests can be reviewed."}, status=status.HTTP_400_BAD_REQUEST)
        if leave_request.employee.user_id == request.user.id and not request.user.is_admin:
            return Response({"detail": "You cannot review your own leave request."}, status=status.HTTP_403_FORBIDDEN)
        return None

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated, IsHRorAdmin])
    def approve(self, request, pk=None):
        with transaction.atomic():
            leave_request = LeaveRequest.objects.select_for_update().get(pk=self.get_object().pk)
            denied = self._check_reviewer(request, leave_request)
            if denied:
                return denied

            if leave_request.leave_type.is_paid:
                balance = LeaveBalance.objects.select_for_update().filter(
                    employee=leave_request.employee,
                    leave_type=leave_request.leave_type,
                    year=leave_request.start_date.year,
                    is_deleted=False,
                ).first()
                if balance is None or balance.remaining < leave_request.days:
                    return Response({"detail": "Insufficient leave balance."}, status=status.HTTP_400_BAD_REQUEST)
                balance.used += leave_request.days
                balance.save(update_fields=["used", "updated_at"])

            leave_request.status = LeaveStatus.APPROVED
            leave_request.approved_by = request.user
            leave_request.approved_at = timezone.now()
            leave_request.save(update_fields=["status", "approved_by", "approved_at", "updated_at"])

            self._mark_attendance(leave_request)

        return Response(LeaveRequestSerializer(leave_request, context={"request": request}).data)

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated, IsHRorAdmin])
    def reject(self, request, pk=None):
        leave_request = self.get_object()
        denied = self._check_reviewer(request, leave_request)
        if denied:
            return denied

        leave_request.status = LeaveStatus.REJECTED
        leave_request.approved_by = request.user
        leave_request.approved_at = timezone.now()
        leave_request.save(update_fields=["status", "approved_by", "approved_at", "updated_at"])
        return Response(LeaveRequestSerializer(leave_request, context={"request": request}).data)

    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        leave_request = self.get_object()
        if leave_request.employee.user_id != request.user.id:
            return Response({"detail": "You can only cancel your own requests."}, status=status.HTTP_403_FORBIDDEN)
        if leave_request.status != LeaveStatus.PENDING:
            return Response({"detail": "Only pending requests can be cancelled."}, status=status.HTTP_400_BAD_REQUEST)
        leave_request.status = LeaveStatus.CANCELLED
        leave_request.save(update_fields=["status", "updated_at"])
        return Response(LeaveRequestSerializer(leave_request, context={"request": request}).data)

    @staticmethod
    def _mark_attendance(leave_request):
        """Record approved leave days in attendance (without overwriting real time logs)."""
        employee = leave_request.employee
        work_days = set(employee.work_days.split(","))
        current = leave_request.start_date
        while current <= leave_request.end_date:
            if WEEKDAY_CODES[current.weekday()] in work_days:
                record, created = Attendance.objects.get_or_create(
                    employee=employee,
                    date=current,
                    defaults={"status": AttendanceStatus.LEAVE, "notes": f"{leave_request.leave_type.name}"},
                )
                if not created and record.time_in is None:
                    record.status = AttendanceStatus.LEAVE
                    record.save(update_fields=["status", "updated_at"])
            current += timedelta(days=1)
