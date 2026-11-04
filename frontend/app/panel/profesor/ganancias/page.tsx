'use client';

import { PanelShell } from '@/components/PanelShell';
import { Card } from '@/components/ui';
import { API_URL, formatCLP } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useEffect, useState } from 'react';
import { useProfesorNav } from '@/lib/useProfesorNav';

export default function ProfesorGananciasPage() {
  const { token } = useAuth();
  const nav = useProfesorNav();
  const [visible, setVisible] = useState(false);
  const [total, setTotal] = useState(0);
  const [rows, setRows] = useState<{ course: string; amount_clp: number; sales: number }[]>([]);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/teacher/earnings/`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        setVisible(!!d.visible);
        setTotal(d.total_clp || 0);
        setRows(d.by_course || []);
      });
  }, [token]);

  return (
    <PanelShell roleTag="Profesor" nav={nav} active="Ganancias">
      <h1 className="text-3xl font-black uppercase">Ganancias</h1>
      {!visible ? (
        <Card className="mt-6 p-6 text-muted" data-testid="earnings-hidden">
          Los ingresos por curso están desactivados en la configuración del sitio.
        </Card>
      ) : (
        <Card className="mt-6 p-6" data-testid="earnings-panel">
          <p className="text-sm text-muted">Total acumulado (cursos propios)</p>
          <b className="text-4xl font-black">{formatCLP(total)}</b>
          <ul className="mt-6 space-y-3">
            {rows.map((r) => (
              <li key={r.course} className="flex justify-between border-t border-[#f0ede8] pt-3 text-sm">
                <span>{r.course}</span>
                <span>
                  {formatCLP(r.amount_clp)} · {r.sales} venta{r.sales === 1 ? '' : 's'}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </PanelShell>
  );
}
