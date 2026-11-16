from .scoping import scope_by_employee


class EmployeeScopedMixin:
    """
    Applies role-based row visibility and supports `?mine=true`
    so HR/admins can view only their own records on "My ..." pages.
    """

    employee_field = "employee"

    def scope(self, qs):
        user = self.request.user
        qs = scope_by_employee(qs, user, self.employee_field)
        if self.request.query_params.get("mine") in ("1", "true", "True"):
            qs = qs.filter(**{f"{self.employee_field}__user": user})
        return qs
