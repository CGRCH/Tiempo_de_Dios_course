import subprocess
from pathlib import Path

from celery import shared_task
from django.conf import settings


@shared_task
def transcode_lesson_video(lesson_id: int, source_path: str):
    from courses.models import Lesson

    lesson = Lesson.objects.get(pk=lesson_id)
    lesson.video_status = "processing"
    lesson.save(update_fields=["video_status"])

    media_root = Path(settings.MEDIA_ROOT)
    src = media_root / source_path
    out_dir = media_root / "hls" / f"lesson_{lesson_id}"
    out_dir.mkdir(parents=True, exist_ok=True)
    playlist = out_dir / "index.m3u8"

    try:
        if src.exists() and _ffmpeg_available():
            cmd = [
                "ffmpeg",
                "-y",
                "-i",
                str(src),
                "-codec:",
                "copy",
                "-start_number",
                "0",
                "-hls_time",
                "6",
                "-hls_list_size",
                "0",
                "-f",
                "hls",
                str(playlist),
            ]
            subprocess.run(cmd, check=True, capture_output=True, timeout=600)
        else:
            # Demo mode: write a minimal HLS placeholder
            playlist.write_text(
                "#EXTM3U\n#EXT-X-VERSION:3\n#EXT-X-TARGETDURATION:10\n"
                "#EXT-X-MEDIA-SEQUENCE:0\n#EXT-X-ENDLIST\n",
                encoding="utf-8",
            )

        relative = f"hls/lesson_{lesson_id}/index.m3u8"
        lesson.hls_path = relative
        lesson.video_status = "ready"
        lesson.save(update_fields=["hls_path", "video_status"])
        lesson.course.recalc_duration()
    except Exception:
        lesson.video_status = "failed"
        lesson.save(update_fields=["video_status"])
        raise


def _ffmpeg_available() -> bool:
    try:
        subprocess.run(["ffmpeg", "-version"], capture_output=True, check=True, timeout=5)
        return True
    except (OSError, subprocess.SubprocessError):
        return False
