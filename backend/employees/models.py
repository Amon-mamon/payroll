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
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="employee")
    employee_no = models.CharField(max_length=20, unique=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    position = models.CharField(max_length=100)
    department = models.CharField(max_length=100)
    hire_date = models.DateField()
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
    
    
    #scoped inside the model class
    #change the ordering of the default in basemodel
    class Meta(BaseModel.Meta):
        ordering = ["last_name", "first_name"]
        
    
    def __str__(self):
        return f"Employee: {self.employee_no} - {self.first_name} {self.last_name}"