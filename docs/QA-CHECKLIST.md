# Checklist QA — correcciones manuales (PR #1)

## Entorno local (`USE_SQLITE=1`)

```bash
cd backend && USE_SQLITE=1 MEDIA_ROOT=$PWD/media CELERY_TASK_ALWAYS_EAGER=1 python manage.py migrate
USE_SQLITE=1 MEDIA_ROOT=$PWD/media CELERY_TASK_ALWAYS_EAGER=1 python manage.py seed_demo
USE_SQLITE=1 MEDIA_ROOT=$PWD/media CELERY_TASK_ALWAYS_EAGER=1 python manage.py runserver 0.0.0.0:8000
# otra terminal:
cd frontend && NEXT_PUBLIC_API_URL=http://localhost:8000/api npm run dev
cd e2e && E2E_BASE_URL=http://localhost:3000 npx playwright test qa-fixes.spec.ts
```

## Docker Compose

```bash
bash scripts/e2e-qa.sh
```

Asegurar `CELERY_TASK_ALWAYS_EAGER=1` en `.env` para transcodificación síncrona en QA.

| # | Área | Verificación | E2E UI |
|---|------|--------------|--------|
| 1 | Logout / avatar | Menú en avatar, iniciales reales, «Ingresar» sin sesión | `qa-fixes` test 1 + screenshots `01-*` |
| 2 | Portadas y conteo | `<img>` con `/media/covers/`, conteo API en home | test 2 + `02-catalog-covers.png` |
| 3 | Checkout pagado | `/checkout/[slug]` antes de confirmar; feedback gratis | test 3 + `03-checkout.png` |
| 4 | Reproductor | HLS vía rewrite `/media`, progreso y feedback | test 4 + `04-lesson-progress.png` |
| 5 | Profesor | Crear curso devuelve `slug`, módulo/lección/revisión | test 5 + `05-teacher-course.png` |
| 6 | Administración | `/usuarios`, `/tickets`, `/aprobacion`, stats reales, nav Soporte | test 6 + `06-soporte.png` |
| 7 | Super admin | Ingresos desde transacciones, `/transacciones`, editor precios | test 7 + `07-admin-prices.png` |

Capturas en `docs/screenshots/qa-fix/`.
