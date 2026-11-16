from rest_framework import serializers

from common.scoping import visible_employees
from employees.models import Employee

from .models import LeaveBalance, LeaveRequest, LeaveStatus, LeaveType
from .services import count_leave_days


class LeaveTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeaveType
        fields = ["id", "name", "code", "default_days_per_year", "is_paid"]
        read_only_fields = ["id"]


class LeaveBalanceSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source="employee.full_name", read_only=True)
    leave_type_name = serializers.CharField(source="leave_type.name", read_only=True)
    leave_type_code = serializers.CharField(source="leave_type.code", read_only=True)
    remaining = serializers.DecimalField(max_digits=6, decimal_places=2, read_only=True)

    class Meta:
        model = LeaveBalance
        fields = [
            "id", "employee", "full_name", "leave_type", "leave_type_name", "leave_type_code",
            "year", "allocated", "used", "remaining",
        ]
        read_only_fields = ["id", "remaining"]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get("request")
        if request is not None and request.user.is_authenticated:
            self.fields["employee"].queryset = visible_employees(request.user)
            self.fields["leave_type"].queryset = LeaveType.objects.filter(
                organization_id=request.user.organization_id, is_deleted=False
            )


class LeaveRequestSerializer(serializers.ModelSerializer):
    employee = serializers.PrimaryKeyRelatedField(queryset=Employee.objects.none(), required=False)
    employee_name = serializers.CharField(source="employee.full_name", read_only=True)
    employee_no = serializers.CharField(source="employee.employee_no", read_only=True)
    leave_type_name = serializers.CharField(source="leave_type.name", read_only=True)
    approved_by_name = serializers.SerializerMethodField()

    class Meta:
        model = LeaveRequest
        fields = [
            "id", "employee", "employee_name", "employee_no", "leave_type", "leave_type_name",
            "start_date", "end_date", "days", "reason", "status",
            "approved_by", "approved_by_name", "approved_at", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "days", "status", "approved_by", "approved_at", "created_at", "updated_at"]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get("request")
        if request is not None and request.user.is_authenticated:
            # Only employees the requester is allowed to see can be targeted.
            self.fields["employee"].queryset = visible_employees(request.user)
            self.fields["leave_type"].queryset = LeaveType.objects.filter(
                organization_id=request.user.organization_id, is_deleted=False
            )

    def get_approved_by_name(self, obj):
        if not obj.approved_by:
            return None
        return obj.approved_by.get_full_name() or obj.approved_by.username

    def validate(self, attrs):
        request = self.context["request"]
        user = request.user

        employee = attrs.get("employee")
        if employee is None or not user.is_hr_or_admin:
            employee = Employee.objects.filter(user=user, is_deleted=False).first()
            if employee is None:
                raise serializers.ValidationError({"detail": "Your account has no employee profile."})
        attrs["employee"] = employee

        start_date = attrs["start_date"]
        end_date = attrs["end_date"]
        if end_date < start_date:
            raise serializers.ValidationError({"end_date": "End date must be on or after the start date."})
        if start_date.year != end_date.year:
            raise serializers.ValidationError({"end_date": "A leave request cannot span two years. Split it into two requests."})

        days = count_leave_days(employee, start_date, end_date)
        if days <= 0:
            raise serializers.ValidationError({"end_date": "The selected dates contain no scheduled work days."})
        attrs["days"] = days

        overlap = LeaveRequest.objects.filter(
            employee=employee,
            is_deleted=False,
            status__in=[LeaveStatus.PENDING, LeaveStatus.APPROVED],
            start_date__lte=end_date,
            end_date__gte=start_date,
        ).exists()
        if overlap:
            raise serializers.ValidationError({"start_date": "You already have a leave request covering these dates."})

        leave_type = attrs["leave_type"]
        if leave_type.is_paid:
            balance = LeaveBalance.objects.filter(
                employee=employee, leave_type=leave_type, year=start_date.year, is_deleted=False
            ).first()
            if balance is None:
                raise serializers.ValidationError({"leave_type": f"No {leave_type.name} balance for {start_date.year}."})
            if balance.remaining < days:
                raise serializers.ValidationError(
                    {"leave_type": f"Insufficient balance: {balance.remaining} day(s) left, {days} requested."}
                )
        return attrs
