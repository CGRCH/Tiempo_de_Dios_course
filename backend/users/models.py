from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    bio = models.TextField(blank=True)
    avatar = models.ImageField(upload_to="avatars/", blank=True, null=True)
    is_blocked = models.BooleanField(default=False)

    def initials(self) -> str:
        parts = (self.first_name, self.last_name)
        if all(parts):
            return (parts[0][:1] + parts[1][:1]).upper()
        if self.first_name:
            return self.first_name[:2].upper()
        return self.username[:2].upper()
