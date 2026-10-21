import {
  db,
  doc,
  collection,
  setDoc,
  getDocs,
  deleteDoc,
  onSnapshot,
} from '../firebase.ts';
import type { PriceDropSubscription, Listing, TravelerReview } from '../types/travel.ts';

export interface FirebasePriceAlert {
  id: string;
  userId: string;
  listingId: string;
  listingTitle: string;
  targetPriceBdt: number;
  initialPriceBdt: number;
  currentPriceBdt: number;
  notifyEmail: string;
  phone: string;
  status: 'active' | 'triggered' | 'cancelled';
  createdAt: string;
}

export interface FirebaseBooking {
  id: string;
  userId: string;
  listingId: string;
  listingTitle: string;
  guestName: string;
  guestPhone: string;
  paymentMethod: string;
  totalBdt: number;
  checkInDate: string;
  checkOutDate: string;
  guestsCount: number;
  status: 'confirmed' | 'pending' | 'cancelled';
  createdAt: string;
}

/**
 * Clean sanitization helper to guarantee valid Firestore document IDs
 */
function sanitizeDocId(rawId: string, prefix: string = 'doc'): string {
  const clean = rawId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80);
  return clean ? `${prefix}_${clean}` : `${prefix}_${Date.now()}`;
}

/**
 * Persist or update a Price Drop Alert subscription in Firestore under user document
 */
export async function syncPriceDropAlertToFirebase(
  userId: string,
  alert: {
    listingId: string;
    listingTitle: string;
    targetPriceBdt: number;
    initialPriceBdt: number;
    currentPriceBdt: number;
    notifyEmail?: string;
    phone?: string;
    status?: 'active' | 'triggered' | 'cancelled';
  }
): Promise<string> {
  const alertId = sanitizeDocId(alert.listingId, 'alert');
  const alertRef = doc(db, 'users', userId, 'priceDropAlerts', alertId);

  const payload: FirebasePriceAlert = {
    id: alertId,
    userId,
    listingId: alert.listingId,
    listingTitle: alert.listingTitle,
    targetPriceBdt: Math.max(1, Math.round(alert.targetPriceBdt)),
    initialPriceBdt: Math.max(1, Math.round(alert.initialPriceBdt)),
    currentPriceBdt: Math.max(1, Math.round(alert.currentPriceBdt)),
    notifyEmail: alert.notifyEmail || 'traveler@aethervoyage.bd',
    phone: alert.phone || '+8801700000000',
    status: alert.status || 'active',
    createdAt: new Date().toISOString(),
  };

  await setDoc(alertRef, payload, { merge: true });
  return alertId;
}

/**
 * Remove a Price Drop Alert from Firestore
 */
export async function deletePriceDropAlertFromFirebase(
  userId: string,
  alertId: string
): Promise<void> {
  const docRef = doc(db, 'users', userId, 'priceDropAlerts', alertId);
  await deleteDoc(docRef);
}

/**
 * Subscribe to live real-time price alerts from Firestore
 */
export function subscribeToFirebasePriceAlerts(
  userId: string,
  onUpdate: (alerts: FirebasePriceAlert[]) => void
): () => void {
  const alertsColl = collection(db, 'users', userId, 'priceDropAlerts');
  return onSnapshot(
    alertsColl,
    (snapshot) => {
      const items: FirebasePriceAlert[] = [];
      snapshot.forEach((d) => {
        items.push(d.data() as FirebasePriceAlert);
      });
      onUpdate(items);
    },
    (err) => {
      console.warn('[Firebase] Price alerts sync notice:', err);
    }
  );
}

/**
 * Record a booking in Firestore under the authenticated traveler's record
 */
export async function saveBookingToFirebase(
  userId: string,
  booking: {
    listingId: string;
    listingTitle: string;
    guestName: string;
    guestPhone: string;
    paymentMethod: string;
    totalBdt: number;
    checkInDate?: string;
    checkOutDate?: string;
    guestsCount?: number;
  }
): Promise<string> {
  const bookingId = sanitizeDocId(`${booking.listingId}_${Date.now()}`, 'bk');
  const bookingRef = doc(db, 'users', userId, 'bookings', bookingId);

  const payload: FirebaseBooking = {
    id: bookingId,
    userId,
    listingId: booking.listingId,
    listingTitle: booking.listingTitle,
    guestName: booking.guestName,
    guestPhone: booking.guestPhone,
    paymentMethod: booking.paymentMethod,
    totalBdt: Math.max(1, Math.round(booking.totalBdt)),
    checkInDate: booking.checkInDate || new Date().toISOString().split('T')[0],
    checkOutDate: booking.checkOutDate || '',
    guestsCount: booking.guestsCount || 1,
    status: 'confirmed',
    createdAt: new Date().toISOString(),
  };

  await setDoc(bookingRef, payload);
  return bookingId;
}

/**
 * Save user profile info in Firestore
 */
export async function saveUserProfileToFirebase(
  userId: string,
  profile: {
    displayName: string;
    email?: string;
    phone?: string;
    division?: string;
  }
): Promise<void> {
  const profileRef = doc(db, 'users', userId, 'profile', 'info');
  await setDoc(
    profileRef,
    {
      uid: userId,
      displayName: profile.displayName,
      email: profile.email || '',
      phone: profile.phone || '',
      division: profile.division || 'Dhaka',
    updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    },
    { merge: true }
  );
}

export interface FirebasePaymentPreference {
  method: string;
  accountNumber: string;
  holderName: string;
  autoConfirmQuickBook: boolean;
  updatedAt: string;
}

/**
 * Persist user payment preferences in Firestore under users/{userId}/preferences/payment
 */
export async function savePaymentPreferencesToFirebase(
  userId: string,
  prefs: {
    method: string;
    accountNumber: string;
    holderName: string;
    autoConfirmQuickBook?: boolean;
  }
): Promise<void> {
  const prefsRef = doc(db, 'users', userId, 'preferences', 'payment');
  const payload: FirebasePaymentPreference = {
    method: prefs.method,
    accountNumber: prefs.accountNumber,
    holderName: prefs.holderName,
    autoConfirmQuickBook: prefs.autoConfirmQuickBook ?? true,
    updatedAt: new Date().toISOString(),
  };
  await setDoc(prefsRef, payload, { merge: true });
}

/**
 * Subscribe to live payment preferences from Firestore
 */
export function subscribeToPaymentPreferences(
  userId: string,
  onUpdate: (prefs: FirebasePaymentPreference | null) => void
): () => void {
  const prefsRef = doc(db, 'users', userId, 'preferences', 'payment');
  return onSnapshot(
    prefsRef,
    (snapshot) => {
      if (snapshot.exists()) {
        onUpdate(snapshot.data() as FirebasePaymentPreference);
      } else {
        onUpdate(null);
      }
    },
    (err) => {
      console.warn('[Firebase] Payment preferences sync notice:', err);
    }
  );
}
