from django.contrib import admin
from .models import Attendance
# Register your models here.

class AttendanceAdmin(admin.ModelAdmin):
    list_display = ["id", "employee", "date", "time_in", "time_out", "status"]
    readonly_fields=["id"]
admin.site.register(Attendance, AttendanceAdmin)