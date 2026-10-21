import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DHAKA_HOTEL_PRICES_DATASET,
  parseScrapedRating,
  bdtToExactUsd,
  mapScrapedDhakaHotelsToListings,
  formatScraperConsoleOutput,
} from './dhakaHotelScraper.ts';
import { convertCurrency } from './currency.ts';

test('parseScrapedRating extracts numeric score from X/5 string', () => {
  assert.equal(parseScrapedRating('3.8/5'), 3.8);
  assert.equal(parseScrapedRating('4.0/5'), 4.0);
  assert.equal(parseScrapedRating('4.2/5'), 4.2);
});

test('bdtToExactUsd round-trips to exact BDT price with convertCurrency', () => {
  for (const hotel of DHAKA_HOTEL_PRICES_DATASET) {
    const usd = bdtToExactUsd(hotel.price_bdt);
    const bdt = Math.round(convertCurrency(usd, 'USD', 'BDT'));
    assert.equal(bdt, hotel.price_bdt);
  }
});

test('mapScrapedDhakaHotelsToListings converts all 10 scraped Dhaka & BPC hotels into valid Listings', () => {
  const listings = mapScrapedDhakaHotelsToListings();
  assert.equal(listings.length, 10);
  assert.equal(listings[0].title, 'Hotel AS Shams International');
  assert.equal(listings[0].destination, 'Fakirapool, Dhaka');
  assert.equal(listings[0].division, 'Dhaka');
  assert.equal(listings[1].title, 'Hotel Pacific');
  assert.equal(listings[1].destination, 'Motijheel, Dhaka');
  assert.equal(listings[2].title, 'Hotel Seven Star (Residential)');
  assert.equal(listings[2].destination, 'Old Dhaka, Dhaka');
  assert.equal(listings[3].title, 'BPC Hotel Abakash (Bangladesh Parjatan Corp)');
  assert.equal(listings[3].propertyType, 'BPC Parjatan Govt Hotel');
});

test('formatScraperConsoleOutput produces exact Python table output', () => {
  const log = formatScraperConsoleOutput();
  assert.ok(log.includes('Initiating free hotel price scraper for Bangladesh...'));
  assert.ok(log.includes('Hotel AS Shams International'));
  assert.ok(log.includes('Fakirapool, Dhaka'));
  assert.ok(log.includes('1357'));
  assert.ok(log.includes("Live prices exported successfully to 'dhaka_hotel_prices.json'"));
});
