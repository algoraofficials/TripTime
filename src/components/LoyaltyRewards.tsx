import React, { useState } from 'react';
import { 
  Award, 
  Crown, 
  Sparkles, 
  Gift, 
  TrendingUp, 
  Check, 
  Copy, 
  Leaf, 
  Clock, 
  ArrowRight,
  ShieldCheck,
  Zap,
  Tag,
  CheckCircle2,
  ChevronRight,
  Calendar,
  Download
} from 'lucide-react';
import { Listing } from '../types/travel';
import { 
  LOYALTY_TIERS, 
  REDEEMABLE_PERKS, 
  RedeemablePerk, 
  getTierProgress,
  calculatePointsForBooking 
} from '../utils/loyalty';
import { generateIcsFeed } from '../utils/calendar';

interface LoyaltyRewardsProps {
  points: number;
  onRedeemPoints: (pointsCost: number, perk: RedeemablePerk) => void;
  onAwardBonusPoints: (amount: number, reason: string) => void;
  bookingHistory: Listing[];
  redeemedPerks: Array<RedeemablePerk & { redeemedAt: string }>;
  onOpenCalendarSync?: () => void;
}

export const LoyaltyRewards: React.FC<LoyaltyRewardsProps> = ({
  points,
  onRedeemPoints,
  onAwardBonusPoints,
  bookingHistory,
  redeemedPerks,
  onOpenCalendarSync,
}) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'store' | 'history'>('overview');

  const { currentTier, nextTier, progressPercent, pointsToNextTier } = getTierProgress(points);
  const tierInfo = LOYALTY_TIERS[currentTier];

  const handleCopyCode = (code: string) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  return (
    <div className="space-y-8 pb-16 max-w-6xl mx-auto">
      
      {/* Profile & Loyalty Tier Card Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950/60 to-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-amber-500/10 via-fuchsia-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold">
              <Crown className="w-3.5 h-3.5" />
              <span>AetherVoyage Elite Rewards Club</span>
            </div>

            <div className="flex items-center space-x-3">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
                alt="Traveller Profile"
                className="w-14 h-14 rounded-2xl object-cover border-2 border-indigo-500/50 shadow-md"
              />
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center space-x-2">
                  <span>Tanvir Rahman</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                    Bangladesh Gold Voyager
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  Member ID: #BD-884920 • Gulshan-2, Dhaka • bKash &amp; BR Rail Linked
                </p>
              </div>
            </div>
          </div>

          {/* Points Balance Tile */}
          <div className="p-5 rounded-2xl bg-slate-950/90 border border-slate-800 flex items-center space-x-6">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Available Loyalty Balance
              </span>
              <div className="flex items-baseline space-x-2 mt-1">
                <span className="text-3xl font-black text-white font-mono">
                  {points.toLocaleString()}
                </span>
                <span className="text-xs font-bold text-amber-400">PTS</span>
              </div>
              <span className="text-[11px] text-emerald-400 font-semibold block mt-1">
                Tier Multiplier: {tierInfo.multiplier}x Points Earned
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <button
                onClick={() => onAwardBonusPoints(1000, 'Global Traveler Loyalty Perk Bonus')}
                className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-amber-500/20 transition-all flex items-center justify-center space-x-1.5 flex-shrink-0 cursor-pointer"
                title="Simulate awarding bonus points"
              >
                <Sparkles className="w-4 h-4" />
                <span>+1,000 Bonus Pts</span>
              </button>
              {onOpenCalendarSync && (
                <button
                  onClick={onOpenCalendarSync}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 font-bold text-xs transition-all flex items-center justify-center space-x-1.5 flex-shrink-0 cursor-pointer"
                >
                  <Calendar className="w-4 h-4 text-cyan-400" />
                  <span>Sync to Calendar (.ICS)</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tier Progress Bar */}
        <div className="mt-6 pt-6 border-t border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-amber-400">{currentTier}</span>
              {nextTier && (
                <span className="text-slate-400">
                  → Next Tier: <strong className="text-white">{nextTier}</strong>
                </span>
              )}
            </div>

            <span className="text-slate-400 text-[11px]">
              {nextTier ? `${pointsToNextTier.toLocaleString()} points needed to upgrade` : 'Highest Platinum Tier Achieved!'}
            </span>
          </div>

          <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden p-0.5 border border-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-400 via-indigo-500 to-fuchsia-500 transition-all duration-700"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
            <span>Silver (0 pts)</span>
            <span>Gold (2,500 pts)</span>
            <span>Platinum (10,000+ pts)</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Award className="w-4 h-4 flex-shrink-0" />
          <span>Tier Perks & Vouchers</span>
        </button>

        <button
          onClick={() => setActiveTab('store')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
            activeTab === 'store'
              ? 'bg-amber-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Gift className="w-4 h-4 flex-shrink-0" />
          <span>Rewards Store ({REDEEMABLE_PERKS.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
            activeTab === 'history'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Clock className="w-4 h-4 flex-shrink-0" />
          <span>Points Earning Ledger</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW & ACTIVE VOUCHERS */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Current Tier Privileges */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Crown className="w-4 h-4 text-amber-400" />
                <span>{currentTier} Privileges</span>
              </h3>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                Active
              </span>
            </div>

            <div className="space-y-2.5">
              {tierInfo.perks.map((perk, i) => (
                <div key={i} className="flex items-start space-x-2.5 text-xs text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>{perk}</span>
                </div>
              ))}
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-center space-x-3 text-xs text-slate-400 mt-4">
              <Leaf className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>
                <strong>Eco-Bonus Status:</strong> You earn +250 extra points on all zero-emission electric ferries and high-speed rail bookings.
              </span>
            </div>
          </div>

          {/* Active Redeemed Vouchers */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Tag className="w-4 h-4 text-cyan-400" />
                <span>My Active Reward Vouchers ({redeemedPerks.length})</span>
              </h3>
            </div>

            {redeemedPerks.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 space-y-2">
                <Gift className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                <p className="font-semibold text-slate-300">No active vouchers yet</p>
                <p>Visit the Rewards Store to redeem points for bullet train upgrades, flight credits, and hotel spa passes.</p>
                <button
                  onClick={() => setActiveTab('store')}
                  className="mt-2 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
                >
                  Browse Rewards Store
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {redeemedPerks.map((p, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between"
                  >
                    <div>
                      <span className="text-xs font-bold text-white block">{p.title}</span>
                      <span className="text-[11px] text-slate-400">{p.description}</span>
                      <span className="text-[10px] text-slate-500 block mt-1">Redeemed: {p.redeemedAt}</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-cyan-300 px-2 py-1 rounded bg-slate-900 border border-slate-800">
                        {p.code}
                      </span>
                      <button
                        onClick={() => handleCopyCode(p.code)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                        title="Copy Promo Code"
                      >
                        {copiedCode === p.code ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: REWARDS REDEMPTION STORE */}
      {activeTab === 'store' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">
              Redeem your hard-earned points for luxury transit upgrades, flight discounts, and boutique experiences.
            </p>
            <span className="text-xs font-bold text-white">
              Balance: <strong className="text-amber-400">{points.toLocaleString()} PTS</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {REDEEMABLE_PERKS.map((perk) => {
              const canAfford = points >= perk.pointsCost;

              return (
                <div
                  key={perk.id}
                  className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-colors"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white uppercase tracking-wider">
                        {perk.category}
                      </span>
                      <div className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-black border border-amber-500/30">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{perk.pointsCost.toLocaleString()} PTS</span>
                      </div>
                    </div>

                    <h4 className="text-sm font-bold text-white">{perk.title}</h4>
                    <p className="text-xs text-slate-400">{perk.description}</p>
                  </div>

                  <div className="pt-4 border-t border-slate-800/80 mt-4 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 font-mono">
                      Code: {perk.code}
                    </span>

                    <button
                      onClick={() => onRedeemPoints(perk.pointsCost, perk)}
                      disabled={!canAfford}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                        canAfford
                          ? 'bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white shadow-md shadow-amber-500/20'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      <Gift className="w-3.5 h-3.5" />
                      <span>{canAfford ? 'Redeem Voucher' : 'Insufficient Points'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: POINTS EARNING LEDGER */}
      {activeTab === 'history' && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span>Points Earned per Completed Booking ({bookingHistory.length})</span>
            </h3>
            <span className="text-xs text-slate-400">10 pts / $1 spent + Eco Bonuses</span>
          </div>

          <div className="divide-y divide-slate-800/80">
            {bookingHistory.map((b, idx) => {
              const { points: earned, bonus } = calculatePointsForBooking(b);
              return (
                <div key={`${b.id}-${idx}`} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="font-bold text-white block">{b.title}</span>
                    <span className="text-[11px] text-slate-400">
                      {b.destination}, {b.country} • Paid ${b.priceUsd} USD
                    </span>
                    {bonus && (
                      <span className="inline-flex items-center space-x-1 text-[10px] text-emerald-400 font-semibold mt-0.5 ml-2">
                        <Leaf className="w-3 h-3" />
                        <span>{bonus}</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-3 self-end sm:self-auto">
                    <button
                      onClick={() => {
                        const ics = generateIcsFeed([b]);
                        const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${b.id}.ics`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-cyan-300 text-[11px] font-semibold flex items-center space-x-1 cursor-pointer"
                      title="Export booking to Apple or Google Calendar (.ics)"
                    >
                      <Download className="w-3 h-3 text-cyan-400" />
                      <span>.ICS</span>
                    </button>
                    <div className="text-right">
                      <span className="text-sm font-black text-amber-400 font-mono block">
                        +{earned.toLocaleString()} PTS
                      </span>
                      <span className="text-[10px] text-slate-500">Credited</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
