from django.urls import path

from .views import OrganizationView, PlanListView, SignupView, SubscriptionView

urlpatterns = [
    path("plans/", PlanListView.as_view(), name="plans"),
    path("signup/", SignupView.as_view(), name="signup"),
    path("organization/", OrganizationView.as_view(), name="organization"),
    path("organization/subscription/", SubscriptionView.as_view(), name="subscription"),
]
