from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.utils import timezone
from employees.models import Employee
from common.permissions import IsHRorAdmin
from .models import PayrollRun, Payslip
from .serializers import PayrollRunSerializer, PayslipSerializer, DeductionTableSerializer
from .services import compute_employee_payslip


class PayrollRunViewSet(viewsets.ModelViewSet):
    queryset = PayrollRun.objects.filter(is_deleted=False)
    serializer_class = PayrollRunSerializer
    permission_classes = [permissions.IsAuthenticated, IsHRorAdmin]
    filterset_fields = ["status"]
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
                
    @action(detail=True, methods=["post"])
    def compute(self, request, pk=None):
        payroll_run = self.get_object()
        
        if payroll_run.status != "draft":
            return Response(
                {"detail" : "Only draft payrolls can be computed."}, 
                status=status.HTTP_400_BAD_REQUEST  # Fixed typo here
            )
            
        payroll_run.payslips.all().delete()
        
        employees = Employee.objects.filter(is_deleted=False)
        payslips = []
        
        for employee in employees:
            payslip = compute_employee_payslip(employee, payroll_run)
            payslips.append(payslip)
        
        Payslip.objects.bulk_create(payslips)
        
        return Response({
            "detail": f"Successfully computed {len(payslips)} payslips."
        })
        
    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        payroll_run = self.get_object()
        
        if payroll_run.status != "draft":
            return Response(
                {"detail": "Only draft payrolls can be approved."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        payroll_run.status = "approved"
        payroll_run.approved_by = request.user
        payroll_run.save(update_fields=["status", "approved_by", "updated_at"])
        
        return Response({
            "detail": "Payroll run approved successfully."
        })


class PayslipViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = PayslipSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ["payroll_run", "employee"]

    def get_queryset(self):
        qs = Payslip.objects.filter(is_deleted=False).select_related("payroll_run", "employee")
        user = self.request.user
        
        if user.is_superuser or user.groups.filter(name__in=["HR", "Admin"]).exists():
            return qs
            
        return qs.filter(employee__user=user)