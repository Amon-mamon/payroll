from datetime import date, datetime, timedelta
from decimal import ROUND_HALF_UP, Decimal

STANDARD_WORK_HOURS = Decimal("8")
TWO_PLACES = Decimal("0.01")


def _hours_between(start, end):
    dt_in = datetime.combine(date(2000, 1, 1), start)
    dt_out = datetime.combine(date(2000, 1, 1), end)
    return Decimal((dt_out - dt_in).total_seconds()) / Decimal(3600)


def compute_hours(employee, time_in, time_out):
    """
    Returns (regular_hours, overtime_hours).

    The unpaid break is the part of the scheduled shift beyond 8 hours
    (e.g. 08:00-17:00 => 1h lunch). It is only deducted when the employee
    actually worked more than half a day.
    """
    if not (time_in and time_out) or time_out <= time_in:
        return Decimal("0.00"), Decimal("0.00")

    total = _hours_between(time_in, time_out)
    shift_length = _hours_between(employee.shift_start, employee.shift_end)
    break_hours = max(shift_length - STANDARD_WORK_HOURS, Decimal("0"))
    if total > Decimal("5"):
        total -= break_hours

    regular = min(total, STANDARD_WORK_HOURS)
    overtime = max(total - STANDARD_WORK_HOURS, Decimal("0"))
    return regular.quantize(TWO_PLACES, ROUND_HALF_UP), overtime.quantize(TWO_PLACES, ROUND_HALF_UP)


def is_late(employee, time_in):
    threshold = (
        datetime.combine(date(2000, 1, 1), employee.shift_start) + timedelta(minutes=employee.grace_minutes)
    ).time()
    return time_in > threshold
