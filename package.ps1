param([switch]$SkipBuild)
$ErrorActionPreference = 'Stop'
if (!$SkipBuild) { & (Join-Path $PSScriptRoot 'build.ps1') }
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$releaseRoot = Join-Path $PSScriptRoot 'releases'
New-Item -ItemType Directory -Force $releaseRoot | Out-Null
$archivePath = Join-Path $releaseRoot 'orthophoniste-platform-1.0.0.zip'
$rootFiles = @('pom.xml', 'mvnw', 'mvnw.cmd', 'build.ps1', 'start.ps1', 'stop.ps1',
    'start.cmd', 'stop.cmd', 'launch-release.cmd', 'package.ps1', 'README.md',
    'DEPLOYMENT.md', 'SECURITY.md', 'RAPPORT_ANALYSE.md', 'docker-compose.yml',
    '.env.example', '.gitignore', '.dockerignore')
$files = [Collections.Generic.List[IO.FileInfo]]::new()
foreach ($relativePath in $rootFiles) { $files.Add((Get-Item -LiteralPath (Join-Path $PSScriptRoot $relativePath))) }
foreach ($directory in @('.mvn', '.github', 'backend', 'frontend/orthophoniste-web', 'keycloak')) {
    Get-ChildItem -LiteralPath (Join-Path $PSScriptRoot $directory) -File -Recurse -Force |
        Where-Object {
            $_.FullName -notmatch '[\\/](node_modules|target|dist|\.idea|\.fork-target|\.verified-target|\.jbr-target)[\\/]'
        } | ForEach-Object { $files.Add($_) }
}
foreach ($service in @('discovery-service', 'api-gateway', 'auth-service', 'rdv-service', 'suivi-service', 'notification-service')) {
    $files.Add((Get-Item -LiteralPath (Join-Path $PSScriptRoot "backend/$service/target/$service-1.0.0.jar")))
}
Get-ChildItem -LiteralPath (Join-Path $PSScriptRoot 'frontend/orthophoniste-web/dist') -File -Recurse |
    ForEach-Object { $files.Add($_) }
foreach ($file in $files) {
    if ($file.Name -eq '.env' -or ($file.Name -like '.env.*' -and $file.Name -ne '.env.example') -or
            $file.Name -match '^application-local\.ya?ml$') {
        throw "Configuration locale detectee dans le paquet : $($file.FullName)"
    }
}
$stream = [IO.File]::Open($archivePath, [IO.FileMode]::Create, [IO.FileAccess]::Write)
$archive = New-Object IO.Compression.ZipArchive($stream, [IO.Compression.ZipArchiveMode]::Create)
try {
    foreach ($file in $files) {
        $relativePath = $file.FullName.Substring($PSScriptRoot.Length + 1).Replace('\', '/')
        [IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive, $file.FullName,
            "orthophoniste-platform/$relativePath", [IO.Compression.CompressionLevel]::Fastest) | Out-Null
    }
} finally { $archive.Dispose(); $stream.Dispose() }
Write-Host "Archive creee : $archivePath"
