from rest_framework import generics, mixins, permissions, viewsets
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from common.permissions import IsAdmin
from utils.utils import REFRESH_COOKIE, clear_refresh_cookie, set_refresh_cookie

from .models import User
from .serializers import LoginSerializer, UserSerializer, UserStatusSerializer


class MeView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class UserViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin,
                  mixins.UpdateModelMixin, viewsets.GenericViewSet):
    """Admin-only overview of every account in the system (admins, HR, employees)."""

    permission_classes = [permissions.IsAuthenticated, IsAdmin]
    filterset_fields = ["role", "is_active"]
    search_fields = ["username", "email", "first_name", "last_name"]
    http_method_names = ["get", "patch", "head", "options"]

    def get_queryset(self):
        return (
            User.objects.filter(organization_id=self.request.user.organization_id)
            .select_related("employee")
            .order_by("role", "username")
        )

    def get_serializer_class(self):
        if self.action == "partial_update":
            return UserStatusSerializer
        return UserSerializer

    def partial_update(self, request, *args, **kwargs):
        user = self.get_object()
        if user == request.user:
            return Response({"detail": "You cannot deactivate your own account."}, status=400)
        serializer = UserStatusSerializer(user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        org = request.user.organization
        has_profile = hasattr(user, "employee") and not user.employee.is_deleted
        if serializer.validated_data.get("is_active") and not user.is_active and has_profile \
                and org.seats_used() >= org.max_employees:
            return Response(
                {"detail": f"Your plan allows {org.max_employees} employees. Upgrade to reactivate this account."},
                status=400,
            )
        serializer.save()
        return Response(UserSerializer(user).data)


class CookieLoginView(TokenObtainPairView):
    serializer_class = LoginSerializer
    permission_classes = [permissions.AllowAny]
    authentication_classes = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth"

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            refresh = response.data.pop("refresh")
            set_refresh_cookie(response, refresh)
        return response


class CookieRefreshView(TokenRefreshView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request, *args, **kwargs):
        refresh = request.COOKIES.get(REFRESH_COOKIE)
        if not refresh:
            return Response({"detail": "No refresh token."}, status=401)

        serializer = self.get_serializer(data={"refresh": refresh})
        try:
            serializer.is_valid(raise_exception=True)
        except TokenError as e:
            raise InvalidToken(e.args[0])

        data = serializer.validated_data
        response = Response({"access": data["access"]})
        if "refresh" in data:
            set_refresh_cookie(response, data["refresh"])
        return response


class LogoutView(APIView):
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        response = Response(status=204)
        clear_refresh_cookie(response)
        return response
