from datetime import date, timedelta
from decimal import ROUND_HALF_UP, Decimal

from django.db.models import Sum
from django.utils import timezone

from attendance.models import Attendance, AttendanceStatus
from employees.models import Employee
from leaves.models import LeaveRequest, LeaveStatus
from leaves.services import WEEKDAY_CODES

from .models import DeductionTable, PayrollRun, Payslip

TWO_PLACES = Decimal("0.01")
WORK_DAYS_PER_MONTH = Decimal("22")
HOURS_PER_DAY = Decimal("8")
OVERTIME_MULTIPLIER = Decimal("1.25")


def money(value) -> Decimal:
    return Decimal(value).quantize(TWO_PLACES, ROUND_HALF_UP)


def get_active_rule(deduction_type: str, target_date: date):
    """Latest government rule for a deduction type effective on or before target_date."""
    return DeductionTable.objects.filter(
        type=deduction_type, effective_date__lte=target_date
    ).order_by("-effective_date").first()


def _scheduled_days(employee: Employee, start: date, end: date):
    work_days = set(employee.work_days.split(","))
    current = start
    while current <= end:
        if WEEKDAY_CODES[current.weekday()] in work_days:
            yield current
        current += timedelta(days=1)


def _paid_leave_dates(employee: Employee, start: date, end: date) -> set:
    dates = set()
    approved = LeaveRequest.objects.filter(
        employee=employee,
        status=LeaveStatus.APPROVED,
        is_deleted=False,
        leave_type__is_paid=True,
        start_date__lte=end,
        end_date__gte=start,
    )
    for lr in approved:
        current = max(lr.start_date, start)
        while current <= min(lr.end_date, end):
            dates.add(current)
            current += timedelta(days=1)
    return dates


def compute_employee_payslip(employee: Employee, payroll_run: PayrollRun) -> Payslip:
    """
    Calculates the payslip for ONE employee for a semi-monthly payroll run.
    Returns an unsaved Payslip.
    """
    start, end = payroll_run.period_start, payroll_run.period_end

    records = Attendance.objects.filter(employee=employee, date__gte=start, date__lte=end, is_deleted=False)
    totals = records.aggregate(total_overtime=Sum("overtime_hours"))
    overtime_hours = totals["total_overtime"] or Decimal("0")

    present_dates = set(
        records.filter(time_in__isnull=False).values_list("date", flat=True)
    )
    paid_leave = _paid_leave_dates(employee, start, end)

    # Only count absences for days the employee was already hired and that have passed.
    count_from = max(start, employee.hire_date)
    count_to = min(end, timezone.localdate())
    scheduled = list(_scheduled_days(employee, count_from, count_to)) if count_from <= count_to else []
    days_present = sum(1 for d in scheduled if d in present_dates)
    days_on_leave = sum(1 for d in scheduled if d not in present_dates and d in paid_leave)
    days_absent = len(scheduled) - days_present - days_on_leave

    daily_rate = employee.basic_salary / WORK_DAYS_PER_MONTH
    hourly_rate = daily_rate / HOURS_PER_DAY

    semi_monthly_basic = employee.basic_salary / Decimal("2")
    absence_deduction = min(daily_rate * days_absent, semi_monthly_basic)
    overtime_pay = overtime_hours * hourly_rate * OVERTIME_MULTIPLIER
    gross_pay = semi_monthly_basic - absence_deduction + overtime_pay

    # Government deductions (placeholder flat rates until DeductionTable rules are wired in)
    sss = gross_pay * Decimal("0.05")
    philhealth = gross_pay * Decimal("0.025")
    pagibig = min(gross_pay * Decimal("0.02"), Decimal("200.00"))
    tax = gross_pay * Decimal("0.10")
    net_pay = gross_pay - (sss + philhealth + pagibig + tax)

    return Payslip(
        payroll_run=payroll_run,
        employee=employee,
        days_present=days_present,
        days_on_leave=days_on_leave,
        days_absent=days_absent,
        overtime_hours=money(overtime_hours),
        basic_pay=money(semi_monthly_basic),
        absence_deduction=money(absence_deduction),
        overtime_pay=money(overtime_pay),
        gross_pay=money(gross_pay),
        sss_deduction=money(sss),
        philhealth_deduction=money(philhealth),
        pagibig_deduction=money(pagibig),
        tax_deduction=money(tax),
        net_pay=money(net_pay),
    )
