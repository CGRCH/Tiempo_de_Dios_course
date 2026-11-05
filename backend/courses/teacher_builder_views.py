from django.db import transaction
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.permissions import IsProfesor
from courses.models import Course, CourseModule, CourseStatus, Lesson
from courses.services import assert_course_editable, reorder_lessons, reorder_modules
from courses.teacher_serializers import TeacherLessonWriteSerializer


class TeacherModuleDetailView(APIView):
    permission_classes = [IsAuthenticated, IsProfesor]

    def patch(self, request, module_id):
        module = CourseModule.objects.select_related("course").get(pk=module_id)
        if module.course.teacher != request.user:
            return Response(status=status.HTTP_403_FORBIDDEN)
        try:
            assert_course_editable(module.course)
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        title = request.data.get("title")
        if title is not None:
            module.title = title
            module.save(update_fields=["title"])
        return Response({"id": module.id, "title": module.title, "order": module.order})

    def delete(self, request, module_id):
        module = CourseModule.objects.select_related("course").get(pk=module_id)
        if module.course.teacher != request.user:
            return Response(status=status.HTTP_403_FORBIDDEN)
        try:
            assert_course_editable(module.course)
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        course = module.course
        with transaction.atomic():
            module.delete()
            for i, m in enumerate(course.modules.order_by("order")):
                if m.order != i:
                    m.order = i
                    m.save(update_fields=["order"])
            course.recalc_duration()
        return Response(status=status.HTTP_204_NO_CONTENT)


class TeacherModuleMoveView(APIView):
    permission_classes = [IsAuthenticated, IsProfesor]

    def post(self, request, module_id):
        module = CourseModule.objects.select_related("course").get(pk=module_id)
        if module.course.teacher != request.user:
            return Response(status=status.HTTP_403_FORBIDDEN)
        try:
            assert_course_editable(module.course)
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        direction = request.data.get("direction", "up")
        reorder_modules(module.course, module, direction)
        return Response({"ok": True})


class TeacherLessonDetailView(APIView):
    permission_classes = [IsAuthenticated, IsProfesor]

    def patch(self, request, lesson_id):
        lesson = Lesson.objects.select_related("module__course").get(pk=lesson_id)
        if lesson.course.teacher != request.user:
            return Response(status=status.HTTP_403_FORBIDDEN)
        try:
            assert_course_editable(lesson.course)
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        ser = TeacherLessonWriteSerializer(lesson, data=request.data, partial=True)
        ser.is_valid(raise_exception=True)
        ser.save()
        lesson.course.recalc_duration()
        return Response(TeacherLessonWriteSerializer(lesson).data)

    def delete(self, request, lesson_id):
        lesson = Lesson.objects.select_related("module__course").get(pk=lesson_id)
        if lesson.course.teacher != request.user:
            return Response(status=status.HTTP_403_FORBIDDEN)
        try:
            assert_course_editable(lesson.course)
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        module = lesson.module
        course = lesson.course
        with transaction.atomic():
            lesson.delete()
            for i, l in enumerate(module.lessons.order_by("order")):
                if l.order != i:
                    l.order = i
                    l.save(update_fields=["order"])
            course.recalc_duration()
        return Response(status=status.HTTP_204_NO_CONTENT)


class TeacherLessonMoveView(APIView):
    permission_classes = [IsAuthenticated, IsProfesor]

    def post(self, request, lesson_id):
        lesson = Lesson.objects.select_related("module__course").get(pk=lesson_id)
        if lesson.course.teacher != request.user:
            return Response(status=status.HTTP_403_FORBIDDEN)
        try:
            assert_course_editable(lesson.course)
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        direction = request.data.get("direction", "up")
        reorder_lessons(lesson.module, lesson, direction)
        return Response({"ok": True})
