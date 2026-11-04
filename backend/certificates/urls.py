from django.urls import path

from certificates.views import AdminCertificatesView, MyCertificatesView, VerifyCertificateView

urlpatterns = [
    path("me/certificates/", MyCertificatesView.as_view()),
    path("certificates/verify/<str:code>/", VerifyCertificateView.as_view()),
    path("admin/certificates/", AdminCertificatesView.as_view()),
]
