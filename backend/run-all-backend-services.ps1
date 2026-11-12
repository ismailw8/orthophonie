param([switch]$SkipBuild, [switch]$ReuseRunningServices)
$projectRoot = Split-Path -Parent $PSScriptRoot
& (Join-Path $projectRoot 'start.ps1') -BackendOnly -SkipBuild:$SkipBuild -ReuseRunningServices:$ReuseRunningServices
