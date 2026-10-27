from rest_framework import serializers
from .models import LeaveType, LeaveBalance, LeaveRequest

class LeaveTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeaveType
        fields = ["id", "name", "code", "default_days_per_year", "is_paid"]
        read_only_fields = ["id"]

class LeaveBalanceSerializer(serializers.ModelSerializer):
    remaining = serializers.DecimalField(max_digits=6, decimal_places=2, read_only=True)
    
    class Meta:
        model = LeaveBalance
        fields = ["id", "employee", "leave_type", "year", "allocated", "used", "remaining"]
        read_only_fields= ["id", "remaining"]
    
class LeaveRequestSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = LeaveRequest
        fields = ["id", "employee", "leave_type", "start_date", "end_date", "days", "reason", "status", "approved_by", "approved_at", "created_at", "updated_at"]
        read_only_fields = ["id", "status", "approved_by", "approved_at", "created_at", "updated_at"]
        
    def validate(self, attrs):
        start_date = attrs.get("start_date")
        end_date = attrs.get("end_date")
        if start_date and end_date and end_date < start_date:
            raise serializers.ValidationError({
                "end_date": "end_date must be on or after start_date"
            })

        if self.instance is None:
            employee = attrs.get("employee")
            leave_type = attrs.get("leave_type")
            days = attrs.get("days")
            start_date = attrs.get("start_date")
            
            if start_date and employee and leave_type and days is not None:
                year = start_date.year
                balance = LeaveBalance.objects.filter(
                    employee=employee, leave_type=leave_type, year=year
                ).first()
                
                if balance is None:
                    raise serializers.ValidationError({
                        "leave_type": "No leave balance for this employee/type/year"
                    })
                if balance.remaining < days:
                    raise serializers.ValidationError({
                        "days": "Insufficient leave balance."
                    })
        return attrs

    