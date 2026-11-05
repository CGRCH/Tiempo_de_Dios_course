const DEFAULT_AFTER_AUTH = '/mis-cursos';

/** Safe internal redirect target from ?next= (open redirect guard). */
export function safeNextPath(next: string | null | undefined): string {
  if (!next || !next.startsWith('/') || next.startsWith('//')) {
    return DEFAULT_AFTER_AUTH;
  }
  return next;
}

export function loginPath(next?: string | null): string {
  if (!next) return '/ingresar';
  return `/ingresar?next=${encodeURIComponent(next)}`;
}

export function registerPath(next?: string | null): string {
  if (!next) return '/registro';
  return `/registro?next=${encodeURIComponent(next)}`;
}
