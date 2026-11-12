$ErrorActionPreference = 'Stop'
$stateFile = Join-Path $PSScriptRoot '.runtime/processes.json'
if (!(Test-Path $stateFile)) { Write-Host 'Aucune session geree a arreter.'; return }
[object[]]$entries = Get-Content -Raw -LiteralPath $stateFile | ConvertFrom-Json
[array]::Reverse($entries)
foreach ($entry in $entries) {
    $process = Get-Process -Id $entry.Id -ErrorAction SilentlyContinue
    if ($process -and $process.StartTime.ToUniversalTime().ToString('o') -eq $entry.StartTime) {
        # Stop only the process tree recorded by start.ps1.
        & taskkill.exe /PID $entry.Id /T /F | Out-Null
        if ($LASTEXITCODE -ne 0) { throw "Impossible d'arreter $($entry.Name)." }
        Write-Host "$($entry.Name) arrete."
    }
}
Remove-Item -LiteralPath $stateFile
