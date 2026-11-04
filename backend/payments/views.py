import csv
import io

from django.http import HttpResponse
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.permissions import CanViewMoney, IsSuperAdmin
from payments.models import Transaction
from payments.serializers import RevenueDashboardSerializer, TransactionSerializer


class TransactionListView(generics.ListAPIView):
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated, CanViewMoney]
    queryset = Transaction.objects.select_related("user", "course").all()
    filterset_fields = ("status", "method")


class RevenueDashboardView(APIView):
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def get(self, request):
        data = RevenueDashboardSerializer.build()
        return Response(data)


class ExportTransactionsCSVView(APIView):
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def get(self, request):
        buf = io.StringIO()
        writer = csv.writer(buf)
        writer.writerow(["ID", "Usuario", "Curso", "Monto", "Método", "Estado"])
        for tx in Transaction.objects.select_related("user", "course").all()[:500]:
            writer.writerow(
                [
                    tx.external_id,
                    tx.user.get_full_name(),
                    tx.course.title,
                    tx.amount_clp,
                    tx.method,
                    tx.status,
                ]
            )
        return HttpResponse(buf.getvalue(), content_type="text/csv")
