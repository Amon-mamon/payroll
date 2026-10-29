from django.contrib import admin
from .models import PayrollRun, Payslip

@admin.register(PayrollRun)
class PayrollAdmin(admin.ModelAdmin):
    list_display = ["id", "period_start", "period_end", "status", "created_by", "approved_by"]
    readonly_fields = ["id"]


@admin.register(Payslip)
class PayslipAdmin(admin.ModelAdmin):
    list_display = ["id", "employee", "payroll_run", "basic_pay", "overtime_pay", "gross_pay", "sss_deduction", "philhealth_deduction", "pagibig_deduction", "tax_deduction", "net_pay" ]
    readonly_fields = ["id", "employee", "payroll_run", "basic_pay", "overtime_pay", "gross_pay", "sss_deduction", "philhealth_deduction", "pagibig_deduction", "tax_deduction", "net_pay" ]