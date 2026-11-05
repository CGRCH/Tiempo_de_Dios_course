'use client';

import { PanelShell } from '@/components/PanelShell';
import { Card } from '@/components/ui';
import { API_URL , authHeaders } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useProfesorNav } from '@/lib/useProfesorNav';
import { useEffect, useState } from 'react';

export default function TeacherStudentsPage() {
  const { token } = useAuth();
  const nav = useProfesorNav();
  const [rows, setRows] = useState<{ student: string; course: string; progress_percent: number }[]>([]);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/teacher/students/`, { credentials: 'include', headers: authHeaders(token) })
      .then((r) => r.json())
      .then(setRows);
  }, [token]);

  return (
    <PanelShell roleTag="Profesor" nav={nav} active="Estudiantes">
      <h1 className="text-3xl font-black uppercase">Estudiantes</h1>
      <Card className="mt-6 overflow-x-auto">
        <table className="w-full text-sm" data-testid="teacher-students-table">
          <thead>
            <tr>
              <th className="p-3 text-left">Estudiante</th>
              <th className="p-3 text-left">Curso</th>
              <th className="p-3 text-left">Progreso</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t">
                <td className="p-3">{r.student}</td>
                <td className="p-3">{r.course}</td>
                <td className="p-3">{r.progress_percent}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </PanelShell>
  );
}
