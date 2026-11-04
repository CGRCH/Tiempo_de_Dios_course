from django.contrib.auth.models import Group
from django.test import TestCase
from rest_framework.test import APIClient

from core.utils import ensure_role_groups
from users.models import User


class BlockedLoginTests(TestCase):
    def setUp(self):
        ensure_role_groups()
        self.client = APIClient()
        self.user = User.objects.create_user(username="blocked", password="pass12345")
        self.user.is_blocked = True
        self.user.save()

    def test_blocked_user_cannot_obtain_token(self):
        res = self.client.post("/api/auth/token/", {"username": "blocked", "password": "pass12345"})
        self.assertEqual(res.status_code, 403)
