import type { Listing } from '../types/travel.ts';

export type LoyaltyTier = 'Silver Explorer' | 'Gold Voyager' | 'Platinum Globetrotter';

export interface TierInfo {
  tier: LoyaltyTier;
  minPoints: number;
  maxPoints: number;
  multiplier: number;
  color: string;
  perks: string[];
}

export const LOYALTY_TIERS: Record<LoyaltyTier, TierInfo> = {
  'Silver Explorer': {
    tier: 'Silver Explorer',
    minPoints: 0,
    maxPoints: 2499,
    multiplier: 1.0,
    color: '#94a3b8',
    perks: ['Complimentary standard seat selection', 'Priority digital check-in', '1x points per $1 spent'],
  },
  'Gold Voyager': {
    tier: 'Gold Voyager',
    minPoints: 2500,
    maxPoints: 9999,
    multiplier: 1.25,
    color: '#f59e0b',
    perks: ['Airport & railway executive lounge access', '1.25x points multiplier', 'Free cancellation up to 12h', '10% spa & dining credits'],
  },
  'Platinum Globetrotter': {
    tier: 'Platinum Globetrotter',
    minPoints: 10000,
    maxPoints: Infinity,
    multiplier: 1.5,
    color: '#a855f7',
    perks: ['24/7 dedicated personal travel concierge', '1.5x points multiplier', 'Guaranteed room & transit upgrades', 'Complimentary private airport transfer'],
  },
};

export interface RedeemablePerk {
  id: string;
  title: string;
  description: string;
  pointsCost: number;
  category: 'transit' | 'hotel' | 'experience';
  code: string;
}

export const REDEEMABLE_PERKS: RedeemablePerk[] = [
  {
    id: 'perk-rail-upgrade',
    title: 'Bullet Train Gran Class Upgrade',
    description: 'Complimentary first-class car upgrade on Shinkansen or Eurostar lines.',
    pointsCost: 2500,
    category: 'transit',
    code: 'UPGRADE-GRAN-2026',
  },
  {
    id: 'perk-hotel-breakfast',
    title: '5-Star Hotel Breakfast & Spa Day Pass',
    description: 'Full buffet breakfast and complimentary thermal onsen access for 2 guests.',
    pointsCost: 1800,
    category: 'hotel',
    code: 'SPA-BUFFET-VIP',
  },
  {
    id: 'perk-flight-credit-50',
    title: '$50 Global Flight Discount Voucher',
    description: 'Instant discount applied at checkout on any international or domestic flight.',
    pointsCost: 3500,
    category: 'transit',
    code: 'FLIGHT-CREDIT-50',
  },
  {
    id: 'perk-yacht-sunset',
    title: 'Private Yacht Sunset Champagne Upgrade',
    description: 'Complimentary bottle of Laurent-Perrier on any chartered catamaran cruise.',
    pointsCost: 4000,
    category: 'experience',
    code: 'YACHT-CHAMP-LUX',
  },
];

export interface LoyaltyLedgerEntry {
  id: string;
  bookingTitle: string;
  pointsEarned: number;
  date: string;
  baseAmountUsd: number;
  bonusReason?: string;
}

/**
 * Calculates points earned for a booking: 10 pts per $1, plus eco bonus for low-carbon travel
 */
export function calculatePointsForBooking(booking: Listing): { points: number; bonus: string } {
  const basePoints = Math.round(booking.priceUsd * 10);
  let bonusPoints = 0;
  let bonusReason = '';

  // Eco transit bonus: Trains and electric ships get 250 bonus points
  if (booking.type === 'train' || (booking.type === 'ship' && (booking.details.carbonOffsetKg ?? 10) === 0)) {
    bonusPoints = 250;
    bonusReason = 'Green Transit Eco Bonus';
  } else if ((booking.details.carbonOffsetKg ?? 100) < 15) {
    bonusPoints = 150;
    bonusReason = 'Low-Emission Certified';
  }

  return {
    points: basePoints + bonusPoints,
    bonus: bonusReason,
  };
}

/**
 * Determines current tier and progress percentage based on total points
 */
export function getTierProgress(totalPoints: number): {
  currentTier: LoyaltyTier;
  nextTier: LoyaltyTier | null;
  progressPercent: number;
  pointsToNextTier: number;
} {
  if (totalPoints >= 10000) {
    return {
      currentTier: 'Platinum Globetrotter',
      nextTier: null,
      progressPercent: 100,
      pointsToNextTier: 0,
    };
  }

  if (totalPoints >= 2500) {
    const range = 10000 - 2500;
    const progress = totalPoints - 2500;
    return {
      currentTier: 'Gold Voyager',
      nextTier: 'Platinum Globetrotter',
      progressPercent: Math.min(100, Math.round((progress / range) * 100)),
      pointsToNextTier: 10000 - totalPoints,
    };
  }

  // Silver Explorer
  const range = 2500;
  return {
    currentTier: 'Silver Explorer',
    nextTier: 'Gold Voyager',
    progressPercent: Math.min(100, Math.round((totalPoints / range) * 100)),
    pointsToNextTier: 2500 - totalPoints,
  };
}
