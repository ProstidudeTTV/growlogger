import {
  ChatInputCommandInteraction,
  Message,
  TextChannel,
  EmbedBuilder,
} from 'discord.js';
import { getStrainInfo, formatStrainInfo } from '../services/aiService.js';
import { createErrorEmbed, createInfoEmbed } from '../utils/embedBuilder.js';

/**
 * Handle !id command - Get AI-powered information about a cannabis strain
 */
export async function handleIdCommand(
  interaction: ChatInputCommandInteraction | Message,
  userId: string
): Promise<void> {
  const channel = interaction.channel as TextChannel;
  if (!channel) return;

  // Extract strain name from message
  let strainName: string;
  
  if (interaction instanceof Message) {
    // Message format: !id <strain name>
    const content = interaction.content.trim();
    const parts = content.split(/\s+/);
    
    if (parts.length < 2) {
      await channel.send({
        embeds: [createErrorEmbed('Please provide a strain name!\n\n**Usage:** `!id <strain name>`\n**Example:** `!id Blue Dream`')],
      });
      return;
    }
    
    strainName = parts.slice(1).join(' ');
  } else {
    // Slash command format (for future use)
    strainName = interaction.options.getString('strain', true);
  }

  // Show loading message with note about potential delay
  const loadingEmbed = createInfoEmbed(
    '🔍 Searching for Strain Information...',
    `Looking up information about **${strainName}**...\n\n⏱️ *This may take 10-30 seconds depending on your AI setup*`
  );

  const loadingMessage = await channel.send({ embeds: [loadingEmbed] });

  try {
    // Fetch strain information from AI
    const strainInfo = await getStrainInfo(strainName);
    const formattedInfo = formatStrainInfo(strainName, strainInfo);

    // Delete loading message
    await loadingMessage.delete().catch(() => {
      // Ignore if message was already deleted
    });

    // Send embeds (may be multiple if content is long)
    const embeds = formattedInfo.embeds.map((embedData: any) => {
      const embed = new EmbedBuilder()
        .setTitle(embedData.title)
        .setColor(embedData.color)
        .setFooter(embedData.footer);
      
      // Set timestamp only if it exists and is valid
      if (embedData.timestamp) {
        try {
          // Convert ISO string to Date if needed, or use Date directly
          const timestamp = typeof embedData.timestamp === 'string' 
            ? new Date(embedData.timestamp) 
            : embedData.timestamp;
          embed.setTimestamp(timestamp);
        } catch (error) {
          // If timestamp is invalid, just use current date
          embed.setTimestamp();
        }
      } else {
        embed.setTimestamp();
      }
      
      if (embedData.description) {
        embed.setDescription(embedData.description);
      }
      
      if (embedData.fields && embedData.fields.length > 0) {
        embed.addFields(embedData.fields);
      }
      
      return embed;
    });

    // Discord allows up to 10 embeds per message
    const maxEmbedsPerMessage = 10;
    for (let i = 0; i < embeds.length; i += maxEmbedsPerMessage) {
      const embedsChunk = embeds.slice(i, i + maxEmbedsPerMessage);
      await channel.send({ embeds: embedsChunk });
    }
  } catch (error) {
    console.error('Error in handleIdCommand:', error);

    // Delete loading message
    await loadingMessage.delete().catch(() => {
      // Ignore if message was already deleted
    });

    // Send error message
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'An unknown error occurred while fetching strain information.';

    await channel.send({
      embeds: [createErrorEmbed(
        `Failed to fetch information about **${strainName}**:\n\n${errorMessage}\n\n**Note:** Make sure OPENAI_API_KEY is set (for OpenAI) or OPENAI_API_URL is set to your Ollama instance (e.g., http://192.168.1.160:11434/v1/chat/completions).`
      )],
    });
  }
}
