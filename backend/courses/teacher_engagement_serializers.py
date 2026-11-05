from rest_framework import serializers

from courses.models import CourseQuestion, CourseReview


class CourseQuestionSerializer(serializers.ModelSerializer):
    course_title = serializers.CharField(source="course.title", read_only=True)
    student_name = serializers.SerializerMethodField()
    lesson_title = serializers.CharField(source="lesson.title", read_only=True, allow_null=True)
    is_answered = serializers.SerializerMethodField()

    class Meta:
        model = CourseQuestion
        fields = (
            "id",
            "course",
            "course_title",
            "student_name",
            "lesson",
            "lesson_title",
            "question",
            "answer",
            "is_answered",
            "created_at",
            "answered_at",
        )
        read_only_fields = ("id", "created_at", "answered_at")

    def get_student_name(self, obj):
        return obj.student.get_full_name() or obj.student.username

    def get_is_answered(self, obj):
        return bool(obj.answer.strip()) if obj.answer else False


class CourseReviewSerializer(serializers.ModelSerializer):
    course_title = serializers.CharField(source="course.title", read_only=True)
    student_name = serializers.SerializerMethodField()

    class Meta:
        model = CourseReview
        fields = (
            "id",
            "course",
            "course_title",
            "student_name",
            "rating",
            "body",
            "created_at",
        )

    def get_student_name(self, obj):
        return obj.student.get_full_name() or obj.student.username
