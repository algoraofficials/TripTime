import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateReviewStats,
  filterReviews,
  generateOtaPriceComparison,
  getTravelersChoiceStatus,
  calculateTripBoardSummary,
  calculatePriceDropMetrics,
  createDefaultPriceDropSubscription,
  applySimulatedPriceDrop,
} from './tripadvisorFeatures.ts';
import type { Listing, TravelerReview } from '../types/travel.ts';

const sampleReviews: TravelerReview[] = [
  {
    id: 'rev-1',
    listingId: 'hotel-kyoto-onsen',
    authorName: 'Elena Rostova',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
    authorHome: 'Zurich, Switzerland',
    contributionsCount: 48,
    rating: 5,
    travelerType: 'Couples',
    visitDate: 'October 2026',
    title: 'Unforgettable riverboat arrival and private cedar onsen',
    comment: 'The boat transfer along the Oi River felt magical. Kaiseki dinner was Michelin quality.',
    helpfulCount: 19,
    subRatings: { location: 5.0, cleanliness: 5.0, service: 5.0, value: 4.8 },
  },
  {
    id: 'rev-2',
    listingId: 'hotel-kyoto-onsen',
    authorName: 'David Chen',
    authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
    authorHome: 'Vancouver, Canada',
    contributionsCount: 112,
    rating: 4,
    travelerType: 'Families',
    visitDate: 'September 2026',
    title: 'Serene forest sanctuary for our family trip',
    comment: 'Kids loved the morning tea ceremony and bamboo grove walk.',
    helpfulCount: 8,
    subRatings: { location: 4.8, cleanliness: 5.0, service: 4.6, value: 4.2 },
  },
];

const sampleListing: Listing = {
  id: 'hotel-kyoto-onsen',
  type: 'hotel',
  title: 'Hoshinoya Kyoto Riverfront Sanctuary',
  tagline: 'Riverside ryokan',
  destination: 'Kyoto',
  country: 'Japan',
  priceUsd: 640,
  rating: 4.96,
  reviewCount: 384,
  imageUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e',
  provider: {
    name: 'Hoshinoya Resorts Japan',
    verified: true,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
  },
  details: {
    durationOrNights: '1 night / stay',
    classOrRoomType: 'Mizunone Riverside Suite',
    capacity: 3,
    amenities: ['Private Forest Onsen', 'Kaiseki Dinner Included'],
    carbonOffsetKg: 12,
    cancellationPolicy: 'Free cancellation 24h',
  },
};

test('calculates 5-bubble review distribution and sub-rating averages accurately', () => {
  const stats = calculateReviewStats(sampleReviews);
  assert.equal(stats.totalReviews, 2);
  assert.equal(stats.averageRating, 4.5);
  assert.equal(stats.distribution.excellent, 50);
  assert.equal(stats.distribution.veryGood, 50);
  assert.equal(stats.subAverages.cleanliness, 5.0);
  assert.equal(stats.subAverages.location, 4.9);
});

test('filters reviews by travelerType and search keyword', () => {
  const couplesOnly = filterReviews(sampleReviews, { travelerType: 'Couples' });
  assert.equal(couplesOnly.length, 1);
  assert.equal(couplesOnly[0].authorName, 'Elena Rostova');

  const keywordSearch = filterReviews(sampleReviews, { searchQuery: 'bamboo' });
  assert.equal(keywordSearch.length, 1);
  assert.equal(keywordSearch[0].authorName, 'David Chen');
});

test('generates multi-OTA price comparison deals with lowest rate flagged and savings computed', () => {
  const deals = generateOtaPriceComparison(sampleListing);
  assert.equal(deals.length, 4);
  const lowest = deals.find((d) => d.isLowestPrice);
  assert.ok(lowest);
  assert.equal(lowest.priceUsd, 640);
  assert.ok(lowest.savingsUsd > 0);
});

test('identifies Travelers Choice Best of the Best 2026 award status', () => {
  const status = getTravelersChoiceStatus(sampleListing);
  assert.equal(status.isWinner, true);
  assert.equal(status.tier, 'Best of the Best 2026');
});

test('computes Trip Board budget and sustainability summary', () => {
  const summary = calculateTripBoardSummary([sampleListing]);
  assert.equal(summary.totalItems, 1);
  assert.equal(summary.totalCostUsd, 640);
  assert.equal(summary.totalCarbonKg, 12);
  assert.equal(summary.categoriesCount, 1);
});

test('calculates Price Drop Alert metrics and threshold detection accurately', () => {
  const metrics = calculatePriceDropMetrics(640, 544, 580);
  assert.equal(metrics.dropAmountUsd, 96);
  assert.equal(metrics.dropPercentage, 15);
  assert.equal(metrics.isDropDetected, true);
  assert.equal(metrics.meetsTargetThreshold, true);
});

test('applies simulated price drop and marks subscription as triggered', () => {
  const sub = createDefaultPriceDropSubscription(sampleListing, 10);
  assert.equal(sub.isTriggered, false);
  assert.equal(sub.baselinePriceUsd, 640);

  const result = applySimulatedPriceDrop(sampleListing, sub, 15);
  assert.equal(result.oldPriceUsd, 640);
  assert.equal(result.newPriceUsd, 544);
  assert.equal(result.savingsUsd, 96);
  assert.equal(result.updatedListing.originalPriceUsd, 640);
  assert.equal(result.updatedListing.priceUsd, 544);
  assert.equal(result.updatedSubscription.isTriggered, true);
  assert.equal(result.updatedSubscription.currentPriceUsd, 544);
});

