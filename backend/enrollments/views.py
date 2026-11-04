from django.utils import timezone
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.permissions import IsAdministracion
from core.utils import log_action
from courses.models import Course, CourseStatus, Lesson
from enrollments.models import Enrollment, LessonProgress
from enrollments.serializers import EnrollmentSerializer, LessonProgressSerializer
from payments.services import CheckoutService


class MyEnrollmentsView(generics.ListAPIView):
    serializer_class = EnrollmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Enrollment.objects.filter(user=self.request.user, is_active=True).select_related(
            "course", "course__teacher", "course__category"
        )


class ContinueLearningView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        enrollment = (
            Enrollment.objects.filter(user=request.user, is_active=True, completed_at__isnull=True)
            .select_related("course")
            .order_by("-enrolled_at")
            .first()
        )
        if not enrollment:
            return Response(None)
        return Response(EnrollmentSerializer(enrollment, context={"request": request}).data)


class EnrollCourseView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, slug):
        course = Course.objects.get(slug=slug, status=CourseStatus.PUBLISHED)
        if course.price_clp == 0:
            enrollment, created = Enrollment.objects.get_or_create(
                user=request.user, course=course, defaults={"is_active": True}
            )
            if not created:
                enrollment.is_active = True
                enrollment.save(update_fields=["is_active"])
            _bootstrap_progress(enrollment)
            return Response(EnrollmentSerializer(enrollment, context={"request": request}).data)
        checkout = CheckoutService()
        result = checkout.start(request.user, course, request.data.get("method", "webpay"))
        return Response(result, status=status.HTTP_402_PAYMENT_REQUIRED)


class ConfirmEnrollmentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        tx_id = request.data.get("transaction_id")
        enrollment = CheckoutService().complete(request.user, tx_id)
        return Response(EnrollmentSerializer(enrollment, context={"request": request}).data)


class ManualEnrollView(APIView):
    permission_classes = [IsAuthenticated, IsAdministracion]

    def post(self, request):
        user_id = request.data.get("user_id")
        course_id = request.data.get("course_id")
        enrollment, _ = Enrollment.objects.get_or_create(
            user_id=user_id, course_id=course_id, defaults={"is_active": True}
        )
        _bootstrap_progress(enrollment)
        log_action(request.user, "manual_enroll", f"{user_id}:{course_id}")
        return Response(EnrollmentSerializer(enrollment).data)


class LessonProgressUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, lesson_id):
        lesson = Lesson.objects.select_related("module__course").get(pk=lesson_id)
        enrollment = Enrollment.objects.get(
            user=request.user, course=lesson.course, is_active=True
        )
        progress, _ = LessonProgress.objects.get_or_create(
            enrollment=enrollment, lesson=lesson
        )
        progress.last_position_seconds = int(
            request.data.get("last_position_seconds", progress.last_position_seconds)
        )
        if request.data.get("completed"):
            progress.completed = True
        progress.save()
        _maybe_complete_course(enrollment)
        return Response(LessonProgressSerializer(progress).data)


def _bootstrap_progress(enrollment: Enrollment):
    from courses.models import Lesson

    lessons = Lesson.objects.filter(module__course=enrollment.course)
    for lesson in lessons:
        LessonProgress.objects.get_or_create(enrollment=enrollment, lesson=lesson)


def _maybe_complete_course(enrollment: Enrollment):
    from courses.models import Lesson

    total = Lesson.objects.filter(module__course=enrollment.course).count()
    done = LessonProgress.objects.filter(enrollment=enrollment, completed=True).count()
    if total and done >= total:
        enrollment.completed_at = timezone.now()
        enrollment.save(update_fields=["completed_at"])
        from certificates.services import issue_certificate

        issue_certificate(enrollment)
