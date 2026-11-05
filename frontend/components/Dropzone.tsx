'use client';

import clsx from 'clsx';
import { useCallback, useId, useRef, useState } from 'react';

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export type DropzoneProps = {
  accept?: string;
  acceptHint?: string;
  maxBytes?: number;
  previewMode?: 'image' | 'video' | 'auto';
  disabled?: boolean;
  /** On hidden input — use with Playwright setInputFiles */
  testId: string;
  progress?: number | null;
  error?: string | null;
  existingPreviewUrl?: string | null;
  onFileSelected: (file: File | null) => void;
  className?: string;
};

export function Dropzone({
  accept,
  acceptHint,
  maxBytes,
  previewMode = 'auto',
  disabled,
  testId,
  progress = null,
  error,
  existingPreviewUrl,
  onFileSelected,
  className,
}: DropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  const validateAndSet = useCallback(
    (f: File | null) => {
      setLocalError(null);
      if (!f) {
        setFile(null);
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        setObjectUrl(null);
        onFileSelected(null);
        return;
      }
      if (maxBytes && f.size > maxBytes) {
        setLocalError(`El archivo supera el máximo (${formatBytes(maxBytes)}).`);
        return;
      }
      if (accept) {
        const parts = accept.split(',').map((s) => s.trim());
        const ok = parts.some((p) => {
          if (p.endsWith('/*')) {
            return f.type.startsWith(p.replace('/*', '/'));
          }
          return f.type === p || f.name.toLowerCase().endsWith(p.replace('.', ''));
        });
        if (!ok && accept !== '*') {
          setLocalError('Tipo de archivo no permitido.');
          return;
        }
      }
      setFile(f);
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      const isImage = f.type.startsWith('image/');
      setObjectUrl(isImage ? URL.createObjectURL(f) : null);
      onFileSelected(f);
    },
    [accept, maxBytes, objectUrl, onFileSelected],
  );

  const showImage =
    previewMode === 'image' ||
    (previewMode === 'auto' && (file?.type.startsWith('image/') || (!file && existingPreviewUrl)));
  const showVideoIcon =
    previewMode === 'video' ||
    (previewMode === 'auto' && file && file.type.startsWith('video/'));

  const previewSrc = objectUrl || existingPreviewUrl || null;
  const err = error || localError;

  return (
    <div className={clsx('space-y-2', className)}>
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-labelledby={`${inputId}-label`}
        aria-describedby={acceptHint ? `${inputId}-hint` : undefined}
        data-testid={`${testId}-dropzone`}
        className={clsx(
          'flex flex-col items-center justify-center rounded-[18px] border-2 border-dashed px-4 py-8 text-center transition',
          'border-[#cfc8bb] bg-cream dark:border-[#555] dark:bg-[#2a2825]',
          !disabled && 'cursor-pointer hover:border-ink hover:bg-[#f5f3ef] dark:hover:border-white dark:hover:bg-[#333]',
          dragOver && !disabled && 'border-ink bg-[#efece6] dark:border-white dark:bg-[#333]',
          disabled && 'cursor-not-allowed opacity-60',
          err && 'border-red-700 dark:border-red-400',
        )}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragEnter={(e) => {
          e.preventDefault();
          if (!disabled) setDragOver(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragOver(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDragOver(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (disabled) return;
          const f = e.dataTransfer.files?.[0];
          if (f) validateAndSet(f);
        }}
      >
        <span className="text-3xl opacity-70" aria-hidden>
          ↑
        </span>
        <p id={`${inputId}-label`} className="mt-2 text-sm font-semibold">
          Arrastra tu archivo aquí o haz clic para seleccionar
        </p>
        {acceptHint && (
          <p id={`${inputId}-hint`} className="mt-1 text-xs text-muted">
            {acceptHint}
          </p>
        )}
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={accept}
          disabled={disabled}
          data-testid={testId}
          className="sr-only"
          onChange={(e) => validateAndSet(e.target.files?.[0] ?? null)}
        />
      </div>

      {(file || existingPreviewUrl) && (
        <div
          className="flex items-center gap-3 rounded-xl border border-[#e4e0d8] bg-[var(--card)] p-3 dark:border-[#444]"
          data-testid={`${testId}-file-info`}
        >
          {showImage && previewSrc && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewSrc} alt="" className="h-14 w-14 rounded-lg object-cover" />
          )}
          {showVideoIcon && !showImage && (
            <span className="flex h-14 w-14 items-center justify-center rounded-lg bg-ink text-2xl text-white">
              ▶
            </span>
          )}
          <div className="min-w-0 flex-1 text-left text-sm">
            <div className="truncate font-medium">{file?.name || 'Archivo actual'}</div>
            {file && <div className="text-xs text-muted">{formatBytes(file.size)}</div>}
          </div>
          {file && (
            <button
              type="button"
              className="shrink-0 text-sm font-semibold underline"
              data-testid={`${testId}-remove`}
              onClick={(e) => {
                e.stopPropagation();
                validateAndSet(null);
                if (inputRef.current) inputRef.current.value = '';
              }}
            >
              Quitar
            </button>
          )}
          {!file && existingPreviewUrl && (
            <button
              type="button"
              className="shrink-0 text-sm font-semibold underline"
              onClick={() => !disabled && inputRef.current?.click()}
            >
              Reemplazar
            </button>
          )}
        </div>
      )}

      {progress !== null && progress >= 0 && (
        <div className="h-2 overflow-hidden rounded-full bg-[#ebe7e0] dark:bg-[#444]" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full bg-ink transition-all dark:bg-white" style={{ width: `${Math.min(100, progress)}%` }} />
        </div>
      )}

      {err && (
        <p className="text-sm text-red-700 dark:text-red-400" role="alert" data-testid={`${testId}-error`}>
          {err}
        </p>
      )}
    </div>
  );
}
