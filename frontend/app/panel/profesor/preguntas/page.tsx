'use client';

import { PanelShell } from '@/components/PanelShell';
import { Card } from '@/components/ui';
import { useProfesorNav } from '@/lib/useProfesorNav';

export default function ProfesorPreguntasPage() {
  const nav = useProfesorNav();
  return (
    <PanelShell roleTag="Profesor" nav={nav} active="Preguntas">
      <h1 className="text-3xl font-black uppercase">Preguntas</h1>
      <Card className="mt-6 p-6 text-muted">Bandeja de preguntas de estudiantes (demo).</Card>
    </PanelShell>
  );
}
