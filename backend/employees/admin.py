from django.contrib import admin
from .models import Employee
# Register your models here.
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ["id", "user", "employee_no", "first_name", "last_name", "position", "department", "hire_date", "employment_type"]
    readonly_fields = ["id"]
admin.site.register(Employee, EmployeeAdmin)