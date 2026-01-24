# Quick script to upload zip to existing Release 1.0
# This uses GitHub API - you'll need a Personal Access Token

$owner = "ProstidudeTTV"
$repo = "growlogger"
$tag = "1.0"
$zipFile = "cannabis-grow-tracker-bot-casaos.zip"
$releaseId = "279602694"  # From the API response

Write-Host "Uploading $zipFile to Release $tag..." -ForegroundColor Green

# Check if file exists
if (-not (Test-Path $zipFile)) {
    Write-Host "Error: $zipFile not found!" -ForegroundColor Red
    exit 1
}

# Get GitHub token
$token = $env:GITHUB_TOKEN
if (-not $token) {
    Write-Host ""
    Write-Host "GitHub Personal Access Token required!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "EASIEST METHOD - Use Web Interface:" -ForegroundColor Cyan
    Write-Host "1. Go to: https://github.com/ProstidudeTTV/growlogger/releases/tag/1.0" -ForegroundColor White
    Write-Host "2. Click 'Edit release'" -ForegroundColor White
    Write-Host "3. Scroll to 'Attach binaries by dropping them here or selecting them'" -ForegroundColor White
    Write-Host "4. Drag and drop: $zipFile" -ForegroundColor White
    Write-Host "5. Click 'Update release'" -ForegroundColor White
    Write-Host ""
    Write-Host "OR set GITHUB_TOKEN environment variable and run this script again" -ForegroundColor Yellow
    Write-Host "Get token from: https://github.com/settings/tokens" -ForegroundColor White
    Write-Host "Token needs 'repo' scope" -ForegroundColor White
    exit 1
}

# Upload using GitHub API
$uploadUrl = "https://uploads.github.com/repos/$owner/$repo/releases/$releaseId/assets?name=$zipFile"
$fileBytes = [System.IO.File]::ReadAllBytes((Resolve-Path $zipFile))
$fileSize = $fileBytes.Length

Write-Host "File size: $fileSize bytes" -ForegroundColor Gray

$headers = @{
    "Authorization" = "token $token"
    "Content-Type" = "application/zip"
    "Accept" = "application/vnd.github.v3+json"
}

try {
    Write-Host "Uploading..." -ForegroundColor Yellow
    $response = Invoke-RestMethod -Uri $uploadUrl -Headers $headers -Method Post -Body $fileBytes
    
    Write-Host ""
    Write-Host "✓ Successfully uploaded!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Download URL: $($response.browser_download_url)" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Use this URL in CasaOS:" -ForegroundColor Yellow
    Write-Host $response.browser_download_url -ForegroundColor White
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Details: $responseBody" -ForegroundColor Red
    }
}
