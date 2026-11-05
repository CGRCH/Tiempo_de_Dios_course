export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export const MEDIA_BASE =
  typeof window !== 'undefined'
    ? ''
    : process.env.NEXT_PUBLIC_MEDIA_URL ||
      process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, '') ||
      'http://localhost:8000';

export type Course = {
  id: number;
  slug: string;
  title: string;
  teacher_name: string;
  category_name: string;
  cover: string | null;
  cover_url?: string | null;
  cover_placeholder: string;
  duration_label: string;
  price_clp: number | null;
  is_free: boolean;
  rating_display: string;
  student_count: number;
  status?: string;
  description?: string;
  level?: string;
  learning_objectives?: string[];
  modules?: Module[];
  lesson_count?: number;
};

export type Module = {
  id: number;
  title: string;
  order: number;
  lessons: Lesson[];
};

export type Lesson = {
  id: number;
  title: string;
  order: number;
  duration_seconds: number;
  is_preview?: boolean;
  hls_url?: string | null;
};

export type User = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  initials: string;
  role: string;
  avatar_url?: string | null;
  bio?: string;
};

function authHeaders(token?: string | null): HeadersInit {
  const h: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
}

export async function apiGet<T>(path: string, token?: string | null): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: authHeaders(token),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function apiPost<T>(
  path: string,
  body?: unknown,
  token?: string | null,
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: authHeaders(token),
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(await res.text());
  if (res.status === 204) return {} as T;
  return res.json();
}

export function formatCLP(value: number | null | undefined): string {
  if (value == null) return '—';
  if (value === 0) return 'Gratis';
  return `$${value.toLocaleString('es-CL')}`;
}

export function courseCoverUrl(course: Pick<Course, 'cover_url' | 'cover_placeholder'>): string {
  if (course.cover_url) {
    if (course.cover_url.startsWith('http')) return course.cover_url;
    return `${MEDIA_BASE.replace(/\/$/, '')}${course.cover_url.startsWith('/') ? '' : '/'}${course.cover_url}`;
  }
  const key = course.cover_placeholder || 'c1';
  return `${MEDIA_BASE}/media/covers/${key}.jpg`;
}

/** @deprecated use CourseCover img */
export function coverStyle(placeholder?: string): { backgroundImage: string; backgroundSize: string; backgroundPosition: string } {
  const key = placeholder || 'c1';
  return {
    backgroundImage: `url(${MEDIA_BASE}/media/covers/${key}.jpg), linear-gradient(135deg,#cfc8bb,#8a8278)`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  };
}

export function absoluteMediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${MEDIA_BASE.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
}

export function resolveMediaUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (typeof window !== 'undefined') {
    const idx = url.indexOf('/media/');
    if (idx >= 0) return url.slice(idx);
  }
  return absoluteMediaUrl(url);
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
