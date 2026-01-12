# Test SSH Connection to GitHub
# Run this script after adding the SSH key to GitHub

Write-Host "Testing SSH connection to GitHub..." -ForegroundColor Yellow
Write-Host ""

# Test SSH connection
$result = ssh -T git@github.com 2>&1
$exitCode = $LASTEXITCODE

Write-Host "Result: $result" -ForegroundColor Cyan
Write-Host ""

if ($result -match "successfully authenticated") {
    Write-Host "✅ SUCCESS: SSH authentication works!" -ForegroundColor Green
    Write-Host "You can now use git push/pull with SSH" -ForegroundColor Green
} elseif ($result -match "Permission denied") {
    Write-Host "❌ FAILED: SSH key not added to GitHub or incorrect" -ForegroundColor Red
    Write-Host "Please add the SSH key to: https://github.com/settings/keys" -ForegroundColor Yellow
} else {
    Write-Host "⚠️  Unknown result. Check output above." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Your public key location: $env:USERPROFILE\.ssh\id_ed25519.pub" -ForegroundColor Cyan
