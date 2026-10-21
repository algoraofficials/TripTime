import React, { useState, useRef, useEffect } from 'react';
import {
  MapPin,
  Calendar,
  User,
  ArrowLeftRight,
  Clock,
  Check,
  Sparkles,
  Plus,
  Minus,
  ChevronDown,
  Search,
  CheckCircle2,
} from 'lucide-react';
import { Listing } from '../types/travel';
import { SupportedCurrency, formatCurrency } from '../utils/currency';
import {
  SearchFilterCriteria,
  BANGLADESH_DESTINATIONS,
  BANGLADESH_ORIGIN_HUBS,
} from '../utils/bangladeshSearch';
import { InterestCategoryKey } from './InterestActivitiesPage';

export type ExpediaTabKey =
  | 'stays'
  | 'flights'
  | 'cars'
  | 'packages'
  | 'things_to_do'
  | 'cruises';

interface ExpediaSearchWidgetProps {
  criteria: SearchFilterCriteria;
  onUpdateCriteria: React.Dispatch<React.SetStateAction<SearchFilterCriteria>>;
  checkInDate: string;
  onChangeCheckInDate: (date: string) => void;
  listings: Listing[];
  currentCurrency: SupportedCurrency;
  onBookBundlePackage?: (stayListing: Listing, transitListing: Listing, discountedTotalUsd: number) => void;
  onSelectInterestCategory?: (category: InterestCategoryKey) => void;
}

/**
 * Custom multi-tone illustrated SVG icons matching Expedia's 6-tab header artwork
 * adapted for a high-contrast black/dark surface.
 */
const ExpediaTabIcon: React.FC<{ tab: ExpediaTabKey; active: boolean }> = ({ tab }) => {
  switch (tab) {
    case 'stays':
      return (
        <svg viewBox="0 0 48 40" className="w-9 h-8 shrink-0" fill="none" aria-hidden="true">
          {/* Headboard */}
          <rect x="9" y="8" width="30" height="14" rx="3" fill="#46769B" />
          {/* Two Pillows */}
          <rect x="13" y="13" width="9" height="6" rx="2" fill="#E2F1FF" />
          <rect x="26" y="13" y2="19" width="9" height="6" rx="2" fill="#E2F1FF" />
          {/* Mattress & Blanket */}
          <path d="M7 21C7 18.7909 8.79086 17 11 17H37C39.2091 17 41 18.7909 41 21V26H7V21Z" fill="#7FB3D5" />
          <rect x="7" y="23" width="34" height="6" rx="1.5" fill="#1F618D" />
          {/* Dark Navy Bed Frame & Legs */}
          <path d="M7 28H41V32H38V34H35V32H13V34H10V32H7V28Z" fill="#0F172A" />
          <rect x="7" y="28" width="34" height="3" fill="#38BDF8" fillOpacity="0.45" />
        </svg>
      );
    case 'flights':
      return (
        <svg viewBox="0 0 48 40" className="w-9 h-8 shrink-0" fill="none" aria-hidden="true">
          {/* Top & Bottom Wings */}
          <path d="M16 10L29 18L24 22L12 13L16 10Z" fill="#2874A6" />
          <path d="M22 25L35 32L38 29L27 20L22 25Z" fill="#2874A6" />
          {/* Tail Fin */}
          <path d="M11 24L16 21L19 25L13 29L11 24Z" fill="#1B4F72" />
          <path d="M15 28L20 24L22 27L17 32L15 28Z" fill="#5499C7" />
          {/* Fuselage */}
          <path
            d="M37.5 9.5C39.2 7.8 41.5 7.5 42.5 8.5C43.5 9.5 43.2 11.8 41.5 13.5L20 31C18.5 32.2 16.8 32 16 31C15.2 30 15.5 28.2 17 26.8L37.5 9.5Z"
            fill="#A9CCE3"
          />
          {/* Cockpit Window */}
          <path d="M38 11L40.5 13.5" stroke="#1B4F72" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'cars':
      return (
        <svg viewBox="0 0 48 40" className="w-9 h-8 shrink-0" fill="none" aria-hidden="true">
          {/* Roof & Cabin */}
          <path d="M13 11C14 9 16 8 18.5 8H29.5C32 8 34 9 35 11L38 18H10L13 11Z" fill="#A9CCE3" />
          {/* Windshield */}
          <path d="M14.5 12H33.5L35.5 17H12.5L14.5 12Z" fill="#1F618D" />
          {/* Car Body */}
          <rect x="8" y="18" width="32" height="11" rx="3" fill="#5499C7" />
          <rect x="8" y="23" width="32" height="6" rx="2" fill="#1F618D" />
          {/* Headlights */}
          <rect x="10" y="20" width="6" height="3" rx="1" fill="#F8FAFC" />
          <rect x="32" y="20" width="6" height="3" rx="1" fill="#F8FAFC" />
          {/* Yellow License Plate */}
          <rect x="21" y="24" width="6" height="3" rx="0.8" fill="#FACC15" />
          {/* Tires */}
          <rect x="9" y="28" width="6" height="5" rx="1.5" fill="#0F172A" />
          <rect x="33" y="28" width="6" height="5" rx="1.5" fill="#0F172A" />
          <rect x="9" y="29" width="6" height="2" fill="#64748B" />
          <rect x="33" y="29" width="6" height="2" fill="#64748B" />
        </svg>
      );
    case 'packages':
      return (
        <svg viewBox="0 0 48 40" className="w-9 h-8 shrink-0" fill="none" aria-hidden="true">
          {/* Top Plane */}
          <path d="M12 10L24 12L35 7C36.5 6.3 38 7 37.5 8.5L26 15L14 14L10 11.5L12 10Z" fill="#7FB3D5" />
          <path d="M21 12L25 17H22L19 13L21 12Z" fill="#2874A6" />
          {/* Left Suitcase */}
          <rect x="12" y="16" width="2" height="5" fill="#64748B" />
          <rect x="16" y="16" width="2" height="5" fill="#64748B" />
          <rect x="10" y="20" width="10" height="13" rx="2" fill="#1F618D" />
          <rect x="12" y="23" width="3" height="4" rx="0.5" fill="#FACC15" />
          {/* Right Mini Car */}
          <path d="M25 21H35L37 25H23L25 21Z" fill="#A9CCE3" />
          <rect x="22" y="25" width="16" height="7" rx="2" fill="#5499C7" />
          <rect x="24" y="27" width="3" height="2" rx="0.5" fill="#F8FAFC" />
          <rect x="33" y="27" width="3" height="2" rx="0.5" fill="#F8FAFC" />
          <rect x="23" y="31" width="4" height="3" rx="1" fill="#0F172A" />
          <rect x="33" y="31" width="4" height="3" rx="1" fill="#0F172A" />
        </svg>
      );
    case 'things_to_do':
      return (
        <svg viewBox="0 0 48 40" className="w-9 h-8 shrink-0" fill="none" aria-hidden="true">
          {/* Sparkle Rays */}
          <path d="M13 8L14.5 11M9 11L12 12.5M17 7L17 10.5" stroke="#FACC15" strokeWidth="2" strokeLinecap="round" />
          {/* Back Tilted Ticket */}
          <path
            d="M15 15L33 8L37 18L19 25L15 15Z"
            fill="#1F618D"
          />
          {/* Front Horizontal Ticket with Cutouts */}
          <path
            d="M10 18C10 16.8954 10.8954 16 12 16H36C37.1046 16 38 16.8954 38 18V21C36.3431 21 35 22.3431 35 24C35 25.6569 36.3431 27 38 27V30C38 31.1046 37.1046 32 36 32H12C10.8954 32 10 31.1046 10 30V27C11.6569 27 13 25.6569 13 24C13 22.3431 11.6569 21 10 21V18Z"
            fill="#85C1E9"
          />
          {/* Perforated Divider Line */}
          <line x1="27" y1="18" x2="27" y2="30" stroke="#1B4F72" strokeWidth="2" strokeDasharray="2.5 2.5" />
        </svg>
      );
    case 'cruises':
      return (
        <svg viewBox="0 0 48 40" className="w-9 h-8 shrink-0" fill="none" aria-hidden="true">
          {/* Golden Sun */}
          <circle cx="35" cy="12" r="4.5" fill="#FACC15" />
          {/* Funnel & Upper Decks */}
          <path d="M17 9H23L25 13H17V9Z" fill="#5499C7" />
          <rect x="13" y="13" width="20" height="5" rx="1" fill="#A9CCE3" />
          <rect x="11" y="18" width="24" height="5" rx="1" fill="#7FB3D5" />
          {/* Cabin Windows */}
          <line x1="15" y1="15.5" x2="30" y2="15.5" stroke="#0F172A" strokeWidth="2" strokeDasharray="2 2" />
          <line x1="13" y1="20.5" x2="32" y2="20.5" stroke="#0F172A" strokeWidth="2" strokeDasharray="2 2" />
          {/* Ship Hull */}
          <path d="M9 23H39L35 31H11C9.5 31 8.5 29.5 9 27.5L9 23Z" fill="#1F618D" />
        </svg>
      );
  }
};

export const ExpediaSearchWidget: React.FC<ExpediaSearchWidgetProps> = ({
  criteria,
  onUpdateCriteria,
  checkInDate,
  onChangeCheckInDate,
  listings,
  currentCurrency,
  onBookBundlePackage,
  onSelectInterestCategory,
}) => {
  // Active Expedia Tab (default 'stays' matching Image 1)
  const [activeTab, setActiveTab] = useState<ExpediaTabKey>('stays');

  // Check-out date (defaults to 6 days after check-in, e.g. Mon, Oct 26 - Sun, Nov 1)
  const [checkOutDate, setCheckOutDate] = useState<string>('2026-11-11');

  // Interactive Popovers
  const [showDatePopover, setShowDatePopover] = useState(false);
  const [showTravelersPopover, setShowTravelersPopover] = useState(false);
  const [showDestinationPopover, setShowDestinationPopover] = useState(false);

  // Travelers breakdown state
  const [adultsCount, setAdultsCount] = useState<number>(criteria.guestsCount || 2);
  const [childrenCount, setChildrenCount] = useState<number>(0);
  const [roomsCount, setRoomsCount] = useState<number>(criteria.roomsCount || 1);

  // Expedia Stays / Flights Bundle & Save checkboxes (Image 1)
  const [bundleFlightChecked, setBundleFlightChecked] = useState<boolean>(false);
  const [bundleCarOrRailChecked, setBundleCarOrRailChecked] = useState<boolean>(false);

  // Expedia Tab-Specific Sub-Controls
  const [flightTripType, setFlightTripType] = useState<'roundtrip' | 'oneway' | 'multicity'>('roundtrip');
  const [flightCabinClass, setFlightCabinClass] = useState<string>('Economy');
  const [carModeType, setCarModeType] = useState<'all_ground' | 'chander_gari' | 'railway'>('all_ground');
  const [pickUpTime, setPickUpTime] = useState<string>('10:30 AM');
  const [dropOffTime, setDropOffTime] = useState<string>('06:00 PM');
  const [packageBundleType, setPackageBundleType] = useState<'flight_stay' | 'train_stay' | 'flight_stay_car' | 'cruise_stay'>('flight_stay');
  const [thingsSubCategory, setThingsSubCategory] = useState<'all' | 'outdoors' | 'food' | 'culture' | 'water' | 'restaurants'>('all');
  const [cruiseDuration, setCruiseDuration] = useState<string>('Any duration');

  const datePopoverRef = useRef<HTMLDivElement>(null);
  const travelersPopoverRef = useRef<HTMLDivElement>(null);
  const destinationPopoverRef = useRef<HTMLDivElement>(null);

  // Close popovers on outside click
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        datePopoverRef.current &&
        !datePopoverRef.current.contains(event.target as Node)
      ) {
        setShowDatePopover(false);
      }
      if (
        travelersPopoverRef.current &&
        !travelersPopoverRef.current.contains(event.target as Node)
      ) {
        setShowTravelersPopover(false);
      }
      if (
        destinationPopoverRef.current &&
        !destinationPopoverRef.current.contains(event.target as Node)
      ) {
        setShowDestinationPopover(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Format date string into Expedia style "Mon, Oct 26"
  const formatExpediaShortDate = (isoDate: string): string => {
    if (!isoDate) return 'Select date';
    const parsed = new Date(`${isoDate}T12:00:00`);
    if (Number.isNaN(parsed.getTime())) return isoDate;
    return parsed.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  // Switch Expedia Tab and automatically map to underlying Marketplace criteria
  const handleSelectExpediaTab = (tab: ExpediaTabKey) => {
    setActiveTab(tab);
    setShowDatePopover(false);
    setShowTravelersPopover(false);
    setShowDestinationPopover(false);

    switch (tab) {
      case 'stays':
        onUpdateCriteria((prev) => ({
          ...prev,
          mode: 'hotel',
          searchQuery: '',
        }));
        break;
      case 'flights':
        onUpdateCriteria((prev) => ({
          ...prev,
          mode: 'flight',
          searchQuery: '',
        }));
        break;
      case 'cars':
        // Maps Cars tab to Chander Gari 4x4 Jeeps, Car Rentals & Bangladesh Railway
        onUpdateCriteria((prev) => ({
          ...prev,
          mode: 'train',
          searchQuery: '',
        }));
        break;
      case 'packages':
        onUpdateCriteria((prev) => ({
          ...prev,
          mode: 'all',
          searchQuery: '',
        }));
        break;
      case 'things_to_do':
        onUpdateCriteria((prev) => ({
          ...prev,
          mode: 'experience',
          searchQuery: '',
        }));
        break;
      case 'cruises':
        onUpdateCriteria((prev) => ({
          ...prev,
          mode: 'ship',
          searchQuery: '',
        }));
        break;
    }
  };

  // Update guests & rooms in parent criteria
  const handleUpdateTravelers = (nextAdults: number, nextChildren: number, nextRooms: number) => {
    const clampedAdults = Math.max(1, Math.min(12, nextAdults));
    const clampedChildren = Math.max(0, Math.min(8, nextChildren));
    const clampedRooms = Math.max(1, Math.min(6, nextRooms));
    setAdultsCount(clampedAdults);
    setChildrenCount(clampedChildren);
    setRoomsCount(clampedRooms);
    onUpdateCriteria((prev) => ({
      ...prev,
      guestsCount: clampedAdults + clampedChildren,
      roomsCount: clampedRooms,
    }));
  };

  // Swap Origin & Destination for Flights / Cars / Packages
  const handleSwapOriginDestination = () => {
    onUpdateCriteria((prev) => {
      const currentOrigin = prev.originHub;
      const currentDest = prev.destinationDistrict;
      return {
        ...prev,
        originHub: currentDest === 'all' ? 'all' : currentDest,
        destinationDistrict:
          currentOrigin === 'all' ? 'all' : currentOrigin.split('(')[0].trim(),
      };
    });
  };

  // Trigger Search execution
  const handleExecuteSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setShowDatePopover(false);
    setShowTravelersPopover(false);
    setShowDestinationPopover(false);

    if (activeTab === 'cars') {
      if (carModeType === 'chander_gari') {
        onUpdateCriteria((prev) => ({
          ...prev,
          mode: 'experience',
          searchQuery: 'Chander Gari',
        }));
      } else if (carModeType === 'railway') {
        onUpdateCriteria((prev) => ({
          ...prev,
          mode: 'train',
          searchQuery: '',
        }));
      } else {
        onUpdateCriteria((prev) => ({
          ...prev,
          mode: 'train',
        }));
      }
    } else if (activeTab === 'things_to_do') {
      if (thingsSubCategory === 'restaurants') {
        onUpdateCriteria((prev) => ({ ...prev, mode: 'restaurant' }));
      } else {
        onUpdateCriteria((prev) => ({ ...prev, mode: 'experience' }));
      }
    }
  };

  const totalTravelers = adultsCount + childrenCount;
  const destinationLabel =
    criteria.destinationDistrict !== 'all'
      ? criteria.destinationDistrict
      : criteria.searchQuery.trim() !== ''
        ? criteria.searchQuery
        : '';

  // Compute dynamic Bundle & Save combinations for Packages tab or when "Add a flight to Bundle & Save*" is checked
  const showBundleDealsStrip =
    activeTab === 'packages' || bundleFlightChecked || bundleCarOrRailChecked;

  const curatedBundles = [
    {
      id: 'bundle-coxs-air-sayeman',
      type: 'flight_stay',
      badge: 'Bundle & Save 18%',
      title: "Cox's Bazar Flight + Sayeman 5-Star Beachfront Package",
      stayId: 'hotel-coxs-sayeman',
      transitId: 'flight-dac-cxb',
      routeLabel: "Dhaka (DAC) ✈ Cox's Bazar (CXB) + 2 Nights Ocean Suite",
      originalUsd: 168,
      bundleUsd: 138,
    },
    {
      id: 'bundle-coxs-rail-sayeman',
      type: 'train_stay',
      badge: 'Bundle & Save 16%',
      title: "Cox's Bazar Express 814 Rail + Sayeman Beach Resort",
      stayId: 'hotel-coxs-sayeman',
      transitId: 'train-coxs-express',
      routeLabel: "Kamalapur 🚆 Cox's Bazar Oyster Station + Infinity Suite",
      originalUsd: 136,
      bundleUsd: 114,
    },
    {
      id: 'bundle-sylhet-air-sultan',
      type: 'flight_stay_car',
      badge: 'Bundle & Save 22%',
      title: 'US-Bangla Sylhet Flight + Grand Sultan Tea Resort + Swamp Tour',
      stayId: 'hotel-sylhet-sultan',
      transitId: 'flight-dac-zyl',
      routeLabel: 'Dhaka (DAC) ✈ Sylhet (ZYL) + Grand Sultan Tea Suite',
      originalUsd: 187,
      bundleUsd: 146,
    },
    {
      id: 'bundle-stmartin-cruise-stay',
      type: 'cruise_stay',
      badge: 'Bundle & Save 19%',
      title: "MV Bay One Ocean Liner + Cox's Bazar Marine Drive Stay",
      stayId: 'hotel-coxs-sayeman',
      transitId: 'ship-bay-one-stmartin',
      routeLabel: "Cox's Bazar 🛳 Saint Martin's Coral Island + Resort Stay",
      originalUsd: 185,
      bundleUsd: 149,
    },
  ];

  const tabs: { key: ExpediaTabKey; label: string }[] = [
    { key: 'stays', label: 'Stays' },
    { key: 'flights', label: 'Flights' },
    { key: 'cars', label: 'Cars' },
    { key: 'packages', label: 'Packages' },
    { key: 'things_to_do', label: 'Things to do' },
    { key: 'cruises', label: 'Cruises' },
  ];

  return (
    <div className="relative z-40 rounded-3xl bg-slate-950/95 border border-slate-800/90 shadow-2xl overflow-visible">
      {/* =====================================================================
          TOP 6-TAB EXPEDIA ICON NAVIGATION BAR (Black-Themed Image 1 Match)
         ===================================================================== */}
      <div className="px-4 sm:px-8 pt-4 border-b border-slate-800/90 flex items-center justify-between flex-wrap gap-2">
        <div
          role="tablist"
          aria-label="Expedia Travel Search Categories"
          className="flex items-center justify-center gap-3 sm:gap-8 mx-auto overflow-x-auto no-scrollbar"
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => handleSelectExpediaTab(tab.key)}
                className={`group relative pb-3.5 px-2 sm:px-3 flex flex-col items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0 focus:outline-none ${
                  isActive ? 'text-sky-400' : 'text-slate-300 hover:text-white'
                }`}
              >
                <div className="transition-transform duration-200 group-hover:-translate-y-0.5">
                  <ExpediaTabIcon tab={tab.key} active={isActive} />
                </div>
                <span className="text-xs sm:text-[13px] font-bold tracking-tight whitespace-nowrap">
                  {tab.label}
                </span>

                {/* Active Bottom Indicator Bar matching Image 1 */}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-[3px] rounded-t-full bg-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.65)]" />
                )}
              </button>
            );
          })}
        </div>

        {/* Optional "All Bangladesh (18)" quick-view pill on far right */}
        <button
          type="button"
          onClick={() => {
            onUpdateCriteria((prev) => ({
              ...prev,
              mode: 'all',
              destinationDistrict: 'all',
              originHub: 'all',
              searchQuery: '',
            }));
          }}
          className={`hidden xl:inline-flex items-center gap-1.5 px-3 py-1.5 mb-2 rounded-full text-[11px] font-semibold border transition-colors cursor-pointer ${
            criteria.mode === 'all' && activeTab !== 'packages'
              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
          }`}
        >
          <span>View All ({listings.length})</span>
        </button>
      </div>

      {/* =====================================================================
          DYNAMIC TAB BODY & UNIFIED ROUNDED-FULL PILL SEARCH BAR
         ===================================================================== */}
      <form onSubmit={handleExecuteSearch} className="p-5 sm:p-7 space-y-4">
        {/* TAB-SPECIFIC EXPEDIA SUB-CONTROLS ROW */}
        {activeTab === 'flights' && (
          <div className="flex flex-wrap items-center justify-between gap-3 pb-1">
            <div className="flex items-center gap-1.5">
              {(
                [
                  { id: 'roundtrip', label: 'Roundtrip' },
                  { id: 'oneway', label: 'One-way' },
                  { id: 'multicity', label: 'Multi-city' },
                ] as const
              ).map((ft) => (
                <button
                  key={ft.id}
                  type="button"
                  onClick={() => setFlightTripType(ft.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                    flightTripType === ft.id
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  {ft.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Cabin class:</span>
              <select
                value={flightCabinClass}
                onChange={(e) => setFlightCabinClass(e.target.value)}
                aria-label="Select flight cabin class"
                className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white font-semibold focus:outline-none cursor-pointer"
              >
                <option value="Economy">Economy</option>
                <option value="Premium Economy">Premium Economy</option>
                <option value="Business / Balaka Executive">Business / Balaka Executive</option>
              </select>
            </div>
          </div>
        )}

        {activeTab === 'cars' && (
          <div className="flex flex-wrap items-center justify-between gap-3 pb-1">
            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  {
                    id: 'all_ground',
                    label: 'All Ground Transit (Rail & Chander Gari)',
                  },
                  {
                    id: 'chander_gari',
                    label: 'Chander Gari 4x4 Jeeps & Airport Cars',
                  },
                  {
                    id: 'railway',
                    label: 'Bangladesh Railway Intercity Express',
                  },
                ] as const
              ).map((cm) => (
                <button
                  key={cm.id}
                  type="button"
                  onClick={() => {
                    setCarModeType(cm.id);
                    if (cm.id === 'chander_gari') {
                      onUpdateCriteria((prev) => ({
                        ...prev,
                        mode: 'experience',
                        searchQuery: 'Chander Gari',
                      }));
                    } else {
                      onUpdateCriteria((prev) => ({
                        ...prev,
                        mode: 'train',
                        searchQuery: '',
                      }));
                    }
                  }}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                    carModeType === cm.id
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  {cm.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Clock className="w-3.5 h-3.5 text-sky-400" />
              <span>Pick-up:</span>
              <select
                value={pickUpTime}
                onChange={(e) => setPickUpTime(e.target.value)}
                aria-label="Pick-up time"
                className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-white font-medium focus:outline-none cursor-pointer"
              >
                <option value="07:00 AM">07:00 AM</option>
                <option value="10:30 AM">10:30 AM</option>
                <option value="02:00 PM">02:00 PM</option>
                <option value="10:30 PM">10:30 PM (Night Express)</option>
              </select>
              <span>Drop-off:</span>
              <select
                value={dropOffTime}
                onChange={(e) => setDropOffTime(e.target.value)}
                aria-label="Drop-off time"
                className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-white font-medium focus:outline-none cursor-pointer"
              >
                <option value="12:00 PM">12:00 PM</option>
                <option value="06:00 PM">06:00 PM</option>
                <option value="09:00 PM">09:00 PM</option>
              </select>
            </div>
          </div>
        )}

        {activeTab === 'packages' && (
          <div className="flex flex-wrap items-center justify-between gap-3 pb-1">
            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  { id: 'flight_stay', label: 'Stay + Flight (Save 18%)' },
                  { id: 'train_stay', label: 'Stay + Train (Save 16%)' },
                  { id: 'flight_stay_car', label: 'Stay + Flight + Car (Save 22%)' },
                  { id: 'cruise_stay', label: 'Stay + Cruise (Save 19%)' },
                ] as const
              ).map((pkg) => (
                <button
                  key={pkg.id}
                  type="button"
                  onClick={() => setPackageBundleType(pkg.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                    packageBundleType === pkg.id
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  {pkg.label}
                </button>
              ))}
            </div>
            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Expedia Bundle &amp; Save Instant Package Discount Active</span>
            </span>
          </div>
        )}

        {activeTab === 'things_to_do' && (
          <div className="flex flex-wrap items-center justify-between gap-3 pb-1">
            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  { id: 'all', label: 'All Bangladesh Experiences' },
                  { id: 'outdoors', label: 'Outdoors & Nature' },
                  { id: 'food', label: 'Food & Kacchi Walks' },
                  { id: 'culture', label: 'Culture & Heritage' },
                  { id: 'water', label: 'Water & Coral Lagoons' },
                  { id: 'restaurants', label: 'BD Restaurants & Kacchi' },
                ] as const
              ).map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setThingsSubCategory(cat.id);
                    if (cat.id === 'restaurants') {
                      onUpdateCriteria((prev) => ({ ...prev, mode: 'restaurant' }));
                    } else if (cat.id === 'all') {
                      onUpdateCriteria((prev) => ({ ...prev, mode: 'experience' }));
                    } else if (onSelectInterestCategory) {
                      onSelectInterestCategory(cat.id);
                    }
                  }}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                    thingsSubCategory === cat.id
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'cruises' && (
          <div className="flex flex-wrap items-center justify-between gap-3 pb-1">
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { label: 'All Bay & Mangrove Cruises', dest: 'all' },
                { label: "Saint Martin's Coral Liner", dest: "Saint Martin's Island" },
                { label: 'Sundarbans Tiger Expedition', dest: 'Sundarbans / Khulna' },
              ].map((cr) => (
                <button
                  key={cr.label}
                  type="button"
                  onClick={() =>
                    onUpdateCriteria((prev) => ({
                      ...prev,
                      mode: 'ship',
                      destinationDistrict: cr.dest,
                    }))
                  }
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                    criteria.destinationDistrict === cr.dest
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  {cr.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>Cruise duration:</span>
              <select
                value={cruiseDuration}
                onChange={(e) => setCruiseDuration(e.target.value)}
                aria-label="Cruise duration"
                className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-white font-semibold focus:outline-none cursor-pointer"
              >
                <option value="Any duration">Any duration</option>
                <option value="1 Day Coastal Cruise">1 Day Coastal Cruise</option>
                <option value="2-3 Nights Mangrove Expedition">2–3 Nights Mangrove Expedition</option>
                <option value="4+ Nights Full Bay Voyage">4+ Nights Full Bay Voyage</option>
              </select>
            </div>
          </div>
        )}

        {/* ===================================================================
            MAIN ROUNDED-FULL PILL BAR (Black-Themed Match to Image 1)
           =================================================================== */}
        <div className="relative rounded-2xl lg:rounded-full bg-slate-900/95 border border-slate-700/80 p-1.5 sm:p-2 flex flex-col lg:flex-row items-stretch lg:items-center divide-y lg:divide-y-0 lg:divide-x divide-slate-800 shadow-inner">
          {/* OPTIONAL ORIGIN HUB FIELD (Shown on Flights, Cars, Packages) */}
          {(activeTab === 'flights' || activeTab === 'cars' || activeTab === 'packages') && (
            <div className="relative flex-1 min-w-[180px] px-4 py-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <MapPin className="w-5 h-5 text-sky-400 shrink-0" />
                <div className="min-w-0 flex-1">
                  <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    {activeTab === 'cars' ? 'Pick-up / Station' : 'Leaving from'}
                  </span>
                  <select
                    value={criteria.originHub}
                    onChange={(e) =>
                      onUpdateCriteria((prev) => ({ ...prev, originHub: e.target.value }))
                    }
                    aria-label="Origin hub"
                    className="w-full bg-transparent text-sm font-medium text-white focus:outline-none cursor-pointer truncate"
                  >
                    {BANGLADESH_ORIGIN_HUBS.map((hub) => (
                      <option key={hub} value={hub} className="bg-slate-900 text-white">
                        {hub === 'all' ? 'Dhaka / Any BD Hub' : hub}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSwapOriginDestination}
                title="Swap origin and destination"
                className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer shrink-0"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* 1. WHERE TO? / GOING TO FIELD */}
          <div
            ref={destinationPopoverRef}
            className="relative flex-[1.5] min-w-[220px] px-4 py-2 flex items-center gap-3"
          >
            <MapPin className="w-5 h-5 text-slate-200 shrink-0" />
            <div className="w-full min-w-0">
              {(activeTab === 'flights' || activeTab === 'cars' || activeTab === 'packages' || activeTab === 'cruises') && (
                <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  {activeTab === 'cars' ? 'Drop-off / Destination' : 'Going to'}
                </span>
              )}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={destinationLabel}
                  onFocus={() => setShowDestinationPopover(true)}
                  onChange={(e) => {
                    const val = e.target.value;
                    onUpdateCriteria((prev) => ({
                      ...prev,
                      destinationDistrict: 'all',
                      searchQuery: val,
                    }));
                    setShowDestinationPopover(true);
                  }}
                  placeholder={
                    activeTab === 'stays'
                      ? 'Where to?'
                      : activeTab === 'things_to_do'
                        ? 'Going to (Cox’s Bazar, Sylhet, Old Dhaka...)'
                        : 'Where to?'
                  }
                  aria-label="Where to destination or search keyword"
                  className="w-full bg-transparent text-sm sm:text-[15px] font-medium text-white placeholder-slate-400 focus:outline-none truncate"
                />
                {destinationLabel && (
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateCriteria((prev) => ({
                        ...prev,
                        destinationDistrict: 'all',
                        searchQuery: '',
                      }))
                    }
                    className="text-[11px] text-slate-400 hover:text-white px-1.5 py-0.5 rounded bg-slate-800 cursor-pointer shrink-0"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Destination Quick-Select Popover (Full-View 2-Column PC Grid, No Scrollbar Clipping) */}
            {showDestinationPopover && (
              <div className="absolute left-0 top-full mt-3 w-80 sm:w-[480px] rounded-2xl bg-slate-950 border border-slate-700/90 shadow-[0_24px_64px_rgba(0,0,0,0.9)] p-4 z-[100] space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <span className="text-xs font-bold text-white">
                    Popular Destinations in Bangladesh
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowDestinationPopover(false)}
                    className="text-xs font-semibold text-sky-400 hover:text-sky-300 cursor-pointer"
                  >
                    Done
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {BANGLADESH_DESTINATIONS.map((dest) => {
                    const isSelected = criteria.destinationDistrict === dest;
                    return (
                      <button
                        key={dest}
                        type="button"
                        onClick={() => {
                          onUpdateCriteria((prev) => ({
                            ...prev,
                            destinationDistrict: dest,
                            searchQuery: '',
                          }));
                          setShowDestinationPopover(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                            : 'bg-slate-900/70 text-slate-200 hover:bg-slate-800 border border-slate-800/60'
                        }`}
                      >
                        <span className="flex items-center gap-2 truncate">
                          <MapPin className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                          <span className="truncate">
                            {dest === 'all' ? 'All BD Destinations' : dest}
                          </span>
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-sky-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 2. DATES FIELD (e.g. Mon, Oct 26 - Sun, Nov 1) */}
          <div ref={datePopoverRef} className="relative flex-1 min-w-[215px] px-4 py-2">
            <button
              type="button"
              onClick={() => {
                setShowDatePopover((prev) => !prev);
                setShowTravelersPopover(false);
                setShowDestinationPopover(false);
              }}
              className="w-full flex items-center gap-3 text-left cursor-pointer focus:outline-none"
            >
              <Calendar className="w-5 h-5 text-slate-200 shrink-0" />
              <div className="min-w-0 flex-1">
                <span className="block text-sm sm:text-[15px] font-medium text-white truncate">
                  {activeTab === 'flights' && flightTripType === 'oneway'
                    ? formatExpediaShortDate(checkInDate)
                    : `${formatExpediaShortDate(checkInDate)} - ${formatExpediaShortDate(checkOutDate)}`}
                </span>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
            </button>

            {/* Interactive Date Range Picker Popover */}
            {showDatePopover && (
              <div className="absolute left-0 sm:left-auto sm:right-0 top-full mt-3 w-80 sm:w-96 rounded-2xl bg-slate-950 border border-slate-700/90 shadow-[0_24px_64px_rgba(0,0,0,0.9)] p-4 z-[100] space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <span className="text-xs font-bold text-white">
                    {activeTab === 'stays'
                      ? 'Check-in & Check-out Dates'
                      : activeTab === 'cruises'
                        ? 'Departing Between Dates'
                        : 'Departure & Return Dates'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowDatePopover(false)}
                    className="text-xs font-semibold text-sky-400 hover:text-sky-300 cursor-pointer"
                  >
                    Done
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="expedia-checkin-input"
                      className="block text-[11px] font-semibold text-slate-400 mb-1"
                    >
                      {activeTab === 'stays' ? 'Check-in' : 'Departing'}
                    </label>
                    <input
                      id="expedia-checkin-input"
                      type="date"
                      value={checkInDate}
                      onChange={(e) => onChangeCheckInDate(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-400"
                    />
                  </div>

                  {!(activeTab === 'flights' && flightTripType === 'oneway') && (
                    <div>
                      <label
                        htmlFor="expedia-checkout-input"
                        className="block text-[11px] font-semibold text-slate-400 mb-1"
                      >
                        {activeTab === 'stays' ? 'Check-out' : 'Returning'}
                      </label>
                      <input
                        id="expedia-checkout-input"
                        type="date"
                        value={checkOutDate}
                        min={checkInDate}
                        onChange={(e) => setCheckOutDate(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-400"
                      />
                    </div>
                  )}
                </div>

                {/* Quick Weekend / 6-Night Presets */}
                <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      onChangeCheckInDate('2026-10-26');
                      setCheckOutDate('2026-11-01');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 cursor-pointer"
                  >
                    Mon, Oct 26 - Sun, Nov 1
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onChangeCheckInDate('2026-11-05');
                      setCheckOutDate('2026-11-08');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 cursor-pointer"
                  >
                    Next Weekend (3 Nights)
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 3. TRAVELERS & ROOMS FIELD (e.g. 2 travelers, 1 room) */}
          <div ref={travelersPopoverRef} className="relative flex-1 min-w-[200px] px-4 py-2">
            <button
              type="button"
              onClick={() => {
                setShowTravelersPopover((prev) => !prev);
                setShowDatePopover(false);
                setShowDestinationPopover(false);
              }}
              className="w-full flex items-center gap-3 text-left cursor-pointer focus:outline-none"
            >
              <User className="w-5 h-5 text-slate-200 shrink-0" />
              <div className="min-w-0 flex-1">
                <span className="block text-sm sm:text-[15px] font-medium text-white truncate">
                  {totalTravelers} {totalTravelers === 1 ? 'traveler' : 'travelers'}
                  {activeTab === 'stays' || activeTab === 'packages' || activeTab === 'cruises'
                    ? `, ${roomsCount} ${roomsCount === 1 ? 'room' : 'rooms'}`
                    : ''}
                </span>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
            </button>

            {/* Interactive Travelers & Rooms Stepper Popover */}
            {showTravelersPopover && (
              <div className="absolute right-0 top-full mt-3 w-80 rounded-2xl bg-slate-950 border border-slate-700/90 shadow-[0_24px_64px_rgba(0,0,0,0.9)] p-4 z-[100] space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <span className="text-xs font-bold text-white">Travelers &amp; Rooms</span>
                  <span className="text-[11px] font-mono text-sky-400">
                    {totalTravelers} guests · {roomsCount} rm
                  </span>
                </div>

                {/* Rooms Stepper */}
                {(activeTab === 'stays' || activeTab === 'packages' || activeTab === 'cruises') && (
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-white block">
                        {activeTab === 'cruises' ? 'Cabins' : 'Rooms'}
                      </span>
                      <span className="text-[11px] text-slate-400">Couple-friendly NID supported</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateTravelers(adultsCount, childrenCount, roomsCount - 1)
                        }
                        disabled={roomsCount <= 1}
                        aria-label="Decrease rooms"
                        className="w-7 h-7 rounded-full border border-slate-700 flex items-center justify-center text-white disabled:opacity-40 hover:bg-slate-800 cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-5 text-center text-xs font-mono font-bold text-white">
                        {roomsCount}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateTravelers(adultsCount, childrenCount, roomsCount + 1)
                        }
                        aria-label="Increase rooms"
                        className="w-7 h-7 rounded-full border border-slate-700 flex items-center justify-center text-white hover:bg-slate-800 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Adults Stepper */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-white block">Adults</span>
                    <span className="text-[11px] text-slate-400">Ages 18 or above</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateTravelers(adultsCount - 1, childrenCount, roomsCount)
                      }
                      disabled={adultsCount <= 1}
                      aria-label="Decrease adults"
                      className="w-7 h-7 rounded-full border border-slate-700 flex items-center justify-center text-white disabled:opacity-40 hover:bg-slate-800 cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-5 text-center text-xs font-mono font-bold text-white">
                      {adultsCount}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateTravelers(adultsCount + 1, childrenCount, roomsCount)
                      }
                      aria-label="Increase adults"
                      className="w-7 h-7 rounded-full border border-slate-700 flex items-center justify-center text-white hover:bg-slate-800 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Children Stepper */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-white block">Children</span>
                    <span className="text-[11px] text-slate-400">Ages 0 to 17</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateTravelers(adultsCount, childrenCount - 1, roomsCount)
                      }
                      disabled={childrenCount <= 0}
                      aria-label="Decrease children"
                      className="w-7 h-7 rounded-full border border-slate-700 flex items-center justify-center text-white disabled:opacity-40 hover:bg-slate-800 cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-5 text-center text-xs font-mono font-bold text-white">
                      {childrenCount}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateTravelers(adultsCount, childrenCount + 1, roomsCount)
                      }
                      aria-label="Increase children"
                      className="w-7 h-7 rounded-full border border-slate-700 flex items-center justify-center text-white hover:bg-slate-800 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowTravelersPopover(false)}
                  className="w-full py-2 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Done
                </button>
              </div>
            )}
          </div>

          {/* 4. RIGHT-ALIGNED EXPEDIA BLUE ROUNDED-FULL SEARCH BUTTON */}
          <div className="pl-2 pr-1 py-1 flex items-center justify-end shrink-0">
            <button
              type="submit"
              className="w-full lg:w-auto px-7 py-3 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold inline-flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all cursor-pointer whitespace-nowrap"
            >
              <Search className="w-4 h-4 lg:hidden" />
              <span>Search</span>
            </button>
          </div>
        </div>

        {/* ===================================================================
            BOTTOM BUNDLE & SAVE CHECKBOX ROW (Image 1 Exact Match in Dark Mode)
           =================================================================== */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-1 px-1">
          <div className="flex flex-wrap items-center gap-6">
            {(activeTab === 'stays' || activeTab === 'flights') && (
              <label className="inline-flex items-center gap-2.5 text-xs sm:text-sm text-slate-200 hover:text-white cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={bundleFlightChecked}
                  onChange={(e) => setBundleFlightChecked(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-600 bg-slate-900 accent-sky-500 cursor-pointer"
                />
                <span>
                  {activeTab === 'flights'
                    ? 'Add a place to stay to Bundle & Save*'
                    : 'Add a flight to Bundle & Save*'}
                </span>
              </label>
            )}

            {activeTab === 'stays' && (
              <label className="inline-flex items-center gap-2.5 text-xs sm:text-sm text-slate-300 hover:text-white cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={bundleCarOrRailChecked}
                  onChange={(e) => setBundleCarOrRailChecked(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-600 bg-slate-900 accent-sky-500 cursor-pointer"
                />
                <span>Add a car or Bangladesh Railway transfer</span>
              </label>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>OneKey Member Price &amp; bKash/Nagad Instant Checkout</span>
            </span>
          </div>
        </div>

        {/* ===================================================================
            LIVE EXPEDIA BUNDLE & SAVE PACKAGES SHOWCASE
            (Appears when "Packages" tab is selected OR "Add a flight to Bundle & Save*" is checked)
           =================================================================== */}
        {showBundleDealsStrip && (
          <div className="mt-4 pt-4 border-t border-slate-800/90 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/40 text-[11px] font-bold">
                  Bundle &amp; Save*
                </span>
                <h3 className="text-sm font-bold text-white">
                  Expedia-Style Flight / Rail + Resort Vacation Packages (Save up to 22%)
                </h3>
              </div>
              <span className="text-xs text-slate-400">
                Book stay + transit together in a single Digital Wallet checkout
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
              {curatedBundles.map((b) => {
                const stayItem = listings.find((l) => l.id === b.stayId) || listings[0];
                const transitItem = listings.find((l) => l.id === b.transitId) || listings[1];

                return (
                  <div
                    key={b.id}
                    className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-sky-500/50 flex flex-col justify-between gap-3 transition-colors"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold text-emerald-400">{b.badge}</span>
                        <span className="text-[11px] font-mono line-through text-slate-500">
                          {formatCurrency(b.originalUsd, currentCurrency)}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-white leading-snug">{b.title}</h4>
                      <p className="text-[11px] text-slate-400">{b.routeLabel}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Bundle Total</span>
                        <span className="text-sm font-extrabold font-mono tabular-nums text-white">
                          {formatCurrency(b.bundleUsd, currentCurrency)}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (onBookBundlePackage && stayItem && transitItem) {
                            onBookBundlePackage(stayItem, transitItem, b.bundleUsd);
                          }
                        }}
                        className="px-3 py-1.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold cursor-pointer transition-colors"
                      >
                        Book Bundle
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </form>
    </div>
  );
};
