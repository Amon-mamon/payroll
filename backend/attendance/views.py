from django.utils import timezone
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from common.mixins import EmployeeScopedMixin
from common.permissions import IsHRorAdmin
from employees.models import Employee

from .models import Attendance, AttendanceStatus
from .serializers import AttendanceSerializer
from .services import compute_hours, is_late


class AttendanceViewSet(EmployeeScopedMixin, viewsets.ModelViewSet):
    serializer_class = AttendanceSerializer
    filterset_fields = {
        "employee": ["exact"],
        "status": ["exact"],
        "date": ["exact", "gte", "lte"],
    }
    search_fields = ["employee__first_name", "employee__last_name", "employee__employee_no"]
    ordering_fields = ["date", "worked_hours", "time_in"]

    def get_queryset(self):
        qs = Attendance.objects.filter(is_deleted=False).select_related("employee", "employee__user")
        return self.scope(qs)

    def get_permissions(self):
        # Only HR/Admin can manually create, edit or delete records.
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [permissions.IsAuthenticated(), IsHRorAdmin()]
        return [permissions.IsAuthenticated()]

    def _forbid_own_edit(self, employee):
        user = self.request.user
        if not user.is_admin and employee.user_id == user.id:
            return Response({"detail": "You cannot edit your own attendance."}, status=status.HTTP_403_FORBIDDEN)
        return None

    def update(self, request, *args, **kwargs):
        denied = self._forbid_own_edit(self.get_object().employee)
        return denied or super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        denied = self._forbid_own_edit(self.get_object().employee)
        return denied or super().destroy(request, *args, **kwargs)

    def perform_destroy(self, instance):
        # Hard delete: the (employee, date) unique constraint would otherwise
        # block re-creating the day's record.
        instance.delete()

    def _own_employee(self, request):
        return Employee.objects.filter(user=request.user, is_deleted=False).first()

    @action(detail=False, methods=["get"])
    def today(self, request):
        employee = self._own_employee(request)
        if employee is None:
            return Response({"detail": "Your account has no employee profile."}, status=status.HTTP_404_NOT_FOUND)
        record = Attendance.objects.filter(employee=employee, date=timezone.localdate(), is_deleted=False).first()
        return Response({
            "record": AttendanceSerializer(record, context={"request": request}).data if record else None,
            "schedule": {
                "shift_start": employee.shift_start,
                "shift_end": employee.shift_end,
                "work_days": employee.work_days,
                "grace_minutes": employee.grace_minutes,
            },
            "server_time": timezone.localtime().isoformat(),
        })

    @action(detail=False, methods=["post"])
    def clock(self, request):
        employee = self._own_employee(request)
        if employee is None:
            return Response({"detail": "Your account has no employee profile."}, status=status.HTTP_400_BAD_REQUEST)

        action_type = request.data.get("action")
        if action_type not in ["in", "out"]:
            return Response({"detail": "Action must be 'in' or 'out'."}, status=status.HTTP_400_BAD_REQUEST)

        today = timezone.localdate()
        now_time = timezone.localtime().time().replace(microsecond=0)

        if action_type == "in":
            attendance, _ = Attendance.objects.get_or_create(employee=employee, date=today)
            if attendance.time_in:
                return Response({"detail": "You have already clocked in today."}, status=status.HTTP_400_BAD_REQUEST)
            attendance.time_in = now_time
            attendance.is_deleted = False
            attendance.status = AttendanceStatus.LATE if is_late(employee, now_time) else AttendanceStatus.PRESENT
            attendance.save()
            message = "Clocked in successfully."
        else:
            attendance = Attendance.objects.filter(employee=employee, date=today, is_deleted=False).first()
            if attendance is None or not attendance.time_in:
                return Response({"detail": "You must clock in first."}, status=status.HTTP_400_BAD_REQUEST)
            if attendance.time_out:
                return Response({"detail": "You have already clocked out today."}, status=status.HTTP_400_BAD_REQUEST)
            attendance.time_out = now_time
            attendance.worked_hours, attendance.overtime_hours = compute_hours(employee, attendance.time_in, now_time)
            attendance.save()
            message = "Clocked out successfully."

        return Response({
            "detail": message,
            "record": AttendanceSerializer(attendance, context={"request": request}).data,
        })
