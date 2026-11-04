"""Generate demo cover images and HLS placeholders on disk."""

from pathlib import Path

from django.conf import settings


def repo_root() -> Path:
    return Path(settings.BASE_DIR).parent


def ensure_cover_jpegs(keys: list[str] | None = None) -> None:
    from PIL import Image, ImageDraw, ImageFont

    keys = keys or ["c1", "c2", "c3", "c4"]
    covers_dir = Path(settings.MEDIA_ROOT) / "covers"
    covers_dir.mkdir(parents=True, exist_ok=True)
    palette = {
        "c1": "#6b645c",
        "c2": "#8a7a5c",
        "c3": "#4a5c6b",
        "c4": "#5c6b4a",
    }
    for key in keys:
        dest = covers_dir / f"{key}.jpg"
        if dest.exists() and dest.stat().st_size > 500:
            continue
        img = Image.new("RGB", (800, 500), palette.get(key, "#8a8278"))
        draw = ImageDraw.Draw(img)
        draw.text((40, 40), f"Tiempo de Dios · {key.upper()}", fill="#f5f3ef")
        img.save(dest, "JPEG", quality=85)


def ensure_lesson_hls(lesson_id: int, source_mp4: Path | None = None) -> str:
    """Write HLS files under media/hls/lesson_{id}/ and return relative playlist path."""
    from courses.tasks import transcode_lesson_video

    if source_mp4 and source_mp4.exists():
        media_root = Path(settings.MEDIA_ROOT)
        videos_dir = media_root / "videos"
        videos_dir.mkdir(parents=True, exist_ok=True)
        dest_name = f"seed_lesson_{lesson_id}.mp4"
        dest = videos_dir / dest_name
        if not dest.exists():
            dest.write_bytes(source_mp4.read_bytes())
        transcode_lesson_video(lesson_id, f"videos/{dest_name}")
    else:
        media_root = Path(settings.MEDIA_ROOT)
        out_dir = media_root / "hls" / f"lesson_{lesson_id}"
        out_dir.mkdir(parents=True, exist_ok=True)
        playlist = out_dir / "index.m3u8"
        seg = out_dir / "segment0.ts"
        if not playlist.exists():
            playlist.write_text(
                "#EXTM3U\n#EXT-X-VERSION:3\n#EXT-X-TARGETDURATION:10\n"
                "#EXT-X-MEDIA-SEQUENCE:0\n#EXTINF:10.0,\nsegment0.ts\n#EXT-X-ENDLIST\n",
                encoding="utf-8",
            )
        if not seg.exists():
            seg.write_bytes(b"\x47" + b"\x00" * 187)
    return f"hls/lesson_{lesson_id}/index.m3u8"
