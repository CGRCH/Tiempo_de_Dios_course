from django.urls import path

from courses.views import (
    ApproveCourseView,
    CourseDetailView,
    CourseListView,
    LessonDetailView,
    LessonNoteListCreateView,
    LessonVideoUploadView,
    PendingCoursesView,
    SetCoursePriceView,
    SubmitCourseReviewView,
    TeacherCourseDetailView,
    TeacherCourseListView,
    TeacherLessonCreateView,
    TeacherModuleCreateView,
    TeacherStudentsView,
    TeacherStatsView,
)

urlpatterns = [
    path("courses/", CourseListView.as_view(), name="course-list"),
    path("courses/<slug:slug>/", CourseDetailView.as_view(), name="course-detail"),
    path("teacher/courses/", TeacherCourseListView.as_view(), name="teacher-courses"),
    path("teacher/courses/<slug:slug>/", TeacherCourseDetailView.as_view(), name="teacher-course"),
    path(
        "teacher/courses/<slug:slug>/submit-review/",
        SubmitCourseReviewView.as_view(),
        name="course-submit-review",
    ),
    path("teacher/students/", TeacherStudentsView.as_view()),
    path("teacher/stats/", TeacherStatsView.as_view(), name="teacher-stats"),
    path("teacher/courses/<slug:slug>/modules/", TeacherModuleCreateView.as_view()),
    path("teacher/modules/<int:module_id>/lessons/", TeacherLessonCreateView.as_view()),
    path("teacher/lessons/<int:lesson_id>/video/", LessonVideoUploadView.as_view()),
    path("lessons/<int:pk>/", LessonDetailView.as_view(), name="lesson-detail"),
    path("lessons/<int:lesson_id>/notes/", LessonNoteListCreateView.as_view()),
    path("admin/courses/pending/", PendingCoursesView.as_view()),
    path("admin/courses/<slug:slug>/approve/", ApproveCourseView.as_view()),
    path("admin/courses/<slug:slug>/price/", SetCoursePriceView.as_view()),
]
