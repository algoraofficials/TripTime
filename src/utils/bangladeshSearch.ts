import type { Listing, TransitMode } from '../types/travel.ts';
import { getTravelersChoiceStatus } from './tripadvisorFeatures.ts';

export type SortOption =
  | 'recommended'
  | 'price_asc'
  | 'price_desc'
  | 'rating_desc'
  | 'reviews_desc';

export interface SearchFilterCriteria {
  mode: TransitMode | 'all';
  searchQuery: string;
  division: string;
  destinationDistrict: string;
  originHub: string;
  maxPriceUsd: number;
  minRating: number;
  guestsCount: number;
  roomsCount: number;
  hotelStarRating: number | 'all';
  hotelPropertyType: string;
  selectedAmenities: string[];
  paymentMethodFilter: string;
  freeCancellationOnly: boolean;
  travelersChoiceOnly: boolean;
  sortBy: SortOption;
}

export const DEFAULT_SEARCH_CRITERIA: SearchFilterCriteria = {
  mode: 'all',
  searchQuery: '',
  division: 'all',
  destinationDistrict: 'all',
  originHub: 'all',
  maxPriceUsd: 500,
  minRating: 0,
  guestsCount: 2,
  roomsCount: 1,
  hotelStarRating: 'all',
  hotelPropertyType: 'all',
  selectedAmenities: [],
  paymentMethodFilter: 'all',
  freeCancellationOnly: false,
  travelersChoiceOnly: false,
  sortBy: 'recommended',
};

export const BANGLADESH_DIVISIONS = [
  'all',
  'Chattogram',
  'Sylhet',
  'Dhaka',
  'Khulna',
  'Barishal',
  'Rajshahi',
  'Rangpur',
];

export const BANGLADESH_DESTINATIONS = [
  'all',
  "Cox's Bazar",
  'Sreemangal / Sylhet',
  'Bandarban',
  'Sajek Valley / Rangamati',
  'Dhaka',
  "Saint Martin's Island",
  'Sundarbans / Khulna',
  'Chattogram',
  'Kuakata',
];

export const BANGLADESH_ORIGIN_HUBS = [
  'all',
  'Dhaka (DAC / Kamalapur / Sadarghat)',
  'Chattogram (CGP / Station / Patenga)',
  "Cox's Bazar (CXB / Iconic Station)",
  'Sylhet (ZYL / Sylhet Station)',
  'Khulna (Mongla / Rupsha)',
];

export const HOTEL_PROPERTY_TYPES = [
  'all',
  'Beach Resort',
  'Tea Garden Resort',
  'Hilltop Eco-Resort',
  'City Luxury Hotel',
  'Budget Residential Hotel',
  'Heritage Palace',
];

export const POPULAR_BD_AMENITIES = [
  'Swimming Pool',
  'Complimentary Breakfast',
  'Sea / Hill View',
  'Halal Dining',
  'Couple Friendly (NID)',
  'Airport / Station Transfer',
  'Fast Wi-Fi',
  'AC Suite / Cabin',
];

export const BD_PAYMENT_METHODS = [
  'all',
  'bKash',
  'Nagad',
  'City Bank Amex / Visa',
  '0% EMI Available',
];

/**
 * Filters and sorts Bangladesh listings across Hotels, Flights, Bangladesh Railway,
 * River Launches/Cruises, Things to Do, and Local Restaurants.
 */
export function filterAndSortBangladeshListings(
  listings: Listing[],
  criteria: SearchFilterCriteria
): Listing[] {
  const filtered = listings.filter((item) => {
    // 1. Category / Mode filter
    if (criteria.mode !== 'all' && item.type !== criteria.mode) {
      return false;
    }

    // 2. Division filter
    if (
      criteria.division !== 'all' &&
      item.division?.toLowerCase() !== criteria.division.toLowerCase()
    ) {
      return false;
    }

    // 3. Destination District filter
    if (criteria.destinationDistrict !== 'all') {
      const target = criteria.destinationDistrict.toLowerCase();
      const destMatch = item.destination.toLowerCase().includes(target);
      const titleMatch = item.title.toLowerCase().includes(target);
      // Handle composite labels like "Sreemangal / Sylhet"
      const tokens = target.split('/').map((t) => t.trim());
      const tokenMatch = tokens.some(
        (tok) =>
          item.destination.toLowerCase().includes(tok) ||
          item.title.toLowerCase().includes(tok) ||
          (item.division && item.division.toLowerCase().includes(tok))
      );
      if (!destMatch && !titleMatch && !tokenMatch) {
        return false;
      }
    }

    // 4. Origin Hub filter
    if (criteria.originHub !== 'all') {
      const hubPrefix = criteria.originHub.split('(')[0].trim().toLowerCase();
      const itemOrigin = (item.originHub || '').toLowerCase();
      const itemTitle = item.title.toLowerCase();
      const itemDest = item.destination.toLowerCase();
      if (
        !itemOrigin.includes(hubPrefix) &&
        !itemTitle.includes(hubPrefix) &&
        !itemDest.includes(hubPrefix)
      ) {
        return false;
      }
    }

    // 5. Keyword Search (Title, Destination, Division, Tagline, Amenities, Provider, Room/Class)
    if (criteria.searchQuery.trim() !== '') {
      const q = criteria.searchQuery.trim().toLowerCase();
      const searchableBlob = [
        item.title,
        item.tagline,
        item.destination,
        item.division || '',
        item.originHub || '',
        item.country,
        item.provider.name,
        item.details.classOrRoomType,
        item.details.cuisineOrCategory || '',
        item.propertyType || '',
        ...(item.localPaymentMethods || []),
        ...item.details.amenities,
      ]
        .join(' ')
        .toLowerCase();

      if (!searchableBlob.includes(q)) {
        return false;
      }
    }

    // 6. Max Price (USD base, automatically mapped to BDT in UI)
    if (item.priceUsd > criteria.maxPriceUsd) {
      return false;
    }

    // 7. Minimum Bubble Rating
    if (criteria.minRating > 0 && item.rating < criteria.minRating) {
      return false;
    }

    // 8. Hotel Star Rating (applies when filtering hotels or when star rating is set)
    if (criteria.hotelStarRating !== 'all') {
      if (item.type === 'hotel' && item.starRating !== criteria.hotelStarRating) {
        return false;
      }
    }

    // 9. Hotel Property Type
    if (criteria.hotelPropertyType !== 'all') {
      if (
        !item.propertyType ||
        item.propertyType.toLowerCase() !== criteria.hotelPropertyType.toLowerCase()
      ) {
        return false;
      }
    }

    // 10. Multi-Amenity filter
    if (criteria.selectedAmenities.length > 0) {
      const itemAmenityBlob = [
        ...item.details.amenities,
        item.tagline,
        item.details.classOrRoomType,
        ...(item.localPaymentMethods || []),
      ]
        .join(' ')
        .toLowerCase();

      for (const reqAmenity of criteria.selectedAmenities) {
        // Match either full phrase or key token (e.g. "Sea / Hill View" -> matches "sea", "hill", or "view")
        const clean = reqAmenity.toLowerCase();
        if (clean === 'sea / hill view') {
          if (
            !itemAmenityBlob.includes('sea') &&
            !itemAmenityBlob.includes('hill') &&
            !itemAmenityBlob.includes('beach') &&
            !itemAmenityBlob.includes('view')
          ) {
            return false;
          }
        } else if (clean === 'ac suite / cabin') {
          if (
            !itemAmenityBlob.includes('ac') &&
            !itemAmenityBlob.includes('suite') &&
            !itemAmenityBlob.includes('cabin') &&
            !itemAmenityBlob.includes('snigdha')
          ) {
            return false;
          }
        } else if (clean === 'airport / station transfer') {
          if (
            !itemAmenityBlob.includes('transfer') &&
            !itemAmenityBlob.includes('pickup') &&
            !itemAmenityBlob.includes('shuttle')
          ) {
            return false;
          }
        } else if (!itemAmenityBlob.includes(clean)) {
          return false;
        }
      }
    }

    // 11. Local Bangladesh Payment Method filter (bKash, Nagad, City Bank Amex, 0% EMI)
    if (criteria.paymentMethodFilter !== 'all') {
      const paymentBlob = (item.localPaymentMethods || []).join(' ').toLowerCase();
      if (!paymentBlob.includes(criteria.paymentMethodFilter.toLowerCase())) {
        return false;
      }
    }

    // 12. Free Cancellation filter
    if (
      criteria.freeCancellationOnly &&
      item.details.cancellationPolicy !== 'Free cancellation 24h'
    ) {
      return false;
    }

    // 13. Travelers' Choice 2026 filter
    if (criteria.travelersChoiceOnly && !getTravelersChoiceStatus(item).isWinner) {
      return false;
    }

    return true;
  });

  // Sort results
  const sorted = [...filtered];
  switch (criteria.sortBy) {
    case 'price_asc':
      sorted.sort((a, b) => a.priceUsd - b.priceUsd);
      break;
    case 'price_desc':
      sorted.sort((a, b) => b.priceUsd - a.priceUsd);
      break;
    case 'rating_desc':
      sorted.sort((a, b) => b.rating - a.rating);
      break;
    case 'reviews_desc':
      sorted.sort((a, b) => b.reviewCount - a.reviewCount);
      break;
    case 'recommended':
    default:
      break;
  }

  return sorted;
}

/**
 * Counts how many active search filters differ from defaults
 */
export function countActiveSearchFilters(criteria: SearchFilterCriteria): number {
  let count = 0;
  if (criteria.mode !== 'all') count++;
  if (criteria.searchQuery.trim() !== '') count++;
  if (criteria.division !== 'all') count++;
  if (criteria.destinationDistrict !== 'all') count++;
  if (criteria.originHub !== 'all') count++;
  if (criteria.maxPriceUsd < 500) count++;
  if (criteria.minRating > 0) count++;
  if (criteria.hotelStarRating !== 'all') count++;
  if (criteria.hotelPropertyType !== 'all') count++;
  if (criteria.selectedAmenities.length > 0) count += criteria.selectedAmenities.length;
  if (criteria.paymentMethodFilter !== 'all') count++;
  if (criteria.freeCancellationOnly) count++;
  if (criteria.travelersChoiceOnly) count++;
  if (criteria.sortBy !== 'recommended') count++;
  return count;
}
