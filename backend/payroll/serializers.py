from rest_framework import serializers
from .models import PayrollRun, Payslip, DeductionTable

class DeductionTableSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeductionTable
        fields = ["id", "type", "effective_date", "rules"]
        read_only_fields = ["id"]

class PayrollRunSerializer(serializers.ModelSerializer):
    class Meta:
        model = PayrollRun
        fields = [
            "id", "period_start", "period_end", "status", 
            "created_by", "approved_by", "created_at", "updated_at"
        ]
        # The API shouldn't let users manually set who created/approved it.
        read_only_fields = ["id", "status", "created_by", "approved_by", "created_at", "updated_at"]

class PayslipSerializer(serializers.ModelSerializer):
    employee_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Payslip
        fields = [
            "id", "payroll_run", "employee", "employee_name", 
            "basic_pay", "overtime_pay", "gross_pay", 
            "sss_deduction", "philhealth_deduction", "pagibig_deduction", "tax_deduction", 
            "net_pay", "created_at"
        ]
        read_only_fields = ["id", "created_at"]

    def get_employee_name(self, obj):
        return f"{obj.employee.first_name} {obj.employee.last_name}"