import React, { useState } from 'react';
import { 
  Globe2, 
  Coins, 
  Sparkles, 
  LayoutDashboard, 
  Layers, 
  Menu, 
  X,
  Compass,
  UserCheck,
  Crown,
  BarChart2,
  Wallet,
} from 'lucide-react';
import { SupportedCurrency, CURRENCY_REGISTRY, formatCurrency } from '../utils/currency';
import { DepartureAlert } from '../utils/notifications';
import { NotificationCenter } from './NotificationCenter';
import { LanguageCode, UserRole } from '../types/travel';
import { TRANSLATIONS } from '../data/translations';

export type AppTab =
  | 'marketplace'
  | 'tripadvisor_hub'
  | 'offline_maps'
  | 'ai_concierge'
  | 'vendor_hub'
  | 'enterprise_dr'
  | 'loyalty_rewards'
  | 'calendar_sync'
  | 'travel_insights'
  | 'travel_wallet'
  | 'interest_activities';

interface HeaderProps {
  alerts?: DepartureAlert[];
  onMarkAlertAsRead?: (id: string) => void;
  onMarkAllAlertsAsRead?: () => void;
  onTriggerTestPush?: () => void;
  pushEnabled?: boolean;
  onTogglePushEnabled?: () => void;
  currentCurrency: SupportedCurrency;
  onCurrencyChange: (c: SupportedCurrency) => void;
  currentLang: LanguageCode;
  onLangChange: (l: LanguageCode) => void;
  currentRole: UserRole;
  onRoleChange: (r: UserRole) => void;
  loyaltyPoints?: number;
  walletBalanceUsd?: number;
  savedTripsCount?: number;
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  isHighContrast: boolean;
  onToggleHighContrast: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  loyaltyPoints = 0,
  walletBalanceUsd = 1450,
  savedTripsCount = 0,
  alerts = [],
  onMarkAlertAsRead = () => {},
  onMarkAllAlertsAsRead = () => {},
  onTriggerTestPush = () => {},
  pushEnabled = true,
  onTogglePushEnabled = () => {},
  currentCurrency,
  onCurrencyChange,
  currentLang,
  onLangChange,
  currentRole,
  onRoleChange,
  activeTab,
  onTabChange,
  isHighContrast,
  onToggleHighContrast,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const t = TRANSLATIONS[currentLang];

  const languages: Array<{ code: LanguageCode; label: string; flag: string }> = [
    { code: 'en', label: 'English (BD)', flag: 'BD' },
    { code: 'bn', label: 'বাংলা (BD)', flag: 'BN' },
    { code: 'es', label: 'Español', flag: 'ES' },
    { code: 'fr', label: 'Français', flag: 'FR' },
    { code: 'de', label: 'Deutsch', flag: 'DE' },
    { code: 'ja', label: '日本語', flag: 'JP' },
    { code: 'zh', label: '中文', flag: 'CN' },
    { code: 'ar', label: 'العربية', flag: 'AE' },
    { code: 'pt', label: 'Português', flag: 'BR' },
  ];

  const currencies: SupportedCurrency[] = ['BDT', 'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'SGD', 'INR', 'AED'];

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md text-slate-100">
      <div className="max-w-[1440px] mx-auto px-3 sm:px-5">
        <div className="flex items-center justify-between h-16 gap-2">
          
          {/* Logo & Brand */}
          <div className="flex items-center space-x-2.5 cursor-pointer flex-shrink-0" onClick={() => onTabChange('marketplace')}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 via-cyan-500 to-rose-500 p-0.5 shadow-lg shadow-emerald-500/25">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Compass className="w-4 h-4 text-emerald-400 animate-[spin_20s_linear_infinite]" />
              </div>
            </div>
            <div>
              <div className="flex items-center">
                <span className="font-bold text-base tracking-tight bg-gradient-to-r from-white via-slate-100 to-emerald-300 bg-clip-text text-transparent">
                  AetherVoyage
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden 2xl:block whitespace-nowrap">
                All 8 Divisions • Hotels, Rail &amp; Launches
              </p>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden lg:flex items-center space-x-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800/80" aria-label="Main Navigation">
            <button
              onClick={() => onTabChange('marketplace')}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all flex items-center space-x-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'marketplace'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Layers className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Bookings</span>
            </button>

            <button
              onClick={() => onTabChange('travel_wallet')}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all flex items-center space-x-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'travel_wallet'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Wallet className="w-3.5 h-3.5 flex-shrink-0 text-emerald-400" />
              <span>Travel Wallet</span>
            </button>

            <button
              onClick={() => onTabChange('travel_insights')}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all flex items-center space-x-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'travel_insights'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5 flex-shrink-0 text-cyan-400" />
              <span>Travel Insights</span>
            </button>

            <button
              onClick={() => onTabChange('ai_concierge')}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all flex items-center space-x-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'ai_concierge'
                  ? 'bg-fuchsia-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
              <span>AI Concierge</span>
            </button>

            <button
              onClick={() => onTabChange('vendor_hub')}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all flex items-center space-x-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'vendor_hub'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Vendor Hub</span>
            </button>

            <button
              onClick={() => onTabChange('loyalty_rewards')}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all flex items-center space-x-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'loyalty_rewards'
                  ? 'bg-gradient-to-r from-amber-500 to-indigo-600 text-white font-bold shadow-md shadow-amber-500/20'
                  : 'text-amber-400 hover:text-amber-300 hover:bg-slate-800/60'
              }`}
            >
              <Crown className="w-3.5 h-3.5 text-amber-300 flex-shrink-0" />
              <span>Rewards ({loyaltyPoints.toLocaleString()})</span>
            </button>
          </nav>

          {/* Right Controls: Quick Wallet Badge, Role, Currency, Language, Single Notification Bell, Mobile Menu */}
          <div className="flex items-center space-x-1.5 flex-shrink-0">
            {/* Quick Header Digital Wallet Balance Badge */}
            <button
              type="button"
              onClick={() => onTabChange('travel_wallet')}
              title="Open Digital Travel Wallet & QR Passes"
              className={`hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-mono tabular-nums transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'travel_wallet'
                  ? 'bg-emerald-950/90 border-emerald-500 text-emerald-300 font-bold'
                  : 'bg-slate-900 border-slate-800 text-slate-200 hover:border-emerald-500/60'
              }`}
            >
              <Wallet className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{formatCurrency(walletBalanceUsd, currentCurrency)}</span>
            </button>
            
            {/* Role Switcher (visible on wide desktop) */}
            <div className="hidden 2xl:block relative">
              <label htmlFor="role-select" className="sr-only">Switch User Perspective</label>
              <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg px-1.5 py-1 text-[11px]">
                <UserCheck className="w-3.5 h-3.5 text-indigo-400 mr-1" />
                <select
                  id="role-select"
                  value={currentRole}
                  onChange={(e) => onRoleChange(e.target.value as UserRole)}
                  className="bg-transparent text-slate-300 font-medium text-[11px] focus:outline-none cursor-pointer"
                  aria-label="User Role Selection"
                >
                  <option value="traveller" className="bg-slate-900 text-white">Traveller</option>
                  <option value="vendor" className="bg-slate-900 text-white">Agency / Host</option>
                  <option value="compliance_auditor" className="bg-slate-900 text-white">SOC2 Auditor</option>
                </select>
              </div>
            </div>

            {/* Currency Selector (hidden on extra small screens) */}
            <div className="hidden sm:block relative">
              <label htmlFor="currency-select" className="sr-only">Currency</label>
              <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg px-1.5 py-1 text-[11px]">
                <Coins className="w-3.5 h-3.5 text-amber-400 mr-1" />
                <select
                  id="currency-select"
                  value={currentCurrency}
                  onChange={(e) => onCurrencyChange(e.target.value as SupportedCurrency)}
                  className="bg-transparent text-slate-300 font-medium text-[11px] focus:outline-none cursor-pointer max-w-[54px]"
                  aria-label="Currency Selection"
                >
                  {currencies.map((curr) => (
                    <option key={curr} value={curr} className="bg-slate-900 text-white">
                      {curr} ({CURRENCY_REGISTRY[curr].symbol})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Language Selector (hidden on extra small screens) */}
            <div className="hidden sm:block relative">
              <label htmlFor="language-select" className="sr-only">Language</label>
              <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg px-1.5 py-1 text-[11px]">
                <Globe2 className="w-3.5 h-3.5 text-cyan-400 mr-1" />
                <select
                  id="language-select"
                  value={currentLang}
                  onChange={(e) => onLangChange(e.target.value as LanguageCode)}
                  className="bg-transparent text-slate-300 font-medium text-[11px] focus:outline-none cursor-pointer max-w-[92px]"
                  aria-label="Language Selection"
                >
                  {languages.map((lang) => (
                    <option key={lang.code} value={lang.code} className="bg-slate-900 text-white">
                      {lang.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Single Unified Departure Push Notification Center */}
            <NotificationCenter
              alerts={alerts}
              onMarkAsRead={onMarkAlertAsRead}
              onMarkAllAsRead={onMarkAllAlertsAsRead}
              onTriggerTestPush={onTriggerTestPush}
              pushEnabled={pushEnabled}
              onTogglePushEnabled={onTogglePushEnabled}
            />



            {/* Mobile Navigation Toggle (only visible on mobile/tablet viewports) */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg bg-slate-900 text-slate-300 border border-slate-800 focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-800 bg-slate-950 px-4 py-4 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => { onTabChange('marketplace'); setMobileMenuOpen(false); }}
              className={`p-2.5 rounded-lg text-left text-xs font-medium flex items-center space-x-2 ${
                activeTab === 'marketplace' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-300'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Bookings</span>
            </button>

            <button
              onClick={() => { onTabChange('travel_wallet'); setMobileMenuOpen(false); }}
              className={`p-2.5 rounded-lg text-left text-xs font-medium flex items-center space-x-2 ${
                activeTab === 'travel_wallet' ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-slate-300'
              }`}
            >
              <Wallet className="w-4 h-4 text-emerald-400" />
              <span>Wallet ({formatCurrency(walletBalanceUsd, currentCurrency)})</span>
            </button>

            <button
              onClick={() => { onTabChange('travel_insights'); setMobileMenuOpen(false); }}
              className={`p-2.5 rounded-lg text-left text-xs font-medium flex items-center space-x-2 ${
                activeTab === 'travel_insights' ? 'bg-cyan-600 text-white' : 'bg-slate-900 text-slate-300'
              }`}
            >
              <BarChart2 className="w-4 h-4 text-cyan-400" />
              <span>Travel Insights</span>
            </button>

            <button
              onClick={() => { onTabChange('ai_concierge'); setMobileMenuOpen(false); }}
              className={`p-2.5 rounded-lg text-left text-xs font-medium flex items-center space-x-2 ${
                activeTab === 'ai_concierge' ? 'bg-fuchsia-600 text-white' : 'bg-slate-900 text-slate-300'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>{t.aiConcierge}</span>
            </button>

            <button
              onClick={() => { onTabChange('vendor_hub'); setMobileMenuOpen(false); }}
              className={`p-2.5 rounded-lg text-left text-xs font-medium flex items-center space-x-2 ${
                activeTab === 'vendor_hub' ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-slate-300'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>{t.vendorHub}</span>
            </button>

            <button
              onClick={() => { onTabChange('loyalty_rewards'); setMobileMenuOpen(false); }}
              className={`p-2.5 rounded-lg text-left text-xs font-medium flex items-center space-x-2 ${
                activeTab === 'loyalty_rewards' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-900 text-amber-300'
              }`}
            >
              <Crown className="w-4 h-4 text-amber-400" />
              <span>Rewards ({loyaltyPoints.toLocaleString()} pts)</span>
            </button>
          </div>

          <div className="pt-2 border-t border-slate-800 grid grid-cols-2 gap-2">
            <div>
              <span className="text-[11px] text-slate-400 block mb-1">Currency:</span>
              <select
                value={currentCurrency}
                onChange={(e) => onCurrencyChange(e.target.value as SupportedCurrency)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white"
              >
                {currencies.map((curr) => (
                  <option key={curr} value={curr}>{curr} ({CURRENCY_REGISTRY[curr].symbol})</option>
                ))}
              </select>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 block mb-1">Language:</span>
              <select
                value={currentLang}
                onChange={(e) => onLangChange(e.target.value as LanguageCode)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white"
              >
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code}>{lang.flag} {lang.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
