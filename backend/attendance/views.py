from datetime import datetime
from django.utils import timezone
from rest_framework.decorators import action
from rest_framework import permissions, viewsets, status
from rest_framework.response import Response

from common.permissions import IsHRorAdmin
from employees.models import Employee
from .models import Attendance, AttendanceStatus
from .serializers import AttendanceSerializer


class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.filter(is_deleted=False).select_related("employee")
    serializer_class = AttendanceSerializer
    
    # Base permission: everyone must be logged in
    permission_classes = [permissions.IsAuthenticated]
    
    filterset_fields = ["employee", "status", "date"]
    ordering_fields = ["date", "worked_hours"]
    
    def get_queryset(self):
        qs = Attendance.objects.filter(is_deleted=False).select_related("employee")
        user = self.request.user

        # HR/Admin see all attendance records
        if user.is_superuser or user.groups.filter(name__in=["HR", "Admin"]).exists():
            return qs
            
        # Employees only see their own attendance
        return qs.filter(employee__user=user)

    def get_permissions(self):
        # Only HR/Admin can manually create, edit, or delete records.
        # Employees can only read their own records and use the custom 'clock' action.
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsHRorAdmin()]
        return [permissions.IsAuthenticated()]
    
    def perform_destroy(self, instance):
        instance.soft_delete()
        
    @action(detail=False, methods=["post"], permission_classes=[permissions.IsAuthenticated])
    def clock(self, request):
        user = request.user
        
        # 1. Make sure the user is actually an Employee
        try:
            employee = user.employee
        except Employee.DoesNotExist:
            return Response(
                {"detail": "You are not registered as an employee."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        today = timezone.localdate()
        now_time = timezone.localtime().time()
        action_type = request.data.get("action") # Expecting "in" or "out"

        if action_type not in ["in", "out"]:
            return Response({"detail": "Action must be 'in' or 'out'."}, status=status.HTTP_400_BAD_REQUEST)

        # 2. Find or create today's attendance record
        attendance, created = Attendance.objects.get_or_create(
            employee=employee,
            date=today,
            defaults={"status": AttendanceStatus.PRESENT}
        )

        # 3. Process Clock In
        if action_type == "in":
            if attendance.time_in:
                return Response({"detail": "You have already clocked in today."}, status=status.HTTP_400_BAD_REQUEST)
            
            attendance.time_in = now_time
            attendance.save()
            return Response({"detail": "Clocked in successfully.", "time": now_time})

        # 4. Process Clock Out
        if action_type == "out":
            if not attendance.time_in:
                return Response({"detail": "You must clock in first."}, status=status.HTTP_400_BAD_REQUEST)
            if attendance.time_out:
                return Response({"detail": "You have already clocked out today."}, status=status.HTTP_400_BAD_REQUEST)
            
            attendance.time_out = now_time
            
            # Manually calculate hours since we bypassed the serializer
            dt_in = datetime.combine(attendance.date, attendance.time_in)
            dt_out = datetime.combine(attendance.date, attendance.time_out)
            total_hours = (dt_out - dt_in).total_seconds() / 3600
            
            attendance.worked_hours = round(min(total_hours, 8), 2)
            attendance.overtime_hours = round(max(total_hours - 8, 0), 2)
            
            attendance.save()
            return Response({
                "detail": "Clocked out successfully.", 
                "time": now_time,
                "worked_hours": attendance.worked_hours,
                "overtime_hours": attendance.overtime_hours
            })