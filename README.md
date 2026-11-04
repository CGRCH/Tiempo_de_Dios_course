# Tiempo de Dios Cursos — MVP

Plataforma de cursos en línea (estilo Udemy) para la iglesia **Tiempo de Dios** (Santiago, Chile). Interfaz en español (Chile), precios en CLP. Proyecto de demostración: no modifica ni contacta el sitio tiempodedios.cl.

## Arquitectura

| Capa | Tecnología |
|------|------------|
| Backend | Django 5, Django REST Framework, PostgreSQL |
| Auth | JWT (`djangorestframework-simplejwt`), roles vía grupos Django |
| Jobs | Celery + Redis (transcodificación HLS, PDF de certificados) |
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Video | FFmpeg → HLS; URLs firmadas con expiración |
| Pagos | Proveedor simulado (interfaz lista para Webpay / Mercado Pago) |
| Infra local | Docker Compose (postgres, redis, backend, celery, frontend, nginx) |

### Roles

1. **Alumno** — registro, catálogo, compra/inscripción simulada, reproductor, progreso, certificados, tickets.
2. **Profesor** — crear/editar cursos, flujo Borrador → En revisión → Publicado, estudiantes; ingresos opcionales vía configuración global.
3. **Administración (soporte)** — usuarios, tickets, aprobación de cursos, certificados; **sin** montos ni precios en API.
4. **Admin (super admin)** — ingresos, transacciones, precios, roles, configuración, auditoría.

## Inicio rápido

```bash
cp .env.example .env
docker compose up --build
```

Servicios:

- Frontend: http://localhost:3000  
- API: http://localhost:8000/api/  
- Nginx (proxy): http://localhost:8080  

Primera vez (dentro del contenedor backend):

```bash
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py seed_demo
```

## Cuentas demo

Contraseña para todas: **`Demo2026!`**

| Rol | Usuario |
|-----|---------|
| Alumno | `camila.m` |
| Profesor | `f.rojas` |
| Administración | `marta.ibanez` |
| Super admin | `carlos.mendez` |

## Desarrollo local (sin Docker)

### Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
export $(grep -v '^#' ../.env.example | xargs)
export POSTGRES_HOST=localhost CELERY_TASK_ALWAYS_EAGER=1
python manage.py migrate
python manage.py seed_demo
python manage.py runserver
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Tests y CI

```bash
cd backend && python manage.py test
cd frontend && npm run lint && npm run build
```

GitHub Actions ejecuta lint (Ruff + ESLint) y tests en cada push/PR.

## Estructura del repositorio

```
backend/          # Django + DRF + Celery
frontend/         # Next.js
nginx/            # Proxy estático + HLS
docker-compose.yml
.env.example
```

## Notas

- Los videos usan tareas Celery; en CI `CELERY_TASK_ALWAYS_EAGER=1`.
- Certificados PDF se generan con ReportLab al completar un curso.
- El checkout pago devuelve HTTP 402 con `transaction_id`; el frontend confirma vía `/api/checkout/confirm/`.

© 2026 Tiempo de Dios · Maqueta de demostración — contenido ficticio
