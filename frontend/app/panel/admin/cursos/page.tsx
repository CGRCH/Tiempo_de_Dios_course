'use client';

import { PanelShell } from '@/components/PanelShell';
import { Card } from '@/components/ui';
import { API_URL, Course, formatCLP } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useEffect, useState } from 'react';

const nav = [
  { href: '/panel/admin', label: 'Ingresos' },
  { href: '/panel/admin/transacciones', label: 'Transacciones' },
  { href: '/panel/admin/roles', label: 'Roles y permisos' },
  { href: '/panel/admin/cursos', label: 'Cursos' },
  { href: '/panel/admin/configuracion', label: 'Configuración' },
];

export default function AdminCursosPricePage() {
  const { token } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/admin/courses/`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        const list = d.results || d;
        setCourses(list);
        const map: Record<string, number> = {};
        for (const c of list) map[c.slug] = c.price_clp ?? 0;
        setPrices(map);
      });
  }, [token]);

  const save = async (slug: string) => {
    const price_clp = prices[slug] ?? 0;
    const res = await fetch(`${API_URL}/admin/courses/${slug}/price/`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ price_clp }),
    });
    if (res.ok) setMsg(`Precio actualizado: ${slug}`);
  };

  return (
    <PanelShell roleTag="Super admin" nav={nav} active="Cursos">
      <h1 className="text-3xl font-black uppercase">Precios por curso</h1>
      {msg && <p className="mt-2 text-sm text-[#1d5e2e]">{msg}</p>}
      <Card className="mt-6 overflow-x-auto p-4" data-testid="admin-price-editor">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase text-muted">
              <th className="px-2 py-2">Curso</th>
              <th className="px-2 py-2">Precio CLP</th>
              <th className="px-2 py-2" />
            </tr>
          </thead>
          <tbody>
            {courses.map((c) => (
              <tr key={c.slug} className="border-t border-[#f0ede8]">
                <td className="px-2 py-3 font-bold">{c.title}</td>
                <td className="px-2 py-3">
                  <input
                    type="number"
                    data-testid={`price-input-${c.slug}`}
                    className="w-32 rounded-lg border px-2 py-1"
                    value={prices[c.slug] ?? 0}
                    onChange={(e) =>
                      setPrices((p) => ({ ...p, [c.slug]: Number(e.target.value) || 0 }))
                    }
                  />
                </td>
                <td className="px-2 py-3">
                  <button
                    type="button"
                    data-testid={`save-price-${c.slug}`}
                    className="rounded-full bg-ink px-3 py-1 text-white"
                    onClick={() => save(c.slug)}
                  >
                    Guardar ({formatCLP(prices[c.slug])})
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </PanelShell>
  );
}
