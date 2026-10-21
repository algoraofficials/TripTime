import type { Listing, TravelerReview, TravelerType, PriceDropSubscription } from '../types/travel.ts';

export interface ReviewStatsSummary {
  averageRating: number;
  totalReviews: number;
  distribution: {
    excellent: number; // 5 bubbles (%)
    veryGood: number;  // 4 bubbles (%)
    average: number;   // 3 bubbles (%)
    poor: number;      // 2 bubbles (%)
    terrible: number;  // 1 bubble (%)
  };
  counts: {
    excellent: number;
    veryGood: number;
    average: number;
    poor: number;
    terrible: number;
  };
  subAverages: {
    location: number;
    cleanliness: number;
    service: number;
    value: number;
  };
}

export interface ReviewFilterOptions {
  listingId?: string;
  travelerType?: TravelerType | 'ALL';
  minRating?: number;
  searchQuery?: string;
}

export interface OtaPartnerOffer {
  id: string;
  partnerName: string;
  partnerBadge: string;
  priceUsd: number;
  perks: string;
  isLowestPrice: boolean;
  savingsUsd: number;
  bookingChannel: 'direct' | 'ota';
}

export interface TravelersChoiceBadgeInfo {
  isWinner: boolean;
  tier: 'Best of the Best 2026' | 'Travelers Choice 2026' | null;
  percentileLabel: string;
}

/**
 * Computes Tripadvisor 5-bubble rating distribution and sub-rating averages
 */
export function calculateReviewStats(reviews: TravelerReview[]): ReviewStatsSummary {
  if (reviews.length === 0) {
    return {
      averageRating: 0,
      totalReviews: 0,
      distribution: { excellent: 0, veryGood: 0, average: 0, poor: 0, terrible: 0 },
      counts: { excellent: 0, veryGood: 0, average: 0, poor: 0, terrible: 0 },
      subAverages: { location: 0, cleanliness: 0, service: 0, value: 0 },
    };
  }

  const counts = {
    excellent: 0,
    veryGood: 0,
    average: 0,
    poor: 0,
    terrible: 0,
  };

  let sumRating = 0;
  let sumLocation = 0;
  let sumCleanliness = 0;
  let sumService = 0;
  let sumValue = 0;

  for (const r of reviews) {
    const rounded = Math.min(5, Math.max(1, Math.round(r.rating)));
    sumRating += r.rating;
    sumLocation += r.subRatings.location;
    sumCleanliness += r.subRatings.cleanliness;
    sumService += r.subRatings.service;
    sumValue += r.subRatings.value;

    if (rounded === 5) counts.excellent++;
    else if (rounded === 4) counts.veryGood++;
    else if (rounded === 3) counts.average++;
    else if (rounded === 2) counts.poor++;
    else counts.terrible++;
  }

  const total = reviews.length;
  const pct = (count: number) => Math.round((count / total) * 100);

  return {
    averageRating: Number((sumRating / total).toFixed(2)),
    totalReviews: total,
    distribution: {
      excellent: pct(counts.excellent),
      veryGood: pct(counts.veryGood),
      average: pct(counts.average),
      poor: pct(counts.poor),
      terrible: pct(counts.terrible),
    },
    counts,
    subAverages: {
      location: Number((sumLocation / total).toFixed(1)),
      cleanliness: Number((sumCleanliness / total).toFixed(1)),
      service: Number((sumService / total).toFixed(1)),
      value: Number((sumValue / total).toFixed(1)),
    },
  };
}

/**
 * Filters traveler reviews by listingId, TravelerType (Families, Couples, Solo, Business, Friends), rating, and keyword
 */
export function filterReviews(
  reviews: TravelerReview[],
  options: ReviewFilterOptions = {}
): TravelerReview[] {
  const { listingId, travelerType = 'ALL', minRating = 0, searchQuery = '' } = options;
  const normalizedQuery = searchQuery.trim().toLowerCase();

  return reviews.filter((r) => {
    if (listingId && listingId !== 'ALL' && r.listingId !== listingId) return false;
    if (travelerType !== 'ALL' && r.travelerType !== travelerType) return false;
    if (r.rating < minRating) return false;
    if (normalizedQuery) {
      const hay = `${r.title} ${r.comment} ${r.authorName} ${r.travelerType}`.toLowerCase();
      if (!hay.includes(normalizedQuery)) return false;
    }
    return true;
  });
}

/**
 * Generates Tripadvisor-style Multi-OTA Price Comparison deals for a listing
 */
export function generateOtaPriceComparison(listing: Listing): OtaPartnerOffer[] {
  const base = listing.priceUsd;
  const isExperience = listing.type === 'experience';
  const isRestaurant = listing.type === 'restaurant';

  const rawOffers = [
    {
      id: `${listing.id}-direct`,
      partnerName: `AetherVoyage BD Direct (${listing.provider.name})`,
      partnerBadge: 'Official Lowest Rate + Loyalty Points',
      priceUsd: base,
      perks: `${listing.details.cancellationPolicy} • bKash / Nagad / 10x Loyalty Points`,
      bookingChannel: 'direct' as const,
    },
    {
      id: `${listing.id}-ota-1`,
      partnerName: isExperience
        ? 'ShareTrip BD Experiences'
        : isRestaurant
        ? 'Foodi BD / Hungrynaki Reserve'
        : 'ShareTrip BD',
      partnerBadge: 'Verified BD OTA',
      priceUsd: Math.round(base * 1.06),
      perks: isRestaurant
        ? 'Instant Table Confirmation • Complimentary Welcome Drink'
        : 'bKash & City Bank Amex Accepted • Instant e-Voucher',
      bookingChannel: 'ota' as const,
    },
    {
      id: `${listing.id}-ota-2`,
      partnerName: isExperience
        ? 'GoZayaan Tours BD'
        : isRestaurant
        ? 'GoZayaan Dining Privileges'
        : 'GoZayaan',
      partnerBadge: 'Bangladesh OTA',
      priceUsd: Math.round(base * 1.11),
      perks: '0% EMI up to 6 Months • 24/7 Dhaka Support',
      bookingChannel: 'ota' as const,
    },
    {
      id: `${listing.id}-ota-3`,
      partnerName: isExperience
        ? 'BD Tour Operators Guild (TOAB)'
        : isRestaurant
        ? 'Dhaka Gastronomy Club'
        : 'Shohoz / Booking.com BD',
      partnerBadge: 'Partner Rate',
      priceUsd: Math.round(base * 1.14),
      perks: 'Standard Partner Cancellation Policy',
      bookingChannel: 'ota' as const,
    },
  ];

  const minPrice = Math.min(...rawOffers.map((o) => o.priceUsd));
  const maxPrice = Math.max(...rawOffers.map((o) => o.priceUsd));

  return rawOffers.map((offer) => ({
    ...offer,
    isLowestPrice: offer.priceUsd === minPrice,
    savingsUsd: Math.max(0, maxPrice - offer.priceUsd),
  }));
}

/**
 * Determines Tripadvisor Travelers' Choice Award tier
 */
export function getTravelersChoiceStatus(listing: Listing): TravelersChoiceBadgeInfo {
  if (listing.travelersChoiceAward === 'Best of the Best 2026' || (listing.rating >= 4.95 && listing.reviewCount >= 250)) {
    return {
      isWinner: true,
      tier: 'Best of the Best 2026',
      percentileLabel: 'Top 1% Worldwide • Travelers Choice Best of the Best',
    };
  }

  if (listing.travelersChoiceAward === 'Travelers Choice 2026' || listing.rating >= 4.88) {
    return {
      isWinner: true,
      tier: 'Travelers Choice 2026',
      percentileLabel: 'Top 10% Worldwide • Travelers Choice Winner',
    };
  }

  return {
    isWinner: false,
    tier: null,
    percentileLabel: 'Verified Global Partner',
  };
}

/**
 * Computes summary stats for a user's saved Tripadvisor-style "Trips" Wishlist Board
 */
export function calculateTripBoardSummary(listings: Listing[]): {
  totalItems: number;
  totalCostUsd: number;
  totalCarbonKg: number;
  categoriesCount: number;
} {
  const totalCostUsd = listings.reduce((sum, item) => sum + item.priceUsd, 0);
  const totalCarbonKg = listings.reduce((sum, item) => sum + (item.details.carbonOffsetKg ?? 0), 0);
  const uniqueModes = new Set(listings.map((item) => item.type));

  return {
    totalItems: listings.length,
    totalCostUsd,
    totalCarbonKg,
    categoriesCount: uniqueModes.size,
  };
}

export interface PriceDropMetrics {
  dropAmountUsd: number;
  dropPercentage: number;
  isDropDetected: boolean;
  meetsTargetThreshold: boolean;
}

/**
 * Computes price drop savings, percentage decrease, and whether a user's target threshold is met
 */
export function calculatePriceDropMetrics(
  baselinePriceUsd: number,
  currentPriceUsd: number,
  targetPriceUsd?: number
): PriceDropMetrics {
  const dropAmountUsd = Math.max(0, baselinePriceUsd - currentPriceUsd);
  const dropPercentage =
    baselinePriceUsd > 0 ? Math.round((dropAmountUsd / baselinePriceUsd) * 100) : 0;
  const isDropDetected = dropAmountUsd > 0;
  const effectiveTarget = targetPriceUsd ?? baselinePriceUsd - 1;
  const meetsTargetThreshold = isDropDetected && currentPriceUsd <= effectiveTarget;

  return {
    dropAmountUsd,
    dropPercentage,
    isDropDetected,
    meetsTargetThreshold,
  };
}

/**
 * Creates a default Price Drop Alert subscription for a listing (default target: 10% below current price)
 */
export function createDefaultPriceDropSubscription(
  listing: Listing,
  targetDiscountPct: number = 10
): PriceDropSubscription {
  const baseline = listing.originalPriceUsd ?? listing.priceUsd;
  const targetPriceUsd = Math.max(1, Math.round(listing.priceUsd * (1 - targetDiscountPct / 100)));

  return {
    id: `sub-price-${listing.id}`,
    listingId: listing.id,
    baselinePriceUsd: baseline,
    currentPriceUsd: listing.priceUsd,
    targetPriceUsd,
    notifyOnAnyDrop: true,
    createdAt: 'Active Monitor',
    isTriggered: listing.originalPriceUsd !== undefined && listing.priceUsd < listing.originalPriceUsd,
    winningPartner: `AetherVoyage Direct (${listing.provider.name})`,
  };
}

/**
 * Applies a simulated OTA / Direct price drop to a listing and updates its PriceDropSubscription
 */
export function applySimulatedPriceDrop(
  listing: Listing,
  existingSub?: PriceDropSubscription,
  dropPercent: number = 15
): {
  updatedListing: Listing;
  updatedSubscription: PriceDropSubscription;
  oldPriceUsd: number;
  newPriceUsd: number;
  savingsUsd: number;
  dropPct: number;
} {
  const baseline = listing.originalPriceUsd ?? existingSub?.baselinePriceUsd ?? listing.priceUsd;
  const oldPriceUsd = listing.priceUsd;
  const clampedPct = Math.min(50, Math.max(5, dropPercent));
  const newPriceUsd = Math.max(25, Math.round(oldPriceUsd * (1 - clampedPct / 100)));
  const totalSavingsUsd = Math.max(0, baseline - newPriceUsd);
  const totalDropPct = baseline > 0 ? Math.round((totalSavingsUsd / baseline) * 100) : clampedPct;

  const updatedListing: Listing = {
    ...listing,
    originalPriceUsd: baseline,
    priceUsd: newPriceUsd,
  };

  const baseSub = existingSub ?? createDefaultPriceDropSubscription(listing);
  const updatedSubscription: PriceDropSubscription = {
    ...baseSub,
    baselinePriceUsd: baseline,
    currentPriceUsd: newPriceUsd,
    lastAlertedDropPct: totalDropPct,
    isTriggered: true,
    winningPartner: `AetherVoyage Direct (${listing.provider.name})`,
  };

  return {
    updatedListing,
    updatedSubscription,
    oldPriceUsd,
    newPriceUsd,
    savingsUsd: Math.max(0, oldPriceUsd - newPriceUsd),
    dropPct: clampedPct,
  };
}

