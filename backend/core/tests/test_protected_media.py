from django.core.files.base import ContentFile
from django.test import Client, TestCase, override_settings
import tempfile

from django.contrib.auth import get_user_model

from core.demo_media import ensure_lesson_hls
from courses.models import Course, CourseModule, CourseStatus, Lesson
from courses.video_signing import sign_media_path
from enrollments.models import Enrollment

User = get_user_model()


@override_settings(MEDIA_ROOT=tempfile.mkdtemp())
class ProtectedMediaTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.teacher = User.objects.create_user(
            username="t1", email="t1@test.com", password="pass12345"
        )
        self.student = User.objects.create_user(
            username="s1", email="s1@test.com", password="pass12345"
        )
        from core.models import Category

        cat = Category.objects.create(slug="c", name="Cat", order=0)
        self.course = Course.objects.create(
            slug="c1",
            title="Curso",
            teacher=self.teacher,
            category=cat,
            description="d",
            status=CourseStatus.PUBLISHED,
        )
        mod = CourseModule.objects.create(course=self.course, title="M", order=0)
        self.lesson = Lesson.objects.create(
            module=mod, title="L", order=0, duration_seconds=60, video_status="ready"
        )
        self.lesson.hls_path = ensure_lesson_hls(self.lesson.id)
        self.lesson.save(update_fields=["hls_path"])
        Enrollment.objects.create(user=self.student, course=self.course, is_active=True)

    def test_unsigned_hls_returns_forbidden(self):
        rel = self.lesson.hls_path
        response = self.client.get(f"/media/{rel}")
        self.assertEqual(response.status_code, 403)

    def test_signed_hls_for_enrolled_student(self):
        rel = self.lesson.hls_path
        url = sign_media_path(rel, self.student.id)
        path = url.split("/media/", 1)[1]
        response = self.client.get(f"/media/{path}")
        self.assertEqual(response.status_code, 200)

    def test_signed_hls_wrong_user_forbidden(self):
        other = User.objects.create_user(username="x", email="x@test.com", password="pass12345")
        rel = self.lesson.hls_path
        url = sign_media_path(rel, other.id)
        path = url.split("/media/", 1)[1]
        response = self.client.get(f"/media/{path}")
        self.assertEqual(response.status_code, 403)

    def test_public_cover_allowed(self):
        from django.core.files.storage import default_storage

        default_storage.save("covers/test_public.jpg", ContentFile(b"fake"))
        response = self.client.get("/media/covers/test_public.jpg")
        self.assertEqual(response.status_code, 200)
