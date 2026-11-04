from django.urls import path

from enrollments.views import (
    ConfirmEnrollmentView,
    ContinueLearningView,
    EnrollCourseView,
    LessonProgressUpdateView,
    ManualEnrollView,
    MyEnrollmentsView,
)

urlpatterns = [
    path("me/enrollments/", MyEnrollmentsView.as_view()),
    path("me/continue/", ContinueLearningView.as_view()),
    path("courses/<slug:slug>/enroll/", EnrollCourseView.as_view()),
    path("checkout/confirm/", ConfirmEnrollmentView.as_view()),
    path("admin/enrollments/manual/", ManualEnrollView.as_view()),
    path("lessons/<int:lesson_id>/progress/", LessonProgressUpdateView.as_view()),
]
