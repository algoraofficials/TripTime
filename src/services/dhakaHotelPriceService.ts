import {
  DHAKA_HOTEL_PRICES_DATASET,
  mapScrapedDhakaHotelsToListings,
  formatScraperConsoleOutput,
  type ScrapedDhakaHotel,
} from '../utils/dhakaHotelScraper.ts';
import type { Listing } from '../types/travel.ts';

export type DhakaPriceListener = (
  hotels: ScrapedDhakaHotel[],
  listings: Listing[],
  meta: { lastFetchedAt: string; fetchCount: number; isLive: boolean }
) => void;

class DhakaHotelPriceService {
  private timer: NodeJS.Timeout | null = null;
  private listeners: Set<DhakaPriceListener> = new Set();
  private cachedHotels: ScrapedDhakaHotel[] = DHAKA_HOTEL_PRICES_DATASET;
  private cachedListings: Listing[] = mapScrapedDhakaHotelsToListings(DHAKA_HOTEL_PRICES_DATASET);
  private lastFetchedAt: string = new Date().toLocaleTimeString();
  private fetchCount: number = 0;
  private isRunning: boolean = false;
  private intervalMs: number = 60000;

  /**
   * Invokes the fetch_dhaka_hotels logic, parses dhaka_hotel_prices.json,
   * converts to listings, and notifies all subscribers.
   */
  public async fetchDhakaHotels(): Promise<{
    hotels: ScrapedDhakaHotel[];
    listings: Listing[];
    consoleOutput: string;
  }> {
    this.fetchCount++;
    this.lastFetchedAt = new Date().toLocaleTimeString();

    let fetchedHotels: ScrapedDhakaHotel[] = DHAKA_HOTEL_PRICES_DATASET;

    // In browser runtime, attempt to fetch latest live dhaka_hotel_prices.json
    if (typeof window !== 'undefined' && typeof window.fetch === 'function') {
      try {
        const response = await window.fetch('/dhaka_hotel_prices.json', { cache: 'no-store' });
        if (response.ok) {
          const json = await response.json();
          if (Array.isArray(json) && json.length > 0) {
            fetchedHotels = json as ScrapedDhakaHotel[];
          }
        }
      } catch (err) {
        // Fallback to embedded canonical dataset
        console.warn('[DhakaHotelPriceService] Direct fetch fallback to canonical dataset:', err);
      }
    }

    this.cachedHotels = fetchedHotels;
    this.cachedListings = mapScrapedDhakaHotelsToListings(fetchedHotels);

    const consoleOutput = formatScraperConsoleOutput(fetchedHotels, 200);

    // Notify all active subscribers
    this.notifyListeners();

    return {
      hotels: this.cachedHotels,
      listings: this.cachedListings,
      consoleOutput,
    };
  }

  /**
   * Starts periodic execution of the fetch_dhaka_hotels scraper logic
   */
  public startPeriodicSync(intervalMs: number = 60000): void {
    this.intervalMs = Math.max(5000, intervalMs);
    this.isRunning = true;

    if (this.timer) {
      clearInterval(this.timer);
    }

    // Run an initial invocation immediately
    this.fetchDhakaHotels();

    // Schedule periodic invocations
    this.timer = setInterval(() => {
      this.fetchDhakaHotels();
    }, this.intervalMs);
  }

  /**
   * Stops the background periodic sync
   */
  public stopPeriodicSync(): void {
    this.isRunning = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /**
   * Subscribes a listener to price changes and returns an unsubscribe function
   */
  public subscribe(listener: DhakaPriceListener): () => void {
    this.listeners.add(listener);
    // Deliver immediate current state to subscriber
    listener(this.cachedHotels, this.cachedListings, {
      lastFetchedAt: this.lastFetchedAt,
      fetchCount: this.fetchCount,
      isLive: this.isRunning,
    });

    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    const meta = {
      lastFetchedAt: this.lastFetchedAt,
      fetchCount: this.fetchCount,
      isLive: this.isRunning,
    };
    for (const listener of this.listeners) {
      try {
        listener(this.cachedHotels, this.cachedListings, meta);
      } catch (err) {
        console.error('[DhakaHotelPriceService] Listener error:', err);
      }
    }
  }

  public getStatus() {
    return {
      isRunning: this.isRunning,
      intervalMs: this.intervalMs,
      fetchCount: this.fetchCount,
      lastFetchedAt: this.lastFetchedAt,
      hotelCount: this.cachedHotels.length,
    };
  }

  public getCachedHotels(): ScrapedDhakaHotel[] {
    return [...this.cachedHotels];
  }

  public getCachedListings(): Listing[] {
    return [...this.cachedListings];
  }
}

export const dhakaHotelPriceService = new DhakaHotelPriceService();
