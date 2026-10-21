/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Header, type AppTab } from './components/Header';
import { Marketplace } from './components/Marketplace';
import { SplitPaymentModal } from './components/SplitPaymentModal';
import { AiConciergeModal } from './components/AiConciergeModal';
import { OfflineMaps } from './components/OfflineMaps';
import { VendorDashboard } from './components/VendorDashboard';
import { EnterpriseResilience } from './components/EnterpriseResilience';
import { LoyaltyRewards } from './components/LoyaltyRewards';
import { CalendarIntegration } from './components/CalendarIntegration';
import { TripadvisorHub } from './components/TripadvisorHub';
import { TravelInsights } from './components/TravelInsights';
import { DigitalTravelWallet } from './components/DigitalTravelWallet';
import {
  InterestActivitiesPage,
  type InterestCategoryKey,
} from './components/InterestActivitiesPage';
import {
  INITIAL_LISTINGS,
  INITIAL_REVIEWS,
  INITIAL_QUESTIONS,
  INITIAL_TRIP_BOARDS,
} from './data/mockData';
import {
  Listing,
  LanguageCode,
  UserRole,
  TravelerReview,
  CommunityQuestion,
  TripBoard,
  PriceDropSubscription,
  WalletTransaction,
} from './types/travel';
import { SupportedCurrency, formatCurrency } from './utils/currency';
import { Sparkles, CheckCircle2, X, Compass, History, CreditCard, Crown, Gift, Calendar, Download, Flame, Sun, CloudSun, CloudRain, CloudLightning, Droplets, Wind, Thermometer, Clock } from 'lucide-react';

import {
  generateDepartureAlerts,
  DepartureAlert,
  createPriceDropNotification,
  calculateDepartureProgress,
} from './utils/notifications';
import { calculatePointsForBooking, REDEEMABLE_PERKS, RedeemablePerk } from './utils/loyalty';
import { generateIcsFeed, buildCalendarEvent } from './utils/calendar';
import {
  createDefaultPriceDropSubscription,
  applySimulatedPriceDrop,
} from './utils/tripadvisorFeatures';
import { getDestinationWeather } from './utils/weather';
import { Bell, Radio, Volume2, Plane, Train, Ship } from 'lucide-react';
import { testFirebaseConnection, subscribeToAuth, auth, type User, type TravelerUser } from './firebase';
import { QuickBookPaymentModal } from './components/QuickBookPaymentModal';
import {
  syncPriceDropAlertToFirebase,
  deletePriceDropAlertFromFirebase,
  saveBookingToFirebase,
  subscribeToFirebasePriceAlerts,
  savePaymentPreferencesToFirebase,
  subscribeToPaymentPreferences,
  type FirebasePaymentPreference,
} from './services/firebaseSync';

export default function App() {
  const [currentCurrency, setCurrentCurrency] = useState<SupportedCurrency>('BDT');
  const [currentLang, setCurrentLang] = useState<LanguageCode>('en');
  const [currentRole, setCurrentRole] = useState<UserRole>('traveller');
  const [selectedInterestCategory, setSelectedInterestCategory] = useState<InterestCategoryKey>(() => {
    const params = new URLSearchParams(window.location.search);
    const interest = params.get('interest');
    if (interest === 'outdoors' || interest === 'food' || interest === 'culture' || interest === 'water') {
      return interest;
    }
    return 'outdoors';
  });
  const [activeTab, setActiveTab] = useState<AppTab>(() => {
    const params = new URLSearchParams(window.location.search);
    const interest = params.get('interest');
    if (interest === 'outdoors' || interest === 'food' || interest === 'culture' || interest === 'water') {
      return 'interest_activities';
    }
    return 'marketplace';
  });
  const [isHighContrast, setIsHighContrast] = useState(false);

  // Loyalty Points & Rewards State
  const [loyaltyPoints, setLoyaltyPoints] = useState<number>(4850);
  const [redeemedPerks, setRedeemedPerks] = useState<Array<RedeemablePerk & { redeemedAt: string }>>([
    { ...REDEEMABLE_PERKS[1], redeemedAt: 'Oct 14, 2026' },
  ]);

  // App listings state
  const [listings, setListings] = useState<Listing[]>(INITIAL_LISTINGS);

  // Tripadvisor Community Reviews, Q&A, Saved Trips Wishlist & Boards State
  const [selectedTripadvisorListingId, setSelectedTripadvisorListingId] = useState<string>(
    INITIAL_LISTINGS[0].id
  );
  const [reviews, setReviews] = useState<TravelerReview[]>(INITIAL_REVIEWS);
  const [questions, setQuestions] = useState<CommunityQuestion[]>(INITIAL_QUESTIONS);
  const [savedListingIds, setSavedListingIds] = useState<string[]>([
    'hotel-coxs-sayeman',
    'train-coxs-express',
    'ship-bay-one-stmartin',
  ]);
  const [tripBoards, setTripBoards] = useState<TripBoard[]>(INITIAL_TRIP_BOARDS);

  // Price Drop Alert Subscriptions State
  const [priceDropSubscriptions, setPriceDropSubscriptions] = useState<PriceDropSubscription[]>(
    () => [
      createDefaultPriceDropSubscription(INITIAL_LISTINGS[0], 10), // Sayeman Beach Resort Cox's Bazar
      createDefaultPriceDropSubscription(INITIAL_LISTINGS[1], 12), // Grand Sultan Tea Resort Sylhet
      createDefaultPriceDropSubscription(INITIAL_LISTINGS[7], 10), // Cox's Bazar Express Train 814
    ]
  );
  
  // User booking history for AI personalized itinerary suggestions & departure alerts
  const [bookingHistory, setBookingHistory] = useState<Listing[]>([
    INITIAL_LISTINGS[0], // Sayeman Beach Resort Cox's Bazar
    INITIAL_LISTINGS[7], // Cox's Bazar Express (814): Dhaka Kamalapur -> Cox's Bazar
    INITIAL_LISTINGS[5], // Biman Bangladesh BG-433: Dhaka (DAC) -> Cox's Bazar (CXB)
  ]);

  // Digital Travel Wallet State: Multi-currency balance (stored in base USD), Monthly Budget, & Completed Transactions
  const [walletBalanceUsd, setWalletBalanceUsd] = useState<number>(1420);
  const [monthlyBudgetUsd, setMonthlyBudgetUsd] = useState<number>(600);
  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>(() => [
    {
      id: 'tx-init-1',
      referenceCode: 'TXN-90482',
      title: INITIAL_LISTINGS[0].title,
      category: INITIAL_LISTINGS[0].type,
      type: 'debit',
      amountUsd: INITIAL_LISTINGS[0].priceUsd,
      paymentMethod: 'bKash Direct',
      timestamp: 'Oct 19, 2026 · 14:20',
      status: 'Completed',
      bookingRef: `HTL-${INITIAL_LISTINGS[0].id.slice(0, 3).toUpperCase()}-84920`,
    },
    {
      id: 'tx-init-2',
      referenceCode: 'TXN-90315',
      title: INITIAL_LISTINGS[7].title,
      category: INITIAL_LISTINGS[7].type,
      type: 'debit',
      amountUsd: INITIAL_LISTINGS[7].priceUsd,
      paymentMethod: 'Nagad Instant',
      timestamp: 'Oct 18, 2026 · 09:45',
      status: 'Completed',
      bookingRef: `BR-${INITIAL_LISTINGS[7].id.slice(0, 3).toUpperCase()}-84783`,
    },
    {
      id: 'tx-init-3',
      referenceCode: 'TXN-90190',
      title: 'Wallet Balance Top-Up (bKash Direct)',
      category: 'topup',
      type: 'credit',
      amountUsd: 500,
      paymentMethod: 'bKash Direct (+880 1711-482910)',
      timestamp: 'Oct 16, 2026 · 18:10',
      status: 'Settled',
    },
    {
      id: 'tx-init-4',
      referenceCode: 'TXN-89940',
      title: INITIAL_LISTINGS[5].title,
      category: INITIAL_LISTINGS[5].type,
      type: 'debit',
      amountUsd: INITIAL_LISTINGS[5].priceUsd,
      paymentMethod: 'Visa / Mastercard',
      timestamp: 'Oct 14, 2026 · 11:05',
      status: 'Completed',
      bookingRef: `BG-${INITIAL_LISTINGS[5].id.slice(0, 3).toUpperCase()}-84646`,
    },
    {
      id: 'tx-init-5',
      referenceCode: 'TXN-89712',
      title: 'Initial Multi-Currency Travel Deposit',
      category: 'topup',
      type: 'credit',
      amountUsd: 1200,
      paymentMethod: 'Nagad Instant',
      timestamp: 'Oct 10, 2026 · 10:00',
      status: 'Settled',
    },
  ]);

  // Departure Push Notifications state pulled from booking history
  const [alerts, setAlerts] = useState<DepartureAlert[]>(() => 
    generateDepartureAlerts([INITIAL_LISTINGS[7], INITIAL_LISTINGS[5]])
  );
  const [pushEnabled, setPushEnabled] = useState(true);

  // Modal states
  const [splitModalListing, setSplitModalListing] = useState<Listing | null>(null);
  const [bookedDirectListing, setBookedDirectListing] = useState<Listing | null>(null);
  const [inlineAiDrawerOpen, setInlineAiDrawerOpen] = useState(false);
  const [notificationToast, setNotificationToast] = useState<{ title: string; subtitle?: string; type?: 'push' | 'info' } | null>(null);
  const [showPaymentPrefsModal, setShowPaymentPrefsModal] = useState<boolean>(false);

  // Firebase Authentication & Firestore Connection State
  const [currentUser, setCurrentUser] = useState<User | TravelerUser | null>(null);
  const [firebaseConnected, setFirebaseConnected] = useState<boolean>(false);
  const [savedPaymentPreference, setSavedPaymentPreference] = useState<FirebasePaymentPreference | null>(null);

  useEffect(() => {
    // Critical Constraint: Test connection to Firestore on app startup
    testFirebaseConnection().then((connected) => {
      setFirebaseConnected(connected);
      if (connected) {
        console.log('[Firebase] Connected to Firestore database in asia-southeast1 (tokyo-channel-vpt51)');
      }
    });

    const unsubscribeAuth = subscribeToAuth((user) => {
      setCurrentUser(user);
    });

    return () => {
      unsubscribeAuth();
    };
  }, []);

  useEffect(() => {
    // Only subscribe to Firestore alerts stream when authenticated with Firebase Auth
    if (!auth.currentUser) return;

    const unsubscribeAlerts = subscribeToFirebasePriceAlerts(auth.currentUser.uid, (firestoreAlerts) => {
      if (firestoreAlerts && firestoreAlerts.length > 0) {
        setPriceDropSubscriptions((prev) => {
          const map = new Map(prev.map((s) => [s.listingId, s]));
          for (const fa of firestoreAlerts) {
            map.set(fa.listingId, {
              id: fa.id,
              listingId: fa.listingId,
              baselinePriceUsd: Math.max(1, Math.round(fa.initialPriceBdt / 120)),
              currentPriceUsd: Math.max(1, Math.round(fa.currentPriceBdt / 120)),
              targetPriceUsd: Math.max(1, Math.round(fa.targetPriceBdt / 120)),
              notifyOnAnyDrop: true,
              createdAt: 'Firebase Cloud Synced',
              isTriggered: fa.status === 'triggered',
              winningPartner: 'AetherVoyage Direct (Firebase Realtime)',
            });
          }
          return Array.from(map.values());
        });
      }
    });

    return () => {
      unsubscribeAlerts();
    };
  }, [currentUser?.uid]);

  // Subscribe to Firebase Firestore user payment preferences for Quick Book
  useEffect(() => {
    if (!currentUser?.uid) return;

    const unsubscribePrefs = subscribeToPaymentPreferences(currentUser.uid, (prefs) => {
      if (prefs) {
        setSavedPaymentPreference(prefs);
      } else {
        const defaultPref: FirebasePaymentPreference = {
          method: 'bKash Direct',
          accountNumber: '+8801700000000',
          holderName: currentUser.displayName || 'Tanvir Rahman',
          autoConfirmQuickBook: true,
          updatedAt: new Date().toISOString(),
        };
        setSavedPaymentPreference(defaultPref);
        savePaymentPreferencesToFirebase(currentUser.uid, defaultPref).catch((err) => {
          console.warn('[Firebase] Initial payment prefs notice:', err);
        });
      }
    });

    return () => {
      unsubscribePrefs();
    };
  }, [currentUser?.uid]);

  const showToast = (title: string, subtitle?: string, type: 'push' | 'info' = 'info') => {
    setNotificationToast({ title, subtitle, type });
    setTimeout(() => setNotificationToast(null), 4000);
  };

  const handleMarkAlertAsRead = (id: string) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, read: true } : a)));
  };

  const handleMarkAllAlertsAsRead = () => {
    setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
  };

  const handleTriggerTestPush = () => {
    const unread = alerts.find((a) => !a.read) || alerts[0];
    if (unread) {
      showToast(
        `DEPARTURE ALERT: ${unread.serviceTitle}`,
        `${unread.scheduledAlert} • ${unread.platformOrGate || `Departs ${unread.departureTime}`}`,
        'push'
      );
    } else {
      showToast(
        `DEPARTURE ALERT: Shinkansen N700S`,
        `T-15m Final Boarding Call • Track 14 Tokyo Central`,
        'push'
      );
    }
  };

  const handleRoleChange = (role: UserRole) => {
    setCurrentRole(role);
    if (role === 'vendor') {
      setActiveTab('vendor_hub');
    } else if (role === 'compliance_auditor') {
      setActiveTab('enterprise_dr');
    } else {
      setActiveTab('marketplace');
    }
  };

  const handleRedeemPoints = (pointsCost: number, perk: RedeemablePerk) => {
    if (loyaltyPoints < pointsCost) {
      showToast('Insufficient Loyalty Points', `Need ${(pointsCost - loyaltyPoints).toLocaleString()} more points to unlock this reward.`);
      return;
    }
    setLoyaltyPoints((prev) => prev - pointsCost);
    setRedeemedPerks((prev) => [{ ...perk, redeemedAt: 'Just now' }, ...prev]);
    showToast(
      `🎁 REWARD UNLOCKED: ${perk.title}`,
      `Deducted ${pointsCost.toLocaleString()} pts. Use promo code ${perk.code} at checkout!`,
      'push'
    );
  };

  const handleAwardBonusPoints = (amount: number, reason: string) => {
    setLoyaltyPoints((prev) => prev + amount);
    showToast(
      `⭐ +${amount.toLocaleString()} BONUS POINTS AWARDED!`,
      `${reason} • New Balance: ${(loyaltyPoints + amount).toLocaleString()} pts`,
      'push'
    );
  };

  const recordBookingInWallet = (listing: Listing, paymentMethodUsed: string) => {
    const prefix =
      listing.type === 'flight'
        ? 'BG'
        : listing.type === 'train'
        ? 'BR'
        : listing.type === 'ship'
        ? 'MV'
        : 'HTL';
    const bookingRef = `${prefix}-${listing.id.slice(0, 3).toUpperCase()}-84920`;
    const newTx: WalletTransaction = {
      id: `tx-${Date.now()}`,
      referenceCode: `TXN-${Math.floor(91000 + Math.random() * 8999)}`,
      title: listing.title,
      category: listing.type,
      type: 'debit',
      amountUsd: listing.priceUsd,
      paymentMethod: paymentMethodUsed,
      timestamp: 'Oct 20, 2026 · Just now',
      status: 'Completed',
      bookingRef,
    };
    setWalletTransactions((prev) => [newTx, ...prev]);
    setWalletBalanceUsd((prev) => Math.max(0, Number((prev - listing.priceUsd).toFixed(2))));
  };

  const handleTopUpWallet = (amountUsd: number, method: string, accountRef: string) => {
    const roundedUsd = Math.round(amountUsd * 100) / 100;
    setWalletBalanceUsd((prev) => Number((prev + roundedUsd).toFixed(2)));
    const newTx: WalletTransaction = {
      id: `tx-topup-${Date.now()}`,
      referenceCode: `TXN-${Math.floor(91000 + Math.random() * 8999)}`,
      title: `Wallet Balance Top-Up (${method})`,
      category: 'topup',
      type: 'credit',
      amountUsd: roundedUsd,
      paymentMethod: `${method} (${accountRef})`,
      timestamp: 'Oct 20, 2026 · Just now',
      status: 'Settled',
    };
    setWalletTransactions((prev) => [newTx, ...prev]);
    showToast(
      `Wallet Credited: +${formatCurrency(roundedUsd, currentCurrency)}`,
      `Instant top-up via ${method} completed and added to your Digital Travel Wallet.`,
      'push'
    );
  };

  const handleUpdateMonthlyBudget = (newBudgetUsd: number) => {
    setMonthlyBudgetUsd(newBudgetUsd);
    showToast(
      'Monthly Travel Budget Updated',
      `Your spending alert threshold is now calibrated to ${formatCurrency(newBudgetUsd, currentCurrency)}.`,
      'info'
    );
  };

  const handleBookDirect = (listing: Listing) => {
    const methodUsed = savedPaymentPreference?.method || listing.localPaymentMethods?.[0] || 'bKash Direct';
    setBookingHistory((prev) => [listing, ...prev]);
    setBookedDirectListing(listing);
    recordBookingInWallet(listing, methodUsed);

    // Persist booking to Firebase Firestore
    if (currentUser) {
      saveBookingToFirebase(currentUser.uid, {
        listingId: listing.id,
        listingTitle: listing.title,
        guestName: currentUser.displayName || 'Authentic BD Traveler',
        guestPhone: '+8801700000000',
        paymentMethod: methodUsed,
        totalBdt: Math.round(listing.priceUsd * 120),
      }).then((bId) => {
        console.log(`[Firebase] Booking recorded in Firestore with ID: ${bId}`);
      }).catch((err) => {
        console.warn('[Firebase] Firestore booking write notice:', err);
      });
    }

    // Calculate loyalty points earned for this booking
    const { points: earned, bonus } = calculatePointsForBooking(listing);
    setLoyaltyPoints((prev) => prev + earned);

    // If transit (flight, train, ship), generate departure push notification
    if (listing.type === 'flight' || listing.type === 'train' || listing.type === 'ship') {
      const newAlerts = generateDepartureAlerts([listing]);
      setAlerts((prev) => [...newAlerts, ...prev]);
      showToast(
        `🎉 +${earned.toLocaleString()} LOYALTY POINTS AWARDED!`,
        `${listing.title} booked! QR Pass & Receipt added to Digital Travel Wallet.`,
        'push'
      );
    } else {
      showToast(
        `🎉 +${earned.toLocaleString()} LOYALTY POINTS AWARDED!`,
        `Booking confirmed for ${listing.title}! Added to Digital Travel Wallet.`,
        'push'
      );
    }
  };

  const handleSavePaymentPreferences = (prefs: {
    method: string;
    accountNumber: string;
    holderName: string;
    autoConfirmQuickBook: boolean;
  }) => {
    const updated: FirebasePaymentPreference = {
      ...prefs,
      updatedAt: new Date().toISOString(),
    };
    setSavedPaymentPreference(updated);
    if (currentUser) {
      savePaymentPreferencesToFirebase(currentUser.uid, prefs)
        .then(() => {
          showToast(
            '⚡ Payment Preferences Saved',
            `Default payment method updated to ${prefs.method} in Firebase Firestore.`,
            'push'
          );
        })
        .catch((err) => {
          console.warn('[Firebase] Save payment preferences notice:', err);
        });
    }
  };

  const handleQuickBookDirect = (listing: Listing, paymentMethodOverride?: string) => {
    const methodUsed = paymentMethodOverride || savedPaymentPreference?.method || 'bKash Direct';

    setBookingHistory((prev) => [listing, ...prev]);
    setBookedDirectListing(listing);
    recordBookingInWallet(listing, methodUsed);

    // Persist booking to Firebase Firestore using saved payment credentials
    if (currentUser) {
      saveBookingToFirebase(currentUser.uid, {
        listingId: listing.id,
        listingTitle: listing.title,
        guestName: savedPaymentPreference?.holderName || currentUser.displayName || 'Authentic BD Traveler',
        guestPhone: savedPaymentPreference?.accountNumber || '+8801700000000',
        paymentMethod: methodUsed,
        totalBdt: Math.round(listing.priceUsd * 120),
      })
        .then((bId) => {
          console.log(`[Firebase Quick Book] Recorded booking ${bId} with ${methodUsed}`);
        })
        .catch((err) => {
          console.warn('[Firebase Quick Book] Firestore booking write notice:', err);
        });
    }

    // Calculate loyalty points earned for this booking
    const { points: earned, bonus } = calculatePointsForBooking(listing);
    setLoyaltyPoints((prev) => prev + earned);

    if (listing.type === 'flight' || listing.type === 'train' || listing.type === 'ship') {
      const newAlerts = generateDepartureAlerts([listing]);
      setAlerts((prev) => [...newAlerts, ...prev]);
    }

    showToast(
      `⚡ QUICK BOOK CONFIRMED via ${methodUsed}!`,
      `Instant 1-click booking completed for ${listing.title}. +${earned.toLocaleString()} PTS awarded • Synced to Firebase Firestore`,
      'push'
    );
  };

  const handleAddListing = (newListing: Listing) => {
    setListings((prev) => [newListing, ...prev]);
    showToast(`Successfully published ${newListing.title} to global inventory!`);
  };

  const handleToggleSaveListing = (listingId: string) => {
    const target = listings.find((l) => l.id === listingId);
    setSavedListingIds((prev) => {
      const exists = prev.includes(listingId);
      if (exists) {
        showToast(
          `Removed from Saved Trips`,
          target ? `${target.title} removed from your Tripadvisor Wishlist.` : undefined
        );
        return prev.filter((id) => id !== listingId);
      } else {
        showToast(
          `❤️ Saved to My Trips Wishlist!`,
          target ? `${target.title} added to your Saved Trips board.` : undefined,
          'push'
        );
        return [listingId, ...prev];
      }
    });
  };

  const handleAddReview = (newReview: TravelerReview) => {
    setReviews((prev) => [newReview, ...prev]);
    setListings((prev) =>
      prev.map((item) =>
        item.id === newReview.listingId
          ? { ...item, reviewCount: item.reviewCount + 1 }
          : item
      )
    );
    setLoyaltyPoints((prev) => prev + 200);
    showToast(
      `⭐ Verified 5-Bubble Review Published (+200 PTS)!`,
      `Thank you ${newReview.authorName}! Your review is now live and +200 Loyalty Points were added.`,
      'push'
    );
  };

  const handleHelpfulReview = (reviewId: string) => {
    setReviews((prev) =>
      prev.map((r) => (r.id === reviewId ? { ...r, helpfulCount: r.helpfulCount + 1 } : r))
    );
    showToast('Marked Review as Helpful', 'Your vote helps fellow travelers surface top insights.');
  };

  const handleAddQuestion = (listingId: string, questionText: string) => {
    const newQa: CommunityQuestion = {
      id: `qa-${Date.now()}`,
      listingId,
      authorName: 'alex_globetrotter',
      authorAvatar:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      askedAt: 'Just now',
      question: questionText,
      answers: [
        {
          id: `ans-auto-${Date.now()}`,
          responderName: 'AetherVoyage Verified Concierge Desk',
          responderBadge: 'Official Property & Transit Desk',
          answeredAt: 'Just now',
          answerText:
            'Thank you for asking! Confirmed bookings include priority concierge coordination and 24/7 multilingual support for this request.',
          helpfulVotes: 1,
        },
      ],
    };
    setQuestions((prev) => [newQa, ...prev]);
    showToast('Community Q&A Posted!', 'Property representative and community notified.');
  };

  const handleAddAnswer = (questionId: string, answerText: string) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === questionId
          ? {
              ...q,
              answers: [
                ...q.answers,
                {
                  id: `ans-${Date.now()}`,
                  responderName: 'Alex Morgan',
                  responderBadge: 'Gold Voyager • Verified Traveler',
                  answeredAt: 'Just now',
                  answerText,
                  helpfulVotes: 1,
                },
              ],
            }
          : q
      )
    );
    showToast('Community Answer Published!', 'Thank you for helping fellow travelers.');
  };

  const handleCreateTripBoard = (name: string, description: string, targetDate: string) => {
    const created: TripBoard = {
      id: `trip-${Date.now()}`,
      name,
      description,
      targetDate,
      listingIds: [...savedListingIds],
      notes: description,
    };
    setTripBoards((prev) => [created, ...prev]);
    showToast(`🗺️ Created Trip Board: ${name}`, `Linked ${savedListingIds.length} saved places.`);
  };

  const handleTogglePriceDropAlert = (listing: Listing) => {
    setPriceDropSubscriptions((prev) => {
      const exists = prev.some((s) => s.listingId === listing.id);
      if (exists) {
        if (currentUser) {
          const sanitizedId = `alert_${listing.id.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80)}`;
          deletePriceDropAlertFromFirebase(currentUser.uid, sanitizedId).catch((err) => {
            console.warn('[Firebase] Price alert deletion notice:', err);
          });
        }
        showToast(
          `Price Drop Alert Disabled`,
          `Stopped monitoring OTA rate changes for ${listing.title} (Removed from Firestore).`
        );
        return prev.filter((s) => s.listingId !== listing.id);
      } else {
        const created = createDefaultPriceDropSubscription(listing, 10);
        if (currentUser) {
          syncPriceDropAlertToFirebase(currentUser.uid, {
            listingId: listing.id,
            listingTitle: listing.title,
            targetPriceBdt: Math.round(created.targetPriceUsd * 120),
            initialPriceBdt: Math.round(created.baselinePriceUsd * 120),
            currentPriceBdt: Math.round(created.currentPriceUsd * 120),
            status: 'active',
          }).catch((err) => {
            console.warn('[Firebase] Price alert sync notice:', err);
          });
        }
        showToast(
          `Price Drop Alert Activated!`,
          `Monitoring rates for ${listing.title}. Target: <= $${created.targetPriceUsd} USD (Synced with Firestore).`,
          'push'
        );
        return [created, ...prev];
      }
    });
  };

  const handleUpdateListings = useCallback((scraped: Listing[]) => {
    setListings((prev) => {
      let hasChange = false;
      const prevMap = new Map(prev.map((l) => [l.id, l]));

      for (const item of scraped) {
        const existing = prevMap.get(item.id);
        if (!existing || existing.priceUsd !== item.priceUsd) {
          hasChange = true;
          break;
        }
      }

      if (!hasChange) {
        return prev;
      }

      const scrapedMap = new Map(scraped.map((l) => [l.id, l]));
      const remaining = prev.filter((l) => !scrapedMap.has(l.id));
      return [...scraped, ...remaining];
    });
  }, []);

  const handleUpdatePriceDropTarget = (listingId: string, targetPriceUsd: number) => {
    setPriceDropSubscriptions((prev) =>
      prev.map((s) => (s.listingId === listingId ? { ...s, targetPriceUsd } : s))
    );
  };

  const handleSimulatePriceDrop = (listing: Listing, dropPercent: number = 15) => {
    const existingSub = priceDropSubscriptions.find((s) => s.listingId === listing.id);
    const {
      updatedListing,
      updatedSubscription,
      oldPriceUsd,
      newPriceUsd,
      savingsUsd,
      dropPct,
    } = applySimulatedPriceDrop(listing, existingSub, dropPercent);

    setListings((prev) =>
      prev.map((item) => (item.id === listing.id ? updatedListing : item))
    );

    setPriceDropSubscriptions((prev) => {
      const exists = prev.some((s) => s.listingId === listing.id);
      if (exists) {
        return prev.map((s) => (s.listingId === listing.id ? updatedSubscription : s));
      }
      return [updatedSubscription, ...prev];
    });

    const priceAlertNotification = createPriceDropNotification(
      updatedListing,
      oldPriceUsd,
      newPriceUsd,
      updatedSubscription.winningPartner
    );
    setAlerts((prev) => [priceAlertNotification, ...prev]);

    showToast(
      `PRICE DROP ALERT: ${listing.title} (-${dropPct}% OFF)!`,
      `Rate dropped from $${oldPriceUsd} to $${newPriceUsd} USD (Save $${savingsUsd}). Notification added to your Alert Center!`,
      'push'
    );
  };

  const handleScanAllPriceDrops = () => {
    if (priceDropSubscriptions.length === 0) {
      showToast('No Watched Listings', 'Subscribe to at least one listing to scan for OTA price drops.');
      return;
    }

    const newAlerts: DepartureAlert[] = [];
    const updatedMap = new Map<string, Listing>();
    const updatedSubs: PriceDropSubscription[] = [];

    priceDropSubscriptions.forEach((sub) => {
      const currentItem = listings.find((l) => l.id === sub.listingId);
      if (!currentItem) return;
      const { updatedListing, updatedSubscription, oldPriceUsd, newPriceUsd } =
        applySimulatedPriceDrop(currentItem, sub, 15);
      updatedMap.set(currentItem.id, updatedListing);
      updatedSubs.push(updatedSubscription);
      newAlerts.push(
        createPriceDropNotification(
          updatedListing,
          oldPriceUsd,
          newPriceUsd,
          updatedSubscription.winningPartner
        )
      );
    });

    setListings((prev) => prev.map((item) => updatedMap.get(item.id) || item));
    setPriceDropSubscriptions(updatedSubs);
    setAlerts((prev) => [...newAlerts, ...prev]);

    showToast(
      `${newAlerts.length} LIVE PRICE DROP ALERTS TRIGGERED!`,
      `All ${newAlerts.length} watched listings dropped by 15%! Check the top-right Notification Bell for details.`,
      'push'
    );
  };

  return (
    <div className={`min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans transition-colors ${isHighContrast ? 'contrast-125 saturate-150' : ''}`}>
      
      {/* Global Navigation Header with Push Notification Center & Loyalty Tracker */}
      <Header
        loyaltyPoints={loyaltyPoints}
        walletBalanceUsd={walletBalanceUsd}
        savedTripsCount={savedListingIds.length}
        alerts={alerts}
        onMarkAlertAsRead={handleMarkAlertAsRead}
        onMarkAllAlertsAsRead={handleMarkAllAlertsAsRead}
        onTriggerTestPush={handleTriggerTestPush}
        pushEnabled={pushEnabled}
        onTogglePushEnabled={() => {
          setPushEnabled(!pushEnabled);
          showToast(
            pushEnabled ? 'Push Notifications Muted' : 'Departure Push Notifications Activated',
            pushEnabled ? 'You will not receive live departure sound pings' : 'Live departure chimes and gate notices active',
            'push'
          );
        }}
        currentCurrency={currentCurrency}
        onCurrencyChange={setCurrentCurrency}
        currentLang={currentLang}
        onLangChange={setCurrentLang}
        currentRole={currentRole}
        onRoleChange={handleRoleChange}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isHighContrast={isHighContrast}
        onToggleHighContrast={() => setIsHighContrast(!isHighContrast)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-6">
        
        {/* In-Booking Agentic AI Assistant Floating Banner / Trigger for Marketplace */}
        {activeTab === 'marketplace' && (
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-fuchsia-950/60 via-indigo-950/80 to-slate-900 border border-fuchsia-800/40 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-fuchsia-600 to-indigo-600 flex items-center justify-center text-white shadow-md flex-shrink-0">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <span>Agentic Itinerary Concierge Available</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30">
                    Personalized to your {bookingHistory.length} Past Bookings
                  </span>
                </h3>
                <p className="text-xs text-slate-300">
                  Let Gemini analyze your travel style and automatically connect flights, bullet trains, and hotels into a unified journey.
                </p>
              </div>
            </div>

            <button
              onClick={() => setInlineAiDrawerOpen(!inlineAiDrawerOpen)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-fuchsia-600/25 flex items-center justify-center space-x-1.5 transition-all self-start sm:self-auto flex-shrink-0"
            >
              <Compass className="w-4 h-4" />
              <span>{inlineAiDrawerOpen ? 'Close AI Assistant' : 'Plan with AI Concierge'}</span>
            </button>
          </div>
        )}

        {/* Expandable In-Flow AI Concierge Panel */}
        {activeTab === 'marketplace' && inlineAiDrawerOpen && (
          <div className="mb-8">
            <AiConciergeModal
              currentCurrency={currentCurrency}
              currentLang={currentLang}
              bookingHistory={bookingHistory}
              inlineMode={true}
            />
          </div>
        )}

        {/* Live Transit Departures & Push Notification Monitor */}
        {activeTab === 'marketplace' && (
          <div className="mb-6 p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
              <div className="flex items-center space-x-2">
                <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Upcoming Booked Departures & Live Push Monitor
                </h3>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-orange-500/15 border border-orange-500/30 text-orange-300 text-[11px] font-semibold">
                  <Flame className="w-3.5 h-3.5 text-orange-400" />
                  <span>
                    Firebase {firebaseConnected ? 'Active' : 'Connecting'}: tokyo-channel-vpt51 (asia-southeast1)
                  </span>
                </div>
                <span className="text-[11px] text-slate-400">
                  {pushEnabled ? 'Push Alerts Active' : 'Push Alerts Paused'}
                </span>
                <button
                  onClick={() => setActiveTab('calendar_sync')}
                  className="px-2.5 py-1 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-300 border border-cyan-500/40 text-[11px] font-semibold flex items-center space-x-1 cursor-pointer"
                >
                  <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Export .ICS / Calendar Sync</span>
                </button>
                <button
                  onClick={handleTriggerTestPush}
                  className="px-2.5 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 text-[11px] font-semibold flex items-center space-x-1 cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5 text-amber-300" />
                  <span>Test Departure Push Sound</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {bookingHistory
                .filter((b) => b.type === 'flight' || b.type === 'train' || b.type === 'ship')
                .slice(0, 2)
                .map((transit) => {
                  const weather = getDestinationWeather(transit.destination);
                  const depProgress = calculateDepartureProgress(transit.details.departureTime || '10:00 AM');

                  return (
                    <div
                      key={transit.id}
                      className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 hover:border-slate-700 space-y-3 transition-all shadow-md"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center space-x-3 min-w-0 flex-1">
                          <div className="p-2 rounded-xl bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 flex-shrink-0">
                            {transit.type === 'flight' ? (
                              <Plane className="w-4 h-4" />
                            ) : transit.type === 'ship' ? (
                              <Ship className="w-4 h-4" />
                            ) : (
                              <Train className="w-4 h-4" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="text-xs font-bold text-white truncate">
                                {transit.title}
                              </span>
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex-shrink-0">
                                Upcoming
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400 block truncate">
                              Departs: <strong className="text-cyan-300">{transit.details.departureTime || '10:00 AM'}</strong> • {transit.details.classOrRoomType}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            showToast(
                              `DEPARTURE ALERT: ${transit.title}`,
                              `Scheduled at ${transit.details.departureTime}. ${depProgress.formattedRemaining} until departure (${depProgress.statusLabel}). Weather at ${weather.destination}: ${weather.tempC}°C (${weather.condition}).`,
                              'push'
                            );
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold flex items-center space-x-1 flex-shrink-0 cursor-pointer"
                        >
                          <Bell className="w-3 h-3 text-cyan-400" />
                          <span>Ping</span>
                        </button>
                      </div>

                      {/* Departure Countdown Progress Bar */}
                      <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800/90 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] font-semibold">
                          <span className="text-slate-300 flex items-center space-x-1">
                            <Clock className="w-3 h-3 text-cyan-400" />
                            <span>Departure Countdown</span>
                          </span>
                          <span className="font-mono text-amber-300 font-extrabold text-xs">
                            {depProgress.formattedRemaining}
                          </span>
                        </div>

                        {/* Progress Bar Track with Subtle Gradient Color Change */}
                        <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden p-0.5 border border-slate-800/80">
                          <div
                            className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${depProgress.gradientClass}`}
                            style={{ width: `${depProgress.percentElapsed}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                          <span>{depProgress.statusLabel}</span>
                          <span className="font-mono text-slate-500">{depProgress.percentElapsed}% elapsed</span>
                        </div>
                      </div>

                      {/* Destination Live Weather Widget */}
                      <div className="p-2 rounded-xl bg-slate-900/70 border border-slate-800/70 flex items-center justify-between gap-2 text-xs">
                        <div className="flex items-center space-x-2 min-w-0 flex-1">
                          <div className="p-1 rounded-lg bg-amber-500/10 text-amber-400 flex-shrink-0">
                            {weather.icon === 'sun' && <Sun className="w-3.5 h-3.5 fill-amber-400" />}
                            {weather.icon === 'cloud-sun' && <CloudSun className="w-3.5 h-3.5" />}
                            {weather.icon === 'rain' && <CloudRain className="w-3.5 h-3.5 text-cyan-400" />}
                            {weather.icon === 'thunder' && <CloudLightning className="w-3.5 h-3.5 text-amber-400" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center space-x-1.5">
                              <span className="font-extrabold text-amber-300 text-xs font-mono">
                                {weather.tempC}°C ({weather.tempF}°F)
                              </span>
                              <span className="text-slate-500">•</span>
                              <span className="font-semibold text-slate-200 text-[11px] truncate">
                                {weather.destination}: {weather.condition}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 truncate leading-tight">
                              {weather.forecast}
                            </p>
                          </div>
                        </div>

                        <div className="hidden sm:flex items-center space-x-2 text-[10px] text-slate-400 flex-shrink-0 font-mono">
                          <span className="flex items-center space-x-0.5" title="Humidity">
                            <Droplets className="w-3 h-3 text-cyan-400" />
                            <span>{weather.humidity}%</span>
                          </span>
                          <span className="flex items-center space-x-0.5" title="Wind Speed">
                            <Wind className="w-3 h-3 text-indigo-400" />
                            <span>{weather.windSpeedKm}km/h</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* View Routing */}
        {activeTab === 'marketplace' && (
          <Marketplace
            listings={listings}
            currentCurrency={currentCurrency}
            currentLang={currentLang}
            onOpenSplitPayment={(listing) => setSplitModalListing(listing)}
            onBookDirect={handleBookDirect}
            savedListingIds={savedListingIds}
            onToggleSaveListing={handleToggleSaveListing}
            priceDropSubscriptions={priceDropSubscriptions}
            onTogglePriceDropAlert={handleTogglePriceDropAlert}
            onInspectReviewsAndDeals={(listing) => {
              setSelectedTripadvisorListingId(listing.id);
              setActiveTab('tripadvisor_hub');
            }}
            onUpdateListings={handleUpdateListings}
            savedPaymentPreference={savedPaymentPreference}
            onOpenPaymentPreferencesModal={() => setShowPaymentPrefsModal(true)}
            onQuickBookDirect={handleQuickBookDirect}
            onSelectInterestCategory={(cat) => {
              setSelectedInterestCategory(cat);
              setActiveTab('interest_activities');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {activeTab === 'interest_activities' && (
          <InterestActivitiesPage
            activeCategory={selectedInterestCategory}
            onSelectCategory={(cat) => {
              setSelectedInterestCategory(cat);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onBackToMarketplace={() => {
              setActiveTab('marketplace');
            }}
            currentCurrency={currentCurrency}
            currentLang={currentLang}
            onBookAttraction={handleBookDirect}
          />
        )}

        {activeTab === 'tripadvisor_hub' && (
          <TripadvisorHub
            listings={listings}
            selectedListingId={selectedTripadvisorListingId}
            onSelectListingId={setSelectedTripadvisorListingId}
            reviews={reviews}
            onAddReview={handleAddReview}
            onHelpfulReview={handleHelpfulReview}
            questions={questions}
            onAddQuestion={handleAddQuestion}
            onAddAnswer={handleAddAnswer}
            savedListingIds={savedListingIds}
            onToggleSaveListing={handleToggleSaveListing}
            tripBoards={tripBoards}
            onCreateTripBoard={handleCreateTripBoard}
            priceDropSubscriptions={priceDropSubscriptions}
            onTogglePriceDropAlert={handleTogglePriceDropAlert}
            onUpdatePriceDropTarget={handleUpdatePriceDropTarget}
            onSimulatePriceDrop={handleSimulatePriceDrop}
            onScanAllPriceDrops={handleScanAllPriceDrops}
            onBookListing={handleBookDirect}
            currentCurrency={currentCurrency}
            onNotify={showToast}
          />
        )}

        {activeTab === 'offline_maps' && (
          <OfflineMaps onNotify={showToast} />
        )}

        {activeTab === 'ai_concierge' && (
          <AiConciergeModal
            currentCurrency={currentCurrency}
            currentLang={currentLang}
            bookingHistory={bookingHistory}
          />
        )}

        {activeTab === 'vendor_hub' && (
          <VendorDashboard
            listings={listings}
            currentCurrency={currentCurrency}
            currentLang={currentLang}
            onAddListing={handleAddListing}
          />
        )}

        {activeTab === 'enterprise_dr' && (
          <EnterpriseResilience />
        )}

        {activeTab === 'travel_wallet' && (
          <DigitalTravelWallet
            bookingHistory={bookingHistory}
            walletBalanceUsd={walletBalanceUsd}
            monthlyBudgetUsd={monthlyBudgetUsd}
            transactions={walletTransactions}
            currentCurrency={currentCurrency}
            onCurrencyChange={setCurrentCurrency}
            currentLang={currentLang}
            savedPaymentPreference={savedPaymentPreference}
            onTopUpWallet={handleTopUpWallet}
            onUpdateMonthlyBudget={handleUpdateMonthlyBudget}
            onNavigateToMarketplace={() => setActiveTab('marketplace')}
          />
        )}

        {activeTab === 'travel_insights' && (
          <TravelInsights
            bookingHistory={bookingHistory}
            currentCurrency={currentCurrency}
            currentLang={currentLang}
            loyaltyPoints={loyaltyPoints}
          />
        )}

        {activeTab === 'loyalty_rewards' && (
          <LoyaltyRewards
            points={loyaltyPoints}
            onRedeemPoints={handleRedeemPoints}
            onAwardBonusPoints={handleAwardBonusPoints}
            bookingHistory={bookingHistory}
            redeemedPerks={redeemedPerks}
            onOpenCalendarSync={() => setActiveTab('calendar_sync')}
          />
        )}

        {activeTab === 'calendar_sync' && (
          <CalendarIntegration
            bookingHistory={bookingHistory}
            onNotify={showToast}
          />
        )}
      </main>

      {/* Split Payment Modal */}
      {splitModalListing && (
        <SplitPaymentModal
          listing={splitModalListing}
          currentCurrency={currentCurrency}
          currentLang={currentLang}
          onClose={() => setSplitModalListing(null)}
          onConfirmSuccess={() => {
            const { points: earned } = calculatePointsForBooking(splitModalListing);
            setBookingHistory((prev) => [splitModalListing, ...prev]);
            recordBookingInWallet(splitModalListing, 'Group Split Settlement');
            setLoyaltyPoints((prev) => prev + earned);
            if (
              splitModalListing.type === 'flight' ||
              splitModalListing.type === 'train' ||
              splitModalListing.type === 'ship'
            ) {
              setAlerts((prev) => [...generateDepartureAlerts([splitModalListing]), ...prev]);
            }
            showToast(
              `🎉 Group Split Settled & +${earned.toLocaleString()} PTS Awarded!`,
              `${splitModalListing.title} added to your Bookings, Loyalty Profile & Calendar (.ICS).`,
              'push'
            );
            setSplitModalListing(null);
          }}
        />
      )}

      {/* Direct Booking Confirmation Modal */}
      {bookedDirectListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5" />
                <span>Booking Confirmed</span>
              </div>
              <button onClick={() => setBookedDirectListing(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-3">
              <img
                src={bookedDirectListing.imageUrl}
                alt={bookedDirectListing.title}
                className="w-full h-36 rounded-xl object-cover"
              />
              <h4 className="font-bold text-base text-white">{bookedDirectListing.title}</h4>
              <p className="text-xs text-slate-400">{bookedDirectListing.tagline}</p>
              
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Destination:</span>
                  <span className="text-slate-200">{bookedDirectListing.destination}, {bookedDirectListing.country}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Transit Mode:</span>
                  <span className="capitalize text-cyan-300 font-semibold">{bookedDirectListing.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Confirmation Code:</span>
                  <span className="font-mono text-indigo-400 font-bold">{buildCalendarEvent(bookedDirectListing).confirmationCode}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-900">
                  <span className="text-slate-400 flex items-center space-x-1">
                    <Crown className="w-3.5 h-3.5 text-amber-400" />
                    <span>Loyalty Points Earned:</span>
                  </span>
                  <span className="font-mono text-amber-400 font-black">
                    +{calculatePointsForBooking(bookedDirectListing).points.toLocaleString()} PTS
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    const ics = generateIcsFeed([bookedDirectListing]);
                    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${bookedDirectListing.id}.ics`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    showToast(
                      `📅 Downloaded ${bookedDirectListing.id}.ics`,
                      'Ready for Apple Calendar & Google Calendar import!',
                      'push'
                    );
                  }}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 font-bold text-xs flex items-center space-x-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export .ICS</span>
                </button>
                <button
                  onClick={() => {
                    const listing = bookedDirectListing;
                    setBookedDirectListing(null);
                    setActiveTab('calendar_sync');
                    showToast(
                      `🗓️ Opened Calendar Sync for ${listing.title}`,
                      'Export to Google Calendar or Apple Calendar (.ics)'
                    );
                  }}
                  className="px-3 py-2 rounded-xl bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-700/60 font-bold text-xs flex items-center space-x-1.5 cursor-pointer"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Google / Apple Cal</span>
                </button>
              </div>
              <button
                onClick={() => setBookedDirectListing(null)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Book Payment Preference Modal */}
      {showPaymentPrefsModal && (
        <QuickBookPaymentModal
          currentPrefs={savedPaymentPreference}
          onSavePrefs={handleSavePaymentPreferences}
          onClose={() => setShowPaymentPrefsModal(false)}
        />
      )}

      {/* Global Push Notification Toast */}
      {notificationToast && (
        <div className={`fixed bottom-6 right-6 z-50 p-4 rounded-2xl shadow-2xl flex items-start space-x-3 border transition-all animate-bounce max-w-sm ${
          notificationToast.type === 'push'
            ? 'bg-gradient-to-r from-indigo-900 to-slate-900 text-white border-indigo-500/60 shadow-indigo-500/20'
            : 'bg-indigo-600 text-white border-indigo-400/40'
        }`}>
          <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 mt-0.5 flex-shrink-0">
            {notificationToast.type === 'push' ? <Volume2 className="w-5 h-5 text-amber-300 animate-pulse" /> : <CheckCircle2 className="w-5 h-5" />}
          </div>
          <div className="flex-1 space-y-0.5">
            <span className="text-xs font-bold text-white block">
              {notificationToast.title}
            </span>
            {notificationToast.subtitle && (
              <span className="text-[11px] text-slate-300 block leading-tight">
                {notificationToast.subtitle}
              </span>
            )}
          </div>
          <button
            onClick={() => setNotificationToast(null)}
            aria-label="Close notification toast"
            className="text-slate-400 hover:text-white text-xs ml-1 p-0.5 rounded hover:bg-slate-800/50 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-16 border-t border-slate-900 bg-slate-950/80 py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Compass className="w-4 h-4 text-cyan-400" />
            <span className="font-bold text-slate-300">AetherVoyage Transit Platform</span>
            <span>• Multi-Modal Global Bookings & Payment Splitting</span>
          </div>
          <div className="flex items-center space-x-4">
            <span>SOC2 Type II Certified</span>
            <span>•</span>
            <span>Zero-Connectivity Offline Maps</span>
            <span>•</span>
            <span>Powered by Gemini 4 & 3.8</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
