from rest_framework import serializers

from common.scoping import org_employees

from .models import Attendance
from .services import compute_hours


class AttendanceSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source="employee.full_name", read_only=True)
    employee_no = serializers.CharField(source="employee.employee_no", read_only=True)
    department = serializers.CharField(source="employee.department", read_only=True)

    class Meta:
        model = Attendance
        fields = [
            "id", "employee", "full_name", "employee_no", "department", "date",
            "time_in", "time_out", "worked_hours", "overtime_hours", "status", "notes",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "worked_hours", "overtime_hours", "created_at", "updated_at"]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get("request")
        if request is not None and request.user.is_authenticated:
            qs = org_employees(request.user)
            if not request.user.is_admin:
                qs = qs.filter(user__role="employee")
            self.fields["employee"].queryset = qs

    def validate(self, attrs):
        time_in = attrs.get("time_in", getattr(self.instance, "time_in", None))
        time_out = attrs.get("time_out", getattr(self.instance, "time_out", None))
        if time_out and not time_in:
            raise serializers.ValidationError({"time_in": "Time in is required when time out is set."})
        if time_in and time_out and time_out <= time_in:
            raise serializers.ValidationError({"time_out": "Time out must be after time in."})

        employee = attrs.get("employee", getattr(self.instance, "employee", None))
        day = attrs.get("date", getattr(self.instance, "date", None))
        if employee and day:
            dup = Attendance.objects.filter(employee=employee, date=day)
            if self.instance is not None:
                dup = dup.exclude(pk=self.instance.pk)
            if dup.exists():
                raise serializers.ValidationError({"date": "An attendance record already exists for this day."})
        return attrs

    def _apply_hours(self, validated_data, instance=None):
        employee = validated_data.get("employee", getattr(instance, "employee", None))
        time_in = validated_data.get("time_in", getattr(instance, "time_in", None))
        time_out = validated_data.get("time_out", getattr(instance, "time_out", None))
        worked, overtime = compute_hours(employee, time_in, time_out)
        validated_data["worked_hours"] = worked
        validated_data["overtime_hours"] = overtime

    def create(self, validated_data):
        self._apply_hours(validated_data)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        self._apply_hours(validated_data, instance)
        return super().update(instance, validated_data)
