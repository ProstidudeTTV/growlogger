import { Client, TextChannel, Message, EmbedBuilder, Attachment, DMChannel } from 'discord.js';
import { GrowService } from './growService.js';
import { setUserState, getUserState, clearUserState, updateUserState } from './userStateService.js';
import { createInfoEmbed, createSuccessEmbed, createErrorEmbed } from '../utils/embedBuilder.js';
import { sendSummaryForGrow } from './summaryService.js';
import type { Grow } from '../types/grow.js';

const PROMPT_STEPS = {
  WAITING_FOR_PICTURES: 1,
  WAITING_FOR_ENVIRONMENT: 2,
  WAITING_FOR_FEEDING: 3,
  WAITING_FOR_GROWTH_STAGE: 4,
  WAITING_FOR_PLANT_HEALTH: 5,
  WAITING_FOR_NOTES: 6,
};

/**
 * Send initial daily prompts for a newly created grow
 */
export async function sendInitialDailyPrompt(client: Client, grow: Grow, guildChannelId?: string): Promise<void> {
  try {
    // Wait a moment after grow creation
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check if there's already an update for today (unlikely for new grow, but check anyway)
    const todayUpdate = await GrowService.getTodayUpdate(grow.id);
    if (todayUpdate) {
      console.log(`Skipping initial prompt for grow ${grow.id} - already updated today`);
      return;
    }

    // Try to send a DM to the user
    try {
      const user = await client.users.fetch(grow.discord_user_id);
      const dmChannel = await user.createDM();

      // Start the prompt sequence
      // Store the original guild channel ID so we can send summary there later
      setUserState(grow.discord_user_id, {
        command: 'daily-prompt',
        step: PROMPT_STEPS.WAITING_FOR_PICTURES,
        data: { growId: grow.id },
        channelId: guildChannelId, // Store guild channel for sending summary
      });

      await dmChannel.send({
        embeds: [createInfoEmbed(
          '📸 Daily Update Prompt',
          `It's time to update your grow: **${grow.strain || 'Unnamed Grow'}**\n\n` +
          'Please send pictures of your grow (you can attach multiple images, or type "skip" to skip pictures):'
        )],
      });
    } catch (error) {
      console.error(`Failed to send initial DM to user ${grow.discord_user_id}:`, error);
    }
  } catch (error) {
    console.error('Error in sendInitialDailyPrompt:', error);
  }
}

/**
 * Send daily prompts to users with active grows
 */
export async function sendDailyPrompts(client: Client): Promise<void> {
  try {
    const ongoingGrows = await GrowService.getAllOngoingGrows();

    for (const grow of ongoingGrows) {
      // Check if there's already an update for today
      const todayUpdate = await GrowService.getTodayUpdate(grow.id);
      if (todayUpdate) {
        console.log(`Skipping daily prompt for grow ${grow.id} - already updated today`);
        continue;
      }

      // Try to send a DM to the user
      try {
        const user = await client.users.fetch(grow.discord_user_id);
        const dmChannel = await user.createDM();

      // Start the prompt sequence
      // Note: For scheduled daily prompts, we don't have a guild channel, so channelId will be undefined
      setUserState(grow.discord_user_id, {
        command: 'daily-prompt',
        step: PROMPT_STEPS.WAITING_FOR_PICTURES,
        data: { growId: grow.id },
        channelId: undefined, // No guild channel for scheduled prompts
      });

        await dmChannel.send({
          embeds: [createInfoEmbed(
            '📸 Daily Update Prompt',
            `It's time to update your grow: **${grow.strain || 'Unnamed Grow'}**\n\n` +
            'Please send pictures of your grow (you can attach multiple images, or type "skip" to skip pictures):'
          )],
        });
      } catch (error) {
        console.error(`Failed to send DM to user ${grow.discord_user_id}:`, error);
        // Could try sending to a channel if DM fails
      }
    }
  } catch (error) {
    console.error('Error in sendDailyPrompts:', error);
  }
}

/**
 * Handle daily prompt responses in DM
 */
export async function handleDailyPromptResponse(
  message: Message,
  userId: string,
  content: string,
  attachments: Attachment[]
): Promise<boolean> {
  if (!message.channel.isDMBased()) return false; // Only handle DMs
  
  const state = getUserState(userId);

  if (!state || state.command !== 'daily-prompt') {
    return false; // Not handling this message
  }

  const channel = message.channel;
  
  try {
    if (state.step === PROMPT_STEPS.WAITING_FOR_PICTURES) {
      const pictureUrls: string[] = [];

      if (content.toLowerCase() !== 'skip') {
        // Collect picture URLs from attachments
        attachments.forEach(attachment => {
          if (attachment.contentType?.startsWith('image/')) {
            pictureUrls.push(attachment.url);
          }
        });
      }

      updateUserState(userId, {
        step: PROMPT_STEPS.WAITING_FOR_ENVIRONMENT,
        data: { ...state.data, pictures: pictureUrls },
      });

      await (channel as any).send({
        embeds: [createInfoEmbed(
          '🌡️ Environment',
          'Please describe the environment conditions (temperature, humidity, etc.) or type "skip":'
        )],
      });
      return true;
    }

    if (state.step === PROMPT_STEPS.WAITING_FOR_ENVIRONMENT) {
      const environment = content.toLowerCase() === 'skip' ? null : content.trim();
      
      updateUserState(userId, {
        step: PROMPT_STEPS.WAITING_FOR_FEEDING,
        data: { ...state.data, environment },
      });

      await (channel as any).send({
        embeds: [createInfoEmbed(
          '💧 Feeding',
          'Please describe the feeding schedule/nutrients (or type "skip"):'
        )],
      });
      return true;
    }

    if (state.step === PROMPT_STEPS.WAITING_FOR_FEEDING) {
      const feeding = content.toLowerCase() === 'skip' ? null : content.trim();
      
      updateUserState(userId, {
        step: PROMPT_STEPS.WAITING_FOR_GROWTH_STAGE,
        data: { ...state.data, feeding },
      });

      await (channel as any).send({
        embeds: [createInfoEmbed(
          '📈 Growth Stage',
          'Please describe the current growth stage (or type "skip"):'
        )],
      });
      return true;
    }

    if (state.step === PROMPT_STEPS.WAITING_FOR_GROWTH_STAGE) {
      const growthStage = content.toLowerCase() === 'skip' ? null : content.trim();
      
      updateUserState(userId, {
        step: PROMPT_STEPS.WAITING_FOR_PLANT_HEALTH,
        data: { ...state.data, growth_stage: growthStage },
      });

      await (channel as any).send({
        embeds: [createInfoEmbed(
          '🏥 Plant Health',
          'Please describe the plant health (or type "skip"):'
        )],
      });
      return true;
    }

    if (state.step === PROMPT_STEPS.WAITING_FOR_PLANT_HEALTH) {
      const plantHealth = content.toLowerCase() === 'skip' ? null : content.trim();
      
      updateUserState(userId, {
        step: PROMPT_STEPS.WAITING_FOR_NOTES,
        data: { ...state.data, plant_health: plantHealth },
      });

      await (channel as any).send({
        embeds: [createInfoEmbed(
          '📝 Additional Notes',
          'Please provide any additional notes (or type "skip" to finish):'
        )],
      });
      return true;
    }

    if (state.step === PROMPT_STEPS.WAITING_FOR_NOTES) {
      const notes = content.toLowerCase() === 'skip' ? null : content.trim();

      // Create the grow update
      const today = new Date().toISOString().split('T')[0];
      const growUpdate = await GrowService.createGrowUpdate({
        grow_id: state.data.growId,
        update_date: today,
        pictures: state.data.pictures || [],
        environment: state.data.environment || undefined,
        feeding: state.data.feeding || undefined,
        growth_stage: state.data.growth_stage || undefined,
        plant_health: state.data.plant_health || undefined,
        notes: notes || undefined,
      });

      const grow = await GrowService.getGrowById(state.data.growId);
      const client = message.client as Client;
      const guildChannelId = state.channelId; // Get the original guild channel ID
      clearUserState(userId);

      if (grow) {
        // Import here to avoid circular dependency
        const { createDailySummaryEmbed } = await import('../utils/embedBuilder.js');
        
        // Create daily summary embed
        const summaryEmbed = createDailySummaryEmbed(grow, growUpdate);
        
        // Handle pictures - Discord allows multiple embeds per message
        // Create additional embeds for each picture beyond the first
        const embeds: EmbedBuilder[] = [summaryEmbed];
        
        if (growUpdate.pictures && growUpdate.pictures.length > 0) {
          summaryEmbed.setImage(growUpdate.pictures[0]);
          
          // Create separate embeds for additional pictures (Discord allows up to 10 embeds per message)
          // Each embed can show one image via setImage()
          for (let i = 1; i < growUpdate.pictures.length; i++) {
            const pictureEmbed = new EmbedBuilder()
              .setImage(growUpdate.pictures[i])
              .setColor(0x0099ff as any);
            embeds.push(pictureEmbed);
          }
        }

        const messageOptions: any = {
          embeds: embeds,
        };

        // Send summary to DM first (for clearing conversation)
        const summaryMessage = await (channel as any).send(messageOptions);

        // Send summary to guild channel if we have a channel ID (from !startgrow)
        if (guildChannelId) {
          try {
            const guildChannel = await client.channels.fetch(guildChannelId);
            if (guildChannel && guildChannel.isTextBased() && !guildChannel.isDMBased()) {
              await guildChannel.send(messageOptions);
            }
          } catch (err) {
            console.error('Error sending summary to guild channel:', err);
            // Continue anyway - not critical if this fails
          }
        }

        // Wait a moment for the summary to be fully sent
        await new Promise(resolve => setTimeout(resolve, 500));

        // Clear conversation AFTER sending summary (delete bot prompt messages from DM)
        if (channel.isDMBased()) {
          const dmChannel = channel as DMChannel;
          try {
            // Get recent messages from this channel
            const messages = await dmChannel.messages.fetch({ limit: 50 });
            
            // Delete bot messages from this conversation (recent prompt messages)
            // But keep the summary we just sent
            const botMessages = messages.filter(msg => 
              msg.author.id === client.user?.id && 
              msg.embeds.length > 0 && // Only delete embed messages
              msg.id !== summaryMessage.id && // Don't delete the summary we just sent
              !msg.embeds[0]?.title?.includes('Daily Summary') && // Additional safety check
              !msg.embeds[0]?.title?.includes('📊 Daily Summary') // Alternative title format
            );

            // Also delete user's response messages (from daily prompts)
            // Find the first daily prompt message to know where to start deleting
            let firstPromptMsg = null;
            for (const msg of messages.values()) {
              if (msg.author.id === client.user?.id && 
                  msg.embeds.length > 0 && 
                  msg.embeds[0]?.title?.includes('Daily Update Prompt')) {
                firstPromptMsg = msg;
                break;
              }
            }

            // Delete user messages that are part of daily prompt conversation
            const userMessages: Message[] = [];
            if (firstPromptMsg) {
              for (const msg of messages.values()) {
                if (msg.author.id === userId && 
                    msg.createdTimestamp >= firstPromptMsg.createdTimestamp &&
                    msg.id !== message.id && // Don't delete the current final response
                    !msg.content.trim().startsWith('!')) { // Don't delete commands
                  userMessages.push(msg);
                }
                // Stop if we hit the summary message
                if (msg.id === summaryMessage.id) {
                  break;
                }
              }
            }

            // Delete bot messages one by one with delay to avoid rate limits
            for (const msg of botMessages.values()) {
              try {
                await msg.delete();
                await new Promise(resolve => setTimeout(resolve, 250)); // 250ms delay between deletes
              } catch (err) {
                // Ignore errors if message already deleted or can't be deleted
                console.log('Could not delete bot message:', err);
              }
            }

            // Delete user messages (commands and responses) one by one
            for (const msg of userMessages.values()) {
              try {
                await msg.delete();
                await new Promise(resolve => setTimeout(resolve, 250)); // 250ms delay between deletes
              } catch (err) {
                // Ignore errors if message already deleted or can't be deleted
                console.log('Could not delete user message:', err);
              }
            }
          } catch (err) {
            console.error('Error clearing conversation:', err);
            // Continue anyway - not critical if cleanup fails
          }
        }
      } else {
        await (channel as any).send({
          embeds: [createSuccessEmbed('Daily update saved! Thank you for keeping track of your grow! 🌱')],
        });
      }
      return true;
    }

    return false;
  } catch (error: any) {
    console.error('Error in handleDailyPromptResponse:', error);
    clearUserState(userId);
    await (channel as any).send({
      embeds: [createErrorEmbed(error.message || 'An error occurred while saving your daily update.')],
    });
    return true;
  }
}
