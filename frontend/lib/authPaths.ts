const DEFAULT_AFTER_AUTH = '/mis-cursos';

/** Safe internal redirect target from ?next= (open redirect guard). */
export function safeNextPath(next: string | null | undefined): string {
  if (!next || !next.startsWith('/') || next.startsWith('//')) {
    return DEFAULT_AFTER_AUTH;
  }
  return next;
}

export function homePathForRole(role: string | undefined): string {
  if (role === 'Super admin') return '/panel/admin';
  if (role === 'Administración (soporte)') return '/panel/administracion';
  if (role === 'Profesor') return '/panel/profesor';
  return '/mis-cursos';
}

/** Prefer explicit ?next=; otherwise land on the role home. */
export function postAuthPath(role: string | undefined, nextParam: string | null | undefined): string {
  const raw = nextParam?.trim();
  if (raw && raw.startsWith('/') && !raw.startsWith('//')) {
    return raw;
  }
  return homePathForRole(role);
}

export function loginPath(next?: string | null): string {
  if (!next) return '/ingresar';
  return `/ingresar?next=${encodeURIComponent(next)}`;
}

export function registerPath(next?: string | null): string {
  if (!next) return '/registro';
  return `/registro?next=${encodeURIComponent(next)}`;
}
