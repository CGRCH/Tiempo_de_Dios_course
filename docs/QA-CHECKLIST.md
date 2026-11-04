# Checklist QA E2E — Tiempo de Dios MVP

Ejecutar: `bash scripts/e2e-qa.sh` (requiere Docker + ffmpeg).

| Docker Compose + migrate + seed | pass | `host.docker.internal` para DB/Redis cuando iptables del daemon está deshabilitado |
| Alumno: registro | pass | `/registro` + Playwright |
| Alumno: búsqueda/filtros | pass | catálogo |
| Alumno: inscripción gratis | pass | Fundamentos de la Fe |
| Alumno: compra simulada | pass | Liderazgo + checkout confirm |
| Alumno: lección + notas + progreso | pass | reproductor (progreso vía API + nota en UI) |
| Alumno: completar curso + certificado | pass | `/mis-certificados` |
| Alumno: ticket soporte | pass | `/ayuda` |
| Profesor: crear curso + módulos/lecciones | pass | API + UI revisión |
| Profesor: upload video + Celery HLS | pass | `video_status=ready` (FFmpeg en worker) |
| Profesor: enviar revisión | pass | submit-review |
| Profesor: ver estudiantes | pass | `/panel/profesor/estudiantes` |
| Soporte: sin precios en API/UI | pass | assert API `price_clp=null` |
| Soporte: aprobar curso | pass | botón Aprobar |
| Soporte: reemitir certificado | pass | `/panel/administracion/certificados` |
| Admin: panel ingresos | pass | `/panel/admin` |
| Admin: export CSV autenticado | pass | fetch JWT |
| Admin: fijar precio | pass | `/panel/admin/cursos` |
| Admin: asignar roles | pass | `/panel/admin/roles` |
| Admin: toggle ingresos profesor | pass | `/panel/admin/configuracion` |

Última corrida: `cd e2e && npx playwright test` — **4/4 passed** (Docker Compose activo).
