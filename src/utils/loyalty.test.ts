import test from 'node:test';
import assert from 'node:assert/strict';
import { calculatePointsForBooking, getTierProgress } from './loyalty.ts';
import type { Listing } from '../types/travel.ts';

const mockTrain: Listing = {
  id: 'test-train',
  type: 'train',
  title: 'Shinkansen Bullet Train',
  tagline: 'Fast rail',
  destination: 'Kyoto',
  country: 'Japan',
  priceUsd: 135,
  rating: 4.9,
  reviewCount: 10,
  imageUrl: '',
  provider: { name: 'JR', verified: true, avatar: '' },
  details: {
    classOrRoomType: 'Gran Class',
    capacity: 1,
    amenities: [],
    carbonOffsetKg: 5,
    cancellationPolicy: 'Free cancellation 24h',
  },
};

const mockFlight: Listing = {
  id: 'test-flight',
  type: 'flight',
  title: 'Flight Paris',
  tagline: 'International',
  destination: 'Paris',
  country: 'France',
  priceUsd: 800,
  rating: 4.8,
  reviewCount: 50,
  imageUrl: '',
  provider: { name: 'SkyAir', verified: true, avatar: '' },
  details: {
    classOrRoomType: 'Business',
    capacity: 1,
    amenities: [],
    carbonOffsetKg: 300,
    cancellationPolicy: 'Flexible',
  },
};

test('calculates loyalty points with green transit bonus for trains', () => {
  // Train: 135 * 10 = 1350 + 250 eco bonus = 1600 pts
  const result = calculatePointsForBooking(mockTrain);
  assert.equal(result.points, 1600);
  assert.equal(result.bonus, 'Green Transit Eco Bonus');
});

test('calculates base loyalty points for flights', () => {
  // Flight: 800 * 10 = 8000 pts (no eco bonus since carbon offset is 300kg)
  const result = calculatePointsForBooking(mockFlight);
  assert.equal(result.points, 8000);
});

test('computes tier progression from Silver to Gold', () => {
  const silverProgress = getTierProgress(1250);
  assert.equal(silverProgress.currentTier, 'Silver Explorer');
  assert.equal(silverProgress.nextTier, 'Gold Voyager');
  assert.equal(silverProgress.progressPercent, 50);
  assert.equal(silverProgress.pointsToNextTier, 1250);
});

test('computes Gold to Platinum progression and max tier', () => {
  const goldProgress = getTierProgress(6250);
  assert.equal(goldProgress.currentTier, 'Gold Voyager');
  assert.equal(goldProgress.nextTier, 'Platinum Globetrotter');
  assert.equal(goldProgress.pointsToNextTier, 3750);

  const platinumProgress = getTierProgress(15000);
  assert.equal(platinumProgress.currentTier, 'Platinum Globetrotter');
  assert.equal(platinumProgress.nextTier, null);
  assert.equal(platinumProgress.progressPercent, 100);
});
