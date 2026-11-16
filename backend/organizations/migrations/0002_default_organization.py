from datetime import timedelta

from django.db import migrations
from django.utils import timezone


def assign_default_org(apps, schema_editor):
    """Existing single-company data becomes the first tenant."""
    Organization = apps.get_model("organizations", "Organization")
    User = apps.get_model("accounts", "User")
    Employee = apps.get_model("employees", "Employee")
    PayrollRun = apps.get_model("payroll", "PayrollRun")
    LeaveType = apps.get_model("leaves", "LeaveType")

    if not (User.objects.exists() or Employee.objects.exists()):
        return

    org = Organization.objects.create(
        name="Default Company",
        slug="default-company",
        plan="business",
        billing_cycle="yearly",
        status="active",
        current_period_end=timezone.now() + timedelta(days=365),
    )
    User.objects.filter(organization__isnull=True).update(organization=org)
    Employee.objects.filter(organization__isnull=True).update(organization=org)
    PayrollRun.objects.filter(organization__isnull=True).update(organization=org)
    LeaveType.objects.filter(organization__isnull=True).update(organization=org)


class Migration(migrations.Migration):
    dependencies = [
        ("organizations", "0001_initial"),
        ("accounts", "0003_user_organization"),
        ("employees", "0006_employee_organization_alter_employee_employee_no_and_more"),
        ("payroll", "0003_payrollrun_organization"),
        ("leaves", "0003_leavetype_organization_alter_leavetype_code_and_more"),
    ]

    operations = [migrations.RunPython(assign_default_org, migrations.RunPython.noop)]
