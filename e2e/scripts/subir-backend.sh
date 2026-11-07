#!/usr/bin/env bash
# =============================================================================
#  Sobe o backend para os testes E2E (Playwright), num banco SÓ de teste.
# =============================================================================
#
#  O Playwright chama este script sozinho (ver playwright.config.ts). Ele:
#    1. recria o banco de teste (padrão: troca_aula_e2e) do zero;
#    2. aplica as migrations com o papel dono;
#    3. dá ao papel da aplicação (troca_aula_app, sujeito ao RLS) acesso a ele;
#    4. aplica o SQL base (cria o MASTER master@trocaaula.local / Trocar@123);
#    5. compila e sobe o backend na porta E2E_API_PORT (padrão 5055).
#
#  Nunca mexe no banco de desenvolvimento (troca_aula): o nome do banco de
#  teste precisa terminar em "_e2e" ou "_ci", senão o script para.
#
#  Variáveis (todas opcionais):
#    E2E_DB=troca_aula_e2e            banco de teste (é APAGADO a cada rodada)
#    E2E_API_PORT=5055                porta do backend
#    E2E_SECRET=e2e-secret            chave do JWT (o front usa a mesma)
#    E2E_BACKEND_DIR=../troca-aula-backend
#    E2E_PG_HOST=localhost E2E_PG_PORT=5432
#    E2E_PG_OWNER=my_user E2E_PG_OWNER_PASSWORD=my_password   papel dono
#    E2E_APP_PASSWORD=app_password_local   senha do troca_aula_app
#    E2E_PG_CONTAINER=postgres_container   usado quando não há `psql` na máquina
#    E2E_SKIP_BACKEND_BUILD=1         pula o `pnpm build` (usa o dist/ atual)
# =============================================================================
set -euo pipefail

FRONT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
BACKEND_DIR="$(cd "$FRONT_DIR/${E2E_BACKEND_DIR:-../troca-aula-backend}" && pwd)"
DB="${E2E_DB:-troca_aula_e2e}"
PORT="${E2E_API_PORT:-5055}"
PG_HOST="${E2E_PG_HOST:-localhost}"
PG_PORT="${E2E_PG_PORT:-5432}"
OWNER="${E2E_PG_OWNER:-my_user}"
OWNER_PW="${E2E_PG_OWNER_PASSWORD:-my_password}"
APP_PW="${E2E_APP_PASSWORD:-app_password_local}"
CONTAINER="${E2E_PG_CONTAINER:-postgres_container}"

# Sem container/porta informados: acha sozinho o Postgres que estiver ligado
# no Docker — o do backend (postgres_container) ou o do docker-compose da
# pasta raiz (troca-aula-db-1) — e lê a porta dele na máquina.
if [ -z "${E2E_PG_CONTAINER:-}" ] && command -v docker >/dev/null 2>&1; then
  for c in postgres_container troca-aula-db-1; do
    if [ "$(docker inspect -f '{{.State.Running}}' "$c" 2>/dev/null)" = "true" ]; then
      CONTAINER="$c"
      if [ -z "${E2E_PG_PORT:-}" ]; then
        porta=$(docker port "$c" 5432/tcp 2>/dev/null | head -1 | sed 's/.*://')
        [ -n "$porta" ] && PG_PORT="$porta"
      fi
      echo >&2 "[e2e] usando o Postgres do container $CONTAINER (porta $PG_PORT)"
      break
    fi
  done
fi

case "$DB" in
  *_e2e|*_ci) ;;
  *) echo "E2E_DB='$DB' não termina em _e2e/_ci — recusado para não apagar um banco de verdade." >&2; exit 1 ;;
esac

# psql da máquina (CI) ou o de dentro do container (dev local sem psql)
psql_run() { # banco [args...]
  local banco=$1; shift
  if command -v psql >/dev/null 2>&1; then
    PGPASSWORD="$OWNER_PW" psql -h "$PG_HOST" -p "$PG_PORT" -U "$OWNER" -d "$banco" -v ON_ERROR_STOP=1 -q "$@"
  else
    docker exec -i "$CONTAINER" psql -U "$OWNER" -d "$banco" -v ON_ERROR_STOP=1 -q "$@"
  fi
}

echo >&2 "[e2e] recriando o banco $DB"
psql_run postgres -c "DROP DATABASE IF EXISTS \"$DB\" WITH (FORCE)"
psql_run postgres -c "CREATE DATABASE \"$DB\" OWNER \"$OWNER\""

OWNER_URL="postgresql://$OWNER:$OWNER_PW@$PG_HOST:$PG_PORT/$DB"
APP_URL="postgresql://troca_aula_app:$APP_PW@$PG_HOST:$PG_PORT/$DB"

echo >&2 "[e2e] migrations"
# As DUAS variáveis apontam para o banco de teste: o migrate prefere
# MIGRATION_DATABASE_URL, e o .env do backend aponta para o banco de dev.
(cd "$BACKEND_DIR" && MIGRATION_DATABASE_URL="$OWNER_URL" DATABASE_URL="$OWNER_URL" pnpm run --silent db:migrate)

echo >&2 "[e2e] papel da aplicação (RLS)"
ROLE_EXISTS=$(psql_run postgres -Atc "SELECT 1 FROM pg_roles WHERE rolname = 'troca_aula_app'")
if [ "$ROLE_EXISTS" = "1" ]; then
  # O papel é do servidor inteiro: não troca a senha de quem já tem um
  # (o banco de dev usa o mesmo papel). Só dá acesso ao banco de teste.
  psql_run "$DB" <<'SQL'
GRANT USAGE ON SCHEMA public TO troca_aula_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO troca_aula_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO troca_aula_app;
SQL
else
  psql_run "$DB" -v app_password="$APP_PW" -f - < "$BACKEND_DIR/scripts/setup-rls-role.sql"
fi

echo >&2 "[e2e] SQL base (usuário MASTER)"
psql_run "$DB" -f - < "$BACKEND_DIR/test/api/01-base-producao.sql" >/dev/null

if [ -z "${E2E_SKIP_BACKEND_BUILD:-}" ] || [ ! -f "$BACKEND_DIR/dist/main.js" ]; then
  echo >&2 "[e2e] compilando o backend"
  (cd "$BACKEND_DIR" && pnpm run --silent build)
fi

echo >&2 "[e2e] subindo o backend na porta $PORT"
cd "$BACKEND_DIR"
export PORT DATABASE_URL="$APP_URL" SECRET="${E2E_SECRET:-e2e-secret}"
unset MIGRATION_DATABASE_URL
# Sem SMTP: a senha temporária volta na resposta (emailSent=false).
export SMTP_HOST=
exec node dist/main.js
