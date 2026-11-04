from django.db import models


class TransactionStatus(models.TextChoices):
    PENDING = "pending", "Pendiente"
    PAID = "paid", "Pagado"
    REFUNDED = "refunded", "Reembolsado"


class Transaction(models.Model):
    external_id = models.CharField(max_length=32, unique=True)
    user = models.ForeignKey("users.User", on_delete=models.CASCADE, related_name="transactions")
    course = models.ForeignKey(
        "courses.Course", on_delete=models.PROTECT, related_name="transactions"
    )
    amount_clp = models.PositiveIntegerField()
    method = models.CharField(max_length=40, default="webpay")
    status = models.CharField(
        max_length=20, choices=TransactionStatus.choices, default=TransactionStatus.PENDING
    )
    provider_reference = models.CharField(max_length=120, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    paid_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
