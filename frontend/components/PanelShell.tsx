'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { SiteFooter, SiteHeader, Tag } from './ui';

export function PanelShell({
  roleTag,
  nav,
  active,
  children,
}: {
  roleTag: string;
  nav: { href: string; label: string }[];
  active: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  return (
    <>
      <SiteHeader />
      <div className="mx-auto grid max-w-[1280px] gap-8 px-4 py-8 md:grid-cols-[240px_1fr] md:px-8">
        <aside>
          <Tag className="mb-4">{roleTag}</Tag>
          <nav className="flex flex-col gap-1">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  'rounded-[10px] px-3.5 py-2.5 font-medium',
                  (active === item.label || pathname === item.href) && 'bg-ink text-white',
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <main>{children}</main>
      </div>
      <SiteFooter />
    </>
  );
}
