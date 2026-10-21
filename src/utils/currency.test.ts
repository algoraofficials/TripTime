import test from 'node:test';
import assert from 'node:assert/strict';
import { convertCurrency, formatCurrency, BASE_RATES_USD } from './currency.ts';

test('converts identical currencies to exact same amount', () => {
  assert.equal(convertCurrency(150, 'USD', 'USD'), 150);
  assert.equal(convertCurrency(20000, 'JPY', 'JPY'), 20000);
});

test('converts USD to EUR accurately based on exchange rates', () => {
  // USD to EUR: 100 * 0.92 = 92.00
  const result = convertCurrency(100, 'USD', 'EUR', BASE_RATES_USD);
  assert.equal(result, 92);
});

test('converts EUR to JPY through base currency', () => {
  // 92 EUR = 100 USD = 15420 JPY
  const result = convertCurrency(92, 'EUR', 'JPY', BASE_RATES_USD);
  assert.equal(result, 15420);
});

test('formats currency with symbol and correct decimals', () => {
  const formattedUsd = formatCurrency(1250.5, 'USD');
  assert.ok(formattedUsd.includes('$') || formattedUsd.includes('USD'));
  assert.ok(formattedUsd.includes('1,250.50') || formattedUsd.includes('1250.50'));

  const formattedJpy = formatCurrency(5000, 'JPY');
  assert.ok(
    formattedJpy.includes('¥') ||
    formattedJpy.includes('￥') ||
    formattedJpy.includes('JPY') ||
    formattedJpy.includes('5,000') ||
    formattedJpy.includes('5000')
  );
});
