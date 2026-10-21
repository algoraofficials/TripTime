import React, { useState } from 'react';
import { X, Zap, ShieldCheck, Check, CreditCard, Smartphone, CheckCircle2 } from 'lucide-react';
import { FirebasePaymentPreference } from '../services/firebaseSync';

interface QuickBookPaymentModalProps {
  currentPrefs: FirebasePaymentPreference | null;
  onSavePrefs: (prefs: { method: string; accountNumber: string; holderName: string; autoConfirmQuickBook: boolean }) => void;
  onClose: () => void;
}

export const QuickBookPaymentModal: React.FC<QuickBookPaymentModalProps> = ({
  currentPrefs,
  onSavePrefs,
  onClose,
}) => {
  const [method, setMethod] = useState(currentPrefs?.method || 'bKash Direct');
  const [accountNumber, setAccountNumber] = useState(currentPrefs?.accountNumber || '+8801700000000');
  const [holderName, setHolderName] = useState(currentPrefs?.holderName || 'Tanvir Rahman');
  const [autoConfirmQuickBook, setAutoConfirmQuickBook] = useState(currentPrefs?.autoConfirmQuickBook ?? true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const PAYMENT_OPTIONS = [
    { id: 'bKash Direct', name: 'bKash Direct Pay', icon: '📱', desc: 'Instant 1-Click PIN-less settlement' },
    { id: 'Nagad Instant', name: 'Nagad Wallet', icon: '⚡', desc: 'Zero charge instant travel checkout' },
    { id: 'Visa **** 4242', name: 'Visa / Mastercard', icon: '💳', desc: 'Saved 3D Secure Vault Card' },
    { id: 'Rocket Mobile', name: 'DBBL Rocket', icon: '🚀', desc: 'Direct Dutch-Bangla mobile bank' },
    { id: 'City Bank Amex', name: 'City Bank Amex', icon: '🏛️', desc: '10% Cashback on BD hotel bookings' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSavePrefs({
      method,
      accountNumber,
      holderName,
      autoConfirmQuickBook,
    });
    setSavedSuccess(true);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="quickbook-modal-title"
        className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl text-slate-100 overflow-hidden my-8"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Zap className="w-5 h-5 fill-amber-400" />
            </div>
            <div>
              <h2 id="quickbook-modal-title" className="text-base font-bold text-white flex items-center gap-2">
                Firebase Quick Book Payment Setup
              </h2>
              <p className="text-xs text-slate-400">
                Bypass checkout pages &amp; confirm bookings instantly
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

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {savedSuccess && (
            <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center space-x-2 animate-bounce">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Payment preferences saved to Firebase Firestore!</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Select Default Payment Method
            </label>
            <div className="space-y-2">
              {PAYMENT_OPTIONS.map((opt) => (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => setMethod(opt.id)}
                  className={`w-full p-3 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                    method === opt.id
                      ? 'bg-amber-500/10 border-amber-500/50 text-white shadow-lg shadow-amber-500/10'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">{opt.icon}</span>
                    <div>
                      <span className="text-xs font-bold text-white block">{opt.name}</span>
                      <span className="text-[11px] text-slate-400">{opt.desc}</span>
                    </div>
                  </div>

                  {method === opt.id && (
                    <div className="p-1 rounded-full bg-amber-500 text-slate-950">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Account Phone / Card No.
              </label>
              <input
                type="text"
                required
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="+8801700000000"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Account Holder Name
              </label>
              <input
                type="text"
                required
                value={holderName}
                onChange={(e) => setHolderName(e.target.value)}
                placeholder="Tanvir Rahman"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-white block">Auto-Confirm 1-Click Quick Book</span>
              <span className="text-[11px] text-slate-400 block">
                Automatically process payment with saved Firebase credentials when Quick Book is toggled ON
              </span>
            </div>
            <button
              type="button"
              onClick={() => setAutoConfirmQuickBook(!autoConfirmQuickBook)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                autoConfirmQuickBook ? 'bg-amber-500' : 'bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  autoConfirmQuickBook ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center space-x-2 text-[11px] text-slate-400 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800">
            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Encrypted &amp; securely synchronized to Firebase Firestore database.</span>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <Zap className="w-4 h-4 fill-slate-950" />
              <span>Save Payment Preferences</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
