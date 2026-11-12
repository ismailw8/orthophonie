param([switch]$SkipTests, [switch]$BackendOnly)
$ErrorActionPreference = 'Stop'
Push-Location $PSScriptRoot
if (Test-Path -LiteralPath (Join-Path $PSScriptRoot '.runtime/processes.json')) {
    Pop-Location
    throw 'Arreter la session backend avec stop.ps1 avant de reconstruire ses JAR (verrouilles sous Windows).'
}
$previousMavenOpts = $env:MAVEN_OPTS
try {
    # Trust Windows certificates without disabling HTTPS validation.
    $env:MAVEN_OPTS = "$previousMavenOpts -Djavax.net.ssl.trustStoreType=Windows-ROOT -Djavax.net.ssl.trustStore=NONE"
    $mavenArguments = @('--batch-mode', '--no-transfer-progress', 'clean', 'verify')
    if ($SkipTests) { $mavenArguments += '-DskipTests' }
    & .\mvnw.cmd @mavenArguments
    if ($LASTEXITCODE -ne 0) { throw 'Compilation ou tests backend en echec.' }
    if ($BackendOnly) { return }
    Push-Location frontend/orthophoniste-web
    try {
        & npm.cmd ci
        if ($LASTEXITCODE -ne 0) { throw 'Installation frontend en echec.' }
        & npm.cmd run lint
        if ($LASTEXITCODE -ne 0) { throw 'Lint frontend en echec.' }
        & npm.cmd run build
        if ($LASTEXITCODE -ne 0) { throw 'Compilation frontend en echec.' }
    } finally { Pop-Location }
} finally {
    $env:MAVEN_OPTS = $previousMavenOpts
    Pop-Location
}
