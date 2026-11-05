import uuid
from abc import ABC, abstractmethod

from django.conf import settings
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from payments.models import Transaction, TransactionStatus


class PaymentProvider(ABC):
    @abstractmethod
    def create_payment(self, transaction: Transaction) -> dict:
        ...


class SimulatedWebpayProvider(PaymentProvider):
    def create_payment(self, transaction: Transaction) -> dict:
        transaction.provider_reference = f"SIM-{uuid.uuid4().hex[:12]}"
        transaction.save(update_fields=["provider_reference"])
        return {
            "provider": "simulated_webpay",
            "transaction_id": transaction.external_id,
            "redirect_url": None,
            "simulated": True,
            "message": "Pago simulado — confirme en checkout para completar.",
        }


class CheckoutService:
    def __init__(self, provider: PaymentProvider | None = None):
        self.provider = provider or SimulatedWebpayProvider()

    def start(self, user, course, method: str) -> dict:
        tx = Transaction.objects.create(
            external_id=f"TX-{uuid.uuid4().hex[:8].upper()}",
            user=user,
            course=course,
            amount_clp=course.price_clp,
            method=method,
            status=TransactionStatus.PENDING,
        )
        payload = self.provider.create_payment(tx)
        payload["amount_clp"] = course.price_clp
        return payload

    def complete(self, user, transaction_id: str):
        """
        Demo-only confirmation when ALLOW_SIMULATED_PAYMENTS is enabled.
        Production must confirm payments via the provider webhook, not client POST.
        """
        from enrollments.models import Enrollment
        from enrollments.views import _bootstrap_progress

        if not settings.ALLOW_SIMULATED_PAYMENTS:
            raise ValidationError("La confirmación simulada de pago no está habilitada.")
        if not transaction_id:
            raise ValidationError("transaction_id es obligatorio.")
        try:
            tx = Transaction.objects.get(external_id=transaction_id, user=user)
        except Transaction.DoesNotExist:
            raise ValidationError("Transacción no encontrada.")
        if tx.status != TransactionStatus.PENDING:
            raise ValidationError("La transacción no está pendiente de pago.")
        tx.status = TransactionStatus.PAID
        tx.paid_at = timezone.now()
        tx.save(update_fields=["status", "paid_at"])
        enrollment, _ = Enrollment.objects.get_or_create(
            user=user, course=tx.course, defaults={"is_active": True}
        )
        enrollment.is_active = True
        enrollment.save(update_fields=["is_active"])
        _bootstrap_progress(enrollment)
        tx.course.student_count += 1
        tx.course.save(update_fields=["student_count"])
        return enrollment
