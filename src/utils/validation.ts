/**
 * Validate Discord user ID format
 */
export function isValidDiscordUserId(userId: string): boolean {
  return /^\d{17,19}$/.test(userId);
}

/**
 * Validate grow ID format (UUID)
 */
export function isValidGrowId(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

/**
 * Validate numeric weight
 */
export function isValidWeight(weight: string): boolean {
  const num = parseFloat(weight);
  return !isNaN(num) && num >= 0;
}

/**
 * Parse and validate weight from string
 */
export function parseWeight(weight: string): number | null {
  const num = parseFloat(weight.trim());
  if (isNaN(num) || num < 0) {
    return null;
  }
  return num;
}

/**
 * Validate that a string is not empty
 */
export function isNotEmpty(value: string): boolean {
  return value.trim().length > 0;
}

/**
 * Validate date format XX/XX/XXXX
 */
export function isValidDateFormat(dateString: string): boolean {
  return /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateString);
}
