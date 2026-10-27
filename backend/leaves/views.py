from django.utils import timezone
from rest_framework.response import Response
from rest_framework import status
from rest_framework import permissions
from rest_framework import viewsets
from rest_framework.decorators import action
from .serializers import LeaveTypeSerializer, LeaveBalanceSerializer, LeaveRequestSerializer
from .models import LeaveType, LeaveBalance, LeaveRequest, LeaveStatus
from common.permissions import IsHRorAdmin
class LeaveTypeViewSet(viewsets.ModelViewSet):
    queryset = LeaveType.objects.filter(is_deleted=False)
    
    serializer_class = LeaveTypeSerializer
    permission_classes = [permissions.IsAuthenticated, IsHRorAdmin]
    
    def perform_destroy(self, instance):
        instance.soft_delete()
        
class LeaveBalanceViewSet(viewsets.ModelViewSet):
    queryset = LeaveBalance.objects.filter(is_deleted=False).select_related("employee", "leave_type")
    serializer_class = LeaveBalanceSerializer
    
    permission_classes = [permissions.IsAuthenticated, IsHRorAdmin]
    
    filterset_fields = ["id","employee", "leave_type", "year"]
    
    def perform_destroy(self, instance):
        instance.soft_delete()
        
        
class LeaveRequestViewSet(viewsets.ModelViewSet):
    serializer_class = LeaveRequestSerializer
    
    permission_classes= [permissions.IsAuthenticated]
    filterset_fields = ["employee", "leave_type", "status"]
    
    def perform_destroy(self, instance):
        instance.soft_delete()
    
    @action(detail=True, methods=["post"], permission_classes=[IsHRorAdmin])
    def approve(self, request, pk=None):
        leave_request = self.get_object()
        
        if leave_request.status != LeaveStatus.PENDING:
            return Response({
                "detail": "Only pending requests can be approved"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        leave_request.status = LeaveStatus.APPROVED
        leave_request.approved_by = request.user
        leave_request.approved_at = timezone.now()
        leave_request.save(update_fields=[
            "status", "approved_by", "approved_at", "updated_at",
        ])
        
        balance = LeaveBalance.objects.filter(
            employee=leave_request.employee,
            leave_type=leave_request.leave_type,
            year = leave_request.start_date.year,
        ).first()
        
        if balance:
            balance.used += leave_request.days
            balance.save(update_fields=["used", "updated_at"])
            
        return Response(LeaveRequestSerializer(leave_request).data)
    
    def get_queryset(self):
        qs = LeaveRequest.objects.filter(is_deleted=False).select_related("employee", "leave_type", "approved_by")
        
        user = self.request.user
        if user.is_superuser or user.groups.filter(name__in=["HR", "Admin"]).exists():
            return qs
        return qs.filter(employee__user = user)
    
    @action(detail=True, methods=["post"], permission_classes=[IsHRorAdmin])
    def reject(self, request, pk=None):
        leave_request = self.get_object()
        
        if leave_request.status != LeaveStatus.PENDING:
            return Response({
                "detail": "Only pending requests can be rejected."
            }, status=status.HTTP_400_BAD_REQUEST)
        
        leave_request.status = LeaveStatus.REJECTED
        leave_request.approved_by = request.user
        leave_request.approved_at = timezone.now()
        leave_request.save(update_fields=[
            "status", "approved_by", "approved_at", "updated_at"
        ])
        
        return Response(LeaveRequestSerializer(leave_request).data)