import test from 'node:test';
import assert from 'node:assert/strict';
import { dhakaHotelPriceService } from './dhakaHotelPriceService.ts';

test('DhakaHotelPriceService invokes fetchDhakaHotels and parses dataset', async () => {
  const result = await dhakaHotelPriceService.fetchDhakaHotels();
  assert.equal(Array.isArray(result.hotels), true);
  assert.equal(result.hotels.length >= 3, true);
  assert.equal(result.listings.length >= 3, true);
  assert.ok(result.consoleOutput.includes('Hotel AS Shams International'));
  assert.ok(result.consoleOutput.includes('Hotel Pacific'));
  assert.ok(result.consoleOutput.includes('Hotel Seven Star (Residential)'));
});

test('DhakaHotelPriceService manages subscribers and status correctly', () => {
  let callCount = 0;
  const unsubscribe = dhakaHotelPriceService.subscribe((hotels, listings, meta) => {
    callCount++;
    assert.equal(hotels.length >= 3, true);
    assert.equal(listings.length >= 3, true);
    assert.ok(typeof meta.lastFetchedAt === 'string');
  });

  assert.equal(callCount, 1);
  const status = dhakaHotelPriceService.getStatus();
  assert.equal(status.hotelCount >= 3, true);

  unsubscribe();
});
