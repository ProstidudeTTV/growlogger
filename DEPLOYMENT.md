# Deployment Guide

This Discord bot needs to run continuously. Here are recommended deployment options:

## Recommended Deployment Options

### 1. Railway (Recommended - Easiest)
Railway is great for Discord bots with automatic deployments.

**Steps:**
1. Sign up at https://railway.app
2. Click "New Project" → "Deploy from GitHub repo"
3. Connect your GitHub repository
4. Add environment variables in Railway dashboard:
   - `DISCORD_BOT_TOKEN`
   - `DISCORD_CLIENT_ID`
   - `DISCORD_GUILD_ID`
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NODE_ENV=production`
5. Set start command: `npm start`
6. Railway will automatically build (`npm run build`) and deploy
7. Your bot will run 24/7

**Cost:** Free tier available, paid plans start at $5/month

### 2. Render
Render offers free tier with automatic deploys from GitHub.

**Steps:**
1. Sign up at https://render.com
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name:** cannabis-grow-tracker-bot
   - **Environment:** Node
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Plan:** Free or paid
5. Add environment variables in the dashboard
6. Deploy!

**Cost:** Free tier (spins down after 15min inactivity), paid plans from $7/month for always-on

### 3. DigitalOcean App Platform
Great for production deployments with good reliability.

**Steps:**
1. Sign up at https://www.digitalocean.com
2. Go to App Platform
3. Create new app from GitHub
4. Configure:
   - Build command: `npm run build`
   - Run command: `npm start`
5. Add environment variables
6. Deploy!

**Cost:** ~$5-12/month for always-on

### 4. VPS (DigitalOcean Droplet, Linode, etc.)
Full control, good for advanced users.

**Steps:**
1. Create a VPS instance (Ubuntu recommended)
2. SSH into the server
3. Install Node.js 18+:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```
4. Clone your repository
5. Install dependencies: `npm install`
6. Build: `npm run build`
7. Set up environment variables
8. Use PM2 to keep the bot running:
   ```bash
   npm install -g pm2
   pm2 start dist/bot/index.js --name cannabis-bot
   pm2 save
   pm2 startup  # Follow instructions to enable auto-start on boot
   ```

**Cost:** ~$5-10/month

## Deployment Checklist

Before deploying:

- [ ] Build the project locally: `npm run build`
- [ ] Test that `npm start` works locally
- [ ] Ensure all environment variables are set correctly
- [ ] Database migrations are applied in Supabase
- [ ] Discord bot has MESSAGE CONTENT INTENT enabled
- [ ] Bot is invited to your server with proper permissions

## Environment Variables for Production

Make sure to set these in your deployment platform:

```env
DISCORD_BOT_TOKEN=your_discord_bot_token_here
DISCORD_CLIENT_ID=your_discord_client_id_here
DISCORD_GUILD_ID=your_discord_guild_id_here

SUPABASE_URL=https://swoaybrkwzdjporuljaz.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

NODE_ENV=production
```

## Keep Bot Running (PM2 Alternative)

If using a VPS and PM2 isn't an option, use `screen` or `tmux`:

```bash
# Install screen
sudo apt-get install screen

# Start bot in screen session
screen -S cannabis-bot
npm start

# Detach: Press Ctrl+A then D
# Reattach: screen -r cannabis-bot
```

Or use systemd service (Linux):

Create `/etc/systemd/system/cannabis-bot.service`:
```ini
[Unit]
Description=Cannabis Grow Tracker Discord Bot
After=network.target

[Service]
Type=simple
User=your-username
WorkingDirectory=/path/to/cannabis-grow-tracker-discord-bot
ExecStart=/usr/bin/node dist/bot/index.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Then:
```bash
sudo systemctl enable cannabis-bot
sudo systemctl start cannabis-bot
sudo systemctl status cannabis-bot
```

## Monitoring

For production, consider:
- Setting up health checks
- Monitoring logs
- Error tracking (Sentry, etc.)
- Uptime monitoring

## Quick Start: Railway (Easiest)

1. Push your code to GitHub
2. Go to https://railway.app
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Add environment variables
6. Railway auto-deploys on every push!

Your bot will be live 24/7 automatically.
