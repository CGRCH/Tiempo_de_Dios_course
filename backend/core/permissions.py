from rest_framework.permissions import BasePermission

from core.roles import (
    can_view_money,
    is_administracion,
    is_profesor,
    is_super_admin,
)


class IsSuperAdmin(BasePermission):
    def has_permission(self, request, view):
        return is_super_admin(request.user)


class IsAdministracion(BasePermission):
    def has_permission(self, request, view):
        return is_administracion(request.user)


class IsProfesor(BasePermission):
    def has_permission(self, request, view):
        return is_profesor(request.user)


class CanViewMoney(BasePermission):
    def has_permission(self, request, view):
        return can_view_money(request.user)
