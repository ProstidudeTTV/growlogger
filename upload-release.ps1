# PowerShell script to upload zip file to GitHub Release 1.0
# Requires GitHub Personal Access Token with 'repo' scope

param(
    [string]$GitHubToken = "",
    [string]$Owner = "ProstidudeTTV",
    [string]$Repo = "growlogger",
    [string]$Tag = "1.0",
    [string]$ZipFile = "cannabis-grow-tracker-bot-casaos.zip"
)

if (-not $GitHubToken) {
    Write-Host "GitHub Personal Access Token required!" -ForegroundColor Red
    Write-Host ""
    Write-Host "To get a token:" -ForegroundColor Yellow
    Write-Host "1. Go to: https://github.com/settings/tokens" -ForegroundColor White
    Write-Host "2. Click 'Generate new token (classic)'" -ForegroundColor White
    Write-Host "3. Select 'repo' scope" -ForegroundColor White
    Write-Host "4. Copy the token" -ForegroundColor White
    Write-Host ""
    Write-Host "Then run:" -ForegroundColor Yellow
    Write-Host "  .\upload-release.ps1 -GitHubToken YOUR_TOKEN" -ForegroundColor White
    Write-Host ""
    Write-Host "Or use the web interface method below:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "WEB UPLOAD METHOD (Easier):" -ForegroundColor Green
    Write-Host "1. Go to: https://github.com/ProstidudeTTV/growlogger/releases" -ForegroundColor White
    Write-Host "2. Click 'Draft a new release' or edit release '1.0'" -ForegroundColor White
    Write-Host "3. If creating new: Tag = '1.0', Title = 'Release 1.0'" -ForegroundColor White
    Write-Host "4. Scroll down to 'Attach binaries'" -ForegroundColor White
    Write-Host "5. Drag and drop: $ZipFile" -ForegroundColor White
    Write-Host "6. Click 'Publish release'" -ForegroundColor White
    exit 1
}

if (-not (Test-Path $ZipFile)) {
    Write-Host "Error: $ZipFile not found!" -ForegroundColor Red
    Write-Host "Run package-casaos.ps1 first to create the zip file." -ForegroundColor Yellow
    exit 1
}

Write-Host "Uploading $ZipFile to GitHub Release $Tag..." -ForegroundColor Green

# Check if release exists
$releaseUrl = "https://api.github.com/repos/$Owner/$Repo/releases/tags/$Tag"
$headers = @{
    "Authorization" = "token $GitHubToken"
    "Accept" = "application/vnd.github.v3+json"
}

try {
    $release = Invoke-RestMethod -Uri $releaseUrl -Headers $headers -Method Get
    Write-Host "Release $Tag exists (ID: $($release.id))" -ForegroundColor Yellow
    $releaseId = $release.id
} catch {
    # Release doesn't exist, create it
    Write-Host "Release $Tag doesn't exist. Creating it..." -ForegroundColor Yellow
    $createBody = @{
        tag_name = $Tag
        name = "Release $Tag"
        body = "Cannabis Grow Tracker Discord Bot - CasaOS Package`n`nThis release contains the CasaOS app package for easy deployment."
        draft = $false
        prerelease = $false
    } | ConvertTo-Json
    
    try {
        $release = Invoke-RestMethod -Uri "https://api.github.com/repos/$Owner/$Repo/releases" -Headers $headers -Method Post -Body $createBody -ContentType "application/json"
        Write-Host "Release created successfully!" -ForegroundColor Green
        $releaseId = $release.id
    } catch {
        Write-Host "Error creating release: $_" -ForegroundColor Red
        exit 1
    }
}

# Upload asset
Write-Host "Uploading asset..." -ForegroundColor Yellow
$uploadUrl = "https://uploads.github.com/repos/$Owner/$Repo/releases/$releaseId/assets?name=$ZipFile"

try {
    $fileBytes = [System.IO.File]::ReadAllBytes((Resolve-Path $ZipFile))
    $uploadHeaders = @{
        "Authorization" = "token $GitHubToken"
        "Content-Type" = "application/zip"
        "Accept" = "application/vnd.github.v3+json"
    }
    
    $response = Invoke-RestMethod -Uri $uploadUrl -Headers $uploadHeaders -Method Post -Body $fileBytes
    
    Write-Host ""
    Write-Host "✓ Successfully uploaded $ZipFile to Release $Tag!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Release URL: $($response.html_url)" -ForegroundColor Cyan
    Write-Host "Download URL: $($response.browser_download_url)" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Use this URL in CasaOS:" -ForegroundColor Yellow
    Write-Host $response.browser_download_url -ForegroundColor White
} catch {
    Write-Host "Error uploading file: $_" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody" -ForegroundColor Red
    }
    exit 1
}
