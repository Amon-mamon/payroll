from django.conf import settings
from django.db import models

from common.models import BaseModel
from employees.models import Employee

class LeaveType(BaseModel):
    name = models.CharField(max_length=50, unique=True)
    code = models.CharField(max_length=10, unique=True)
    default_days_per_year = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    is_paid = models.BooleanField(default=True)
    
    class Meta(BaseModel.Meta):
        ordering = ["name"]
        
    def __str__(self):
        return f"{self.code} - {self.name}"
    

class LeaveBalance(BaseModel):
    employee = models.ForeignKey(Employee, on_delete=models.PROTECT, related_name="leave_balances")
    leave_type = models.ForeignKey(
        LeaveType, on_delete=models.PROTECT, related_name="balances"
    )
    year = models.PositiveIntegerField(
    help_text="Anniversary year label (based on employee's regularization date), not calendar year."
    )
    allocated = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    used = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    
    class Meta(BaseModel.Meta):
        ordering = ["-year", "leave_type__name"]
        constraints = [
            models.UniqueConstraint(
                fields=["employee", "leave_type", "year"],
                name="unique_balance_per_employee_type_year"
            )
        ]
    @property   
    def remaining(self):
        return self.allocated - self.used
    
    def __str__(self):
        return f"{self.employee.employee_no} {self.leave_type.code} {self.year}: {self.remaining}"
    

class LeaveStatus(models.TextChoices):
    PENDING = "pending", "Pending",
    APPROVED = "approved", "Approved",
    REJECTED = "rejected", "Rejected",
    CANCELLED = "cancelled", "Cancelled"
    
class LeaveRequest(BaseModel):
    employee = models.ForeignKey(
        Employee, on_delete=models.PROTECT, related_name="leave_requests"
    )
    leave_type = models.ForeignKey(
        LeaveType, on_delete=models.PROTECT, related_name = "requests"
    )
    start_date = models.DateField()
    end_date = models.DateField()
    days = models.DecimalField(max_digits=5, decimal_places=2)
    reason = models.TextField(blank=True)
    status = models.CharField(
        max_length=20,
        choices=LeaveStatus.choices,
        default=LeaveStatus.PENDING
    )
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="approved_leaves"
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    
    class Meta(BaseModel.Meta):
        ordering = ["-start_date"]
        constraints = [
            models.CheckConstraint(
                check=models.Q(end_date__gte=models.F("start_date")),
                name="leave_end_after_start",
            )
        ]
        
    def __str__(self):
        return f"{self.employee.employee_no} {self.leave_type.code} {self.start_date} => {self.end_date} ({self.status})"