#!/bin/bash
# Bash script to package CasaOS app files into a zip
# This creates a zip file that can be uploaded to GitHub Releases for CasaOS deployment

set -e

echo "Packaging CasaOS app files..."

# Create temporary directory
TEMP_DIR="casaos-package-temp"
ZIP_NAME="cannabis-grow-tracker-bot-casaos.zip"

# Remove old temp directory and zip if they exist
rm -rf "$TEMP_DIR"
rm -f "$ZIP_NAME"

# Create temp directory
mkdir -p "$TEMP_DIR"

echo "Copying required files..."

# Copy essential files
FILES=(
    "casaos-app.json"
    "Dockerfile"
    "docker-compose.yml"
    "docker-compose.prod.yml"
    "package.json"
    "package-lock.json"
    "tsconfig.json"
    "env.example"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        cp "$file" "$TEMP_DIR/"
        echo "  ✓ $file"
    else
        echo "  ✗ $file (not found)"
    fi
done

# Copy source directory
echo "Copying source files..."
cp -r src "$TEMP_DIR/"
echo "  ✓ src/"

# Copy supabase migrations
echo "Copying database migrations..."
if [ -d "supabase" ]; then
    cp -r supabase "$TEMP_DIR/"
    echo "  ✓ supabase/"
fi

# Create zip file
echo "Creating zip archive..."
cd "$TEMP_DIR"
zip -r "../$ZIP_NAME" . > /dev/null
cd ..

# Clean up temp directory
rm -rf "$TEMP_DIR"

echo ""
echo "✓ Package created successfully: $ZIP_NAME"
echo ""
echo "Next steps:"
echo "1. Create a GitHub Release in your repository"
echo "2. Upload $ZIP_NAME as an asset to the release"
echo "3. Use the release zip URL in CasaOS App Store"
echo ""
echo "GitHub Release URL format:"
echo "https://github.com/ProstidudeTTV/growlogger/releases/download/v1.0.0/$ZIP_NAME"
