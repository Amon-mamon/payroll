from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Employee

User = get_user_model()

class EmployeeSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(write_only=True)
    password = serializers.CharField(write_only=True, min_length=6)
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = Employee
        fields = [
            "id", "employee_no", "first_name", "last_name", "full_name",
            "position", "department", "hire_date", "regularization_date", 
            "employment_type", "basic_salary", "sss_no", "philhealth_no", 
            "pagibig_no", "tin", "bank_account", "created_at", "updated_at",
            "email", "password" # <--- Add these
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"

    def create(self, validated_data):
        # 1. Extract the email and password
        email = validated_data.pop("email")
        password = validated_data.pop("password")
        
        # 2. Create the User account (Django hashes the password automatically)
        user = User.objects.create_user(
            username=email, # Use email as the username for simplicity
            email=email,
            password=password
        )
        
        # 3. Create the Employee and link it to the new User
        employee = Employee.objects.create(user=user, **validated_data)
        return employee