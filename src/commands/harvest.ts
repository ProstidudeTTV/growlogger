import {
  ChatInputCommandInteraction,
  Message,
  TextChannel,
} from 'discord.js';
import { GrowService } from '../services/growService.js';
import { createErrorEmbed, createSuccessEmbed, createGrowEmbed } from '../utils/embedBuilder.js';

/**
 * Handle !harvest command
 */
export async function handleHarvestCommand(
  interaction: ChatInputCommandInteraction | Message,
  userId: string
): Promise<void> {
  const channel = interaction.channel as TextChannel;
  if (!channel) return;

  try {
    // Check if user has an active grow
    const activeGrow = await GrowService.getActiveGrow(userId);
    if (!activeGrow) {
      await channel.send({
        embeds: [createErrorEmbed('You don\'t have an active (non-harvested) grow. Please start a grow first using `!startgrow`.')],
      });
      return;
    }

    // Check if already harvested
    if (activeGrow.is_harvested) {
      await channel.send({
        embeds: [createErrorEmbed('This grow has already been harvested.')],
      });
      return;
    }

    // Harvest the grow
    const harvestedGrow = await GrowService.harvestGrow(activeGrow.id);

    await channel.send({
      embeds: [
        createSuccessEmbed('Grow harvested! ✅ The grow log has been stopped, and daily prompts will no longer be sent for this grow.'),
        createGrowEmbed(harvestedGrow),
      ],
    });
  } catch (error: any) {
    console.error('Error in handleHarvestCommand:', error);
    await channel.send({
      embeds: [createErrorEmbed(error.message || 'An error occurred while harvesting the grow.')],
    });
  }
}
