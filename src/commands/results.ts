import {
  ChatInputCommandInteraction,
  Message,
  TextChannel,
} from 'discord.js';
import { GrowService } from '../services/growService.js';
import { setUserState, getUserState, clearUserState, updateUserState } from '../services/userStateService.js';
import { parseWeight } from '../utils/validation.js';
import { createErrorEmbed, createSuccessEmbed, createInfoEmbed, createGrowEmbed } from '../utils/embedBuilder.js';

const RESULTS_STEPS = {
  WAITING_FOR_WET_WEIGHT: 1,
  WAITING_FOR_DRY_WEIGHT: 2,
  WAITING_FOR_NOTES: 3,
};

/**
 * Handle !results command
 */
export async function handleResultsCommand(
  interaction: ChatInputCommandInteraction | Message,
  userId: string
): Promise<void> {
  const channel = interaction.channel as TextChannel;
  if (!channel) return;

  try {
    // Get the most recently harvested grow
    const allGrows = await GrowService.getGrowsByUserId(userId);
    const harvestedGrows = allGrows.filter(g => g.is_harvested).sort((a, b) => {
      const dateA = b.harvest_date ? new Date(b.harvest_date).getTime() : 0;
      const dateB = a.harvest_date ? new Date(a.harvest_date).getTime() : 0;
      return dateA - dateB;
    });

    if (harvestedGrows.length === 0) {
      await channel.send({
        embeds: [createErrorEmbed('You don\'t have any harvested grows. Please harvest a grow first using `!harvest`.')],
      });
      return;
    }

    // Check if user already has a results entry in progress
    const existingState = getUserState(userId);
    if (existingState && existingState.command === 'results') {
      await channel.send({
        embeds: [createErrorEmbed('You already have a results entry in progress. Please complete it or wait for it to expire.')],
      });
      return;
    }

    // Use the most recently harvested grow
    const latestHarvestedGrow = harvestedGrows[0];

    // Start the multi-step process
    setUserState(userId, {
      command: 'results',
      step: RESULTS_STEPS.WAITING_FOR_WET_WEIGHT,
      data: { growId: latestHarvestedGrow.id },
    });

    await channel.send({
      embeds: [
        createInfoEmbed(
          '📊 Harvest Results',
          `Entering results for: **${latestHarvestedGrow.strain || 'Unnamed Grow'}**\n\nPlease provide the wet weight in grams:`
        ),
      ],
    });
  } catch (error: any) {
    console.error('Error in handleResultsCommand:', error);
    await channel.send({
      embeds: [createErrorEmbed(error.message || 'An error occurred while starting the results entry.')],
    });
  }
}

/**
 * Handle results step responses
 */
export async function handleResultsResponse(
  message: Message,
  userId: string,
  content: string
): Promise<boolean> {
  const channel = message.channel as TextChannel;
  const state = getUserState(userId);

  if (!state || state.command !== 'results') {
    return false; // Not handling this message
  }

  try {
    if (state.step === RESULTS_STEPS.WAITING_FOR_WET_WEIGHT) {
      const weight = parseWeight(content);
      if (weight === null) {
        await channel.send({
          embeds: [createErrorEmbed('Invalid weight. Please provide a valid number in grams:')],
        });
        return true;
      }

      updateUserState(userId, {
        step: RESULTS_STEPS.WAITING_FOR_DRY_WEIGHT,
        data: { ...state.data, wet_weight: weight },
      });

      await channel.send({
        embeds: [createInfoEmbed(
          '☀️ Dry Weight',
          'Please provide the dry weight in grams (or type "skip" to skip this step):'
        )],
      });
      return true;
    }

    if (state.step === RESULTS_STEPS.WAITING_FOR_DRY_WEIGHT) {
      let dryWeight: number | null = null;
      
      if (content.trim().toLowerCase() !== 'skip') {
        const weight = parseWeight(content);
        if (weight === null) {
          await channel.send({
            embeds: [createErrorEmbed('Invalid weight. Please provide a valid number in grams or type "skip":')],
          });
          return true;
        }
        dryWeight = weight;
      }

      updateUserState(userId, {
        step: RESULTS_STEPS.WAITING_FOR_NOTES,
        data: { ...state.data, dry_weight: dryWeight },
      });

      await channel.send({
        embeds: [createInfoEmbed(
          '📝 Harvest Notes',
          'Please provide harvest notes (or type "skip" to skip this step):'
        )],
      });
      return true;
    }

    if (state.step === RESULTS_STEPS.WAITING_FOR_NOTES) {
      let notes: string | null = null;
      
      if (content.trim().toLowerCase() !== 'skip') {
        notes = content.trim();
      }

      // Update the grow with results
      await GrowService.updateGrow(state.data.growId, {
        wet_weight: state.data.wet_weight,
        dry_weight: state.data.dry_weight,
        harvest_notes: notes,
      });

      const grow = await GrowService.getGrowById(state.data.growId);
      clearUserState(userId);

      if (grow) {
        await channel.send({
          embeds: [
            createSuccessEmbed('Harvest results saved! 📊'),
            createGrowEmbed(grow),
          ],
        });
      } else {
        await channel.send({
          embeds: [createSuccessEmbed('Harvest results saved! 📊')],
        });
      }
      return true;
    }

    return false;
  } catch (error: any) {
    console.error('Error in handleResultsResponse:', error);
    clearUserState(userId);
    await channel.send({
      embeds: [createErrorEmbed(error.message || 'An error occurred while saving harvest results.')],
    });
    return true;
  }
}
