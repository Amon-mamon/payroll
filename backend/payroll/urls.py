from rest_framework.routers import DefaultRouter
from .views import PayrollRunViewSet, PayslipViewSet

router = DefaultRouter()
router.register(r"payroll-runs", PayrollRunViewSet, basename="payroll-run")
router.register(r"payslips", PayslipViewSet, basename="payslip")

urlpatterns = router.urls   