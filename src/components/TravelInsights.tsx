import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  BarChart2,
  PieChart as PieIcon,
  TrendingUp,
  Plane,
  Train,
  Ship,
  Building2,
  Crown,
  Leaf,
  Calendar,
  Filter,
  Coins,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';
import { Listing, LanguageCode } from '../types/travel';
import { SupportedCurrency, convertCurrency, formatCurrency } from '../utils/currency';
import { TRANSLATIONS } from '../data/translations';

interface TravelInsightsProps {
  bookingHistory: Listing[];
  currentCurrency: SupportedCurrency;
  currentLang: LanguageCode;
  loyaltyPoints?: number;
}

export const TravelInsights: React.FC<TravelInsightsProps> = ({
  bookingHistory,
  currentCurrency,
  currentLang,
  loyaltyPoints = 4850,
}) => {
  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
  const [timeRange, setTimeRange] = useState<'all' | '6m' | '3m'>('all');
  const [viewType, setViewType] = useState<'monthly' | 'category' | 'proportion'>('monthly');

  // Colors for transit types
  const TRANSIT_COLORS = {
    flight: '#06b6d4', // Cyan
    train: '#10b981', // Emerald
    ship: '#3b82f6',  // Blue
    hotel: '#f59e0b', // Amber
    other: '#8b5cf6', // Purple
  };

  // Compute monthly breakdown data for Recharts
  const monthlyData = useMemo(() => {
    // Generate simulated monthly timeline based on user booking history
    const months = [
      { key: '2026-06', monthLabel: 'Jun 2026' },
      { key: '2026-07', monthLabel: 'Jul 2026' },
      { key: '2026-08', monthLabel: 'Aug 2026' },
      { key: '2026-09', monthLabel: 'Sep 2026' },
      { key: '2026-10', monthLabel: 'Oct 2026' },
      { key: '2026-11', monthLabel: 'Nov 2026' },
    ];

    return months.map((m, idx) => {
      // Aggregate booking costs per transit type
      let flightsUsd = 0;
      let trainsUsd = 0;
      let shipsUsd = 0;
      let hotelsUsd = 0;

      bookingHistory.forEach((b, i) => {
        // Distribute items across months deterministically
        if (i % months.length === idx || (idx === months.length - 1 && i >= months.length)) {
          if (b.type === 'flight') flightsUsd += b.priceUsd;
          else if (b.type === 'train') trainsUsd += b.priceUsd;
          else if (b.type === 'ship') shipsUsd += b.priceUsd;
          else hotelsUsd += b.priceUsd;
        }
      });

      // Default baseline values if sparse
      if (flightsUsd === 0 && idx % 2 === 0) flightsUsd = 280;
      if (trainsUsd === 0 && idx % 3 === 0) trainsUsd = 85;
      if (shipsUsd === 0 && idx % 2 === 1) shipsUsd = 120;
      if (hotelsUsd === 0) hotelsUsd = 190;

      const flightsAmt = Math.round(convertCurrency(flightsUsd, 'USD', currentCurrency));
      const trainsAmt = Math.round(convertCurrency(trainsUsd, 'USD', currentCurrency));
      const shipsAmt = Math.round(convertCurrency(shipsUsd, 'USD', currentCurrency));
      const hotelsAmt = Math.round(convertCurrency(hotelsUsd, 'USD', currentCurrency));
      const totalAmt = flightsAmt + trainsAmt + shipsAmt + hotelsAmt;

      return {
        month: m.monthLabel,
        Flights: flightsAmt,
        Trains: trainsAmt,
        Ships: shipsAmt,
        Hotels: hotelsAmt,
        Total: totalAmt,
      };
    });
  }, [bookingHistory, currentCurrency]);

  // Compute category totals
  const categoryTotals = useMemo(() => {
    let flightsUsd = 0;
    let trainsUsd = 0;
    let shipsUsd = 0;
    let hotelsUsd = 0;

    let flightsCount = 0;
    let trainsCount = 0;
    let shipsCount = 0;
    let hotelsCount = 0;

    bookingHistory.forEach((b) => {
      if (b.type === 'flight') {
        flightsUsd += b.priceUsd;
        flightsCount++;
      } else if (b.type === 'train') {
        trainsUsd += b.priceUsd;
        trainsCount++;
      } else if (b.type === 'ship') {
        shipsUsd += b.priceUsd;
        shipsCount++;
      } else {
        hotelsUsd += b.priceUsd;
        hotelsCount++;
      }
    });

    const fAmt = Math.round(convertCurrency(flightsUsd, 'USD', currentCurrency));
    const tAmt = Math.round(convertCurrency(trainsUsd, 'USD', currentCurrency));
    const sAmt = Math.round(convertCurrency(shipsUsd, 'USD', currentCurrency));
    const hAmt = Math.round(convertCurrency(hotelsUsd, 'USD', currentCurrency));

    return [
      { name: 'Flights', value: fAmt, count: flightsCount, color: TRANSIT_COLORS.flight, icon: Plane },
      { name: 'Trains', value: tAmt, count: trainsCount, color: TRANSIT_COLORS.train, icon: Train },
      { name: 'Ships', value: sAmt, count: shipsCount, color: TRANSIT_COLORS.ship, icon: Ship },
      { name: 'Hotels & Tours', value: hAmt, count: hotelsCount, color: TRANSIT_COLORS.hotel, icon: Building2 },
    ];
  }, [bookingHistory, currentCurrency]);

  // Aggregate grand total
  const grandTotalConverted = categoryTotals.reduce((sum, item) => sum + item.value, 0);

  // Custom Recharts Tooltip
  const CustomRechartsTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 shadow-2xl text-xs space-y-2 z-50 min-w-[180px]">
          <div className="font-bold text-white border-b border-slate-800 pb-1.5 flex items-center justify-between">
            <span>{label || 'Expense Category'}</span>
            <span className="text-[10px] text-emerald-400 font-mono">
              {currentCurrency}
            </span>
          </div>
          <div className="space-y-1">
            {payload.map((p: any) => (
              <div key={p.name} className="flex items-center justify-between gap-3 text-slate-300">
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: p.color || p.fill }} />
                  <span>{p.name}:</span>
                </div>
                <strong className="text-white font-mono">{formatCurrency(p.value, currentCurrency)}</strong>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 text-slate-100">
      
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/80 border border-slate-800 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">
            <BarChart2 className="w-4 h-4 text-cyan-400" />
            <span>Travel Analytics &amp; Spending Trends</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Booking History &amp; Transit Expense Insights
          </h1>
          <p className="text-xs text-slate-400 max-w-2xl mt-1">
            Recharts visual breakdown of your flight, rail, ship, and hotel bookings across Bangladesh and international routes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Toggle */}
          <div className="bg-slate-950 p-1 rounded-2xl border border-slate-800 flex items-center text-xs">
            <button
              onClick={() => setViewType('monthly')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                viewType === 'monthly'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Monthly Trend</span>
            </button>

            <button
              onClick={() => setViewType('category')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                viewType === 'category'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Transit Category</span>
            </button>

            <button
              onClick={() => setViewType('proportion')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                viewType === 'proportion'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <PieIcon className="w-3.5 h-3.5" />
              <span>Share (%)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/90 space-y-1">
          <span className="text-xs font-semibold text-slate-400 block">Total Booking Volume</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-white">{bookingHistory.length} Bookings</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Verified
            </span>
          </div>
          <span className="text-[11px] text-slate-400 block">Flights, Rail, Ships &amp; Hotels</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/90 space-y-1">
          <span className="text-xs font-semibold text-slate-400 block">Total Travel Expenditure</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-400 font-mono">
              {formatCurrency(grandTotalConverted, currentCurrency)}
            </span>
            <span className="text-xs text-slate-400 font-mono">{currentCurrency}</span>
          </div>
          <span className="text-[11px] text-slate-400 block">Converted at live market rate</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/90 space-y-1">
          <span className="text-xs font-semibold text-amber-300 block flex items-center space-x-1">
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            <span>Loyalty Points Balance</span>
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-amber-300">{loyaltyPoints.toLocaleString()} PTS</span>
            <span className="text-[11px] text-amber-400 font-bold">Gold Tier</span>
          </div>
          <span className="text-[11px] text-slate-400 block">Redeemable for lounge access &amp; upgrades</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/90 space-y-1">
          <span className="text-xs font-semibold text-emerald-400 block flex items-center space-x-1">
            <Leaf className="w-3.5 h-3.5 text-emerald-400" />
            <span>Eco-Transit CO₂ Offset</span>
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-white">184 kg</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Rail Preferred
            </span>
          </div>
          <span className="text-[11px] text-slate-400 block">Green transit choices rewarded</span>
        </div>

      </div>

      {/* Main Recharts Visualization Card */}
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800/90 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>
                {viewType === 'monthly'
                  ? 'Monthly Spending Trends (Flights, Trains, Ships & Hotels)'
                  : viewType === 'category'
                  ? 'Total Expenditure by Transit Category'
                  : 'Booking Cost Distribution Share (%)'}
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Displayed in <strong className="text-emerald-400">{currentCurrency}</strong> based on user booking history
            </p>
          </div>

          <span className="text-xs font-mono text-slate-400">
            {monthlyData.length} Months Tracked
          </span>
        </div>

        {/* Recharts Chart Container */}
        <div className="h-80 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            {viewType === 'monthly' ? (
              <BarChart data={monthlyData} margin={{ top: 20, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip content={<CustomRechartsTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="Flights" fill={TRANSIT_COLORS.flight} stackId="a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Trains" fill={TRANSIT_COLORS.train} stackId="a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Ships" fill={TRANSIT_COLORS.ship} stackId="a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Hotels" fill={TRANSIT_COLORS.hotel} stackId="a" radius={[6, 6, 0, 0]} />
              </BarChart>
            ) : viewType === 'category' ? (
              <BarChart data={categoryTotals} margin={{ top: 20, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip content={<CustomRechartsTooltip />} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {categoryTotals.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            ) : (
              <PieChart>
                <Pie
                  data={categoryTotals}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={105}
                  paddingAngle={5}
                  dataKey="value"
                  nameKey="name"
                  isAnimationActive={true}
                >
                  {categoryTotals.map((entry, index) => (
                    <Cell key={`pie-cell-${index}`} fill={entry.color} stroke="#020617" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip content={<CustomRechartsTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              </PieChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Transit Breakdown Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {categoryTotals.map((cat) => {
          const IconComp = cat.icon;
          const sharePct = grandTotalConverted > 0 ? Math.round((cat.value / grandTotalConverted) * 100) : 0;

          return (
            <div
              key={cat.name}
              className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/90 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="p-2 rounded-xl text-white" style={{ backgroundColor: `${cat.color}25`, borderColor: `${cat.color}50` }}>
                    <IconComp className="w-4 h-4" style={{ color: cat.color }} />
                  </div>
                  <span className="text-xs font-bold text-white">{cat.name}</span>
                </div>
                <span className="text-xs font-bold font-mono text-slate-300">{sharePct}%</span>
              </div>

              <div>
                <span className="text-xl font-extrabold text-white font-mono block">
                  {formatCurrency(cat.value, currentCurrency)}
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  {cat.count} total bookings recorded
                </span>
              </div>

              {/* Progress bar fill */}
              <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden p-0.5 border border-slate-800">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${sharePct}%`, backgroundColor: cat.color }}
                />
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
