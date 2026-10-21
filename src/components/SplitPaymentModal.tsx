import React, { useState } from 'react';
import { 
  X, 
  Users, 
  Share2, 
  Check, 
  Copy, 
  CreditCard, 
  Coins, 
  Smartphone, 
  AlertCircle, 
  CheckCircle2, 
  Plus, 
  Trash2,
  DollarSign,
  Percent,
  QrCode,
  BellRing,
  PieChart as PieIcon,
  BarChart2 as BarIcon
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { Listing, LanguageCode } from '../types/travel';
import { SupportedCurrency, convertCurrency, formatCurrency } from '../utils/currency';
import { calculateSplitShares, SplitMode, SplitParticipant } from '../utils/splitPayment';
import { TRANSLATIONS } from '../data/translations';

interface SplitPaymentModalProps {
  listing: Listing;
  currentCurrency: SupportedCurrency;
  currentLang: LanguageCode;
  onClose: () => void;
  onConfirmSuccess?: (details: any) => void;
}

export const SplitPaymentModal: React.FC<SplitPaymentModalProps> = ({
  listing,
  currentCurrency,
  currentLang,
  onClose,
  onConfirmSuccess,
}) => {
  const t = TRANSLATIONS[currentLang];
  const convertedTotal = convertCurrency(listing.priceUsd, 'USD', currentCurrency);
  
  const [splitMode, setSplitMode] = useState<SplitMode>('EQUAL');
  const [copiedLink, setCopiedLink] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [remindedCount, setRemindedCount] = useState<number | null>(null);
  const [chartType, setChartType] = useState<'pie' | 'bar'>('pie');

  // Initial group of Bangladeshi travelers
  const [participants, setParticipants] = useState<SplitParticipant[]>([
    {
      id: 'p-1',
      name: 'Tanvir Rahman (You)',
      email: 'tanvir.rahman@dhaka.bd',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      paid: true,
      paidAt: 'Paid via bKash',
      paymentMethod: 'apple_pay',
      sharePercentage: 34,
      assignedAmount: Number((convertedTotal / 3).toFixed(2)),
    },
    {
      id: 'p-2',
      name: 'Nusrat Jahan',
      email: 'nusrat.jahan@gulshan.bd',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80',
      paid: true,
      paidAt: 'Paid via Nagad',
      paymentMethod: 'credit_card',
      sharePercentage: 33,
      assignedAmount: Number((convertedTotal / 3).toFixed(2)),
    },
    {
      id: 'p-3',
      name: 'Farhan Ahmed',
      email: 'farhan.ctg@banani.bd',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
      paid: false,
      sharePercentage: 33,
      assignedAmount: Number((convertedTotal / 3).toFixed(2)),
    },
  ]);

  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');

  // Calculate split figures
  const splitResult = calculateSplitShares(convertedTotal, participants, splitMode);

  const CHART_COLORS = ['#10b981', '#06b6d4', '#8b5cf6', '#f59e0b', '#ec4899', '#3b82f6'];

  const chartData = splitResult.participants.map((person, idx) => {
    const amt = Number(person.calculatedAmount.toFixed(2));
    const pct = convertedTotal > 0 ? Number(((amt / convertedTotal) * 100).toFixed(1)) : 0;
    return {
      id: person.id,
      name: person.name.replace(/\s*\([^)]*\)/, '').trim(),
      fullName: person.name,
      amount: amt,
      percentage: pct,
      paid: person.paid,
      color: CHART_COLORS[idx % CHART_COLORS.length],
    };
  });

  const CustomChartTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 shadow-2xl text-xs space-y-1 z-50">
          <div className="flex items-center space-x-2 font-bold text-white">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: data.color }} />
            <span>{data.fullName}</span>
          </div>
          <div className="text-slate-300">
            Assigned Share: <strong className="text-emerald-400">{formatCurrency(data.amount, currentCurrency)}</strong> ({data.percentage}%)
          </div>
          <div className="text-[11px] flex items-center space-x-1">
            <span className="text-slate-400">Settlement:</span>
            <span className={`font-semibold ${data.paid ? 'text-emerald-400' : 'text-amber-400'}`}>
              {data.paid ? '✓ Paid & Settled' : '⏳ Payment Pending'}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  const handleAddParticipant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;

    const newPerson: SplitParticipant = {
      id: `p-${Date.now()}`,
      name: newMemberName.trim(),
      email: newMemberEmail.trim() || `${newMemberName.toLowerCase().replace(/\s+/g, '')}@traveler.org`,
      avatar: `https://images.unsplash.com/photo-${1500000000000 + (participants.length * 10000)}?auto=format&fit=crop&w=150&q=80`,
      paid: false,
      sharePercentage: Math.round(100 / (participants.length + 1)),
      assignedAmount: Number((convertedTotal / (participants.length + 1)).toFixed(2)),
    };

    setParticipants([...participants, newPerson]);
    setNewMemberName('');
    setNewMemberEmail('');
  };

  const handleRemoveParticipant = (id: string) => {
    if (participants.length <= 1) return;
    setParticipants(participants.filter((p) => p.id !== id));
  };

  const handleTogglePaid = (id: string) => {
    setParticipants(
      participants.map((p) => {
        if (p.id === id) {
          return {
            ...p,
            paid: !p.paid,
            paidAt: !p.paid ? 'Just now' : undefined,
            paymentMethod: !p.paid ? 'credit_card' : undefined,
          };
        }
        return p;
      })
    );
  };

  const handlePercentageChange = (id: string, pct: number) => {
    setParticipants(
      participants.map((p) => (p.id === id ? { ...p, sharePercentage: pct } : p))
    );
  };

  const handleCustomAmountChange = (id: string, amt: number) => {
    setParticipants(
      participants.map((p) => (p.id === id ? { ...p, assignedAmount: amt } : p))
    );
  };

  const shareableUrl = `https://aethervoyage.travel/split/${listing.id}?amount=${convertedTotal}&currency=${currentCurrency}`;

  const copyShareLink = () => {
    navigator.clipboard?.writeText(shareableUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleSendReminder = () => {
    const unpaid = participants.filter((p) => !p.paid).length;
    setRemindedCount(unpaid);
    setTimeout(() => setRemindedCount(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="split-modal-title"
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl text-slate-100 overflow-hidden my-8"
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 id="split-modal-title" className="text-base font-bold text-white">
                Group Payment Splitting Mechanism
              </h2>
              <p className="text-xs text-slate-400">
                {listing.title} ({listing.destination})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          
          {/* Progress Overview Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Total Booking Amount
                </span>
                <span className="text-2xl font-black text-white">
                  {formatCurrency(convertedTotal, currentCurrency)}
                </span>
              </div>

              <div className="text-right">
                <span className="text-xs font-semibold text-emerald-400 block">
                  {splitResult.percentPaid}% Settled
                </span>
                <span className="text-xs text-slate-400">
                  {formatCurrency(splitResult.totalPaid, currentCurrency)} paid of {formatCurrency(convertedTotal, currentCurrency)}
                </span>
              </div>
            </div>

            {/* Live Progress Bar */}
            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden p-0.5">
              <div
                className="bg-gradient-to-r from-emerald-500 via-cyan-400 to-indigo-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${splitResult.percentPaid}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <span>Remaining balance: <strong className="text-amber-300">{formatCurrency(splitResult.remainingAmount, currentCurrency)}</strong></span>
              <span>{participants.filter(p => p.paid).length} of {participants.length} travelers paid</span>
            </div>
          </div>

          {/* Recharts Visual Expense Breakdown Chart */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
              <div className="flex items-center space-x-2">
                <PieIcon className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Visual Expense Breakdown &amp; Share Distribution
                </h3>
              </div>

              <div className="flex items-center bg-slate-900 p-0.5 rounded-xl border border-slate-800 text-[11px]">
                <button
                  type="button"
                  onClick={() => setChartType('pie')}
                  className={`px-2.5 py-1 rounded-lg font-semibold flex items-center space-x-1 transition-all cursor-pointer ${
                    chartType === 'pie'
                      ? 'bg-cyan-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <PieIcon className="w-3 h-3" />
                  <span>Proportion (%)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setChartType('bar')}
                  className={`px-2.5 py-1 rounded-lg font-semibold flex items-center space-x-1 transition-all cursor-pointer ${
                    chartType === 'bar'
                      ? 'bg-cyan-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <BarIcon className="w-3 h-3" />
                  <span>Settlement Bar</span>
                </button>
              </div>
            </div>

            {/* Recharts Chart Area */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <div className="md:col-span-2 h-52 w-full relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%" minHeight={200}>
                  {chartType === 'pie' ? (
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={48}
                        outerRadius={78}
                        paddingAngle={4}
                        dataKey="amount"
                        nameKey="name"
                        isAnimationActive={true}
                      >
                        {chartData.map((entry) => (
                          <Cell key={`cell-${entry.id}`} fill={entry.color} stroke="#020617" strokeWidth={2} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomChartTooltip />} />
                    </PieChart>
                  ) : (
                    <BarChart data={chartData} margin={{ top: 12, right: 12, left: -16, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                      <YAxis stroke="#64748b" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      <Tooltip content={<CustomChartTooltip />} />
                      <Bar dataKey="amount" radius={[6, 6, 0, 0]} maxBarSize={48}>
                        {chartData.map((entry) => (
                          <Cell key={`bar-${entry.id}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  )}
                </ResponsiveContainer>

                {/* Centered Donut Badge */}
                {chartType === 'pie' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total</span>
                    <span className="text-xs font-black text-emerald-400 font-mono">
                      {formatCurrency(convertedTotal, currentCurrency)}
                    </span>
                  </div>
                )}
              </div>

              {/* Chart Legend & Traveler Shares */}
              <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                {chartData.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800/80 hover:border-slate-700 flex items-center justify-between gap-2 text-xs transition-colors"
                  >
                    <div className="flex items-center space-x-2 min-w-0 flex-1">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-sm" style={{ backgroundColor: item.color }} />
                      <span className="font-semibold text-white truncate">{item.name}</span>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className="font-bold text-emerald-400 block font-mono">
                        {formatCurrency(item.amount, currentCurrency)}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono flex items-center justify-end space-x-1">
                        <span>{item.percentage}%</span>
                        <span className={item.paid ? 'text-emerald-400 font-medium' : 'text-amber-400 font-medium'}>
                          {item.paid ? '• Paid' : '• Pending'}
                        </span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Split Mode Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2">
              Split Mode
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSplitMode('EQUAL')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all ${
                  splitMode === 'EQUAL'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Equal Split</span>
              </button>

              <button
                type="button"
                onClick={() => setSplitMode('PERCENTAGE')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all ${
                  splitMode === 'PERCENTAGE'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Percent className="w-3.5 h-3.5" />
                <span>Custom %</span>
              </button>

              <button
                type="button"
                onClick={() => setSplitMode('CUSTOM')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all ${
                  splitMode === 'CUSTOM'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>Exact Amounts</span>
              </button>
            </div>
          </div>

          {/* Participants List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">
                Split Participants ({participants.length})
              </span>
              {!splitResult.isBalanced && (
                <div className="flex items-center space-x-1 text-xs text-amber-400">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Unallocated: {formatCurrency(splitResult.difference, currentCurrency)}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              {splitResult.participants.map((person) => (
                <div
                  key={person.id}
                  className={`p-3 rounded-xl border transition-colors flex items-center justify-between ${
                    person.paid
                      ? 'bg-emerald-950/20 border-emerald-900/40'
                      : 'bg-slate-950/60 border-slate-800'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <img
                      src={person.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                      alt={person.name}
                      className="w-9 h-9 rounded-full object-cover border border-slate-700"
                    />
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-white">{person.name}</span>
                        {person.paid ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                            Paid {person.paymentMethod ? `via ${person.paymentMethod.replace('_', ' ')}` : ''}
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                            Pending
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 block">{person.email}</span>
                    </div>
                  </div>

                  {/* Share Input or Amount */}
                  <div className="flex items-center space-x-3">
                    {splitMode === 'PERCENTAGE' && (
                      <div className="flex items-center space-x-1 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1">
                        <input
                          type="number"
                          min={1}
                          max={100}
                          value={person.sharePercentage || 0}
                          onChange={(e) => handlePercentageChange(person.id, parseFloat(e.target.value) || 0)}
                          className="w-12 bg-transparent text-right text-xs text-white focus:outline-none"
                        />
                        <span className="text-xs text-slate-400">%</span>
                      </div>
                    )}

                    {splitMode === 'CUSTOM' && (
                      <div className="flex items-center space-x-1 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1">
                        <span className="text-xs text-slate-400">{currentCurrency}</span>
                        <input
                          type="number"
                          min={0}
                          value={person.assignedAmount || 0}
                          onChange={(e) => handleCustomAmountChange(person.id, parseFloat(e.target.value) || 0)}
                          className="w-16 bg-transparent text-right text-xs text-white focus:outline-none"
                        />
                      </div>
                    )}

                    <div className="text-right">
                      <span className="text-xs font-black text-white block">
                        {formatCurrency(person.calculatedAmount, currentCurrency)}
                      </span>
                    </div>

                    {/* Toggle Paid Button */}
                    <button
                      onClick={() => handleTogglePaid(person.id)}
                      className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
                        person.paid
                          ? 'bg-emerald-600/30 text-emerald-300 hover:bg-emerald-600/50'
                          : 'bg-indigo-600 text-white hover:bg-indigo-500'
                      }`}
                      title={person.paid ? 'Mark Unpaid' : 'Simulate Payment'}
                    >
                      {person.paid ? <CheckCircle2 className="w-4 h-4" /> : 'Pay'}
                    </button>

                    {/* Delete button if more than 1 */}
                    {participants.length > 1 && (
                      <button
                        onClick={() => handleRemoveParticipant(person.id)}
                        className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                        aria-label={`Remove ${person.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Add Participant Form */}
            <form onSubmit={handleAddParticipant} className="flex gap-2 pt-2">
              <input
                type="text"
                placeholder="Friend's Name"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <input
                type="email"
                placeholder="Email (optional)"
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </form>
          </div>

          {/* Payment Splitting Gateway Methods */}
          <div className="pt-2 border-t border-slate-800">
            <span className="text-xs font-semibold text-slate-400 block mb-2">
              Supported Payment Methods for Split Settlements
            </span>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-300 flex flex-col items-center">
                <CreditCard className="w-4 h-4 text-cyan-400 mb-1" />
                <span>Stripe / Card</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-300 flex flex-col items-center">
                <Smartphone className="w-4 h-4 text-indigo-400 mb-1" />
                <span>Apple / Google Pay</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-300 flex flex-col items-center">
                <Coins className="w-4 h-4 text-amber-400 mb-1" />
                <span>USDC / Crypto</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-300 flex flex-col items-center">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 mb-1" />
                <span>SEPA / Instant</span>
              </div>
            </div>
          </div>

          {/* Shareable Link & Reminder Tools */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Share2 className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-white">Share Split Link with Group</span>
              </div>
              <button
                onClick={() => setShowQr(!showQr)}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>{showQr ? 'Hide QR' : 'Show QR'}</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareableUrl}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-400 font-mono select-all focus:outline-none"
              />
              <button
                onClick={copyShareLink}
                className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                  copiedLink
                    ? 'bg-emerald-600 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                }`}
              >
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>

            {showQr && (
              <div className="flex flex-col items-center justify-center p-4 bg-white rounded-xl text-slate-950 space-y-2">
                <div className="w-32 h-32 bg-slate-900 rounded-lg flex items-center justify-center text-white text-center p-2 text-xs font-mono">
                  [QR: {listing.id} Split Payment]
                </div>
                <span className="text-[11px] font-semibold text-slate-600">Scan to pay assigned share</span>
              </div>
            )}

            {/* Remind unpaid button */}
            <div className="flex items-center justify-between pt-1">
              <button
                onClick={handleSendReminder}
                className="text-xs text-amber-400 hover:text-amber-300 flex items-center space-x-1.5 font-medium"
              >
                <BellRing className="w-3.5 h-3.5" />
                <span>Send automated payment nudge to unpaid members</span>
              </button>

              {remindedCount !== null && (
                <span className="text-[11px] text-emerald-400 font-semibold animate-pulse">
                  Notification pinged to {remindedCount} members!
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
          >
            Close
          </button>

          <button
            onClick={() => {
              const allPaid = participants.map((p) => ({ ...p, paid: true, paidAt: p.paidAt || 'Just now' }));
              setParticipants(allPaid);
              if (onConfirmSuccess) {
                onConfirmSuccess({ listing, participants: allPaid, totalAmount: convertedTotal });
              }
            }}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 transition-all flex items-center space-x-2 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Confirm & Settle Group Booking</span>
          </button>
        </div>
      </div>
    </div>
  );
};
