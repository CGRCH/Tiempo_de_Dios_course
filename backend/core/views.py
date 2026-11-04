from rest_framework import generics
from rest_framework.permissions import AllowAny, IsAuthenticated

from core.models import Category, SiteSettings
from core.permissions import IsSuperAdmin
from core.serializers import CategorySerializer, SiteSettingsAdminSerializer, SiteSettingsSerializer


class CategoryListView(generics.ListAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]


class SiteSettingsView(generics.RetrieveAPIView):
    serializer_class = SiteSettingsSerializer
    permission_classes = [AllowAny]

    def get_object(self):
        return SiteSettings.load()


class SiteSettingsAdminView(generics.RetrieveUpdateAPIView):
    serializer_class = SiteSettingsAdminSerializer
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def get_object(self):
        return SiteSettings.load()
