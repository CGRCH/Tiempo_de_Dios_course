from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from users.models import User


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    list_display = ("username", "email", "first_name", "last_name", "is_blocked", "is_staff")
    list_filter = ("is_blocked", "is_staff", "groups")
    fieldsets = DjangoUserAdmin.fieldsets + ((None, {"fields": ("bio", "avatar", "is_blocked")}),)
