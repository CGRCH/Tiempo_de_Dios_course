'use client';

import { PanelShell } from '@/components/PanelShell';
import { Card, Tag } from '@/components/ui';
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

type Tx = {
  external_id: string;
  user_name: string;
  course_title: string;
  amount_clp: number;
  method: string;
  status: string;
};

export default function AdminTransaccionesPage() {
  const { token } = useAuth();
  const [rows, setRows] = useState<Tx[]>([]);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/admin/transactions/`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setRows(d.results || d));
  }, [token]);

  return (
    <PanelShell roleTag="Super admin" nav={nav} active="Transacciones">
      <h1 className="text-3xl font-black uppercase">Transacciones</h1>
      <Card className="mt-6 overflow-x-auto" data-testid="admin-transactions-page">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="text-left text-xs uppercase text-muted">
              {['ID', 'Usuario', 'Curso', 'Monto', 'Método', 'Estado'].map((h) => (
                <th key={h} className="border-b px-4 py-3">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((tx) => (
              <tr key={tx.external_id} className="border-b border-[#f0ede8]">
                <td className="px-4 py-3 text-muted">{tx.external_id}</td>
                <td className="px-4 py-3">{tx.user_name}</td>
                <td className="px-4 py-3">{tx.course_title}</td>
                <td className="px-4 py-3 font-bold">{formatCLP(tx.amount_clp)}</td>
                <td className="px-4 py-3">{tx.method}</td>
                <td className="px-4 py-3">
                  <Tag tone={tx.status === 'paid' ? 'ok' : 'rev'}>{tx.status}</Tag>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </PanelShell>
  );
}
