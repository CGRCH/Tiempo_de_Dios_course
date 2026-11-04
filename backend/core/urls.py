from django.urls import path

from core.views import CategoryListView, SiteSettingsAdminView, SiteSettingsView

urlpatterns = [
    path("categories/", CategoryListView.as_view(), name="categories"),
    path("settings/", SiteSettingsView.as_view(), name="settings"),
    path("admin/settings/", SiteSettingsAdminView.as_view(), name="admin-settings"),
]
