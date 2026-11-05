from django.conf import settings
from django.contrib import admin
from django.urls import include, path

from core.media_views import MediaServeView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("config.api_urls")),
    path("media/<path:path>", MediaServeView.as_view(), name="media-serve"),
]

if settings.DEBUG:
    # Protected prefixes are never served without signature (see core.media_serving).
    pass
