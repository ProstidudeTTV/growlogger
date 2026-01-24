import { Message, TextChannel, DMChannel } from 'discord.js';
import { GrowService } from '../services/growService.js';
import { sendInitialDailyPrompt } from '../services/promptService.js';
import { createInfoEmbed, createErrorEmbed, createSuccessEmbed } from '../utils/embedBuilder.js';
import { formatISODate } from '../utils/dateUtils.js';

// Track when users last used the !prompt command (userId -> date string YYYY-MM-DD)
const lastPromptCommandUsage = new Map<string, string>();

/**
 * Handle !prompt command - manually trigger daily prompt if notification didn't work
 * Can only be used once per day and only if today's prompt wasn't completed
 */
export async function handlePromptCommand(
  message: Message,
  userId: string
): Promise<void> {
  const channel = message.channel;
  
  try {
    // Get user's active grow
    const activeGrow = await GrowService.getActiveGrow(userId);
    
    if (!activeGrow) {
      await channel.send({
        embeds: [createErrorEmbed(
          'No Active Grow Found',
          `You need to have an active grow to use this command. Use \`!startgrow\` to start a new grow first.`
        )],
      });
      return;
    }

    // Check if today's prompt was already completed
    const todayUpdate = await GrowService.getTodayUpdate(activeGrow.id);
    if (todayUpdate) {
      await channel.send({
        embeds: [createInfoEmbed(
          'Already Completed',
          `You've already completed today's daily update for **${activeGrow.strain || 'Unnamed Grow'}**.\n\n` +
          `You can only use \`!prompt\` if you haven't completed today's update yet.`
        )],
      });
      return;
    }

    // Check if command was already used today
    const today = formatISODate(new Date());
    const lastUsed = lastPromptCommandUsage.get(userId);
    
    if (lastUsed === today) {
      await channel.send({
        embeds: [createErrorEmbed(
          'Command Already Used Today',
          `You can only use \`!prompt\` once per day. Please wait until tomorrow to use it again.`
        )],
      });
      return;
    }

    // Check if user is already in a daily prompt conversation
    const { getUserState } = await import('../services/userStateService.js');
    const currentState = getUserState(userId);
    if (currentState && currentState.command === 'daily-prompt') {
      await channel.send({
        embeds: [createInfoEmbed(
          'Prompt Already Active',
          'You already have an active daily prompt conversation. Please check your DMs and complete it first.'
        )],
      });
      return;
    }

    // All checks passed - send the daily prompt
    // Mark command as used today
    lastPromptCommandUsage.set(userId, today);

    // Get guild channel ID if this was sent in a guild
    const guildChannelId = channel.isDMBased() ? undefined : (channel as TextChannel).id;

    // Send initial daily prompt
    await sendInitialDailyPrompt(message.client, activeGrow, guildChannelId);

    // Send confirmation message
    await channel.send({
      embeds: [createSuccessEmbed(
        'Daily Prompt Sent',
        `I've sent you a daily prompt in your DMs for **${activeGrow.strain || 'Unnamed Grow'}**.\n\n` +
        'Please check your direct messages to complete your daily update.'
      )],
    });

    // Clean up old entries from the map (older than 7 days) to prevent memory leaks
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = formatISODate(sevenDaysAgo);
    
    for (const [uid, dateStr] of lastPromptCommandUsage.entries()) {
      if (dateStr < sevenDaysAgoStr) {
        lastPromptCommandUsage.delete(uid);
      }
    }
  } catch (error: any) {
    console.error('Error in handlePromptCommand:', error);
    await channel.send({
      embeds: [createErrorEmbed(
        'Error',
        error.message || 'An error occurred while trying to send the daily prompt. Please try again later.'
      )],
    });
  }
}
