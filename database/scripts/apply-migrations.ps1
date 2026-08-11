[CmdletBinding()]
param(
    [string]$ComposeFile = (Join-Path $PSScriptRoot '..\..\docker-compose.yml'),
    [string]$Service = 'postgres',
    [string]$ProjectName = 'sistema-tic',
    [switch]$SkipSeeds,
    [switch]$NoStart
)

$ErrorActionPreference = 'Stop'

$resolvedComposeFile = (Resolve-Path -LiteralPath $ComposeFile).Path
$databaseRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
$composeArguments = @('compose', '-f', $resolvedComposeFile, '-p', $ProjectName)

function Invoke-Compose {
    param(
        [Parameter(Mandatory)]
        [string[]]$Arguments,
        [switch]$CaptureOutput
    )

    if ($CaptureOutput) {
        $result = & docker @composeArguments @Arguments 2>&1
        if ($LASTEXITCODE -ne 0) {
            throw "Docker Compose failed: $($result -join [Environment]::NewLine)"
        }
        return $result
    }

    & docker @composeArguments @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "Docker Compose command failed with exit code $LASTEXITCODE."
    }
}

if (-not $NoStart) {
    Write-Host "Starting PostgreSQL service '$Service'..."
    Invoke-Compose -Arguments @('up', '-d', $Service)
}

$ready = $false
for ($attempt = 1; $attempt -le 30; $attempt++) {
    & docker @composeArguments exec -T $Service pg_isready -q 2>$null
    if ($LASTEXITCODE -eq 0) {
        $ready = $true
        break
    }
    Start-Sleep -Seconds 2
}
if (-not $ready) {
    throw "PostgreSQL service '$Service' did not become ready in time."
}

$databaseUser = (Invoke-Compose -Arguments @('exec', '-T', $Service, 'printenv', 'POSTGRES_USER') -CaptureOutput | Select-Object -Last 1).Trim()
$databaseName = (Invoke-Compose -Arguments @('exec', '-T', $Service, 'printenv', 'POSTGRES_DB') -CaptureOutput | Select-Object -Last 1).Trim()

if ([string]::IsNullOrWhiteSpace($databaseUser) -or [string]::IsNullOrWhiteSpace($databaseName)) {
    throw 'POSTGRES_USER and POSTGRES_DB must be configured in the container.'
}

function Invoke-Psql {
    param(
        [Parameter(Mandatory)]
        [string[]]$Arguments,
        [switch]$CaptureOutput
    )

    $psqlArguments = @(
        'exec', '-T', $Service,
        'psql', '-X', '-v', 'ON_ERROR_STOP=1',
        '-U', $databaseUser,
        '-d', $databaseName
    ) + $Arguments

    return Invoke-Compose -Arguments $psqlArguments -CaptureOutput:$CaptureOutput
}

$bootstrapSql = @"
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
);
"@
Invoke-Psql -Arguments @('-q', '-c', $bootstrapSql)

function Apply-VersionedSqlFiles {
    param(
        [Parameter(Mandatory)]
        [string]$Directory,
        [Parameter(Mandatory)]
        [string]$TrackingTable,
        [Parameter(Mandatory)]
        [string]$ContainerDirectory,
        [Parameter(Mandatory)]
        [string]$Kind
    )

    $files = Get-ChildItem -LiteralPath $Directory -Filter '*.sql' -File | Sort-Object Name
    foreach ($file in $files) {
        if ($file.BaseName -notmatch '^(?<version>\d{3,})_(?<name>[a-z0-9_]+)$') {
            throw "Invalid $Kind filename '$($file.Name)'. Expected NNN_name.sql."
        }

        $version = $Matches.version
        $name = $Matches.name
        $checksum = (Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
        $existingChecksum = (
            Invoke-Psql -Arguments @(
                '-qAt',
                '-c',
                "SELECT checksum_sha256 FROM $TrackingTable WHERE version = '$version';"
            ) -CaptureOutput | Select-Object -Last 1
        )

        if ($null -ne $existingChecksum) {
            $existingChecksum = $existingChecksum.Trim()
        }
        if (-not [string]::IsNullOrWhiteSpace($existingChecksum)) {
            if ($existingChecksum -ne $checksum) {
                throw "$Kind $version was already applied with a different checksum. Create a new version instead of editing history."
            }
            Write-Host "Skipping $Kind $version ($name): already applied."
            continue
        }

        Write-Host "Applying $Kind $version ($name)..."
        $containerPath = "$ContainerDirectory/$($file.Name)"
        $registerSql = "INSERT INTO $TrackingTable (version, name, checksum_sha256) VALUES ('$version', '$name', '$checksum');"
        Invoke-Psql -Arguments @(
            '--single-transaction',
            '-f', $containerPath,
            '-c', $registerSql
        )
    }
}

Apply-VersionedSqlFiles `
    -Directory (Join-Path $databaseRoot 'migrations') `
    -TrackingTable 'schema_migrations' `
    -ContainerDirectory '/database/migrations' `
    -Kind 'migration'

if (-not $SkipSeeds) {
    Apply-VersionedSqlFiles `
        -Directory (Join-Path $databaseRoot 'seeds') `
        -TrackingTable 'data_seeds' `
        -ContainerDirectory '/database/seeds' `
        -Kind 'seed'
}

Write-Host 'Database is up to date.'
