# Lance tous les services backend dans des terminaux séparés.
# Exécutez ce script depuis PowerShell :
#   cd \path\to\orthophoniste-platform\backend
#   .\run-all-backend-services.ps1

$services = @(
    "discovery-service",
    "auth-service",
    "suivi-service",
    "rdv-service",
    "notification-service",
    "api-gateway"
)

$backendRoot = Split-Path -Parent $MyInvocation.MyCommand.Definition

foreach ($service in $services) {
    $servicePath = Join-Path $backendRoot $service
    if (-Not (Test-Path $servicePath)) {
        Write-Warning "Le service '$service' est introuvable dans $backendRoot"
        continue
    }

    Write-Host "Démarrage de $service dans un nouveau terminal..."

    Start-Process -FilePath "powershell.exe" -ArgumentList (
        "-NoExit",
        "-Command",
        "Set-Location -Path '$servicePath'; .\mvnw.cmd spring-boot:run"
    )
}

Write-Host "Tous les services backend ont été lancés. Vérifiez les fenêtres PowerShell ouvertes."