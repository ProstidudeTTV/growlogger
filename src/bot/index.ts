import { Client, GatewayIntentBits, Events, Message, ChatInputCommandInteraction } from 'discord.js';
import { config } from '../config/index.js';
import cron from 'node-cron';
import { handleStartGrowCommand, handleStartGrowResponse } from '../commands/startgrow.js';
import { handleFlowerCommand, handleFlowerResponse } from '../commands/flower.js';
import { handleHarvestCommand } from '../commands/harvest.js';
import { handleResultsCommand, handleResultsResponse } from '../commands/results.js';
import { handleHelpCommand } from '../commands/help.js';
import { handleIdCommand } from '../commands/id.js';
import { handleAskCommand } from '../commands/ask.js';
import { handlePromptCommand } from '../commands/prompt.js';
import { sendDailyPrompts, handleDailyPromptResponse } from '../services/promptService.js';

// Create Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
});

// Bot ready event
client.once(Events.ClientReady, (readyClient) => {
  console.log(`✅ Bot is ready! Logged in as ${readyClient.user.tag}`);

  // Schedule daily prompts at 9 AM every day
  cron.schedule('0 9 * * *', () => {
    console.log('Sending daily prompts...');
    sendDailyPrompts(client).catch(console.error);
  });

  console.log('📅 Scheduled tasks configured:');
  console.log('   - Daily prompts: 9:00 AM');
});

// Handle message commands
client.on(Events.MessageCreate, async (message: Message) => {
  // Ignore bot messages
  if (message.author.bot) return;

  const content = message.content.trim();
  const userId = message.author.id;

  // Handle command prefix "!"
  if (content.startsWith('!')) {
    const command = content.split(/\s+/)[0].toLowerCase();

    try {
      switch (command) {
        case '!startgrow':
          await handleStartGrowCommand(message, userId);
          break;
        case '!flower':
          await handleFlowerCommand(message, userId);
          break;
        case '!harvest':
          await handleHarvestCommand(message, userId);
          break;
        case '!results':
          await handleResultsCommand(message, userId);
          break;
        case '!help':
          await handleHelpCommand(message, userId);
          break;
        case '!id':
          await handleIdCommand(message, userId);
          break;
        case '!ask':
          await handleAskCommand(message, userId);
          break;
        case '!prompt':
          await handlePromptCommand(message, userId);
          break;
        default:
          // Not a recognized command, might be a response to a multi-step command
          // Let command handlers check if they're expecting input
          break;
      }
    } catch (error) {
      console.error('Error handling command:', error);
    }
  }

  // Handle multi-step command responses
  // Check if user is in a state waiting for input
  try {
    const handled =
      await handleStartGrowResponse(message, userId, content) ||
      await handleFlowerResponse(message, userId, content) ||
      await handleResultsResponse(message, userId, content) ||
      await handleDailyPromptResponse(message, userId, content, Array.from(message.attachments.values()));

    // If not handled by command responses, continue normally
  } catch (error) {
    console.error('Error handling command response:', error);
  }
});

// Handle slash commands (optional - for future use)
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const userId = interaction.user.id;
  const commandName = interaction.commandName;

  try {
    switch (commandName) {
      case 'startgrow':
        await handleStartGrowCommand(interaction as ChatInputCommandInteraction, userId);
        break;
      case 'flower':
        await handleFlowerCommand(interaction as ChatInputCommandInteraction, userId);
        break;
      case 'harvest':
        await handleHarvestCommand(interaction as ChatInputCommandInteraction, userId);
        break;
      case 'results':
        await handleResultsCommand(interaction as ChatInputCommandInteraction, userId);
        break;
      case 'help':
        await handleHelpCommand(interaction as ChatInputCommandInteraction, userId);
        break;
      case 'id':
        await handleIdCommand(interaction as ChatInputCommandInteraction, userId);
        break;
      default:
        await interaction.reply({ content: 'Unknown command!', ephemeral: true });
    }
  } catch (error) {
    console.error('Error handling slash command:', error);
    if (interaction.isRepliable()) {
      await interaction.reply({ content: 'An error occurred while executing the command.', ephemeral: true });
    }
  }
});

// Error handling
client.on(Events.Error, (error) => {
  console.error('Discord client error:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  process.exit(1);
});

// Login to Discord
client.login(config.discord.token).catch((error) => {
  console.error('Failed to login:', error);
  process.exit(1);
});
