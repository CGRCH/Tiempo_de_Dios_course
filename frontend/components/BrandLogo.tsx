import clsx from 'clsx';
import Image from 'next/image';

const ASPECT = 384 / 79;

export function BrandLogo({
  height = 40,
  className,
  invert = 'auto',
  priority,
}: {
  height?: number;
  className?: string;
  invert?: 'auto' | 'always' | 'never';
  priority?: boolean;
}) {
  const width = Math.round(height * ASPECT);
  const invertClass =
    invert === 'always'
      ? 'brightness-0 invert'
      : invert === 'never'
        ? ''
        : 'dark:brightness-0 dark:invert';

  return (
    <Image
      src="/brand/logo-tiempo-de-dios.png"
      alt="Tiempo de Dios"
      width={width}
      height={height}
      priority={priority}
      className={clsx('h-auto max-w-none', invertClass, className)}
      style={{ height, width: 'auto' }}
    />
  );
}

export function AuthBrandMark() {
  return (
    <div className="mb-6 flex justify-center">
      <BrandLogo height={48} />
    </div>
  );
}
