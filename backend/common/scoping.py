"""
Tenant + role visibility rules shared by every app.

Every query is first restricted to the requester's organization (company).
Within a company:
- Admin: sees everything.
- HR: sees regular employees (role=employee) plus their own records.
- Employee: sees only their own records.
"""
from django.db.models import Q


def org_employees(user):
    """Employees of the requester's company (not soft-deleted)."""
    from employees.models import Employee

    if not user.organization_id:
        return Employee.objects.none()
    return Employee.objects.filter(organization_id=user.organization_id, is_deleted=False)


def visible_employees(user):
    """Employees the requester may see/target, according to role."""
    qs = org_employees(user)
    if user.is_admin:
        return qs
    if user.is_hr:
        return qs.filter(Q(user__role="employee") | Q(user=user))
    return qs.filter(user=user)


def scope_by_employee(qs, user, employee_field="employee"):
    if not user.organization_id:
        return qs.none()
    qs = qs.filter(**{f"{employee_field}__organization_id": user.organization_id})
    if user.is_admin:
        return qs
    own = Q(**{f"{employee_field}__user": user})
    if user.is_hr:
        return qs.filter(own | Q(**{f"{employee_field}__user__role": "employee"}))
    return qs.filter(own)
