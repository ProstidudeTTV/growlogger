# CasaOS Troubleshooting Guide

## Common Issues and Solutions

### Issue 1: App Won't Install from Zip

**Symptoms:**
- CasaOS shows error when trying to import the zip
- "Invalid format" or "Cannot parse manifest" error

**Solutions:**

1. **Check Zip File Structure:**
   - The zip should contain `casaos-app.json` at the root level
   - Extract the zip and verify the structure:
     ```
     cannabis-grow-tracker-bot-casaos.zip
     ├── casaos-app.json
     ├── Dockerfile
     ├── docker-compose.yml
     ├── package.json
     └── src/
     ```

2. **Verify Manifest Format:**
   - Open `casaos-app.json` and validate JSON syntax
   - Use an online JSON validator: https://jsonlint.com/
   - Ensure no trailing commas or syntax errors

3. **Try Manual Installation:**
   - Extract the zip file manually
   - In CasaOS, use "Docker Compose" method instead
   - Copy the `docker-compose.yml` content directly

### Issue 2: App Installs But Won't Start

**Symptoms:**
- Container shows as "Stopped" or keeps restarting
- Error in logs about missing files or build failures

**Solutions:**

1. **Check Build Context:**
   - Ensure all source files are in the zip
   - Verify `src/` directory is included
   - Check that `package.json` and `Dockerfile` are present

2. **Check Environment Variables:**
   - Verify all required variables are set
   - Check for typos in variable names
   - Ensure no extra spaces in values

3. **Check Logs:**
   - In CasaOS, click on the container
   - View logs to see specific error messages
   - Common errors:
     - "Cannot find module" → Missing dependencies
     - "Build failed" → Docker build issue
     - "Token invalid" → Discord/Supabase credentials wrong

### Issue 3: Bot Doesn't Connect to Discord

**Symptoms:**
- Container runs but bot doesn't appear online in Discord
- No response to commands

**Solutions:**

1. **Verify Discord Bot Token:**
   - Check token is correct (no extra spaces)
   - Ensure token hasn't been regenerated
   - Verify bot has "Message Content Intent" enabled

2. **Check Network:**
   - Discord bot needs outbound internet access
   - Verify CasaOS box can reach discord.com
   - Check firewall rules

3. **Check Logs for Errors:**
   - Look for "Failed to login" errors
   - Check for "Used disallowed intents" error
   - Verify GUILD_ID matches your server

### Issue 4: CasaOS Can't Download from GitHub

**Symptoms:**
- Error when entering GitHub release URL
- "Download failed" or timeout

**Solutions:**

1. **Verify URL Format:**
   - Correct format: `https://github.com/ProstidudeTTV/growlogger/releases/download/1.0/cannabis-grow-tracker-bot-casaos.zip`
   - Replace `1.0` with your actual release tag
   - Ensure the release is published (not draft)

2. **Try Direct Download:**
   - Download the zip file manually
   - Upload it directly to CasaOS instead of using URL

3. **Check Network Access:**
   - Verify CasaOS box can reach github.com
   - Check if proxy settings are needed

### Issue 5: Manifest Format Not Recognized

**Symptoms:**
- CasaOS doesn't recognize the app format
- "Unknown app type" error

**Solutions:**

1. **Check CasaOS Version:**
   - Older CasaOS versions might not support the manifest format
   - Update CasaOS to latest version
   - Check CasaOS documentation for supported formats

2. **Use Docker Compose Method:**
   - Instead of app manifest, use Docker Compose directly
   - Extract zip and use `docker-compose.yml` content
   - This method works on all CasaOS versions

### Issue 6: Environment Variables Not Showing

**Symptoms:**
- Can't configure environment variables in CasaOS
- Variables are missing from the UI

**Solutions:**

1. **Check Manifest Format:**
   - Verify `env` array in `casaos-app.json` is correct
   - Each variable should have: `name`, `label`, `description`, `type`

2. **Manual Configuration:**
   - If variables don't show, configure them manually
   - Edit the Docker Compose in CasaOS
   - Add environment variables directly in the compose file

## Alternative Installation Method

If the zip/manifest method doesn't work, use Docker Compose directly:

1. **Extract the Zip:**
   ```bash
   unzip cannabis-grow-tracker-bot-casaos.zip -d /path/to/casaos/apps/cannabis-bot
   ```

2. **In CasaOS:**
   - Go to **Containers** → **Compose**
   - Create new stack: `cannabis-bot`
   - Copy content from `docker-compose.yml`
   - Set build context to extracted directory
   - Add environment variables manually

3. **Deploy:**
   - Click deploy/start
   - Monitor logs for any errors

## Getting Help

If you're still having issues:

1. **Check CasaOS Logs:**
   - CasaOS dashboard → System → Logs
   - Look for errors related to app installation

2. **Check Container Logs:**
   - Container → Logs tab
   - Copy error messages

3. **Verify Prerequisites:**
   - Docker is running
   - CasaOS is up to date
   - Network connectivity is working

4. **Test Locally First:**
   - Try building the Docker image locally
   - Test with `docker-compose up`
   - Verify everything works before deploying to CasaOS

## Quick Test Commands

Test the zip file locally:
```bash
# Extract and check structure
unzip -l cannabis-grow-tracker-bot-casaos.zip

# Validate JSON
cat casaos-app.json | python -m json.tool

# Test Docker build
docker build -t test-bot .
```

Test Docker Compose:
```bash
docker-compose -f docker-compose.yml config
```
