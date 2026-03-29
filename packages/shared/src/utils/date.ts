/**
 * Returns true if the given date is within the warning window (default 30 days).
 */
export function isExpiringSoon(expiryDate: Date, warningDays = 30): boolean {
  const now = new Date();
  const threshold = new Date(now.getTime() + warningDays * 24 * 60 * 60 * 1000);
  return expiryDate > now && expiryDate <= threshold;
}

/**
 * Returns true if the given date is in the past.
 */
export function isExpired(expiryDate: Date): boolean {
  return expiryDate < new Date();
}

/**
 * Formats a date as a UK-style short string: "12 Jan 2025"
 */
export function formatDateUK(date: Date): string {
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
