import clsx from 'clsx';
import type { ComponentPropsWithoutRef } from 'react';

const ASPECT = 384 / 79;
const LOGO_SRC = '/brand/logo-tiempo-de-dios.png';

function logoFilterClass(invert: 'auto' | 'always' | 'never') {
  if (invert === 'always') return '[filter:invert(1)]';
  if (invert === 'never') return '';
  return 'dark:[filter:invert(1)]';
}

export function BrandLogo({
  height = 40,
  className,
  invert = 'auto',
  priority,
  ...rest
}: {
  height?: number;
  className?: string;
  invert?: 'auto' | 'always' | 'never';
  priority?: boolean;
} & ComponentPropsWithoutRef<'span'>) {
  const width = Math.round(height * ASPECT);

  return (
    <span
      {...rest}
      className={clsx('inline-block w-fit max-w-full leading-none', className)}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={LOGO_SRC}
        alt="Tiempo de Dios"
        width={width}
        height={height}
        decoding="async"
        fetchPriority={priority ? 'high' : 'auto'}
        className={clsx(
          'block h-auto max-w-full bg-transparent',
          logoFilterClass(invert),
        )}
        style={{ height, width: 'auto' }}
      />
    </span>
  );
}

export function AuthBrandMark() {
  return (
    <div className="mb-6 flex justify-center">
      <BrandLogo height={48} />
    </div>
  );
}
