from rest_framework import generics, serializers
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from certificates.models import Certificate
from core.permissions import IsAdministracion


class CertificateSerializer(serializers.ModelSerializer):
    course_title = serializers.CharField(source="enrollment.course.title", read_only=True)
    user_name = serializers.CharField(source="enrollment.user.get_full_name", read_only=True)
    pdf_url = serializers.FileField(source="pdf", read_only=True)

    class Meta:
        model = Certificate
        fields = ("id", "verification_code", "course_title", "user_name", "issued_at", "pdf_url")


class MyCertificatesView(generics.ListAPIView):
    serializer_class = CertificateSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Certificate.objects.filter(enrollment__user=self.request.user)


class VerifyCertificateView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, code):
        cert = Certificate.objects.select_related("enrollment__user", "enrollment__course").get(
            verification_code=code.upper()
        )
        return Response(CertificateSerializer(cert).data)


class AdminCertificatesView(generics.ListAPIView):
    serializer_class = CertificateSerializer
    permission_classes = [IsAuthenticated, IsAdministracion]
    queryset = Certificate.objects.select_related("enrollment__user", "enrollment__course").all()
