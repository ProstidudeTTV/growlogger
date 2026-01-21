import { Client, DMChannel } from 'discord.js';
import { GrowService } from './growService.js';
import { createDailySummaryEmbed } from '../utils/embedBuilder.js';
import type { Grow, GrowUpdate } from '../types/grow.js';

/**
 * Send a daily summary for a specific grow and update
 */
export async function sendSummaryForGrow(
  client: Client,
  grow: Grow,
  update: GrowUpdate
): Promise<void> {
  try {
    const user = await client.users.fetch(grow.discord_user_id);
    const dmChannel = await user.createDM();

    const embed = createDailySummaryEmbed(grow, update);

    const messageOptions: any = {
      embeds: [embed],
    };

    // Note: Discord.js doesn't support attaching images from URLs directly
    // You would need to download and re-upload, or just include URLs in embed
    if (update.pictures && update.pictures.length > 0) {
      // Add picture URLs to the embed description or as image
      embed.setImage(update.pictures[0]); // Show first picture
      
      // Could add additional pictures as fields or in footer
      if (update.pictures.length > 1) {
        embed.addFields({
          name: '📷 Additional Pictures',
          value: update.pictures.slice(1).map((url, idx) => `[Picture ${idx + 2}](${url})`).join('\n'),
        });
      }
    }

    await dmChannel.send(messageOptions);
  } catch (error) {
    console.error(`Failed to send summary to user ${grow.discord_user_id}:`, error);
  }
}
