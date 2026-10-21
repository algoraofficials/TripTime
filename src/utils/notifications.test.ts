import test from 'node:test';
import assert from 'node:assert/strict';
import { generateDepartureAlerts, countUnreadAlerts, createPriceDropNotification, calculateDepartureProgress } from './notifications.ts';
import type { Listing } from '../types/travel.ts';

const mockBookings: Listing[] = [
  {
    id: 'flight-1',
    type: 'flight',
    title: 'Tokyo to Paris CDG',
    tagline: 'Flagship flight',
    destination: 'Paris',
    country: 'France',
    priceUsd: 1100,
    rating: 4.9,
    reviewCount: 120,
    imageUrl: 'https://example.com/flight.jpg',
    provider: { name: 'AirFrance', verified: true, avatar: '' },
    details: {
      departureTime: '22:15 HND',
      classOrRoomType: 'Business Class',
      capacity: 1,
      amenities: [],
      cancellationPolicy: 'Free cancellation 24h',
    },
  },
  {
    id: 'hotel-1',
    type: 'hotel',
    title: 'Kyoto Ryokan',
    tagline: 'Quiet onsen',
    destination: 'Kyoto',
    country: 'Japan',
    priceUsd: 500,
    rating: 4.9,
    reviewCount: 80,
    imageUrl: 'https://example.com/hotel.jpg',
    provider: { name: 'Ryokan', verified: true, avatar: '' },
    details: {
      classOrRoomType: 'Deluxe Suite',
      capacity: 2,
      amenities: [],
      cancellationPolicy: 'Free cancellation 24h',
    },
  },
  {
    id: 'train-1',
    type: 'train',
    title: 'Shinkansen Tokyo to Kyoto',
    tagline: 'Bullet train',
    destination: 'Kyoto',
    country: 'Japan',
    priceUsd: 135,
    rating: 5.0,
    reviewCount: 200,
    imageUrl: 'https://example.com/train.jpg',
    provider: { name: 'JR Central', verified: true, avatar: '' },
    details: {
      departureTime: '08:00 Tokyo Central',
      classOrRoomType: 'Gran Class',
      capacity: 1,
      amenities: [],
      cancellationPolicy: 'Free cancellation 24h',
    },
  },
];

test('generates departure alerts only for transit bookings (flights, trains, ships)', () => {
  const alerts = generateDepartureAlerts(mockBookings);
  // Flight generates 2 alerts, Train generates 2 alerts, Hotel generates 0
  assert.equal(alerts.length, 4);

  const flightAlert = alerts.find((a) => a.transitType === 'flight');
  assert.ok(flightAlert);
  assert.ok(flightAlert.departureTime.includes('22:15'));

  const trainAlert = alerts.find((a) => a.transitType === 'train');
  assert.ok(trainAlert);
  assert.ok(trainAlert.departureTime.includes('08:00'));
});

test('counts unread departure alerts accurately', () => {
  const alerts = generateDepartureAlerts(mockBookings);
  assert.equal(countUnreadAlerts(alerts), 4);

  alerts[0].read = true;
  assert.equal(countUnreadAlerts(alerts), 3);
});

test('creates a structured Price Drop Alert notification with percentage and dollar savings', () => {
  const alert = createPriceDropNotification(mockBookings[1], 500, 425, 'Booking.com');
  assert.equal(alert.category, 'price_drop');
  assert.equal(alert.urgency, 'price_drop');
  assert.equal(alert.oldPriceUsd, 500);
  assert.equal(alert.newPriceUsd, 425);
  assert.ok(alert.scheduledAlert.includes('-15%'));
  assert.ok(alert.message.includes('dropped from $500 to $425'));
});

test('calculateDepartureProgress accurately computes remaining time and subtle gradient colors', () => {
  // Test with departure at 10:00 AM and current time at 09:30 AM (30 mins left => imminent)
  const now = new Date('2026-10-20T09:30:00');
  const progress = calculateDepartureProgress('10:00 AM', now);
  assert.equal(progress.remainingMinutes, 30);
  assert.equal(progress.formattedRemaining, '30m left');
  assert.equal(progress.urgencyLevel, 'imminent');
  assert.ok(progress.gradientClass.includes('from-amber-500'));
});

