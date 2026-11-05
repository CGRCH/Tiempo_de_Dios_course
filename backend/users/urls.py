from django.urls import path

from users.views import AssignRoleView, MeView, RegisterView, UserAdminListView, UserBlockView

urlpatterns = [
    path("auth/register/", RegisterView.as_view(), name="register"),
    path("auth/me/", MeView.as_view(), name="me"),
    path("admin/users/", UserAdminListView.as_view(), name="admin-users"),
    path("admin/users/<int:pk>/block/", UserBlockView.as_view(), name="admin-user-block"),
    path("admin/users/<int:pk>/role/", AssignRoleView.as_view(), name="admin-user-role"),
]
