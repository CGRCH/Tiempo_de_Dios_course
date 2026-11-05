from django.urls import include, path

from users.cookie_views import CookieTokenObtainPairView, CookieTokenRefreshView, LogoutView

urlpatterns = [
    path("auth/token/", CookieTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("auth/token/refresh/", CookieTokenRefreshView.as_view(), name="token_refresh"),
    path("auth/logout/", LogoutView.as_view(), name="auth_logout"),
    path("", include("users.urls")),
    path("", include("courses.urls")),
    path("", include("enrollments.urls")),
    path("", include("payments.urls")),
    path("", include("tickets.urls")),
    path("", include("certificates.urls")),
    path("", include("core.urls")),
]
