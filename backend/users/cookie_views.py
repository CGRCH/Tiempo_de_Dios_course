from django.conf import settings
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenRefreshView

from core.throttling import AuthRateThrottle
from users.auth_views import TokenObtainPairBlockedView
from users.cookie_auth import clear_jwt_cookies, set_jwt_cookies


class CookieTokenObtainPairView(TokenObtainPairBlockedView):
    throttle_classes = [AuthRateThrottle]

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            access = response.data.get("access")
            refresh = response.data.get("refresh")
            if access:
                set_jwt_cookies(response, access, refresh)
                response.data = {"detail": "Sesión iniciada."}
        return response


class CookieTokenRefreshView(TokenRefreshView):
    throttle_classes = [AuthRateThrottle]

    def post(self, request, *args, **kwargs):
        refresh = request.data.get("refresh") or request.COOKIES.get(settings.JWT_REFRESH_COOKIE_NAME)
        if not refresh:
            return Response({"detail": "Refresh requerido."}, status=status.HTTP_400_BAD_REQUEST)
        serializer = self.get_serializer(data={"refresh": refresh})
        serializer.is_valid(raise_exception=True)
        access = serializer.validated_data["access"]
        response = Response({"detail": "Token renovado."}, status=status.HTTP_200_OK)
        set_jwt_cookies(response, access)
        return response


class LogoutView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        response = Response({"detail": "Sesión cerrada."})
        clear_jwt_cookies(response)
        return response
