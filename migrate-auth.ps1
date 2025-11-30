# Migration script for Auth & Authorization upgrade
# This script helps migrate from old AUTH_USER_PASS to new user system

Write-Host "===================================" -ForegroundColor Cyan
Write-Host "Garage WebUI - Auth Upgrade Helper" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env file exists
if (-not (Test-Path .env)) {
    Write-Host "Creating .env file..." -ForegroundColor Yellow
    New-Item -Path .env -ItemType File -Force | Out-Null
}

# Prompt for admin password
$SecurePass = Read-Host "Enter password for admin account (default: admin)" -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecurePass)
$ADMIN_PASS = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

if ([string]::IsNullOrEmpty($ADMIN_PASS)) {
    $ADMIN_PASS = "admin"
}

# Read .env content
$envContent = Get-Content .env -Raw -ErrorAction SilentlyContinue

# Check if ADMIN_PASSWORD already exists
if ($envContent -match "ADMIN_PASSWORD=") {
    Write-Host "Updating ADMIN_PASSWORD in .env..." -ForegroundColor Yellow
    $envContent = $envContent -replace "ADMIN_PASSWORD=.*", "ADMIN_PASSWORD=$ADMIN_PASS"
} else {
    Write-Host "Adding ADMIN_PASSWORD to .env..." -ForegroundColor Yellow
    $envContent += "`nADMIN_PASSWORD=$ADMIN_PASS"
}

# Remove old AUTH_USER_PASS if exists
if ($envContent -match "AUTH_USER_PASS=") {
    Write-Host "Removing deprecated AUTH_USER_PASS from .env..." -ForegroundColor Yellow
    $envContent = $envContent -replace "AUTH_USER_PASS=.*`n?", ""
}

# Write back to .env
Set-Content -Path .env -Value $envContent.Trim()

Write-Host ""
Write-Host "✓ Environment configured successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Build and start the application"
Write-Host "2. Login with username: admin and your password"
Write-Host "3. Navigate to Users page to create additional users"
Write-Host "4. Assign bucket permissions to users as needed"
Write-Host ""
Write-Host "Important: Keep your admin password secure!" -ForegroundColor Yellow
Write-Host ""
