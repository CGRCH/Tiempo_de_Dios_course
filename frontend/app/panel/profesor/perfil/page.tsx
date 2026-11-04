'use client';

import { PanelShell } from '@/components/PanelShell';
import { Card } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { useProfesorNav } from '@/lib/useProfesorNav';

export default function ProfesorPerfilPage() {
  const { user } = useAuth();
  const nav = useProfesorNav();
  return (
    <PanelShell roleTag="Profesor" nav={nav} active="Perfil">
      <h1 className="text-3xl font-black uppercase">Perfil</h1>
      <Card className="mt-6 p-6">
        <p>
          <b>{user?.first_name} {user?.last_name}</b>
        </p>
        <p className="text-muted">{user?.email}</p>
      </Card>
    </PanelShell>
  );
}
