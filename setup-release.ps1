# PaperMap Live - Setup Script

Write-Host "PaperMap Live - Release Setup" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

# Step 1: Generate signing keys
Write-Host "[1/3] Generating update signing keys..." -ForegroundColor Yellow
$keyPath = "$env:USERPROFILE\.tauri\papermap.key"
npm run tauri signer generate -- -w $keyPath

Write-Host "`n[SUCCESS] Keys generated!" -ForegroundColor Green
Write-Host "Private key saved to: $keyPath" -ForegroundColor Gray

# Step 2: Instructions for GitHub
Write-Host "`n[2/3] GitHub Secrets Setup" -ForegroundColor Yellow
Write-Host "Go to: GitHub Repository → Settings → Secrets → Actions" -ForegroundColor Gray
Write-Host "Add these secrets:" -ForegroundColor Gray
Write-Host "  - TAURI_PRIVATE_KEY (content of $keyPath)" -ForegroundColor White
Write-Host "  - TAURI_KEY_PASSWORD (password if you set one)" -ForegroundColor White

# Step 3: Update config
Write-Host "`n[3/3] Update Configuration" -ForegroundColor Yellow
Write-Host "Edit src-tauri/tauri.conf.json:" -ForegroundColor Gray
Write-Host "  1. Replace YOUR_USERNAME with your GitHub username" -ForegroundColor White
Write-Host "  2. Replace YOUR_PUBLIC_KEY_HERE with the public key above" -ForegroundColor White

Write-Host "`n[READY] You can now create releases with:" -ForegroundColor Green
Write-Host "  git tag v1.0.0" -ForegroundColor White
Write-Host "  git push origin v1.0.0" -ForegroundColor White

Write-Host "`nPress any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
