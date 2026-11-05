'use client';

import { Dropzone } from '@/components/Dropzone';
import { PanelShell } from '@/components/PanelShell';
import { Card } from '@/components/ui';
import { API_URL, absoluteMediaUrl } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useProfesorNav } from '@/lib/useProfesorNav';
import { useMemo, useState } from 'react';

export default function ProfesorPerfilPage() {
  const { user, token, refreshUser } = useAuth();
  const nav = useProfesorNav();
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  const avatarPreview = useMemo(() => absoluteMediaUrl(user?.avatar_url ?? null), [user?.avatar_url]);

  const uploadAvatar = async (file: File) => {
    if (!token) return;
    setAvatarError(null);
    setAvatarUploading(true);
    const fd = new FormData();
    fd.append('avatar', file);
    try {
      const r = await fetch(`${API_URL}/auth/me/`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (!r.ok) {
        setAvatarError('No se pudo actualizar la foto.');
        return;
      }
      await refreshUser();
      setToast('Foto de perfil actualizada.');
    } catch {
      setAvatarError('Error de red al subir la foto.');
    } finally {
      setAvatarUploading(false);
    }
  };

  return (
    <PanelShell roleTag="Profesor" nav={nav} active="Perfil">
      <h1 className="text-3xl font-black uppercase">Perfil</h1>
      {toast && (
        <p className="mt-4 rounded-xl bg-[#dff1e3] px-4 py-2 text-sm text-[#1d5e2e]" role="status">
          {toast}
        </p>
      )}
      <Card className="mt-6 p-6">
        <p>
          <b>
            {user?.first_name} {user?.last_name}
          </b>
        </p>
        <p className="text-muted">{user?.email}</p>
        <div className="mt-6 max-w-md">
          <p className="text-sm font-medium">Foto de perfil</p>
          <Dropzone
            key={avatarPreview || 'no-avatar'}
            className="mt-2"
            testId="profile-avatar-upload"
            accept="image/*"
            acceptHint="PNG o JPG — máx. 2 MB"
            maxBytes={2 * 1024 * 1024}
            previewMode="image"
            disabled={avatarUploading}
            existingPreviewUrl={avatarPreview}
            progress={avatarUploading ? 50 : null}
            error={avatarError}
            onFileSelected={(f) => {
              if (f) void uploadAvatar(f);
            }}
          />
        </div>
      </Card>
    </PanelShell>
  );
}
