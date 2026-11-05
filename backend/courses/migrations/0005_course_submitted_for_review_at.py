from django.db import migrations, models
from django.utils import timezone


def backfill_submitted_dates(apps, schema_editor):
    Course = apps.get_model("courses", "Course")
    Course.objects.filter(status="review", submitted_for_review_at__isnull=True).update(
        submitted_for_review_at=timezone.now()
    )


class Migration(migrations.Migration):
    dependencies = [
        ("courses", "0004_course_builder_fields"),
    ]

    operations = [
        migrations.AddField(
            model_name="course",
            name="submitted_for_review_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.RunPython(backfill_submitted_dates, migrations.RunPython.noop),
    ]
