from rest_framework.permissions import BasePermission


def _role(user):
    if not user or not user.is_authenticated:
        return None
    if user.is_superuser:
        return "admin"
    return getattr(user, "role", None)


class IsAdmin(BasePermission):
    message = "Only administrators can perform this action."

    def has_permission(self, request, view):
        return _role(request.user) == "admin"


class IsHRorAdmin(BasePermission):
    message = "Only HR or administrators can perform this action."

    def has_permission(self, request, view):
        return _role(request.user) in ("admin", "hr")
