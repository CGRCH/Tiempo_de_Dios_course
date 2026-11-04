#!/bin/sh
set -e

host="${POSTGRES_HOST:-postgres}"
port="${POSTGRES_PORT:-5432}"

echo "Esperando PostgreSQL en ${host}:${port}..."
for i in $(seq 1 60); do
  if python - <<'PY'
import os, socket
h = os.environ.get("POSTGRES_HOST", "postgres")
p = int(os.environ.get("POSTGRES_PORT", "5432"))
s = socket.socket()
s.settimeout(2)
try:
    s.connect((h, p))
    raise SystemExit(0)
except Exception:
    raise SystemExit(1)
finally:
    s.close()
PY
  then
    echo "PostgreSQL disponible."
    break
  fi
  sleep 2
done

python manage.py migrate --noinput
python manage.py collectstatic --noinput
exec gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 2
