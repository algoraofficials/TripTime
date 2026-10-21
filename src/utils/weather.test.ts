import test from 'node:test';
import assert from 'node:assert/strict';
import { getDestinationWeather } from './weather.ts';

test('getDestinationWeather returns weather for known destination', () => {
  const weather = getDestinationWeather("Cox's Bazar");
  assert.equal(weather.destination, "Cox's Bazar");
  assert.equal(weather.tempC, 30);
  assert.equal(weather.icon, 'sun');
});

test('getDestinationWeather returns fallback weather for unknown destination', () => {
  const weather = getDestinationWeather("Unknown City");
  assert.equal(weather.destination, "Unknown City");
  assert.equal(weather.tempC, 28);
});
