export function profesorNav(showEarnings: boolean) {
  const nav = [
    { href: '/panel/profesor', label: 'Mis cursos' },
    { href: '/panel/profesor/estudiantes', label: 'Estudiantes' },
    { href: '/panel/profesor/preguntas', label: 'Preguntas' },
    { href: '/panel/profesor/resenas', label: 'Reseñas' },
    { href: '/panel/profesor/perfil', label: 'Perfil' },
  ];
  if (showEarnings) {
    nav.splice(2, 0, { href: '/panel/profesor/ganancias', label: 'Ganancias' });
  }
  return nav;
}
