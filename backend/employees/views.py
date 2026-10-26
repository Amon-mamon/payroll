from django.shortcuts import render
from rest_framework import viewsets
from rest_framework import permissions
from .models import Employee
from .serializers import EmployeeSerializer
from common.permissions import IsHRorAdmin

# Create your views here.

class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.filter(is_deleted=False)
    serializer_class = EmployeeSerializer
    permission_classes = [permissions.IsAuthenticated, IsHRorAdmin]
    
    filterset_fields = ["department", "employment_type"]
    search_fields = ["first_name", "last_name", "employee_no"]
    ordering_fields = ["last_name", "hire_date", "basic_salary"]
    
    def perform_destroy(self, instance):
        instance.soft_delete()