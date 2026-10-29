from django.conf import settings
from django.db import models
from common.models import BaseModel
from employees.models import Employee


class DeductionTable(BaseModel):
    DEDUCTION_TYPES = [
        ("sss", "SSS"),
        ("philhealth", "PhilHealth"),
        ("pagibig", "Pag-IBIG"),
        ("tax", "BIR Tax"),
    ]
    type = models.CharField(max_length=20, choices=DEDUCTION_TYPES)
    effective_date = models.DateField(help_text="The date this rate takes effect")
    rules = models.JSONField(help_text="JSON representation of brackets/rates")

    class Meta(BaseModel.Meta):
        ordering = ["-effective_date"]

    def __str__(self):
        return f"{self.get_type_display()} - {self.effective_date}"

    
class PayrollRun(BaseModel):
    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("approved", "Approved"),
        ("paid", "Paid"),
        ("locked", "Locked"),
    ]
    period_start = models.DateField()
    period_end = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="draft")
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT
    )
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, blank=True, 
        related_name="approved_payrolls"
    )

    class Meta(BaseModel.Meta):
        ordering = ["-period_start"]

    def __str__(self):
        return f"Payroll {self.period_start} to {self.period_end} ({self.status})"


class Payslip(BaseModel):
    payroll_run = models.ForeignKey(PayrollRun, on_delete=models.CASCADE, related_name="payslips")
    employee = models.ForeignKey(Employee, on_delete=models.PROTECT, related_name="payslips")
    
    # Earnings
    basic_pay = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    overtime_pay = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    gross_pay = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Deductions
    sss_deduction = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    philhealth_deduction = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    pagibig_deduction = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax_deduction = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Final
    net_pay = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    class Meta(BaseModel.Meta):
        ordering = ["employee__last_name", "employee__first_name"]
        constraints = [
            models.UniqueConstraint(
                fields=["payroll_run", "employee"], 
                name="unique_payslip_per_run"
            )
        ]

    def __str__(self):
        return f"Payslip: {self.employee.last_name} - {self.payroll_run.period_start}"