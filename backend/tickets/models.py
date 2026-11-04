from django.db import models


class TicketPriority(models.TextChoices):
    LOW = "low", "Baja"
    MEDIUM = "medium", "Media"
    HIGH = "high", "Alta"


class TicketStatus(models.TextChoices):
    OPEN = "open", "Abierto"
    IN_PROGRESS = "in_progress", "En curso"
    CLOSED = "closed", "Cerrado"


class SupportTicket(models.Model):
    user = models.ForeignKey("users.User", on_delete=models.CASCADE, related_name="tickets")
    subject = models.CharField(max_length=255)
    body = models.TextField()
    priority = models.CharField(
        max_length=20, choices=TicketPriority.choices, default=TicketPriority.MEDIUM
    )
    status = models.CharField(
        max_length=20, choices=TicketStatus.choices, default=TicketStatus.OPEN
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class TicketReply(models.Model):
    ticket = models.ForeignKey(SupportTicket, on_delete=models.CASCADE, related_name="replies")
    author = models.ForeignKey("users.User", on_delete=models.CASCADE)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
