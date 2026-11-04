'use client';

import { PanelShell } from '@/components/PanelShell';
import { Card, Headline, Pill, Tag } from '@/components/ui';
import { API_URL, formatCLP } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useEffect, useState } from 'react';

const nav = [
  { href: '/panel/admin', label: 'Ingresos' },
  { href: '/panel/admin/transacciones', label: 'Transacciones' },
  { href: '/panel/admin/roles', label: 'Roles y permisos' },
  { href: '/panel/admin/cursos', label: 'Cursos' },
  { href: '/panel/admin/configuracion', label: 'Configuración' },
];

type Revenue = {
  total_revenue_clp: number;
  month_revenue_clp: number;
  month_sales: number;
  average_ticket_clp: number;
  monthly_chart: { month: string; amount_millions: number }[];
  revenue_by_course: { course: string; amount_clp: number }[];
  recent_transactions: {
    external_id: string;
    user_name: string;
    course_title: string;
    amount_clp: number;
    method: string;
    status: string;
  }[];
};

export default function AdminPanelPage() {
  const { token } = useAuth();
  const [data, setData] = useState<Revenue | null>(null);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/admin/revenue/`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then(setData);
  }, [token]);

  const maxBar = Math.max(...(data?.monthly_chart.map((m) => m.amount_millions) || [1]));

  return (
    <PanelShell roleTag="Super admin" nav={nav} active="Ingresos">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <Headline className="!text-[56px]">
          Panel de <span className="serif normal-case">ingresos</span>
        </Headline>
        <Pill variant="ghost" href={`${API_URL}/admin/transactions/export/`}>
          Exportar CSV
        </Pill>
      </div>
      <div className="mb-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ['Ingresos totales', formatCLP(data?.total_revenue_clp), 'desde el lanzamiento'],
          ['Este mes (nov)', formatCLP(data?.month_revenue_clp), '+12% vs octubre'],
          ['Ventas del mes', String(data?.month_sales || 186), '+9%'],
          ['Ticket promedio', formatCLP(data?.average_ticket_clp), 'CLP'],
        ].map(([a, b, c]) => (
          <Card key={a} className="p-5">
            <span className="text-sm text-muted">{a}</span>
            <b className="mt-1 block text-3xl font-black">{b}</b>
            <span className="text-xs text-[#1d5e2e]">{c}</span>
          </Card>
        ))}
      </div>
      <div className="mb-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Card className="p-6">
          <b className="text-lg">Ingresos mensuales (millones CLP)</b>
          <div className="mt-5 flex h-60 items-end gap-2">
            {data?.monthly_chart.map((m, i) => (
              <div key={m.month} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className={`w-full rounded-t-lg ${i === 11 ? 'bg-ink' : 'bg-[#cfc8bb]'}`}
                  style={{ height: `${(m.amount_millions / maxBar) * 200}px` }}
                />
                <span className="text-xs text-muted">{m.month}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-6">
          <b className="text-lg">Ingresos por curso</b>
          {data?.revenue_by_course.map((row, idx) => (
            <div key={row.course} className="mt-3">
              <div className="flex justify-between text-sm">
                <span>{row.course}</span>
                <b>{formatCLP(row.amount_clp)}</b>
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-[#ebe7e0]">
                <div
                  className="h-full rounded-full bg-ink"
                  style={{ width: `${100 - idx * 20}%` }}
                />
              </div>
            </div>
          ))}
        </Card>
      </div>
      <Card className="overflow-x-auto">
        <div className="p-5">
          <b className="text-lg">Transacciones recientes</b>{' '}
          <span className="text-xs text-muted">(simuladas)</span>
        </div>
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="text-left text-xs uppercase text-muted">
              {['ID', 'Usuario', 'Curso', 'Monto', 'Método', 'Estado'].map((h) => (
                <th key={h} className="border-b border-[#eee] px-4 py-3">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data?.recent_transactions.map((tx) => (
              <tr key={tx.external_id} className="border-b border-[#f0ede8]">
                <td className="px-4 py-3.5 text-muted">{tx.external_id}</td>
                <td className="px-4 py-3.5">{tx.user_name}</td>
                <td className="px-4 py-3.5">{tx.course_title}</td>
                <td className="px-4 py-3.5 font-bold">{formatCLP(tx.amount_clp)}</td>
                <td className="px-4 py-3.5">{tx.method}</td>
                <td className="px-4 py-3.5">
                  <Tag tone={tx.status === 'paid' ? 'ok' : tx.status === 'pending' ? 'rev' : 'red'}>
                    {tx.status}
                  </Tag>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </PanelShell>
  );
}
