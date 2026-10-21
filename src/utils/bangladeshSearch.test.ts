import test from 'node:test';
import assert from 'node:assert/strict';
import {
  filterAndSortBangladeshListings,
  countActiveSearchFilters,
  DEFAULT_SEARCH_CRITERIA,
} from './bangladeshSearch.ts';
import type { Listing } from '../types/travel.ts';

const sampleBangladeshListings: Listing[] = [
  {
    id: 'hotel-coxs-sayeman',
    type: 'hotel',
    title: 'Sayeman Beach Resort & Infinity Pool Suites',
    tagline: 'Iconic oceanfront luxury resort on Marine Drive overlooking the Bay of Bengal in Cox’s Bazar',
    destination: "Cox's Bazar",
    division: 'Chattogram',
    originHub: 'Dhaka / Chattogram',
    country: 'Bangladesh',
    priceUsd: 120,
    rating: 4.96,
    reviewCount: 640,
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e',
    starRating: 5,
    propertyType: 'Beach Resort',
    localPaymentMethods: ['bKash', 'Nagad', 'City Bank Amex / Visa', '0% EMI Available'],
    provider: { name: 'Sayeman Hospitality BD', verified: true, avatar: '' },
    details: {
      classOrRoomType: 'Panorama Oceanfront Infinity Suite',
      capacity: 4,
      amenities: [
        'Swimming Pool',
        'Complimentary Breakfast',
        'Sea / Hill View',
        'Halal Dining',
        'Couple Friendly (NID)',
        'Airport / Station Transfer',
        'Fast Wi-Fi',
      ],
      cancellationPolicy: 'Free cancellation 24h',
    },
  },
  {
    id: 'hotel-sylhet-sultan',
    type: 'hotel',
    title: 'Grand Sultan Tea Resort & Golf Sreemangal',
    tagline: '5-star luxury sanctuary nestled amidst 135 acres of lush green tea estates in Sylhet Division',
    destination: 'Sreemangal, Sylhet',
    division: 'Sylhet',
    originHub: 'Dhaka',
    country: 'Bangladesh',
    priceUsd: 145,
    rating: 4.95,
    reviewCount: 520,
    imageUrl: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb',
    starRating: 5,
    propertyType: 'Tea Garden Resort',
    localPaymentMethods: ['bKash', 'Nagad', 'City Bank Amex / Visa'],
    provider: { name: 'Grand Sultan Resorts BD', verified: true, avatar: '' },
    details: {
      classOrRoomType: 'King Raja Tea Estate Suite',
      capacity: 3,
      amenities: [
        'Swimming Pool',
        'Complimentary Breakfast',
        'Halal Dining',
        'Fast Wi-Fi',
        '9-Hole Golf Course',
      ],
      cancellationPolicy: 'Free cancellation 24h',
    },
  },
  {
    id: 'train-sonar-bangla',
    type: 'train',
    title: 'Sonar Bangla Express (788): Dhaka Kamalapur → Chattogram',
    tagline: 'Premier non-stop Bangladesh Railway intercity express with AC Snigdha & Executive Berths',
    destination: 'Chattogram',
    division: 'Chattogram',
    originHub: 'Dhaka (Kamalapur)',
    country: 'Bangladesh',
    priceUsd: 15,
    rating: 4.92,
    reviewCount: 1850,
    imageUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26',
    localPaymentMethods: ['bKash', 'Nagad'],
    provider: { name: 'Bangladesh Railway Official', verified: true, avatar: '' },
    details: {
      classOrRoomType: 'AC Snigdha / AC Berth',
      capacity: 1,
      amenities: ['AC Suite / Cabin', 'Halal Dining', 'Onboard Steward'],
      cancellationPolicy: 'Flexible',
    },
  },
];

test('filters Bangladesh hotels by division, propertyType, and amenities', () => {
  const results = filterAndSortBangladeshListings(sampleBangladeshListings, {
    ...DEFAULT_SEARCH_CRITERIA,
    mode: 'hotel',
    division: 'Chattogram',
    hotelPropertyType: 'Beach Resort',
    selectedAmenities: ['Swimming Pool', 'Airport / Station Transfer'],
  });

  assert.equal(results.length, 1);
  assert.equal(results[0].id, 'hotel-coxs-sayeman');
});

test('filters across all Bangladesh locations by keyword and local payment method (bKash / 0% EMI)', () => {
  const emiResults = filterAndSortBangladeshListings(sampleBangladeshListings, {
    ...DEFAULT_SEARCH_CRITERIA,
    paymentMethodFilter: '0% EMI Available',
  });
  assert.equal(emiResults.length, 1);
  assert.equal(emiResults[0].id, 'hotel-coxs-sayeman');

  const railResults = filterAndSortBangladeshListings(sampleBangladeshListings, {
    ...DEFAULT_SEARCH_CRITERIA,
    searchQuery: 'Kamalapur',
  });
  assert.equal(railResults.length, 1);
  assert.equal(railResults[0].id, 'train-sonar-bangla');
});

test('sorts Bangladesh listings by price ascending and descending accurately', () => {
  const asc = filterAndSortBangladeshListings(sampleBangladeshListings, {
    ...DEFAULT_SEARCH_CRITERIA,
    sortBy: 'price_asc',
  });
  assert.equal(asc[0].id, 'train-sonar-bangla');
  assert.equal(asc[2].id, 'hotel-sylhet-sultan');

  const desc = filterAndSortBangladeshListings(sampleBangladeshListings, {
    ...DEFAULT_SEARCH_CRITERIA,
    sortBy: 'price_desc',
  });
  assert.equal(desc[0].id, 'hotel-sylhet-sultan');
});

test('counts active search filters accurately', () => {
  const count = countActiveSearchFilters({
    ...DEFAULT_SEARCH_CRITERIA,
    mode: 'hotel',
    division: 'Sylhet',
    selectedAmenities: ['Swimming Pool', 'Halal Dining'],
    freeCancellationOnly: true,
  });
  assert.equal(count, 5);
});
