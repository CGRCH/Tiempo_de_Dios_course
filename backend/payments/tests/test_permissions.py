from django.contrib.auth.models import Group
from django.test import TestCase
from rest_framework.test import APIClient

from core.utils import ensure_role_groups
from payments.models import Transaction, TransactionStatus
from users.models import User


class TransactionMoneyHidingTests(TestCase):
    def setUp(self):
        from django.conf import settings

        ensure_role_groups()
        self.client = APIClient()
        self.support = User.objects.create_user(username="s2", password="pass12345")
        self.support.groups.add(Group.objects.get(name=settings.GROUP_ADMINISTRACION))
        self.admin = User.objects.create_user(username="a2", password="pass12345", is_superuser=True)
        self.admin.groups.add(Group.objects.get(name=settings.GROUP_ADMIN))

    def test_support_cannot_see_transaction_amounts(self):
        from core.models import Category
        from courses.models import Course, CourseStatus

        teacher = User.objects.create_user(username="t2", password="pass12345")
        cat = Category.objects.create(slug="c2", name="C")
        course = Course.objects.create(
            title="C",
            slug="c-slug",
            teacher=teacher,
            category=cat,
            description="d",
            status=CourseStatus.PUBLISHED,
            price_clp=1000,
        )
        student = User.objects.create_user(username="st2", password="pass12345")
        Transaction.objects.create(
            external_id="TX-T",
            user=student,
            course=course,
            amount_clp=1000,
            status=TransactionStatus.PAID,
        )
        self.client.force_authenticate(self.support)
        res = self.client.get("/api/admin/transactions/")
        self.assertEqual(res.status_code, 403)
