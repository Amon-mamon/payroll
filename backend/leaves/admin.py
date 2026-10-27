from django.contrib import admin
from .models import LeaveType, LeaveBalance, LeaveRequest
# Register your models here.

class LeaveTypeAdmin(admin.ModelAdmin):
    list_display=["id", "name", "code"]
    readonly_fields=["id", "code"]
admin.site.register(LeaveType, LeaveTypeAdmin)
    
class LeaveBalancesAdmin(admin.ModelAdmin):
    list_display = ["id", "employee", "leave_type", "used", "allocated"]
    readonly_fields=["id"]
admin.site.register(LeaveBalance, LeaveBalancesAdmin)


class LeaveRequestAdmin(admin.ModelAdmin):
    list_display = ["id", "employee", "leave_type", "start_date", "end_date", "days", "status", "approved_by"]
    readonly_fields=["id"]
admin.site.register(LeaveRequest, LeaveRequestAdmin)


