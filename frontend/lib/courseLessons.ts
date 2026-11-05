import type { Course, Lesson, Module } from './api';

export function flatLessons(course: Pick<Course, 'modules'>): Lesson[] {
  return (course.modules || []).flatMap((m) => m.lessons || []);
}

export function firstPreviewLesson(course: Pick<Course, 'modules'>): Lesson | null {
  for (const mod of course.modules || []) {
    const preview = mod.lessons?.find((l) => l.is_preview);
    if (preview) return preview;
  }
  return flatLessons(course)[0] || null;
}

export function findLessonModule(
  course: Pick<Course, 'modules'>,
  lessonId: number | string,
): { module: Module; moduleIndex: number } | null {
  const id = Number(lessonId);
  for (let i = 0; i < (course.modules || []).length; i++) {
    const mod = course.modules![i];
    if (mod.lessons?.some((l) => l.id === id)) {
      return { module: mod, moduleIndex: i + 1 };
    }
  }
  return null;
}
