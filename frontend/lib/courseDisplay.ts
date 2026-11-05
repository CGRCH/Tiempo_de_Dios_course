export function splitHeadlineTitle(title: string | undefined | null): { lead: string; accent: string } {
  const t = (title || 'Curso').trim();
  const words = t.split(/\s+/).filter(Boolean);
  if (words.length <= 1) return { lead: t, accent: '' };
  return { lead: words.slice(0, -1).join(' '), accent: words.slice(-1)[0] };
}

export function teacherInitials(name: string | undefined | null): string {
  const parts = (name || 'TD').trim().split(/\s+/).filter(Boolean);
  return parts
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}
