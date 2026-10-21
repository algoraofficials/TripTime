import type { Listing } from '../types/travel.ts';

export interface CalendarExportOptions {
  baseDate?: string; // ISO date string YYYY-MM-DD, defaults to tomorrow
  reminderMinutesBefore?: number; // e.g. 120 for 2 hours before departure
  includeConfirmationCode?: boolean;
  includeCarbonData?: boolean;
  organizerEmail?: string;
  timezone?: string;
}

export interface CalendarEventItem {
  uid: string;
  title: string;
  description: string;
  location: string;
  startUtc: string; // YYYYMMDDTHHMMSSZ
  endUtc: string;   // YYYYMMDDTHHMMSSZ
  startIso: string;
  endIso: string;
  mode: Listing['type'];
  confirmationCode: string;
  googleCalendarUrl: string;
}

/**
 * Escapes text according to RFC 5545 iCalendar specification
 */
export function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/**
 * Formats a Date object into RFC 5545 UTC timestamp: YYYYMMDDTHHMMSSZ
 */
export function formatDateToIcsUtc(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${date.getUTCFullYear()}` +
    `${pad(date.getUTCMonth() + 1)}` +
    `${pad(date.getUTCDate())}T` +
    `${pad(date.getUTCHours())}` +
    `${pad(date.getUTCMinutes())}` +
    `${pad(date.getUTCSeconds())}Z`
  );
}

/**
 * Parses a time string like "08:30 AM" or "10:15 PM" onto a base date in UTC
 */
export function parseTimeOnDate(baseDateStr: string, timeStr?: string, offsetDays = 0): Date {
  const [year, month, day] = baseDateStr.split('-').map((n) => parseInt(n, 10));
  const date = new Date(Date.UTC(year || 2026, (month || 10) - 1, (day || 20) + offsetDays, 9, 0, 0));

  if (!timeStr) {
    return date;
  }

  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM)\b)?/i);
  if (!match) {
    return date;
  }

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const meridiem = match[3]?.toUpperCase();

  if (meridiem === 'PM' && hours < 12) {
    hours += 12;
  } else if (meridiem === 'AM' && hours === 12) {
    hours = 0;
  }

  date.setUTCHours(hours, minutes, 0, 0);
  return date;
}

/**
 * Parses a duration string like "13h 20m", "2h 15m", "Per Night", "Full Day (8 hours)" into minutes
 */
export function parseDurationMinutes(durationStr: string, type: Listing['type']): number {
  if (type === 'hotel' || durationStr.toLowerCase().includes('night')) {
    return 24 * 60; // 1 night stay default (24 hours)
  }

  const hourMatch = durationStr.match(/(\d+)\s*h/i);
  const minMatch = durationStr.match(/(\d+)\s*m/i);

  if (hourMatch || minMatch) {
    const h = hourMatch ? parseInt(hourMatch[1], 10) : 0;
    const m = minMatch ? parseInt(minMatch[1], 10) : 0;
    return Math.max(30, h * 60 + m);
  }

  const fullDayMatch = durationStr.match(/(\d+)\s*hours?/i);
  if (fullDayMatch) {
    return parseInt(fullDayMatch[1], 10) * 60;
  }

  return 180; // Default 3 hours
}

/**
 * Deterministic confirmation code generator from listing ID
 */
export function getBookingConfirmationCode(listingId: string): string {
  let hash = 0;
  for (let i = 0; i < listingId.length; i++) {
    hash = (hash << 5) - hash + listingId.charCodeAt(i);
    hash |= 0;
  }
  const alphaNum = Math.abs(hash).toString(36).toUpperCase().padStart(6, '8').slice(0, 6);
  return `AV-${alphaNum}`;
}

/**
 * Builds structured calendar event metadata and Google Calendar URL for a booking
 */
export function buildCalendarEvent(
  listing: Listing,
  index = 0,
  options: CalendarExportOptions = {}
): CalendarEventItem {
  const baseDate = options.baseDate || '2026-10-24';
  const includeConfirmationCode = options.includeConfirmationCode ?? true;
  const includeCarbonData = options.includeCarbonData ?? true;

  // Stagger multi-segment bookings across consecutive days if part of an itinerary
  const startDate = parseTimeOnDate(
    baseDate,
    listing.details.departureTime || (listing.type === 'hotel' ? '03:00 PM' : '09:00 AM'),
    index
  );

  const durationMinutes = parseDurationMinutes(
    listing.details.durationOrNights || '3h',
    listing.type
  );
  const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);

  const startUtc = formatDateToIcsUtc(startDate);
  const endUtc = formatDateToIcsUtc(endDate);
  const confirmationCode = getBookingConfirmationCode(listing.id);

  const modeLabel =
    listing.type === 'flight'
      ? 'Flight'
      : listing.type === 'train'
      ? 'High-Speed Rail'
      : listing.type === 'ship'
      ? 'Maritime Vessel'
      : 'Luxury Stay';

  const title = `[AetherVoyage ${modeLabel}] ${listing.title}`;
  const location = `${listing.destination}, ${listing.country}`;

  const descLines: string[] = [
    `Provider: ${listing.provider.name}`,
    `Class / Tier: ${listing.details.classOrRoomType || 'Standard'}`,
    `Policy: ${listing.details.cancellationPolicy}`,
  ];

  if (includeConfirmationCode) {
    descLines.unshift(`Booking Reference: ${confirmationCode}`);
  }
  if (includeCarbonData) {
    descLines.push(`Estimated Footprint: ${listing.details.carbonOffsetKg ?? 0}kg CO2e`);
  }
  if (listing.details.amenities.length > 0) {
    descLines.push(`Amenities: ${listing.details.amenities.join(', ')}`);
  }

  const description = descLines.join('\n');

  const googleParams = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${startUtc}/${endUtc}`,
    details: description,
    location,
  });

  return {
    uid: `${listing.id}-${startUtc}@aethervoyage.travel`,
    title,
    description,
    location,
    startUtc,
    endUtc,
    startIso: startDate.toISOString(),
    endIso: endDate.toISOString(),
    mode: listing.type,
    confirmationCode,
    googleCalendarUrl: `https://calendar.google.com/calendar/render?${googleParams.toString()}`,
  };
}

/**
 * Generates an RFC 5545 compliant .ics calendar feed string for one or multiple bookings
 */
export function generateIcsFeed(
  listings: Listing[],
  options: CalendarExportOptions = {}
): string {
  const reminderMinutes = options.reminderMinutesBefore ?? 120;
  const organizerEmail = options.organizerEmail || 'concierge@aethervoyage.travel';
  const nowUtc = formatDateToIcsUtc(new Date(Date.UTC(2026, 9, 19, 12, 0, 0)));

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//AetherVoyage Global Transit Platform//NONSGML Itinerary Feed v2.4//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:AetherVoyage Global Transit Itinerary',
    `X-WR-TIMEZONE:${options.timezone || 'UTC'}`,
  ];

  listings.forEach((listing, index) => {
    const ev = buildCalendarEvent(listing, index, options);

    lines.push(
      'BEGIN:VEVENT',
      `UID:${ev.uid}`,
      `DTSTAMP:${nowUtc}`,
      `DTSTART:${ev.startUtc}`,
      `DTEND:${ev.endUtc}`,
      `SUMMARY:${escapeIcsText(ev.title)}`,
      `DESCRIPTION:${escapeIcsText(ev.description)}`,
      `LOCATION:${escapeIcsText(ev.location)}`,
      `ORGANIZER;CN=AetherVoyage Concierge:mailto:${organizerEmail}`,
      'STATUS:CONFIRMED',
      'TRANSP:OPAQUE'
    );

    if (reminderMinutes > 0) {
      lines.push(
        'BEGIN:VALARM',
        `TRIGGER:-PT${reminderMinutes}M`,
        'ACTION:DISPLAY',
        `DESCRIPTION:${escapeIcsText(`Upcoming Departure Reminder: ${listing.title}`)}`,
        'END:VALARM'
      );
    }

    lines.push('END:VEVENT');
  });

  lines.push('END:VCALENDAR');

  // RFC 5545 specifies CRLF line endings
  return lines.join('\r\n');
}
