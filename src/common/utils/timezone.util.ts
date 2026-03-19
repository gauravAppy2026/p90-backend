/**
 * Get the current date string (YYYY-MM-DD) in the user's timezone.
 * Falls back to UTC if timezone is invalid or missing.
 */
export function getLocalDate(timezone?: string): string {
  if (timezone) {
    try {
      return new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date());
    } catch {
      // Invalid timezone, fall through to UTC
    }
  }
  return new Date().toISOString().split('T')[0];
}
