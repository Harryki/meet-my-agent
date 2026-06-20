#!/bin/sh
set -e

if [ "$1" = "api" ]; then
    echo "Running database migrations..."
    uv run alembic upgrade head 2>&1 | grep -v "already exists" || true
    echo "Starting API server (production)..."
    exec uv run uvicorn app.main:app --host 0.0.0.0 --port 8000
elif [ "$1" = "api-dev" ]; then
    echo "Running database migrations..."
    uv run alembic upgrade head 2>&1 | grep -v "already exists" || true
    echo "Starting API server (development, with --reload)..."
    exec uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
elif [ "$1" = "worker" ]; then
    echo "Starting RQ Worker..."
    exec uv run rq worker agent
else
    echo "Unknown command: $1"
    echo "Usage: docker-entrypoint.sh [api|api-dev|worker]"
    exit 1
fi
