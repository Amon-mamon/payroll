from rest_framework import viewsets
from rest_framework import permissions
from common.permissions import IsHRorAdmin
from .models import Attendance
from .serializers import AttendanceSerializer


class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.filter(is_deleted=False).select_related("employee")
    serializer_class = AttendanceSerializer
    permission_classes = [permissions.IsAuthenticated, IsHRorAdmin]
    
    filterset_fields = ["employee", "status", "date"]
    ordering_fields = ["date", "worked_hours"]
    
    def perform_destroy(self, instance):
        instance.soft_delete()
        