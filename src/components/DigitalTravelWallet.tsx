import React, { useState, useMemo } from 'react';
import {
  Wallet,
  PlusCircle,
  QrCode,
  Copy,
  Check,
  Plane,
  Train,
  Ship,
  Building2,
  ArrowUpRight,
  ArrowDownLeft,
  AlertTriangle,
  CheckCircle2,
  Search,
  SlidersHorizontal,
  Smartphone,
  CreditCard,
  Coins,
  Calendar,
  MapPin,
  Clock,
  Receipt,
  Download,
  FileText,
  Eye,
  X,
} from 'lucide-react';
import {
  Listing,
  LanguageCode,
  WalletTransaction,
  DigitalBoardingPass,
  TransitMode,
} from '../types/travel';
import {
  SupportedCurrency,
  CURRENCY_REGISTRY,
  convertCurrency,
  formatCurrency,
} from '../utils/currency';
import { FirebasePaymentPreference } from '../services/firebaseSync';
import {
  buildItemizedReceipt,
  downloadTransactionReceiptPdf,
  type ItemizedReceiptData,
} from '../utils/pdfReceipt';

interface DigitalTravelWalletProps {
  bookingHistory: Listing[];
  walletBalanceUsd: number;
  monthlyBudgetUsd: number;
  transactions: WalletTransaction[];
  currentCurrency: SupportedCurrency;
  onCurrencyChange: (currency: SupportedCurrency) => void;
  currentLang: LanguageCode;
  savedPaymentPreference?: FirebasePaymentPreference | null;
  onTopUpWallet: (amountUsd: number, method: string, accountRef: string) => void;
  onUpdateMonthlyBudget: (newBudgetUsd: number) => void;
  onNavigateToMarketplace?: () => void;
}

/**
 * Generates a deterministic 21x21 QR-Code Version 1 matrix from a string seed
 * with standard 7x7 finder patterns in the three corners and timing patterns.
 */
function generateDeterministicQrMatrix(seed: string): boolean[][] {
  const size = 21;
  const matrix: boolean[][] = Array.from({ length: size }, () =>
    Array(size).fill(false)
  );
  const reserved: boolean[][] = Array.from({ length: size }, () =>
    Array(size).fill(false)
  );

  const placeFinderPattern = (rowOffset: number, colOffset: number) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const rr = rowOffset + r;
        const cc = colOffset + c;
        if (rr >= 0 && rr < size && cc >= 0 && cc < size) {
          reserved[rr][cc] = true;
          if (r >= 0 && r <= 6 && c >= 0 && c <= 6) {
            const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
            const isInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
            matrix[rr][cc] = isBorder || isInner;
          }
        }
      }
    }
  };

  placeFinderPattern(0, 0);
  placeFinderPattern(0, size - 7);
  placeFinderPattern(size - 7, 0);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    reserved[6][i] = true;
    reserved[i][6] = true;
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  // Deterministic hash stream from seed
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!reserved[r][c]) {
        hash ^= (r * 31 + c * 17) & 0xff;
        hash = Math.imul(hash, 16777619);
        matrix[r][c] = (Math.abs(hash) % 10) < 5;
      }
    }
  }

  return matrix;
}

const InlineQrCodeSvg: React.FC<{ value: string; size?: number }> = ({
  value,
  size = 112,
}) => {
  const matrix = useMemo(() => generateDeterministicQrMatrix(value), [value]);
  const moduleCount = matrix.length;

  return (
    <div
      className="bg-white p-2.5 rounded-xl border border-slate-200 inline-flex items-center justify-center shrink-0"
      title={`QR Payload: ${value}`}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${moduleCount} ${moduleCount}`}
        shapeRendering="crispEdges"
        aria-label={`QR Code for ${value}`}
      >
        {matrix.map((row, rIdx) =>
          row.map((cell, cIdx) =>
            cell ? (
              <rect
                key={`${rIdx}-${cIdx}`}
                x={cIdx}
                y={rIdx}
                width={1}
                height={1}
                fill="#020617"
              />
            ) : null
          )
        )}
      </svg>
    </div>
  );
};

export const DigitalTravelWallet: React.FC<DigitalTravelWalletProps> = ({
  bookingHistory,
  walletBalanceUsd,
  monthlyBudgetUsd,
  transactions,
  currentCurrency,
  onCurrencyChange,
  savedPaymentPreference,
  onTopUpWallet,
  onUpdateMonthlyBudget,
  onNavigateToMarketplace,
}) => {
  // Top-Up Form State
  const [selectedTopUpMethod, setSelectedTopUpMethod] = useState<string>(
    savedPaymentPreference?.method || 'bKash Direct'
  );
  const [topUpAmountUsd, setTopUpAmountUsd] = useState<number>(100);
  const [customTopUpInput, setCustomTopUpInput] = useState<string>('');
  const [topUpAccountRef, setTopUpAccountRef] = useState<string>(
    savedPaymentPreference?.accountNumber || '+880 1711-482910'
  );

  // Budget Editor State
  const [alertThresholdPct, setAlertThresholdPct] = useState<number>(80);
  const [isEditingBudget, setIsEditingBudget] = useState<boolean>(false);
  const [budgetDraftInCurrency, setBudgetDraftInCurrency] = useState<string>('');

  // Boarding Pass Filter & Copy State
  const [passFilter, setPassFilter] = useState<'all' | TransitMode>('all');
  const [copiedPnr, setCopiedPnr] = useState<string | null>(null);

  // Transaction Ledger Filter & Search State
  const [txTypeFilter, setTxTypeFilter] = useState<'all' | 'debit' | 'credit'>('all');
  const [txCategoryFilter, setTxCategoryFilter] = useState<string>('all');
  const [txSearchQuery, setTxSearchQuery] = useState<string>('');

  // PDF Receipt Download & Itemized Preview Modal State
  const [previewReceiptTx, setPreviewReceiptTx] = useState<WalletTransaction | null>(null);
  const [downloadedTxId, setDownloadedTxId] = useState<string | null>(null);

  const quickCurrencies: SupportedCurrency[] = ['BDT', 'USD', 'EUR', 'GBP', 'SGD', 'AED'];

  // Derive digital boarding passes and hotel vouchers from bookingHistory
  const boardingPasses: DigitalBoardingPass[] = useMemo(() => {
    return bookingHistory.map((item, index) => {
      const prefix =
        item.type === 'flight'
          ? 'BG'
          : item.type === 'train'
          ? 'BR'
          : item.type === 'ship'
          ? 'MV'
          : 'HTL';
      const deterministicNum = 84920 - index * 137;
      const pnrCode = `${prefix}-${item.id.slice(0, 3).toUpperCase()}-${deterministicNum}`;

      const seatOrCabin =
        item.type === 'flight'
          ? `Seat ${12 + index}A`
          : item.type === 'train'
          ? `Coach KA · Seat ${24 + index}`
          : item.type === 'ship'
          ? `Deck 2 · VIP Cabin ${104 + index}`
          : `Suite ${301 + index}`;

      const gateOrPlatform =
        item.type === 'flight'
          ? 'Terminal 1 · Gate B4'
          : item.type === 'train'
          ? 'Kamalapur · Platform 3'
          : item.type === 'ship'
          ? 'Sadarghat / Nuniachhara Pontoon 2'
          : 'Express VIP Check-In Desk';

      return {
        id: `pass-${item.id}-${index}`,
        pnrCode,
        listingId: item.id,
        title: item.title,
        transitMode: item.type,
        origin: item.originHub || 'Dhaka (DAC)',
        destination: item.destination,
        departureTime: item.details.departureTime || '09:30 AM · Check-In Ready',
        seatOrCabin,
        gateOrPlatform,
        passengerName: savedPaymentPreference?.holderName || 'AetherVoyage Verified Traveler',
        classOrRoomType: item.details.classOrRoomType,
        priceUsd: item.priceUsd,
        issuedAt: 'Oct 2026',
        status: index === 0 ? 'Checked In' : 'Active Pass',
      };
    });
  }, [bookingHistory, savedPaymentPreference]);

  const filteredBoardingPasses = useMemo(() => {
    if (passFilter === 'all') return boardingPasses;
    return boardingPasses.filter((p) => p.transitMode === passFilter);
  }, [boardingPasses, passFilter]);

  // Calculate total spending from debit transactions
  const totalSpentUsd = useMemo(() => {
    return transactions
      .filter((tx) => tx.type === 'debit')
      .reduce((sum, tx) => sum + tx.amountUsd, 0);
  }, [transactions]);

  const totalTopUpUsd = useMemo(() => {
    return transactions
      .filter((tx) => tx.type === 'credit')
      .reduce((sum, tx) => sum + tx.amountUsd, 0);
  }, [transactions]);

  const budgetUtilizationPct = useMemo(() => {
    if (monthlyBudgetUsd <= 0) return 0;
    return Math.round((totalSpentUsd / monthlyBudgetUsd) * 100);
  }, [totalSpentUsd, monthlyBudgetUsd]);

  const budgetStatus = useMemo(() => {
    if (budgetUtilizationPct >= 100) {
      return {
        label: 'Over Monthly Budget Limit',
        tone: 'rose' as const,
        description: `Spending has reached ${budgetUtilizationPct}% of your monthly cap.`,
      };
    }
    if (budgetUtilizationPct >= alertThresholdPct) {
      return {
        label: `Approaching Budget Alert (${budgetUtilizationPct}%)`,
        tone: 'amber' as const,
        description: `Crossed your ${alertThresholdPct}% alert threshold. Remaining budget: ${formatCurrency(
          Math.max(0, monthlyBudgetUsd - totalSpentUsd),
          currentCurrency
        )}.`,
      };
    }
    return {
      label: 'Within Monthly Budget',
      tone: 'emerald' as const,
      description: `${formatCurrency(
        Math.max(0, monthlyBudgetUsd - totalSpentUsd),
        currentCurrency
      )} remaining before reaching your ${formatCurrency(monthlyBudgetUsd, currentCurrency)} target.`,
    };
  }, [budgetUtilizationPct, alertThresholdPct, monthlyBudgetUsd, totalSpentUsd, currentCurrency]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (txTypeFilter !== 'all' && tx.type !== txTypeFilter) return false;
      if (txCategoryFilter !== 'all' && tx.category !== txCategoryFilter) return false;
      if (txSearchQuery.trim()) {
        const q = txSearchQuery.toLowerCase();
        const matchTitle = tx.title.toLowerCase().includes(q);
        const matchRef = tx.referenceCode.toLowerCase().includes(q);
        const matchMethod = tx.paymentMethod.toLowerCase().includes(q);
        const matchBookingRef = tx.bookingRef?.toLowerCase().includes(q);
        if (!matchTitle && !matchRef && !matchMethod && !matchBookingRef) return false;
      }
      return true;
    });
  }, [transactions, txTypeFilter, txCategoryFilter, txSearchQuery]);

  const handleCopyPnr = (pnr: string) => {
    navigator.clipboard?.writeText(pnr).catch(() => {});
    setCopiedPnr(pnr);
    setTimeout(() => {
      setCopiedPnr((prev) => (prev === pnr ? null : prev));
    }, 1800);
  };

  const travelerHolderName =
    savedPaymentPreference?.holderName || 'AetherVoyage Verified Traveler';

  const handleDownloadPdfReceipt = (tx: WalletTransaction) => {
    downloadTransactionReceiptPdf(tx, currentCurrency, travelerHolderName);
    setDownloadedTxId(tx.id);
    setTimeout(() => {
      setDownloadedTxId((prev) => (prev === tx.id ? null : prev));
    }, 2200);
  };

  const handleDownloadPassReceipt = (pass: DigitalBoardingPass) => {
    const matchingTx = transactions.find(
      (t) => t.bookingRef === pass.pnrCode || t.title === pass.title
    );
    const txToUse: WalletTransaction = matchingTx || {
      id: `tx-pass-${pass.id}`,
      referenceCode: `TXN-${pass.pnrCode.slice(-5)}`,
      title: pass.title,
      category: pass.transitMode,
      type: 'debit',
      amountUsd: pass.priceUsd,
      paymentMethod: savedPaymentPreference?.method || 'bKash Direct',
      timestamp: `${pass.issuedAt} · Confirmed`,
      status: 'Completed',
      bookingRef: pass.pnrCode,
    };
    handleDownloadPdfReceipt(txToUse);
  };

  const previewReceiptData: ItemizedReceiptData | null = useMemo(() => {
    if (!previewReceiptTx) return null;
    return buildItemizedReceipt(previewReceiptTx, currentCurrency, travelerHolderName);
  }, [previewReceiptTx, currentCurrency, travelerHolderName]);

  const handleExecuteTopUp = (e: React.FormEvent) => {
    e.preventDefault();
    let finalUsd = topUpAmountUsd;
    if (customTopUpInput.trim()) {
      const parsed = parseFloat(customTopUpInput);
      if (!isNaN(parsed) && parsed > 0) {
        finalUsd = convertCurrency(parsed, currentCurrency, 'USD');
      }
    }
    if (finalUsd <= 0) return;
    onTopUpWallet(finalUsd, selectedTopUpMethod, topUpAccountRef);
    setCustomTopUpInput('');
  };

  const handleOpenBudgetEdit = () => {
    const converted = Math.round(convertCurrency(monthlyBudgetUsd, 'USD', currentCurrency));
    setBudgetDraftInCurrency(String(converted));
    setIsEditingBudget(true);
  };

  const handleSaveBudgetEdit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(budgetDraftInCurrency);
    if (!isNaN(parsed) && parsed > 0) {
      const newUsd = convertCurrency(parsed, currentCurrency, 'USD');
      onUpdateMonthlyBudget(Math.max(50, Math.round(newUsd)));
    }
    setIsEditingBudget(false);
  };

  const getTransitIcon = (mode: TransitMode | 'topup' | 'cashback') => {
    switch (mode) {
      case 'flight':
        return <Plane className="w-4 h-4 text-cyan-400" />;
      case 'train':
        return <Train className="w-4 h-4 text-emerald-400" />;
      case 'ship':
        return <Ship className="w-4 h-4 text-blue-400" />;
      case 'hotel':
        return <Building2 className="w-4 h-4 text-amber-400" />;
      default:
        return <Wallet className="w-4 h-4 text-emerald-400" />;
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner & Multi-Currency Selector */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Financial &amp; Transit Vault</span>
            <span aria-hidden="true">·</span>
            <span>bKash &amp; Nagad Instant Settlement</span>
            <span aria-hidden="true">·</span>
            <span>Offline-Ready SVG QR Passes</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Digital Travel Wallet &amp; Boarding Pass Vault
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Manage multi-currency travel balances, configure monthly spending alerts, access scannable QR boarding passes, and audit every completed reservation.
          </p>
        </div>

        {/* Active Display Currency Segmented Switcher */}
        <div className="flex flex-col sm:items-end gap-2 shrink-0">
          <span className="text-xs text-slate-400">Active Display Currency</span>
          <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800">
            {quickCurrencies.map((curr) => (
              <button
                key={curr}
                type="button"
                onClick={() => onCurrencyChange(curr)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  currentCurrency === curr
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                {curr} ({CURRENCY_REGISTRY[curr].symbol})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Top Row: 3-Column Financial & Budget Summary Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Multi-Currency Available Balance */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Available Wallet Balance</span>
            <Coins className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="text-3xl font-bold text-white font-mono tabular-nums tracking-tight">
              {formatCurrency(walletBalanceUsd, currentCurrency)}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 font-mono tabular-nums">
              <span>{formatCurrency(walletBalanceUsd, 'BDT')}</span>
              <span aria-hidden="true">·</span>
              <span>{formatCurrency(walletBalanceUsd, 'USD')}</span>
              <span aria-hidden="true">·</span>
              <span>{formatCurrency(walletBalanceUsd, 'EUR')}</span>
            </div>
          </div>
          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Total Credited Top-Ups</span>
            <span className="font-mono tabular-nums text-emerald-400 font-semibold">
              +{formatCurrency(totalTopUpUsd, currentCurrency)}
            </span>
          </div>
        </div>

        {/* Card 2: Cumulative Travel Spending & Active Passes Count */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Travel Spending</span>
            <Receipt className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <div className="text-3xl font-bold text-white font-mono tabular-nums tracking-tight">
              {formatCurrency(totalSpentUsd, currentCurrency)}
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
              <span>{transactions.filter((t) => t.type === 'debit').length} Completed Bookings</span>
              <span aria-hidden="true">·</span>
              <span>{boardingPasses.length} Active QR Passes</span>
            </div>
          </div>
          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Primary Funding Method</span>
            <span className="text-slate-200 font-medium">
              {savedPaymentPreference?.method || selectedTopUpMethod}
            </span>
          </div>
        </div>

        {/* Card 3: Monthly Budget Alert & Utilization Meter */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {budgetStatus.tone === 'emerald' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle
                  className={`w-4 h-4 shrink-0 ${
                    budgetStatus.tone === 'rose' ? 'text-rose-400' : 'text-amber-400'
                  }`}
                />
              )}
              <span
                className={`text-xs font-semibold ${
                  budgetStatus.tone === 'rose'
                    ? 'text-rose-400'
                    : budgetStatus.tone === 'amber'
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}
              >
                {budgetStatus.label}
              </span>
            </div>
            <button
              type="button"
              onClick={handleOpenBudgetEdit}
              className="text-xs font-medium text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              Edit Cap
            </button>
          </div>

          {isEditingBudget ? (
            <form onSubmit={handleSaveBudgetEdit} className="space-y-2">
              <label className="block text-xs text-slate-400">
                Monthly Budget Limit ({currentCurrency})
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={budgetDraftInCurrency}
                  onChange={(e) => setBudgetDraftInCurrency(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white font-mono tabular-nums focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingBudget(false)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs cursor-pointer whitespace-nowrap shrink-0"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-2">
              <div className="flex items-baseline justify-between font-mono tabular-nums">
                <span className="text-sm text-slate-300">
                  {formatCurrency(totalSpentUsd, currentCurrency)}{' '}
                  <span className="text-slate-500">of</span>{' '}
                  {formatCurrency(monthlyBudgetUsd, currentCurrency)}
                </span>
                <span className="text-sm font-bold text-white">{budgetUtilizationPct}%</span>
              </div>

              <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className={`h-full transition-all duration-300 ${
                    budgetStatus.tone === 'rose'
                      ? 'bg-rose-500'
                      : budgetStatus.tone === 'amber'
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, budgetUtilizationPct)}%` }}
                />
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">{budgetStatus.description}</p>
            </div>
          )}

          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Alert Threshold</span>
            <div className="flex items-center gap-1 font-mono tabular-nums">
              {[70, 80, 90].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setAlertThresholdPct(pct)}
                  className={`px-2 py-0.5 rounded text-xs cursor-pointer transition-colors ${
                    alertThresholdPct === pct
                      ? 'bg-slate-800 text-white font-semibold'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Split Section: Digital QR Boarding Passes (Left 8 cols) + Instant Top-Up Panel (Right 4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Inline QR Digital Boarding Passes & Tickets */}
        <div className="lg:col-span-8 p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-cyan-400" />
                <h2 className="text-lg font-bold text-white">
                  Digital Boarding Passes &amp; QR Tickets
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Inline scannable QR passes with verified PNR booking reference numbers for express gate &amp; hotel check-in.
              </p>
            </div>

            {/* Segmented Filter Controls */}
            <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800 overflow-x-auto">
              {[
                { id: 'all', label: `All (${boardingPasses.length})` },
                { id: 'flight', label: 'Flights' },
                { id: 'train', label: 'Rail' },
                { id: 'ship', label: 'Launches' },
                { id: 'hotel', label: 'Stays' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setPassFilter(tab.id as 'all' | TransitMode)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    passFilter === tab.id
                      ? 'bg-cyan-600 text-white font-semibold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {filteredBoardingPasses.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <QrCode className="w-10 h-10 text-slate-600 mx-auto" />
              <div className="text-sm font-semibold text-slate-300">
                No digital boarding passes in this category yet
              </div>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Book a flight, intercity train, river launch, or resort in the Marketplace to generate an instant QR boarding pass.
              </p>
              {onNavigateToMarketplace && (
                <button
                  type="button"
                  onClick={onNavigateToMarketplace}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer"
                >
                  Browse Marketplace Bookings
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredBoardingPasses.map((pass) => (
                <div
                  key={pass.id}
                  className="p-5 rounded-2xl bg-slate-950 border border-slate-800/90 hover:border-slate-700 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6"
                >
                  {/* Left Pass Details */}
                  <div className="space-y-3 flex-1 min-w-0">
                    {/* Metadata line (unboxed with middle dot separators) */}
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                      <span className="inline-flex items-center gap-1.5 text-cyan-400 font-semibold">
                        {getTransitIcon(pass.transitMode)}
                        <span className="capitalize">{pass.transitMode} Pass</span>
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="text-emerald-400 font-medium">{pass.status}</span>
                      <span aria-hidden="true">·</span>
                      <span>{pass.classOrRoomType}</span>
                    </div>

                    <h3 className="text-base font-bold text-white truncate">{pass.title}</h3>

                    {/* Route, Departure, Gate & Seat Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1 text-xs">
                      <div>
                        <span className="text-slate-500 block">Route / Destination</span>
                        <span className="text-slate-200 font-medium flex items-center gap-1 mt-0.5 truncate">
                          <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          <span className="truncate">{pass.destination}</span>
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Departure / Check-In</span>
                        <span className="text-slate-200 font-mono tabular-nums font-medium flex items-center gap-1 mt-0.5">
                          <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span className="truncate">{pass.departureTime}</span>
                        </span>
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <span className="text-slate-500 block">Seat / Gate Assignment</span>
                        <span className="text-slate-200 font-mono tabular-nums font-medium block mt-0.5 truncate">
                          {pass.seatOrCabin}
                        </span>
                      </div>
                    </div>

                    {/* Booking Reference Row + Copy Action */}
                    <div className="pt-3 border-t border-slate-900 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">Booking Ref (PNR):</span>
                        <span className="font-mono tabular-nums text-sm font-bold text-amber-300 tracking-wider">
                          {pass.pnrCode}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyPnr(pass.pnrCode)}
                          className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 inline-flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap shrink-0"
                        >
                          {copiedPnr === pass.pnrCode ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400 font-medium">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-slate-400" />
                              <span>Copy Ref</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-400 font-mono tabular-nums">
                          Paid: <strong className="text-white">{formatCurrency(pass.priceUsd, currentCurrency)}</strong>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDownloadPassReceipt(pass)}
                          className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap shrink-0"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>PDF Receipt</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Right Inline SVG QR Code Block */}
                  <div className="flex sm:flex-col items-center gap-3 self-stretch sm:self-center justify-between sm:justify-center sm:pl-6 sm:border-l sm:border-dashed sm:border-slate-800 shrink-0">
                    <InlineQrCodeSvg
                      value={`AETHERVOYAGE|PNR:${pass.pnrCode}|ID:${pass.listingId}|MODE:${pass.transitMode}`}
                      size={104}
                    />
                    <div className="text-right sm:text-center">
                      <span className="block font-mono tabular-nums text-[11px] font-bold text-slate-200">
                        {pass.pnrCode}
                      </span>
                      <span className="block text-[11px] text-slate-500">Scan at Gate / Desk</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: bKash / Nagad / Card Instant Wallet Top-Up Panel */}
        <div className="lg:col-span-4 p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
          <div className="pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg font-bold text-white">Instant Wallet Top-Up</h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Add travel funds instantly via bKash, Nagad, or International Card with zero conversion markup.
            </p>
          </div>

          <form onSubmit={handleExecuteTopUp} className="space-y-4">
            {/* Payment Gateway Selection */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-300">
                Select Funding Channel
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'bKash Direct', label: 'bKash Direct', icon: Smartphone },
                  { id: 'Nagad Instant', label: 'Nagad Instant', icon: Smartphone },
                  { id: 'Visa / Mastercard', label: 'Visa / Card', icon: CreditCard },
                  { id: 'Rocket Mobile', label: 'DBBL Rocket', icon: Smartphone },
                ].map((method) => {
                  const IconComp = method.icon;
                  const active = selectedTopUpMethod === method.id;
                  return (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setSelectedTopUpMethod(method.id)}
                      className={`px-3 py-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                        active
                          ? 'bg-emerald-950/60 border-emerald-500 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <IconComp
                        className={`w-3.5 h-3.5 shrink-0 ${
                          active ? 'text-emerald-400' : 'text-slate-500'
                        }`}
                      />
                      <span className="truncate">{method.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Preset Top-Up Amounts */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-300">
                Select Preset Amount ({currentCurrency})
              </label>
              <div className="grid grid-cols-2 gap-2 font-mono tabular-nums">
                {[50, 100, 250, 500].map((usdAmt) => {
                  const isSelected = topUpAmountUsd === usdAmt && !customTopUpInput;
                  return (
                    <button
                      key={usdAmt}
                      type="button"
                      onClick={() => {
                        setTopUpAmountUsd(usdAmt);
                        setCustomTopUpInput('');
                      }}
                      className={`px-3 py-2 rounded-xl border text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                        isSelected
                          ? 'bg-indigo-600 border-indigo-500 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      +{formatCurrency(usdAmt, currentCurrency)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Amount Input */}
            <div className="space-y-1.5">
              <label htmlFor="custom-topup-amount" className="block text-xs font-medium text-slate-300">
                Or Enter Custom Amount ({CURRENCY_REGISTRY[currentCurrency].symbol})
              </label>
              <input
                id="custom-topup-amount"
                type="number"
                min="1"
                step="any"
                placeholder={`e.g. ${Math.round(convertCurrency(150, 'USD', currentCurrency))}`}
                value={customTopUpInput}
                onChange={(e) => setCustomTopUpInput(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white font-mono tabular-nums focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Wallet / Account Number */}
            <div className="space-y-1.5">
              <label htmlFor="wallet-account-ref" className="block text-xs font-medium text-slate-300">
                Verified Mobile / Card Reference
              </label>
              <input
                id="wallet-account-ref"
                type="text"
                value={topUpAccountRef}
                onChange={(e) => setTopUpAccountRef(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white font-mono tabular-nums focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>
                Add{' '}
                {customTopUpInput && !isNaN(parseFloat(customTopUpInput))
                  ? `${CURRENCY_REGISTRY[currentCurrency].symbol}${parseFloat(
                      customTopUpInput
                    ).toLocaleString()}`
                  : formatCurrency(topUpAmountUsd, currentCurrency)}{' '}
                via {selectedTopUpMethod}
              </span>
            </button>
          </form>
        </div>
      </div>

      {/* Bottom Section: Full-Width Completed Transaction History Ledger */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-white">Completed Transaction History</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Auditable ledger of all completed travel bookings, Quick Book settlements, and wallet top-up credits.
            </p>
          </div>

          {/* Search & Segmented Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search PNR, title, or method..."
                value={txSearchQuery}
                onChange={(e) => setTxSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500 w-56"
              />
            </div>

            <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800">
              {[
                { id: 'all', label: 'All Entries' },
                { id: 'debit', label: 'Bookings (Debit)' },
                { id: 'credit', label: 'Top-Ups (Credit)' },
              ].map((filterOpt) => (
                <button
                  key={filterOpt.id}
                  type="button"
                  onClick={() => setTxTypeFilter(filterOpt.id as 'all' | 'debit' | 'credit')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    txTypeFilter === filterOpt.id
                      ? 'bg-slate-800 text-white font-semibold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {filterOpt.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={txCategoryFilter}
                onChange={(e) => setTxCategoryFilter(e.target.value)}
                aria-label="Filter transactions by category"
                className="bg-transparent text-slate-300 focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-slate-900">All Categories</option>
                <option value="flight" className="bg-slate-900">Flights</option>
                <option value="train" className="bg-slate-900">Trains</option>
                <option value="ship" className="bg-slate-900">Ships / Launches</option>
                <option value="hotel" className="bg-slate-900">Hotels &amp; Resorts</option>
                <option value="topup" className="bg-slate-900">Wallet Top-Ups</option>
              </select>
            </div>
          </div>
        </div>

        {/* High-Density Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-semibold text-slate-400">
                <th className="py-3 px-3">Transaction Ref</th>
                <th className="py-3 px-3">Description &amp; Booking Ref</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Payment Channel</th>
                <th className="py-3 px-3">Date &amp; Status</th>
                <th className="py-3 px-3 text-right">Amount ({currentCurrency})</th>
                <th className="py-3 px-3 text-right">Formal Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No matching transactions found for the current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  const isDownloaded = downloadedTxId === tx.id;
                  const resolvedBookingRef =
                    tx.bookingRef ||
                    (tx.type === 'credit'
                      ? `WLT-${tx.referenceCode.replace('TXN-', '')}`
                      : `AV-${tx.referenceCode.replace('TXN-', '')}`);

                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-slate-950/60 transition-colors"
                    >
                      <td className="py-3 px-3 font-mono tabular-nums text-slate-300 font-medium whitespace-nowrap">
                        {tx.referenceCode}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-white">{tx.title}</div>
                        <div className="text-[11px] text-slate-400 font-mono tabular-nums">
                          Booking Ref: <span className="text-amber-300">{resolvedBookingRef}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 text-slate-300 capitalize">
                          {getTransitIcon(tx.category)}
                          <span>{tx.category === 'topup' ? 'Wallet Top-Up' : tx.category}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-300 whitespace-nowrap">
                        {tx.paymentMethod}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-slate-400 font-mono tabular-nums">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          <span>{tx.timestamp}</span>
                          <span aria-hidden="true">·</span>
                          <span className="text-emerald-400 font-sans font-medium">{tx.status}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums font-bold whitespace-nowrap">
                        <span
                          className={`inline-flex items-center justify-end gap-1 ${
                            tx.type === 'credit' ? 'text-emerald-400' : 'text-slate-100'
                          }`}
                        >
                          {tx.type === 'credit' ? (
                            <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" />
                          )}
                          <span>
                            {tx.type === 'credit' ? '+' : '-'}
                            {formatCurrency(tx.amountUsd, currentCurrency)}
                          </span>
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setPreviewReceiptTx(tx)}
                            title="Inspect itemized receipt breakdown"
                            className="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white inline-flex items-center gap-1 cursor-pointer transition-colors whitespace-nowrap shrink-0"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-400" />
                            <span>Inspect</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDownloadPdfReceipt(tx)}
                            title={`Download itemized PDF receipt in ${currentCurrency}`}
                            className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
                              isDownloaded
                                ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                                : 'bg-slate-950 hover:bg-emerald-950/50 border-slate-800 hover:border-emerald-500/60 text-emerald-400'
                            }`}
                          >
                            {isDownloaded ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Saved PDF</span>
                              </>
                            ) : (
                              <>
                                <Download className="w-3.5 h-3.5" />
                                <span>PDF</span>
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Itemized PDF Receipt Preview & Download Modal */}
      {previewReceiptTx && previewReceiptData && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="receipt-modal-title"
        >
          <div className="w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-800 text-slate-100 overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
                  <FileText className="w-4 h-4" />
                  <span>Official Itemized Travel &amp; Wallet Tax Receipt</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">{previewReceiptData.receiptNumber}</span>
                </div>
                <h3 id="receipt-modal-title" className="text-lg font-bold text-white">
                  {previewReceiptData.title}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setPreviewReceiptTx(null)}
                className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 cursor-pointer"
                aria-label="Close receipt preview"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              {/* Top Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                <div>
                  <span className="text-slate-500 block">Booking Reference</span>
                  <span className="font-mono tabular-nums font-bold text-amber-300 text-sm mt-0.5 block">
                    {previewReceiptData.bookingRef}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Transaction ID</span>
                  <span className="font-mono tabular-nums font-semibold text-white mt-0.5 block">
                    {previewReceiptData.transactionRef}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Payment Method</span>
                  <span className="font-semibold text-emerald-400 mt-0.5 block truncate">
                    {previewReceiptData.paymentMethod}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Settlement Date</span>
                  <span className="font-mono tabular-nums text-slate-300 mt-0.5 block">
                    {previewReceiptTx.timestamp}
                  </span>
                </div>
              </div>

              {/* Itemized Breakdown Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold text-slate-200">
                    Itemized Charge Breakdown ({previewReceiptData.currency})
                  </span>
                  <span>{previewReceiptData.categoryLabel}</span>
                </div>

                <div className="rounded-xl border border-slate-800 overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-950 border-b border-slate-800 text-slate-400">
                        <th className="py-2.5 px-3">Code</th>
                        <th className="py-2.5 px-3">Line Item Description</th>
                        <th className="py-2.5 px-3 text-right">Amount ({previewReceiptData.currency})</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/70">
                      {previewReceiptData.lineItems.map((item) => (
                        <tr key={item.code}>
                          <td className="py-2.5 px-3 font-mono tabular-nums text-slate-400 whitespace-nowrap">
                            {item.code}
                          </td>
                          <td className="py-2.5 px-3 text-slate-200">{item.description}</td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums font-medium text-white whitespace-nowrap">
                            {item.amountFormatted}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals & QR Verification Footer */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pt-2 border-t border-slate-800">
                <div className="flex items-center gap-3">
                  <InlineQrCodeSvg
                    value={`RECEIPT|${previewReceiptData.receiptNumber}|REF:${previewReceiptData.bookingRef}|AMT:${previewReceiptData.totalPdfSafe}`}
                    size={76}
                  />
                  <div className="space-y-1 text-xs">
                    <div className="font-semibold text-white">Verified Digital Tax Invoice</div>
                    <div className="text-slate-400">
                      Traveler: <span className="text-slate-200">{previewReceiptData.travelerName}</span>
                    </div>
                    <div className="text-slate-500 font-mono tabular-nums">
                      Base Clearing: {previewReceiptData.baseUsdEquivalent}
                    </div>
                  </div>
                </div>

                <div className="w-full sm:w-64 space-y-1.5 text-xs font-mono tabular-nums bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <div className="flex justify-between text-slate-400">
                    <span>Subtotal:</span>
                    <span className="text-slate-200">{previewReceiptData.subtotalFormatted}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Taxes &amp; Levies:</span>
                    <span className="text-slate-200">{previewReceiptData.taxAndFeesFormatted}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-800 flex justify-between text-sm font-bold text-emerald-400">
                    <span>Total ({previewReceiptData.currency}):</span>
                    <span>{previewReceiptData.totalFormatted}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setPreviewReceiptTx(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => handleDownloadPdfReceipt(previewReceiptTx)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold inline-flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Download Formal PDF Receipt ({previewReceiptData.currency})</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
