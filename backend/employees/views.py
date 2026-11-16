from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from common.permissions import IsHRorAdmin
from common.scoping import visible_employees

from .models import Employee
from .serializers import EmployeeSerializer


class EmployeeViewSet(viewsets.ModelViewSet):
    """
    Admin: every employee profile (HR staff, employees, admins with a profile).
    HR: regular employees only (plus their own profile).
    """

    serializer_class = EmployeeSerializer
    permission_classes = [permissions.IsAuthenticated, IsHRorAdmin]

    filterset_fields = ["department", "employment_type", "user__role"]
    search_fields = ["first_name", "last_name", "employee_no", "user__email", "position"]
    ordering_fields = ["last_name", "hire_date", "basic_salary", "employee_no"]

    def get_queryset(self):
        return visible_employees(self.request.user).select_related("user")

    def _guard_write(self, employee):
        """HR may only edit/delete regular employees (not other HR, admins, or their own salary)."""
        actor = self.request.user
        if not actor.is_admin and employee.user.role != "employee":
            return Response({"detail": "You cannot modify this account."}, status=status.HTTP_403_FORBIDDEN)
        return None

    def update(self, request, *args, **kwargs):
        denied = self._guard_write(self.get_object())
        return denied or super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        employee = self.get_object()
        if employee.user == request.user:
            return Response({"detail": "You cannot delete your own profile."}, status=status.HTTP_400_BAD_REQUEST)
        denied = self._guard_write(employee)
        return denied or super().destroy(request, *args, **kwargs)

    def perform_destroy(self, instance):
        # Soft delete the profile and disable the login
        instance.soft_delete()
        instance.user.is_active = False
        instance.user.save(update_fields=["is_active"])

    @action(detail=False, methods=["get"], permission_classes=[permissions.IsAuthenticated])
    def me(self, request):
        employee = Employee.objects.filter(
            user=request.user, organization_id=request.user.organization_id, is_deleted=False
        ).first()
        if employee is None:
            return Response({"detail": "No employee profile linked to this account."}, status=status.HTTP_404_NOT_FOUND)
        return Response(self.get_serializer(employee).data)

    @action(detail=False, methods=["get"])
    def departments(self, request):
        names = (
            self.get_queryset().order_by("department").values_list("department", flat=True).distinct()
        )
        return Response(sorted({n for n in names if n}))
