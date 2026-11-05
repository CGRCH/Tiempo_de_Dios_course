'use client';

import clsx from 'clsx';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/lib/auth';

export function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, []);

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/registro"
          data-testid="header-register"
          className="rounded-full border border-ink px-3 py-2 text-sm font-semibold sm:px-4"
        >
          <span className="hidden sm:inline">Crear cuenta</span>
          <span className="sm:hidden">Registro</span>
        </Link>
        <Link
          href="/ingresar"
          data-testid="header-login"
          className="rounded-full bg-ink px-3 py-2 text-sm font-semibold text-white sm:px-4"
        >
          Ingresar
        </Link>
      </div>
    );
  }

  const panelHref =
    user.role === 'Super admin'
      ? '/panel/admin'
      : user.role === 'Administración (soporte)'
        ? '/panel/administracion'
        : user.role === 'Profesor'
          ? '/panel/profesor'
          : null;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        data-testid="avatar-menu-button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-[34px] w-[34px] items-center justify-center rounded-full bg-[#d9d3c7] text-xs font-bold"
      >
        {user.initials}
      </button>
      {open && (
        <div
          data-testid="avatar-menu"
          className="absolute right-0 top-11 z-50 min-w-[200px] rounded-xl border border-[#e4e0d8] bg-white py-2 shadow-lg dark:bg-[var(--card)]"
        >
          <div className="border-b border-[#f0ede8] px-4 py-2 text-sm">
            <b>{user.first_name || user.username}</b>
            <div className="text-muted">{user.role}</div>
          </div>
          <Link href="/mis-cursos" className="block px-4 py-2 text-sm hover:bg-[#f5f3ef]" onClick={() => setOpen(false)}>
            Mi aprendizaje
          </Link>
          <Link href="/mis-certificados" className="block px-4 py-2 text-sm hover:bg-[#f5f3ef]" onClick={() => setOpen(false)}>
            Certificados
          </Link>
          {panelHref && (
            <Link href={panelHref} className="block px-4 py-2 text-sm hover:bg-[#f5f3ef]" onClick={() => setOpen(false)}>
              Panel
            </Link>
          )}
          <button
            type="button"
            data-testid="logout-button"
            className={clsx('block w-full px-4 py-2 text-left text-sm text-red-800 hover:bg-[#f5f3ef]')}
            onClick={() => {
              logout();
              setOpen(false);
            }}
          >
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}
