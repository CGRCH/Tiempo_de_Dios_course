from django.db import models


class Category(models.Model):
    slug = models.SlugField(unique=True)
    name = models.CharField(max_length=120)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order", "name"]
        verbose_name_plural = "categories"

    def __str__(self):
        return self.name


class SiteSettings(models.Model):
    """Singleton site configuration."""

    church_name = models.CharField(max_length=200, default="Tiempo de Dios")
    church_description = models.TextField(
        default="Iglesia en Santiago de Chile. Formación para crecer en la fe, juntos."
    )
    contact_email = models.EmailField(default="cursos@tiempodedios.cl")
    contact_phone = models.CharField(max_length=40, default="+56 9 0000 0000")
    contact_city = models.CharField(max_length=120, default="Santiago, Chile")
    teacher_earnings_visible = models.BooleanField(
        default=False,
        help_text="Si está activo, los profesores pueden ver ingresos de sus cursos.",
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Site settings"
        verbose_name_plural = "Site settings"

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)

    @classmethod
    def load(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj


class AuditLog(models.Model):
    actor = models.ForeignKey(
        "users.User", null=True, blank=True, on_delete=models.SET_NULL, related_name="audit_logs"
    )
    action = models.CharField(max_length=120)
    target = models.CharField(max_length=255, blank=True)
    detail = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
