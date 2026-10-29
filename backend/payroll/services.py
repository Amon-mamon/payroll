from decimal import Decimal
from datetime import date
from django.db.models import Sum
from employees.models import Employee
from attendance.models import Attendance
from .models import DeductionTable, PayrollRun, Payslip


def get_active_rule(deduction_type: str, target_date: date):
    """
    Finds the latest government rule for a specific deduction type
    that is effective on or before the target_date.
    """
    return DeductionTable.objects.filter(
        type=deduction_type,
        effective_date__lte=target_date
    ).order_by('-effective_date').first()


def compute_employee_payslip(employee: Employee, payroll_run: PayrollRun) -> Payslip:
    """
    Calculates the full payslip for ONE employee for a specific payroll run.
    Returns a Payslip object (but does NOT save it to the database yet).
    """
    
    # ---------------------------------------------------------
    # 1. CALCULATE GROSS PAY (Using Attendance)
    # ---------------------------------------------------------
    attendance_records = Attendance.objects.filter(
        employee=employee,
        date__gte=payroll_run.period_start,
        date__lte=payroll_run.period_end,
        is_deleted=False
    )
    
    totals = attendance_records.aggregate(
        total_regular=Sum('worked_hours'),
        total_overtime=Sum('overtime_hours')
    )
    
    total_regular_hours = totals['total_regular'] or Decimal('0.00')
    total_overtime_hours = totals['total_overtime'] or Decimal('0.00')
    
    # Semi-monthly basic pay is half of the monthly basic salary
    semi_monthly_basic = employee.basic_salary / Decimal('2.00')
    
    # Hourly rate (assuming 8 hours/day * 22 working days * 2 cuts = 176 hours per cut)
    hourly_rate = employee.basic_salary / Decimal('176.00') 
    
    # Overtime rate (1.25x)
    overtime_pay = total_overtime_hours * hourly_rate * Decimal('1.25')
    
    gross_pay = semi_monthly_basic + overtime_pay
    
    # ---------------------------------------------------------
    # 2. CALCULATE DEDUCTIONS (Using Dummy Rules for now)
    # ---------------------------------------------------------
    # DUMMY SSS (5%)
    sss_deduction = gross_pay * Decimal('0.05')
    
    # DUMMY PHILHEALTH (2.5%)
    philhealth_deduction = gross_pay * Decimal('0.025')
    
    # DUMMY PAG-IBIG (2%, max 200)
    pagibig_deduction = min(gross_pay * Decimal('0.02'), Decimal('200.00'))
    
    # DUMMY TAX (10% flat)
    tax_deduction = gross_pay * Decimal('0.10')
    
    # ---------------------------------------------------------
    # 3. CALCULATE NET PAY
    # ---------------------------------------------------------
    total_deductions = sss_deduction + philhealth_deduction + pagibig_deduction + tax_deduction
    net_pay = gross_pay - total_deductions
    
    # ---------------------------------------------------------
    # 4. BUILD THE PAYSLIP OBJECT
    # ---------------------------------------------------------
    payslip = Payslip(
        payroll_run=payroll_run,
        employee=employee,
        basic_pay=semi_monthly_basic,
        overtime_pay=overtime_pay,
        gross_pay=gross_pay,
        sss_deduction=sss_deduction,
        philhealth_deduction=philhealth_deduction,
        pagibig_deduction=pagibig_deduction,
        tax_deduction=tax_deduction,
        net_pay=net_pay
    )
    
    return payslip