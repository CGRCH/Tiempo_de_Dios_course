'use client';

import { AuthBrandMark } from '@/components/BrandLogo';
import { Card, SiteFooter, SiteHeader } from '@/components/ui';
import { loginPath, registerPath, safeNextPath } from '@/lib/authPaths';
import { useAuth } from '@/lib/auth';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNextPath(searchParams.get('next'));
  const [username, setUsername] = useState('camila.m');
  const [password, setPassword] = useState('Demo2026!');
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(username, password);
      router.push(next);
    } catch {
      setError('No pudimos iniciar sesión. Revisa tus datos.');
    }
  };

  return (
    <>
      <SiteHeader />
      <section className="mx-auto max-w-md px-4 py-16">
        <AuthBrandMark />
        <h1 className="text-center text-3xl font-black uppercase">Ingresar</h1>
        <Card className="mt-8 p-8">
          <form data-testid="login-form" onSubmit={submit} className="space-y-4">
            <label className="block text-sm font-medium">
              Usuario
              <input
                data-testid="login-username"
                className="mt-1 w-full rounded-xl border border-[#ddd] px-4 py-2"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </label>
            <label className="block text-sm font-medium">
              Contraseña
              <input
                data-testid="login-password"
                type="password"
                className="mt-1 w-full rounded-xl border border-[#ddd] px-4 py-2"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            {error && <p className="text-sm text-red-700">{error}</p>}
            <button
              type="submit"
              data-testid="login-submit"
              className="inline-flex w-full items-center justify-center rounded-full bg-ink px-6 py-3 text-[15px] font-semibold text-white"
            >
              Entrar
            </button>
          </form>
          <Link
            href={registerPath(searchParams.get('next'))}
            data-testid="login-register-link"
            className="mt-4 block text-center text-sm font-semibold underline"
          >
            ¿No tienes cuenta? Regístrate
          </Link>
          <p className="mt-6 text-xs text-muted">
            Demo: camila.m, f.rojas, marta.ibanez, carlos.mendez — contraseña Demo2026!
          </p>
        </Card>
      </section>
      <SiteFooter />
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-muted">Cargando…</div>}>
      <LoginForm />
    </Suspense>
  );
}
