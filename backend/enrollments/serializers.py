from rest_framework import serializers

from courses.serializers import CourseListSerializer
from enrollments.models import Enrollment, LessonProgress


class LessonProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = LessonProgress
        fields = ("lesson", "completed", "last_position_seconds")


class EnrollmentSerializer(serializers.ModelSerializer):
    course = CourseListSerializer(read_only=True)
    progress_percent = serializers.IntegerField(read_only=True)
    current_lesson_title = serializers.SerializerMethodField()
    current_lesson_id = serializers.SerializerMethodField()

    class Meta:
        model = Enrollment
        fields = (
            "id",
            "course",
            "progress_percent",
            "current_lesson_title",
            "current_lesson_id",
            "enrolled_at",
            "completed_at",
        )

    def get_current_lesson_title(self, obj):
        lp = (
            LessonProgress.objects.filter(enrollment=obj)
            .exclude(completed=True)
            .select_related("lesson")
            .first()
        )
        if lp:
            return lp.lesson.title
        from courses.models import Lesson

        lesson = Lesson.objects.filter(module__course=obj.course).first()
        return lesson.title if lesson else ""

    def get_current_lesson_id(self, obj):
        lp = (
            LessonProgress.objects.filter(enrollment=obj, completed=False)
            .select_related("lesson")
            .first()
        )
        if lp:
            return lp.lesson_id
        from courses.models import Lesson

        lesson = Lesson.objects.filter(module__course=obj.course).first()
        return lesson.id if lesson else None
