# Portainer Setup Guide

This guide explains how to deploy the Cannabis Grow Tracker Discord Bot using Portainer.

## Prerequisites

- Portainer installed (CE or Business)
- Docker and Docker Compose installed on your server
- Git repository access or files uploaded to server

## Option 1: Deploy via Portainer UI (Stack)

### 1. Prepare Your Files

Make sure you have:
- `Dockerfile`
- `docker-compose.yml` or `docker-compose.prod.yml`
- Your code (or GitHub repository)

### 2. In Portainer Dashboard

1. **Navigate to Stacks**
   - Click "Stacks" in the left sidebar
   - Click "Add stack"

2. **Configure Stack**
   - **Name:** `cannabis-grow-tracker-bot`
   - **Build method:** 
     - **Option A (Git Repository):** 
       - Select "Repository"
       - Enter your Git repository URL
       - Branch: `main` (or your default branch)
       - Compose path: `docker-compose.yml`
     - **Option B (Upload Files):**
       - Select "Web editor"
       - Upload your files or paste docker-compose.yml content

3. **Set Environment Variables**
   Click "Advanced mode" and add these environment variables:
   ```
   DISCORD_BOT_TOKEN=your_discord_bot_token
   DISCORD_CLIENT_ID=your_discord_client_id
   DISCORD_GUILD_ID=your_discord_guild_id
   SUPABASE_URL=https://swoaybrkwzdjporuljaz.supabase.co
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   NODE_ENV=production
   ```

4. **Deploy Stack**
   - Click "Deploy the stack"
   - Wait for the build and deployment to complete

5. **Monitor**
   - Check logs in Portainer to verify the bot is running
   - Look for "Bot is ready! Logged in as..." message

## Option 2: Deploy via Portainer UI (Container)

### 1. Build Image First

1. Go to **Images** → **Build a new image**
2. **Build method:** Select "Git repository" or "Upload"
3. **Repository URL:** Your Git repository URL
4. **Reference:** `main` (or your branch)
5. **Dockerfile path:** `Dockerfile`
6. Click **Build the image**

### 2. Create Container

1. Go to **Containers** → **Add container**
2. **Name:** `cannabis-grow-tracker-bot`
3. **Image:** Select the image you just built
4. **Network:** Default bridge (or create custom)
5. **Restart policy:** Always
6. **Environment variables:** Add all required variables (see above)
7. Click **Deploy the container**

## Option 3: Deploy via SSH/Command Line

If you have SSH access to your server:

```bash
# Clone repository (if using Git)
git clone <your-repo-url>
cd cannabis-grow-tracker-discord-bot

# Create .env file with your variables
nano .env

# Deploy with Docker Compose
docker-compose up -d

# Check logs
docker-compose logs -f cannabis-bot
```

## Verifying Deployment

### Check Container Status

1. In Portainer, go to **Containers**
2. Find `cannabis-grow-tracker-bot`
3. Status should show "Running" (green)

### View Logs

1. Click on the container name
2. Go to **Logs** tab
3. Look for:
   ```
   ✅ Bot is ready! Logged in as YourBot#1234
   📅 Scheduled tasks configured:
      - Daily prompts: 9:00 AM
   ```

### Test Bot

1. Go to your Discord server
2. Try `!help` command
3. Bot should respond

## Updating the Bot

### Via Portainer UI

1. **If using Git repository:**
   - Go to **Stacks**
   - Click on your stack
   - Click **Editor** tab
   - Click **Pull and redeploy** (Portainer will pull latest code)

2. **If using uploaded files:**
   - Update files on server
   - Go to **Stacks** → Your stack
   - Click **Editor**
   - Click **Update the stack**

### Via Command Line

```bash
cd cannabis-grow-tracker-discord-bot
git pull  # If using Git
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## Environment Variables

Make sure these are set in Portainer:

| Variable | Description | Required |
|----------|-------------|----------|
| `DISCORD_BOT_TOKEN` | Your Discord bot token | Yes |
| `DISCORD_CLIENT_ID` | Your Discord bot client ID | Optional |
| `DISCORD_GUILD_ID` | Your Discord server ID | Optional |
| `SUPABASE_URL` | Your Supabase project URL | Yes |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Yes |
| `NODE_ENV` | Set to `production` | Recommended |

## Troubleshooting

### Bot Not Starting

1. **Check logs:** Portainer → Containers → Logs
2. **Verify environment variables:** Make sure all required vars are set
3. **Check Discord token:** Ensure token is correct and bot has proper intents
4. **Database connection:** Verify Supabase credentials

### Bot Keeps Restarting

1. Check logs for errors
2. Verify all environment variables are correct
3. Check if database migrations are applied

### Container Won't Start

1. Check Docker logs: `docker logs cannabis-grow-tracker-bot`
2. Verify Dockerfile is correct
3. Check disk space: `df -h`
4. Verify Node.js version (needs 18+)

## Health Checks

The container includes a basic health check. In Portainer:
- Go to **Containers** → Your container
- Health status should show "Healthy" after ~40 seconds

## Monitoring

### View Logs in Portainer

1. Navigate to **Containers**
2. Click on your container
3. Go to **Logs** tab
4. Use filters to search for errors

### Resource Usage

1. Go to **Containers** → Your container
2. View **Stats** tab for CPU/Memory usage

## Backup Considerations

- **Database:** Supabase handles backups automatically
- **Code:** Keep your Git repository up to date
- **Environment Variables:** Store securely (Portainer stores these)

## Security Notes

- Never commit `.env` file to Git
- Use Portainer's environment variable management
- Keep Docker and Portainer updated
- Use non-root user in container (already configured)
- Regularly update dependencies

## Next Steps

1. Deploy using one of the methods above
2. Verify bot is running and responsive
3. Test commands in Discord
4. Monitor logs for any issues
5. Set up automated backups if needed

Your bot should now be running 24/7! 🚀
