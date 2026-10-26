from django.db import models

# Create your models here.
from common.models import BaseModel
from employees.models import Employee


""" 
    STATUS CHOICES
"""
class AttendanceStatus(models.TextChoices):
    PRESENT = "present", "Present"
    LATE = "late", "Late"
    ABSENT = "absent", "Absent"
    LEAVE = "leave", "Leave"
    HOLIDAY = "holiday", "Holiday"
    
class Attendance(BaseModel):
    employee = models.ForeignKey(Employee, on_delete=models.PROTECT, related_name="attendance")
    date = models.DateField()
    time_in = models.TimeField(null=True, blank=True)
    time_out = models.TimeField(null=True, blank=True)
    worked_hours = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    overtime_hours = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    status = models.CharField(
        max_length=20,
        choices=AttendanceStatus.choices,
        default=AttendanceStatus.PRESENT
    )
    notes = models.TextField(blank=True)
    
    class Meta(BaseModel.Meta):
        ordering=["-date"]
        constraints = [
            models.UniqueConstraint(
                fields=["employee", "date"],
                name="unique_attendance_per_employee_per_day",
            )
        ]
        
    def __str__(self):
        return f"{self.employee.employee_no} - {self.date} ({self.status})"