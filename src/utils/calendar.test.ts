import test from 'node:test';
import assert from 'node:assert/strict';
import {
  escapeIcsText,
  formatDateToIcsUtc,
  parseTimeOnDate,
  parseDurationMinutes,
  buildCalendarEvent,
  generateIcsFeed,
} from './calendar.ts';
import type { Listing } from '../types/travel.ts';

const sampleFlight: Listing = {
  id: 'flight-tokyo-paris-101',
  type: 'flight',
  title: 'ANA First Class: Tokyo Haneda → Paris CDG',
  tagline: 'Enclosed suite with Michelin dining',
  destination: 'Paris',
  country: 'France',
  priceUsd: 4200,
  rating: 4.98,
  reviewCount: 412,
  imageUrl: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05',
  badge: 'First Class',
  provider: {
    name: 'All Nippon Airways',
    verified: true,
    avatar: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05',
  },
  details: {
    durationOrNights: '13h 20m',
    departureTime: '10:45 AM',
    arrivalTime: '04:05 PM',
    capacity: 1,
    amenities: ['Private Suite', 'Wi-Fi 6E', 'Kaiseki Menu'],
    carbonOffsetKg: 620,
    cancellationPolicy: 'Free cancellation 24h',
    classOrRoomType: 'Suite 1A',
  },
};

test('escapes special iCalendar characters according to RFC 5545', () => {
  const raw = 'Terminal 2, Gate B; Check-in\nLine 2';
  const escaped = escapeIcsText(raw);
  assert.equal(escaped, 'Terminal 2\\, Gate B\\; Check-in\\nLine 2');
});

test('formats UTC dates into YYYYMMDDTHHMMSSZ format', () => {
  const date = new Date(Date.UTC(2026, 9, 24, 10, 45, 0)); // Oct 24, 2026 10:45:00 UTC
  assert.equal(formatDateToIcsUtc(date), '20261024T104500Z');
});

test('parses departure times with airport or station suffixes', () => {
  const d1 = parseTimeOnDate('2026-10-24', '22:15 HND', 0);
  assert.equal(formatDateToIcsUtc(d1), '20261024T221500Z');
  const d2 = parseTimeOnDate('2026-10-24', '08:00 Tokyo Central', 1);
  assert.equal(formatDateToIcsUtc(d2), '20261025T080000Z');
});

test('parses flight, rail, and hotel duration strings into minutes', () => {
  assert.equal(parseDurationMinutes('13h 20m', 'flight'), 800);
  assert.equal(parseDurationMinutes('2h 15m', 'train'), 135);
  assert.equal(parseDurationMinutes('Per Night', 'hotel'), 1440);
});

test('builds structured calendar event with valid Google Calendar deep link', () => {
  const ev = buildCalendarEvent(sampleFlight, 0, { baseDate: '2026-10-24' });
  assert.equal(ev.startUtc, '20261024T104500Z');
  assert.equal(ev.endUtc, '20261025T000500Z'); // +13h 20m
  assert.ok(ev.googleCalendarUrl.startsWith('https://calendar.google.com/calendar/render?'));
  assert.ok(ev.googleCalendarUrl.includes('action=TEMPLATE'));
  assert.ok(ev.confirmationCode.startsWith('AV-'));
});

test('generates valid RFC 5545 .ics feed with VCALENDAR, VEVENT, and VALARM blocks', () => {
  const ics = generateIcsFeed([sampleFlight], {
    baseDate: '2026-10-24',
    reminderMinutesBefore: 90,
  });

  assert.ok(ics.startsWith('BEGIN:VCALENDAR\r\nVERSION:2.0'));
  assert.ok(ics.includes('BEGIN:VEVENT\r\n'));
  assert.ok(ics.includes('SUMMARY:[AetherVoyage Flight] ANA First Class: Tokyo Haneda → Paris CDG'));
  assert.ok(ics.includes('LOCATION:Paris\\, France'));
  assert.ok(ics.includes('TRIGGER:-PT90M'));
  assert.ok(ics.endsWith('END:VCALENDAR'));
});
