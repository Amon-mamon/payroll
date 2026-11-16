from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.db import transaction
from django.utils import timezone
from rest_framework import serializers

from accounts.models import Role

from .models import Employee

User = get_user_model()

DAY_CODES = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]


def next_employee_no(organization):
    year = timezone.localdate().year
    prefix = f"EMP-{year}-"
    last = (
        Employee.objects.filter(organization=organization, employee_no__startswith=prefix)
        .order_by("-employee_no")
        .values_list("employee_no", flat=True)
        .first()
    )
    seq = int(last.rsplit("-", 1)[1]) + 1 if last and last.rsplit("-", 1)[1].isdigit() else 1
    return f"{prefix}{seq:04d}"


class EmployeeSerializer(serializers.ModelSerializer):
    # Account fields (stored on the linked User)
    email = serializers.EmailField(source="user.email")
    role = serializers.ChoiceField(choices=Role.choices, source="user.role", default=Role.EMPLOYEE)
    password = serializers.CharField(write_only=True, required=False, min_length=8, style={"input_type": "password"})
    is_active = serializers.BooleanField(source="user.is_active", read_only=True)
    user_id = serializers.IntegerField(source="user.id", read_only=True)
    full_name = serializers.CharField(read_only=True)
    employee_no = serializers.CharField(required=False, allow_blank=True, max_length=20)

    class Meta:
        model = Employee
        fields = [
            "id", "user_id", "employee_no", "first_name", "last_name", "full_name",
            "email", "role", "password", "is_active",
            "position", "department", "hire_date", "regularization_date",
            "employment_type", "basic_salary",
            "sss_no", "philhealth_no", "pagibig_no", "tin", "bank_account",
            "shift_start", "shift_end", "work_days", "grace_minutes",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    # ---- validation -------------------------------------------------------

    def validate_email(self, value):
        value = value.strip().lower()
        qs = User.objects.filter(email__iexact=value)
        if self.instance is not None:
            qs = qs.exclude(pk=self.instance.user_id)
        if qs.exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return value

    def validate_employee_no(self, value):
        value = (value or "").strip()
        if not value:
            return value
        qs = Employee.objects.filter(
            organization_id=self.context["request"].user.organization_id, employee_no=value
        )
        if self.instance is not None:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("This employee number is already used.")
        return value

    def validate_work_days(self, value):
        days = [d.strip().lower() for d in value.split(",") if d.strip()]
        invalid = [d for d in days if d not in DAY_CODES]
        if invalid:
            raise serializers.ValidationError(f"Invalid day code(s): {', '.join(invalid)}")
        if not days:
            raise serializers.ValidationError("At least one work day is required.")
        # Keep canonical order
        return ",".join(d for d in DAY_CODES if d in days)

    def validate(self, attrs):
        request = self.context["request"]
        actor = request.user
        user_data = attrs.get("user", {})
        requested_role = user_data.get("role")

        # Role-based account rules
        if requested_role is not None:
            current_role = self.instance.user.role if self.instance is not None else None
            if requested_role != current_role:
                if not actor.is_admin and requested_role != Role.EMPLOYEE:
                    raise serializers.ValidationError({"role": "HR can only create employee accounts."})
                if requested_role == Role.ADMIN:
                    raise serializers.ValidationError({"role": "Admin accounts cannot be created here."})
                if current_role == Role.ADMIN or (self.instance is not None and self.instance.user_id == actor.id):
                    raise serializers.ValidationError({"role": "This account's role cannot be changed."})

        if self.instance is None:
            org = actor.organization
            if org.seats_used() >= org.max_employees:
                raise serializers.ValidationError({
                    "detail": f"Your {org.plan_info['name']} plan allows {org.max_employees} employees. "
                              "Upgrade your plan to add more."
                })

        if self.instance is None and not attrs.get("password"):
            raise serializers.ValidationError({"password": "A password is required for new accounts."})

        if attrs.get("password"):
            validate_password(attrs["password"])

        shift_start = attrs.get("shift_start", getattr(self.instance, "shift_start", None))
        shift_end = attrs.get("shift_end", getattr(self.instance, "shift_end", None))
        if shift_start and shift_end and shift_end <= shift_start:
            raise serializers.ValidationError({"shift_end": "Shift end must be after shift start."})

        return attrs

    # ---- persistence ------------------------------------------------------

    @transaction.atomic
    def create(self, validated_data):
        organization = self.context["request"].user.organization
        user_data = validated_data.pop("user")
        password = validated_data.pop("password")
        email = user_data["email"]

        user = User.objects.create_user(
            username=email,
            email=email,
            password=password,
            first_name=validated_data.get("first_name", ""),
            last_name=validated_data.get("last_name", ""),
            role=user_data.get("role", Role.EMPLOYEE),
            organization=organization,
        )
        if not validated_data.get("employee_no"):
            validated_data["employee_no"] = next_employee_no(organization)

        employee = Employee.objects.create(user=user, organization=organization, **validated_data)

        # Give new hires their leave balances for the current year
        from leaves.services import ensure_leave_balances
        ensure_leave_balances(employee, timezone.localdate().year)
        return employee

    @transaction.atomic
    def update(self, instance, validated_data):
        user_data = validated_data.pop("user", {})
        password = validated_data.pop("password", None)
        if "employee_no" in validated_data and not validated_data["employee_no"]:
            validated_data.pop("employee_no")

        user = instance.user
        if "email" in user_data and user_data["email"] != user.email:
            # Accounts created here use the email as username; keep them in sync.
            if user.username == user.email:
                user.username = user_data["email"]
            user.email = user_data["email"]
        if "role" in user_data and not user.is_superuser:
            user.role = user_data["role"]
        if password:
            user.set_password(password)
        user.first_name = validated_data.get("first_name", instance.first_name)
        user.last_name = validated_data.get("last_name", instance.last_name)
        user.save()

        return super().update(instance, validated_data)
