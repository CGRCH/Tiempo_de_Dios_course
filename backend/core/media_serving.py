import mimetypes
import os
import re
from pathlib import Path

from django.conf import settings
from django.http import FileResponse, Http404, HttpResponse, HttpResponseForbidden
from django.utils.http import http_date

from courses.video_signing import media_query_string, verify_media_signature

PROTECTED_PREFIXES = ("hls/", "videos/", "certificates/")
PUBLIC_PREFIXES = ("covers/", "avatars/")


def is_protected_media_path(relative_path: str) -> bool:
    return relative_path.startswith(PROTECTED_PREFIXES)


def is_public_media_path(relative_path: str) -> bool:
    return relative_path.startswith(PUBLIC_PREFIXES)


def _parse_lesson_id_from_hls(relative_path: str) -> int | None:
    m = re.match(r"hls/lesson_(\d+)/", relative_path)
    return int(m.group(1)) if m else None


def _parse_lesson_id_from_video(relative_path: str) -> int | None:
    m = re.match(r"videos/lesson_(\d+)_", relative_path)
    return int(m.group(1)) if m else None


def user_can_access_media(user_id: int, relative_path: str) -> bool:
    from certificates.models import Certificate
    from courses.models import Lesson
    from enrollments.models import Enrollment
    from users.models import User

    if user_id == 0:
        lesson_id = _parse_lesson_id_from_hls(relative_path)
        if lesson_id:
            lesson = Lesson.objects.filter(pk=lesson_id).first()
            return bool(lesson and lesson.is_preview)
        return False

    try:
        user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return False

    if user.is_superuser or user.is_staff:
        return True

    if relative_path.startswith("certificates/"):
        filename = relative_path.rsplit("/", 1)[-1]
        return Certificate.objects.filter(
            enrollment__user_id=user_id, pdf__endswith=filename
        ).exists()

    lesson_id = _parse_lesson_id_from_hls(relative_path) or _parse_lesson_id_from_video(relative_path)
    if lesson_id:
        lesson = Lesson.objects.select_related("module__course").filter(pk=lesson_id).first()
        if not lesson:
            return False
        if lesson.course.teacher_id == user_id:
            return True
        if lesson.is_preview:
            return True
        return Enrollment.objects.filter(
            user_id=user_id, course=lesson.course, is_active=True
        ).exists()

    return False


def _rewrite_hls_playlist(content: str, playlist_relative: str, user_id: int) -> str:
    dir_prefix = os.path.dirname(playlist_relative)
    lines = []
    for line in content.splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or stripped.startswith("http"):
            lines.append(line)
            continue
        seg_rel = f"{dir_prefix}/{stripped}" if dir_prefix else stripped
        qs = media_query_string(seg_rel, user_id)
        lines.append(f"{stripped}?{qs}")
    return "\n".join(lines) + ("\n" if content.endswith("\n") else "")


def _safe_media_path(relative_path: str) -> Path:
    rel = relative_path.lstrip("/").replace("\\", "/")
    if ".." in rel or rel.startswith("/"):
        raise Http404("Not found")
    full = (Path(settings.MEDIA_ROOT) / rel).resolve()
    root = Path(settings.MEDIA_ROOT).resolve()
    if not str(full).startswith(str(root)):
        raise Http404("Not found")
    if not full.is_file():
        raise Http404("Not found")
    return full


def serve_media(request, path: str):
    relative = path.lstrip("/").replace("\\", "/")

    if is_protected_media_path(relative):
        uid = request.GET.get("uid")
        exp = request.GET.get("exp")
        sig = request.GET.get("sig")
        if uid is None or exp is None or sig is None:
            return HttpResponseForbidden("Firma requerida.")
        try:
            user_id = int(uid)
            expires = int(exp)
        except (TypeError, ValueError):
            return HttpResponseForbidden("Firma inválida.")
        sign_path = relative
        if relative.endswith(".ts") or relative.endswith(".m3u8"):
            # Segments inherit playlist directory signature path uses full relative path
            pass
        if not verify_media_signature(sign_path, user_id, expires, sig):
            return HttpResponseForbidden("Firma inválida o expirada.")
        if not user_can_access_media(user_id, relative):
            return HttpResponseForbidden("Acceso denegado.")

        file_path = _safe_media_path(relative)
        if relative.endswith(".m3u8"):
            text = file_path.read_text(encoding="utf-8")
            rewritten = _rewrite_hls_playlist(text, relative, user_id)
            response = HttpResponse(rewritten, content_type="application/vnd.apple.mpegurl")
            response["Cache-Control"] = "private, no-store"
            return response

        content_type, _ = mimetypes.guess_type(str(file_path))
        response = FileResponse(open(file_path, "rb"), content_type=content_type or "application/octet-stream")
        response["Cache-Control"] = "private, no-store"
        return response

    if is_public_media_path(relative):
        file_path = _safe_media_path(relative)
        content_type, _ = mimetypes.guess_type(str(file_path))
        response = FileResponse(open(file_path, "rb"), content_type=content_type or "application/octet-stream")
        response["Last-Modified"] = http_date(os.path.getmtime(file_path))
        return response

    raise Http404("Not found")
