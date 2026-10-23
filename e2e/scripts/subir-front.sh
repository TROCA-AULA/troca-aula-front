#!/usr/bin/env bash
# Sobe o front para os testes E2E: build de produção numa pasta própria
# (.next-e2e, para não misturar com o build normal, que aponta para outro
# backend) e `next start` na porta E2E_WEB_PORT (padrão 3055).
#
#   E2E_API_PORT=5055   backend usado pelo front
#   E2E_WEB_PORT=3055   porta do front
#   E2E_SECRET          mesma chave do backend (o proxy valida o JWT)
#   E2E_SKIP_FRONT_BUILD=1   reaproveita o .next-e2e que já existe
set -euo pipefail
cd "$(dirname "$0")/../.."

export NEXT_DIST_DIR=.next-e2e
export NEXT_PUBLIC_API_URL="http://localhost:${E2E_API_PORT:-5055}"
export SECRET="${E2E_SECRET:-e2e-secret}"
export NEXT_TELEMETRY_DISABLED=1

if [ -z "${E2E_SKIP_FRONT_BUILD:-}" ] || [ ! -d .next-e2e ]; then
  echo >&2 "[e2e] compilando o front"
  pnpm exec next build
fi
exec pnpm exec next start -p "${E2E_WEB_PORT:-3055}"
