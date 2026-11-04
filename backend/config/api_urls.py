from django.urls import include, path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path("auth/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("", include("users.urls")),
    path("", include("courses.urls")),
    path("", include("enrollments.urls")),
    path("", include("payments.urls")),
    path("", include("tickets.urls")),
    path("", include("certificates.urls")),
    path("", include("core.urls")),
]
