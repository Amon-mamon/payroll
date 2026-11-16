from rest_framework import serializers

from .models import DeductionTable, PayrollRun, Payslip


def _name(user):
    if user is None:
        return None
    return user.get_full_name() or user.username


class DeductionTableSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeductionTable
        fields = ["id", "type", "effective_date", "rules"]
        read_only_fields = ["id"]


class PayrollRunSerializer(serializers.ModelSerializer):
    created_by_name = serializers.SerializerMethodField()
    approved_by_name = serializers.SerializerMethodField()
    payslip_count = serializers.IntegerField(read_only=True, default=0)
    total_gross = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True, default=0)
    total_net = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True, default=0)

    class Meta:
        model = PayrollRun
        fields = [
            "id", "period_start", "period_end", "status",
            "created_by", "created_by_name", "approved_by", "approved_by_name",
            "payslip_count", "total_gross", "total_net",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "status", "created_by", "approved_by", "created_at", "updated_at"]

    def get_created_by_name(self, obj):
        return _name(obj.created_by)

    def get_approved_by_name(self, obj):
        return _name(obj.approved_by)

    def validate(self, attrs):
        start = attrs.get("period_start", getattr(self.instance, "period_start", None))
        end = attrs.get("period_end", getattr(self.instance, "period_end", None))
        if start and end and end < start:
            raise serializers.ValidationError({"period_end": "Period end must be on or after period start."})
        if start and end:
            overlap = PayrollRun.objects.filter(
                is_deleted=False,
                organization_id=self.context["request"].user.organization_id,
                period_start__lte=end,
                period_end__gte=start,
            )
            if self.instance is not None:
                overlap = overlap.exclude(pk=self.instance.pk)
            if overlap.exists():
                raise serializers.ValidationError({"period_start": "This period overlaps an existing payroll run."})
        return attrs


class PayslipSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source="employee.full_name", read_only=True)
    employee_no = serializers.CharField(source="employee.employee_no", read_only=True)
    department = serializers.CharField(source="employee.department", read_only=True)
    position = serializers.CharField(source="employee.position", read_only=True)
    period_start = serializers.DateField(source="payroll_run.period_start", read_only=True)
    period_end = serializers.DateField(source="payroll_run.period_end", read_only=True)
    run_status = serializers.CharField(source="payroll_run.status", read_only=True)
    total_deductions = serializers.SerializerMethodField()

    class Meta:
        model = Payslip
        fields = [
            "id", "payroll_run", "period_start", "period_end", "run_status",
            "employee", "employee_name", "employee_no", "department", "position",
            "days_present", "days_on_leave", "days_absent", "overtime_hours",
            "basic_pay", "absence_deduction", "overtime_pay", "gross_pay",
            "sss_deduction", "philhealth_deduction", "pagibig_deduction", "tax_deduction",
            "total_deductions", "net_pay", "created_at",
        ]
        read_only_fields = fields

    def get_total_deductions(self, obj):
        total = obj.sss_deduction + obj.philhealth_deduction + obj.pagibig_deduction + obj.tax_deduction
        return f"{total:.2f}"
