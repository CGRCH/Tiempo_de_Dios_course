'use client';

import { PanelShell } from '@/components/PanelShell';
import { Card } from '@/components/ui';
import { profesorNav } from '@/lib/panelNav';

export default function ProfesorPreguntasPage() {
  return (
    <PanelShell roleTag="Profesor" nav={profesorNav(false)} active="Preguntas">
      <h1 className="text-3xl font-black uppercase">Preguntas</h1>
      <Card className="mt-6 p-6 text-muted">Bandeja de preguntas de estudiantes (demo).</Card>
    </PanelShell>
  );
}
