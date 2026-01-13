# Security Check Script
# Check for exposed sensitive information in code

Write-Host "Security Check Starting..." -ForegroundColor Yellow
Write-Host ""

$foundIssues = $false

# Check for exposed Supabase URLs
Write-Host "Checking for exposed Supabase URLs..." -ForegroundColor Cyan
$supabaseUrlMatches = Select-String -Path "*.js", "*.html" -Pattern "https://[a-z]+\.supabase\.co" -Exclude "api\*", "*check-security*" -ErrorAction SilentlyContinue

if ($supabaseUrlMatches) {
    Write-Host "[FAIL] Found exposed Supabase URLs:" -ForegroundColor Red
    $supabaseUrlMatches | ForEach-Object {
        Write-Host "  File: $($_.Filename):$($_.LineNumber)" -ForegroundColor Red
        Write-Host "  Content: $($_.Line.Trim())" -ForegroundColor Red
    }
    $foundIssues = $true
} else {
    Write-Host "[PASS] No exposed Supabase URLs found" -ForegroundColor Green
}

Write-Host ""

# Check for exposed API Keys
Write-Host "Checking for exposed API Keys..." -ForegroundColor Cyan
$apiKeyMatches = Select-String -Path "*.js", "*.html" -Pattern "sb_[a-zA-Z0-9_]+" -Exclude "api\*", "*check-security*", "*env.example*" -ErrorAction SilentlyContinue

if ($apiKeyMatches) {
    Write-Host "[FAIL] Found exposed API Keys:" -ForegroundColor Red
    $apiKeyMatches | ForEach-Object {
        Write-Host "  File: $($_.Filename):$($_.LineNumber)" -ForegroundColor Red
        Write-Host "  Content: $($_.Line.Trim())" -ForegroundColor Red
    }
    $foundIssues = $true
} else {
    Write-Host "[PASS] No exposed API Keys found" -ForegroundColor Green
}

Write-Host ""

# Check .gitignore configuration
Write-Host "Checking .gitignore configuration..." -ForegroundColor Cyan
$gitignoreContent = Get-Content .gitignore -ErrorAction SilentlyContinue

if ($gitignoreContent -match "\.env") {
    Write-Host "[PASS] .env files are in .gitignore" -ForegroundColor Green
} else {
    Write-Host "[WARN] .env files not in .gitignore" -ForegroundColor Yellow
    Write-Host "  Suggestion: Add .env to .gitignore" -ForegroundColor Yellow
}

Write-Host ""

# Check for .env files
Write-Host "Checking for .env files..." -ForegroundColor Cyan
$envFiles = Get-ChildItem -Path . -Filter ".env*" -File -ErrorAction SilentlyContinue | Where-Object { $_.Name -ne ".env.example" -and $_.Name -notlike "*env.example*" }

if ($envFiles) {
    Write-Host "[WARN] Found .env files:" -ForegroundColor Yellow
    $envFiles | ForEach-Object {
        Write-Host "  - $($_.Name)" -ForegroundColor Yellow
    }
    Write-Host "  Make sure these files are NOT committed to GitHub" -ForegroundColor Yellow
} else {
    Write-Host "[PASS] No .env files found" -ForegroundColor Green
}

Write-Host ""

# Check if API proxy exists
Write-Host "Checking for secure API proxy..." -ForegroundColor Cyan
if (Test-Path "api\supabase.js") {
    Write-Host "[PASS] API proxy file exists: api\supabase.js" -ForegroundColor Green
} else {
    Write-Host "[FAIL] API proxy file not found: api\supabase.js" -ForegroundColor Red
    $foundIssues = $true
}

Write-Host ""

# Summary
Write-Host "================================" -ForegroundColor Cyan
if ($foundIssues) {
    Write-Host "[FAIL] Security issues found. Please fix before committing." -ForegroundColor Red
    exit 1
} else {
    Write-Host "[PASS] Security check passed!" -ForegroundColor Green
    Write-Host "" 
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Configure environment variables in Vercel (see SECURITY_SETUP_GUIDE.md)" -ForegroundColor Yellow
    Write-Host "2. Commit code to GitHub" -ForegroundColor Yellow
    Write-Host "3. Enable RLS in Supabase (run supabase_security_rls.sql)" -ForegroundColor Yellow
    Write-Host "4. Test website functionality" -ForegroundColor Yellow
    exit 0
}
