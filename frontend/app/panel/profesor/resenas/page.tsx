'use client';

import { PanelShell } from '@/components/PanelShell';
import { Card } from '@/components/ui';
import { API_URL } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useProfesorNav } from '@/lib/useProfesorNav';
import { useEffect, useState } from 'react';

type Review = {
  id: number;
  course_title: string;
  student_name: string;
  rating: number;
  body: string;
  created_at: string;
};

export default function ProfesorResenasPage() {
  const { token } = useAuth();
  const nav = useProfesorNav();
  const [rows, setRows] = useState<Review[]>([]);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/teacher/reviews/`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setRows(Array.isArray(d) ? d : d.results || []));
  }, [token]);

  return (
    <PanelShell roleTag="Profesor" nav={nav} active="Reseñas">
      <h1 className="text-3xl font-black uppercase">Reseñas</h1>
      <Card className="mt-6 p-6" data-testid="teacher-reviews-page">
        {rows.length === 0 ? (
          <p className="text-muted">Aún no hay reseñas en tus cursos.</p>
        ) : (
          <ul className="space-y-4">
            {rows.map((r) => (
              <li key={r.id} className="border-t border-[#f0ede8] pt-4 first:border-0 first:pt-0">
                <div className="flex justify-between gap-2">
                  <b>{r.course_title}</b>
                  <span className="text-[#b07a00]">★ {r.rating}</span>
                </div>
                <div className="text-xs text-muted">{r.student_name}</div>
                <p className="mt-2 text-sm">{r.body}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </PanelShell>
  );
}
