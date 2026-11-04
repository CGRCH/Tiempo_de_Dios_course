from io import BytesIO
from pathlib import Path

from celery import shared_task
from django.core.files.base import ContentFile
from reportlab.lib.pagesizes import A4
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas

from certificates.models import Certificate
from core.demo_media import repo_root


def _brand_logo_path() -> Path | None:
    path = repo_root() / "frontend" / "public" / "brand" / "logo-tiempo-de-dios.png"
    return path if path.is_file() else None


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
    logo_path = _brand_logo_path()
    y_title = 750
    if logo_path:
        logo_w, logo_h = 240, 49
        c.drawImage(
            ImageReader(str(logo_path)),
            72,
            y_title,
            width=logo_w,
            height=logo_h,
            preserveAspectRatio=True,
            mask="auto",
        )
        y_title -= 60
    else:
        c.setFont("Helvetica-Bold", 24)
        c.drawString(72, y_title, "Tiempo de Dios — Certificado")
        y_title -= 40
    c.setFont("Helvetica", 14)
    user = cert.enrollment.user
    course = cert.enrollment.course
    c.drawString(72, y_title, f"Otorgado a: {user.get_full_name() or user.username}")
    c.drawString(72, y_title - 20, f"Curso: {course.title}")
    c.drawString(72, y_title - 40, f"Código de verificación: {cert.verification_code}")
    c.showPage()
    c.save()
    cert.pdf.save(f"cert_{cert.verification_code}.pdf", ContentFile(buffer.getvalue()), save=True)
