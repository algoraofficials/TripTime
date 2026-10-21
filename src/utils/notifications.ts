import type { Listing, TransitMode } from '../types/travel.ts';

export interface DepartureAlert {
  id: string;
  bookingId: string;
  transitType: TransitMode;
  serviceTitle: string;
  destination: string;
  departureTime: string;
  scheduledAlert: string; // e.g. "T-3 hours: Gate & Terminal Notice" or "PRICE DROP -15%"
  urgency: 'critical' | 'upcoming' | 'info' | 'price_drop';
  category?: 'departure' | 'price_drop';
  oldPriceUsd?: number;
  newPriceUsd?: number;
  message: string;
  read: boolean;
  createdAt: string;
  platformOrGate?: string;
}

/**
 * Generates departure notification alerts from the user's booking history
 */
export function generateDepartureAlerts(bookings: Listing[]): DepartureAlert[] {
  const transitBookings = bookings.filter(
    (b) => b.type === 'flight' || b.type === 'train' || b.type === 'ship'
  );

  const alerts: DepartureAlert[] = [];

  transitBookings.forEach((item, index) => {
    const depTime = item.details.departureTime || '10:00 AM';
    const isFlight = item.type === 'flight';
    const isTrain = item.type === 'train';

    if (isFlight) {
      alerts.push({
        id: `alert-dep-${item.id}-1`,
        bookingId: item.id,
        transitType: item.type,
        serviceTitle: item.title,
        destination: item.destination,
        departureTime: depTime,
        scheduledAlert: 'T-24h Online Check-In Open',
        urgency: 'info',
        message: `Online check-in is now open for ${item.title}. Confirm seats and download digital boarding pass.`,
        read: false,
        createdAt: '1 hour ago',
        platformOrGate: 'Terminal 3 • Gate 42A',
      });

      alerts.push({
        id: `alert-dep-${item.id}-2`,
        bookingId: item.id,
        transitType: item.type,
        serviceTitle: item.title,
        destination: item.destination,
        departureTime: depTime,
        scheduledAlert: 'T-3h Departure Alert',
        urgency: 'upcoming',
        message: `Flight departs at ${depTime}. Proceed through security checkpoint. Baggage drop closes in 45 minutes.`,
        read: false,
        createdAt: '15 minutes ago',
        platformOrGate: 'Gate 42A • Priority Boarding Zone 2',
      });
    } else if (isTrain) {
      alerts.push({
        id: `alert-dep-${item.id}-1`,
        bookingId: item.id,
        transitType: item.type,
        serviceTitle: item.title,
        destination: item.destination,
        departureTime: depTime,
        scheduledAlert: 'T-1h Platform & Boarding Notice',
        urgency: 'upcoming',
        message: `Your train departs at ${depTime}. Proceed to Track 14. Seat reservation confirmed in ${item.details.classOrRoomType}.`,
        read: false,
        createdAt: '25 minutes ago',
        platformOrGate: 'Track 14 • Car 9 (Gran Class)',
      });

      alerts.push({
        id: `alert-dep-${item.id}-2`,
        bookingId: item.id,
        transitType: item.type,
        serviceTitle: item.title,
        destination: item.destination,
        departureTime: depTime,
        scheduledAlert: 'T-15m Final Boarding Call',
        urgency: 'critical',
        message: `Doors closing in 15 minutes for ${item.title}. Automated chime ringing on platform.`,
        read: false,
        createdAt: 'Just now',
        platformOrGate: 'Track 14',
      });
    } else {
      // Ship / Boat
      alerts.push({
        id: `alert-dep-${item.id}-1`,
        bookingId: item.id,
        transitType: item.type,
        serviceTitle: item.title,
        destination: item.destination,
        departureTime: depTime,
        scheduledAlert: 'T-45m Marina Docking Notice',
        urgency: 'upcoming',
        message: `Skipper is standing by at ${depTime}. Boarding at Positano Pier, Slip 4. Bring sunglasses & sun protection.`,
        read: false,
        createdAt: '30 minutes ago',
        platformOrGate: 'Pier Slip 4',
      });
    }
  });

  return alerts;
}

/**
 * Filter alerts by read status
 */
export function countUnreadAlerts(alerts: DepartureAlert[]): number {
  return alerts.filter((a) => !a.read).length;
}

/**
 * Creates a Tripadvisor-style Price Drop Alert notification entry for the unified Notification Center
 */
export function createPriceDropNotification(
  listing: Listing,
  oldPriceUsd: number,
  newPriceUsd: number,
  partnerName: string = 'AetherVoyage Direct'
): DepartureAlert {
  const dropUsd = Math.max(0, oldPriceUsd - newPriceUsd);
  const dropPct = oldPriceUsd > 0 ? Math.round((dropUsd / oldPriceUsd) * 100) : 0;

  return {
    id: `alert-pricedrop-${listing.id}-${Date.now()}`,
    bookingId: listing.id,
    transitType: listing.type,
    serviceTitle: listing.title,
    destination: listing.destination,
    departureTime: listing.details.departureTime || 'Flexible Dates',
    scheduledAlert: `PRICE DROP -${dropPct}% ($${dropUsd} OFF)`,
    urgency: 'price_drop',
    category: 'price_drop',
    oldPriceUsd,
    newPriceUsd,
    message: `Tripadvisor Price Monitor: ${listing.title} dropped from $${oldPriceUsd} to $${newPriceUsd} (-${dropPct}%) via ${partnerName}! Lock in this lowest rate now.`,
    read: false,
    createdAt: 'Just now',
    platformOrGate: `Save $${dropUsd} USD • ${partnerName}`,
  };
}

export interface DepartureProgress {
  remainingMinutes: number;
  formattedRemaining: string;
  percentElapsed: number; // 0 to 100%
  statusLabel: string;
  gradientClass: string;
  urgencyLevel: 'relaxed' | 'moderate' | 'imminent';
}

/**
 * Calculates time remaining and progress percentage relative to departure time with subtle gradient changes
 */
export function calculateDepartureProgress(
  departureTimeStr: string,
  nowDate: Date = new Date()
): DepartureProgress {
  let depHours = 10;
  let depMins = 0;

  const match = departureTimeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (match) {
    depHours = parseInt(match[1], 10);
    depMins = parseInt(match[2], 10);
    const ampm = match[3]?.toUpperCase();
    if (ampm === 'PM' && depHours < 12) depHours += 12;
    if (ampm === 'AM' && depHours === 12) depHours = 0;
  }

  const currentHours = nowDate.getHours();
  const currentMins = nowDate.getMinutes();

  const nowTotalMins = currentHours * 60 + currentMins;
  const depTotalMins = depHours * 60 + depMins;

  let diffMins = depTotalMins - nowTotalMins;
  if (diffMins <= 0) {
    diffMins += 1440; // 24h cycle
  }

  const windowMins = 360; // 6-hour check-in/departure window
  const elapsedMins = Math.max(0, windowMins - diffMins);
  const percentElapsed = Math.min(100, Math.max(10, Math.round((elapsedMins / windowMins) * 100)));

  const hoursLeft = Math.floor(diffMins / 60);
  const minsLeft = diffMins % 60;
  const formattedRemaining = hoursLeft > 0 ? `${hoursLeft}h ${minsLeft}m left` : `${minsLeft}m left`;

  let urgencyLevel: 'relaxed' | 'moderate' | 'imminent' = 'relaxed';
  let gradientClass = 'from-emerald-500 via-teal-400 to-cyan-500';
  let statusLabel = 'On Schedule • Check-in Open';

  if (diffMins <= 45) {
    urgencyLevel = 'imminent';
    gradientClass = 'from-amber-500 via-orange-500 to-rose-600 animate-pulse';
    statusLabel = 'Final Boarding Call • Gates Closing Soon';
  } else if (diffMins <= 120) {
    urgencyLevel = 'moderate';
    gradientClass = 'from-cyan-500 via-indigo-500 to-amber-500';
    statusLabel = 'Security & Gate Boarding Active';
  }

  return {
    remainingMinutes: diffMins,
    formattedRemaining,
    percentElapsed,
    statusLabel,
    gradientClass,
    urgencyLevel,
  };
}

