import { EmbedBuilder, ColorResolvable } from 'discord.js';
import type { Grow, GrowUpdate } from '../types/grow.js';
import { formatDate, daysSince, parseISODate } from './dateUtils.js';

/**
 * Create an embed for grow information
 */
export function createGrowEmbed(grow: Grow): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setTitle(`🌱 Grow: ${grow.strain || 'Unnamed'}`)
    .setColor(0x00ff00 as ColorResolvable)
    .setTimestamp();

  const startDate = parseISODate(grow.start_date);
  const daysSinceStart = daysSince(startDate);

  embed.addFields(
    { name: '📅 Start Date', value: formatDate(startDate), inline: true },
    { name: '⏱️ Days Since Start', value: `${daysSinceStart} days`, inline: true },
    { name: '🌿 Stage', value: grow.current_stage || 'Not set', inline: true }
  );

  if (grow.flower_start_date) {
    const flowerDate = parseISODate(grow.flower_start_date);
    const daysSinceFlower = daysSince(flowerDate);
    embed.addFields(
      { name: '🌸 Flower Start', value: formatDate(flowerDate), inline: true },
      { name: '⏱️ Days in Flower', value: `${daysSinceFlower} days`, inline: true }
    );
  }

  if (grow.strain) {
    embed.addFields({ name: '🧬 Strain', value: grow.strain, inline: true });
  }

  if (grow.germination_method) {
    embed.addFields({ name: '🌱 Germination', value: grow.germination_method, inline: true });
  }

  if (grow.pot_size) {
    embed.addFields({ name: '🪴 Pot Size', value: grow.pot_size, inline: true });
  }

  if (grow.is_harvested) {
    embed.setColor(0xff9900 as ColorResolvable);
    if (grow.harvest_date) {
      const harvestDate = parseISODate(grow.harvest_date);
      embed.addFields({ name: '✅ Harvested', value: formatDate(harvestDate), inline: true });
    }
    if (grow.wet_weight) {
      embed.addFields({ name: '💧 Wet Weight', value: `${grow.wet_weight}g`, inline: true });
    }
    if (grow.dry_weight) {
      embed.addFields({ name: '☀️ Dry Weight', value: `${grow.dry_weight}g`, inline: true });
    }
  }

  return embed;
}

/**
 * Create an embed for daily summary
 */
export function createDailySummaryEmbed(grow: Grow, update: GrowUpdate): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setTitle(`📊 Daily Summary: ${grow.strain || 'Unnamed Grow'}`)
    .setColor(0x0099ff as ColorResolvable)
    .setTimestamp();

  const startDate = parseISODate(grow.start_date);
  const daysSinceStart = daysSince(startDate);

  embed.addFields(
    { name: '📅 Update Date', value: formatDate(parseISODate(update.update_date)), inline: true },
    { name: '⏱️ Days Since Start', value: `${daysSinceStart} days`, inline: true }
  );

  if (grow.flower_start_date) {
    const flowerDate = parseISODate(grow.flower_start_date);
    const daysSinceFlower = daysSince(flowerDate);
    embed.addFields({ name: '⏱️ Days in Flower', value: `${daysSinceFlower} days`, inline: true });
  }

  if (update.environment) {
    embed.addFields({ name: '🌡️ Environment', value: update.environment, inline: false });
  }

  if (update.feeding) {
    embed.addFields({ name: '💧 Feeding', value: update.feeding, inline: false });
  }

  if (update.growth_stage) {
    embed.addFields({ name: '📈 Growth Stage', value: update.growth_stage, inline: true });
  }

  if (update.plant_health) {
    embed.addFields({ name: '🏥 Plant Health', value: update.plant_health, inline: true });
  }

  if (update.terpene_smell) {
    embed.addFields({ name: '👃 Terpene Smell', value: update.terpene_smell, inline: false });
  }

  if (update.flower_development) {
    embed.addFields({ name: '🌸 Flower Development', value: update.flower_development, inline: false });
  }

  if (update.notes) {
    embed.addFields({ name: '📝 Notes', value: update.notes, inline: false });
  }

  // Picture count is shown elsewhere, don't duplicate

  return embed;
}

/**
 * Create an embed for error messages
 */
export function createErrorEmbed(message: string): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle('❌ Error')
    .setDescription(message)
    .setColor(0xff0000 as ColorResolvable)
    .setTimestamp();
}

/**
 * Create an embed for success messages
 */
export function createSuccessEmbed(message: string): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle('✅ Success')
    .setDescription(message)
    .setColor(0x00ff00 as ColorResolvable)
    .setTimestamp();
}

/**
 * Create an embed for info messages
 */
export function createInfoEmbed(title: string, message: string): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle(title)
    .setDescription(message)
    .setColor(0x0099ff as ColorResolvable)
    .setTimestamp();
}
