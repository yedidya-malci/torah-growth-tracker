$target = [System.IO.Path]::Combine($env:USERPROFILE, "Desktop", "TorahTracker")
if (Test-Path $target) {
    Write-Host "Cleaning up $target"
    Get-Process | Where-Object { $_.Path -like "$target*" } | Stop-Process -Force -ErrorAction SilentlyContinue
    & taskkill /F /IM TorahTracker.exe /T 2>$null
    Start-Sleep -Seconds 2
    # Try to remove problematic files
    Remove-Item -Path [System.IO.Path]::Combine($target, "locales", "he.pak") -Force -ErrorAction SilentlyContinue
}
