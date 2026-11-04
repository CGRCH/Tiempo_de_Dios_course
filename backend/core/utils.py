from django.db import transaction

from core.models import AuditLog


def log_action(actor, action: str, target: str = "", detail: str = ""):
    AuditLog.objects.create(actor=actor, action=action, target=target, detail=detail)


@transaction.atomic
def ensure_role_groups():
    from django.conf import settings
    from django.contrib.auth.models import Group

    names = [
        settings.GROUP_ALUMNO,
        settings.GROUP_PROFESOR,
        settings.GROUP_ADMINISTRACION,
        settings.GROUP_ADMIN,
    ]
    for name in names:
        Group.objects.get_or_create(name=name)
