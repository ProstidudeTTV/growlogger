import {
  ChatInputCommandInteraction,
  Message,
  TextChannel,
  EmbedBuilder,
  ColorResolvable,
} from 'discord.js';

/**
 * Create help embed with all commands and features
 */
function createHelpEmbed(): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setTitle('🌱 Cannabis Grow Tracker Bot - Help')
    .setDescription('A comprehensive guide to all bot commands and features')
    .setColor(0x00ff00 as ColorResolvable)
    .setTimestamp();

  embed.addFields(
    {
      name: '📋 Commands',
      value: 'All commands use the `!` prefix',
      inline: false,
    },
    {
      name: '🌱 !startgrow',
      value: 'Start tracking a new cannabis grow. The bot will prompt you for:\n' +
        '• Start date (XX/XX/XXXX format)\n' +
        '• Strain name\n' +
        '• Germination method\n' +
        '• Pot size\n\n' +
        '**Example:** `!startgrow`\n\n' +
        'You can have up to 20 ongoing (non-harvested) grows at a time.',
      inline: false,
    },
    {
      name: '🌸 !flower',
      value: 'Mark your active grow as entering the flower stage. The bot will:\n' +
        '• Start a flower timer\n' +
        '• Prompt for terpene smell description\n' +
        '• Prompt for flower development details\n\n' +
        '**Example:** `!flower`\n\n' +
        'Only works if you have an active (non-harvested) grow.',
      inline: false,
    },
    {
      name: '✅ !harvest',
      value: 'Harvest your active grow. This will:\n' +
        '• Stop the grow log\n' +
        '• Stop daily prompts for this grow\n' +
        '• Stop the timer\n' +
        '• Mark the grow as harvested with today\'s date\n\n' +
        '**Example:** `!harvest`\n\n' +
        'After harvesting, use `!results` to record your harvest data.',
      inline: false,
    },
    {
      name: '📊 !results',
      value: 'Record harvest results for your most recently harvested grow. The bot will prompt for:\n' +
        '• Wet weight (in grams)\n' +
        '• Dry weight (in grams, or type "skip")\n' +
        '• Harvest notes (or type "skip")\n\n' +
        '**Example:** `!results`\n\n' +
        'You can update results multiple times if needed. Only works after using `!harvest`.',
      inline: false,
    },
    {
      name: '🧬 !id',
      value: 'Get AI-powered information about a specific cannabis strain. The bot will provide details about:\n' +
        '• Strain type (Indica, Sativa, Hybrid) and genetics\n' +
        '• THC/CBD content\n' +
        '• Effects and medicinal benefits\n' +
        '• Aromas, flavors, and terpenes\n' +
        '• Growing information (flowering time, yield, difficulty)\n\n' +
        '**Usage:** `!id <strain name>`\n' +
        '**Example:** `!id Blue Dream` or `!id OG Kush`\n\n' +
        'Requires OpenAI API key or Ollama instance to be configured.',
      inline: false,
    },
    {
      name: '🌿 !ask',
      value: 'Ask any cannabis-related question and get expert AI advice. You can:\n' +
        '• Ask questions about growing, nutrients, problems, etc.\n' +
        '• Attach images to help identify plant problems\n' +
        '• Get detailed troubleshooting and recommendations\n\n' +
        '**Usage:** `!ask <your question>`\n' +
        '**With images:** Attach images to your message along with your question\n\n' +
        '**Examples:**\n' +
        '• `!ask What nutrients should I use during flowering?`\n' +
        '• `!ask What\'s wrong with my plant?` (with image attached)\n' +
        '• `!ask How do I fix yellow leaves?` (with image attached)\n\n' +
        '**Note:** Image analysis works best with Gemini API. Text-only questions work with any AI provider.',
      inline: false,
    },
    {
      name: '📬 !prompt',
      value: 'Manually trigger your daily prompt if the scheduled notification didn\'t work. This command:\n' +
        '• Only works if you have an active grow\n' +
        '• Can only be used once per day\n' +
        '• Only works if you haven\'t completed today\'s update yet\n' +
        '• Sends the daily prompt to your DMs\n\n' +
        '**Example:** `!prompt`\n\n' +
        '**Use cases:**\n' +
        '• The 9 AM notification didn\'t arrive\n' +
        '• You missed the notification and want to catch up\n' +
        '• You want to complete your update at a different time\n\n' +
        '**Note:** If you\'ve already completed today\'s update, this command won\'t work.',
      inline: false,
    },
    {
      name: '❓ !help',
      value: 'Show this help message with all commands and features.',
      inline: false,
    },
    {
      name: '📅 Daily Features',
      value: '**Daily Prompts:**\n' +
        'You\'ll receive a DM at 9:00 AM daily if you have active (non-harvested) grows. The bot will prompt you for:\n' +
        '• Pictures (attach images or type "skip")\n' +
        '• Environment conditions\n' +
        '• Feeding schedule/nutrients\n' +
        '• Growth stage\n' +
        '• Plant health\n' +
        '• Additional notes\n\n' +
        '**Daily Summaries:**\n' +
        'After you complete your daily prompts, you\'ll immediately receive a summary with:\n' +
        '• Embedded grow information\n' +
        '• Days since start\n' +
        '• Days in flower (if applicable)\n' +
        '• All your update details and pictures',
      inline: false,
    },
    {
      name: '⏱️ Grow Timers',
      value: 'The bot automatically tracks:\n' +
        '• **Total grow time:** Days since your start date\n' +
        '• **Flower time:** Days since entering flower stage (if applicable)\n\n' +
        'These timers are shown in embeds and daily summaries.',
      inline: false,
    },
    {
      name: '📝 Date Format',
      value: 'All dates should be entered in **XX/XX/XXXX** format.\n' +
        '**Example:** `01/15/2024` (January 15th, 2024)',
      inline: false,
    },
    {
      name: '🔢 Grow Limits',
      value: 'You can track up to **20 ongoing (non-harvested) grows** at a time. Harvested grows don\'t count toward this limit.',
      inline: false,
    },
    {
      name: '💡 Tips',
      value: '• Type "skip" during any prompt step if you want to skip that field\n' +
        '• All commands are multi-step and remember your input\n' +
        '• You can update harvest results multiple times\n' +
        '• Daily prompts are sent via DM - make sure the bot can message you\n' +
        '• The conversation will be cleared after completing daily prompts',
      inline: false,
    }
  );

  return embed;
}

/**
 * Handle !help command
 */
export async function handleHelpCommand(
  interaction: ChatInputCommandInteraction | Message,
  userId: string
): Promise<void> {
  const channel = interaction.channel as TextChannel;
  if (!channel) return;

  try {
    await channel.send({
      embeds: [createHelpEmbed()],
    });
  } catch (error) {
    console.error('Error in handleHelpCommand:', error);
    await channel.send({
      content: 'An error occurred while displaying the help message.',
    });
  }
}
