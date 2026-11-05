from django.conf import settings
from rest_framework.response import Response


def set_jwt_cookies(response: Response, access: str, refresh: str | None = None) -> Response:
    response.set_cookie(
        settings.JWT_ACCESS_COOKIE_NAME,
        access,
        max_age=int(settings.SIMPLE_JWT["ACCESS_TOKEN_LIFETIME"].total_seconds()),
        httponly=True,
        secure=settings.JWT_COOKIE_SECURE,
        samesite=settings.JWT_COOKIE_SAMESITE,
        path="/",
    )
    if refresh:
        response.set_cookie(
            settings.JWT_REFRESH_COOKIE_NAME,
            refresh,
            max_age=int(settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"].total_seconds()),
            httponly=True,
            secure=settings.JWT_COOKIE_SECURE,
            samesite=settings.JWT_COOKIE_SAMESITE,
            path="/",
        )
    return response


def clear_jwt_cookies(response: Response) -> Response:
    response.delete_cookie(settings.JWT_ACCESS_COOKIE_NAME, path="/")
    response.delete_cookie(settings.JWT_REFRESH_COOKIE_NAME, path="/")
    return response
