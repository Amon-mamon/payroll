from rest_framework import serializers
from .models import Employee

class EmployeeSerializer(serializers.ModelSerializer):
    
    """ 
        declare fullname with SerializerMethodField
        write a method that returns the value get_full_name()
    """
    
    full_name  = serializers.SerializerMethodField()
    class Meta:
        model = Employee
        fields = ["id", "user", "employee_no", "first_name", "last_name", "full_name", "position", "department", "hire_date","regularization_date", "employment_type", "basic_salary", "sss_no", "philhealth_no", "pagibig_no", "tin", "bank_account", "created_at","updated_at",]
        read_only_fields = ["id", "created_at", "updated_at"]
    
    """ 
        value of full_name added read-only attribute
        2 params for calling it like value = self.get_full_name(obj)
        this field is read-only; call get_<field_name> on the serializer to get its value.
    """
    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"