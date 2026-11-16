import datetime

from django.conf import settings
from django.db import models
from common.models import BaseModel
# Create your models here.


""" 
    EMPLOYMENT TYPE
"""

class EmploymentType(models.TextChoices):
    REGULAR = "regular", "Regular"
    PROBATIONARY = "probationary", "Probationary"
    CONTRACTUAL = "contractual", "Contractual"

class Employee(BaseModel):
    organization = models.ForeignKey(
        "organizations.Organization", on_delete=models.PROTECT, null=True, related_name="employees"
    )
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="employee")
    employee_no = models.CharField(max_length=20)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    position = models.CharField(max_length=100)
    department = models.CharField(max_length=100)
    hire_date = models.DateField()
    regularization_date = models.DateField(null=True, blank=True)
    employment_type = models.CharField(
        max_length=20,
        choices=EmploymentType.choices,
        default=EmploymentType.REGULAR
    )
    basic_salary = models.DecimalField(max_digits=12, decimal_places=2)
    sss_no = models.CharField(max_length=20, blank=True)
    philhealth_no = models.CharField(max_length=20, blank=True)
    pagibig_no = models.CharField(max_length=20, blank=True)
    tin = models.CharField(max_length=20, blank=True)
    bank_account = models.CharField(max_length=50, blank=True)

    # Work schedule
    shift_start = models.TimeField(default=datetime.time(8, 0))
    shift_end = models.TimeField(default=datetime.time(17, 0))
    work_days = models.CharField(
        max_length=50,
        default="mon,tue,wed,thu,fri",
        help_text="Comma separated day codes: mon,tue,wed,thu,fri,sat,sun",
    )
    grace_minutes = models.PositiveSmallIntegerField(
        default=15, help_text="Minutes after shift start before a time-in counts as late."
    )
    
    
    #scoped inside the model class
    #change the ordering of the default in basemodel
    class Meta(BaseModel.Meta):
        ordering = ["last_name", "first_name"]
        constraints = [
            models.UniqueConstraint(fields=["organization", "employee_no"], name="unique_employee_no_per_org"),
        ]
        
    
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip()

    def __str__(self):
        return f"Employee: {self.employee_no} - {self.first_name} {self.last_name}"