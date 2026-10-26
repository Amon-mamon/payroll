from rest_framework.permissions import BasePermission

class IsHRorAdmin(BasePermission):
    def has_permission(self, request, view):
      if not request.user.is_authenticated:
          return False
      return request.user.is_superuser or request.user.groups.filter(name__in=["HR", "Admin"]).exists()