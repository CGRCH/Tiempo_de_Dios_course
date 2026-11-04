import secrets

from django.db import models


class Certificate(models.Model):
    enrollment = models.OneToOneField(
        "enrollments.Enrollment", on_delete=models.CASCADE, related_name="certificate"
    )
    verification_code = models.CharField(max_length=32, unique=True)
    pdf = models.FileField(upload_to="certificates/", blank=True, null=True)
    issued_at = models.DateTimeField(auto_now_add=True)

    @staticmethod
    def generate_code() -> str:
        return secrets.token_hex(8).upper()
