from django.conf import settings
from rest_framework_simplejwt.settings import api_settings

REFRESH_COOKIE = "refresh_token"
COOKIE_PATH = "/api/auth/"


def set_refresh_cookie(response, token):
    response.set_cookie(
        key=REFRESH_COOKIE,
        value=token,
        max_age=int(api_settings.REFRESH_TOKEN_LIFETIME.total_seconds()),
        httponly=True,
        secure=not settings.DEBUG,
        samesite="Lax",
        path=COOKIE_PATH,
    )


def clear_refresh_cookie(response):
    response.delete_cookie(REFRESH_COOKIE, path=COOKIE_PATH, samesite="Lax")
