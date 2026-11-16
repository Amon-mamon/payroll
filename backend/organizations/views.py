from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from accounts.serializers import UserSerializer
from common.permissions import IsAdmin
from utils.utils import set_refresh_cookie

from .plans import PLANS, public_plans
from .serializers import OrganizationSerializer, SignupSerializer, SubscriptionActionSerializer


class PlanListView(APIView):
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response(public_plans())


class SignupView(APIView):
    """Public: subscribe a new company. Logs the new admin in straight away."""

    authentication_classes = []
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "signup"

    def post(self, request):
        serializer = SignupSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        from rest_framework_simplejwt.tokens import RefreshToken

        refresh = RefreshToken.for_user(user)
        response = Response(
            {"access": str(refresh.access_token), "user": UserSerializer(user).data},
            status=status.HTTP_201_CREATED,
        )
        set_refresh_cookie(response, str(refresh))
        return response


class OrganizationView(APIView):
    """GET: any member sees their company & plan. PATCH: admins rename the company."""

    permission_classes = [permissions.IsAuthenticated]

    def get_org(self, request):
        return request.user.organization

    def get(self, request):
        org = self.get_org(request)
        if org is None:
            return Response({"detail": "This account is not linked to a company."}, status=404)
        return Response(OrganizationSerializer(org).data)

    def patch(self, request):
        if not IsAdmin().has_permission(request, self):
            return Response({"detail": "Only administrators can change company settings."}, status=403)
        org = self.get_org(request)
        serializer = OrganizationSerializer(org, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class SubscriptionView(APIView):
    """
    Static subscription management (no payment provider).
    activate:     start a paid period on the current or chosen plan
    change_plan:  switch plan / billing cycle (checks the seat limit)
    cancel:       keep access until the end of the period, then stop
    resume:       undo a pending cancellation
    """

    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def post(self, request):
        org = request.user.organization
        serializer = SubscriptionActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        action = serializer.validated_data["action"]
        plan = serializer.validated_data.get("plan")
        cycle = serializer.validated_data.get("billing_cycle")

        if plan and org.seats_used() > PLANS[plan]["max_employees"]:
            return Response(
                {"detail": f"You have {org.seats_used()} active employees; the {PLANS[plan]['name']} plan allows "
                           f"{PLANS[plan]['max_employees']}. Deactivate some accounts first."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if action == "activate":
            org.activate(plan=plan, billing_cycle=cycle)
            message = "Subscription activated."
        elif action == "change_plan":
            if not plan:
                return Response({"plan": ["Choose a plan."]}, status=status.HTTP_400_BAD_REQUEST)
            org.plan = plan
            if cycle:
                org.billing_cycle = cycle
            org.save(update_fields=["plan", "billing_cycle", "updated_at"])
            message = f"You're now on the {PLANS[plan]['name']} plan."
        elif action == "cancel":
            if not org.has_access:
                return Response({"detail": "The subscription has already ended."}, status=status.HTTP_400_BAD_REQUEST)
            org.cancel_at_period_end = True
            org.save(update_fields=["cancel_at_period_end", "updated_at"])
            message = "Subscription will end at the close of the current period."
        else:  # resume
            org.cancel_at_period_end = False
            org.save(update_fields=["cancel_at_period_end", "updated_at"])
            message = "Cancellation withdrawn."

        return Response({"detail": message, "organization": OrganizationSerializer(org).data})
