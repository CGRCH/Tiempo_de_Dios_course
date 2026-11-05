from django.conf import settings
from rest_framework import serializers

from courses.models import Course, CourseModule, Lesson
from courses.serializers import CourseListSerializer


class TeacherLessonBuilderSerializer(serializers.ModelSerializer):
    hls_url = serializers.SerializerMethodField()

    class Meta:
        model = Lesson
        fields = (
            "id",
            "title",
            "description",
            "lesson_type",
            "order",
            "duration_seconds",
            "is_preview",
            "video_status",
            "hls_url",
        )

    def get_hls_url(self, obj):
        if obj.video_status != "ready" or not obj.hls_path:
            return None
        request = self.context.get("request")
        user = request.user if request else None
        if not user:
            return None
        from courses.video_signing import sign_media_path

        return sign_media_path(obj.hls_path, user.id)


class TeacherModuleBuilderSerializer(serializers.ModelSerializer):
    lessons = TeacherLessonBuilderSerializer(many=True, read_only=True)

    class Meta:
        model = CourseModule
        fields = ("id", "title", "order", "lessons")


class TeacherCourseBuilderSerializer(CourseListSerializer):
    subtitle = serializers.CharField(required=False, allow_blank=True)
    modules = TeacherModuleBuilderSerializer(many=True, read_only=True)
    learning_objectives = serializers.ListField(child=serializers.CharField(), required=False)
    proposed_price_clp = serializers.IntegerField(required=False)
    rejection_reason = serializers.CharField(read_only=True)
    category = serializers.IntegerField(source="category_id", read_only=True)
    readiness = serializers.SerializerMethodField()

    class Meta(CourseListSerializer.Meta):
        fields = CourseListSerializer.Meta.fields + (
            "subtitle",
            "description",
            "level",
            "category",
            "modules",
            "learning_objectives",
            "proposed_price_clp",
            "rejection_reason",
            "readiness",
        )

    def get_readiness(self, obj):
        from courses.services import course_review_checklist

        return course_review_checklist(obj)


class TeacherLessonWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lesson
        fields = (
            "title",
            "description",
            "lesson_type",
            "duration_seconds",
            "is_preview",
        )
