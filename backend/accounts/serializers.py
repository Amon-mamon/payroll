from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import User


class UserSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()
    full_name = serializers.SerializerMethodField()
    employee_id = serializers.SerializerMethodField()
    organization = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id", "username", "email", "first_name", "last_name", "full_name",
            "role", "is_superuser", "is_active", "employee_id", "organization",
            "date_joined", "last_login",
        ]
        read_only_fields = fields

    def get_role(self, obj):
        return "admin" if obj.is_superuser else obj.role

    def get_full_name(self, obj):
        employee = getattr(obj, "employee", None)
        if employee is not None:
            return employee.full_name
        return obj.get_full_name() or obj.username

    def get_organization(self, obj):
        from organizations.serializers import OrganizationSummarySerializer

        return OrganizationSummarySerializer(obj.organization).data if obj.organization else None

    def get_employee_id(self, obj):
        employee = getattr(obj, "employee", None)
        return str(employee.id) if employee is not None and not employee.is_deleted else None


class UserStatusSerializer(serializers.ModelSerializer):
    """Admin-only: activate / deactivate an account."""

    class Meta:
        model = User
        fields = ["is_active"]


class LoginSerializer(TokenObtainPairSerializer):
    """Accepts either the username or the e-mail address in the `username` field."""

    def validate(self, attrs):
        identifier = (attrs.get(self.username_field) or "").strip()
        if "@" in identifier:
            user = User.objects.filter(email__iexact=identifier).only("username").first()
            if user is not None:
                identifier = user.username
        attrs[self.username_field] = identifier

        data = super().validate(attrs)
        data["user"] = UserSerializer(self.user).data
        return data
