import hashlib
import hmac
import time
from urllib.parse import urlencode

from django.conf import settings


def sign_media_path(relative_path: str, user_id: int) -> str:
    expires = int(time.time()) + settings.VIDEO_URL_TTL_SECONDS
    payload = f"{relative_path}:{user_id}:{expires}"
    sig = hmac.new(
        settings.VIDEO_SIGNING_SECRET.encode(),
        payload.encode(),
        hashlib.sha256,
    ).hexdigest()
    qs = urlencode({"uid": user_id, "exp": expires, "sig": sig})
    return f"{settings.MEDIA_URL}{relative_path}?{qs}"


def verify_media_signature(relative_path: str, user_id: int, expires: int, sig: str) -> bool:
    if expires < int(time.time()):
        return False
    payload = f"{relative_path}:{user_id}:{expires}"
    expected = hmac.new(
        settings.VIDEO_SIGNING_SECRET.encode(),
        payload.encode(),
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(expected, sig)
