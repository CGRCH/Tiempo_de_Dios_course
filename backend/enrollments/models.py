from django.db import models


class Enrollment(models.Model):
    user = models.ForeignKey("users.User", on_delete=models.CASCADE, related_name="enrollments")
    course = models.ForeignKey(
        "courses.Course", on_delete=models.CASCADE, related_name="enrollments"
    )
    is_active = models.BooleanField(default=True)
    enrolled_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ("user", "course")

    @property
    def progress_percent(self) -> int:
        from courses.models import Lesson

        total_lessons = Lesson.objects.filter(module__course=self.course).count()
        if not total_lessons:
            return 0
        done = LessonProgress.objects.filter(enrollment=self, completed=True).count()
        return int(done * 100 / total_lessons)


class LessonProgress(models.Model):
    enrollment = models.ForeignKey(
        Enrollment, on_delete=models.CASCADE, related_name="lesson_progress"
    )
    lesson = models.ForeignKey("courses.Lesson", on_delete=models.CASCADE)
    completed = models.BooleanField(default=False)
    last_position_seconds = models.PositiveIntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("enrollment", "lesson")
