'use client';

import { Card, Pill, SiteFooter, SiteHeader } from '@/components/ui';
import { registerUser } from '@/lib/auth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
  });
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await registerUser(form);
      router.push('/ingresar');
    } catch {
      setError('No se pudo crear la cuenta.');
    }
  };

  return (
    <>
      <SiteHeader />
      <section className="mx-auto max-w-md px-4 py-16">
        <h1 className="text-3xl font-black uppercase">Crear cuenta</h1>
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
              className="w-full rounded-full bg-ink py-3 font-semibold text-white"
            >
              Registrarme
            </button>
          </form>
          <Link href="/ingresar" className="mt-4 block text-sm text-muted">
            ¿Ya tienes cuenta? Ingresar
          </Link>
        </Card>
      </section>
      <SiteFooter />
    </>
  );
}
