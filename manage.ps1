param (
    [ValidateSet('status', 'logs', 'error-logs', 'restart')]
    [string]$Action = 'status'
)

$logFile = Join-Path $PSScriptRoot "logs\combined.log"
$errFile = Join-Path $PSScriptRoot "logs\error.log"

switch ($Action) {
    'status' {
        Write-Host "--- UB Portal Monitor Status ---" -ForegroundColor Cyan
        $process = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
            $_.Path -like "*node.exe*"
        }
        Write-Host "Service is running in background under PM2." -ForegroundColor Green
        Write-Host "Recent Log Entries:" -ForegroundColor Yellow
        if (Test-Path $logFile) {
            Get-Content $logFile -Tail 10
        } else {
            Write-Host "No log file found at $logFile" -ForegroundColor Red
        }
    }
    'logs' {
        Write-Host "Streaming logs from $logFile (Ctrl+C to stop)..." -ForegroundColor Cyan
        if (Test-Path $logFile) {
            Get-Content $logFile -Tail 20 -Wait
        }
    }
    'error-logs' {
        Write-Host "Streaming error logs from $errFile (Ctrl+C to stop)..." -ForegroundColor Red
        if (Test-Path $errFile) {
            Get-Content $errFile -Tail 20 -Wait
        }
    }
    'restart' {
        Write-Host "Triggering PM2 Resurrect task to refresh services..." -ForegroundColor Cyan
        Start-ScheduledTask -TaskName "PM2 Resurrect"
        Start-Sleep -Seconds 3
        Write-Host "Service refreshed!" -ForegroundColor Green
    }
}
