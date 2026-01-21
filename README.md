# Cannabis Grow Tracker Discord Bot

A Discord bot built with discord.js and Supabase to help users track their cannabis grows with commands, daily prompts, timers, and embedded summaries.

## Features

- 🌱 **Create New Grow**: Start tracking a new grow with `!startgrow` command
- 🌸 **Flower Stage**: Mark when plants enter flower stage with `!flower` command
- ✅ **Harvest**: Stop grow tracking with `!harvest` command
- 📊 **Results**: Record harvest results (wet weight, dry weight, notes) with `!results` command
- 📅 **Daily Prompts**: Receive daily prompts to update grow information
- 📸 **Daily Summaries**: Get embedded summaries with pictures and grow statistics
- ⏱️ **Grow Timers**: Automatic timer calculations from start date
- 🔢 **Grow Limits**: Track up to 20 ongoing grows per user

## Tech Stack

- **discord.js**: Discord bot framework
- **TypeScript**: Type-safe JavaScript
- **Supabase**: PostgreSQL database and API layer
- **node-cron**: Scheduled tasks for daily prompts and summaries

## Prerequisites

- Node.js 18+ 
- A Discord Bot Application (get token from https://discord.com/developers/applications)
- A Supabase project (create at https://supabase.com)

## Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd cannabis-grow-tracker-discord-bot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   DISCORD_BOT_TOKEN=your_discord_bot_token_here
   DISCORD_CLIENT_ID=your_discord_client_id_here
   DISCORD_GUILD_ID=your_discord_guild_id_here
   
   SUPABASE_URL=your_supabase_project_url_here
   SUPABASE_ANON_KEY=your_supabase_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
   
   NODE_ENV=development
   ```

4. **Set up Supabase database**
   Run the migrations in `supabase/migrations/`:
   - `001_create_grows_table.sql`
   - `002_create_grow_updates_table.sql`
   
   You can apply these through the Supabase dashboard SQL editor or using the Supabase CLI.

5. **Build the project**
   ```bash
   npm run build
   ```

6. **Start the bot**
   ```bash
   npm start
   ```
   
   Or for development with auto-reload:
   ```bash
   npm run dev
   ```

## Usage

### Commands

- `!startgrow` - Start tracking a new grow (prompts for start date, strain, germination method, pot size)
- `!flower` - Mark the grow as entering flower stage (prompts for terpene smell and flower development)
- `!harvest` - Harvest the grow and stop tracking
- `!results` - Record harvest results (wet weight, dry weight, notes)

### Daily Features

- **Daily Prompts**: Sent at 9:00 AM daily to users with active grows via DM
- **Daily Summaries**: Generated and sent immediately when a user completes their daily prompt responses, including embedded information and pictures

### Date Format

All dates should be entered in `XX/XX/XXXX` format (e.g., `01/15/2024`).

## Project Structure

```
src/
  bot/
    index.ts           # Main bot entry point
  commands/
    startgrow.ts       # Start grow command handler
    flower.ts          # Flower stage command handler
    harvest.ts         # Harvest command handler
    results.ts         # Results command handler
  services/
    supabase.ts        # Supabase client setup
    growService.ts     # Database operations for grows
    userStateService.ts # Multi-step command state management
    promptService.ts   # Daily prompts service
    summaryService.ts  # Daily summaries service
  utils/
    dateUtils.ts       # Date parsing and formatting utilities
    embedBuilder.ts    # Discord embed builders
    validation.ts      # Input validation utilities
  config/
    index.ts           # Configuration management
  types/
    grow.ts            # TypeScript type definitions

supabase/
  migrations/          # Database migration files
```

## Development

- `npm run dev` - Run in development mode with auto-reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Run the built bot
- `npm run lint` - Run ESLint

## License

Private project
"# growlogger" 
