from datetime import timedelta
from decimal import Decimal

from .models import LeaveBalance, LeaveType

DEFAULT_LEAVE_TYPES = [
    {"code": "VL", "name": "Vacation Leave", "default_days_per_year": 15, "is_paid": True},
    {"code": "SL", "name": "Sick Leave", "default_days_per_year": 15, "is_paid": True},
    {"code": "ML", "name": "Maternity Leave", "default_days_per_year": 105, "is_paid": True},
    {"code": "PL", "name": "Paternity Leave", "default_days_per_year": 7, "is_paid": True},
    {"code": "SIL", "name": "Service Incentive Leave", "default_days_per_year": 5, "is_paid": True},
    {"code": "BL", "name": "Bereavement Leave", "default_days_per_year": 3, "is_paid": True},
    {"code": "UL", "name": "Unpaid Leave", "default_days_per_year": 0, "is_paid": False},
]


def seed_leave_types(organization):
    """Give a company the standard Philippine leave types (idempotent)."""
    for lt in DEFAULT_LEAVE_TYPES:
        LeaveType.objects.get_or_create(organization=organization, code=lt["code"], defaults=lt)


def ensure_leave_balances(employee, year):
    """Create missing leave balances for one employee for the given year."""
    created = 0
    for lt in LeaveType.objects.filter(is_deleted=False, organization_id=employee.organization_id):
        _, was_created = LeaveBalance.objects.get_or_create(
            employee=employee,
            leave_type=lt,
            year=year,
            defaults={"allocated": lt.default_days_per_year, "used": 0},
        )
        created += int(was_created)
    return created


WEEKDAY_CODES = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]


def count_leave_days(employee, start_date, end_date):
    """Number of scheduled work days between start and end (inclusive)."""
    work_days = set((employee.work_days or "mon,tue,wed,thu,fri").split(","))
    days = 0
    current = start_date
    while current <= end_date:
        if WEEKDAY_CODES[current.weekday()] in work_days:
            days += 1
        current += timedelta(days=1)
    return Decimal(days)
