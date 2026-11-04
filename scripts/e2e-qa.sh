#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> Docker Compose up"
cp -n .env.example .env || true
docker compose up -d --build
sleep 20
docker compose exec -T backend python manage.py migrate --noinput
docker compose exec -T backend python manage.py seed_demo

echo "==> Celery eager para QA local en worker"
export CELERY_TASK_ALWAYS_EAGER=1

echo "==> Generar video de prueba"
mkdir -p e2e/fixtures
if [ ! -f e2e/fixtures/sample.mp4 ]; then
  ffmpeg -y -f lavfi -i testsrc=duration=2:size=320x240:rate=30 -pix_fmt yuv420p e2e/fixtures/sample.mp4 || true
fi

echo "==> Playwright"
cd e2e
npm install
npx playwright install chromium
E2E_BASE_URL=http://localhost:3000 E2E_API_URL=http://localhost:8000/api npx playwright test qa-fixes.spec.ts mvp-qa.spec.ts

echo "QA completada"
