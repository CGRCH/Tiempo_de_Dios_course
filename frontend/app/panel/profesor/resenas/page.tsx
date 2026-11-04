'use client';

import { PanelShell } from '@/components/PanelShell';
import { Card } from '@/components/ui';
import { useProfesorNav } from '@/lib/useProfesorNav';

export default function ProfesorResenasPage() {
  const nav = useProfesorNav();
  return (
    <PanelShell roleTag="Profesor" nav={nav} active="Reseñas">
      <h1 className="text-3xl font-black uppercase">Reseñas</h1>
      <Card className="mt-6 p-6 text-muted">Reseñas y valoraciones de tus cursos (demo).</Card>
    </PanelShell>
  );
}
