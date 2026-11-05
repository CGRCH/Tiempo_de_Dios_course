from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("courses", "0003_course_questions_reviews"),
    ]

    operations = [
        migrations.AddField(
            model_name="course",
            name="subtitle",
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AddField(
            model_name="course",
            name="rejection_reason",
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name="lesson",
            name="description",
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name="lesson",
            name="lesson_type",
            field=models.CharField(
                choices=[("video", "Video"), ("text", "Texto")],
                default="video",
                max_length=10,
            ),
        ),
    ]
