import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const PANEL_RULES: { prefix: string; roles: string[] }[] = [
  { prefix: '/panel/profesor', roles: ['Profesor', 'Super admin'] },
  { prefix: '/panel/administracion', roles: ['Administración (soporte)', 'Super admin'] },
  { prefix: '/panel/admin', roles: ['Super admin'] },
];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const rule = PANEL_RULES.find((r) => path.startsWith(r.prefix));
  if (!rule) return NextResponse.next();

  const cookie = request.headers.get('cookie') ?? '';
  const me = await fetch(`${API}/auth/me/`, {
    headers: { cookie },
    cache: 'no-store',
  });
  if (!me.ok) {
    const login = new URL('/ingresar', request.url);
    login.searchParams.set('next', path);
    return NextResponse.redirect(login);
  }
  const user = (await me.json()) as { role?: string };
  if (!user.role || !rule.roles.includes(user.role)) {
    return NextResponse.redirect(new URL('/mis-cursos', request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/panel/profesor/:path*', '/panel/administracion/:path*', '/panel/admin/:path*'],
};
