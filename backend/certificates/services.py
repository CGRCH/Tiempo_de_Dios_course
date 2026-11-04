from io import BytesIO

from celery import shared_task
from django.core.files.base import ContentFile
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas

from certificates.models import Certificate


def issue_certificate(enrollment):
    cert, created = Certificate.objects.get_or_create(
        enrollment=enrollment,
        defaults={"verification_code": Certificate.generate_code()},
    )
    if created or not cert.pdf:
        generate_certificate_pdf.delay(cert.id)
    return cert


@shared_task
def generate_certificate_pdf(certificate_id: int):
    cert = Certificate.objects.select_related(
        "enrollment__user", "enrollment__course"
    ).get(pk=certificate_id)
    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    c.setFont("Helvetica-Bold", 24)
    c.drawString(72, 750, "Tiempo de Dios — Certificado")
    c.setFont("Helvetica", 14)
    user = cert.enrollment.user
    course = cert.enrollment.course
    c.drawString(72, 700, f"Otorgado a: {user.get_full_name() or user.username}")
    c.drawString(72, 680, f"Curso: {course.title}")
    c.drawString(72, 660, f"Código de verificación: {cert.verification_code}")
    c.showPage()
    c.save()
    cert.pdf.save(f"cert_{cert.verification_code}.pdf", ContentFile(buffer.getvalue()), save=True)
