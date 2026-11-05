'use client';

import { UserMenu } from '@/components/UserMenu';
import { BrandLogo } from '@/components/BrandLogo';
import clsx from 'clsx';
import type { ComponentPropsWithoutRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';

const links = [
  { href: '/', label: 'Cursos' },
  { href: '/mis-cursos', label: 'Mis cursos' },
  { href: '/profesores', label: 'Profesores' },
  { href: '/comunidad', label: 'Comunidad' },
];

function panelLinkForRole(role: string | undefined): { href: string; label: string } | null {
  if (!role) return null;
  if (role === 'Super admin') return { href: '/panel/admin', label: 'Admin' };
  if (role === 'Administración (soporte)') return { href: '/panel/administracion', label: 'Soporte' };
  if (role === 'Profesor') return { href: '/panel/profesor', label: 'Profesor' };
  return null;
}

export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const stored = localStorage.getItem('td_theme');
    const isDark = stored === 'dark';
    setDark(isDark);
    document.documentElement.classList.toggle('dark', isDark);
  }, []);
  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('td_theme', next ? 'dark' : 'light');
  };
  return (
    <button
      type="button"
      onClick={toggle}
      className="relative h-6 w-11 rounded-full bg-ink dark:bg-white"
      aria-label="Cambiar tema"
    >
      <span className="absolute right-0.5 top-0.5 h-5 w-5 rounded-full bg-white dark:bg-ink" />
    </button>
  );
}

export function SiteHeader({ active = 'Cursos', compact = false }: { active?: string; compact?: boolean }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const mobileNavId = 'site-mobile-nav';
  const resolved = links.find((l) => pathname === l.href || pathname.startsWith(l.href + '/'))?.label || active;
  const panel = panelLinkForRole(user?.role);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileNavOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [mobileNavOpen]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileNavOpen]);

  const closeMobileNav = () => setMobileNavOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-cream dark:bg-[var(--bg)]">
      <div className="mx-auto flex h-[76px] max-w-[1280px] items-center justify-between gap-4 px-4 md:px-8">
        <Link href="/" className="flex shrink-0 items-center">
          <BrandLogo height={36} priority />
        </Link>
        {!compact && (
          <nav className="hidden items-center gap-7 text-[15px] font-medium md:flex">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={clsx(resolved === l.label && 'border-b-2 border-ink pb-0.5')}
              >
                {l.label}
              </Link>
            ))}
            {panel && (
              <Link
                href={panel.href}
                data-testid="header-panel-link"
                className={clsx(pathname.startsWith(panel.href) && 'border-b-2 border-ink pb-0.5')}
              >
                {panel.label}
              </Link>
            )}
          </nav>
        )}
        <div className="flex items-center gap-2 sm:gap-3">
          {!compact && (
            <button
              type="button"
              className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-semibold md:hidden"
              data-testid="mobile-menu-button"
              aria-expanded={mobileNavOpen}
              aria-controls={mobileNavId}
              aria-label={mobileNavOpen ? 'Cerrar menú de navegación' : 'Abrir menú de navegación'}
              onClick={() => setMobileNavOpen((v) => !v)}
            >
              {mobileNavOpen ? 'Cerrar' : 'Menú'}
            </button>
          )}
          <div className="hidden md:block">
            <ThemeToggle />
          </div>
          <UserMenu />
          {user && (
            <Link
              href="/mis-cursos"
              className="hidden items-center rounded-full bg-ink px-4 py-2.5 text-sm font-semibold text-white sm:inline-flex md:px-6 md:py-3 md:text-[15px]"
            >
              Mi aprendizaje
            </Link>
          )}
        </div>
      </div>
      {!compact && mobileNavOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 top-[76px] z-40 bg-black/45 md:hidden"
            aria-label="Cerrar menú"
            data-testid="mobile-nav-backdrop"
            onClick={closeMobileNav}
          />
          <nav
            id={mobileNavId}
            data-testid="mobile-nav"
            aria-label="Navegación principal"
            className="relative z-50 border-t border-[var(--border)] bg-cream px-4 py-4 shadow-lg dark:bg-[var(--bg)] md:hidden"
          >
            <ul className="space-y-3 text-[15px] font-medium">
              {links.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="block rounded-lg px-2 py-2 hover:bg-[var(--border)]/40"
                    onClick={closeMobileNav}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
              {panel && (
                <li>
                  <Link
                    href={panel.href}
                    data-testid="mobile-panel-link"
                    className="block rounded-lg px-2 py-2 hover:bg-[var(--border)]/40"
                    onClick={closeMobileNav}
                  >
                    {panel.label}
                  </Link>
                </li>
              )}
              {!user && (
                <>
                  <li className="border-t border-[var(--border)] pt-3">
                    <Link
                      href="/registro"
                      data-testid="header-register-mobile"
                      className="block rounded-lg px-2 py-2 hover:bg-[var(--border)]/40"
                      onClick={closeMobileNav}
                    >
                      Crear cuenta
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/ingresar"
                      data-testid="header-login-mobile"
                      className="block rounded-lg px-2 py-2 hover:bg-[var(--border)]/40"
                      onClick={closeMobileNav}
                    >
                      Ingresar
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </nav>
        </>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-10 bg-[var(--footer)] px-4 py-16 text-[#d8d5cf] md:px-8">
      <div className="mx-auto grid max-w-[1280px] gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <BrandLogo height={36} invert="always" className="mb-3" data-testid="footer-brand-logo" />
          <p className="text-sm">
            Iglesia en Santiago de Chile. Formación para crecer en la fe, juntos.
          </p>
        </div>
        <div>
          <h4 className="mb-3 text-sm uppercase tracking-widest text-white">Cursos</h4>
          <ul className="space-y-2 text-sm">
            {['Fundamentos', 'Estudios bíblicos', 'Liderazgo', 'Familia'].map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm uppercase tracking-widest text-white">Ayuda</h4>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/ayuda" className="hover:text-white">
                Centro de ayuda
              </Link>
            </li>
            <li>
              <Link href="/certificados" className="hover:text-white">
                Certificados
              </Link>
            </li>
            <li>
              <Link href="/terminos" className="hover:text-white">
                Términos
              </Link>
            </li>
            <li>
              <Link href="/privacidad" className="hover:text-white">
                Privacidad
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm uppercase tracking-widest text-white">Contacto</h4>
          <ul className="space-y-2 text-sm">
            <li>Santiago, Chile</li>
            <li>cursos@tiempodedios.cl</li>
            <li>+56 9 0000 0000</li>
          </ul>
        </div>
      </div>
      <div className="mx-auto mt-10 max-w-[1280px] border-t border-[#333] pt-5 text-sm text-[#8d8a84]">
        © 2026 Tiempo de Dios · Maqueta de demostración — contenido ficticio
      </div>
    </footer>
  );
}

export function Pill({
  children,
  href,
  onClick,
  variant = 'solid',
  className,
  ...rest
}: {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: 'solid' | 'ghost' | 'light';
  className?: string;
  disabled?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement> &
  React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  const base = clsx(
    'inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-[15px] font-semibold transition',
    variant === 'solid' && 'bg-ink text-white',
    variant === 'ghost' && 'border-[1.5px] border-ink bg-transparent',
    variant === 'light' && 'bg-white text-ink',
    className,
  );
  if (href) return <Link href={href} className={base} {...rest}>{children}</Link>;
  return (
    <button type="button" onClick={onClick} className={base} {...rest}>
      {children}
    </button>
  );
}

export function Headline({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h1 className={clsx('text-[clamp(2.5rem,7vw,6rem)] font-black uppercase leading-[0.95] tracking-tight', className)}>
      {children}
    </h1>
  );
}

export function SectionTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h2 className={clsx('text-[clamp(1.6rem,3.4vw,2.5rem)] font-black uppercase leading-tight tracking-tight', className)}>
      {children}
    </h2>
  );
}

export function ProgressBar({
  value,
  ...rest
}: { value: number } & ComponentPropsWithoutRef<'div'>) {
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-[var(--border)]" {...rest}>
      <div className="h-full bg-ink" style={{ width: `${Math.min(100, value)}%` }} />
    </div>
  );
}

export function Tag({
  children,
  tone = 'neutral',
  className,
}: {
  children: React.ReactNode;
  tone?: 'neutral' | 'ok' | 'rev' | 'dr' | 'red';
  className?: string;
}) {
  const tones = {
    neutral: 'bg-[#efece6] text-ink',
    ok: 'bg-[#dff1e3] text-[#1d5e2e]',
    rev: 'bg-[#fdf0d2] text-[#7a5200]',
    dr: 'bg-[#e9e7e2] text-[#444]',
    red: 'bg-[#fbe1df] text-[#8a1c12]',
  };
  return (
    <span className={clsx('inline-block rounded-full px-2.5 py-1 text-xs font-semibold', tones[tone], className)}>
      {children}
    </span>
  );
}

export function Card({
  children,
  className,
  ...rest
}: {
  children: React.ReactNode;
  className?: string;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={clsx('rounded-[18px] bg-[var(--card)] shadow-card', className)} {...rest}>
      {children}
    </div>
  );
}
