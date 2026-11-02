from rest_framework import serializers
from .models import LeaveType, LeaveBalance, LeaveRequest

class LeaveTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeaveType
        fields = ["id", "name", "code", "default_days_per_year", "is_paid"]
        read_only_fields = ["id"]

class LeaveBalanceSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    leave_type_name = serializers.CharField(source="leave_type.name", read_only=True)
    remaining = serializers.DecimalField(max_digits=6, decimal_places=2, read_only=True)
    
    class Meta:
        model = LeaveBalance
        fields = ["id", "employee", "full_name", "remaining", "leave_type_name", "leave_type", "year", "allocated", "used", "remaining"]
        read_only_fields= ["id", "remaining"]
            
    def get_full_name(self, obj):
        # Access via the Employee relation
        return f"{obj.employee.first_name} {obj.employee.last_name}"
    
class LeaveRequestSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source="employee.full_name", read_only=True)
    leave_type_name = serializers.CharField(source="leave_type.name", read_only=True)

    class Meta:
        model = LeaveRequest
        fields = [
            "id", "employee", "employee_name", "leave_type", "leave_type_name",
            "start_date", "end_date", "days", "reason", "status", 
            "approved_by", "approved_at", "created_at", "updated_at"
        ]
        read_only_fields = ["id", "status", "approved_by", "approved_at", "created_at", "updated_at"]

    # ... keep your existing validate method ...
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

    