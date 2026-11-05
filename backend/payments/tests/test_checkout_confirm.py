from django.contrib.auth import get_user_model
from django.test import Client, TestCase, override_settings

from core.models import Category
from courses.models import Course, CourseStatus
from payments.models import Transaction, TransactionStatus

User = get_user_model()


class CheckoutConfirmTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(
            username="buyer", email="b@test.com", password="pass12345"
        )
        self.other = User.objects.create_user(
            username="other", email="o@test.com", password="pass12345"
        )
        cat = Category.objects.create(slug="cat", name="Cat", order=0)
        teacher = User.objects.create_user(
            username="teach", email="t@test.com", password="pass12345"
        )
        self.course = Course.objects.create(
            slug="paid",
            title="Paid",
            teacher=teacher,
            category=cat,
            description="d",
            status=CourseStatus.PUBLISHED,
            price_clp=10000,
        )
        self.tx = Transaction.objects.create(
            external_id="TX-ABUSE01",
            user=self.user,
            course=self.course,
            amount_clp=10000,
            status=TransactionStatus.PENDING,
        )

    def _login(self, user):
        from rest_framework_simplejwt.tokens import RefreshToken

        token = RefreshToken.for_user(user)
        self.client.cookies["td_access"] = str(token.access_token)

    @override_settings(ALLOW_SIMULATED_PAYMENTS=False)
    def test_confirm_blocked_when_simulation_disabled(self):
        self._login(self.user)
        res = self.client.post(
            "/api/checkout/confirm/",
            {"transaction_id": self.tx.external_id},
            content_type="application/json",
        )
        self.assertEqual(res.status_code, 400)

    @override_settings(ALLOW_SIMULATED_PAYMENTS=True)
    def test_confirm_other_users_transaction_rejected(self):
        self._login(self.other)
        res = self.client.post(
            "/api/checkout/confirm/",
            {"transaction_id": self.tx.external_id},
            content_type="application/json",
        )
        self.assertEqual(res.status_code, 400)

    @override_settings(ALLOW_SIMULATED_PAYMENTS=True)
    def test_confirm_own_pending_transaction(self):
        self._login(self.user)
        res = self.client.post(
            "/api/checkout/confirm/",
            {"transaction_id": self.tx.external_id},
            content_type="application/json",
        )
        self.assertEqual(res.status_code, 200)
        self.tx.refresh_from_db()
        self.assertEqual(self.tx.status, TransactionStatus.PAID)
