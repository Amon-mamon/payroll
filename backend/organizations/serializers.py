from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.db import transaction
from django.utils import timezone
from rest_framework import serializers

from accounts.models import Role
from employees.models import Employee
from leaves.services import ensure_leave_balances, seed_leave_types

from .models import BillingCycle, Organization
from .plans import PLAN_CHOICES, PLANS, plan_price

User = get_user_model()


class OrganizationSerializer(serializers.ModelSerializer):
    plan_name = serializers.SerializerMethodField()
    effective_status = serializers.CharField(read_only=True)
    has_access = serializers.BooleanField(read_only=True)
    access_ends_at = serializers.DateTimeField(read_only=True)
    max_employees = serializers.IntegerField(read_only=True)
    seats_used = serializers.SerializerMethodField()
    price = serializers.SerializerMethodField()

    class Meta:
        model = Organization
        fields = [
            "id", "name", "slug", "plan", "plan_name", "billing_cycle", "price",
            "status", "effective_status", "has_access", "access_ends_at",
            "trial_ends_at", "current_period_end", "cancel_at_period_end",
            "max_employees", "seats_used", "created_at",
        ]
        read_only_fields = [f for f in fields if f != "name"]

    def get_plan_name(self, obj):
        return PLANS[obj.plan]["name"]

    def get_seats_used(self, obj):
        return obj.seats_used()

    def get_price(self, obj):
        return str(plan_price(obj.plan, obj.billing_cycle))


class OrganizationSummarySerializer(serializers.ModelSerializer):
    """Compact version embedded in /auth/me/ and login responses."""

    effective_status = serializers.CharField(read_only=True)
    has_access = serializers.BooleanField(read_only=True)
    access_ends_at = serializers.DateTimeField(read_only=True)

    class Meta:
        model = Organization
        fields = ["id", "name", "plan", "status", "effective_status", "has_access", "access_ends_at"]
        read_only_fields = fields


class SubscriptionActionSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=["activate", "change_plan", "cancel", "resume"])
    plan = serializers.ChoiceField(choices=PLAN_CHOICES, required=False)
    billing_cycle = serializers.ChoiceField(choices=BillingCycle.choices, required=False)


class SignupSerializer(serializers.Serializer):
    """Creates a company (on a free trial), its first admin account and that admin's profile."""

    company_name = serializers.CharField(max_length=150)
    plan = serializers.ChoiceField(choices=PLAN_CHOICES)
    billing_cycle = serializers.ChoiceField(choices=BillingCycle.choices, default=BillingCycle.MONTHLY)
    first_name = serializers.CharField(max_length=100)
    last_name = serializers.CharField(max_length=100)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    position = serializers.CharField(max_length=100, required=False, allow_blank=True)

    def validate_email(self, value):
        value = value.strip().lower()
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("An account with this email already exists. Sign in instead.")
        return value

    def validate_company_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Company name is required.")
        return value

    def validate(self, attrs):
        validate_password(
            attrs["password"],
            User(email=attrs["email"], first_name=attrs["first_name"], last_name=attrs["last_name"]),
        )
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        org = Organization.start_trial(
            name=validated_data["company_name"],
            plan=validated_data["plan"],
            billing_cycle=validated_data["billing_cycle"],
        )
        user = User.objects.create_user(
            username=validated_data["email"],
            email=validated_data["email"],
            password=validated_data["password"],
            first_name=validated_data["first_name"],
            last_name=validated_data["last_name"],
            role=Role.ADMIN,
            organization=org,
        )
        seed_leave_types(org)
        employee = Employee.objects.create(
            organization=org,
            user=user,
            employee_no=f"EMP-{timezone.localdate().year}-0001",
            first_name=validated_data["first_name"],
            last_name=validated_data["last_name"],
            position=validated_data.get("position") or "Administrator",
            department="Management",
            hire_date=timezone.localdate(),
            basic_salary=0,
        )
        ensure_leave_balances(employee, timezone.localdate().year)
        return user
