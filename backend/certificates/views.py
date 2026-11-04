from rest_framework import generics, serializers
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from certificates.models import Certificate
from core.permissions import IsAdministracion


class CertificateSerializer(serializers.ModelSerializer):
    course_title = serializers.CharField(source="enrollment.course.title", read_only=True)
    user_name = serializers.SerializerMethodField()
    pdf_url = serializers.SerializerMethodField()

    class Meta:
        model = Certificate
        fields = ("id", "verification_code", "course_title", "user_name", "issued_at", "pdf_url")

    def get_user_name(self, obj):
        user = obj.enrollment.user
        return user.get_full_name() or user.username

    def get_pdf_url(self, obj):
        if not obj.pdf:
            return None
        request = self.context.get("request")
        url = obj.pdf.url
        if request:
            return request.build_absolute_uri(url)
        return url


class MyCertificatesView(generics.ListAPIView):
    serializer_class = CertificateSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Certificate.objects.filter(enrollment__user=self.request.user)

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["request"] = self.request
        return ctx


class VerifyCertificateView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, code):
        cert = Certificate.objects.select_related("enrollment__user", "enrollment__course").get(
            verification_code=code.upper()
        )
        return Response(
            CertificateSerializer(cert, context={"request": request}).data
        )


class AdminCertificatesView(generics.ListAPIView):
    serializer_class = CertificateSerializer
    permission_classes = [IsAuthenticated, IsAdministracion]
    queryset = Certificate.objects.select_related("enrollment__user", "enrollment__course").all()
    pagination_class = None

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["request"] = self.request
        return ctx
