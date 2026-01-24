# Deploy Cannabis Grow Tracker Bot on Render

This guide will help you deploy the Discord bot on Render as a background worker.

## Prerequisites

- A GitHub account with your bot repository
- A Render account (sign up at https://render.com - free tier available)
- Discord bot token, client ID, and guild ID
- Supabase project URL and API keys
- AI provider API key (Gemini recommended for free tier)

## Step 1: Prepare Your Repository

1. **Push your code to GitHub** (if not already done):
   ```bash
   git add .
   git commit -m "Add Render deployment configuration"
   git push origin main
   ```

2. **Verify your repository is public or connected to Render:**
   - Render can connect to private repos, but you'll need to authorize it
   - Public repos work immediately

## Step 2: Create a Render Account

1. Go to https://render.com
2. Sign up with GitHub (recommended for easy repo access)
3. Verify your email if required

## Step 3: Deploy Using render.yaml (Recommended)

### Option A: Automatic Deployment from render.yaml

1. **In Render Dashboard:**
   - Click **"New +"** → **"Blueprint"**
   - Connect your GitHub repository
   - Select the repository: `growlogger` (or your repo name)
   - Render will automatically detect `render.yaml` and create the service

2. **Configure Environment Variables:**
   - Render will show you a list of environment variables from `render.yaml`
   - Fill in all the required values (see Step 4 below)
   - Variables marked `sync: false` need to be set manually

3. **Review and Deploy:**
   - Review the service configuration
   - Click **"Apply"** or **"Create"**
   - Render will start building and deploying your bot

### Option B: Manual Service Creation

If you prefer to create the service manually:

1. **In Render Dashboard:**
   - Click **"New +"** → **"Background Worker"**
   - Name: `cannabis-grow-tracker-bot`

2. **Connect Repository:**
   - Select **"Connect GitHub"** (or GitLab/Bitbucket)
   - Choose your repository
   - Branch: `main` (or your default branch)

3. **Build Settings:**
   - **Build Command:** `npm ci && npm run build`
   - **Start Command:** `npm start`
   - **Environment:** `Node`

4. **Plan Selection:**
   - **Free Plan:** 512 MB RAM, 0.1 CPU (sufficient for Discord bot)
   - **Starter Plan:** 512 MB RAM, 0.5 CPU ($7/month)
   - **Standard Plan:** 1 GB RAM, 1 CPU ($25/month)

5. **Environment Variables:**
   - Add all variables from Step 4 below

6. **Deploy:**
   - Click **"Create Background Worker"**
   - Render will start building and deploying

## Step 4: Configure Environment Variables

In Render, go to your service → **Environment** tab and add:

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

#### Option 3: Ollama (Self-Hosted - Not Recommended for Render)

⚠️ **Note:** Ollama requires a self-hosted server. If you have an Ollama instance accessible from the internet:

- **AI_PROVIDER**: `ollama`
- **OPENAI_API_URL**: Your Ollama instance URL
  - Format: `http://your-ollama-ip:11434/api/generate`
  - Must be accessible from Render's servers (public IP or tunnel)
- **OPENAI_MODEL**: Model name (e.g., `llama3`, `llama2`)
  - Make sure the model is installed on your Ollama server

### Optional Configuration

- **NODE_ENV**: Set to `production` (already configured in render.yaml)

## Step 5: Monitor Deployment

1. **Watch the Build Logs:**
   - Go to your service in Render Dashboard
   - Click **"Logs"** tab
   - Watch for build progress and any errors

2. **Check Deployment Status:**
   - Green status = deployed successfully
   - Yellow status = building/deploying
   - Red status = error (check logs)

3. **Verify Bot is Running:**
   - Check Render logs for: `✅ Bot is ready! Logged in as [BotName]`
   - Test in Discord with `!help` command

## Step 6: Auto-Deploy on Git Push (Default)

Render automatically deploys when you push to your connected branch:

1. **Make changes to your code**
2. **Commit and push:**
   ```bash
   git add .
   git commit -m "Your changes"
   git push origin main
   ```
3. **Render will automatically:**
   - Detect the push
   - Start a new build
   - Deploy the updated bot

## Troubleshooting

### Bot Not Starting

1. **Check Logs:**
   - Go to Render Dashboard → Your Service → Logs
   - Look for error messages

2. **Common Issues:**
   - **"Missing environment variable"**: Add all required env vars
   - **"Build failed"**: Check build logs for TypeScript errors
   - **"Bot token invalid"**: Verify DISCORD_BOT_TOKEN is correct
   - **"Cannot connect to Discord"**: Check network/firewall settings

### Bot Goes Offline

1. **Check Service Status:**
   - Render Dashboard → Your Service
   - Status should be "Live"

2. **Free Tier Limitations:**
   - Free tier services sleep after 15 minutes of inactivity
   - Discord bots stay connected, so this shouldn't be an issue
   - If it does sleep, it will wake on the next request

3. **Check Logs:**
   - Look for crash errors or connection issues

### Build Errors

1. **TypeScript Errors:**
   - Fix any TypeScript compilation errors
   - Run `npm run build` locally to test

2. **Missing Dependencies:**
   - Ensure `package.json` has all required dependencies
   - Check `package-lock.json` is committed

3. **Node Version:**
   - Render uses Node 18 by default (compatible with your bot)
   - If needed, specify in `package.json`:
     ```json
     "engines": {
       "node": "18.x"
     }
     ```

### Environment Variable Issues

1. **Variable Not Set:**
   - Double-check variable names (case-sensitive)
   - Ensure all required variables are added

2. **Invalid Values:**
   - Verify API keys are correct
   - Check for extra spaces or quotes

## Render Plans Comparison

| Plan | RAM | CPU | Price | Best For |
|------|-----|-----|-------|----------|
| Free | 512 MB | 0.1 | Free | Testing, low traffic |
| Starter | 512 MB | 0.5 | $7/mo | Small servers, moderate traffic |
| Standard | 1 GB | 1 | $25/mo | Production, higher traffic |

**Recommendation:** Start with **Free** tier for testing, upgrade to **Starter** for production.

## Security Notes

- ✅ All sensitive keys are stored securely in Render's environment variables
- ✅ Never commit `.env` files or API keys to Git
- ✅ Use Render's secret management (automatic for env vars)
- ✅ Rotate API keys regularly

## Support

- **Render Docs:** https://render.com/docs
- **Render Support:** https://render.com/support
- **Discord Bot Issues:** Check bot logs in Render Dashboard

## Next Steps

After deployment:

1. ✅ Test all bot commands in Discord
2. ✅ Verify daily prompts are scheduled (check logs at 9 AM)
3. ✅ Test AI features (`!id` and `!ask` commands)
4. ✅ Monitor logs for any errors
5. ✅ Set up alerts in Render (optional)

Your bot should now be running 24/7 on Render! 🎉
