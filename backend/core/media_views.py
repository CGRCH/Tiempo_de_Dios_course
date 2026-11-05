from django.views import View

from core.media_serving import serve_media


class MediaServeView(View):
    def get(self, request, path: str):
        return serve_media(request, path)
