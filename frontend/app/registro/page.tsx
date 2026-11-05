'use client';

import { AuthBrandMark } from '@/components/BrandLogo';
import { Card, SiteFooter, SiteHeader } from '@/components/ui';
import { loginPath, safeNextPath } from '@/lib/authPaths';
import { registerUser, useAuth } from '@/lib/auth';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNextPath(searchParams.get('next'));
  const { login } = useAuth();
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await registerUser(form);
      await login(form.username, form.password);
      router.push(next);
    } catch {
      setError('No se pudo crear la cuenta.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <SiteHeader />
      <section className="mx-auto max-w-md px-4 py-16">
        <AuthBrandMark />
        <h1 className="text-center text-3xl font-black uppercase">Crear cuenta</h1>
        <Card className="mt-8 p-8">
          <form data-testid="register-form" onSubmit={submit} className="space-y-3">
            {(['username', 'email', 'password', 'first_name', 'last_name'] as const).map((k) => (
              <label key={k} className="block text-sm font-medium capitalize">
                {k.replace('_', ' ')}
                <input
                  data-testid={`register-${k}`}
                  type={k === 'password' ? 'password' : 'text'}
                  className="mt-1 w-full rounded-xl border border-[#ddd] px-4 py-2"
                  value={form[k]}
                  onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                  required
                />
              </label>
            ))}
            {error && <p className="text-sm text-red-700">{error}</p>}
            <button
              type="submit"
              data-testid="register-submit"
              disabled={busy}
              className="w-full rounded-full bg-ink py-3 font-semibold text-white disabled:opacity-60"
            >
              {busy ? 'Creando cuenta…' : 'Registrarme'}
            </button>
          </form>
          <Link
            href={loginPath(searchParams.get('next'))}
            data-testid="register-login-link"
            className="mt-4 block text-center text-sm font-semibold underline"
          >
            ¿Ya tienes cuenta? Ingresar
          </Link>
        </Card>
      </section>
      <SiteFooter />
    </>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-muted">Cargando…</div>}>
      <RegisterForm />
    </Suspense>
  );
}
