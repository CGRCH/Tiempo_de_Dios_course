from django.contrib import admin

from courses.models import Course, CourseModule, Lesson, LessonNote


class LessonInline(admin.TabularInline):
    model = Lesson
    extra = 0


class ModuleInline(admin.TabularInline):
    model = CourseModule
    extra = 0
    show_change_link = True


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ("title", "teacher", "status", "price_clp", "student_count")
    list_filter = ("status", "category")
    prepopulated_fields = {"slug": ("title",)}
    inlines = [ModuleInline]


@admin.register(CourseModule)
class CourseModuleAdmin(admin.ModelAdmin):
    list_display = ("title", "course", "order")
    inlines = [LessonInline]


@admin.register(LessonNote)
class LessonNoteAdmin(admin.ModelAdmin):
    list_display = ("user", "lesson", "timestamp_seconds")
