# Setup Guide

Follow these steps to get your Cannabis Grow Tracker Discord Bot running:

## 1. Prerequisites

- Node.js 18+ installed
- A Discord Bot Application (get from https://discord.com/developers/applications)
- A Supabase project (create at https://supabase.com)

## 2. Install Dependencies

```bash
npm install
```

## 3. Set Up Discord Bot

1. Go to https://discord.com/developers/applications
2. Create a new application or select an existing one
3. Go to the "Bot" section
4. Click "Reset Token" and copy your bot token
5. Under "Privileged Gateway Intents", enable:
   - MESSAGE CONTENT INTENT (Required for reading message content)
6. Go to OAuth2 > URL Generator
7. Select scopes: `bot` and `applications.commands`
8. Select bot permissions: `Send Messages`, `Read Message History`, `Attach Files`
9. Copy the generated URL and invite the bot to your server

## 4. Set Up Supabase

1. Go to https://supabase.com and create a project
2. Go to Project Settings > API
3. Copy your:
   - Project URL
   - `anon` public key
   - `service_role` key (keep this secret!)
4. Go to SQL Editor
5. Run the migrations in order:
   - Copy and paste `supabase/migrations/001_create_grows_table.sql` and execute
   - Copy and paste `supabase/migrations/002_create_grow_updates_table.sql` and execute

## 5. Configure Environment Variables

Create a `.env` file in the root directory:

```env
DISCORD_BOT_TOKEN=your_discord_bot_token_here
DISCORD_CLIENT_ID=your_discord_client_id_here
DISCORD_GUILD_ID=your_discord_guild_id_here

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

NODE_ENV=development
```

## 6. Build and Run

### Development mode (with auto-reload):
```bash
npm run dev
```

### Production mode:
```bash
npm run build
npm start
```

## 7. Test the Bot

In your Discord server, try these commands:

- `!startgrow` - Start a new grow
- `!flower` - Mark a grow as entering flower stage
- `!harvest` - Harvest a grow
- `!results` - Record harvest results

## Troubleshooting

### Bot doesn't respond to commands
- Make sure MESSAGE CONTENT INTENT is enabled in Discord Developer Portal
- Check that the bot has permissions to read and send messages in the channel
- Verify your bot token is correct in `.env`

### Database errors
- Make sure you've run both migration files in Supabase
- Verify your Supabase URL and keys are correct
- Check that RLS policies are set up correctly (the migrations include them)

### Daily prompts not working
- The bot sends prompts at 9:00 AM daily
- Make sure the bot can send DMs to users
- Check console logs for any errors

## Important Notes

- The bot uses the Supabase service role key to bypass RLS policies - this is intentional for bot operations
- Keep your `.env` file secure and never commit it to version control
- Daily prompts are sent at 9:00 AM (server time where the bot is running)
- Users can have up to 20 ongoing (non-harvested) grows at a time
