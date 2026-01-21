/**
 * Parse date from XX/XX/XXXX format
 */
export function parseDate(dateString: string): Date | null {
  const regex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
  const match = dateString.match(regex);

  if (!match) {
    return null;
  }

  const [, month, day, year] = match;
  const monthNum = parseInt(month, 10);
  const dayNum = parseInt(day, 10);
  const yearNum = parseInt(year, 10);

  // Validate month and day ranges
  if (monthNum < 1 || monthNum > 12 || dayNum < 1 || dayNum > 31) {
    return null;
  }

  const date = new Date(yearNum, monthNum - 1, dayNum);
  
  // Check if date is valid (handles cases like Feb 31)
  if (
    date.getFullYear() !== yearNum ||
    date.getMonth() !== monthNum - 1 ||
    date.getDate() !== dayNum
  ) {
    return null;
  }

  return date;
}

/**
 * Format date to XX/XX/XXXX format
 */
export function formatDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
}

/**
 * Format date to YYYY-MM-DD format (ISO date string)
 */
export function formatISODate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Calculate days since a date
 */
export function daysSince(date: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  
  const diffTime = today.getTime() - start.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

/**
 * Parse date from ISO string (YYYY-MM-DD)
 */
export function parseISODate(dateString: string): Date {
  return new Date(dateString + 'T00:00:00');
}
