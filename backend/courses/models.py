from django.db import models
from django.utils.text import slugify


class CourseStatus(models.TextChoices):
    DRAFT = "draft", "Borrador"
    REVIEW = "review", "En revisión"
    PUBLISHED = "published", "Publicado"
    REJECTED = "rejected", "Rechazado"


class CourseLevel(models.TextChoices):
    BEGINNER = "beginner", "Principiante"
    INTERMEDIATE = "intermediate", "Intermedio"
    ADVANCED = "advanced", "Avanzado"


class Course(models.Model):
    teacher = models.ForeignKey(
        "users.User", on_delete=models.CASCADE, related_name="courses_taught"
    )
    category = models.ForeignKey(
        "core.Category", on_delete=models.PROTECT, related_name="courses"
    )
    title = models.CharField(max_length=255)
    slug = models.SlugField(unique=True, max_length=280)
    subtitle = models.CharField(max_length=255, blank=True)
    description = models.TextField()
    cover = models.ImageField(upload_to="covers/", blank=True, null=True)
    cover_placeholder = models.CharField(
        max_length=20, blank=True, help_text="Demo asset key e.g. c1"
    )
    status = models.CharField(
        max_length=20, choices=CourseStatus.choices, default=CourseStatus.DRAFT
    )
    rejection_reason = models.TextField(blank=True)
    submitted_for_review_at = models.DateTimeField(null=True, blank=True)
    level = models.CharField(
        max_length=20, choices=CourseLevel.choices, default=CourseLevel.INTERMEDIATE
    )
    price_clp = models.PositiveIntegerField(default=0)
    proposed_price_clp = models.PositiveIntegerField(default=0)
    duration_minutes = models.PositiveIntegerField(default=0)
    rating_avg = models.DecimalField(max_digits=3, decimal_places=1, default=0)
    rating_count = models.PositiveIntegerField(default=0)
    student_count = models.PositiveIntegerField(default=0)
    learning_objectives = models.JSONField(default=list, blank=True)
    is_free_preview_lesson = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    published_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-updated_at"]

    def save(self, *args, **kwargs):
        if not self.slug:
            base = slugify(self.title)[:200]
            slug = base
            n = 1
            while Course.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base}-{n}"
                n += 1
            self.slug = slug
        super().save(*args, **kwargs)

    @property
    def is_free(self):
        return self.price_clp == 0

    def recalc_duration(self):
        total = Lesson.objects.filter(module__course=self).aggregate(
            s=models.Sum("duration_seconds")
        )["s"]
        self.duration_minutes = (total or 0) // 60
        self.save(update_fields=["duration_minutes"])


class CourseModule(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="modules")
    title = models.CharField(max_length=255)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order"]
        unique_together = ("course", "order")

    def __str__(self):
        return f"{self.course.title} — {self.title}"


class LessonType(models.TextChoices):
    VIDEO = "video", "Video"
    TEXT = "text", "Texto"


class Lesson(models.Model):
    module = models.ForeignKey(CourseModule, on_delete=models.CASCADE, related_name="lessons")
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    lesson_type = models.CharField(
        max_length=10, choices=LessonType.choices, default=LessonType.VIDEO
    )
    order = models.PositiveIntegerField(default=0)
    duration_seconds = models.PositiveIntegerField(default=0)
    is_preview = models.BooleanField(default=False)
    video_status = models.CharField(max_length=20, default="pending")
    hls_path = models.CharField(max_length=500, blank=True)

    class Meta:
        ordering = ["order"]
        unique_together = ("module", "order")

    @property
    def course(self):
        return self.module.course


class LessonAttachment(models.Model):
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name="attachments")
    title = models.CharField(max_length=255)
    file = models.FileField(upload_to="attachments/")


class LessonNote(models.Model):
    user = models.ForeignKey("users.User", on_delete=models.CASCADE, related_name="lesson_notes")
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name="notes")
    timestamp_seconds = models.PositiveIntegerField()
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["timestamp_seconds"]


class CourseQuestion(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="questions")
    student = models.ForeignKey("users.User", on_delete=models.CASCADE, related_name="course_questions")
    lesson = models.ForeignKey(Lesson, on_delete=models.SET_NULL, null=True, blank=True)
    question = models.TextField()
    answer = models.TextField(blank=True)
    answered_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]


class CourseReview(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="reviews")
    student = models.ForeignKey("users.User", on_delete=models.CASCADE, related_name="course_reviews")
    rating = models.PositiveSmallIntegerField(default=5)
    body = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        unique_together = ("course", "student")
