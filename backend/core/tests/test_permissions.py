from django.contrib.auth.models import Group
from django.test import TestCase
from rest_framework.test import APIClient

from core.models import Category
from core.utils import ensure_role_groups
from courses.models import Course, CourseStatus
from users.models import User


class RolePermissionTests(TestCase):
    def setUp(self):
        ensure_role_groups()
        from django.conf import settings

        self.client = APIClient()
        self.category = Category.objects.create(slug="test", name="Test")
        self.teacher = User.objects.create_user(username="t", password="pass12345")
        self.teacher.groups.add(Group.objects.get(name=settings.GROUP_PROFESOR))
        self.support = User.objects.create_user(username="s", password="pass12345")
        self.support.groups.add(Group.objects.get(name=settings.GROUP_ADMINISTRACION))
        self.admin = User.objects.create_user(
            username="a", password="pass12345", is_superuser=True
        )
        self.admin.groups.add(Group.objects.get(name=settings.GROUP_ADMIN))
        self.student = User.objects.create_user(username="st", password="pass12345")
        self.student.groups.add(Group.objects.get(name=settings.GROUP_ALUMNO))
        self.course = Course.objects.create(
            title="Curso Test",
            slug="curso-test",
            teacher=self.teacher,
            category=self.category,
            description="x",
            status=CourseStatus.PUBLISHED,
            price_clp=24990,
        )

    def test_support_cannot_see_price_in_api(self):
        self.client.force_authenticate(self.support)
        res = self.client.get("/api/courses/")
        self.assertEqual(res.status_code, 200)
        item = res.data["results"][0] if "results" in res.data else res.data[0]
        self.assertIsNone(item.get("price_clp"))

    def test_student_sees_price(self):
        self.client.force_authenticate(self.student)
        res = self.client.get("/api/courses/")
        item = res.data["results"][0] if "results" in res.data else res.data[0]
        self.assertEqual(item.get("price_clp"), 24990)

    def test_admin_revenue_requires_super_admin(self):
        self.client.force_authenticate(self.support)
        res = self.client.get("/api/admin/revenue/")
        self.assertEqual(res.status_code, 403)
        self.client.force_authenticate(self.admin)
        res = self.client.get("/api/admin/revenue/")
        self.assertEqual(res.status_code, 200)
