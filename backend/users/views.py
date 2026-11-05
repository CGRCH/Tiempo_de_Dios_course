from django.conf import settings
from django.contrib.auth.models import Group
from rest_framework import generics, status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.permissions import IsAdministracion, IsSuperAdmin
from core.utils import log_action
from users.models import User
from users.serializers import (
    ProfileUpdateSerializer,
    RegisterSerializer,
    UserAdminSerializer,
    UserPublicSerializer,
)

ROLE_TO_GROUP = {
    "Estudiante": settings.GROUP_ALUMNO,
    "Profesor": settings.GROUP_PROFESOR,
    "Administración (soporte)": settings.GROUP_ADMINISTRACION,
    "Super admin": settings.GROUP_ADMIN,
}


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]


class MeView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_serializer_class(self):
        if self.request.method in ("PUT", "PATCH"):
            return ProfileUpdateSerializer
        return UserPublicSerializer

    def get_object(self):
        return self.request.user


class UserAdminListView(generics.ListAPIView):
    serializer_class = UserAdminSerializer
    permission_classes = [IsAuthenticated, IsAdministracion]
    queryset = User.objects.all().order_by("last_name", "first_name")
    search_fields = ("username", "email", "first_name", "last_name")


class UserBlockView(APIView):
    permission_classes = [IsAuthenticated, IsAdministracion]

    def post(self, request, pk):
        user = User.objects.get(pk=pk)
        user.is_blocked = not user.is_blocked
        user.save(update_fields=["is_blocked"])
        log_action(request.user, "toggle_block", str(user.pk), str(user.is_blocked))
        return Response(UserAdminSerializer(user).data)


class AssignRoleView(APIView):
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def post(self, request, pk):
        role = request.data.get("role")
        if role not in ROLE_TO_GROUP:
            return Response({"detail": "Rol inválido."}, status=status.HTTP_400_BAD_REQUEST)
        user = User.objects.get(pk=pk)
        user.groups.clear()
        if role == "Super admin":
            user.is_superuser = True
            user.is_staff = True
            group = Group.objects.get(name=settings.GROUP_ADMIN)
            user.groups.add(group)
        else:
            user.is_superuser = False
            group = Group.objects.get(name=ROLE_TO_GROUP[role])
            user.groups.add(group)
        user.save()
        log_action(request.user, "assign_role", str(user.pk), role)
        return Response(UserAdminSerializer(user).data)
