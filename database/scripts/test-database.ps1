[CmdletBinding()]
param(
    [switch]$KeepDatabase
)

$ErrorActionPreference = 'Stop'
$composeFile = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..\tests\docker-compose.yml')).Path
$migrationRunner = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot 'apply-migrations.ps1')).Path
$projectName = 'sistema-tic-db-tests'
$service = 'postgres-test'
$composeArguments = @('compose', '-f', $composeFile, '-p', $projectName)

try {
    & docker @composeArguments down --volumes --remove-orphans 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw 'Could not reset the isolated database test project.'
    }

    & $migrationRunner `
        -ComposeFile $composeFile `
        -Service $service `
        -ProjectName $projectName
    if ($LASTEXITCODE -ne 0) {
        throw 'The first migration execution failed.'
    }

    Write-Host 'Running database schema tests...'
    & docker @composeArguments exec -T $service `
        psql -X -v ON_ERROR_STOP=1 `
        -U sistema_tic_test `
        -d sistema_tic_test `
        -f /database/tests/001_schema_smoke.sql
    if ($LASTEXITCODE -ne 0) {
        throw 'Database schema tests failed.'
    }

    Write-Host 'Running migrations and seeds a second time to verify idempotency...'
    & $migrationRunner `
        -ComposeFile $composeFile `
        -Service $service `
        -ProjectName $projectName `
        -NoStart
    if ($LASTEXITCODE -ne 0) {
        throw 'The idempotency execution failed.'
    }

    $counts = & docker @composeArguments exec -T $service `
        psql -X -v ON_ERROR_STOP=1 -qAt `
        -U sistema_tic_test `
        -d sistema_tic_test `
        -c "SELECT (SELECT count(*) FROM schema_migrations) || ':' || (SELECT count(*) FROM data_seeds);"
    if ($LASTEXITCODE -ne 0 -or ($counts | Select-Object -Last 1).Trim() -ne '4:2') {
        throw "Unexpected migration/seed counts: $counts"
    }

    Write-Host 'All database tests passed.'
}
finally {
    if (-not $KeepDatabase) {
        & docker @composeArguments down --volumes --remove-orphans
    }
}
