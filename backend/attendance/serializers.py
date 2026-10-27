from datetime import datetime, timedelta
from rest_framework import serializers
from .models import Attendance


STANDARD_WORK_HOURS = 8

class AttendanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attendance
        fields = ["id", "employee", "date", "time_in", "time_out", "worked_hours", "overtime_hours", "status", "notes", "created_at", "updated_at"]
        read_only_fields = ["id", "worked_hours", "overtime_hours", "created_at", "updated_at"]
        
    
    def _compute_hours(self, data):
        time_in = data.get("time_in")
        time_out = data.get("time_out")
        
        if not (time_in and time_out):
            return 0, 0
        
        dt_in = datetime.combine(datetime(2000, 1, 1). date(), time_in)
        dt_out = datetime.combine(datetime(2000, 1, 1). date(), time_out)
        total_hours = (dt_out - dt_in).total_seconds() / 3600
        
        worked = min(total_hours, STANDARD_WORK_HOURS)
        overtime = max(total_hours - STANDARD_WORK_HOURS, 0)
        return round(worked, 2), round(overtime, 2)
    
    def validate(self, attrs):
        time_in = attrs.get("time_in")
        time_out = attrs.get("time_out")
        if time_in and time_out and time_out <= time_in:
            raise serializers.ValidationError({
                "time_out": "time_out must be after time_in."
            })
        return attrs
            
    def create(self, validated_data):
        worked, overtime = self._compute_hours(validated_data)
        validated_data["worked_hours"] = worked
        validated_data["overtime_hours"] = overtime
        return Attendance.objects.create(**validated_data)
    
    def update(self, instance, validated_data):
        merged = {**instance.__dict__, **validated_data}
        worked, overtime = self._compute_hours(merged)
        validated_data["worked_hours"] = worked
        validated_data["overtime_hours"] = overtime
        return super().update(instance, validated_data)
    
    
