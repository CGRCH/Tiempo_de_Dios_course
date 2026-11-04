from django.db.models import Q
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.permissions import IsAdministracion, IsProfesor, IsSuperAdmin
from core.roles import is_profesor
from core.utils import log_action
from courses.models import Course, CourseModule, CourseStatus, Lesson, LessonNote
from courses.serializers import (
    CourseDetailSerializer,
    CourseListSerializer,
    CourseWriteSerializer,
    LessonDetailSerializer,
    LessonNoteSerializer,
)
from courses.tasks import transcode_lesson_video
from enrollments.models import Enrollment


class CourseListView(generics.ListAPIView):
    serializer_class = CourseListSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        qs = Course.objects.filter(status=CourseStatus.PUBLISHED).select_related(
            "teacher", "category"
        )
        q = self.request.query_params.get("q")
        if q:
            qs = qs.filter(
                Q(title__icontains=q)
                | Q(description__icontains=q)
                | Q(teacher__first_name__icontains=q)
                | Q(teacher__last_name__icontains=q)
            )
        category = self.request.query_params.get("category")
        if category and category != "todos":
            qs = qs.filter(category__slug=category)
        if self.request.query_params.get("free") == "1":
            qs = qs.filter(price_clp=0)
        teacher = self.request.query_params.get("teacher")
        if teacher:
            qs = qs.filter(teacher_id=teacher)
        return qs


class CourseDetailView(generics.RetrieveAPIView):
    serializer_class = CourseDetailSerializer
    permission_classes = [AllowAny]
    lookup_field = "slug"

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated and is_profesor(user):
            return Course.objects.select_related("teacher", "category").prefetch_related(
                "modules__lessons"
            )
        return Course.objects.filter(status=CourseStatus.PUBLISHED).select_related(
            "teacher", "category"
        ).prefetch_related("modules__lessons")


class TeacherCourseListView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, IsProfesor]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return CourseWriteSerializer
        return CourseListSerializer

    def get_queryset(self):
        return Course.objects.filter(teacher=self.request.user).select_related("category")

    def perform_create(self, serializer):
        course = serializer.save(teacher=self.request.user, status=CourseStatus.DRAFT)
        log_action(self.request.user, "create_course", course.slug)


class TeacherCourseDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated, IsProfesor]
    serializer_class = CourseWriteSerializer
    lookup_field = "slug"

    def get_queryset(self):
        return Course.objects.filter(teacher=self.request.user)


class SubmitCourseReviewView(APIView):
    permission_classes = [IsAuthenticated, IsProfesor]

    def post(self, request, slug):
        course = Course.objects.get(slug=slug, teacher=request.user)
        if course.status not in (CourseStatus.DRAFT, CourseStatus.REJECTED):
            return Response({"detail": "Estado no válido."}, status=status.HTTP_400_BAD_REQUEST)
        course.status = CourseStatus.REVIEW
        course.save(update_fields=["status"])
        log_action(request.user, "submit_review", course.slug)
        return Response({"status": course.status})


class ApproveCourseView(APIView):
    permission_classes = [IsAuthenticated, IsAdministracion]

    def post(self, request, slug):
        course = Course.objects.get(slug=slug)
        action = request.data.get("action", "approve")
        if action == "approve":
            course.status = CourseStatus.PUBLISHED
            course.published_at = timezone.now()
            course.save(update_fields=["status", "published_at"])
            log_action(request.user, "approve_course", course.slug)
        else:
            course.status = CourseStatus.REJECTED
            course.save(update_fields=["status"])
            log_action(request.user, "reject_course", course.slug)
        return Response({"status": course.status})


class SetCoursePriceView(APIView):
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def post(self, request, slug):
        course = Course.objects.get(slug=slug)
        price = int(request.data.get("price_clp", 0))
        course.price_clp = max(0, price)
        course.save(update_fields=["price_clp"])
        log_action(request.user, "set_price", course.slug, str(price))
        return Response({"price_clp": course.price_clp})


class PendingCoursesView(generics.ListAPIView):
    serializer_class = CourseListSerializer
    permission_classes = [IsAuthenticated, IsAdministracion]

    def get_queryset(self):
        return Course.objects.filter(status=CourseStatus.REVIEW).select_related(
            "teacher", "category"
        )


class LessonDetailView(generics.RetrieveAPIView):
    serializer_class = LessonDetailSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Lesson.objects.select_related("module__course")

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        lesson = self.get_object()
        user = self.request.user
        preview = lesson.is_preview
        enrolled = False
        if user.is_authenticated:
            enrolled = Enrollment.objects.filter(
                user=user, course=lesson.course, is_active=True
            ).exists()
        ctx["enrolled"] = enrolled or preview
        return ctx


class LessonNoteListCreateView(generics.ListCreateAPIView):
    serializer_class = LessonNoteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return LessonNote.objects.filter(
            user=self.request.user, lesson_id=self.kwargs["lesson_id"]
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user, lesson_id=self.kwargs["lesson_id"])


class LessonVideoUploadView(APIView):
    permission_classes = [IsAuthenticated, IsProfesor]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, lesson_id):
        lesson = Lesson.objects.select_related("module__course").get(pk=lesson_id)
        if lesson.course.teacher != request.user:
            return Response(status=status.HTTP_403_FORBIDDEN)
        video = request.FILES.get("video")
        if not video:
            return Response({"detail": "Archivo requerido."}, status=status.HTTP_400_BAD_REQUEST)
        path = f"videos/lesson_{lesson_id}_{video.name}"
        from django.core.files.storage import default_storage

        saved = default_storage.save(path, video)
        lesson.duration_seconds = int(request.data.get("duration_seconds", 600))
        lesson.save(update_fields=["duration_seconds"])
        transcode_lesson_video.delay(lesson.id, saved)
        return Response({"status": "processing", "lesson_id": lesson.id})


class TeacherModuleCreateView(APIView):
    permission_classes = [IsAuthenticated, IsProfesor]

    def post(self, request, slug):
        course = Course.objects.get(slug=slug, teacher=request.user)
        title = request.data.get("title", "Nuevo módulo")
        order = course.modules.count()
        mod = CourseModule.objects.create(course=course, title=title, order=order)
        return Response({"id": mod.id, "title": mod.title, "order": mod.order})


class TeacherLessonCreateView(APIView):
    permission_classes = [IsAuthenticated, IsProfesor]

    def post(self, request, module_id):
        module = CourseModule.objects.select_related("course").get(pk=module_id)
        if module.course.teacher != request.user:
            return Response(status=status.HTTP_403_FORBIDDEN)
        order = module.lessons.count()
        lesson = Lesson.objects.create(
            module=module,
            title=request.data.get("title", f"Lección {order + 1}"),
            order=order,
            duration_seconds=int(request.data.get("duration_seconds", 300)),
            is_preview=bool(request.data.get("is_preview", False)),
        )
        return Response({"id": lesson.id, "title": lesson.title})


class TeacherStudentsView(APIView):
    permission_classes = [IsAuthenticated, IsProfesor]

    def get(self, request):
        from enrollments.models import Enrollment

        enrollments = (
            Enrollment.objects.filter(course__teacher=request.user, is_active=True)
            .select_related("user", "course")
            .order_by("-enrolled_at")[:100]
        )
        rows = [
            {
                "student": e.user.get_full_name() or e.user.username,
                "course": e.course.title,
                "progress_percent": e.progress_percent,
            }
            for e in enrollments
        ]
        return Response(rows)


class TeacherStatsView(APIView):
    permission_classes = [IsAuthenticated, IsProfesor]

    def get(self, request):
        courses = Course.objects.filter(teacher=request.user)
        published = courses.filter(status=CourseStatus.PUBLISHED).count()
        students = sum(c.student_count for c in courses)
        pending_questions = 7  # demo metric
        return Response(
            {
                "total_students": students,
                "published_courses": published,
                "average_rating": "4,9",
                "unanswered_questions": pending_questions,
            }
        )
