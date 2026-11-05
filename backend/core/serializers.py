from rest_framework import serializers

from core.models import Category, SiteSettings
from core.roles import can_view_money


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ("id", "slug", "name")


class SiteSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = SiteSettings
        fields = (
            "church_name",
            "church_description",
            "contact_email",
            "contact_phone",
            "contact_city",
            "teacher_earnings_visible",
        )


class SiteSettingsAdminSerializer(SiteSettingsSerializer):
    class Meta(SiteSettingsSerializer.Meta):
        fields = SiteSettingsSerializer.Meta.fields


def strip_money_fields(data: dict, user) -> dict:
    if can_view_money(user):
        return data
    for key in list(data.keys()):
        if any(
            token in key.lower()
            for token in ("price", "amount", "revenue", "ingreso", "monto", "total", "ticket")
        ):
            data.pop(key, None)
    return data
