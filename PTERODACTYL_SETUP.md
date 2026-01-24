# Pterodactyl Setup Guide

This guide explains how to deploy the Cannabis Grow Tracker Discord Bot using Pterodactyl Panel.

## Prerequisites

- Pterodactyl Panel installed and running
- A server/node configured in Pterodactyl
- Discord Bot Token from https://discord.com/developers/applications
- Supabase project with migrations applied

## Step 1: Import the Egg

### Option A: Import JSON File (Recommended)

1. **Navigate to Admin Panel**
   - Log in to Pterodactyl as an administrator
   - Go to **Nests** → Select or create a nest (e.g., "Discord Bots")
   - Click **Import Egg**

2. **Upload Egg File**
   - Upload the `egg-pterodactyl-discord-bot.json` file
   - Click **Import**

### Option B: Create Egg Manually (If Import Fails)

If the JSON import doesn't work, create it manually:

1. **Go to Nests** → Select or create a nest
2. **Click "Create Egg"**
3. **Fill in the following:**

   **General Settings:**
   - **Name:** `Discord Bot (TypeScript)`
   - **Description:** `Discord bot built with TypeScript, discord.js, and Supabase`
   - **Author:** `cannabis-grow-tracker`
   - **Docker Image:** `ghcr.io/pterodactyl/yolks:nodejs_18`

   **Startup Configuration:**
   - **Startup Command:** `node dist/bot/index.js`
   - **File Configuration:** Leave default or empty
   - **Stop Command:** `^C`

   **Installation Script:**
   ```bash
   #!/bin/bash
   # Install dependencies
   npm install --production=false
   
   # Build TypeScript
   npm run build
   
   # Verify build
   if [ ! -d "dist" ]; then
       echo "ERROR: Build failed - dist directory not found"
       exit 1
   fi
   
   echo "Installation completed successfully"
   echo "Build output located in dist/ directory"
   ```

   **Variables:**
   - Add each variable from the JSON file one by one
   - Set them as required/optional, hidden/public, etc.

### Troubleshooting JSON Import

**If you get errors:**
1. **"Invalid JSON format"** - Check the file is valid JSON (no trailing commas)
2. **"Egg already exists"** - The UUID might conflict, change the `uuid` field
3. **"Missing required fields"** - Some Pterodactyl versions need different fields
4. **Error 500** - This is a common issue with egg imports. **Use manual creation (Option B) instead** - it's more reliable
5. **Manual creation works better** - Use Option B if imports keep failing

**Common Issues:**
- Remove the `"_comment"` field if it causes issues
- Error 500 often means the structure doesn't match your Pterodactyl version
- **Recommendation:** If you get Error 500, skip JSON import and use **Option B (Manual Creation)** below - it always works

**Error 500 Fix:**
If you're getting a 500 error repeatedly:
- ✅ **Use Manual Creation (Option B)** - This is the most reliable method
- Check Pterodactyl logs at `storage/logs/laravel-*.log` for specific errors
- Try exporting an existing egg from Pterodactyl to see the format it expects
- Some Pterodactyl versions have strict validation that causes JSON imports to fail

## Step 2: Create a New Server

1. **Go to Admin Panel → Servers**
   - Click **Create New Server**
   - Select your node
   - Select the nest containing your Discord bot egg
   - Select the "Discord Bot (TypeScript)" egg

2. **Configure Server Details**
   - **Server Name:** `Cannabis Grow Tracker Bot`
   - **Owner:** Select the user who will manage this server
   - **Resource Limits:**
     - **CPU:** 100% (1 core)
     - **Memory:** 512MB - 1024MB (recommended: 1024MB)
     - **Disk:** 2048MB (2GB) - enough for node_modules and build files
     - **Block IO:** 500

3. **Server Configuration**
   - **Docker Image:** `ghcr.io/pterodactyl/yolks:nodejs_18` (should auto-fill)
   - **Startup Command:** Should be `node dist/bot/index.js`
   - **Network Mode:** Bridge (default)
   - **Allocations (Ports):** 
     - ⚠️ **Important:** Discord bots **DO NOT need ports**
     - Discord bots connect **outbound** to Discord's API (no incoming connections)
     - You can either:
       - Leave allocations empty (no ports assigned)
       - Or assign a dummy port (won't be used, but won't hurt)
     - If Pterodactyl requires an allocation, set:
       - **Primary Allocation:** Any available port (e.g., 25565)
       - **IP Address:** Your node's IP
       - **Port:** Any port (25565, 3000, etc.) - it won't be used

## Step 3: Set Environment Variables

In the server creation form, set these variables:

| Variable | Value | Required |
|----------|-------|----------|
| `DISCORD_BOT_TOKEN` | Your Discord bot token | ✅ Yes |
| `DISCORD_CLIENT_ID` | Your Discord bot client ID | ❌ Optional |
| `DISCORD_GUILD_ID` | Your Discord server ID | ❌ Optional |
| `SUPABASE_URL` | `https://swoaybrkwzdjporuljaz.supabase.co` | ✅ Yes |
| `SUPABASE_ANON_KEY` | Your Supabase anon key | ✅ Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key | ✅ Yes |
| `NODE_ENV` | `production` | ✅ Yes |
| `AUTO_REBUILD` | `false` | ✅ Yes |
| `OPENAI_API_KEY` | OpenAI API key (for `!id` command) | ❌ No (optional) |

**Important:** 
- Mark `DISCORD_BOT_TOKEN`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` as **hidden** (they won't be visible to users)
- Use the exact Supabase URL provided above

## Step 4: Upload Your Code

### Option A: Using Git (Recommended)

1. **Get Your Repository URL**
   - Your repo: `https://github.com/ProstidudeTTV/growlogger.git`
   - Branch: `main`

2. **In Pterodactyl Server**
   - Go to your server → **File Manager**
   - Click **Git Pull** tab
   - Enter repository URL: `https://github.com/ProstidudeTTV/growlogger.git`
   - Branch: `main`
   - Click **Pull Files**

3. **For Private Repositories**
   - Go to **Admin Panel** → **Application Settings** → **Advanced**
   - Add SSH key or Git credentials
   - Or use a Personal Access Token in the URL: `https://USERNAME:TOKEN@github.com/ProstidudeTTV/growlogger.git`

### Option B: Upload Files Manually

1. **Go to Server → File Manager**
2. **Upload all files** from your project:
   - `package.json`
   - `tsconfig.json`
   - `src/` directory
   - `supabase/` directory (if needed)
   - Any other required files
3. **Make sure the structure matches your local project**

## Step 5: Install and Start

1. **Install Dependencies and Build**
   - Go to **Server → Startup**
   - Click **Reinstall Server**
   - This will run the installation script:
     - `npm install`
     - `npm run build`
   - Wait for installation to complete

2. **Start the Server**
   - Click **Start** button
   - Watch the console logs
   - You should see:
     ```
     ✅ Bot is ready! Logged in as YourBot#1234
     📅 Scheduled tasks configured:
        - Daily prompts: 9:00 AM
     ```

## Step 6: Verify It's Working

1. **Check Logs**
   - Go to **Console** tab
   - Look for "Bot is ready!" message
   - No error messages should appear

2. **Test in Discord**
   - Go to your Discord server
   - Try `!help` command
   - Bot should respond with command list

## Updating the Bot

### Method 1: Git Pull (Recommended)

1. Go to **File Manager** → **Git Pull** tab
2. Click **Pull Files**
3. Go to **Startup** → **Reinstall Server** (to rebuild)
4. Restart the server

### Method 2: Manual Upload

1. Upload new files via **File Manager**
2. Go to **Startup** → **Reinstall Server**
3. Restart the server

### Method 3: Quick Rebuild

If you have `AUTO_REBUILD=true`:
1. Pull/upload new files
2. Simply restart the server (it will auto-rebuild)

## Port and IP Configuration

### ⚠️ Important: Discord Bots Don't Need Ports

**Discord bots work differently than game servers:**

- **Game Servers:** Listen on ports (incoming connections)
- **Discord Bots:** Connect outbound to Discord's API (no incoming connections)

**What this means for Pterodactyl:**

1. **No Port Required:** Your bot doesn't need any ports assigned
2. **Optional Allocation:** If Pterodactyl requires an allocation, you can:
   - Set **any available port** (it won't be used)
   - Common choices: `25565`, `3000`, `8080`, etc.
   - The bot will still work regardless of the port number

3. **IP Address:** 
   - Use your node's default IP address
   - The bot connects to Discord via HTTPS/WebSocket, so it just needs internet access
   - No need to configure port forwarding

**In Pterodactyl Setup:**
- When creating the server, if asked for allocations:
  - **Primary Allocation:** Leave empty OR assign any port
  - **IP Address:** Your node's IP (usually auto-filled)
  - The bot will function the same either way

**Why this works:**
- Discord bots use Discord's Gateway (WebSocket) to receive events
- Commands are sent via HTTPS to Discord's REST API
- Both are **outbound connections** from your server to Discord
- No inbound port listening is required

## Troubleshooting

### Bot Won't Start

**Check:**
1. **Environment Variables**
   - Verify all required variables are set
   - Check for typos in tokens/keys

2. **Logs**
   - Check **Console** for error messages
   - Common errors:
     - "Invalid token" → Check DISCORD_BOT_TOKEN
     - "ECONNREFUSED" → Check Supabase URL
     - "Cannot find module" → Reinstall server

3. **Build Issues**
   - Check if `dist/` directory exists after installation
   - Verify `tsconfig.json` is present
   - Check Node.js version (needs 18+)

### "Module not found" Errors

1. Go to **Startup** → **Reinstall Server**
2. This will run `npm install` again
3. Make sure all files are uploaded correctly

### Build Fails

1. Check **Console** for TypeScript errors
2. Verify all source files are present
3. Check `tsconfig.json` configuration
4. Try installing locally first to debug

### Bot Keeps Crashing

1. Check **Resource Limits**
   - Increase memory if running out
   - Check disk space
2. Check **Logs** for specific error
3. Verify database connection (Supabase)
4. Check Discord bot permissions and intents

## Resource Recommendations

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| **CPU** | 50% (0.5 core) | 100% (1 core) |
| **Memory** | 512MB | 1024MB |
| **Disk** | 2048MB (2GB) | 4096MB (4GB) |
| **Block IO** | 500 | 500 |

## Security Notes

- Never share your Discord bot token
- Keep Supabase service role key secret
- Use Pterodactyl's variable system (hidden variables)
- Regularly update dependencies: `npm audit fix`

## Advanced Configuration

### Custom Docker Image

If you need a different Node.js version:
- Change `docker_image` in the egg to:
  - `ghcr.io/pterodactyl/yolks:nodejs_20` (for Node 20)
  - `ghcr.io/pterodactyl/yolks:nodejs_16` (for Node 16)

### Auto-Restart on Crash

Pterodactyl automatically restarts crashed servers if configured in:
- **Admin Panel** → **Nodes** → Your Node → **Settings**
- Enable "Auto-restart crashed servers"

### Logging

View logs in:
- **Console** tab (real-time)
- **File Manager** → Any log files you create

## Need Help?

- Check Pterodactyl documentation: https://pterodactyl.io/docs/
- Verify Discord bot setup in CONTEXT.md
- Check Supabase migrations are applied
- Review error logs in Console tab

Your bot should now be running on Pterodactyl! 🚀
