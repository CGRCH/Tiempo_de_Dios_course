'use client';

import { VideoPlayer } from '@/components/VideoPlayer';
import { Card, Pill, ProgressBar, SectionTitle, SiteFooter, SiteHeader, ThemeToggle } from '@/components/ui';
import { findLessonModule, flatLessons } from '@/lib/courseLessons';
import { API_URL, Course, Lesson, formatDuration , authHeaders } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

type Note = { id: number; timestamp_seconds: number; text: string };

export default function LessonPlayerPage() {
  const params = useParams();
  const slug = params.slug as string;
  const lessonId = params.id as string;
  const { token } = useAuth();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [courseTitle, setCourseTitle] = useState('Curso');
  const [courseData, setCourseData] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [noteText, setNoteText] = useState('');
  const [currentTime, setCurrentTime] = useState(0);
  const [focus, setFocus] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [completedIds, setCompletedIds] = useState<number[]>([]);
  const [playerMsg, setPlayerMsg] = useState('');

  const loadProgress = async () => {
    if (!token) return;
    const r = await fetch(`${API_URL}/courses/${slug}/progress/`, {
      credentials: 'include', headers: authHeaders(token),
    });
    if (!r.ok) return;
    const d = await r.json();
    setProgressPercent(d.progress_percent || 0);
    setCompletedIds(d.completed_lesson_ids || []);
  };

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    (async () => {
      const lessonRes = await fetch(`${API_URL}/lessons/${lessonId}/`, {
        credentials: 'include', headers: authHeaders(token),
      });
      if (!cancelled && lessonRes.ok) {
        setLesson(await lessonRes.json());
      }

      const courseRes = await fetch(`${API_URL}/courses/${slug}/`, {
        credentials: 'include', headers: authHeaders(token),
      });
      if (!cancelled && courseRes.ok) {
        const c = await courseRes.json();
        setCourseData(c);
        setCourseTitle(c.title);
        setLessons(flatLessons(c));
      }

      const notesRes = await fetch(`${API_URL}/lessons/${lessonId}/notes/`, {
        credentials: 'include', headers: authHeaders(token),
      });
      if (!cancelled && notesRes.ok) {
        const d = await notesRes.json();
        setNotes(Array.isArray(d) ? d : d.results || []);
      }

      await loadProgress();
    })();

    return () => {
      cancelled = true;
    };
  }, [lessonId, slug, token]);

  const markComplete = async () => {
    if (!token) return;
    const res = await fetch(`${API_URL}/lessons/${lessonId}/progress/`, {
      method: 'POST',
      credentials: 'include', headers: authHeaders(token),
      body: JSON.stringify({ completed: true, last_position_seconds: currentTime }),
    });
    if (res.ok) {
      const data = await res.json();
      setProgressPercent(data.progress_percent ?? progressPercent);
      setCompletedIds((prev) => Array.from(new Set([...prev, Number(lessonId)])));
      setPlayerMsg('Lección marcada como completada.');
    }
  };

  const completeAll = async () => {
    if (!token) return;
    for (const l of lessons) {
      await fetch(`${API_URL}/lessons/${l.id}/progress/`, {
        method: 'POST',
        credentials: 'include', headers: authHeaders(token),
        body: JSON.stringify({ completed: true, last_position_seconds: l.duration_seconds }),
      });
    }
    await loadProgress();
    setPlayerMsg('¡Curso completado! Revisa Mis certificados.');
  };

  const addNote = async () => {
    if (!token || !noteText.trim()) return;
    const res = await fetch(`${API_URL}/lessons/${lessonId}/notes/`, {
      method: 'POST',
      credentials: 'include',
      headers: authHeaders(token),
      body: JSON.stringify({ timestamp_seconds: currentTime, text: noteText }),
    });
    if (!res.ok) return;
    const created = await res.json();
    setNotes((n) => [...n, created]);
    setNoteText('');
  };

  const idx = lessons.findIndex((l) => String(l.id) === lessonId);
  const next = idx >= 0 ? lessons[idx + 1] : null;
  const completedCount = completedIds.length;
  const progress = progressPercent;
  const moduleInfo = courseData ? findLessonModule(courseData, lessonId) : null;
  const moduleLabel = moduleInfo
    ? `Módulo ${moduleInfo.moduleIndex}: ${moduleInfo.module.title}`
    : courseTitle;

  return (
    <>
      <SiteHeader compact={focus} />
      {!focus && (
        <div className="hidden border-b border-[#e4e0d8] md:block">
          <div className="mx-auto flex max-w-[1440px] items-center justify-between px-8 py-3 text-sm font-semibold">
            <span className="text-muted">{moduleLabel}</span>
            <div className="flex items-center gap-2">
              Modo enfoque
              <ThemeToggle />
            </div>
          </div>
        </div>
      )}
      <div className="mx-auto grid max-w-[1440px] gap-4 px-0 md:grid-cols-[1fr_380px] md:gap-7 md:p-6">
        <div>
          <VideoPlayer
            src={lesson?.hls_url}
            poster="/img/reproductor.png"
            onTimeUpdate={setCurrentTime}
          />
          <div className="px-4 md:px-0">
            <div className="my-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-muted">
                  Lección {idx >= 0 ? idx + 1 : '—'} de {lessons.length || '—'}
                </div>
                <SectionTitle className="!text-[32px]">{lesson?.title || 'Lección'}</SectionTitle>
              </div>
              {next && (
                <Pill href={`/aprender/${slug}/leccion/${next.id}`}>Siguiente lección →</Pill>
              )}
            </div>
            <Card className="p-6">
              <div className="mb-3 flex items-center justify-between">
                <b className="text-lg">Mis notas</b>
                <span className="text-xs text-muted">Se guardan automáticamente</span>
              </div>
              <div className="mb-4 flex gap-2 rounded-xl bg-cream p-3 dark:bg-[#2a2825]">
                <span className="rounded-full bg-white px-2 py-1 text-xs font-semibold dark:bg-[var(--card)]">
                  {formatDuration(currentTime)}
                </span>
                <input
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Escribe una nota en este momento del video…"
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                />
                <button type="button" onClick={addNote} className="font-bold">
                  ＋
                </button>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  data-testid="mark-lesson-complete"
                  onClick={markComplete}
                  className="rounded-full border px-3 py-1 text-sm"
                >
                  Marcar lección completada
                </button>
                <button
                  type="button"
                  data-testid="complete-course"
                  onClick={completeAll}
                  className="rounded-full bg-ink px-3 py-1 text-sm text-white"
                >
                  Completar curso
                </button>
              </div>
              {playerMsg && (
                <p className="mb-3 text-sm text-[#1d5e2e]" data-testid="player-feedback">
                  {playerMsg}
                </p>
              )}
              {notes.map((n) => (
                <div key={n.id} className="flex gap-3 border-t border-[#f0ede8] py-3">
                  <span className="rounded-full bg-ink px-2 py-1 text-xs font-semibold text-white">
                    {formatDuration(n.timestamp_seconds)}
                  </span>
                  <span className="text-[15px]">{n.text}</span>
                </div>
              ))}
            </Card>
          </div>
        </div>
        <aside className="hidden px-4 md:block md:px-0">
          <Card className="p-5">
            <b className="text-lg">Contenido del curso</b>
            <div className="my-2 flex justify-between text-sm text-muted">
              <span>
                {completedCount} de {lessons.length || 26} completadas
              </span>
              <span>{progress}%</span>
            </div>
            <ProgressBar value={progress} data-testid="lesson-progress-bar" />
            <div className="mx-4 mt-4 text-xs font-bold uppercase tracking-wider text-muted">
              Módulo 1–3
            </div>
            <div className="mt-2 space-y-1">
              {lessons.map((l, i) => {
                const active = String(l.id) === lessonId;
                const done = completedIds.includes(l.id);
                return (
                  <Link
                    key={l.id}
                    href={`/aprender/${slug}/leccion/${l.id}`}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm ${
                      active ? 'bg-ink text-white' : ''
                    }`}
                  >
                    <span
                      className={`inline-flex h-[22px] w-[22px] flex-none items-center justify-center rounded-full text-[11px] ${
                        done
                          ? 'bg-[#1d5e2e] text-white'
                          : active
                            ? 'bg-white text-ink'
                            : 'border border-[#bbb]'
                      }`}
                    >
                      {done ? '✓' : active ? '▶' : i + 1}
                    </span>
                    <span className="flex-1">{l.title}</span>
                    <span className="opacity-60">{formatDuration(l.duration_seconds)}</span>
                  </Link>
                );
              })}
            </div>
          </Card>
        </aside>
      </div>
      <div className="px-4 pb-8 md:hidden">
        <Card className="p-5">
          <b>Contenido del curso</b>
          <ProgressBar value={progress} />
        </Card>
      </div>
      <SiteFooter />
    </>
  );
}
