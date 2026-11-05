from rest_framework import serializers

from core.roles import primary_role_label
from users.models import User


class UserPublicSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()
    initials = serializers.SerializerMethodField()
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "bio",
            "initials",
            "role",
            "avatar_url",
        )

    def get_avatar_url(self, obj):
        if not obj.avatar:
            return None
        request = self.context.get("request")
        url = obj.avatar.url
        if request:
            return request.build_absolute_uri(url)
        return url

    def get_initials(self, obj):
        return obj.initials()

    def get_role(self, obj):
        return primary_role_label(obj)


class UserAdminSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()
    initials = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "is_blocked",
            "initials",
            "role",
        )

    def get_initials(self, obj):
        return obj.initials()

    def get_role(self, obj):
        return primary_role_label(obj)


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ("username", "email", "password", "first_name", "last_name")

    def create(self, validated_data):
        from django.conf import settings
        from django.contrib.auth.models import Group

        user = User.objects.create_user(**validated_data)
        group, _ = Group.objects.get_or_create(name=settings.GROUP_ALUMNO)
        user.groups.add(group)
        return user


class ProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("first_name", "last_name", "bio", "email", "avatar")
