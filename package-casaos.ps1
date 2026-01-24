# PowerShell script to package CasaOS app files into a zip
# This creates a zip file that can be uploaded to GitHub Releases for CasaOS deployment

$ErrorActionPreference = "Stop"

Write-Host "Packaging CasaOS app files..." -ForegroundColor Green

# Create temporary directory
$tempDir = "casaos-package-temp"
$zipName = "cannabis-grow-tracker-bot-casaos.zip"

# Remove old temp directory and zip if they exist
if (Test-Path $tempDir) {
    Remove-Item -Recurse -Force $tempDir
}
if (Test-Path $zipName) {
    Remove-Item -Force $zipName
}

# Create temp directory
New-Item -ItemType Directory -Path $tempDir | Out-Null

Write-Host "Copying required files..." -ForegroundColor Yellow

# Copy essential files
$filesToCopy = @(
    "casaos-app.json",
    "Dockerfile",
    "docker-compose.yml",
    "docker-compose.prod.yml",
    "package.json",
    "package-lock.json",
    "tsconfig.json",
    "env.example"
)

foreach ($file in $filesToCopy) {
    if (Test-Path $file) {
        Copy-Item $file -Destination $tempDir
        Write-Host "  [OK] $file" -ForegroundColor Gray
    } else {
        Write-Host "  [MISSING] $file (not found)" -ForegroundColor Red
    }
}

# Copy source directory
Write-Host "Copying source files..." -ForegroundColor Yellow
Copy-Item -Recurse "src" -Destination $tempDir
Write-Host "  [OK] src/" -ForegroundColor Gray

# Copy supabase migrations
Write-Host "Copying database migrations..." -ForegroundColor Yellow
if (Test-Path "supabase") {
    Copy-Item -Recurse "supabase" -Destination $tempDir
    Write-Host "  [OK] supabase/" -ForegroundColor Gray
}

# Create zip file
Write-Host "Creating zip archive..." -ForegroundColor Yellow
Compress-Archive -Path "$tempDir\*" -DestinationPath $zipName -Force

# Clean up temp directory
Remove-Item -Recurse -Force $tempDir

Write-Host ""
Write-Host "[SUCCESS] Package created successfully: $zipName" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Create a GitHub Release in your repository" -ForegroundColor White
Write-Host "2. Upload $zipName as an asset to the release" -ForegroundColor White
Write-Host "3. Use the release zip URL in CasaOS App Store" -ForegroundColor White
Write-Host ""
Write-Host "GitHub Release URL format:" -ForegroundColor Cyan
Write-Host "https://github.com/ProstidudeTTV/growlogger/releases/download/v1.0.0/$zipName" -ForegroundColor White
