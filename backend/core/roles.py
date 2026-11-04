from django.conf import settings


def user_in_group(user, group_name: str) -> bool:
    if not user or not user.is_authenticated:
        return False
    if user.is_superuser:
        return group_name == settings.GROUP_ADMIN
    return user.groups.filter(name=group_name).exists()


def is_super_admin(user) -> bool:
    if not user or not user.is_authenticated:
        return False
    return user.is_superuser or user_in_group(user, settings.GROUP_ADMIN)


def is_administracion(user) -> bool:
    return user_in_group(user, settings.GROUP_ADMINISTRACION) or is_super_admin(user)


def is_profesor(user) -> bool:
    return user_in_group(user, settings.GROUP_PROFESOR)


def is_alumno(user) -> bool:
    return user.is_authenticated and (
        user_in_group(user, settings.GROUP_ALUMNO)
        or is_profesor(user)
        or not user.groups.exists()
    )


def can_view_money(user) -> bool:
    """Ingresos, transacciones y montos agregados — solo super admin."""
    return is_super_admin(user)


def can_view_course_price(user) -> bool:
    """Precio de catálogo para compra — estudiantes y visitantes; no soporte."""
    if not user or not user.is_authenticated:
        return True
    if is_super_admin(user):
        return True
    if user_in_group(user, settings.GROUP_ADMINISTRACION) and not is_super_admin(user):
        return False
    if user_in_group(user, settings.GROUP_PROFESOR) and not is_administracion(user):
        return False
    return True


def primary_role_label(user) -> str:
    if is_super_admin(user):
        return "Super admin"
    if user_in_group(user, settings.GROUP_ADMINISTRACION):
        return "Administración (soporte)"
    if user_in_group(user, settings.GROUP_PROFESOR):
        return "Profesor"
    return "Estudiante"
