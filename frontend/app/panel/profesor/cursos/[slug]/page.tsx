'use client';

import { PanelShell } from '@/components/PanelShell';
import { Card, Pill } from '@/components/ui';
import { API_URL } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useProfesorNav } from '@/lib/useProfesorNav';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function TeacherCourseEditPage() {
  const { slug } = useParams() as { slug: string };
  const { token } = useAuth();
  const nav = useProfesorNav();
  const [moduleId, setModuleId] = useState<number | null>(null);
  const [lessonId, setLessonId] = useState<number | null>(null);
  const [videoStatus, setVideoStatus] = useState('');
  const [msg, setMsg] = useState('');

  const createModule = async () => {
    if (!token) return;
    const res = await fetch(`${API_URL}/teacher/courses/${slug}/modules/`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Módulo QA' }),
    });
    const data = await res.json();
    setModuleId(data.id);
    setMsg(`Módulo creado #${data.id}`);
  };

  const createLesson = async () => {
    if (!moduleId) return;
    const res = await fetch(`${API_URL}/teacher/modules/${moduleId}/lessons/`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Lección QA video', duration_seconds: 5, is_preview: true }),
    });
    if (!res.ok) {
      setMsg('Error creando lección');
      return;
    }
    const data = await res.json();
    setLessonId(data.id);
    setMsg(`Lección creada #${data.id}`);
  };

  const uploadVideo = async (file: File) => {
    if (!lessonId) return;
    const fd = new FormData();
    fd.append('video', file);
    fd.append('duration_seconds', '5');
    await fetch(`${API_URL}/teacher/lessons/${lessonId}/video/`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    });
    setVideoStatus('processing');
    setMsg('Video subido — transcodificando…');
  };

  useEffect(() => {
    if (!lessonId || !token) return;
    const t = setInterval(async () => {
      const r = await fetch(`${API_URL}/lessons/${lessonId}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await r.json();
      setVideoStatus(d.video_status);
      if (d.video_status === 'ready') clearInterval(t);
    }, 2000);
    return () => clearInterval(t);
  }, [lessonId, token]);

  const submitReview = async () => {
    await fetch(`${API_URL}/teacher/courses/${slug}/submit-review/`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    setMsg('Curso enviado a revisión');
  };

  return (
    <PanelShell roleTag="Profesor" nav={nav} active="Mis cursos">
      <h1 className="text-3xl font-black uppercase">Editar curso</h1>
      <p className="text-muted">{slug}</p>
      <Card className="mt-6 space-y-3 p-6">
        <button data-testid="create-module" type="button" onClick={createModule} className="rounded-full bg-ink px-4 py-2 text-white">
          + Módulo
        </button>
        <button data-testid="create-lesson" type="button" onClick={createLesson} className="rounded-full border px-4 py-2">
          + Lección
        </button>
        <label className="block">
          Subir video de prueba
          <input
            data-testid="upload-video"
            type="file"
            accept="video/*"
            onChange={(e) => e.target.files?.[0] && uploadVideo(e.target.files[0])}
          />
        </label>
        <p data-testid="video-status">
          Estado video: {videoStatus || '—'} {lessonId ? `(lección ${lessonId})` : ''}
        </p>
        <Pill data-testid="submit-review" onClick={submitReview}>
          Enviar a revisión
        </Pill>
        {msg && <p className="text-sm text-[#1d5e2e]">{msg}</p>}
      </Card>
    </PanelShell>
  );
}
