import {
  ChatInputCommandInteraction,
  Message,
  TextChannel,
  Client,
} from 'discord.js';
import { GrowService } from '../services/growService.js';
import { setUserState, getUserState, clearUserState, updateUserState } from '../services/userStateService.js';
import { parseDate, formatDate } from '../utils/dateUtils.js';
import { isValidDateFormat } from '../utils/validation.js';
import { createErrorEmbed, createSuccessEmbed, createInfoEmbed, createGrowEmbed } from '../utils/embedBuilder.js';
import { sendInitialDailyPrompt } from '../services/promptService.js';

const STARTGROW_STEPS = {
  WAITING_FOR_DATE: 1,
  WAITING_FOR_STRAIN: 2,
  WAITING_FOR_GERMINATION: 3,
  WAITING_FOR_POT_SIZE: 4,
};

/**
 * Handle !startgrow command
 */
export async function handleStartGrowCommand(
  interaction: ChatInputCommandInteraction | Message,
  userId: string
): Promise<void> {
  const channel = interaction.channel as TextChannel;
  if (!channel) return;

  try {
    // Check if user already has an active grow creation in progress
    const existingState = getUserState(userId);
    if (existingState && existingState.command === 'startgrow') {
      await channel.send({
        embeds: [createErrorEmbed('You already have a grow creation in progress. Please complete it or wait for it to expire.')],
      });
      return;
    }

    // Check ongoing grows limit
    const ongoingCount = await GrowService.countOngoingGrows(userId);
    if (ongoingCount >= 20) {
      await channel.send({
        embeds: [createErrorEmbed('You already have 20 ongoing grows. Please harvest some before starting a new one.')],
      });
      return;
    }

    // Start the multi-step process
    // Store channel ID so we can clear messages and send summary there later
    const channelId = channel.id;
    setUserState(userId, {
      command: 'startgrow',
      step: STARTGROW_STEPS.WAITING_FOR_DATE,
      data: {},
      channelId: channelId,
    });

    await channel.send({
      embeds: [createInfoEmbed(
        '🌱 Start New Grow',
        'When was it planted? Please provide the grow start date in **XX/XX/XXXX** format (e.g., 01/15/2024):\n\n' +
        'This is the date when you started tracking this grow, which sets the timer baseline.'
      )],
    });
  } catch (error) {
    console.error('Error in handleStartGrowCommand:', error);
    await channel.send({
      embeds: [createErrorEmbed('An error occurred while starting the grow creation process.')],
    });
  }
}

/**
 * Handle startgrow step responses
 */
export async function handleStartGrowResponse(
  message: Message,
  userId: string,
  content: string
): Promise<boolean> {
  const channel = message.channel as TextChannel;
  const state = getUserState(userId);
  
  // Track message IDs for deletion later
  if (!state.data.messageIds) {
    state.data.messageIds = [];
  }
  state.data.messageIds.push(message.id);

  if (!state || state.command !== 'startgrow') {
    return false; // Not handling this message
  }

  try {
    if (state.step === STARTGROW_STEPS.WAITING_FOR_DATE) {
      // Parse and validate date
      if (!isValidDateFormat(content)) {
        await channel.send({
          embeds: [createInfoEmbed(
            '📅 When was it planted?',
            'Please provide the grow start date in **XX/XX/XXXX** format (e.g., 01/15/2024):\n\n' +
            'This is the date when you started tracking this grow.'
          )],
        });
        return true;
      }

      const date = parseDate(content);
      if (!date) {
        await channel.send({
          embeds: [createInfoEmbed(
            '📅 When was it planted?',
            'That doesn\'t look like a valid date. Please provide the grow start date in **XX/XX/XXXX** format (e.g., 01/15/2024):\n\n' +
            'This is the date when you started tracking this grow.'
          )],
        });
        return true;
      }

      updateUserState(userId, {
        step: STARTGROW_STEPS.WAITING_FOR_STRAIN,
        data: { ...state.data, start_date: date.toISOString().split('T')[0] },
      });

      await channel.send({
        embeds: [createInfoEmbed(
          '🧬 Strain',
          'Please provide the strain name:'
        )],
      });
      return true;
    }

    if (state.step === STARTGROW_STEPS.WAITING_FOR_STRAIN) {
      if (!content.trim()) {
        await channel.send({
          embeds: [createErrorEmbed('Strain name cannot be empty. Please provide the strain name:')],
        });
        return true;
      }

      updateUserState(userId, {
        step: STARTGROW_STEPS.WAITING_FOR_GERMINATION,
        data: { ...state.data, strain: content.trim() },
      });

      await channel.send({
        embeds: [createInfoEmbed(
          '🌱 Germination Method',
          'Please provide the germination method (e.g., seed, clone, etc.):'
        )],
      });
      return true;
    }

    if (state.step === STARTGROW_STEPS.WAITING_FOR_GERMINATION) {
      if (!content.trim()) {
        await channel.send({
          embeds: [createErrorEmbed('Germination method cannot be empty. Please provide the germination method:')],
        });
        return true;
      }

      updateUserState(userId, {
        step: STARTGROW_STEPS.WAITING_FOR_POT_SIZE,
        data: { ...state.data, germination_method: content.trim() },
      });

      await channel.send({
        embeds: [createInfoEmbed(
          '🪴 Pot Size',
          'Please provide the pot size (e.g., 5 gallon, 3 liter, etc.):'
        )],
      });
      return true;
    }

    if (state.step === STARTGROW_STEPS.WAITING_FOR_POT_SIZE) {
      if (!content.trim()) {
        await channel.send({
          embeds: [createErrorEmbed('Pot size cannot be empty. Please provide the pot size:')],
        });
        return true;
      }

      // Create the grow
      const grow = await GrowService.createGrow({
        discord_user_id: userId,
        start_date: state.data.start_date,
        strain: state.data.strain,
        germination_method: state.data.germination_method,
        pot_size: content.trim(),
        current_stage: 'vegetative',
      });

      // Clear bot and user messages from the !startgrow conversation in guild channel
      const client = message.client as Client;
      if (!channel.isDMBased()) {
        try {
          const messages = await channel.messages.fetch({ limit: 50 });
          const botMessages = messages.filter(msg => 
            msg.author.id === client.user?.id && 
            msg.embeds.length > 0
          );

          // Also delete user's command and response messages from !startgrow
          // Track messages that are part of the !startgrow conversation
          // Find the !startgrow command message first
          let startgrowCommandMsg = null;
          for (const msg of messages.values()) {
            if (msg.author.id === userId && msg.content.trim().toLowerCase().startsWith('!startgrow')) {
              startgrowCommandMsg = msg;
              break;
            }
          }

          // Delete user messages that are part of !startgrow conversation
          // This includes the command and all responses after it (until we reach a bot success message)
          const userMessages: Message[] = [];
          if (startgrowCommandMsg) {
            for (const msg of messages.values()) {
              if (msg.author.id === userId && msg.createdTimestamp >= startgrowCommandMsg.createdTimestamp) {
                // Only include messages that are responses (not other commands)
                if (msg.id === startgrowCommandMsg.id || !msg.content.trim().startsWith('!')) {
                  userMessages.push(msg);
                }
                // Stop if we hit the success message (grow created)
                if (msg.author.id === client.user?.id && 
                    msg.embeds.length > 0 && 
                    msg.embeds[0]?.title?.includes('Success')) {
                  break;
                }
              }
            }
          }

          // Delete bot messages from !startgrow conversation
          for (const msg of botMessages.values()) {
            try {
              await msg.delete();
              await new Promise(resolve => setTimeout(resolve, 250));
            } catch (err) {
              console.log('Could not delete bot message:', err);
            }
          }

          // Delete user messages (command and responses)
          for (const msg of userMessages.values()) {
            try {
              await msg.delete();
              await new Promise(resolve => setTimeout(resolve, 250));
            } catch (err) {
              console.log('Could not delete user message:', err);
            }
          }
        } catch (err) {
          console.error('Error clearing startgrow messages:', err);
        }
      }

      clearUserState(userId);

      await channel.send({
        embeds: [
          createSuccessEmbed('Grow created successfully! 🌱'),
          createGrowEmbed(grow),
        ],
      });

      // Send initial daily prompts immediately after creating grow
      await sendInitialDailyPrompt(client, grow, channel.id).catch(err => {
        console.error('Error sending initial daily prompt:', err);
        // Don't block the success message if this fails
      });

      return true;
    }

    return false;
  } catch (error: any) {
    console.error('Error in handleStartGrowResponse:', error);
    clearUserState(userId);
    await channel.send({
      embeds: [createErrorEmbed(error.message || 'An error occurred while creating the grow.')],
    });
    return true;
  }
}
