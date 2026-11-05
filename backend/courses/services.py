from courses.models import Course, CourseModule, Lesson


def course_review_checklist(course: Course) -> dict:
    """Returns {ready: bool, missing: [str], items: {key: bool}} for submit review UI."""
    modules = list(course.modules.prefetch_related("lessons"))
    lessons = [l for m in modules for l in m.lessons.all()]
    has_cover = bool(course.cover) or bool(course.cover_placeholder)
    has_description = bool((course.description or "").strip())
    has_module = len(modules) >= 1
    has_lesson = len(lessons) >= 1
    has_ready_video = any(
        l.lesson_type == "video" and l.video_status == "ready" for l in lessons
    ) or any(l.lesson_type == "text" for l in lessons)

    items = {
        "description": has_description,
        "cover": has_cover,
        "module": has_module,
        "lesson": has_lesson,
        "video_ready": has_ready_video,
    }
    labels = {
        "description": "Descripción del curso",
        "cover": "Imagen de portada",
        "module": "Al menos 1 módulo",
        "lesson": "Al menos 1 lección",
        "video_ready": "Al menos 1 lección con video listo (o lección de texto)",
    }
    missing = [labels[k] for k, ok in items.items() if not ok]
    return {"ready": len(missing) == 0, "missing": missing, "items": items}


def assert_course_editable(course: Course):
    from courses.models import CourseStatus

    if course.status not in (CourseStatus.DRAFT, CourseStatus.REJECTED):
        raise ValueError("Curso no editable en este estado.")


def reorder_modules(course: Course, module: CourseModule, direction: str):
    modules = list(course.modules.order_by("order"))
    idx = next(i for i, m in enumerate(modules) if m.id == module.id)
    swap = idx - 1 if direction == "up" else idx + 1
    if swap < 0 or swap >= len(modules):
        return
    a, b = modules[idx], modules[swap]
    a.order, b.order = b.order, a.order
    CourseModule.objects.bulk_update([a, b], ["order"])


def reorder_lessons(module: CourseModule, lesson: Lesson, direction: str):
    lessons = list(module.lessons.order_by("order"))
    idx = next(i for i, l in enumerate(lessons) if l.id == lesson.id)
    swap = idx - 1 if direction == "up" else idx + 1
    if swap < 0 or swap >= len(lessons):
        return
    a, b = lessons[idx], lessons[swap]
    a.order, b.order = b.order, a.order
    Lesson.objects.bulk_update([a, b], ["order"])
