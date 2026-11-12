param([switch]$SkipBuild, [switch]$BackendOnly, [switch]$ReuseRunningServices)
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
# Some IDE terminals inherit both PATH and Path; Start-Process rejects duplicates.
$processEnvironment = [Environment]::GetEnvironmentVariables('Process')
$duplicateGroups = @($processEnvironment.Keys | Group-Object { $_.ToUpperInvariant() } | Where-Object { $_.Count -gt 1 })
foreach ($group in $duplicateGroups) {
    $savedValue = $processEnvironment[$group.Group[0]]
    foreach ($entryName in $group.Group) { [Environment]::SetEnvironmentVariable($entryName, $null, 'Process') }
    [Environment]::SetEnvironmentVariable($group.Name, $savedValue, 'Process')
}
$projectRoot = $PSScriptRoot
$runtimeRoot = Join-Path $projectRoot '.runtime'
New-Item -ItemType Directory -Force $runtimeRoot | Out-Null
$stateFile = Join-Path $runtimeRoot 'processes.json'
if (Test-Path $stateFile) { throw 'Une session existe deja. Executer stop.ps1 avant de relancer.' }
$envFile = Join-Path $projectRoot '.env'
if (Test-Path $envFile) {
    foreach ($line in Get-Content -LiteralPath $envFile) {
        if ($line -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=(.*)$') {
            [Environment]::SetEnvironmentVariable($matches[1], $matches[2].Trim().Trim('"').Trim("'"), 'Process')
        }
    }
}
$javaCommand = (Get-Command java -ErrorAction Stop).Source
if (!$BackendOnly) {
    $nodeCommand = (Get-Command node -ErrorAction Stop).Source
    $nodeVersion = & $nodeCommand -p 'process.versions.node'
    if ([int]($nodeVersion.Split('.')[0]) -ne 24) { throw 'Installer Node.js 24 LTS.' }
}
$mongoHost = 'localhost'
$mongoPort = 27017
if ($env:MONGO_URI) {
    $mongoAddress = [Uri]$env:MONGO_URI
    $mongoHost = $mongoAddress.Host
    if ($mongoAddress.Port -gt 0) { $mongoPort = $mongoAddress.Port }
}
$mongoProbe = New-Object Net.Sockets.TcpClient
try {
    $connection = $mongoProbe.BeginConnect($mongoHost, $mongoPort, $null, $null)
    if (!$connection.AsyncWaitHandle.WaitOne(3000)) { throw 'Connexion MongoDB expiree.' }
    $mongoProbe.EndConnect($connection)
} catch { throw "MongoDB indisponible sur ${mongoHost}:$mongoPort. Demarrer MongoDB avant le lancement." }
finally { $mongoProbe.Dispose() }
if (!$SkipBuild) { & (Join-Path $projectRoot 'build.ps1') -BackendOnly:$BackendOnly }
if (!$BackendOnly -and !(Test-Path (Join-Path $projectRoot 'frontend/orthophoniste-web/node_modules/vite/bin/vite.js'))) {
    Push-Location (Join-Path $projectRoot 'frontend/orthophoniste-web')
    try {
        & npm.cmd ci
        if ($LASTEXITCODE -ne 0) { throw 'Installation frontend en echec.' }
    } finally { Pop-Location }
}
$services = @(
    @{ Name='discovery-service'; Port=8761 },
    @{ Name='auth-service'; Port=8081 },
    @{ Name='suivi-service'; Port=8083 },
    @{ Name='rdv-service'; Port=8082 },
    @{ Name='notification-service'; Port=8084 },
    @{ Name='api-gateway'; Port=8888 }
)
foreach ($service in $services) {
    $service.Jar = Join-Path $projectRoot "backend/$($service.Name)/target/$($service.Name)-1.0.0.jar"
    if (!(Test-Path $service.Jar)) { throw "JAR absent : $($service.Jar). Executer build.ps1." }
}
$ports = @(8180) + @($services | ForEach-Object { $_.Port })
if (!$BackendOnly) { $ports += 5180 }
foreach ($port in $ports) {
    $portProbe = New-Object Net.Sockets.TcpClient
    $occupied = $false
    try {
        $connection = $portProbe.BeginConnect('localhost', $port, $null, $null)
        if ($connection.AsyncWaitHandle.WaitOne(500)) {
            $portProbe.EndConnect($connection)
            $occupied = $true
        }
    } catch { }
    finally { $portProbe.Dispose() }
    if ($occupied) {
        $service = $services | Where-Object { $_.Port -eq $port }
        if (!$ReuseRunningServices -or (!$service -and $port -ne 8180)) {
            throw "Le port $port est deja occupe. Arreter l'instance existante ou utiliser -ReuseRunningServices pour reutiliser les services backend sains."
        }
        $readyUrl = if ($port -eq 8180) {
            'http://localhost:8180/realms/orthophoniste/.well-known/openid-configuration'
        } else { "http://localhost:$port/actuator/health" }
        try {
            $existing = Invoke-RestMethod -Uri $readyUrl -TimeoutSec 5
            if ($port -eq 8180) {
                if ($existing.issuer -ne 'http://localhost:8180/realms/orthophoniste') { throw 'Realm Keycloak inattendu.' }
                $reuseKeycloak = $true
            } else {
                if ($existing.status -ne 'UP') { throw 'Service non disponible.' }
                $service.Reuse = $true
            }
        } catch { throw "Le port $port est occupe mais le service attendu n'est pas pret : $($_.Exception.Message)" }
    }
}
$keycloakVersion = '26.8.0'
$toolsRoot = Join-Path $projectRoot '.tools'
$keycloakRoot = Join-Path $toolsRoot "keycloak-$keycloakVersion"
$keycloakCommand = Join-Path $keycloakRoot 'bin/kc.bat'
if (!(Test-Path $keycloakCommand)) {
    New-Item -ItemType Directory -Force $toolsRoot | Out-Null
    $archive = Join-Path $toolsRoot "keycloak-$keycloakVersion.zip"
    Write-Host "Telechargement de Keycloak $keycloakVersion..."
    & curl.exe -fL --retry 2 --max-time 300 --silent --show-error "https://github.com/keycloak/keycloak/releases/download/$keycloakVersion/keycloak-$keycloakVersion.zip" -o $archive
    if ($LASTEXITCODE -ne 0) { throw 'Telechargement Keycloak en echec.' }
    Expand-Archive -LiteralPath $archive -DestinationPath $toolsRoot -Force
}
$importDirectory = Join-Path $keycloakRoot 'data/import'
New-Item -ItemType Directory -Force $importDirectory | Out-Null
Copy-Item -LiteralPath (Join-Path $projectRoot 'keycloak/realm-export.json') -Destination (Join-Path $importDirectory 'orthophoniste-realm.json') -Force
if (!$env:KC_BOOTSTRAP_ADMIN_USERNAME) { $env:KC_BOOTSTRAP_ADMIN_USERNAME = 'admin' }
if (!$env:KC_BOOTSTRAP_ADMIN_PASSWORD) { $env:KC_BOOTSTRAP_ADMIN_PASSWORD = 'admin' }
$started = [Collections.Generic.List[object]]::new()
function Register-Process($Name, $Process) {
    $started.Add(@{ Name=$Name; Id=$Process.Id; StartTime=$Process.StartTime.ToUniversalTime().ToString('o') })
    ConvertTo-Json -InputObject @($started.ToArray()) -Depth 5 | Set-Content -LiteralPath $stateFile -Encoding UTF8
}
function Wait-Ready($Name, $Url, $Process, $Timeout = 180) {
    $deadline = (Get-Date).AddSeconds($Timeout)
    while ((Get-Date) -lt $deadline) {
        $Process.Refresh()
        if ($Process.HasExited) { throw "$Name s'est arrete. Consulter .runtime/$Name.err.log et .runtime/$Name.log." }
        try {
            $result = Invoke-WebRequest -UseBasicParsing -Uri $Url -TimeoutSec 3
            if ($result.StatusCode -eq 200) { Write-Host "$Name pret."; return }
        } catch { }
        Start-Sleep -Seconds 2
    }
    throw "Delai de demarrage depasse pour $Name. Consulter .runtime/$Name.log."
}
try {
    if ($reuseKeycloak) { Write-Host 'Keycloak existant reutilise.' }
    else {
        $keycloakProcess = Start-Process -FilePath $keycloakCommand -ArgumentList @('start-dev','--http-port=8180','--hostname=http://localhost:8180','--import-realm') -WorkingDirectory $keycloakRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $runtimeRoot 'keycloak.log') -RedirectStandardError (Join-Path $runtimeRoot 'keycloak.err.log') -PassThru
        Register-Process 'keycloak' $keycloakProcess
        Wait-Ready 'keycloak' 'http://localhost:8180/realms/orthophoniste/.well-known/openid-configuration' $keycloakProcess
    }
    foreach ($service in $services) {
        $name = $service.Name
        if ($service.Reuse) { Write-Host "$name existant reutilise."; continue }
        $process = Start-Process -FilePath $javaCommand -ArgumentList @('-Xms64m','-Xmx384m','-jar', ('"' + $service.Jar + '"')) -WorkingDirectory $projectRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $runtimeRoot "$name.log") -RedirectStandardError (Join-Path $runtimeRoot "$name.err.log") -PassThru
        Register-Process $name $process
        Wait-Ready $name "http://localhost:$($service.Port)/actuator/health" $process
    }
    if (!$BackendOnly) {
        $frontendRoot = Join-Path $projectRoot 'frontend/orthophoniste-web'
        $viteScript = Join-Path $frontendRoot 'node_modules/vite/bin/vite.js'
        $frontendProcess = Start-Process -FilePath $nodeCommand -ArgumentList @(('"' + $viteScript + '"'),'--host','127.0.0.1') -WorkingDirectory $frontendRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $runtimeRoot 'frontend.log') -RedirectStandardError (Join-Path $runtimeRoot 'frontend.err.log') -PassThru
        Register-Process 'frontend' $frontendProcess
        Wait-Ready 'frontend' 'http://localhost:5180' $frontendProcess
    }
    if (!$BackendOnly) { Write-Host 'Application : http://localhost:5180' }
    Write-Host 'API : http://localhost:8888 | Keycloak : http://localhost:8180'
    Write-Host 'Arret : powershell -ExecutionPolicy Bypass -File .\stop.ps1'
} catch {
    & (Join-Path $projectRoot 'stop.ps1')
    throw
}
