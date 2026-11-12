param([string]$GatewayUrl = 'http://localhost:8888')
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$projectRoot = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $projectRoot '.env'
if (Test-Path -LiteralPath $envFile) {
    foreach ($line in Get-Content -LiteralPath $envFile) {
        if ($line -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=(.*)$') {
            [Environment]::SetEnvironmentVariable($matches[1], $matches[2].Trim().Trim('"').Trim("'"), 'Process')
        }
    }
}

function Check-Http($Name, $Url, $Expected = 200, $Headers = @{}, $Method = 'GET', $Body = $null) {
    $parameters = @{ Uri=$Url; Headers=$Headers; Method=$Method; TimeoutSec=10; UseBasicParsing=$true }
    if ($null -ne $Body) { $parameters.Body = $Body; $parameters.ContentType = 'application/json' }
    try { $response = Invoke-WebRequest @parameters; $status = [int]$response.StatusCode }
    catch {
        if (!$_.Exception.Response) { throw "$Name : connexion impossible ($Url)." }
        $status = [int]$_.Exception.Response.StatusCode
    }
    if ($status -ne $Expected) { throw "$Name : HTTP $status au lieu de $Expected ($Url)." }
    Write-Host "$Name : OK (HTTP $status)"
}

$services = @(
    @{ Name='discovery-service'; Port=8761 }, @{ Name='auth-service'; Port=8081 },
    @{ Name='rdv-service'; Port=8082 }, @{ Name='suivi-service'; Port=8083 },
    @{ Name='notification-service'; Port=8084 }, @{ Name='api-gateway'; Port=8888 }
)
foreach ($service in $services) {
    $health = Invoke-RestMethod "http://localhost:$($service.Port)/actuator/health" -TimeoutSec 10
    if ($health.status -ne 'UP') { throw "$($service.Name) : etat $($health.status)." }
    Write-Host "$($service.Name) : UP"
}

$keycloakUrl = if ($env:KEYCLOAK_INTERNAL_URL) { $env:KEYCLOAK_INTERNAL_URL.TrimEnd('/') } else { 'http://localhost:8180' }
$realm = if ($env:KEYCLOAK_REALM) { $env:KEYCLOAK_REALM } else { 'orthophoniste' }
$issuer = if ($env:KEYCLOAK_ISSUER_URI) { $env:KEYCLOAK_ISSUER_URI } else { "$keycloakUrl/realms/$realm" }
$metadata = Invoke-RestMethod "$keycloakUrl/realms/$realm/.well-known/openid-configuration" -TimeoutSec 10
if ($metadata.issuer -ne $issuer) { throw "L'issuer Keycloak ne correspond pas a KEYCLOAK_ISSUER_URI." }
Write-Host 'Keycloak : realm et issuer OK'

$date = (Get-Date).AddDays(1).ToString('yyyy-MM-dd')
Check-Http 'Creneaux RDV directs' "http://localhost:8082/api/rdv/creneaux-occupes?date=$date"
Check-Http 'Creneaux Suivi directs' "http://localhost:8083/api/suivi/creneaux-occupes?date=$date"
Check-Http 'Routage Gateway -> RDV' "$GatewayUrl/api/rdv/creneaux-occupes?date=$date"
Check-Http 'Routage Gateway -> Suivi' "$GatewayUrl/api/suivi/creneaux-occupes?date=$date"
Check-Http 'RDV sans jeton' 'http://localhost:8082/api/rdv/admin' 401
Check-Http 'Suivi sans jeton' 'http://localhost:8083/api/suivi/admin/bilans' 401
Check-Http 'Auth sans jeton' 'http://localhost:8081/api/auth/admin/patients' 401
Check-Http 'Gateway avec jeton invalide' "$GatewayUrl/api/rdv/admin" 401 @{ Authorization='Bearer invalid-token' }

$clientId = if ($env:KEYCLOAK_SERVICE_CLIENT_ID) { $env:KEYCLOAK_SERVICE_CLIENT_ID } else { 'rdv-service' }
$clientSecret = if ($env:KEYCLOAK_SERVICE_CLIENT_SECRET) { $env:KEYCLOAK_SERVICE_CLIENT_SECRET } else { 'local-service-client-secret' }
$token = Invoke-RestMethod "$keycloakUrl/realms/$realm/protocol/openid-connect/token" -Method Post -ContentType 'application/x-www-form-urlencoded' -Body @{
    grant_type='client_credentials'; client_id=$clientId; client_secret=$clientSecret
} -TimeoutSec 10
if (!$token.access_token) { throw 'Keycloak ne retourne pas de jeton de service.' }
$serviceHeaders = @{ Authorization="Bearer $($token.access_token)" }
# An invalid payload reaches validation only after ROLE_SERVICE authentication; no notification is sent.
Check-Http 'Notification sans jeton' 'http://localhost:8084/api/notifications/send' 401 @{} 'POST' '{}'
Check-Http 'Jeton RDV accepte par Notification' 'http://localhost:8084/api/notifications/send' 400 $serviceHeaders 'POST' '{}'
Check-Http 'Role SERVICE refuse sur RDV admin' 'http://localhost:8082/api/rdv/admin' 403 $serviceHeaders
Check-Http 'Role SERVICE refuse sur Suivi admin' 'http://localhost:8083/api/suivi/admin/bilans' 403 $serviceHeaders
Check-Http 'Jeton valide traverse la Gateway' "$GatewayUrl/api/rdv/admin" 403 $serviceHeaders

$adminId = if ($env:KEYCLOAK_ADMIN_CLIENT_ID) { $env:KEYCLOAK_ADMIN_CLIENT_ID } else { 'orthophoniste-admin' }
$adminSecret = if ($env:KEYCLOAK_ADMIN_CLIENT_SECRET) { $env:KEYCLOAK_ADMIN_CLIENT_SECRET } else { 'local-admin-client-secret' }
$adminToken = Invoke-RestMethod "$keycloakUrl/realms/$realm/protocol/openid-connect/token" -Method Post -ContentType 'application/x-www-form-urlencoded' -Body @{
    grant_type='client_credentials'; client_id=$adminId; client_secret=$adminSecret
} -TimeoutSec 10
Check-Http 'Compte technique Auth -> Keycloak' "$keycloakUrl/admin/realms/$realm/users?max=1" 200 @{ Authorization="Bearer $($adminToken.access_token)" }
Write-Host 'Tous les controles backend ont reussi.'
