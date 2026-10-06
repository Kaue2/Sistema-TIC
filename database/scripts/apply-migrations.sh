#!/usr/bin/env bash
# Cross-platform counterpart of apply-migrations.ps1 (macOS/Linux).
set -euo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
database_root="$(cd -- "${script_dir}/.." && pwd)"

compose_file="${script_dir}/../../docker-compose.yml"
service="postgres"
project_name="sistema-tic"
skip_seeds="false"
start_service="true"

usage() {
    cat <<'USAGE'
Usage: apply-migrations.sh [options]

Applies versioned SQL migrations (and seeds) to the PostgreSQL service,
tracking them in schema_migrations/data_seeds with a SHA-256 checksum.

Options:
  --compose-file PATH   Compose file to use (default: repo docker-compose.yml)
  --service NAME        Compose service name (default: postgres)
  --project-name NAME   Compose project name (default: sistema-tic)
  --skip-seeds          Apply migrations only, skip database/seeds
  --no-start            Do not run 'docker compose up' before applying
  -h, --help            Show this help
USAGE
}

while [[ $# -gt 0 ]]; do
    case "$1" in
        --compose-file) compose_file="$2"; shift 2 ;;
        --service) service="$2"; shift 2 ;;
        --project-name) project_name="$2"; shift 2 ;;
        --skip-seeds) skip_seeds="true"; shift ;;
        --no-start) start_service="false"; shift ;;
        -h|--help) usage; exit 0 ;;
        *) echo "Unknown option: $1" >&2; usage; exit 1 ;;
    esac
done

compose() {
    docker compose -f "${compose_file}" -p "${project_name}" "$@"
}

if [[ "${start_service}" == "true" ]]; then
    echo "Starting PostgreSQL service '${service}'..."
    compose up -d "${service}"
fi

echo "Waiting for PostgreSQL to become ready..."
ready="false"
for _ in $(seq 1 30); do
    if compose exec -T "${service}" pg_isready -q 2>/dev/null; then
        ready="true"
        break
    fi
    sleep 2
done
if [[ "${ready}" != "true" ]]; then
    echo "PostgreSQL service '${service}' did not become ready in time." >&2
    exit 1
fi

database_user="$(compose exec -T "${service}" printenv POSTGRES_USER | tr -d '\r' | tail -n1)"
database_name="$(compose exec -T "${service}" printenv POSTGRES_DB | tr -d '\r' | tail -n1)"

if [[ -z "${database_user}" || -z "${database_name}" ]]; then
    echo "POSTGRES_USER and POSTGRES_DB must be configured in the container." >&2
    exit 1
fi

psql_query() {
    compose exec -T "${service}" psql -X -v ON_ERROR_STOP=1 -qAt \
        -U "${database_user}" -d "${database_name}" -c "$1" </dev/null | tr -d '\r' | tail -n1
}

compose exec -T "${service}" psql -X -v ON_ERROR_STOP=1 -q \
    -U "${database_user}" -d "${database_name}" -c "
CREATE TABLE IF NOT EXISTS schema_migrations (
    version text PRIMARY KEY,
    name text NOT NULL,
    checksum_sha256 char(64) NOT NULL,
    applied_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE TABLE IF NOT EXISTS data_seeds (
    version text PRIMARY KEY,
    name text NOT NULL,
    checksum_sha256 char(64) NOT NULL,
    applied_at timestamptz NOT NULL DEFAULT clock_timestamp()
);"

apply_versioned_sql_files() {
    local directory="$1"
    local tracking_table="$2"
    local container_directory="$3"
    local kind="$4"

    # Reconcile the legacy main-branch 011 before iterating, independently of sort order.
    # Preserve the recorded checksum; changed SQL is not accepted as already applied.
    local workflow_file="${directory}/0110_document_workflow_statuses.sql"
    if [[ "${tracking_table}" == "schema_migrations" && -f "${workflow_file}" ]]; then
        local workflow_checksum
        workflow_checksum="$(sha256sum "${workflow_file}" | cut -d' ' -f1)"
        psql_query "UPDATE schema_migrations SET version = '0110' WHERE version = '011' AND name = 'document_workflow_statuses' AND checksum_sha256 = '${workflow_checksum}';" >/dev/null
    fi

    while IFS= read -r file; do
        local file_name
        file_name="$(basename "${file}")"

        if [[ ! "${file_name}" =~ ^([0-9]{3,})_([a-z0-9_]+)\.sql$ ]]; then
            echo "Invalid ${kind} filename '${file_name}'. Expected NNN_name.sql." >&2
            exit 1
        fi

        local version="${BASH_REMATCH[1]}"
        local name="${BASH_REMATCH[2]}"
        local checksum
        checksum="$(sha256sum "${file}" | cut -d' ' -f1)"
        local existing_checksum
        existing_checksum="$(psql_query "SELECT checksum_sha256 FROM ${tracking_table} WHERE version = '${version}';")"

        if [[ -n "${existing_checksum}" ]]; then
            if [[ "${existing_checksum}" != "${checksum}" ]]; then
                echo "${kind} ${version} was already applied with a different checksum. Create a new version instead of editing history." >&2
                exit 1
            fi
            echo "Skipping ${kind} ${version} (${name}): already applied."
            continue
        fi

        echo "Applying ${kind} ${version} (${name})..."
        compose exec -T "${service}" psql -X -v ON_ERROR_STOP=1 \
            -U "${database_user}" -d "${database_name}" \
            --single-transaction \
            -f "${container_directory}/${file_name}" \
            -c "INSERT INTO ${tracking_table} (version, name, checksum_sha256) VALUES ('${version}', '${name}', '${checksum}');" </dev/null
    done < <(find "${directory}" -maxdepth 1 -type f -name '*.sql' | sort)
}

apply_versioned_sql_files \
    "${database_root}/migrations" \
    "schema_migrations" \
    "/database/migrations" \
    "migration"

if [[ "${skip_seeds}" != "true" ]]; then
    apply_versioned_sql_files \
        "${database_root}/seeds" \
        "data_seeds" \
        "/database/seeds" \
        "seed"
fi

echo "Database is up to date."
