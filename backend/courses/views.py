import os
import re

from django.core.exceptions import ValidationError as DjangoValidationError
from django.db.models import Count, Q
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.models import SiteSettings
from core.permissions import IsAdministracion, IsProfesor, IsSuperAdmin
from core.roles import is_profesor
from core.utils import log_action
from courses.models import Course, CourseModule, CourseQuestion, CourseReview, CourseStatus, Lesson, LessonNote
from courses.serializers import (
    CourseDetailSerializer,
    CourseListSerializer,
    CourseWriteSerializer,
    LessonDetailSerializer,
    LessonNoteSerializer,
)
from courses.teacher_engagement_serializers import CourseQuestionSerializer, CourseReviewSerializer
from courses.teacher_serializers import TeacherCourseBuilderSerializer
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
        course = serializer.save(
            teacher=self.request.user,
            status=CourseStatus.DRAFT,
            cover_placeholder=serializer.validated_data.get("cover_placeholder") or "c1",
        )
        log_action(self.request.user, "create_course", course.slug)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        out = CourseWriteSerializer(serializer.instance, context=self.get_serializer_context())
        headers = self.get_success_headers(out.data)
        return Response(out.data, status=status.HTTP_201_CREATED, headers=headers)


class TeacherCourseDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated, IsProfesor]
    lookup_field = "slug"
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_serializer_class(self):
        if self.request.method == "GET":
            return TeacherCourseBuilderSerializer
        return CourseWriteSerializer

    def get_queryset(self):
        return Course.objects.filter(teacher=self.request.user).prefetch_related(
            "modules__lessons"
        )


class SubmitCourseReviewView(APIView):
    permission_classes = [IsAuthenticated, IsProfesor]

    def post(self, request, slug):
        course = Course.objects.prefetch_related("modules__lessons").get(
            slug=slug, teacher=request.user
        )
        if course.status not in (CourseStatus.DRAFT, CourseStatus.REJECTED):
            return Response({"detail": "Estado no válido."}, status=status.HTTP_400_BAD_REQUEST)
        from courses.services import course_review_checklist

        check = course_review_checklist(course)
        if not check["ready"]:
            return Response(
                {"detail": "Completa el curso antes de enviar.", "missing": check["missing"]},
                status=status.HTTP_400_BAD_REQUEST,
            )
        course.status = CourseStatus.REVIEW
        course.rejection_reason = ""
        course.submitted_for_review_at = timezone.now()
        course.save(update_fields=["status", "rejection_reason", "submitted_for_review_at"])
        log_action(request.user, "submit_review", course.slug)
        return Response({"status": course.status, "message": "Curso enviado a revisión"})


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
            course.rejection_reason = request.data.get("reason", "Revisión rechazada.")
            course.save(update_fields=["status", "rejection_reason"])
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

    ALLOWED_EXTENSIONS = {".mp4", ".mov", ".webm", ".mkv"}
    MAX_BYTES = 500 * 1024 * 1024

    def post(self, request, lesson_id):
        lesson = Lesson.objects.select_related("module__course").get(pk=lesson_id)
        if lesson.course.teacher != request.user:
            return Response(status=status.HTTP_403_FORBIDDEN)
        video = request.FILES.get("video")
        if not video:
            return Response({"detail": "Archivo requerido."}, status=status.HTTP_400_BAD_REQUEST)
        if video.size > self.MAX_BYTES:
            return Response(
                {"detail": "El archivo supera el tamaño máximo permitido."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            safe_name = self._safe_filename(video.name)
        except DjangoValidationError:
            return Response({"detail": "Tipo de archivo no permitido."}, status=status.HTTP_400_BAD_REQUEST)
        path = f"videos/lesson_{lesson_id}_{safe_name}"
        from django.core.files.storage import default_storage

        saved = default_storage.save(path, video)
        lesson.duration_seconds = int(request.data.get("duration_seconds", 600))
        lesson.video_status = "processing"
        lesson.save(update_fields=["duration_seconds", "video_status"])
        transcode_lesson_video.delay(lesson.id, saved)
        return Response({"status": "processing", "lesson_id": lesson.id, "video_status": "processing"})

    @classmethod
    def _safe_filename(cls, original: str) -> str:
        base = os.path.basename(original or "video.mp4")
        base = re.sub(r"[^\w.\-]", "_", base)
        root, ext = os.path.splitext(base)
        ext = ext.lower()
        if ext not in cls.ALLOWED_EXTENSIONS:
            raise DjangoValidationError("invalid extension")
        root = (root or "video")[:80]
        return f"{root}{ext}"


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
            lesson_type=request.data.get("lesson_type", "video"),
            description=request.data.get("description", ""),
        )
        module.course.recalc_duration()
        return Response(
            {
                "id": lesson.id,
                "title": lesson.title,
                "order": lesson.order,
                "lesson_type": lesson.lesson_type,
                "video_status": lesson.video_status,
            }
        )


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
        pending_questions = CourseQuestion.objects.filter(
            course__teacher=request.user, answer=""
        ).count()
        return Response(
            {
                "total_students": students,
                "published_courses": published,
                "average_rating": "4,9",
                "unanswered_questions": pending_questions,
                "teacher_earnings_visible": SiteSettings.load().teacher_earnings_visible,
            }
        )


class TeacherEarningsView(APIView):
    permission_classes = [IsAuthenticated, IsProfesor]

    def get(self, request):
        if not SiteSettings.load().teacher_earnings_visible:
            return Response({"visible": False})
        from django.db.models import Sum

        from payments.models import Transaction, TransactionStatus

        paid = Transaction.objects.filter(
            status=TransactionStatus.PAID, course__teacher=request.user
        )
        total = paid.aggregate(s=Sum("amount_clp"))["s"] or 0
        by_course = [
            {
                "course": row["course__title"],
                "amount_clp": row["amount"] or 0,
                "sales": row["sales"],
            }
            for row in paid.values("course__title")
            .annotate(amount=Sum("amount_clp"), sales=Count("id"))
            .order_by("-amount")
        ]
        return Response({"visible": True, "total_clp": total, "by_course": by_course})


class AdminCourseListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated, IsSuperAdmin]
    serializer_class = CourseListSerializer

    def get_queryset(self):
        return Course.objects.all().select_related("teacher", "category")


class TeacherQuestionsView(generics.ListAPIView):
    permission_classes = [IsAuthenticated, IsProfesor]
    serializer_class = CourseQuestionSerializer
    pagination_class = None

    def get_queryset(self):
        return CourseQuestion.objects.filter(course__teacher=self.request.user).select_related(
            "course", "student", "lesson"
        )


class TeacherQuestionReplyView(APIView):
    permission_classes = [IsAuthenticated, IsProfesor]

    def post(self, request, pk):
        question = CourseQuestion.objects.select_related("course").get(pk=pk)
        if question.course.teacher != request.user:
            return Response(status=status.HTTP_403_FORBIDDEN)
        question.answer = request.data.get("answer", "")
        question.answered_at = timezone.now()
        question.save(update_fields=["answer", "answered_at"])
        return Response(CourseQuestionSerializer(question).data)


class TeacherReviewsView(generics.ListAPIView):
    permission_classes = [IsAuthenticated, IsProfesor]
    serializer_class = CourseReviewSerializer
    pagination_class = None

    def get_queryset(self):
        return CourseReview.objects.filter(course__teacher=self.request.user).select_related(
            "course", "student"
        )
