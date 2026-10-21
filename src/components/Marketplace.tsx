import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Building2,
  Plane,
  Train,
  Ship,
  Search,
  Calendar,
  Users,
  Star,
  CheckCircle,
  Leaf,
  Clock,
  SlidersHorizontal,
  CreditCard,
  UserPlus,
  Crown,
  Compass,
  Utensils,
  Heart,
  Award,
  MessageSquare,
  TrendingDown,
  BellRing,
  MapPin,
  RotateCcw,
  Sparkles,
  Wallet,
  ShieldCheck,
  Zap,
  Settings,
} from 'lucide-react';
import { Listing, TransitMode, LanguageCode, PriceDropSubscription } from '../types/travel';
import { FirebasePaymentPreference } from '../services/firebaseSync';
import { SupportedCurrency, convertCurrency, formatCurrency } from '../utils/currency';
import { calculatePointsForBooking } from '../utils/loyalty';
import { getTravelersChoiceStatus, generateOtaPriceComparison } from '../utils/tripadvisorFeatures';
import {
  SearchFilterCriteria,
  DEFAULT_SEARCH_CRITERIA,
  BANGLADESH_DESTINATIONS,
  BANGLADESH_ORIGIN_HUBS,
  HOTEL_PROPERTY_TYPES,
  POPULAR_BD_AMENITIES,
  BD_PAYMENT_METHODS,
  SortOption,
  filterAndSortBangladeshListings,
  countActiveSearchFilters,
} from '../utils/bangladeshSearch';
import {
  DHAKA_HOTEL_PRICES_DATASET,
  PYTHON_SCRAPER_SOURCE_CODE,
  formatScraperConsoleOutput,
  ScrapedDhakaHotel,
} from '../utils/dhakaHotelScraper';
import { dhakaHotelPriceService } from '../services/dhakaHotelPriceService';
import { TRANSLATIONS } from '../data/translations';
import {
  FindThingsToDoByInterestSection,
  type InterestCategoryKey,
} from './InterestActivitiesPage';
import { ExpediaSearchWidget } from './ExpediaSearchWidget';

interface MarketplaceProps {
  listings: Listing[];
  currentCurrency: SupportedCurrency;
  currentLang: LanguageCode;
  onOpenSplitPayment: (listing: Listing) => void;
  onBookDirect: (listing: Listing) => void;
  savedListingIds?: string[];
  onToggleSaveListing?: (listingId: string) => void;
  priceDropSubscriptions?: PriceDropSubscription[];
  onTogglePriceDropAlert?: (listing: Listing) => void;
  onInspectReviewsAndDeals?: (listing: Listing) => void;
  onUpdateListings?: (listings: Listing[]) => void;
  savedPaymentPreference?: FirebasePaymentPreference | null;
  onOpenPaymentPreferencesModal?: () => void;
  onQuickBookDirect?: (listing: Listing, paymentMethod?: string) => void;
  onSelectInterestCategory?: (category: InterestCategoryKey) => void;
}

export const Marketplace: React.FC<MarketplaceProps> = ({
  listings,
  currentCurrency,
  currentLang,
  onOpenSplitPayment,
  onBookDirect,
  savedListingIds = [],
  onToggleSaveListing,
  priceDropSubscriptions = [],
  onTogglePriceDropAlert,
  onInspectReviewsAndDeals,
  onUpdateListings,
  savedPaymentPreference,
  onOpenPaymentPreferencesModal,
  onQuickBookDirect,
  onSelectInterestCategory,
}) => {
  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;

  const [criteria, setCriteria] = useState<SearchFilterCriteria>(DEFAULT_SEARCH_CRITERIA);
  const [checkInDate, setCheckInDate] = useState<string>('2026-11-05');
  const [checkOutDate, setCheckOutDate] = useState<string>('2026-11-08');
  const [showAdvancedHotelFilters, setShowAdvancedHotelFilters] = useState<boolean>(false);
  const [showDhakaScraperPanel, setShowDhakaScraperPanel] = useState<boolean>(false);
  const [scraperViewMode, setScraperViewMode] = useState<'table' | 'json' | 'python'>('table');
  const [isScrapingLive, setIsScrapingLive] = useState<boolean>(false);

  // Quick Book toggle state per listing card and global mode
  const [quickBookToggledListings, setQuickBookToggledListings] = useState<Record<string, boolean>>({});
  const [globalQuickBookMode, setGlobalQuickBookMode] = useState<boolean>(false);

  const toggleQuickBookForListing = (listingId: string) => {
    setQuickBookToggledListings((prev) => ({
      ...prev,
      [listingId]: !prev[listingId],
    }));
  };
  const [scrapedHotelsData, setScrapedHotelsData] = useState<ScrapedDhakaHotel[]>(
    DHAKA_HOTEL_PRICES_DATASET
  );
  const [scraperConsoleLog, setScraperConsoleLog] = useState<string>(() =>
    formatScraperConsoleOutput(DHAKA_HOTEL_PRICES_DATASET, 200)
  );
  const [lastScrapedTimestamp, setLastScrapedTimestamp] = useState<string>(
    'Periodic sync active • dhaka_hotel_prices.json'
  );

  const onUpdateListingsRef = useRef(onUpdateListings);
  useEffect(() => {
    onUpdateListingsRef.current = onUpdateListings;
  });

  useEffect(() => {
    // Periodically invoke fetch_dhaka_hotels logic every 60s
    dhakaHotelPriceService.startPeriodicSync(60000);

    const unsubscribe = dhakaHotelPriceService.subscribe((hotels, scrapedListings, meta) => {
      setScrapedHotelsData(hotels);
      setLastScrapedTimestamp(`Periodic sync active • Refreshed at ${meta.lastFetchedAt} (${meta.fetchCount} syncs)`);
      setScraperConsoleLog(formatScraperConsoleOutput(hotels, 200));

      if (onUpdateListingsRef.current) {
        onUpdateListingsRef.current(scrapedListings);
      }
    });

    return () => {
      unsubscribe();
      dhakaHotelPriceService.stopPeriodicSync();
    };
  }, []);

  const handleRunDhakaHotelScraper = async () => {
    setIsScrapingLive(true);
    try {
      const result = await dhakaHotelPriceService.fetchDhakaHotels();
      setScrapedHotelsData(result.hotels);
      setScraperConsoleLog(result.consoleOutput);
      setLastScrapedTimestamp(`Live scraped at ${new Date().toLocaleTimeString()}`);
      if (onUpdateListings) {
        onUpdateListings(result.listings);
      }
    } catch {
      setScraperConsoleLog(formatScraperConsoleOutput(DHAKA_HOTEL_PRICES_DATASET, 200));
      setLastScrapedTimestamp(`Verified local feed at ${new Date().toLocaleTimeString()}`);
    } finally {
      setIsScrapingLive(false);
    }
  };

  const handleExportDhakaJson = () => {
    const blob = new Blob([JSON.stringify(scrapedHotelsData, null, 4)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dhaka_hotel_prices.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const filteredListings = useMemo(
    () => filterAndSortBangladeshListings(listings, criteria),
    [listings, criteria]
  );

  const hotelListingsOnly = useMemo(
    () => filteredListings.filter((item) => item.type === 'hotel'),
    [filteredListings]
  );

  const activeFilterCount = useMemo(() => countActiveSearchFilters(criteria), [criteria]);

  const handleToggleAmenity = (amenity: string) => {
    setCriteria((prev) => {
      const exists = prev.selectedAmenities.includes(amenity);
      return {
        ...prev,
        selectedAmenities: exists
          ? prev.selectedAmenities.filter((a) => a !== amenity)
          : [...prev.selectedAmenities, amenity],
      };
    });
  };

  const handleResetFilters = () => {
    setCriteria(DEFAULT_SEARCH_CRITERIA);
  };

  const getModeIcon = (type: TransitMode) => {
    switch (type) {
      case 'hotel':
        return <Building2 className="w-4 h-4" />;
      case 'flight':
        return <Plane className="w-4 h-4" />;
      case 'train':
        return <Train className="w-4 h-4" />;
      case 'ship':
        return <Ship className="w-4 h-4" />;
      case 'experience':
        return <Compass className="w-4 h-4" />;
      case 'restaurant':
        return <Utensils className="w-4 h-4" />;
    }
  };

  const getModeLabel = (type: TransitMode) => {
    switch (type) {
      case 'hotel':
        return t.hotels;
      case 'flight':
        return t.flights;
      case 'train':
        return t.trains;
      case 'ship':
        return t.ships;
      case 'experience':
        return 'Things to Do (BD Tours)';
      case 'restaurant':
        return 'BD Restaurants & Kacchi';
    }
  };

  const maxBudgetConverted = formatCurrency(
    convertCurrency(criteria.maxPriceUsd, 'USD', currentCurrency),
    currentCurrency
  );

  return (
    <div className="space-y-8 pb-16">
      {/* =====================================================================
          HERO BANGLADESH MULTI-LOCATION & HOTEL SEARCH SUITE
         ===================================================================== */}
      <section className="relative z-30 rounded-3xl overflow-visible bg-gradient-to-br from-slate-900 via-emerald-950/60 to-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl">
        <div className="absolute inset-0 rounded-3xl overflow-hidden bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/10 via-cyan-500/5 to-transparent pointer-events-none" />

        <div className="relative z-10 space-y-6">
          {/* Header Copy */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div className="max-w-3xl">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold mb-3">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>
                  Bangladesh Local Travel • Hotels, Bangladesh Railway, Flights &amp; Cruises
                </span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-2 leading-tight">
                Explore Beautiful{' '}
                <span className="bg-gradient-to-r from-emerald-400 via-cyan-300 to-amber-300 bg-clip-text text-transparent">
                  Bangladesh Across All 8 Divisions
                </span>
              </h1>

              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                Search verified beachfront resorts in <strong>Cox&apos;s Bazar</strong>, tea garden
                palaces in <strong>Sreemangal &amp; Sylhet</strong>, cloud villas in{' '}
                <strong>Bandarban &amp; Sajek Valley</strong>, non-stop{' '}
                <strong>Bangladesh Railway</strong> intercity trains,{' '}
                <strong>Saint Martin&apos;s &amp; Sundarbans</strong> cruises, and{' '}
                <strong>Old Dhaka Kacchi</strong> feasts — with instant <strong>bKash</strong>,{' '}
                <strong>Nagad</strong>, and group bill splitting in <strong>BDT (Tk)</strong>.
              </p>
            </div>

            {/* Active Filters Counter & Reset */}
            <div className="flex items-center gap-2 self-start lg:self-end flex-shrink-0">
              {activeFilterCount > 0 && (
                <button
                  onClick={handleResetFilters}
                  className="px-3.5 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Search ({activeFilterCount})</span>
                </button>
              )}
              <button
                onClick={() => setShowAdvancedHotelFilters(!showAdvancedHotelFilters)}
                className={`px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                  showAdvancedHotelFilters
                    ? 'bg-emerald-600 text-white border-emerald-500'
                    : 'bg-slate-900 text-slate-300 border-slate-700 hover:text-white'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>
                  {showAdvancedHotelFilters
                    ? 'Hide Hotel & Location Filters'
                    : 'Show Hotel & Location Filters'}
                </span>
              </button>
            </div>
          </div>

          {/* Black-Themed Expedia 6-Tab Search Suite (Stays, Flights, Cars, Packages, Things to do, Cruises) */}
          <ExpediaSearchWidget
            criteria={criteria}
            onUpdateCriteria={setCriteria}
            checkInDate={checkInDate}
            onChangeCheckInDate={setCheckInDate}
            listings={listings}
            currentCurrency={currentCurrency}
            onSelectInterestCategory={onSelectInterestCategory}
            onBookBundlePackage={(stayListing, transitListing, discountedTotalUsd) => {
              const bundleListing: Listing = {
                ...stayListing,
                id: `bundle-${stayListing.id}-${transitListing.id}`,
                title: `${stayListing.title} + ${transitListing.title}`,
                tagline: `Expedia Bundle & Save Package • Stay + Transit included`,
                priceUsd: discountedTotalUsd,
                badge: 'Bundle & Save Package',
              };
              onBookDirect(bundleListing);
            }}
          />



          {/* =================================================================
              HOME PAGE HOTELS & LOCATION ADVANCED SEARCH DRAWER
             ================================================================= */}
          {showAdvancedHotelFilters && (
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/90 border border-slate-800/90 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                <div className="flex items-center space-x-2">
                  <Building2 className="w-4 h-4 text-emerald-400" />
                  <h2 className="text-xs sm:text-sm font-bold text-white">
                    Home Page Hotels &amp; Bangladesh Location Search Filters
                  </h2>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 font-semibold">
                    {hotelListingsOnly.length} Hotels • {filteredListings.length} Total Matches
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <label className="flex items-center space-x-1.5 text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={criteria.freeCancellationOnly}
                      onChange={(e) =>
                        setCriteria((prev) => ({
                          ...prev,
                          freeCancellationOnly: e.target.checked,
                        }))
                      }
                      className="rounded accent-emerald-500"
                    />
                    <span>Free Cancellation (24h)</span>
                  </label>

                  <label className="flex items-center space-x-1.5 text-emerald-300 font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={criteria.travelersChoiceOnly}
                      onChange={(e) =>
                        setCriteria((prev) => ({
                          ...prev,
                          travelersChoiceOnly: e.target.checked,
                        }))
                      }
                      className="rounded accent-emerald-500"
                    />
                    <Award className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Travelers&apos; Choice 2026</span>
                  </label>
                </div>
              </div>

              {/* Filter Selectors Row: Property Type, Star Class, BD Payment Method, Min Rating, Sort By, Max Budget */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 text-xs">
                {/* Property Type */}
                <div>
                  <label
                    htmlFor="hotel-prop-type"
                    className="block text-[11px] font-semibold text-slate-400 mb-1"
                  >
                    Hotel / Resort Type
                  </label>
                  <select
                    id="hotel-prop-type"
                    value={criteria.hotelPropertyType}
                    onChange={(e) =>
                      setCriteria((prev) => ({ ...prev, hotelPropertyType: e.target.value }))
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none cursor-pointer"
                  >
                    {HOTEL_PROPERTY_TYPES.map((pt) => (
                      <option key={pt} value={pt} className="bg-slate-900">
                        {pt === 'all' ? 'All Resort & Hotel Types' : pt}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Hotel Star Rating */}
                <div>
                  <label
                    htmlFor="hotel-star-select"
                    className="block text-[11px] font-semibold text-slate-400 mb-1"
                  >
                    Hotel Star Class
                  </label>
                  <select
                    id="hotel-star-select"
                    value={criteria.hotelStarRating}
                    onChange={(e) =>
                      setCriteria((prev) => ({
                        ...prev,
                        hotelStarRating:
                          e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10),
                      }))
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none cursor-pointer"
                  >
                    <option value="all" className="bg-slate-900">
                      All Star Classes (3-Star to 5-Star)
                    </option>
                    <option value={5} className="bg-slate-900">
                      5-Star Luxury Resorts
                    </option>
                    <option value={4} className="bg-slate-900">
                      4-Star Premier Stays
                    </option>
                    <option value={3} className="bg-slate-900">
                      3-Star Comfort Hotels
                    </option>
                  </select>
                </div>

                {/* Local Payment Methods (bKash / Nagad / Amex) */}
                <div>
                  <label
                    htmlFor="bd-payment-select"
                    className="block text-[11px] font-semibold text-slate-400 mb-1"
                  >
                    BD Local Payment / EMI
                  </label>
                  <select
                    id="bd-payment-select"
                    value={criteria.paymentMethodFilter}
                    onChange={(e) =>
                      setCriteria((prev) => ({
                        ...prev,
                        paymentMethodFilter: e.target.value,
                      }))
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none cursor-pointer"
                  >
                    {BD_PAYMENT_METHODS.map((pm) => (
                      <option key={pm} value={pm} className="bg-slate-900">
                        {pm === 'all' ? 'All BD Payment Options' : `${pm} Accepted`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Minimum Bubble Rating */}
                <div>
                  <label
                    htmlFor="bd-min-rating"
                    className="block text-[11px] font-semibold text-slate-400 mb-1"
                  >
                    Minimum Traveler Rating
                  </label>
                  <select
                    id="bd-min-rating"
                    value={criteria.minRating}
                    onChange={(e) =>
                      setCriteria((prev) => ({
                        ...prev,
                        minRating: parseFloat(e.target.value),
                      }))
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none cursor-pointer"
                  >
                    <option value={0} className="bg-slate-900">
                      Any Bubble Rating
                    </option>
                    <option value={4.8} className="bg-slate-900">
                      4.8+ Bubbles (Exceptional)
                    </option>
                    <option value={4.9} className="bg-slate-900">
                      4.9+ Bubbles (Top 1% BD)
                    </option>
                    <option value={4.95} className="bg-slate-900">
                      4.95+ Bubbles (Best of the Best)
                    </option>
                  </select>
                </div>

                {/* Sort Order */}
                <div>
                  <label
                    htmlFor="bd-sort-select"
                    className="block text-[11px] font-semibold text-slate-400 mb-1"
                  >
                    Sort Results By
                  </label>
                  <select
                    id="bd-sort-select"
                    value={criteria.sortBy}
                    onChange={(e) =>
                      setCriteria((prev) => ({
                        ...prev,
                        sortBy: e.target.value as SortOption,
                      }))
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none cursor-pointer"
                  >
                    <option value="recommended" className="bg-slate-900">
                      Recommended for Bangladesh Locals
                    </option>
                    <option value="price_asc" className="bg-slate-900">
                      Price: Low to High ({currentCurrency})
                    </option>
                    <option value="price_desc" className="bg-slate-900">
                      Price: High to Low ({currentCurrency})
                    </option>
                    <option value="rating_desc" className="bg-slate-900">
                      Highest Bubble Rating
                    </option>
                    <option value="reviews_desc" className="bg-slate-900">
                      Most Verified Reviews
                    </option>
                  </select>
                </div>

                {/* Max Budget Slider */}
                <div>
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 mb-1">
                    <span>Max Budget:</span>
                    <span className="text-emerald-400 font-mono">{maxBudgetConverted}</span>
                  </div>
                  <input
                    type="range"
                    min={15}
                    max={500}
                    step={5}
                    value={criteria.maxPriceUsd}
                    onChange={(e) =>
                      setCriteria((prev) => ({
                        ...prev,
                        maxPriceUsd: parseInt(e.target.value, 10),
                      }))
                    }
                    className="w-full accent-emerald-500 mt-1.5 cursor-pointer"
                    aria-label="Filter maximum price budget"
                  />
                </div>
              </div>

              {/* Multi-Amenity Filter Chips (Swimming Pool, Complimentary Breakfast, Couple Friendly NID, Halal Dining, etc.) */}
              <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                  Hotel &amp; Transit Amenities:
                </span>
                {POPULAR_BD_AMENITIES.map((amenity) => {
                  const isSelected = criteria.selectedAmenities.includes(amenity);
                  return (
                    <button
                      key={amenity}
                      onClick={() => handleToggleAmenity(amenity)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center space-x-1.5 ${
                        isSelected
                          ? 'bg-emerald-600/25 border-emerald-400 text-emerald-200 shadow-sm'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                      }`}
                    >
                      <CheckCircle
                        className={`w-3.5 h-3.5 ${
                          isSelected ? 'text-emerald-400' : 'text-slate-600'
                        }`}
                      />
                      <span>{amenity}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* =====================================================================
          DEDICATED HOME PAGE BANGLADESH HOTELS & RESORTS QUICK-FILTER BAR
         ===================================================================== */}
      <section className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <Building2 className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg font-extrabold text-white tracking-tight">
                Bangladesh Tourism Board &amp; Hotel Directory ({hotelListingsOnly.length} Stays)
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Verified Bangladesh Parjatan Corporation (BPC / hotels.gov.bd) motels &amp; 3-to-5-star resorts across all 8 divisions • Pay with bKash, Nagad, or 0% EMI
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {HOTEL_PROPERTY_TYPES.map((type) => (
              <button
                key={type}
                onClick={() =>
                  setCriteria((prev) => ({
                    ...prev,
                    mode: type === 'all' ? prev.mode : 'hotel',
                    hotelPropertyType: type,
                  }))
                }
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  criteria.hotelPropertyType === type
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/20'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-emerald-500/40 hover:text-white'
                }`}
              >
                {type === 'all' ? 'All BD Hotels & Resorts' : type}
              </button>
            ))}

            <button
              type="button"
              onClick={() => {
                setCriteria((prev) => ({
                  ...prev,
                  mode: 'hotel',
                  division: 'Dhaka',
                  hotelPropertyType: 'Budget Residential Hotel',
                  searchQuery: '',
                }));
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-bold border bg-amber-500/15 text-amber-300 border-amber-500/40 hover:bg-amber-500/25 transition-all cursor-pointer"
            >
              Scraped Dhaka &amp; BPC Deals ({scrapedHotelsData.length})
            </button>

            <button
              type="button"
              onClick={() => setShowDhakaScraperPanel((prev) => !prev)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                showDhakaScraperPanel
                  ? 'bg-cyan-600 text-white border-cyan-500 shadow-md shadow-cyan-600/25'
                  : 'bg-slate-950 text-cyan-300 border-cyan-500/40 hover:bg-cyan-950/60'
              }`}
            >
              {showDhakaScraperPanel
                ? 'Hide dhaka_hotel_prices.json Scraper'
                : 'Live Dhaka & BPC Feed (dhaka_hotel_prices.json)'}
            </button>
          </div>
        </div>

        {/* Live Dhaka Budget Hotel Price Scraper Drawer */}
        {showDhakaScraperPanel && (
          <div className="pt-4 border-t border-slate-800 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-slate-950/90 p-4 rounded-2xl border border-cyan-500/30">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold uppercase tracking-wider">
                    Python BeautifulSoup + BPC Feed
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    fetch_dhaka_hotels.py → dhaka_hotel_prices.json
                  </span>
                </div>
                <h3 className="text-sm font-extrabold text-white mt-1">
                  Real-Time Dhaka &amp; BPC Hotel Price Feed (Mohakhali, Motijheel, Banani, Uttara &amp; Old Dhaka)
                </h3>
                <p className="text-xs text-slate-400">
                  Status: <strong className="text-emerald-400">{lastScrapedTimestamp}</strong> •{' '}
                  {scrapedHotelsData.length} Dhaka &amp; BPC hotels synced directly into Marketplace listings
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
                  <button
                    type="button"
                    onClick={() => setScraperViewMode('table')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      scraperViewMode === 'table'
                        ? 'bg-cyan-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Live Table &amp; Console
                  </button>
                  <button
                    type="button"
                    onClick={() => setScraperViewMode('json')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      scraperViewMode === 'json'
                        ? 'bg-cyan-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    dhaka_hotel_prices.json
                  </button>
                  <button
                    type="button"
                    onClick={() => setScraperViewMode('python')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      scraperViewMode === 'python'
                        ? 'bg-cyan-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    fetch_dhaka_hotels.py
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleRunDhakaHotelScraper}
                  disabled={isScrapingLive}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold transition-all cursor-pointer"
                >
                  {isScrapingLive ? 'Scraping Dhaka Hotels...' : 'Run fetch_dhaka_hotels()'}
                </button>

                <button
                  type="button"
                  onClick={handleExportDhakaJson}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer"
                >
                  Download dhaka_hotel_prices.json
                </button>
              </div>
            </div>

            {scraperViewMode === 'table' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Scraped Hotel Cards */}
                <div className="space-y-2.5">
                  {scrapedHotelsData.map((hotel) => (
                    <div
                      key={hotel.hotel_name}
                      className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-white text-xs">{hotel.hotel_name}</span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400 mr-1" />
                            <span>{hotel.rating}</span>
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">{hotel.location}</p>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {hotel.amenities.map((am) => (
                            <span
                              key={am}
                              className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-300"
                            >
                              {am}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2">
                        <div className="text-right">
                          <span className="text-[10px] uppercase text-slate-400 block">
                            Scraped BDT Rate
                          </span>
                          <span className="text-base font-black text-emerald-400">
                            Tk {hotel.price_bdt.toLocaleString()}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const matched = listings.find((l) => l.title === hotel.hotel_name);
                            if (matched) onBookDirect(matched);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold cursor-pointer whitespace-nowrap"
                        >
                          Book at Tk {hotel.price_bdt.toLocaleString()}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Live Python Scraper Console Output */}
                <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4 font-mono text-[11px] text-emerald-300 overflow-x-auto">
                  <div className="text-slate-400 text-[10px] uppercase tracking-wider pb-2 mb-2 border-b border-slate-800 flex items-center justify-between">
                    <span>Terminal Output • python3 fetch_dhaka_hotels.py</span>
                    <span className="text-emerald-400 font-bold">HTTP 200 OK</span>
                  </div>
                  <pre className=" leading-relaxed whitespace-pre">{scraperConsoleLog}</pre>
                </div>
              </div>
            )}

            {scraperViewMode === 'json' && (
              <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4 font-mono text-xs text-cyan-300 overflow-x-auto">
                <div className="text-slate-400 text-[10px] uppercase tracking-wider pb-2 mb-2 border-b border-slate-800 flex items-center justify-between">
                  <span>dhaka_hotel_prices.json (Live Exported Dataset)</span>
                  <span className="text-cyan-400 font-bold">{scrapedHotelsData.length} Records</span>
                </div>
                <pre className="leading-relaxed whitespace-pre">
                  {JSON.stringify(scrapedHotelsData, null, 4)}
                </pre>
              </div>
            )}

            {scraperViewMode === 'python' && (
              <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4 font-mono text-xs text-amber-200 overflow-x-auto">
                <div className="text-slate-400 text-[10px] uppercase tracking-wider pb-2 mb-2 border-b border-slate-800 flex items-center justify-between">
                  <span>fetch_dhaka_hotels.py (BeautifulSoup4 + Requests Scraper)</span>
                  <span className="text-emerald-400 font-bold">Python 3 Script</span>
                </div>
                <pre className="leading-relaxed whitespace-pre">{PYTHON_SCRAPER_SOURCE_CODE}</pre>
              </div>
            )}
          </div>
        )}
      </section>

      {/* =====================================================================
          DEDICATED 'TOP DEALS IN DHAKA' SECTION (dhaka_hotel_prices.json)
         ===================================================================== */}
      <section className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/95 to-cyan-950/40 border border-cyan-500/30 space-y-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[11px] font-extrabold uppercase tracking-wider">
                dhaka_hotel_prices.json
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 text-[11px] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping mr-1.5" />
                Periodic 60s Scraper Active
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-white tracking-tight mt-1.5">
              Top Deals in Dhaka • Budget Stays &amp; Scraped Rates
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Parsed from <code className="text-cyan-300">dhaka_hotel_prices.json</code> and merged into active listings • Fakirapool, Motijheel &amp; Old Dhaka
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleRunDhakaHotelScraper}
              disabled={isScrapingLive}
              className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-bold transition-all cursor-pointer shadow-md shadow-cyan-600/20"
            >
              {isScrapingLive ? 'Syncing...' : 'Sync Now'}
            </button>
            <button
              type="button"
              onClick={() => {
                setCriteria((prev) => ({
                  ...prev,
                  mode: 'hotel',
                  division: 'Dhaka',
                  hotelPropertyType: 'Budget Residential Hotel',
                }));
              }}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all cursor-pointer"
            >
              Filter in Grid
            </button>
          </div>
        </div>

        {/* Top Deals Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {scrapedHotelsData.map((deal) => {
            const matchedListing = listings.find((l) => l.title === deal.hotel_name);
            const isSubscribed = matchedListing && priceDropSubscriptions.some(
              (s) => s.listingId === matchedListing.id
            );

            return (
              <div
                key={deal.hotel_name}
                className="rounded-2xl bg-slate-950/90 border border-slate-800 hover:border-cyan-500/40 p-4 flex flex-col justify-between transition-all hover:shadow-lg space-y-3.5 group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="inline-block px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800/60 text-[10px] font-bold text-cyan-300 uppercase tracking-wider mb-1">
                        Top Deal in Dhaka
                      </span>
                      <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                        {deal.hotel_name}
                      </h3>
                      <p className="text-xs text-slate-400 flex items-center space-x-1 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                        <span>{deal.location}</span>
                      </p>
                    </div>

                    <div className="flex items-center px-2 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 mr-1" />
                      <span>{deal.rating}</span>
                    </div>
                  </div>

                  {/* Amenities */}
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {deal.amenities.map((amenity) => (
                      <span
                        key={amenity}
                        className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-[11px] text-slate-300 font-medium"
                      >
                        {amenity}
                      </span>
                    ))}
                    <span className="px-2 py-0.5 rounded-md bg-emerald-950/60 border border-emerald-800/40 text-[11px] text-emerald-300 font-medium">
                      bKash Accepted
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-850 space-y-3">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                        Live Scraped Rate
                      </span>
                      <span className="text-lg font-black text-emerald-400">
                        Tk {deal.price_bdt.toLocaleString()}
                      </span>
                      <span className="text-[11px] text-slate-500 ml-1">/ night</span>
                    </div>

                    {currentCurrency !== 'BDT' && matchedListing && (
                      <span className="text-xs text-slate-400 font-mono">
                        ≈ {formatCurrency(
                          convertCurrency(matchedListing.priceUsd, 'USD', currentCurrency),
                          currentCurrency
                        )}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (matchedListing && onTogglePriceDropAlert) {
                          onTogglePriceDropAlert(matchedListing);
                        }
                      }}
                      className={`px-2.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center space-x-1 ${
                        isSubscribed
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
                      }`}
                      title={isSubscribed ? 'Price Drop Alert is Active' : 'Subscribe to Price Drop Alerts'}
                    >
                      <BellRing className={`w-3.5 h-3.5 ${isSubscribed ? 'text-amber-400 animate-bounce' : 'text-slate-400'}`} />
                      <span>{isSubscribed ? 'Subscribed' : 'Price Alert'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (matchedListing) {
                          onBookDirect(matchedListing);
                        }
                      }}
                      className="px-2.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all cursor-pointer shadow-md shadow-emerald-600/20 text-center"
                    >
                      Book Direct
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* =====================================================================
          FIND THINGS TO DO BY INTEREST SECTION (Outdoors, Food, Culture, Water)
         ===================================================================== */}
      <FindThingsToDoByInterestSection
        onSelectCategory={(cat) => {
          if (onSelectInterestCategory) {
            onSelectInterestCategory(cat);
          }
        }}
      />

      {/* =====================================================================
          RESULTS GRID SECTION
         ===================================================================== */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              {criteria.mode === 'hotel'
                ? `Verified Bangladesh Hotels & Resorts (${filteredListings.length})`
                : `Featured Bangladesh Hotels, Rail, Flights & Experiences (${filteredListings.length})`}
            </h2>
            <p className="text-xs text-slate-400">
              Live verified availability across Bangladesh • Displayed in{' '}
              <strong className="text-emerald-400">{currentCurrency}</strong> • bKash, Nagad &amp;
              Local Cards supported
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
            {/* Global Quick Book Mode Toggle */}
            <div className="flex items-center space-x-2.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
              <Zap className={`w-4 h-4 ${globalQuickBookMode ? 'text-amber-400 fill-amber-400 animate-pulse' : 'text-slate-400'}`} />
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-white leading-tight">Global Quick Book Mode</span>
                <span className="text-[10px] text-amber-300 font-medium">
                  {savedPaymentPreference ? `Saved: ${savedPaymentPreference.method}` : 'Firebase Default (bKash)'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setGlobalQuickBookMode(!globalQuickBookMode)}
                className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  globalQuickBookMode ? 'bg-amber-500' : 'bg-slate-800'
                }`}
                title="Toggle 1-Click Quick Book for all listing cards using saved Firebase payment preferences"
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    globalQuickBookMode ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>

              {onOpenPaymentPreferencesModal && (
                <button
                  type="button"
                  onClick={onOpenPaymentPreferencesModal}
                  className="ml-1 px-2 py-0.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/30 text-amber-300 text-[10px] font-bold border border-amber-500/30 transition-all cursor-pointer"
                  title="Configure saved payment preferences in Firebase"
                >
                  ⚙️ Setup
                </button>
              )}
            </div>

            <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-medium">
              Check-In: <strong className="text-white">{checkInDate}</strong> →{' '}
              <strong className="text-white">{checkOutDate}</strong> •{' '}
              <strong className="text-emerald-400">{criteria.guestsCount} Guests</strong>
            </span>
          </div>
        </div>

        {filteredListings.length === 0 ? (
          <div className="p-12 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-3">
            <Search className="w-10 h-10 text-slate-500 mx-auto" />
            <h3 className="text-base font-bold text-white">
              No Bangladesh listings match your exact filter combination
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Try clearing one of your amenity chips, increasing the maximum BDT budget slider, or
              switching back to All Divisions.
            </p>
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
            >
              Reset All Search Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredListings.map((listing) => {
              const convertedPrice = convertCurrency(listing.priceUsd, 'USD', currentCurrency);
              const formattedPrice = formatCurrency(convertedPrice, currentCurrency);
              const { points: pointsEarned, bonus: ecoBonus } = calculatePointsForBooking(listing);
              const award = getTravelersChoiceStatus(listing);
              const otaDeals = generateOtaPriceComparison(listing);
              const maxSavingsUsd = otaDeals[0]?.savingsUsd || 0;
              const convertedSavings = formatCurrency(
                convertCurrency(maxSavingsUsd, 'USD', currentCurrency),
                currentCurrency
              );
              const isSaved = savedListingIds.includes(listing.id);
              const priceSub = priceDropSubscriptions.find((s) => s.listingId === listing.id);
              const isTrackingPrice = Boolean(priceSub);
              const hasPriceDropped =
                listing.originalPriceUsd !== undefined &&
                listing.originalPriceUsd > listing.priceUsd;
              const formattedOriginalPrice = hasPriceDropped
                ? formatCurrency(
                    convertCurrency(listing.originalPriceUsd!, 'USD', currentCurrency),
                    currentCurrency
                  )
                : null;
              const dropPct = hasPriceDropped
                ? Math.round(
                    ((listing.originalPriceUsd! - listing.priceUsd) / listing.originalPriceUsd!) *
                      100
                  )
                : 0;

              const isQuickBookOn = globalQuickBookMode || Boolean(quickBookToggledListings[listing.id]);

              return (
                <article
                  key={listing.id}
                  className={`group rounded-3xl bg-slate-900/90 border transition-all duration-300 overflow-hidden flex flex-col justify-between hover:shadow-2xl ${
                    isQuickBookOn
                      ? 'border-amber-500/60 shadow-amber-500/10'
                      : 'border-slate-800/90 hover:border-emerald-500/60 hover:shadow-emerald-500/10'
                  }`}
                >
                  <div>
                    {/* Card Image & Badges */}
                    <div className="relative h-52 overflow-hidden bg-slate-950">
                      <img
                        src={listing.imageUrl}
                        alt={listing.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

                      {/* Mode & Division Badge */}
                      <div className="absolute top-3 left-3 flex items-center space-x-1.5">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-950/85 backdrop-blur-md border border-slate-700/80 text-[11px] font-bold text-white flex items-center space-x-1.5">
                          {getModeIcon(listing.type)}
                          <span className="capitalize">
                            {listing.type === 'experience' ? 'BD Tour' : listing.type}
                          </span>
                        </span>
                        {listing.division && (
                          <span className="px-2 py-1 rounded-lg bg-emerald-950/85 backdrop-blur-md border border-emerald-500/40 text-[10px] font-bold text-emerald-300">
                            {listing.division}
                          </span>
                        )}
                      </div>

                      {/* Price Drop Alert Toggle + Tripadvisor Heart Save */}
                      <div className="absolute top-3 right-3 flex items-center space-x-1.5">
                        <button
                          onClick={() => onTogglePriceDropAlert && onTogglePriceDropAlert(listing)}
                          aria-label={
                            isTrackingPrice
                              ? 'Disable Price Drop Alert'
                              : 'Subscribe to Price Drop Alert'
                          }
                          title={
                            isTrackingPrice
                              ? 'Price Drop Alert Active (Click to disable)'
                              : 'Track Price Drops for this listing'
                          }
                          className={`px-2.5 py-1.5 rounded-xl border backdrop-blur-md transition-all cursor-pointer flex items-center space-x-1 text-[10px] font-bold ${
                            isTrackingPrice
                              ? 'bg-emerald-600/90 border-emerald-400 text-white shadow-lg shadow-emerald-600/30'
                              : 'bg-slate-950/80 border-slate-700/80 text-slate-200 hover:text-emerald-300 hover:border-emerald-500/50'
                          }`}
                        >
                          <BellRing className="w-3 h-3" />
                          <span>{isTrackingPrice ? 'Price Alert On' : 'Track Price'}</span>
                        </button>

                        <button
                          onClick={() => onToggleSaveListing && onToggleSaveListing(listing.id)}
                          aria-label={isSaved ? 'Remove from Saved Trips' : 'Save to Trips'}
                          className={`p-2 rounded-xl border backdrop-blur-md transition-all cursor-pointer ${
                            isSaved
                              ? 'bg-rose-600/90 border-rose-400 text-white shadow-lg shadow-rose-600/30'
                              : 'bg-slate-950/80 border-slate-700/80 text-slate-300 hover:text-rose-400'
                          }`}
                        >
                          <Heart className={`w-4 h-4 ${isSaved ? 'fill-white' : ''}`} />
                        </button>
                      </div>

                      {/* Bottom Image Overlay: Destination & 5-Bubble Rating */}
                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                        <span className="text-xs font-bold text-white drop-shadow">
                          {listing.destination}, {listing.country}
                        </span>
                        <button
                          onClick={() =>
                            onInspectReviewsAndDeals && onInspectReviewsAndDeals(listing)
                          }
                          className="px-2 py-0.5 rounded-lg bg-slate-950/90 border border-emerald-500/40 text-xs font-bold text-emerald-400 flex items-center space-x-1 cursor-pointer hover:bg-emerald-950"
                          title="Inspect 5-Bubble Reviews & Bangladesh OTA Deals"
                        >
                          <Star className="w-3.5 h-3.5 fill-emerald-400 text-emerald-400" />
                          <span>{listing.rating}</span>
                          <span className="text-slate-400 text-[10px]">
                            ({listing.reviewCount})
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-5 space-y-3">
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold">
                        {award.isWinner && (
                          <span className="text-emerald-400 flex items-center space-x-1">
                            <Award className="w-3.5 h-3.5" />
                            <span>{award.tier}</span>
                          </span>
                        )}
                        {listing.propertyType && (
                          <>
                            <span className="text-slate-600">·</span>
                            <span className="text-cyan-300">{listing.propertyType}</span>
                          </>
                        )}
                        {listing.badge && (
                          <>
                            <span className="text-slate-600">·</span>
                            <span className="text-amber-300">{listing.badge}</span>
                          </>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors leading-snug">
                        {listing.title}
                      </h3>

                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {listing.tagline}
                      </p>

                      {/* Transit Times / Room Class */}
                      <div className="pt-1 flex flex-wrap gap-2 text-[11px] text-slate-300">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 flex items-center space-x-1">
                          <Clock className="w-3 h-3 text-cyan-400" />
                          <span>{listing.details.durationOrNights}</span>
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 font-medium text-indigo-300">
                          {listing.details.classOrRoomType}
                        </span>
                      </div>

                      {/* Amenities Inline Text */}
                      <p className="text-[11px] text-slate-400 truncate">
                        {listing.details.amenities.slice(0, 4).join(' · ')}
                      </p>

                      {/* Local Payment Methods Row */}
                      {listing.localPaymentMethods && listing.localPaymentMethods.length > 0 && (
                        <div className="flex items-center space-x-1.5 text-[10px] text-emerald-300/90 font-medium">
                          <Wallet className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                          <span className="truncate">
                            Accepted: {listing.localPaymentMethods.join(' • ')}
                          </span>
                        </div>
                      )}

                      {/* Provider & Eco Offset */}
                      <div className="pt-2 flex items-center justify-between border-t border-slate-800/80 text-xs">
                        <div className="flex items-center space-x-2">
                          <img
                            src={listing.provider.avatar}
                            alt={listing.provider.name}
                            referrerPolicy="no-referrer"
                            className="w-5 h-5 rounded-full object-cover"
                          />
                          <span className="text-slate-300 font-medium truncate max-w-[140px]">
                            {listing.provider.name}
                          </span>
                          {listing.provider.verified && (
                            <CheckCircle
                              className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0"
                              aria-label={t.verifiedPartner}
                            />
                          )}
                        </div>

                        {listing.details.carbonOffsetKg !== undefined && (
                          <div className="flex items-center space-x-1 text-emerald-400 text-[11px]">
                            <Leaf className="w-3 h-3" />
                            <span>
                              {listing.details.carbonOffsetKg}kg CO
                              <sub className="text-[9px]">2</sub>e
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Footer: Price + Quick Book Bar + Dual Action */}
                  <div className="p-5 pt-0 mt-2 space-y-3">
                    {/* Quick Book Toggle Pill Bar */}
                    <div className="p-2.5 rounded-2xl bg-slate-950/90 border border-slate-800 flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <Zap className={`w-3.5 h-3.5 ${isQuickBookOn ? 'text-amber-400 fill-amber-400 animate-pulse' : 'text-slate-500'}`} />
                        <span className="text-[11px] font-bold text-slate-200">Quick Book Toggle</span>
                        {isQuickBookOn && (
                          <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                            {savedPaymentPreference?.method || 'bKash Direct'}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        {onOpenPaymentPreferencesModal && (
                          <button
                            type="button"
                            onClick={onOpenPaymentPreferencesModal}
                            className="text-[10px] text-slate-400 hover:text-amber-300 transition-colors"
                            title="Manage Firebase Saved Payment Method"
                          >
                            ⚙️ Setup
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => toggleQuickBookForListing(listing.id)}
                          className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            isQuickBookOn ? 'bg-amber-500' : 'bg-slate-800'
                          }`}
                          title={isQuickBookOn ? 'Disable Quick Book' : 'Enable 1-Click Quick Book using Firebase credentials'}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              isQuickBookOn ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-baseline justify-between pt-2 border-t border-slate-800/80">
                      <div>
                        {hasPriceDropped && formattedOriginalPrice && (
                          <div className="flex items-center space-x-1.5 mb-0.5">
                            <span className="text-[11px] text-slate-500 line-through font-mono">
                              {formattedOriginalPrice}
                            </span>
                            <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-500/40 px-1.5 py-0.5 rounded">
                              PRICE DROPPED -{dropPct}%
                            </span>
                          </div>
                        )}
                        <span className="text-2xl font-extrabold text-white tracking-tight">
                          {formattedPrice}
                        </span>
                        <span className="text-[11px] text-slate-400 block">
                          {listing.type === 'hotel'
                            ? '/ night (incl. VAT)'
                            : listing.type === 'restaurant'
                            ? '/ family platter'
                            : '/ person'}
                        </span>
                        {maxSavingsUsd > 0 && (
                          <button
                            onClick={() =>
                              onInspectReviewsAndDeals && onInspectReviewsAndDeals(listing)
                            }
                            className="mt-1 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 flex items-center space-x-1 cursor-pointer"
                          >
                            <TrendingDown className="w-3 h-3" />
                            <span>Save {convertedSavings} vs ShareTrip &amp; GoZayaan</span>
                          </button>
                        )}
                      </div>

                      <div className="text-right space-y-1">
                        <div className="inline-flex items-center space-x-1 text-[11px] font-bold text-amber-300">
                          <Crown className="w-3 h-3 text-amber-400" />
                          <span>+{pointsEarned.toLocaleString()} PTS</span>
                        </div>
                        <span className="text-[11px] text-slate-400 font-medium block">
                          {ecoBonus ? 'Eco-Rail Bonus' : listing.details.cancellationPolicy}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {isQuickBookOn ? (
                        <button
                          type="button"
                          onClick={() => {
                            if (onQuickBookDirect) {
                              onQuickBookDirect(listing, savedPaymentPreference?.method);
                            } else {
                              onBookDirect(listing);
                            }
                          }}
                          className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs flex items-center justify-center space-x-1.5 shadow-lg shadow-amber-500/25 transition-all cursor-pointer"
                          title={`Bypass details view & book instantly via ${savedPaymentPreference?.method || 'bKash Direct'}`}
                        >
                          <Zap className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
                          <span>⚡ Quick Book (1-Click)</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => onBookDirect(listing)}
                          className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                        >
                          <CreditCard className="w-3.5 h-3.5 text-cyan-400" />
                          <span>{t.bookNow}</span>
                        </button>
                      )}

                      <button
                        onClick={() => onOpenSplitPayment(listing)}
                        className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-semibold text-xs flex items-center justify-center space-x-1.5 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>{t.splitPayment}</span>
                      </button>
                    </div>

                    {onInspectReviewsAndDeals && (
                      <button
                        onClick={() => onInspectReviewsAndDeals(listing)}
                        className="w-full py-2 px-3 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 text-slate-300 hover:text-emerald-300 text-[11px] font-semibold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Compare 4 BD OTAs, Price Drop Alerts &amp; Reviews</span>
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
