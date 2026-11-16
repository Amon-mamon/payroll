from datetime import date, time

from rest_framework.test import APITestCase

from accounts.models import Role, User
from employees.models import Employee
from leaves.models import LeaveType
from organizations.models import Organization

_DEFAULT_ORG = {}


def default_org():
    org = _DEFAULT_ORG.get("org")
    if org is None or not Organization.objects.filter(pk=org.pk).exists():
        org = Organization.start_trial("Acme Inc", "growth", "monthly")
        _DEFAULT_ORG["org"] = org
    return org


def make_employee(email, role=Role.EMPLOYEE, superuser=False, salary=30000, org=None):
    org = org or default_org()
    if superuser:
        user = User.objects.create_superuser(username=email, email=email, password="Str0ngPass!x", organization=org)
    else:
        user = User.objects.create_user(username=email, email=email, password="Str0ngPass!x", role=role, organization=org)
    emp = Employee.objects.create(
        organization=org, user=user, employee_no=email.split("@")[0], first_name=email.split("@")[0], last_name="Test",
        position="Staff", department="Ops", hire_date=date(2024, 1, 1), basic_salary=salary,
        shift_start=time(8, 0), shift_end=time(17, 0),
    )
    return user, emp


NEW_ACCOUNT = {
    "first_name": "New", "last_name": "Person", "position": "Clerk", "department": "Ops",
    "hire_date": "2025-01-06", "employment_type": "regular", "basic_salary": "25000.00",
    "password": "AnotherStr0ng!pw",
}


class AuthFlowTests(APITestCase):
    def setUp(self):
        self.user, _ = make_employee("emp@example.com")

    def test_login_with_email_sets_refresh_cookie_and_returns_role(self):
        res = self.client.post("/api/auth/login/", {"username": "emp@example.com", "password": "Str0ngPass!x"}, format="json")
        self.assertEqual(res.status_code, 200)
        self.assertIn("access", res.data)
        self.assertNotIn("refresh", res.data)
        self.assertEqual(res.data["user"]["role"], "employee")
        self.assertIn("refresh_token", res.cookies)

        refresh = self.client.post("/api/auth/refresh/")
        self.assertEqual(refresh.status_code, 200)
        self.assertIn("access", refresh.data)

        logout = self.client.post("/api/auth/logout/")
        self.assertEqual(logout.status_code, 204)
        self.assertEqual(self.client.post("/api/auth/refresh/").status_code, 401)

    def test_bad_credentials(self):
        res = self.client.post("/api/auth/login/", {"username": "emp@example.com", "password": "nope"}, format="json")
        self.assertEqual(res.status_code, 401)


class AccountCreationTests(APITestCase):
    def setUp(self):
        LeaveType.objects.create(organization=default_org(), name="Vacation Leave", code="VL", default_days_per_year=15)
        self.admin, _ = make_employee("admin@example.com", superuser=True)
        self.hr, _ = make_employee("hr@example.com", role=Role.HR)
        self.emp, _ = make_employee("emp@example.com")

    def create(self, actor, email, role):
        self.client.force_authenticate(actor)
        return self.client.post("/api/employees/", {**NEW_ACCOUNT, "email": email, "role": role}, format="json")

    def test_admin_can_create_hr_and_employee(self):
        self.assertEqual(self.create(self.admin, "h2@example.com", "hr").status_code, 201)
        res = self.create(self.admin, "e2@example.com", "employee")
        self.assertEqual(res.status_code, 201)
        self.assertTrue(res.data["employee_no"].startswith("EMP-"))
        user = User.objects.get(email="h2@example.com")
        self.assertEqual(user.role, "hr")
        self.assertTrue(user.check_password(NEW_ACCOUNT["password"]))
        # New hire gets leave balances
        self.assertEqual(user.employee.leave_balances.count(), 1)

    def test_hr_can_create_employee_only(self):
        self.assertEqual(self.create(self.hr, "e3@example.com", "employee").status_code, 201)
        res = self.create(self.hr, "h3@example.com", "hr")
        self.assertEqual(res.status_code, 400)
        self.assertFalse(User.objects.filter(email="h3@example.com").exists())

    def test_nobody_creates_admin_here(self):
        self.assertEqual(self.create(self.admin, "a2@example.com", "admin").status_code, 400)

    def test_employee_cannot_create_accounts(self):
        self.assertEqual(self.create(self.emp, "e4@example.com", "employee").status_code, 403)

    def test_hr_does_not_see_other_hr_or_admin(self):
        make_employee("hr2@example.com", role=Role.HR)
        self.client.force_authenticate(self.hr)
        emails = {e["email"] for e in self.client.get("/api/employees/").data["results"]}
        self.assertIn("emp@example.com", emails)
        self.assertIn("hr@example.com", emails)  # own profile
        self.assertNotIn("hr2@example.com", emails)
        self.assertNotIn("admin@example.com", emails)

    def test_hr_cannot_edit_own_salary(self):
        self.client.force_authenticate(self.hr)
        res = self.client.patch(f"/api/employees/{self.hr.employee.id}/", {"basic_salary": "999999"}, format="json")
        self.assertEqual(res.status_code, 403)

    def test_users_endpoint_is_admin_only(self):
        self.client.force_authenticate(self.hr)
        self.assertEqual(self.client.get("/api/auth/users/").status_code, 403)
        self.client.force_authenticate(self.admin)
        self.assertEqual(self.client.get("/api/auth/users/").status_code, 200)


class AttendanceAndLeaveTests(APITestCase):
    def setUp(self):
        self.vl = LeaveType.objects.create(organization=default_org(), name="Vacation Leave", code="VL", default_days_per_year=15)
        self.admin, _ = make_employee("admin@example.com", superuser=True)
        self.hr, self.hr_emp = make_employee("hr@example.com", role=Role.HR)
        self.emp, self.emp_profile = make_employee("emp@example.com")
        from leaves.services import ensure_leave_balances
        ensure_leave_balances(self.emp_profile, 2026)
        ensure_leave_balances(self.hr_emp, 2026)

    def test_clock_in_and_out(self):
        self.client.force_authenticate(self.emp)
        res = self.client.post("/api/attendance/clock/", {"action": "in"}, format="json")
        self.assertEqual(res.status_code, 200)
        self.assertIn(res.data["record"]["status"], ["present", "late"])
        self.assertEqual(self.client.post("/api/attendance/clock/", {"action": "in"}, format="json").status_code, 400)
        self.assertEqual(self.client.post("/api/attendance/clock/", {"action": "out"}, format="json").status_code, 200)
        today = self.client.get("/api/attendance/today/").data
        self.assertIsNotNone(today["record"]["time_out"])

    def test_employee_requests_leave_hr_approves(self):
        self.client.force_authenticate(self.emp)
        res = self.client.post("/api/leave-requests/", {
            "leave_type": str(self.vl.id), "start_date": "2026-12-07", "end_date": "2026-12-11", "reason": "trip",
        }, format="json")
        self.assertEqual(res.status_code, 201, res.data)
        self.assertEqual(res.data["days"], "5.00")
        leave_id = res.data["id"]

        # employee can't approve
        self.assertEqual(self.client.post(f"/api/leave-requests/{leave_id}/approve/").status_code, 403)

        self.client.force_authenticate(self.hr)
        res = self.client.post(f"/api/leave-requests/{leave_id}/approve/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(self.emp_profile.leave_balances.get(year=2026).used, 5)

    def test_hr_cannot_approve_own_leave(self):
        self.client.force_authenticate(self.hr)
        res = self.client.post("/api/leave-requests/", {
            "leave_type": str(self.vl.id), "start_date": "2026-12-07", "end_date": "2026-12-07",
        }, format="json")
        self.assertEqual(res.status_code, 201, res.data)
        self.assertEqual(self.client.post(f"/api/leave-requests/{res.data['id']}/approve/").status_code, 403)


class PayrollTests(APITestCase):
    def setUp(self):
        self.admin, _ = make_employee("admin@example.com", superuser=True)
        self.hr, _ = make_employee("hr@example.com", role=Role.HR)
        self.emp, _ = make_employee("emp@example.com")

    def test_hr_computes_admin_approves_employee_sees_after_approval(self):
        self.client.force_authenticate(self.hr)
        run = self.client.post("/api/payroll-runs/", {"period_start": "2026-10-01", "period_end": "2026-10-15"}, format="json")
        self.assertEqual(run.status_code, 201, run.data)
        run_id = run.data["id"]
        self.assertEqual(self.client.post(f"/api/payroll-runs/{run_id}/compute/").status_code, 200)
        self.assertEqual(self.client.post(f"/api/payroll-runs/{run_id}/approve/").status_code, 403)

        self.client.force_authenticate(self.emp)
        self.assertEqual(self.client.get("/api/payslips/").data["count"], 0)

        self.client.force_authenticate(self.admin)
        self.assertEqual(self.client.post(f"/api/payroll-runs/{run_id}/approve/").status_code, 200)

        self.client.force_authenticate(self.emp)
        slips = self.client.get("/api/payslips/").data
        self.assertEqual(slips["count"], 1)
        self.assertEqual(slips["results"][0]["employee_name"], "emp Test")


class SaasTests(APITestCase):
    SIGNUP = {
        "company_name": "Globex", "plan": "starter", "billing_cycle": "monthly",
        "first_name": "Gina", "last_name": "Owner", "email": "gina@globex.com", "password": "Sup3r$ecretPw",
    }

    def test_plans_are_public(self):
        res = self.client.get("/api/plans/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual([p["code"] for p in res.data], ["starter", "growth", "business"])

    def test_signup_creates_tenant_admin_and_logs_in(self):
        res = self.client.post("/api/signup/", self.SIGNUP, format="json")
        self.assertEqual(res.status_code, 201, res.data)
        self.assertEqual(res.data["user"]["role"], "admin")
        self.assertEqual(res.data["user"]["organization"]["effective_status"], "trialing")
        self.assertIn("refresh_token", res.cookies)
        user = User.objects.get(email="gina@globex.com")
        self.assertEqual(user.organization.name, "Globex")
        self.assertEqual(user.organization.leave_types.count(), 7)
        self.assertIsNotNone(res.data["user"]["employee_id"])
        # duplicate email rejected
        self.assertEqual(self.client.post("/api/signup/", self.SIGNUP, format="json").status_code, 400)

    def test_tenants_are_isolated(self):
        a_admin, a_emp = make_employee("a@acme.com", superuser=True)
        other = Organization.start_trial("Other Co", "starter", "monthly")
        b_admin, b_emp = make_employee("b@other.com", role=Role.ADMIN, org=other)

        self.client.force_authenticate(b_admin)
        emails = {e["email"] for e in self.client.get("/api/employees/").data["results"]}
        self.assertEqual(emails, {"b@other.com"})
        self.assertEqual(self.client.get(f"/api/employees/{a_emp.id}/").status_code, 404)
        self.assertEqual({u["email"] for u in self.client.get("/api/auth/users/").data["results"]}, {"b@other.com"})
        # cannot log attendance for another company's employee
        res = self.client.post("/api/attendance/", {"employee": str(a_emp.id), "date": "2026-11-02"}, format="json")
        self.assertEqual(res.status_code, 400)
        # employee numbers are unique per company, not globally
        self.client.force_authenticate(a_admin)
        res = self.client.post("/api/employees/", {**NEW_ACCOUNT, "email": "x@acme.com", "role": "employee",
                                                   "employee_no": "b"}, format="json")
        self.assertEqual(res.status_code, 201, res.data)

    def test_seat_limit_enforced(self):
        org = Organization.start_trial("Tiny", "starter", "monthly")
        admin, _ = make_employee("boss@tiny.com", role=Role.ADMIN, org=org)
        for i in range(9):
            make_employee(f"e{i}@tiny.com", org=org)
        self.client.force_authenticate(admin)
        res = self.client.post("/api/employees/", {**NEW_ACCOUNT, "email": "eleven@tiny.com", "role": "employee"}, format="json")
        self.assertEqual(res.status_code, 400)
        self.assertIn("Upgrade", str(res.data))
        # upgrading lifts the limit
        self.client.post("/api/organization/subscription/", {"action": "change_plan", "plan": "growth"}, format="json")
        res = self.client.post("/api/employees/", {**NEW_ACCOUNT, "email": "eleven@tiny.com", "role": "employee"}, format="json")
        self.assertEqual(res.status_code, 201, res.data)

    def test_expired_subscription_blocks_app_but_not_billing(self):
        from datetime import timedelta
        from django.utils import timezone
        from rest_framework_simplejwt.tokens import AccessToken

        org = Organization.start_trial("Late Payer", "starter", "monthly")
        org.trial_ends_at = timezone.now() - timedelta(days=1)
        org.save()
        admin, _ = make_employee("admin@late.com", role=Role.ADMIN, org=org)
        emp, _ = make_employee("emp@late.com", org=org)

        # Use real JWTs: the subscription gate lives in the authentication class.
        auth = lambda u: {"HTTP_AUTHORIZATION": f"Bearer {AccessToken.for_user(u)}"}
        self.assertEqual(self.client.get("/api/attendance/", **auth(emp)).status_code, 402)
        me = self.client.get("/api/auth/me/", **auth(emp))
        self.assertEqual(me.status_code, 200)
        self.assertFalse(me.data["organization"]["has_access"])
        # employees can't renew
        self.assertEqual(self.client.post("/api/organization/subscription/", {"action": "activate"}, format="json", **auth(emp)).status_code, 403)
        res = self.client.post("/api/organization/subscription/", {"action": "activate", "billing_cycle": "yearly"}, format="json", **auth(admin))
        self.assertEqual(res.status_code, 200, res.data)
        self.assertEqual(self.client.get("/api/attendance/", **auth(emp)).status_code, 200)
