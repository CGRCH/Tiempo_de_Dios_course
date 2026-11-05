'use client';

import { VideoPlayer } from '@/components/VideoPlayer';
import { Card, Pill, Tag } from '@/components/ui';
import { API_URL, courseCoverUrl, formatDuration } from '@/lib/api';
import clsx from 'clsx';
import { useCallback, useEffect, useMemo, useState } from 'react';

export type BuilderLesson = {
  id: number;
  title: string;
  description: string;
  lesson_type: string;
  order: number;
  duration_seconds: number;
  is_preview: boolean;
  video_status: string;
  hls_url?: string | null;
};

export type BuilderModule = {
  id: number;
  title: string;
  order: number;
  lessons: BuilderLesson[];
};

export type BuilderCourse = {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  level: string;
  category: number;
  status: string;
  rejection_reason: string;
  cover_url?: string | null;
  cover_placeholder: string;
  proposed_price_clp: number;
  learning_objectives: string[];
  modules: BuilderModule[];
  readiness: {
    ready: boolean;
    missing: string[];
    items: Record<string, boolean>;
  };
};

type Category = { id: number; name: string };

const STATUS_LABEL: Record<string, { label: string; tone: 'neutral' | 'ok' | 'rev' | 'dr' | 'red' }> = {
  draft: { label: 'Borrador', tone: 'dr' },
  review: { label: 'En revisión', tone: 'rev' },
  published: { label: 'Publicado', tone: 'ok' },
  rejected: { label: 'Rechazado', tone: 'red' },
};

const VIDEO_BADGE: Record<string, string> = {
  pending: 'Pendiente',
  processing: 'Procesando',
  ready: 'Listo',
  failed: 'Error',
};

function authHeaders(token: string, json = true): HeadersInit {
  const h: HeadersInit = { Authorization: `Bearer ${token}` };
  if (json) h['Content-Type'] = 'application/json';
  return h;
}

export function CourseBuilder({ slug, token }: { slug: string; token: string | null }) {
  const [tab, setTab] = useState<'info' | 'curriculum' | 'review'>('info');
  const [course, setCourse] = useState<BuilderCourse | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [toast, setToast] = useState('');
  const [saving, setSaving] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [lessonModal, setLessonModal] = useState<BuilderLesson | null>(null);
  const [lessonModuleId, setLessonModuleId] = useState<number | null>(null);
  const [uploadPct, setUploadPct] = useState<number | null>(null);
  const [uploadPhase, setUploadPhase] = useState<'idle' | 'uploading' | 'processing'>('idle');

  const editable = course?.status === 'draft' || course?.status === 'rejected';

  const load = useCallback(async () => {
    if (!token) return;
    const r = await fetch(`${API_URL}/teacher/courses/${slug}/`, {
      headers: authHeaders(token, false),
    });
    if (!r.ok) return;
    setCourse(await r.json());
  }, [slug, token]);

  useEffect(() => {
    load();
    fetch(`${API_URL}/categories/`)
      .then((r) => r.json())
      .then((d) => setCategories(Array.isArray(d) ? d : d.results || []));
  }, [load]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (!lessonModal || !token) return;
    if (lessonModal.video_status === 'ready' || lessonModal.video_status === 'failed') return;
    const t = setInterval(async () => {
      const r = await fetch(`${API_URL}/lessons/${lessonModal.id}/`, {
        headers: authHeaders(token, false),
      });
      if (!r.ok) return;
      const d = await r.json();
      setLessonModal((prev) => (prev ? { ...prev, ...d } : prev));
      if (d.video_status === 'ready' || d.video_status === 'failed') {
        setUploadPhase('idle');
        load();
      }
    }, 2000);
    return () => clearInterval(t);
  }, [lessonModal, token, load]);

  const patchCourse = async (body: FormData | object) => {
    if (!token || !course) return false;
    setSaving(true);
    const isForm = body instanceof FormData;
    const r = await fetch(`${API_URL}/teacher/courses/${slug}/`, {
      method: 'PATCH',
      headers: isForm ? { Authorization: `Bearer ${token}` } : authHeaders(token),
      body: isForm ? body : JSON.stringify(body),
    });
    setSaving(false);
    if (!r.ok) {
      setToast('No se pudo guardar.');
      return false;
    }
    await load();
    setToast('Cambios guardados.');
    return true;
  };

  const saveInfo = async () => {
    if (!course) return;
    const payload = {
      title: course.title,
      subtitle: course.subtitle,
      description: course.description,
      level: course.level,
      category: course.category,
      proposed_price_clp: course.proposed_price_clp,
      learning_objectives: course.learning_objectives,
    };
    const ok = await patchCourse(payload);
    if (ok && coverFile) {
      const fd = new FormData();
      fd.append('cover', coverFile);
      const r = await fetch(`${API_URL}/teacher/courses/${slug}/`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (r.ok) {
        setCoverFile(null);
        setCoverPreview(null);
        await load();
        setToast('Portada actualizada.');
      }
    }
  };

  const addModule = async () => {
    if (!token || !editable) return;
    const r = await fetch(`${API_URL}/teacher/courses/${slug}/modules/`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ title: `Módulo ${(course?.modules.length || 0) + 1}` }),
    });
    const data = await r.json();
    if (r.ok) {
      setToast(`Módulo creado #${data.id}`);
      await load();
      setTab('curriculum');
    }
  };

  const addLesson = async (moduleId: number) => {
    if (!token || !editable) return;
    const r = await fetch(`${API_URL}/teacher/modules/${moduleId}/lessons/`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ title: 'Nueva lección', lesson_type: 'video', duration_seconds: 300 }),
    });
    const data = await r.json();
    if (r.ok) {
      setToast(`Lección creada #${data.id}`);
      await load();
      setLessonModuleId(moduleId);
      setLessonModal({
        id: data.id,
        title: data.title,
        description: '',
        lesson_type: 'video',
        order: data.order ?? 0,
        duration_seconds: 300,
        is_preview: false,
        video_status: data.video_status || 'pending',
        hls_url: null,
      });
    }
  };

  const openLesson = (modId: number, lesson: BuilderLesson) => {
    setLessonModuleId(modId);
    setLessonModal({ ...lesson });
  };

  const saveLessonModal = async () => {
    if (!token || !lessonModal) return;
    await fetch(`${API_URL}/teacher/lessons/${lessonModal.id}/`, {
      method: 'PATCH',
      headers: authHeaders(token),
      body: JSON.stringify({
        title: lessonModal.title,
        description: lessonModal.description,
        lesson_type: lessonModal.lesson_type,
        is_preview: lessonModal.is_preview,
        duration_seconds: lessonModal.duration_seconds,
      }),
    });
    setToast('Lección guardada.');
    await load();
  };

  const uploadVideo = (file: File) => {
    if (!token || !lessonModal) return;
    setUploadPhase('uploading');
    setUploadPct(0);
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_URL}/teacher/lessons/${lessonModal.id}/video/`);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) setUploadPct(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      setUploadPct(null);
      if (xhr.status >= 200 && xhr.status < 300) {
        setUploadPhase('processing');
        setLessonModal((p) => (p ? { ...p, video_status: 'processing' } : p));
        setToast('Video subido — procesando…');
      } else {
        setUploadPhase('idle');
        setToast('Error al subir video.');
      }
    };
    const fd = new FormData();
    fd.append('video', file);
    fd.append('duration_seconds', String(lessonModal.duration_seconds || 300));
    xhr.send(fd);
  };

  const submitReview = async () => {
    if (!token) return;
    const r = await fetch(`${API_URL}/teacher/courses/${slug}/submit-review/`, {
      method: 'POST',
      headers: authHeaders(token),
    });
    const data = await r.json();
    if (r.ok) {
      setToast('Curso enviado a revisión');
      await load();
    } else {
      setToast(data.missing?.join(', ') || data.detail || 'No se pudo enviar.');
    }
  };

  const statusMeta = course ? STATUS_LABEL[course.status] || STATUS_LABEL.draft : STATUS_LABEL.draft;

  const coverDisplay = useMemo(() => {
    if (coverPreview) return coverPreview;
    if (course?.cover_url) {
      const u = course.cover_url;
      return u.startsWith('http') ? u : `${typeof window !== 'undefined' ? '' : API_URL.replace(/\/api\/?$/, '')}${u}`;
    }
    if (course) return courseCoverUrl(course);
    return '';
  }, [course, coverPreview]);

  if (!course) {
    return <Card className="mt-6 p-8 text-muted">Cargando constructor…</Card>;
  }

  return (
    <div className="mt-6 space-y-4" data-testid="course-builder">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Tag tone={statusMeta.tone}>{statusMeta.label}</Tag>
            {course.status === 'rejected' && course.rejection_reason && (
              <span className="text-sm text-red-800">{course.rejection_reason}</span>
            )}
          </div>
          <h2 className="mt-2 text-2xl font-black">{course.title}</h2>
        </div>
        <button
          type="button"
          data-testid="builder-save"
          disabled={!editable || saving}
          onClick={() => saveInfo()}
          className="rounded-full bg-ink px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {saving ? 'Guardando…' : 'Guardar'}
        </button>
      </div>

      {toast && (
        <p className="rounded-xl bg-[#dff1e3] px-4 py-2 text-sm text-[#1d5e2e]" data-testid="builder-toast" role="status">
          {toast}
        </p>
      )}

      <div className="flex flex-wrap gap-2 border-b border-[#e4e0d8] pb-2" role="tablist">
        {(
          [
            ['info', 'Información básica'],
            ['curriculum', 'Currículo'],
            ['review', 'Revisión / Enviar'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            data-testid={`builder-tab-${id}`}
            className={clsx(
              'rounded-full px-4 py-2 text-sm font-semibold',
              tab === id ? 'bg-ink text-white' : 'bg-[#efece6]',
            )}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'info' && (
        <Card className="space-y-4 p-6">
          <label className="block text-sm font-medium">
            Título
            <input
              className="mt-1 w-full rounded-xl border px-4 py-2"
              value={course.title}
              disabled={!editable}
              onChange={(e) => setCourse({ ...course, title: e.target.value })}
            />
          </label>
          <label className="block text-sm font-medium">
            Subtítulo
            <input
              className="mt-1 w-full rounded-xl border px-4 py-2"
              value={course.subtitle || ''}
              disabled={!editable}
              onChange={(e) => setCourse({ ...course, subtitle: e.target.value })}
            />
          </label>
          <label className="block text-sm font-medium">
            Descripción
            <textarea
              className="mt-1 min-h-[120px] w-full rounded-xl border px-4 py-2"
              value={course.description}
              disabled={!editable}
              onChange={(e) => setCourse({ ...course, description: e.target.value })}
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium">
              Categoría
              <select
                className="mt-1 w-full rounded-xl border px-4 py-2"
                value={course.category}
                disabled={!editable}
                onChange={(e) => setCourse({ ...course, category: Number(e.target.value) })}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium">
              Nivel
              <select
                className="mt-1 w-full rounded-xl border px-4 py-2"
                value={course.level}
                disabled={!editable}
                onChange={(e) => setCourse({ ...course, level: e.target.value })}
              >
                <option value="beginner">Principiante</option>
                <option value="intermediate">Intermedio</option>
                <option value="advanced">Avanzado</option>
              </select>
            </label>
          </div>
          <label className="block text-sm font-medium">
            Precio propuesto (CLP)
            <input
              type="number"
              min={0}
              className="mt-1 w-full rounded-xl border px-4 py-2"
              value={course.proposed_price_clp || 0}
              disabled={!editable}
              onChange={(e) => setCourse({ ...course, proposed_price_clp: Number(e.target.value) })}
            />
          </label>
          <div>
            <p className="text-sm font-medium">Portada</p>
            {coverDisplay && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={coverDisplay} alt="" className="mt-2 h-40 w-full max-w-md rounded-xl object-cover" />
            )}
            <input
              type="file"
              accept="image/*"
              disabled={!editable}
              className="mt-2 block text-sm"
              data-testid="builder-cover-upload"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                setCoverFile(f);
                setCoverPreview(URL.createObjectURL(f));
              }}
            />
          </div>
        </Card>
      )}

      {tab === 'curriculum' && (
        <div className="space-y-4">
          {course.modules.length === 0 ? (
            <Card className="p-8 text-center" data-testid="curriculum-empty">
              <p className="text-muted">Aún no hay módulos. Crea el primero para organizar tus lecciones.</p>
              <button
                type="button"
                data-testid="create-module"
                disabled={!editable}
                onClick={addModule}
                className="mt-4 rounded-full bg-ink px-5 py-2 text-sm font-semibold text-white"
              >
                + Crear primer módulo
              </button>
            </Card>
          ) : (
            course.modules.map((mod, mi) => (
              <Card key={mod.id} className="p-5" data-testid={`builder-module-${mod.id}`}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <input
                    className="min-w-[200px] flex-1 rounded-lg border px-3 py-2 font-bold"
                    value={mod.title}
                    disabled={!editable}
                    onChange={(e) =>
                      setCourse({
                        ...course,
                        modules: course.modules.map((m) =>
                          m.id === mod.id ? { ...m, title: e.target.value } : m,
                        ),
                      })
                    }
                    onBlur={async () => {
                      if (!editable) return;
                      await fetch(`${API_URL}/teacher/modules/${mod.id}/`, {
                        method: 'PATCH',
                        headers: authHeaders(token!),
                        body: JSON.stringify({ title: mod.title }),
                      });
                    }}
                  />
                  <div className="flex flex-wrap gap-1">
                    <button type="button" disabled={!editable || mi === 0} className="rounded border px-2 py-1 text-xs" aria-label="Subir módulo" onClick={() => fetch(`${API_URL}/teacher/modules/${mod.id}/move/`, { method: 'POST', headers: authHeaders(token!), body: JSON.stringify({ direction: 'up' }) }).then(load)}>↑</button>
                    <button type="button" disabled={!editable || mi === course.modules.length - 1} className="rounded border px-2 py-1 text-xs" aria-label="Bajar módulo" onClick={() => fetch(`${API_URL}/teacher/modules/${mod.id}/move/`, { method: 'POST', headers: authHeaders(token!), body: JSON.stringify({ direction: 'down' }) }).then(load)}>↓</button>
                    <button
                      type="button"
                      disabled={!editable}
                      className="rounded border px-2 py-1 text-xs text-red-800"
                      onClick={async () => {
                        if (!confirm('¿Eliminar módulo y sus lecciones?')) return;
                        await fetch(`${API_URL}/teacher/modules/${mod.id}/`, {
                          method: 'DELETE',
                          headers: authHeaders(token!, false),
                        });
                        load();
                      }}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
                <ul className="mt-4 space-y-2">
                  {mod.lessons.map((lesson, li) => (
                    <li
                      key={lesson.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-cream px-3 py-2 dark:bg-[#2a2825]"
                    >
                      <button
                        type="button"
                        className="text-left text-sm font-medium underline"
                        onClick={() => openLesson(mod.id, lesson)}
                      >
                        {lesson.title}
                      </button>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                        <span>{lesson.lesson_type === 'text' ? 'Texto' : 'Video'}</span>
                        <span>{formatDuration(lesson.duration_seconds)}</span>
                        <Tag tone={lesson.video_status === 'ready' ? 'ok' : lesson.video_status === 'failed' ? 'red' : 'neutral'}>
                          {VIDEO_BADGE[lesson.video_status] || lesson.video_status}
                        </Tag>
                        <button type="button" disabled={!editable || li === 0} className="rounded border px-1" onClick={() => fetch(`${API_URL}/teacher/lessons/${lesson.id}/move/`, { method: 'POST', headers: authHeaders(token!), body: JSON.stringify({ direction: 'up' }) }).then(load)}>↑</button>
                        <button type="button" disabled={!editable || li === mod.lessons.length - 1} className="rounded border px-1" onClick={() => fetch(`${API_URL}/teacher/lessons/${lesson.id}/move/`, { method: 'POST', headers: authHeaders(token!), body: JSON.stringify({ direction: 'down' }) }).then(load)}>↓</button>
                      </div>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  data-testid={mi === 0 ? 'create-lesson' : `builder-add-lesson-${mod.id}`}
                  disabled={!editable}
                  className="mt-3 rounded-full border px-4 py-2 text-sm font-semibold"
                  onClick={() => addLesson(mod.id)}
                >
                  + Agregar lección
                </button>
              </Card>
            ))
          )}
          {course.modules.length > 0 && (
            <button
              type="button"
              data-testid="builder-add-module"
              disabled={!editable}
              onClick={addModule}
              className="rounded-full border px-4 py-2 text-sm font-semibold"
            >
              + Módulo
            </button>
          )}
        </div>
      )}

      {tab === 'review' && (
        <Card className="space-y-4 p-6">
          <h3 className="text-lg font-bold">Lista de verificación</h3>
          <ul className="space-y-2 text-sm">
            {Object.entries(course.readiness?.items || {}).map(([key, ok]) => (
              <li key={key} className={ok ? 'text-[#1d5e2e]' : 'text-muted'}>
                {ok ? '✓' : '○'}{' '}
                {key === 'description' && 'Descripción'}
                {key === 'cover' && 'Portada'}
                {key === 'module' && 'Al menos 1 módulo'}
                {key === 'lesson' && 'Al menos 1 lección'}
                {key === 'video_ready' && 'Lección con video listo o texto'}
              </li>
            ))}
          </ul>
          <Pill data-testid="submit-review" onClick={submitReview} disabled={!editable}>
            Enviar a revisión
          </Pill>
        </Card>
      )}

      {lessonModal && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-4 sm:items-center" role="dialog" aria-modal="true">
          <Card className="max-h-[90vh] w-full max-w-lg overflow-y-auto p-6" data-testid="lesson-editor-modal">
            <h3 className="text-xl font-bold">Editar lección</h3>
            <label className="mt-4 block text-sm font-medium">
              Título
              <input
                className="mt-1 w-full rounded-xl border px-3 py-2"
                value={lessonModal.title}
                onChange={(e) => setLessonModal({ ...lessonModal, title: e.target.value })}
              />
            </label>
            <label className="mt-3 block text-sm font-medium">
              Descripción
              <textarea
                className="mt-1 w-full rounded-xl border px-3 py-2"
                rows={3}
                value={lessonModal.description || ''}
                onChange={(e) => setLessonModal({ ...lessonModal, description: e.target.value })}
              />
            </label>
            <label className="mt-3 block text-sm font-medium">
              Tipo
              <select
                className="mt-1 w-full rounded-xl border px-3 py-2"
                value={lessonModal.lesson_type}
                onChange={(e) => setLessonModal({ ...lessonModal, lesson_type: e.target.value })}
              >
                <option value="video">Video</option>
                <option value="text">Texto</option>
              </select>
            </label>
            <label className="mt-3 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={lessonModal.is_preview}
                onChange={(e) => setLessonModal({ ...lessonModal, is_preview: e.target.checked })}
              />
              Vista previa gratuita
            </label>
            {lessonModal.lesson_type === 'video' && (
              <div className="mt-4">
                <p className="text-sm font-medium">Video</p>
                <div
                  className="mt-2 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#ccc] bg-cream p-6 dark:bg-[#2a2825]"
                  data-testid="video-dropzone"
                >
                  <p className="text-sm text-muted">Arrastra un MP4 o selecciona archivo</p>
                  <input
                    data-testid="upload-video"
                    type="file"
                    accept="video/*"
                    className="mt-2 text-sm"
                    onChange={(e) => e.target.files?.[0] && uploadVideo(e.target.files[0])}
                  />
                  {uploadPct !== null && (
                    <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[#ddd]">
                      <div className="h-full bg-ink" style={{ width: `${uploadPct}%` }} />
                    </div>
                  )}
                  <p className="mt-2 text-sm" data-testid="video-status">
                    {uploadPhase === 'uploading' && 'Subiendo…'}
                    {uploadPhase === 'processing' && 'Procesando…'}
                    {uploadPhase === 'idle' && `Estado: ${VIDEO_BADGE[lessonModal.video_status] || lessonModal.video_status}`}
                  </p>
                </div>
                {lessonModal.hls_url && lessonModal.video_status === 'ready' && (
                  <div className="mt-3">
                    <VideoPlayer src={lessonModal.hls_url} />
                  </div>
                )}
              </div>
            )}
            <div className="mt-6 flex flex-wrap gap-2">
              <button type="button" className="rounded-full bg-ink px-4 py-2 text-sm text-white" onClick={saveLessonModal}>
                Guardar lección
              </button>
              <button type="button" className="rounded-full border px-4 py-2 text-sm" onClick={() => setLessonModal(null)}>
                Cerrar
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
