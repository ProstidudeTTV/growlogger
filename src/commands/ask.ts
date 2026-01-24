import {
  ChatInputCommandInteraction,
  Message,
  TextChannel,
  EmbedBuilder,
  Attachment,
} from 'discord.js';
import { askCannabisQuestion } from '../services/aiService.js';
import { createErrorEmbed, createInfoEmbed } from '../utils/embedBuilder.js';

/**
 * Handle !ask command - Ask cannabis-related questions with optional image attachments
 */
export async function handleAskCommand(
  interaction: ChatInputCommandInteraction | Message,
  userId: string
): Promise<void> {
  const channel = interaction.channel as TextChannel;
  if (!channel) return;

  // Extract question and attachments from message
  let question: string;
  let attachments: Attachment[] = [];
  
  if (interaction instanceof Message) {
    // Message format: !ask <question> [with attached images]
    const content = interaction.content.trim();
    const parts = content.split(/\s+/);
    
    if (parts.length < 2) {
      await channel.send({
        embeds: [createErrorEmbed(
          'Please provide a question!\n\n' +
          '**Usage:** `!ask <your question>`\n' +
          '**With images:** Attach images to your message along with your question\n\n' +
          '**Examples:**\n' +
          '• `!ask What nutrients should I use during flowering?`\n' +
          '• `!ask What\'s wrong with my plant?` (with image attached)\n' +
          '• `!ask How do I fix yellow leaves?` (with image attached)'
        )],
      });
      return;
    }
    
    question = parts.slice(1).join(' ');
    attachments = Array.from(interaction.attachments.values());
  } else {
    // Slash command format (for future use)
    question = interaction.options.getString('question', true);
    // Slash commands don't have attachments in the same way - skip for now
    attachments = [];
  }

  // Filter to only image attachments
  const imageAttachments = attachments.filter(att => 
    att.contentType?.startsWith('image/')
  );

  // Show loading message
  const loadingText = imageAttachments.length > 0
    ? `🔍 Analyzing your question and ${imageAttachments.length} image(s)...`
    : '🔍 Processing your question...';
  
  const loadingEmbed = createInfoEmbed(
    loadingText,
    `Question: **${question}**\n\n⏱️ *This may take 10-30 seconds depending on your AI setup*`
  );

  const loadingMessage = await channel.send({ embeds: [loadingEmbed] });

  try {
    // Fetch answer from AI
    const answer = await askCannabisQuestion(question, imageAttachments.map(img => img.url));

    // Validate and truncate answer if needed
    // Discord embed description has a 4096 character limit and must be a non-empty string
    let description: string;
    if (!answer || typeof answer !== 'string') {
      description = 'No answer received from AI. Please try again.';
    } else {
      description = answer.trim();
      if (description.length === 0) {
        description = 'The AI returned an empty response. Please try rephrasing your question.';
      } else if (description.length > 4096) {
        // Truncate at a word boundary if possible
        const truncated = description.substring(0, 4093);
        const lastSpace = truncated.lastIndexOf(' ');
        description = lastSpace > 4000 
          ? truncated.substring(0, lastSpace) + '...'
          : truncated + '...';
      }
    }

    // Create embed with answer
    const embed = new EmbedBuilder()
      .setTitle('🌿 Cannabis Expert Answer')
      .setDescription(description)
      .setColor(0x2ecc71) // Green color for helpful answers
      .setFooter({ text: 'Answer provided by AI • Results may vary' })
      .setTimestamp();

    // Add image to embed if there's only one image
    if (imageAttachments.length === 1) {
      embed.setImage(imageAttachments[0].url);
    }

    // Delete loading message and send result
    await loadingMessage.delete().catch(() => {
      // Ignore if message was already deleted
    });

    const messageOptions: any = { embeds: [embed] };

    // If multiple images, create additional embeds for each (Discord allows up to 10 embeds)
    if (imageAttachments.length > 1) {
      embed.setImage(imageAttachments[0].url);
      
      // Create separate embeds for additional images
      const additionalEmbeds: EmbedBuilder[] = [];
      for (let i = 1; i < Math.min(imageAttachments.length, 10); i++) {
        const imageEmbed = new EmbedBuilder()
          .setImage(imageAttachments[i].url)
          .setColor(0x2ecc71)
          .setTimestamp(); // Add timestamp to avoid validation errors
        additionalEmbeds.push(imageEmbed);
      }
      
      messageOptions.embeds = [embed, ...additionalEmbeds];
    }

    await channel.send(messageOptions);
  } catch (error) {
    console.error('Error in handleAskCommand:', error);

    // Delete loading message
    await loadingMessage.delete().catch(() => {
      // Ignore if message was already deleted
    });

    // Send error message
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'An unknown error occurred while processing your question.';

    await channel.send({
      embeds: [createErrorEmbed(
        `Failed to process your question:\n\n${errorMessage}\n\n` +
        `**Note:** Make sure your AI service is properly configured. ` +
        `For image analysis, Gemini is recommended.`
      )],
    });
  }
}
