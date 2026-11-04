'use client';

import { PanelShell } from '@/components/PanelShell';
import { Card } from '@/components/ui';
import { API_URL } from '@/lib/api';
import { useAuth } from '@/lib/auth';

const nav = [
  { href: '/panel/admin', label: 'Ingresos' },
  { href: '/panel/admin/transacciones', label: 'Transacciones' },
  { href: '/panel/admin/roles', label: 'Roles y permisos' },
  { href: '/panel/admin/cursos', label: 'Cursos' },
  { href: '/panel/admin/configuracion', label: 'Configuración' },
];

export default function AdminCursosPricePage() {
  const { token } = useAuth();

  const setPrice = async () => {
    await fetch(`${API_URL}/admin/courses/estudio-de-romanos/price/`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ price_clp: 24990 }),
    });
  };

  return (
    <PanelShell roleTag="Super admin" nav={nav} active="Cursos">
      <h1 className="text-3xl font-black uppercase">Precios</h1>
      <Card className="mt-6 p-6">
        <button data-testid="set-price-romanos" type="button" onClick={setPrice} className="rounded-full bg-ink px-4 py-2 text-white">
          Fijar precio Estudio de Romanos ($24.990)
        </button>
      </Card>
    </PanelShell>
  );
}
