# CasaOS App Store Fix - App Not Appearing

## The Issue

CasaOS uploads the zip file successfully but no app appears. This is because CasaOS expects apps to be added as **app store sources**, not individual app uploads.

## Solution: Two Methods

### Method 1: Use Docker Compose Directly (Easiest)

Instead of using the app store, use CasaOS's Docker Compose feature:

1. **Download the zip from GitHub:**
   ```
   https://github.com/ProstidudeTTV/growlogger/releases/download/1.0/cannabis-grow-tracker-bot-casaos.zip
   ```

2. **Extract the zip file** on your CasaOS box or locally

3. **In CasaOS:**
   - Go to **Apps** → **Compose** (or **Containers** → **Compose**)
   - Click **"Create Stack"** or **"New Compose"**
   - Name it: `cannabis-bot`
   - Copy the contents of `docker-compose.yml` into the editor
   - Set the **build context** to the extracted directory path
   - Add all environment variables manually
   - Click **Deploy**

### Method 2: Create App Store Index (Advanced)

CasaOS app stores need an `index.json` file listing all apps. For a single app, this might be overkill, but here's how:

1. Create an app store structure with `index.json`
2. Package it as a zip
3. Add the zip URL as an app store source in CasaOS

However, **Method 1 is recommended** as it's simpler and works immediately.

## Quick Fix Steps

1. **Extract the zip:**
   ```bash
   unzip cannabis-grow-tracker-bot-casaos.zip -d /tmp/cannabis-bot
   ```

2. **In CasaOS UI:**
   - Go to **Apps** → **Compose**
   - Create new stack
   - Use the `docker-compose.yml` from the extracted files
   - Configure environment variables
   - Deploy

This bypasses the app store system entirely and works directly with Docker Compose, which CasaOS definitely supports.
