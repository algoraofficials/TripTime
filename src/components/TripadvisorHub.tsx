import React, { useState, useMemo } from 'react';
import {
  Star,
  Heart,
  MessageSquare,
  ThumbsUp,
  Award,
  CheckCircle2,
  Search,
  Plus,
  ExternalLink,
  Sparkles,
  Utensils,
  Compass,
  Building2,
  Plane,
  Train,
  Ship,
  Users,
  HelpCircle,
  Send,
  Calendar,
  Download,
  TrendingDown,
  ShieldCheck,
  MapPin,
  Trash2,
  FolderHeart,
  BellRing,
  Zap,
} from 'lucide-react';
import {
  Listing,
  TravelerReview,
  CommunityQuestion,
  TripBoard,
  TravelerType,
  PriceDropSubscription,
} from '../types/travel';
import {
  SupportedCurrency,
  convertCurrency,
  formatCurrency,
} from '../utils/currency';
import {
  calculateReviewStats,
  filterReviews,
  generateOtaPriceComparison,
  getTravelersChoiceStatus,
  calculateTripBoardSummary,
  calculatePriceDropMetrics,
} from '../utils/tripadvisorFeatures';
import { generateIcsFeed } from '../utils/calendar';

interface TripadvisorHubProps {
  listings: Listing[];
  selectedListingId: string;
  onSelectListingId: (id: string) => void;
  reviews: TravelerReview[];
  onAddReview: (newReview: TravelerReview) => void;
  onHelpfulReview: (reviewId: string) => void;
  questions: CommunityQuestion[];
  onAddQuestion: (listingId: string, questionText: string) => void;
  onAddAnswer: (questionId: string, answerText: string) => void;
  savedListingIds: string[];
  onToggleSaveListing: (listingId: string) => void;
  tripBoards: TripBoard[];
  onCreateTripBoard: (name: string, description: string, targetDate: string) => void;
  priceDropSubscriptions: PriceDropSubscription[];
  onTogglePriceDropAlert: (listing: Listing) => void;
  onUpdatePriceDropTarget: (listingId: string, targetPriceUsd: number) => void;
  onSimulatePriceDrop: (listing: Listing, dropPercent?: number) => void;
  onScanAllPriceDrops: () => void;
  onBookListing: (listing: Listing) => void;
  currentCurrency: SupportedCurrency;
  onNotify: (title: string, subtitle?: string, type?: 'push' | 'info') => void;
}

export const TripadvisorHub: React.FC<TripadvisorHubProps> = ({
  listings,
  selectedListingId,
  onSelectListingId,
  reviews,
  onAddReview,
  onHelpfulReview,
  questions,
  onAddQuestion,
  onAddAnswer,
  savedListingIds,
  onToggleSaveListing,
  tripBoards,
  onCreateTripBoard,
  priceDropSubscriptions,
  onTogglePriceDropAlert,
  onUpdatePriceDropTarget,
  onSimulatePriceDrop,
  onScanAllPriceDrops,
  onBookListing,
  currentCurrency,
  onNotify,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'inspector' | 'price_alerts' | 'trips' | 'tally'>('inspector');
  const [quickAddSubListingId, setQuickAddSubListingId] = useState<string>(listings[1]?.id || listings[0].id);

  // Review filter state
  const [travelerTypeFilter, setTravelerTypeFilter] = useState<TravelerType | 'ALL'>('ALL');
  const [reviewSearch, setReviewSearch] = useState('');
  const [showWriteReviewForm, setShowWriteReviewForm] = useState(false);

  // Write a Review form state
  const [newReviewRating, setNewReviewRating] = useState<number>(5);
  const [newReviewType, setNewReviewType] = useState<TravelerType>('Couples');
  const [newReviewTitle, setNewReviewTitle] = useState('');
  const [newReviewComment, setNewReviewComment] = useState('');
  const [newReviewAuthor, setNewReviewAuthor] = useState('Tanvir Rahman');

  // Q&A form state
  const [newQuestionText, setNewQuestionText] = useState('');
  const [replyingToQuestionId, setReplyingToQuestionId] = useState<string | null>(null);
  const [newAnswerText, setNewAnswerText] = useState('');

  // Trip Boards state
  const [activeBoardId, setActiveBoardId] = useState<string>(
    tripBoards[0]?.id || 'trip-kyoto-autumn'
  );
  const [newBoardName, setNewBoardName] = useState('');
  const [newBoardDesc, setNewBoardDesc] = useState('');
  const [newBoardDate, setNewBoardDate] = useState('2026-11-15');

  const selectedListing = useMemo(
    () => listings.find((l) => l.id === selectedListingId) || listings[0],
    [listings, selectedListingId]
  );

  const orderedReviews = useMemo(() => {
    const primary = reviews.filter((r) => r.listingId === selectedListing.id);
    const others = reviews.filter((r) => r.listingId !== selectedListing.id);
    return [...primary, ...others];
  }, [reviews, selectedListing.id]);

  const reviewStats = useMemo(
    () => calculateReviewStats(orderedReviews),
    [orderedReviews]
  );

  const filteredReviews = useMemo(
    () =>
      filterReviews(orderedReviews, {
        travelerType: travelerTypeFilter,
        searchQuery: reviewSearch,
      }),
    [orderedReviews, travelerTypeFilter, reviewSearch]
  );

  const otaOffers = useMemo(
    () => generateOtaPriceComparison(selectedListing),
    [selectedListing]
  );

  const awardStatus = useMemo(
    () => getTravelersChoiceStatus(selectedListing),
    [selectedListing]
  );

  const listingQuestions = useMemo(() => {
    const specific = questions.filter((q) => q.listingId === selectedListing.id);
    return specific.length > 0 ? specific : questions;
  }, [questions, selectedListing.id]);

  const savedListings = useMemo(
    () => listings.filter((l) => savedListingIds.includes(l.id)),
    [listings, savedListingIds]
  );

  const savedSummary = useMemo(
    () => calculateTripBoardSummary(savedListings),
    [savedListings]
  );

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewTitle.trim() || !newReviewComment.trim()) return;

    const created: TravelerReview = {
      id: `rev-${Date.now()}`,
      listingId: selectedListing.id,
      authorName: newReviewAuthor.trim() || 'Tanvir Rahman',
      authorAvatar:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      authorHome: 'Gulshan, Dhaka, Bangladesh',
      contributionsCount: 18,
      rating: newReviewRating,
      travelerType: newReviewType,
      visitDate: 'October 2026',
      title: newReviewTitle.trim(),
      comment: newReviewComment.trim(),
      helpfulCount: 1,
      subRatings: {
        location: newReviewRating,
        cleanliness: newReviewRating,
        service: newReviewRating,
        value: Math.max(4, newReviewRating),
      },
    };

    onAddReview(created);
    setNewReviewTitle('');
    setNewReviewComment('');
    setShowWriteReviewForm(false);
  };

  const handleQuestionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestionText.trim()) return;
    onAddQuestion(selectedListing.id, newQuestionText.trim());
    setNewQuestionText('');
  };

  const handleCreateBoardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBoardName.trim()) return;
    onCreateTripBoard(
      newBoardName.trim(),
      newBoardDesc.trim() || 'Custom curated itinerary & saved places',
      newBoardDate
    );
    setNewBoardName('');
    setNewBoardDesc('');
  };

  const renderBubbles = (score: number) => {
    const full = Math.round(score);
    return (
      <div className="inline-flex items-center space-x-1" aria-label={`${score} out of 5 bubbles`}>
        {[1, 2, 3, 4, 5].map((idx) => (
          <span
            key={idx}
            className={`w-3.5 h-3.5 rounded-full inline-block border ${
              idx <= full
                ? 'bg-emerald-400 border-emerald-300 shadow-sm shadow-emerald-500/30'
                : 'bg-slate-800 border-slate-700'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Hero Banner */}
      <div className="rounded-3xl bg-gradient-to-br from-emerald-950/80 via-slate-900 to-indigo-950/80 border border-emerald-700/40 p-6 sm:p-8 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <Award className="w-4 h-4" />
              <span>Tripadvisor Parity & Community Intelligence Suite</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Verified Bubble Reviews, Multi-OTA Price Comparison, Q&A & Trips Boards
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Every core capability from Tripadvisor.com tailored for <strong className="text-emerald-300">Bangladesh locals</strong>: explore{' '}
              <strong className="text-white">Bangladesh Things to Do</strong> &{' '}
              <strong className="text-white">Old Dhaka / Sylheti Restaurants</strong>, compare live BDT (Tk) rates across{' '}
              <strong className="text-emerald-300">ShareTrip, GoZayaan &amp; Shohoz</strong>, filter{' '}
              <strong className="text-white">5-Bubble Traveler Reviews</strong>, ask questions in{' '}
              <strong className="text-white">Community Q&amp;A</strong>, and curate{' '}
              <strong className="text-rose-300">Saved Trips Wishlist Boards</strong>.
            </p>
          </div>

          {/* Sub-Navigation Switcher */}
          <div className="flex flex-wrap items-center gap-2 bg-slate-950/90 p-1.5 rounded-2xl border border-slate-800 self-start">
            <button
              onClick={() => setActiveSubTab('inspector')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                activeSubTab === 'inspector'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Star className="w-3.5 h-3.5" />
              <span>Reviews, OTA Deals & Q&A</span>
            </button>

            <button
              onClick={() => setActiveSubTab('price_alerts')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                activeSubTab === 'price_alerts'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'text-cyan-300 hover:text-white'
              }`}
            >
              <BellRing className="w-3.5 h-3.5" />
              <span>Price Drop Alerts ({priceDropSubscriptions.length})</span>
            </button>

            <button
              onClick={() => setActiveSubTab('trips')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                activeSubTab === 'trips'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Heart className="w-3.5 h-3.5" />
              <span>Saved Trips ({savedListings.length})</span>
            </button>

            <button
              onClick={() => setActiveSubTab('tally')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                activeSubTab === 'tally'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Tripadvisor Feature Tally</span>
            </button>
          </div>
        </div>
      </div>

      {/* =====================================================================
          SUB-TAB 1: REVIEWS, MULTI-OTA PRICE COMPARISON & COMMUNITY Q&A
         ===================================================================== */}
      {activeSubTab === 'inspector' && (
        <div className="space-y-8">
          {/* Listing Selector Bar */}
          <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <img
                src={selectedListing.imageUrl}
                alt={selectedListing.title}
                referrerPolicy="no-referrer"
                className="w-16 h-16 rounded-2xl object-cover border border-slate-700 flex-shrink-0"
              />
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-emerald-400 font-semibold">
                  <span className="uppercase">{selectedListing.type}</span>
                  <span>·</span>
                  <span>
                    {selectedListing.destination}, {selectedListing.country}
                  </span>
                  {awardStatus.isWinner && (
                    <>
                      <span>·</span>
                      <span className="text-amber-300 font-bold flex items-center space-x-1">
                        <Award className="w-3.5 h-3.5 text-amber-400" />
                        <span>{awardStatus.tier}</span>
                      </span>
                    </>
                  )}
                </div>
                <h2 className="text-lg font-bold text-white mt-0.5">{selectedListing.title}</h2>
                <div className="flex items-center space-x-2 mt-1">
                  {renderBubbles(selectedListing.rating)}
                  <span className="text-xs font-bold text-white">{selectedListing.rating}</span>
                  <span className="text-xs text-slate-400">
                    ({selectedListing.reviewCount.toLocaleString()} verified reviews)
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div>
                <label htmlFor="inspect-listing-select" className="block text-[11px] text-slate-400 mb-1">
                  Switch Property / Experience / Restaurant:
                </label>
                <select
                  id="inspect-listing-select"
                  value={selectedListing.id}
                  onChange={(e) => onSelectListingId(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  {listings.map((item) => (
                    <option key={item.id} value={item.id}>
                      [{item.type.toUpperCase()}] {item.title} ({item.destination})
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => onTogglePriceDropAlert(selectedListing)}
                className={`px-3.5 py-2.5 rounded-xl border text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer self-end ${
                  priceDropSubscriptions.some((s) => s.listingId === selectedListing.id)
                    ? 'bg-emerald-600/20 border-emerald-500/60 text-emerald-300'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                <BellRing className="w-4 h-4 text-emerald-400" />
                <span>
                  {priceDropSubscriptions.some((s) => s.listingId === selectedListing.id)
                    ? 'Price Drop Alert Active'
                    : 'Track Price Drops'}
                </span>
              </button>

              <button
                onClick={() => onToggleSaveListing(selectedListing.id)}
                className={`px-3.5 py-2.5 rounded-xl border text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer self-end ${
                  savedListingIds.includes(selectedListing.id)
                    ? 'bg-rose-600/20 border-rose-500/50 text-rose-300'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                <Heart
                  className={`w-4 h-4 ${
                    savedListingIds.includes(selectedListing.id)
                      ? 'fill-rose-500 text-rose-500'
                      : ''
                  }`}
                />
                <span>
                  {savedListingIds.includes(selectedListing.id) ? 'Saved to Trips' : 'Save to Trips'}
                </span>
              </button>
            </div>
          </div>

          {/* Multi-OTA Price Comparison Matrix + Live Price Drop Alert Monitor */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <TrendingDown className="w-4 h-4 text-emerald-400" />
                  <span>Tripadvisor Multi-OTA Price Comparison ({otaOffers.length} Verified Partners)</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Real-time rate parity check across global booking agencies, official direct channels, and dining/tour partners
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => onSimulatePriceDrop(selectedListing, 15)}
                  className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>Simulate Price Drop (-15%)</span>
                </button>

                <span className="text-xs font-bold text-emerald-400 flex items-center space-x-1">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Lowest Price Match Guarantee</span>
                </span>
              </div>
            </div>

            {/* Active Price Drop Banner if price decreased */}
            {selectedListing.originalPriceUsd !== undefined &&
              selectedListing.originalPriceUsd > selectedListing.priceUsd && (
                <div className="p-3.5 rounded-2xl bg-emerald-950/50 border border-emerald-500/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center space-x-2 text-emerald-300">
                    <BellRing className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>
                      <strong>PRICE DROP ALERT TRIGGERED:</strong> Rate dropped from{' '}
                      <span className="line-through text-slate-400 font-mono">
                        {formatCurrency(
                          convertCurrency(selectedListing.originalPriceUsd, 'USD', currentCurrency),
                          currentCurrency
                        )}
                      </span>{' '}
                      to{' '}
                      <strong className="text-white font-mono">
                        {formatCurrency(
                          convertCurrency(selectedListing.priceUsd, 'USD', currentCurrency),
                          currentCurrency
                        )}
                      </strong>{' '}
                      (Save{' '}
                      {Math.round(
                        ((selectedListing.originalPriceUsd - selectedListing.priceUsd) /
                          selectedListing.originalPriceUsd) *
                          100
                      )}
                      %)! Notification sent to your Alert Center.
                    </span>
                  </div>
                  <button
                    onClick={() => setActiveSubTab('price_alerts')}
                    className="text-xs font-bold text-cyan-300 hover:text-white underline whitespace-nowrap cursor-pointer"
                  >
                    Manage Price Alerts →
                  </button>
                </div>
              )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {otaOffers.map((offer) => {
                const converted = convertCurrency(offer.priceUsd, 'USD', currentCurrency);
                const formatted = formatCurrency(converted, currentCurrency);
                const convertedSavings = convertCurrency(offer.savingsUsd, 'USD', currentCurrency);

                return (
                  <div
                    key={offer.id}
                    className={`p-4 rounded-2xl border flex flex-col justify-between space-y-3 transition-all ${
                      offer.isLowestPrice
                        ? 'bg-emerald-950/30 border-emerald-500/60 ring-1 ring-emerald-500/30'
                        : 'bg-slate-950 border-slate-800'
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2 text-[11px]">
                        <span
                          className={
                            offer.isLowestPrice
                              ? 'text-emerald-400 font-bold'
                              : 'text-slate-400 font-medium'
                          }
                        >
                          {offer.partnerBadge}
                        </span>
                        {offer.savingsUsd > 0 && (
                          <span className="text-emerald-300 font-semibold whitespace-nowrap flex-shrink-0">
                            Save {formatCurrency(convertedSavings, currentCurrency)}
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-bold text-white">{offer.partnerName}</h4>
                      <p className="text-[11px] text-slate-400 leading-snug">{offer.perks}</p>
                    </div>

                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                      <div>
                        <span className="text-lg font-black text-white">{formatted}</span>
                        <span className="text-[10px] text-slate-500 block">Includes taxes & fees</span>
                      </div>
                      <button
                        onClick={() => onBookListing(selectedListing)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          offer.isLowestPrice
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                        }`}
                      >
                        {offer.isLowestPrice ? 'Book Best Deal' : 'Select Deal'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 5-Bubble Rating Breakdown & Traveler Reviews Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: 5-Bubble Distribution & Sub-Ratings */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 self-start">
              <div className="space-y-2 border-b border-slate-800 pb-4">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  Traveler Rating Snapshot
                </span>
                <div className="flex items-baseline space-x-3">
                  <span className="text-4xl font-black text-white font-mono">
                    {reviewStats.averageRating.toFixed(1)}
                  </span>
                  <div className="space-y-1">
                    {renderBubbles(reviewStats.averageRating)}
                    <span className="text-xs text-slate-400 block">
                      Based on {selectedListing.reviewCount.toLocaleString()} verified reviews
                    </span>
                  </div>
                </div>
              </div>

              {/* 5-Tier Distribution Bars */}
              <div className="space-y-2.5 text-xs">
                {[
                  { label: 'Excellent', pct: reviewStats.distribution.excellent },
                  { label: 'Very Good', pct: reviewStats.distribution.veryGood },
                  { label: 'Average', pct: reviewStats.distribution.average },
                  { label: 'Poor', pct: reviewStats.distribution.poor },
                  { label: 'Terrible', pct: reviewStats.distribution.terrible },
                ].map((row) => (
                  <div key={row.label} className="flex items-center gap-3">
                    <span className="w-20 text-slate-300 font-medium">{row.label}</span>
                    <div className="flex-1 h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{ width: `${row.pct}%` }}
                      />
                    </div>
                    <span className="w-9 text-right font-mono text-slate-400">{row.pct}%</span>
                  </div>
                ))}
              </div>

              {/* Category Sub-Ratings (Location, Cleanliness, Service, Value) */}
              <div className="pt-4 border-t border-slate-800 space-y-3">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Category Sub-Ratings
                </span>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  {[
                    { label: 'Location', val: reviewStats.subAverages.location },
                    { label: 'Cleanliness', val: reviewStats.subAverages.cleanliness },
                    { label: 'Service', val: reviewStats.subAverages.service },
                    { label: 'Value', val: reviewStats.subAverages.value },
                  ].map((sub) => (
                    <div
                      key={sub.label}
                      className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between"
                    >
                      <span className="text-slate-400">{sub.label}</span>
                      <span className="font-mono font-bold text-emerald-400">{sub.val}/5.0</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setShowWriteReviewForm(!showWriteReviewForm)}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>
                  {showWriteReviewForm
                    ? 'Close Review Editor'
                    : 'Write a Review (+200 Loyalty Points)'}
                </span>
              </button>
            </div>

            {/* Right 2 Columns: Traveler Type Filter, Write Review Form & Reviews Feed */}
            <div className="lg:col-span-2 space-y-4">
              {/* Filter Bar */}
              <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter by Traveler Type">
                    {(['ALL', 'Couples', 'Families', 'Solo', 'Business', 'Friends'] as const).map(
                      (type) => (
                        <button
                          key={type}
                          onClick={() => setTravelerTypeFilter(type)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                            travelerTypeFilter === type
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                          }`}
                        >
                          {type === 'ALL' ? 'All Travelers' : type}
                        </button>
                      )
                    )}
                  </div>

                  <div className="relative flex-1 max-w-xs">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={reviewSearch}
                      onChange={(e) => setReviewSearch(e.target.value)}
                      placeholder="Search review keywords..."
                      aria-label="Search reviews"
                      className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Expandable Write a Review Form */}
              {showWriteReviewForm && (
                <form
                  onSubmit={handleReviewSubmit}
                  className="p-6 rounded-3xl bg-slate-900 border border-emerald-500/50 space-y-4 shadow-xl"
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h3 className="text-sm font-bold text-white">
                      Contribute Verified Review for {selectedListing.title}
                    </h3>
                    <span className="text-xs font-bold text-amber-400">
                      Earns +200 Loyalty Points
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="rev-rating" className="block text-xs text-slate-300 font-semibold mb-1">
                        Bubble Rating (1 - 5)
                      </label>
                      <select
                        id="rev-rating"
                        value={newReviewRating}
                        onChange={(e) => setNewReviewRating(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                      >
                        <option value={5}>5.0 Bubbles — Excellent</option>
                        <option value={4}>4.0 Bubbles — Very Good</option>
                        <option value={3}>3.0 Bubbles — Average</option>
                        <option value={2}>2.0 Bubbles — Poor</option>
                        <option value={1}>1.0 Bubble — Terrible</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="rev-type" className="block text-xs text-slate-300 font-semibold mb-1">
                        Traveler Type
                      </label>
                      <select
                        id="rev-type"
                        value={newReviewType}
                        onChange={(e) => setNewReviewType(e.target.value as TravelerType)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                      >
                        <option value="Couples">Couples</option>
                        <option value="Families">Families</option>
                        <option value="Solo">Solo</option>
                        <option value="Business">Business</option>
                        <option value="Friends">Friends</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="rev-author" className="block text-xs text-slate-300 font-semibold mb-1">
                        Your Display Name
                      </label>
                      <input
                        id="rev-author"
                        type="text"
                        value={newReviewAuthor}
                        onChange={(e) => setNewReviewAuthor(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="rev-title" className="block text-xs text-slate-300 font-semibold mb-1">
                      Review Headline
                    </label>
                    <input
                      id="rev-title"
                      type="text"
                      required
                      placeholder="Summarize your visit or transit experience..."
                      value={newReviewTitle}
                      onChange={(e) => setNewReviewTitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label htmlFor="rev-comment" className="block text-xs text-slate-300 font-semibold mb-1">
                      Detailed Traveler Review
                    </label>
                    <textarea
                      id="rev-comment"
                      rows={3}
                      required
                      placeholder="Share tips on rooms, seats, dining dishes, or best times to visit..."
                      value={newReviewComment}
                      onChange={(e) => setNewReviewComment(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => setShowWriteReviewForm(false)}
                      className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
                    >
                      Publish Verified Review (+200 PTS)
                    </button>
                  </div>
                </form>
              )}

              {/* Reviews Feed */}
              <div className="space-y-4">
                {filteredReviews.map((rev) => (
                  <article
                    key={rev.id}
                    className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center space-x-3">
                        <img
                          src={rev.authorAvatar}
                          alt={rev.authorName}
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 rounded-full object-cover border border-slate-700"
                        />
                        <div>
                          <div className="text-xs font-bold text-white">{rev.authorName}</div>
                          <div className="text-[11px] text-slate-400">
                            {rev.authorHome} · {rev.contributionsCount} contributions
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => onHelpfulReview(rev.id)}
                        className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 flex items-center space-x-1.5 cursor-pointer"
                      >
                        <ThumbsUp className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Helpful ({rev.helpfulCount})</span>
                      </button>
                    </div>

                    <div className="flex items-center space-x-2 text-xs text-slate-400">
                      {renderBubbles(rev.rating)}
                      <span>·</span>
                      <span className="font-semibold text-emerald-300">{rev.travelerType}</span>
                      <span>·</span>
                      <span>Visited {rev.visitDate}</span>
                    </div>

                    <h4 className="text-sm font-bold text-white">{rev.title}</h4>
                    <p className="text-xs text-slate-300 leading-relaxed">{rev.comment}</p>

                    {rev.ownerResponse && (
                      <div className="p-3.5 rounded-2xl bg-slate-950 border border-emerald-500/30 space-y-1 text-xs">
                        <div className="font-bold text-emerald-400">
                          Response from {rev.ownerResponse.responderTitle} ·{' '}
                          <span className="text-slate-500 font-normal">
                            {rev.ownerResponse.responseDate}
                          </span>
                        </div>
                        <p className="text-slate-300">{rev.ownerResponse.message}</p>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </div>
          </div>

          {/* Community Questions & Answers (Q&A Forum) */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-5 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <HelpCircle className="w-4 h-4 text-cyan-400" />
                  <span>Tripadvisor Community Q&A ({listingQuestions.length} Active Threads)</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Get fast answers from property representatives, certified guides, and past Platinum Globetrotters
                </p>
              </div>

              <form onSubmit={handleQuestionSubmit} className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  value={newQuestionText}
                  onChange={(e) => setNewQuestionText(e.target.value)}
                  placeholder="Ask a question about this listing..."
                  aria-label="Ask a community question"
                  className="flex-1 sm:w-72 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center space-x-1.5 cursor-pointer flex-shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Ask Q&A</span>
                </button>
              </form>
            </div>

            <div className="space-y-4">
              {listingQuestions.map((qa) => (
                <div
                  key={qa.id}
                  className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="text-xs font-bold text-white flex items-center space-x-2">
                        <MessageSquare className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                        <span>Q: {qa.question}</span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Asked by @{qa.authorName} · {qa.askedAt}
                      </div>
                    </div>

                    <button
                      onClick={() =>
                        setReplyingToQuestionId(replyingToQuestionId === qa.id ? null : qa.id)
                      }
                      className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer"
                    >
                      {replyingToQuestionId === qa.id ? 'Cancel Reply' : 'Answer Question'}
                    </button>
                  </div>

                  {qa.answers.map((ans) => (
                    <div
                      key={ans.id}
                      className="p-3 rounded-xl bg-slate-900/70 border border-slate-800/80 space-y-1 text-xs"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-200">{ans.responderName}</span>
                        <span className="text-[11px] text-emerald-400">· {ans.responderBadge}</span>
                        <span className="text-[11px] text-slate-500">· {ans.answeredAt}</span>
                      </div>
                      <p className="text-slate-300 leading-relaxed">{ans.answerText}</p>
                    </div>
                  ))}

                  {replyingToQuestionId === qa.id && (
                    <div className="flex items-center gap-2 pt-2">
                      <input
                        type="text"
                        value={newAnswerText}
                        onChange={(e) => setNewAnswerText(e.target.value)}
                        placeholder="Write your helpful answer..."
                        className="flex-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!newAnswerText.trim()) return;
                          onAddAnswer(qa.id, newAnswerText.trim());
                          setNewAnswerText('');
                          setReplyingToQuestionId(null);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold cursor-pointer"
                      >
                        Post Answer
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          SUB-TAB 2: "MY TRIPS" WISHLIST & SAVED ITINERARY BOARDS
         ===================================================================== */}
      {activeSubTab === 'trips' && (
        <div className="space-y-8">
          {/* Saved Trips Summary & Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                    <FolderHeart className="w-5 h-5 text-rose-400" />
                    <span>My Saved Places & Wishlist ({savedListings.length} Items)</span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Click the Heart icon on any Hotel, Flight, Train, Restaurant, or Tour to save it to your Trip Board
                  </p>
                </div>

                {savedListings.length > 0 && (
                  <button
                    onClick={() => {
                      const ics = generateIcsFeed(savedListings);
                      const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'tripadvisor-saved-wishlist.ics';
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                      onNotify(
                        '📅 Exported Saved Trip Wishlist (.ICS)',
                        `Exported ${savedListings.length} saved places to Apple & Google Calendar!`,
                        'push'
                      );
                    }}
                    className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center space-x-1.5 cursor-pointer self-start"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export Wishlist to .ICS</span>
                  </button>
                )}
              </div>

              {/* Metrics Row */}
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block">Estimated Trip Total</span>
                  <span className="text-lg font-black text-white">
                    {formatCurrency(
                      convertCurrency(savedSummary.totalCostUsd, 'USD', currentCurrency),
                      currentCurrency
                    )}
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block">Categories Covered</span>
                  <span className="text-lg font-black text-emerald-400">
                    {savedSummary.categoriesCount} Modes
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block">Est. Carbon Footprint</span>
                  <span className="text-lg font-black text-cyan-300">
                    {savedSummary.totalCarbonKg} kg CO<sub className="text-[10px]">2</sub>e
                  </span>
                </div>
              </div>

              {/* Saved Items Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {savedListings.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between space-y-3"
                  >
                    <div className="flex items-start space-x-3">
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        referrerPolicy="no-referrer"
                        className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] uppercase font-bold text-emerald-400">
                          {item.type} · {item.destination}
                        </span>
                        <h4 className="text-xs font-bold text-white truncate">{item.title}</h4>
                        <div className="flex items-center space-x-1.5 mt-1">
                          {renderBubbles(item.rating)}
                          <span className="text-[11px] text-slate-400">({item.reviewCount})</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-900">
                      <span className="text-sm font-black text-white">
                        {formatCurrency(
                          convertCurrency(item.priceUsd, 'USD', currentCurrency),
                          currentCurrency
                        )}
                      </span>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => onToggleSaveListing(item.id)}
                          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-rose-400 cursor-pointer"
                          title="Remove from Saved Trips"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onBookListing(item)}
                          className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer"
                        >
                          Book Now
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Create Custom Trip Board Form & Boards List */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-5 self-start">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Curated Trip Boards ({tripBoards.length})
              </h3>

              <div className="space-y-3">
                {tripBoards.map((board) => (
                  <div
                    key={board.id}
                    onClick={() => setActiveBoardId(board.id)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all space-y-1.5 ${
                      activeBoardId === board.id
                        ? 'bg-slate-950 border-rose-500/60'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{board.name}</span>
                      <span className="text-[11px] text-rose-400 font-semibold">
                        {board.listingIds.length} places
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">{board.description}</p>
                    <div className="text-[11px] text-cyan-300 pt-1">
                      Target Date: {board.targetDate}
                    </div>
                  </div>
                ))}
              </div>

              <form
                onSubmit={handleCreateBoardSubmit}
                className="pt-4 border-t border-slate-800 space-y-3"
              >
                <span className="text-xs font-bold text-slate-300 block">
                  + Create New Tripadvisor Board
                </span>
                <input
                  type="text"
                  required
                  value={newBoardName}
                  onChange={(e) => setNewBoardName(e.target.value)}
                  placeholder="Trip Name (e.g., Summer in Amalfi 2027)"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                />
                <input
                  type="text"
                  value={newBoardDesc}
                  onChange={(e) => setNewBoardDesc(e.target.value)}
                  placeholder="Trip notes or group goals..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                />
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer"
                >
                  Create Trip Board
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          SUB-TAB: PRICE DROP ALERTS & LIVE OTA RATE MONITORING
         ===================================================================== */}
      {activeSubTab === 'price_alerts' && (
        <div className="space-y-6">
          {/* Header & Bulk Scan Actions */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-5 shadow-xl">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                  <BellRing className="w-5 h-5 text-cyan-400" />
                  <span>
                    Tripadvisor Price Drop Alerts & 24/7 OTA Rate Monitor ({priceDropSubscriptions.length} Watched)
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Subscribe to specific hotels, flights, high-speed trains, tours, or restaurants. When any partner OTA lowers its rate, you receive an instant push notification and Bell Alert.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                <button
                  onClick={onScanAllPriceDrops}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 flex items-center space-x-1.5 whitespace-nowrap cursor-pointer"
                >
                  <Zap className="w-4 h-4 text-amber-300 flex-shrink-0" />
                  <span>Run Live OTA Rate Scan (-15% Drop)</span>
                </button>
              </div>
            </div>

            {/* Quick Add Listing to Price Monitor Bar */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs text-slate-300 font-semibold">
                + Subscribe Another Listing to Price Drop Monitoring:
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  aria-label="Select listing to subscribe to price drop alerts"
                  value={quickAddSubListingId}
                  onChange={(e) => setQuickAddSubListingId(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                >
                  {listings.map((item) => (
                    <option key={item.id} value={item.id}>
                      [{item.type.toUpperCase()}] {item.title} (${item.priceUsd} USD)
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => {
                    const target = listings.find((l) => l.id === quickAddSubListingId);
                    if (target) onTogglePriceDropAlert(target);
                  }}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold cursor-pointer"
                >
                  {priceDropSubscriptions.some((s) => s.listingId === quickAddSubListingId)
                    ? 'Unsubscribe Listing'
                    : 'Subscribe to Price Alerts'}
                </button>
              </div>
            </div>

            {/* Subscriptions Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {priceDropSubscriptions.map((sub) => {
                const item = listings.find((l) => l.id === sub.listingId);
                if (!item) return null;

                const metrics = calculatePriceDropMetrics(
                  sub.baselinePriceUsd,
                  item.priceUsd,
                  sub.targetPriceUsd
                );
                const baselineFormatted = formatCurrency(
                  convertCurrency(sub.baselinePriceUsd, 'USD', currentCurrency),
                  currentCurrency
                );
                const currentFormatted = formatCurrency(
                  convertCurrency(item.priceUsd, 'USD', currentCurrency),
                  currentCurrency
                );
                const targetFormatted = formatCurrency(
                  convertCurrency(sub.targetPriceUsd, 'USD', currentCurrency),
                  currentCurrency
                );

                return (
                  <div
                    key={sub.id}
                    className={`p-5 rounded-2xl border space-y-4 transition-all ${
                      metrics.isDropDetected
                        ? 'bg-emerald-950/25 border-emerald-500/60'
                        : 'bg-slate-950 border-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center space-x-3 min-w-0">
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          referrerPolicy="no-referrer"
                          className="w-16 h-16 rounded-xl object-cover border border-slate-800 flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <span className="text-[10px] uppercase font-bold text-cyan-400 block">
                            {item.type} · {item.destination}, {item.country}
                          </span>
                          <h3 className="text-sm font-bold text-white truncate">{item.title}</h3>
                          <span className="text-[11px] text-slate-400 block">
                            Channel: {sub.winningPartner}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase whitespace-nowrap flex-shrink-0 ${
                          metrics.isDropDetected
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                        }`}
                      >
                        {metrics.isDropDetected
                          ? `Dropped -${metrics.dropPercentage}%`
                          : 'Monitoring 4 OTAs'}
                      </span>
                    </div>

                    {/* Price Comparison Row */}
                    <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Baseline Price</span>
                        <span
                          className={`font-mono font-bold ${
                            metrics.isDropDetected ? 'text-slate-500 line-through' : 'text-slate-200'
                          }`}
                        >
                          {baselineFormatted}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Current Live Rate</span>
                        <span className="font-mono font-black text-emerald-400 text-sm">
                          {currentFormatted}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Alert Threshold</span>
                        <span className="font-mono font-bold text-cyan-300">
                          ≤ {targetFormatted}
                        </span>
                      </div>
                    </div>

                    {/* Target Threshold Slider */}
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <label htmlFor={`target-slider-${sub.id}`}>
                          Custom Alert Target Threshold (USD):
                        </label>
                        <span className="font-mono text-white font-bold">${sub.targetPriceUsd} USD</span>
                      </div>
                      <input
                        id={`target-slider-${sub.id}`}
                        type="range"
                        min={Math.max(20, Math.round(sub.baselinePriceUsd * 0.5))}
                        max={sub.baselinePriceUsd}
                        step={5}
                        value={sub.targetPriceUsd}
                        onChange={(e) =>
                          onUpdatePriceDropTarget(item.id, parseInt(e.target.value, 10))
                        }
                        className="w-full accent-cyan-500 cursor-pointer"
                      />
                    </div>

                    {/* Card Footer Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                      <button
                        onClick={() => onSimulatePriceDrop(item, 15)}
                        className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center space-x-1.5 cursor-pointer"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>Simulate -15% Price Drop</span>
                      </button>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => onTogglePriceDropAlert(item)}
                          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-rose-400 cursor-pointer"
                          aria-label={`Unsubscribe ${item.title} from Price Drop Alerts`}
                          title="Unsubscribe from Price Drop Alerts"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onBookListing(item)}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
                        >
                          Book {currentFormatted}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          SUB-TAB 3: TRIPADVISOR.COM VS AETHERVOYAGE FEATURE TALLY MATRIX
         ===================================================================== */}
      {activeSubTab === 'tally' && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-5 shadow-xl">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-lg font-bold text-white">
              Tripadvisor.com vs. AetherVoyage Feature Tally & Parity Matrix
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Every missing feature identified from Tripadvisor.com has been engineered and added into AetherVoyage
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                feature: 'Price Drop Alerts & Live OTA Rate Monitoring',
                before: 'Missing (No listing price tracking or rate decrease push notifications)',
                now: 'Added & Live — Subscribe to any listing, set target price thresholds, simulate live OTA price drops, and receive instant Bell & Push notifications.',
              },
              {
                feature: 'Things to Do (Tours, Attractions & Local Experiences)',
                before: 'Missing (Previously only Hotels, Flights, Trains & Ships)',
                now: 'Added & Live — Filterable "Things to Do" category with private guided tours & VIP museum entry.',
              },
              {
                feature: 'Restaurants & Fine Dining Reservations',
                before: 'Missing (No dining discovery or table booking)',
                now: 'Added & Live — Filterable "Restaurants" category featuring 3-Michelin-star Kaiseki & Eiffel Tower gastronomy.',
              },
              {
                feature: '5-Bubble Traveler Reviews, Sub-Ratings & Traveler Type Filter',
                before: 'Missing (Only static numerical rating on cards)',
                now: 'Added & Live — Full 5-bubble distribution, Location/Cleanliness/Service/Value scores, and Couples/Families/Solo/Business filter.',
              },
              {
                feature: 'Write a Review + Helpful Voting + Owner Responses',
                before: 'Missing (No user review submission)',
                now: 'Added & Live — Interactive review form that awards +200 Loyalty Points upon publication.',
              },
              {
                feature: 'Multi-OTA Price Comparison Engine',
                before: 'Missing (Single static price per listing)',
                now: 'Added & Live — Compares live quotes across Direct, Booking.com, Viator, OpenTable, Expedia & Agoda.',
              },
              {
                feature: 'Community Q&A Forum (Traveler Questions & Expert Answers)',
                before: 'Missing (No peer-to-peer Q&A threads)',
                now: 'Added & Live — Interactive Q&A threads with verified property and local expert answers.',
              },
              {
                feature: '"Trips" Heart Wishlist, Trip Boards & Travelers’ Choice Awards',
                before: 'Missing (No wishlist saving or Best of the Best 2026 badges)',
                now: 'Added & Live — Heart save toggle on every card, custom Trip Boards, Best of the Best 2026 awards & .ICS export.',
              },
            ].map((row, i) => (
              <div
                key={i}
                className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="font-bold text-white text-sm">{row.feature}</span>
                  <span className="text-emerald-400 font-bold flex items-center space-x-1 whitespace-nowrap flex-shrink-0">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <span>Matched & Added</span>
                  </span>
                </div>
                <div className="text-slate-500">
                  <strong>Before Audit:</strong> {row.before}
                </div>
                <div className="text-emerald-300">
                  <strong>Now in AetherVoyage:</strong> {row.now}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
