from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from certificates.models import Certificate
from certificates.services import generate_certificate_pdf
from core.permissions import IsAdministracion


class ReissueCertificateView(APIView):
    permission_classes = [IsAuthenticated, IsAdministracion]

    def post(self, request, pk):
        cert = Certificate.objects.get(pk=pk)
        cert.verification_code = Certificate.generate_code()
        cert.save(update_fields=["verification_code"])
        generate_certificate_pdf.delay(cert.id)
        return Response({"verification_code": cert.verification_code})
