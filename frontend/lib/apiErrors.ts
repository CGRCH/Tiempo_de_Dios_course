/** Turn DRF / validation JSON into a single user-facing string. */
export function formatApiError(data: unknown, fallback = 'No se pudo completar la acción.'): string {
  if (data == null) return fallback;
  if (typeof data === 'string') return data;
  if (typeof data !== 'object') return fallback;
  const o = data as Record<string, unknown>;
  if (typeof o.detail === 'string') return o.detail;
  if (Array.isArray(o.detail)) return o.detail.map(String).join(' ');
  const fieldLabels: Record<string, string> = {
    title: 'Título',
    description: 'Descripción',
    category: 'Categoría',
    learning_objectives: 'Objetivos',
    proposed_price_clp: 'Precio propuesto',
    non_field_errors: 'Formulario',
  };
  const parts: string[] = [];
  for (const [key, val] of Object.entries(o)) {
    if (key === 'detail') continue;
    const label = fieldLabels[key] || key;
    const msg = Array.isArray(val) ? val.map(String).join(', ') : String(val);
    parts.push(`${label}: ${msg}`);
  }
  return parts.length ? parts.join(' · ') : fallback;
}

export function normalizeList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === 'object' && Array.isArray((data as { results?: unknown }).results)) {
    return (data as { results: T[] }).results;
  }
  return [];
}
