#!/usr/bin/env bash
# Cross-platform counterpart of test-database.ps1 (macOS/Linux).
set -euo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
database_root="$(cd -- "${script_dir}/.." && pwd)"
migration_runner="${script_dir}/apply-migrations.sh"
compose_file="${script_dir}/../tests/docker-compose.yml"
project_name="sistema-tic-db-tests"
service="postgres-test"
keep_database="false"

usage() {
    cat <<'USAGE'
Usage: test-database.sh [--keep-database]

Applies migrations and seeds to a disposable PostgreSQL 16 instance,
runs the schema smoke test, and verifies idempotency by applying twice.

Options:
  --keep-database   Leave the test container running after the run
  -h, --help        Show this help
USAGE
}

while [[ $# -gt 0 ]]; do
    case "$1" in
        --keep-database) keep_database="true"; shift ;;
        -h|--help) usage; exit 0 ;;
        *) echo "Unknown option: $1" >&2; usage; exit 1 ;;
    esac
done

compose() {
    docker compose -f "${compose_file}" -p "${project_name}" "$@"
}

cleanup() {
    if [[ "${keep_database}" != "true" ]]; then
        compose down --volumes --remove-orphans >/dev/null
    fi
}
trap cleanup EXIT

compose down --volumes --remove-orphans >/dev/null 2>&1 || true

"${migration_runner}" \
    --compose-file "${compose_file}" \
    --service "${service}" \
    --project-name "${project_name}"

echo "Running database schema tests..."
compose exec -T "${service}" \
    psql -X -v ON_ERROR_STOP=1 \
    -U sistema_tic_test \
    -d sistema_tic_test \
    -f /database/tests/001_schema_smoke.sql </dev/null

compose exec -T "${service}" \
    psql -X -v ON_ERROR_STOP=1 -U sistema_tic_test -d sistema_tic_test \
    -f /database/tests/002_report_templates.sql </dev/null

echo "Running migrations and seeds a second time to verify idempotency..."
"${migration_runner}" \
    --compose-file "${compose_file}" \
    --service "${service}" \
    --project-name "${project_name}" \
    --no-start

counts="$(compose exec -T "${service}" \
    psql -X -v ON_ERROR_STOP=1 -qAt \
    -U sistema_tic_test \
    -d sistema_tic_test \
    -c "SELECT (SELECT count(*) FROM schema_migrations) || ':' || (SELECT count(*) FROM data_seeds);" \
    </dev/null | tr -d '\r' | tail -n1)"

expected_migrations="$(find "${database_root}/migrations" -maxdepth 1 -type f -name '*.sql' | wc -l | tr -d ' ')"
expected_seeds="$(find "${database_root}/seeds" -maxdepth 1 -type f -name '*.sql' | wc -l | tr -d ' ')"
expected_counts="${expected_migrations}:${expected_seeds}"

if [[ "${counts}" != "${expected_counts}" ]]; then
    echo "Unexpected migration/seed counts: ${counts} (expected ${expected_counts})" >&2
    exit 1
fi

echo "All database tests passed."
