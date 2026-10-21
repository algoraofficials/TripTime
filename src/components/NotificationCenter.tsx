import React, { useState } from 'react';
import { 
  Bell, 
  X, 
  Plane, 
  Train, 
  Ship, 
  Clock, 
  CheckCheck, 
  AlertCircle, 
  Volume2, 
  BellRing,
  ExternalLink,
  ShieldCheck,
  Radio,
  TrendingDown,
  Building2,
  Compass,
  Utensils
} from 'lucide-react';
import { DepartureAlert } from '../utils/notifications';

interface NotificationCenterProps {
  alerts: DepartureAlert[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onTriggerTestPush: () => void;
  pushEnabled: boolean;
  onTogglePushEnabled: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  alerts,
  onMarkAsRead,
  onMarkAllAsRead,
  onTriggerTestPush,
  pushEnabled,
  onTogglePushEnabled,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'price_drop' | 'critical'>('all');

  const unreadCount = alerts.filter((a) => !a.read).length;
  const priceDropCount = alerts.filter(
    (a) => a.category === 'price_drop' || a.urgency === 'price_drop'
  ).length;

  const filteredAlerts = alerts.filter((a) => {
    if (filter === 'unread') return !a.read;
    if (filter === 'price_drop') return a.category === 'price_drop' || a.urgency === 'price_drop';
    if (filter === 'critical') return a.urgency === 'critical';
    return true;
  });

  const getAlertIcon = (alert: DepartureAlert) => {
    if (alert.category === 'price_drop' || alert.urgency === 'price_drop') {
      return <TrendingDown className="w-4 h-4 text-emerald-400" />;
    }
    if (alert.transitType === 'flight') return <Plane className="w-4 h-4 text-cyan-400" />;
    if (alert.transitType === 'train') return <Train className="w-4 h-4 text-indigo-400" />;
    if (alert.transitType === 'hotel') return <Building2 className="w-4 h-4 text-amber-400" />;
    if (alert.transitType === 'experience') return <Compass className="w-4 h-4 text-fuchsia-400" />;
    if (alert.transitType === 'restaurant') return <Utensils className="w-4 h-4 text-rose-400" />;
    return <Ship className="w-4 h-4 text-emerald-400" />;
  };

  return (
    <div className="relative">
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors"
        aria-label={`Departure push notifications: ${unreadCount} unread alerts`}
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white font-black text-[10px] flex items-center justify-center animate-pulse border-2 border-slate-950">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Popover Drawer */}
      {isOpen && (
        <div 
          role="region"
          aria-label="Departure Notifications Panel"
          className="absolute right-0 mt-2 w-80 sm:w-[430px] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl z-50 overflow-hidden text-slate-100 animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Header */}
          <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
                <BellRing className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white flex items-center space-x-1.5">
                  <span>Departure & Price Drop Alerts</span>
                </h3>
                <span className="text-[10px] text-slate-400">
                  Live transit gate notices & Tripadvisor rate monitoring
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg"
              aria-label="Close notification panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Browser Push Permission & Test Simulation Banner */}
          <div className="p-3 bg-indigo-950/40 border-b border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <Radio className={`w-3.5 h-3.5 ${pushEnabled ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
              <span className="text-[11px] text-slate-300 font-medium">
                Push Notifications: <strong className={pushEnabled ? 'text-emerald-400' : 'text-slate-400'}>{pushEnabled ? 'Active' : 'Muted'}</strong>
              </span>
            </div>

            <div className="flex items-center space-x-1.5">
              <button
                onClick={onTogglePushEnabled}
                className="text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                {pushEnabled ? 'Mute' : 'Enable'}
              </button>
              <button
                onClick={onTriggerTestPush}
                className="text-[10px] px-2 py-0.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
                title="Send a sample departure notification"
              >
                Ping Push
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="px-3.5 py-2 border-b border-slate-800/80 bg-slate-950/60 flex items-center justify-between gap-1.5 text-[11px]">
            <div className="flex items-center space-x-1 overflow-x-auto">
              <button
                onClick={() => setFilter('all')}
                className={`px-2 py-0.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${filter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                All ({alerts.length})
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-2 py-0.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${filter === 'unread' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Unread ({unreadCount})
              </button>
              <button
                onClick={() => setFilter('price_drop')}
                className={`px-2 py-0.5 rounded-lg font-semibold whitespace-nowrap transition-colors cursor-pointer ${filter === 'price_drop' ? 'bg-emerald-600 text-white' : 'text-emerald-400 hover:text-emerald-300'}`}
              >
                Price Drops ({priceDropCount})
              </button>
              <button
                onClick={() => setFilter('critical')}
                className={`px-2 py-0.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${filter === 'critical' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Imminent
              </button>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={onMarkAllAsRead}
                className="text-indigo-400 hover:text-indigo-300 flex items-center space-x-1 font-semibold whitespace-nowrap flex-shrink-0 cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark read</span>
              </button>
            )}
          </div>

          {/* Alerts Scrollable Thread */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
            {filteredAlerts.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 space-y-1">
                <Clock className="w-6 h-6 mx-auto text-slate-600 mb-2" />
                <p className="font-semibold text-slate-400">No departure alerts right now</p>
                <p className="text-[11px]">Book a flight or train to see automated departure notices.</p>
              </div>
            ) : (
              filteredAlerts.map((alert) => (
                <div
                  key={alert.id}
                  onClick={() => onMarkAsRead(alert.id)}
                  className={`p-3.5 hover:bg-slate-800/40 cursor-pointer transition-colors space-y-1.5 ${
                    !alert.read ? 'bg-slate-950/90' : ''
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center space-x-2 min-w-0">
                      {getAlertIcon(alert)}
                      <span className="text-xs font-bold text-white truncate max-w-[165px]">
                        {alert.serviceTitle}
                      </span>
                    </div>

                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase whitespace-nowrap flex-shrink-0 ${
                      alert.urgency === 'price_drop' || alert.category === 'price_drop'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : alert.urgency === 'critical' 
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse'
                        : alert.urgency === 'upcoming'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {alert.scheduledAlert}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-snug">
                    {alert.message}
                  </p>

                  <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400">
                    <span className="font-mono text-cyan-300 font-semibold">
                      {alert.platformOrGate || `Departs ${alert.departureTime}`}
                    </span>
                    <span>{alert.createdAt}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-3 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-500 text-center">
            Pushes sync automatically when departure gates or delays update
          </div>
        </div>
      )}
    </div>
  );
};
