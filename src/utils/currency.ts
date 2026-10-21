export type SupportedCurrency = 'BDT' | 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CAD' | 'AUD' | 'CHF' | 'SGD' | 'INR' | 'AED';

export interface CurrencyMeta {
  code: SupportedCurrency;
  symbol: string;
  name: string;
  locale: string;
  decimals: number;
}

export const CURRENCY_REGISTRY: Record<SupportedCurrency, CurrencyMeta> = {
  BDT: { code: 'BDT', symbol: 'Tk', name: 'Bangladeshi Taka', locale: 'en-BD', decimals: 0 },
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', locale: 'en-US', decimals: 2 },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', locale: 'de-DE', decimals: 2 },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', locale: 'en-GB', decimals: 2 },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen', locale: 'ja-JP', decimals: 0 },
  CAD: { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', locale: 'en-CA', decimals: 2 },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', locale: 'en-AU', decimals: 2 },
  CHF: { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', locale: 'de-CH', decimals: 2 },
  SGD: { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', locale: 'en-SG', decimals: 2 },
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee', locale: 'en-IN', decimals: 2 },
  AED: { code: 'AED', symbol: 'AED', name: 'UAE Dirham', locale: 'ar-AE', decimals: 2 },
};

// Base currency is USD
export const BASE_RATES_USD: Record<SupportedCurrency, number> = {
  BDT: 120.0,
  USD: 1.0,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 154.20,
  CAD: 1.38,
  AUD: 1.52,
  CHF: 0.88,
  SGD: 1.34,
  INR: 83.90,
  AED: 3.67,
};

/**
 * Converts an amount from source currency to target currency using base rates
 */
export function convertCurrency(
  amount: number,
  from: SupportedCurrency,
  to: SupportedCurrency,
  rates: Record<SupportedCurrency, number> = BASE_RATES_USD
): number {
  if (from === to) return amount;
  const fromRate = rates[from] || 1;
  const toRate = rates[to] || 1;
  
  // Convert from source to USD then USD to target
  const inUSD = amount / fromRate;
  const converted = inUSD * toRate;
  
  const decimals = CURRENCY_REGISTRY[to]?.decimals ?? 2;
  return Number(converted.toFixed(decimals));
}

/**
 * Formats a currency amount according to international locale conventions
 */
export function formatCurrency(
  amount: number,
  currency: SupportedCurrency
): string {
  const meta = CURRENCY_REGISTRY[currency] || CURRENCY_REGISTRY.BDT;
  if (currency === 'BDT') {
    return `Tk ${Math.round(amount).toLocaleString('en-US')}`;
  }
  try {
    return new Intl.NumberFormat(meta.locale, {
      style: 'currency',
      currency: meta.code,
      minimumFractionDigits: meta.decimals,
      maximumFractionDigits: meta.decimals,
    }).format(amount);
  } catch {
    return `${meta.symbol}${amount.toFixed(meta.decimals)}`;
  }
}


