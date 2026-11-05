from django.conf import settings
from rest_framework import serializers

from core.roles import can_view_course_price, can_view_money
from courses.models import Course, CourseModule, Lesson, LessonAttachment, LessonNote
from users.serializers import UserPublicSerializer


class LessonAttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = LessonAttachment
        fields = ("id", "title", "file")


class LessonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lesson
        fields = (
            "id",
            "title",
            "order",
            "duration_seconds",
            "is_preview",
            "video_status",
            "description",
            "lesson_type",
        )


class LessonDetailSerializer(LessonSerializer):
    attachments = LessonAttachmentSerializer(many=True, read_only=True)
    hls_url = serializers.SerializerMethodField()

    class Meta(LessonSerializer.Meta):
        fields = LessonSerializer.Meta.fields + ("attachments", "hls_url")

    def get_hls_url(self, obj):
        request = self.context.get("request")
        user = request.user if request else None
        if not user or not user.is_authenticated:
            if not obj.is_preview:
                return None
        enrolled = self.context.get("enrolled", False)
        if not enrolled and not obj.is_preview:
            return None
        if not obj.hls_path and obj.video_status != "ready":
            return None
        if not obj.hls_path:
            return None
        from courses.video_signing import sign_media_path

        return sign_media_path(obj.hls_path, user.id if user.is_authenticated else 0)


class ModuleSerializer(serializers.ModelSerializer):
    lessons = LessonSerializer(many=True, read_only=True)

    class Meta:
        model = CourseModule
        fields = ("id", "title", "order", "lessons")


class CourseListSerializer(serializers.ModelSerializer):
    teacher_name = serializers.SerializerMethodField()
    category_name = serializers.CharField(source="category.name", read_only=True)
    price_clp = serializers.SerializerMethodField()
    is_free = serializers.BooleanField(read_only=True)
    duration_label = serializers.SerializerMethodField()
    rating_display = serializers.SerializerMethodField()
    cover_url = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = (
            "id",
            "slug",
            "title",
            "teacher_name",
            "category_name",
            "cover",
            "cover_url",
            "cover_placeholder",
            "duration_minutes",
            "duration_label",
            "price_clp",
            "is_free",
            "rating_avg",
            "rating_display",
            "student_count",
            "status",
        )

    def get_cover_url(self, obj):
        if obj.cover:
            return obj.cover.url
        key = obj.cover_placeholder or "c1"
        return f"{settings.MEDIA_URL}covers/{key}.jpg"

    def get_teacher_name(self, obj):
        return obj.teacher.get_full_name() or obj.teacher.username

    def get_price_clp(self, obj):
        request = self.context.get("request")
        user = request.user if request else None
        if not can_view_course_price(user):
            return None
        return obj.price_clp

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get("request")
        user = request.user if request else None
        if not can_view_course_price(user):
            data["price_clp"] = None
            data["is_free"] = None
        return data

    def get_duration_label(self, obj):
        h, m = divmod(obj.duration_minutes, 60)
        if h:
            return f"{h} h {m:02d} min"
        return f"{m} min"

    def get_rating_display(self, obj):
        return str(obj.rating_avg).replace(".", ",")


class CourseDetailSerializer(CourseListSerializer):
    teacher = UserPublicSerializer(read_only=True)
    modules = ModuleSerializer(many=True, read_only=True)
    learning_objectives = serializers.ListField(child=serializers.CharField())
    proposed_price_clp = serializers.SerializerMethodField()
    lesson_count = serializers.SerializerMethodField()

    class Meta(CourseListSerializer.Meta):
        fields = CourseListSerializer.Meta.fields + (
            "description",
            "level",
            "teacher",
            "modules",
            "learning_objectives",
            "lesson_count",
            "proposed_price_clp",
        )

    def get_lesson_count(self, obj):
        return Lesson.objects.filter(module__course=obj).count()

    def get_proposed_price_clp(self, obj):
        request = self.context.get("request")
        user = request.user if request else None
        if can_view_money(user):
            return obj.proposed_price_clp
        if user == obj.teacher:
            return obj.proposed_price_clp
        return None

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get("request")
        user = request.user if request else None
        if not can_view_course_price(user):
            data["price_clp"] = None
        if not can_view_money(user):
            if user != instance.teacher:
                data.pop("proposed_price_clp", None)
        return data


class CourseWriteSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(read_only=True)
    slug = serializers.SlugField(read_only=True)

    class Meta:
        model = Course
        fields = (
            "id",
            "slug",
            "title",
            "subtitle",
            "description",
            "category",
            "level",
            "cover",
            "cover_placeholder",
            "learning_objectives",
            "proposed_price_clp",
        )


class LessonNoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = LessonNote
        fields = ("id", "timestamp_seconds", "text", "created_at", "updated_at")
        read_only_fields = ("id", "created_at", "updated_at")
