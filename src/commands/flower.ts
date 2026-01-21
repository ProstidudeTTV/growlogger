import {
  ChatInputCommandInteraction,
  Message,
  TextChannel,
} from 'discord.js';
import { GrowService } from '../services/growService.js';
import { setUserState, getUserState, clearUserState, updateUserState } from '../services/userStateService.js';
import { createErrorEmbed, createSuccessEmbed, createInfoEmbed, createGrowEmbed } from '../utils/embedBuilder.js';

const FLOWER_STEPS = {
  WAITING_FOR_TERPENE: 1,
  WAITING_FOR_DEVELOPMENT: 2,
};

/**
 * Handle !flower command
 */
export async function handleFlowerCommand(
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

    // Check if already in flower stage
    if (activeGrow.flower_start_date) {
      await channel.send({
        embeds: [createErrorEmbed('This grow is already in the flower stage.')],
      });
      return;
    }

    // Start flower stage
    const updatedGrow = await GrowService.startFlowerStage(activeGrow.id);

    // Start multi-step process for flower info
    setUserState(userId, {
      command: 'flower',
      step: FLOWER_STEPS.WAITING_FOR_TERPENE,
      data: { growId: activeGrow.id },
    });

    await channel.send({
      embeds: [
        createSuccessEmbed('Flower stage started! 🌸'),
        createGrowEmbed(updatedGrow),
        createInfoEmbed(
          '👃 Terpene Smell',
          'Please describe the terpene smell:'
        ),
      ],
    });
  } catch (error: any) {
    console.error('Error in handleFlowerCommand:', error);
    await channel.send({
      embeds: [createErrorEmbed(error.message || 'An error occurred while starting the flower stage.')],
    });
  }
}

/**
 * Handle flower step responses
 */
export async function handleFlowerResponse(
  message: Message,
  userId: string,
  content: string
): Promise<boolean> {
  const channel = message.channel as TextChannel;
  const state = getUserState(userId);

  if (!state || state.command !== 'flower') {
    return false; // Not handling this message
  }

  try {
    if (state.step === FLOWER_STEPS.WAITING_FOR_TERPENE) {
      if (!content.trim()) {
        await channel.send({
          embeds: [createErrorEmbed('Terpene smell cannot be empty. Please describe the terpene smell:')],
        });
        return true;
      }

      updateUserState(userId, {
        step: FLOWER_STEPS.WAITING_FOR_DEVELOPMENT,
        data: { ...state.data, terpene_smell: content.trim() },
      });

      await channel.send({
        embeds: [createInfoEmbed(
          '🌸 Flower Development',
          'Please describe the flower development:'
        )],
      });
      return true;
    }

    if (state.step === FLOWER_STEPS.WAITING_FOR_DEVELOPMENT) {
      if (!content.trim()) {
        await channel.send({
          embeds: [createErrorEmbed('Flower development cannot be empty. Please describe the flower development:')],
        });
        return true;
      }

      // Create today's grow update with flower info
      const today = new Date().toISOString().split('T')[0];
      await GrowService.createGrowUpdate({
        grow_id: state.data.growId,
        update_date: today,
        terpene_smell: state.data.terpene_smell,
        flower_development: content.trim(),
      });

      const grow = await GrowService.getGrowById(state.data.growId);
      clearUserState(userId);

      if (grow) {
        await channel.send({
          embeds: [
            createSuccessEmbed('Flower stage information saved! 🌸'),
            createGrowEmbed(grow),
          ],
        });
      } else {
        await channel.send({
          embeds: [createSuccessEmbed('Flower stage information saved! 🌸')],
        });
      }
      return true;
    }

    return false;
  } catch (error: any) {
    console.error('Error in handleFlowerResponse:', error);
    clearUserState(userId);
    await channel.send({
      embeds: [createErrorEmbed(error.message || 'An error occurred while saving flower information.')],
    });
    return true;
  }
}
