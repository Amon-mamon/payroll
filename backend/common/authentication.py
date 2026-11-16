from rest_framework import status
from rest_framework.exceptions import APIException
from rest_framework_simplejwt.authentication import JWTAuthentication


class SubscriptionInactive(APIException):
    status_code = status.HTTP_402_PAYMENT_REQUIRED
    default_detail = "Your company's subscription is inactive. An administrator must renew it to continue."
    default_code = "subscription_inactive"


# Endpoints that must keep working while a subscription is inactive,
# so users can still see who they are and admins can renew.
ALWAYS_ALLOWED_PREFIXES = (
    "/api/auth/me/",
    "/api/auth/logout/",
    "/api/organization/",
    "/api/plans/",
)


class TenantJWTAuthentication(JWTAuthentication):
    """JWT auth that also blocks companies without an active subscription."""

    def authenticate(self, request):
        result = super().authenticate(request)
        if result is None:
            return None
        user, token = result
        if request.path.startswith(ALWAYS_ALLOWED_PREFIXES):
            return result

        org = user.organization
        if org is None:
            raise SubscriptionInactive("This account is not linked to a company.")
        if not org.has_access:
            raise SubscriptionInactive()
        return result
