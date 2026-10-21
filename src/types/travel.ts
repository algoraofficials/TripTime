import { SupportedCurrency } from '../utils/currency';

export type TransitMode = 'hotel' | 'flight' | 'train' | 'ship' | 'experience' | 'restaurant';

export type TravelerType = 'Families' | 'Couples' | 'Solo' | 'Business' | 'Friends';

export interface TravelerReview {
  id: string;
  listingId: string;
  authorName: string;
  authorAvatar: string;
  authorHome: string;
  contributionsCount: number;
  rating: number; // 1 to 5 bubbles
  travelerType: TravelerType;
  visitDate: string;
  title: string;
  comment: string;
  helpfulCount: number;
  subRatings: {
    location: number;
    cleanliness: number;
    service: number;
    value: number;
  };
  photos?: string[];
  ownerResponse?: {
    responderTitle: string;
    responseDate: string;
    message: string;
  };
}

export interface CommunityQuestion {
  id: string;
  listingId: string;
  authorName: string;
  authorAvatar: string;
  askedAt: string;
  question: string;
  answers: Array<{
    id: string;
    responderName: string;
    responderBadge: string;
    answeredAt: string;
    answerText: string;
    helpfulVotes: number;
  }>;
}

export interface TripBoard {
  id: string;
  name: string;
  description: string;
  targetDate: string;
  listingIds: string[];
  notes: string;
}

export interface PriceDropSubscription {
  id: string;
  listingId: string;
  baselinePriceUsd: number;
  currentPriceUsd: number;
  targetPriceUsd: number;
  notifyOnAnyDrop: boolean;
  createdAt: string;
  lastAlertedDropPct?: number;
  isTriggered: boolean;
  winningPartner: string;
}

export interface Listing {
  id: string;
  type: TransitMode;
  title: string;
  tagline: string;
  destination: string;
  division?: string;
  originHub?: string;
  country: string;
  priceUsd: number;
  originalPriceUsd?: number;
  rating: number;
  reviewCount: number;
  imageUrl: string;
  badge?: string;
  starRating?: 3 | 4 | 5;
  propertyType?: 'Beach Resort' | 'Tea Garden Resort' | 'Hilltop Eco-Resort' | 'City Luxury Hotel' | 'Budget Residential Hotel' | 'Heritage Palace';
  localPaymentMethods?: string[];
  travelersChoiceAward?: 'Best of the Best 2026' | 'Travelers Choice 2026';
  provider: {
    name: string;
    verified: boolean;
    avatar: string;
  };
  details: {
    durationOrNights?: string;
    classOrRoomType: string;
    departureTime?: string;
    arrivalTime?: string;
    capacity: number;
    amenities: string[];
    carbonOffsetKg?: number;
    cancellationPolicy: 'Free cancellation 24h' | 'Flexible' | 'Non-refundable';
    cuisineOrCategory?: string;
  };
}

export interface OfflinePack {
  id: string;
  name: string;
  region: string;
  country: string;
  sizeMb: number;
  version: string;
  isDownloaded: boolean;
  downloadProgress?: number;
  poisCount: number;
  routesCount: number;
  emergencyHotlines: Array<{ label: string; number: string }>;
  pois: Array<{
    id: string;
    name: string;
    type: 'station' | 'hospital' | 'embassy' | 'landmark' | 'wifi';
    x: number; // percentage in canvas map (0-100)
    y: number; // percentage in canvas map (0-100)
    description: string;
  }>;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  modelUsed?: string;
  timestamp: string;
  isThinking?: boolean;
}

export type UserRole = 'traveller' | 'vendor' | 'compliance_auditor';

export type LanguageCode = 'bn' | 'en' | 'es' | 'fr' | 'de' | 'ja' | 'zh' | 'ar' | 'pt';

export interface WalletTransaction {
  id: string;
  referenceCode: string;
  title: string;
  category: TransitMode | 'topup' | 'cashback';
  type: 'debit' | 'credit';
  amountUsd: number;
  paymentMethod: string;
  timestamp: string;
  status: 'Completed' | 'Settled';
  bookingRef?: string;
}

export interface DigitalBoardingPass {
  id: string;
  pnrCode: string;
  listingId: string;
  title: string;
  transitMode: TransitMode;
  origin: string;
  destination: string;
  departureTime: string;
  seatOrCabin: string;
  gateOrPlatform: string;
  passengerName: string;
  classOrRoomType: string;
  priceUsd: number;
  issuedAt: string;
  status: 'Active Pass' | 'Checked In' | 'Confirmed';
}


