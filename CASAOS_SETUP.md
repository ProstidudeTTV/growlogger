# CasaOS Deployment Guide

This guide will help you deploy the Cannabis Grow Tracker Discord Bot on your CasaOS box using the App Store.

## Prerequisites

Before you begin, make sure you have:

- ✅ CasaOS installed and running on your home server
- ✅ Access to the CasaOS web interface
- ✅ Discord bot token and credentials (from Discord Developer Portal)
- ✅ Supabase project URL and API keys
- ✅ AI API key (Gemini recommended - free) or Ollama instance
- ✅ Git repository access (or the bot files on your CasaOS box)

## Step 1: Prepare Your Bot Files

You have two options:

### Option A: Deploy from Git Repository (Recommended)

1. Make sure your bot code is in a Git repository (GitHub, GitLab, etc.)
2. Note the repository URL - you'll need it for CasaOS

### Option B: Upload Files Directly

1. Copy all bot files to your CasaOS box
2. Place them in a directory accessible to CasaOS (e.g., `/DATA/AppData/cannabis-bot/`)

## Step 2: Access CasaOS App Store

1. Open your web browser and navigate to your CasaOS interface (usually `http://your-casaos-ip:80` or the domain you configured)
2. Log in to CasaOS
3. Navigate to **App Store** or **Apps** section

## Step 3: Import the App Manifest

### Method 1: Using CasaOS App Store Import

1. In CasaOS, look for an **"Import"** or **"Add App"** button
2. Click it and select **"Import from JSON"** or **"Custom App"**
3. Upload the `casaos-app.json` file from this repository
4. CasaOS will parse the manifest and show you the app configuration

### Method 2: Using Docker Compose Directly

If CasaOS doesn't support JSON import, you can use Docker Compose:

1. In CasaOS, go to **Containers** or **Docker** section
2. Look for **"Compose"** or **"Stack"** option
3. Create a new stack named `cannabis-bot`
4. Copy the contents of `docker-compose.prod.yml` into the compose editor
5. Make sure the build context points to your bot files directory

## Step 4: Configure Environment Variables

After importing the app, CasaOS will show you a configuration screen with all the environment variables. Fill in the following:

### Required Discord Configuration

- **DISCORD_BOT_TOKEN**: Your Discord bot token
  - Get it from: https://discord.com/developers/applications
  - Select your bot → Bot → Reset Token (if needed)
  - ⚠️ Keep this secret!

- **DISCORD_CLIENT_ID**: Your bot's Client ID
  - Found in: Discord Developer Portal → OAuth2 → Client ID

- **DISCORD_GUILD_ID**: Your Discord server ID
  - Enable Developer Mode in Discord
  - Right-click your server → Copy Server ID

### Required Supabase Configuration

- **SUPABASE_URL**: Your Supabase project URL
  - Format: `https://xxxxx.supabase.co`
  - Found in: Supabase Dashboard → Project Settings → API

- **SUPABASE_ANON_KEY**: Your Supabase anonymous key
  - Found in: Supabase Dashboard → Project Settings → API → Project API keys → `anon` `public`

- **SUPABASE_SERVICE_ROLE_KEY**: Your Supabase service role key
  - Found in: Supabase Dashboard → Project Settings → API → Project API keys → `service_role` `secret`
  - ⚠️ Keep this secret!

### AI Configuration (Choose One)

#### Option 1: Google Gemini (Free - Recommended)

- **AI_PROVIDER**: `gemini`
- **GEMINI_API_KEY**: Your Gemini API key
  - Get it free at: https://makersuite.google.com/app/apikey
  - Create a new API key and copy it
- **OPENAI_MODEL**: `gemini-1.5-flash` (fast) or `gemini-1.5-pro` (more capable)

#### Option 2: OpenAI (Paid)

- **AI_PROVIDER**: `openai`
- **OPENAI_API_KEY**: Your OpenAI API key
  - Get it from: https://platform.openai.com/api-keys
- **OPENAI_MODEL**: `gpt-3.5-turbo` or `gpt-4`

#### Option 3: Ollama (Self-Hosted)

- **AI_PROVIDER**: `ollama`
- **OPENAI_API_URL**: Your Ollama instance URL
  - Format: `http://192.168.1.160:11434/api/generate`
  - Replace with your Ollama server IP
- **OPENAI_MODEL**: Model name (e.g., `llama3`, `llama2`)
  - Make sure the model is installed on your Ollama server: `ollama pull llama3`

### Optional Configuration

- **NODE_ENV**: Set to `production` (already configured in the manifest)

## Step 5: Configure Build Context (If Using Docker Compose)

If you're using Docker Compose directly:

1. Set the **build context** to the directory containing your bot files
2. Make sure the `Dockerfile` is in that directory
3. CasaOS will build the Docker image automatically

## Step 6: Deploy the Bot

1. Review all your environment variables
2. Click **"Deploy"** or **"Start"** button
3. CasaOS will:
   - Build the Docker image (if using build context)
   - Create the container
   - Start the bot

## Step 7: Verify Deployment

1. Check the container status in CasaOS - it should show as **"Running"**
2. View the logs to ensure the bot started successfully:
   - Click on the container
   - Go to **"Logs"** tab
   - You should see: `Bot is ready!` or similar success message
3. Test the bot in Discord:
   - Go to your Discord server
   - Type `!help` - the bot should respond

## Step 8: Monitor and Maintain

### Viewing Logs

- In CasaOS, click on the `cannabis-grow-tracker-bot` container
- Navigate to the **Logs** tab
- You can filter logs or download them

### Updating the Bot

1. **If using Git repository:**
   - Pull the latest changes to your bot files directory
   - In CasaOS, restart the container or rebuild the stack

2. **If using uploaded files:**
   - Update the files on your CasaOS box
   - Restart the container in CasaOS

### Restarting the Bot

- In CasaOS, find the container
- Click **"Restart"** button
- The bot will reconnect to Discord automatically

## Troubleshooting

### Bot Not Starting

1. **Check logs** in CasaOS for error messages
2. **Verify environment variables** are set correctly
3. **Check Discord bot token** - make sure it's valid and not expired
4. **Verify Supabase credentials** - test them in Supabase dashboard

### Bot Not Responding in Discord

1. **Check if bot is online** - look for the bot in your Discord server member list
2. **Verify bot has permissions:**
   - Bot needs "Send Messages" permission
   - Bot needs "Read Message History" permission
   - Bot needs "Message Content Intent" enabled in Discord Developer Portal
3. **Check logs** for error messages
4. **Verify GUILD_ID** matches your Discord server ID

### AI Commands Not Working

1. **Check AI_PROVIDER** is set correctly (`gemini`, `openai`, or `ollama`)
2. **Verify API keys** are correct:
   - For Gemini: Check at https://makersuite.google.com/app/apikey
   - For OpenAI: Check at https://platform.openai.com/api-keys
   - For Ollama: Make sure the server is accessible and model is installed
3. **Check OPENAI_MODEL** matches an available model
4. **View logs** for specific AI API errors

### Database Connection Issues

1. **Verify SUPABASE_URL** is correct (should start with `https://`)
2. **Check SUPABASE_ANON_KEY** and **SUPABASE_SERVICE_ROLE_KEY** are valid
3. **Test Supabase connection** in Supabase dashboard
4. **Check if migrations are applied** - run migrations in Supabase SQL editor if needed

### Container Keeps Restarting

1. **Check logs** for the error causing the restart
2. **Verify all required environment variables** are set
3. **Check resource limits** - make sure CasaOS has enough CPU/memory allocated
4. **Review health check** - the bot might be failing health checks

## Advanced Configuration

### Custom Build Context

If you need to build from a specific directory:

1. In CasaOS Docker Compose editor, modify the `build.context` path
2. Ensure the path is accessible to CasaOS/Docker
3. Rebuild the container

### Volume Mounts (Optional)

To persist logs or data:

1. Add volume mounts in the Docker Compose configuration:
   ```yaml
   volumes:
     - ./logs:/app/logs
   ```
2. Create the `logs` directory on your CasaOS box
3. Restart the container

### Network Configuration

The bot uses a bridge network by default. If you need custom networking:

1. Modify the `networks` section in Docker Compose
2. Ensure the network allows outbound connections (for Discord, Supabase, AI APIs)

## Security Notes

- ⚠️ **Never commit** your `.env` file or environment variables to Git
- ⚠️ **Keep API keys secret** - use CasaOS's masked environment variable feature
- ⚠️ **Use service role key carefully** - it has admin access to your Supabase database
- ✅ **Enable firewall rules** if exposing any ports (not needed for Discord bot)
- ✅ **Keep CasaOS updated** for security patches

## Support

If you encounter issues:

1. Check the logs in CasaOS
2. Review this troubleshooting guide
3. Check the main [README.md](README.md) and [DEPLOYMENT.md](DEPLOYMENT.md) files
4. Verify all prerequisites are met
5. Check Discord bot permissions and intents

## Next Steps

After successful deployment:

1. Test all bot commands: `!help`, `!startgrow`, `!id`, `!ask`, `!prompt`
2. Set up your first grow with `!startgrow`
3. Configure daily prompts (they run automatically at 9 AM)
4. Enjoy tracking your cannabis grows!

---

**Note**: This bot requires 24/7 uptime to function properly (for daily prompts and Discord connectivity). Make sure your CasaOS box stays online and the container is set to auto-restart.
