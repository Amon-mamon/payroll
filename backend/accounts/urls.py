from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import CookieLoginView, CookieRefreshView, LogoutView, MeView, UserViewSet

router = DefaultRouter()
router.register(r"users", UserViewSet, basename="user")

urlpatterns = [
    path("login/", CookieLoginView.as_view(), name="login"),
    path("refresh/", CookieRefreshView.as_view(), name="refresh"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("me/", MeView.as_view(), name="me"),
] + router.urls
