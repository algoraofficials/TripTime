import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Download,
  Copy,
  Check,
  Bell,
  Clock,
  MapPin,
  Plane,
  Train,
  Ship,
  Building2,
  FileCode2,
  Share2,
  Sparkles,
  CheckCircle2,
  ExternalLink,
  Sliders,
  Globe,
  ShieldCheck,
} from 'lucide-react';
import { Listing } from '../types/travel';
import {
  buildCalendarEvent,
  generateIcsFeed,
  CalendarExportOptions,
  CalendarEventItem,
} from '../utils/calendar';

interface CalendarIntegrationProps {
  bookingHistory: Listing[];
  onNotify: (title: string, subtitle?: string, type?: 'push' | 'info') => void;
}

export const CalendarIntegration: React.FC<CalendarIntegrationProps> = ({
  bookingHistory,
  onNotify,
}) => {
  const [baseDate, setBaseDate] = useState<string>('2026-10-24');
  const [reminderMinutes, setReminderMinutes] = useState<number>(120);
  const [includeConfirmationCode, setIncludeConfirmationCode] = useState<boolean>(true);
  const [includeCarbonData, setIncludeCarbonData] = useState<boolean>(true);
  const [timezone, setTimezone] = useState<string>('UTC');
  const [selectedIds, setSelectedIds] = useState<string[]>(() =>
    bookingHistory.map((b) => b.id)
  );
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activePreviewEvent, setActivePreviewEvent] = useState<CalendarEventItem | null>(null);
  const [showRawIcs, setShowRawIcs] = useState<boolean>(true);

  const exportOptions: CalendarExportOptions = useMemo(
    () => ({
      baseDate,
      reminderMinutesBefore: reminderMinutes,
      includeConfirmationCode,
      includeCarbonData,
      timezone,
    }),
    [baseDate, reminderMinutes, includeConfirmationCode, includeCarbonData, timezone]
  );

  // Sync selectedbookings with current bookingHistory
  const selectedBookings = useMemo(() => {
    const active = bookingHistory.filter((b) => selectedIds.includes(b.id));
    return active.length > 0 ? active : bookingHistory;
  }, [bookingHistory, selectedIds]);

  const calendarEvents = useMemo(
    () =>
      bookingHistory.map((item, idx) => ({
        listing: item,
        event: buildCalendarEvent(item, idx, exportOptions),
      })),
    [bookingHistory, exportOptions]
  );

  const masterIcsString = useMemo(
    () => generateIcsFeed(selectedBookings, exportOptions),
    [selectedBookings, exportOptions]
  );

  const webcalSubscriptionUrl = useMemo(() => {
    const host = typeof window !== 'undefined' ? window.location.host : 'aethervoyage.travel';
    return `webcal://${host}/api/calendar/feed.ics?baseDate=${baseDate}&reminder=${reminderMinutes}`;
  }, [baseDate, reminderMinutes]);

  const httpsFeedUrl = useMemo(() => {
    const origin =
      typeof window !== 'undefined' ? window.location.origin : 'https://aethervoyage.travel';
    return `${origin}/api/calendar/feed.ics?baseDate=${baseDate}&reminder=${reminderMinutes}`;
  }, [baseDate, reminderMinutes]);

  const triggerIcsDownload = (icsPayload: string, filename: string, label: string) => {
    const blob = new Blob([icsPayload], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    onNotify(
      `📅 .ICS Feed Downloaded: ${filename}`,
      `Ready to import into Apple Calendar, Google Calendar, or Outlook (${label})`,
      'push'
    );
  };

  const handleCopyText = (text: string, key: string, toastTitle: string, toastSub: string) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
    onNotify(toastTitle, toastSub, 'info');
  };

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const getModeBadge = (type: Listing['type']) => {
    switch (type) {
      case 'flight':
        return {
          icon: <Plane className="w-4 h-4 text-cyan-400" />,
          label: 'Flight Segment',
          style: 'bg-cyan-950/80 text-cyan-300 border-cyan-800/60',
        };
      case 'train':
        return {
          icon: <Train className="w-4 h-4 text-indigo-400" />,
          label: 'Rail Transit',
          style: 'bg-indigo-950/80 text-indigo-300 border-indigo-800/60',
        };
      case 'ship':
        return {
          icon: <Ship className="w-4 h-4 text-emerald-400" />,
          label: 'Maritime Charter',
          style: 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60',
        };
      default:
        return {
          icon: <Building2 className="w-4 h-4 text-amber-400" />,
          label: 'Hospitality Stay',
          style: 'bg-amber-950/80 text-amber-300 border-amber-800/60',
        };
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Top Hero Banner */}
      <div className="relative rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-cyan-950/80 border border-indigo-800/40 p-6 sm:p-8 shadow-2xl overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold">
              <Calendar className="w-3.5 h-3.5" />
              <span>RFC 5545 Standard iCalendar (.ICS) Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Global Itinerary Calendar Sync & .ICS Feed Generator
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Export your booked flights, high-speed bullet trains, maritime charters, and luxury stays directly to{' '}
              <strong className="text-white">Google Calendar</strong>,{' '}
              <strong className="text-white">Apple Calendar</strong>, or subscribe via live{' '}
              <code className="text-cyan-300 font-mono text-xs bg-slate-950/70 px-1.5 py-0.5 rounded">
                webcal://
              </code>{' '}
              feed with automated pre-departure <code className="text-amber-300 font-mono text-xs">VALARM</code> triggers.
            </p>
          </div>

          {/* Primary Master Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() =>
                triggerIcsDownload(
                  masterIcsString,
                  `aethervoyage-itinerary-${baseDate}.ics`,
                  `${selectedBookings.length} booked segments`
                )
              }
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center space-x-2 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download Master .ICS ({selectedBookings.length} Events)</span>
            </button>

            <button
              onClick={() =>
                handleCopyText(
                  webcalSubscriptionUrl,
                  'webcal-master',
                  '🍎 Apple Calendar WebCal Feed Copied!',
                  'Paste into Apple Calendar > File > New Calendar Subscription'
                )
              }
              className="px-4 py-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-100 border border-slate-700 font-bold text-xs flex items-center space-x-2 transition-all cursor-pointer"
            >
              {copiedKey === 'webcal-master' ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Share2 className="w-4 h-4 text-cyan-400" />
              )}
              <span>
                {copiedKey === 'webcal-master'
                  ? 'Copied WebCal Feed URL!'
                  : 'Copy Apple Calendar WebCal Link'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Configuration & Feed Subscription Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Feed Customization Controls */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-5 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                .ICS Generator & VALARM Parameters
              </h2>
            </div>
            <span className="text-[11px] text-emerald-400 font-semibold flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>RFC 5545 Validated</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Departure Start Date */}
            <div>
              <label
                htmlFor="ics-start-date"
                className="block text-xs font-semibold text-slate-300 mb-1.5"
              >
                Itinerary Departure Date
              </label>
              <input
                id="ics-start-date"
                type="date"
                value={baseDate}
                onChange={(e) => setBaseDate(e.target.value || '2026-10-24')}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Pre-departure VALARM Trigger */}
            <div>
              <label
                htmlFor="ics-alarm-select"
                className="block text-xs font-semibold text-slate-300 mb-1.5"
              >
                Pre-Departure VALARM Alert
              </label>
              <select
                id="ics-alarm-select"
                value={reminderMinutes}
                onChange={(e) => setReminderMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value={30}>30 minutes before (-PT30M)</option>
                <option value={60}>1 hour before (-PT60M)</option>
                <option value={120}>2 hours before (-PT120M)</option>
                <option value={180}>3 hours before (-PT180M)</option>
                <option value={1440}>24 hours before (-PT1440M)</option>
              </select>
            </div>

            {/* Calendar Timezone Reference */}
            <div>
              <label
                htmlFor="ics-tz-select"
                className="block text-xs font-semibold text-slate-300 mb-1.5"
              >
                Calendar Timezone Standard
              </label>
              <select
                id="ics-tz-select"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="UTC">UTC (Universal Coordinated Time)</option>
                <option value="Asia/Tokyo">Asia/Tokyo (JST • UTC+9)</option>
                <option value="Europe/Paris">Europe/Paris (CET • UTC+1)</option>
                <option value="America/New_York">America/New_York (EST • UTC-5)</option>
              </select>
            </div>
          </div>

          {/* Toggle Metadata Options */}
          <div className="flex flex-wrap items-center gap-6 pt-1">
            <label className="inline-flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={includeConfirmationCode}
                onChange={(e) => setIncludeConfirmationCode(e.target.checked)}
                className="rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-0"
              />
              <span>Embed Booking Reference (AV-XXXXXX)</span>
            </label>

            <label className="inline-flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={includeCarbonData}
                onChange={(e) => setIncludeCarbonData(e.target.checked)}
                className="rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-0"
              />
              <span>Include Verified CO2e Sustainability Telemetry</span>
            </label>
          </div>
        </div>

        {/* Live Subscription Endpoints Card */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-4 shadow-xl">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center space-x-1.5">
                <Globe className="w-4 h-4" />
                <span>Live Calendar Subscription</span>
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Auto-Sync
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Subscribe in <strong className="text-slate-200">Google Calendar (From URL)</strong> or{' '}
              <strong className="text-slate-200">Apple Calendar / iCloud</strong> so gate changes and new bookings sync automatically:
            </p>
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-cyan-300 break-all select-all">
              {httpsFeedUrl}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() =>
                handleCopyText(
                  httpsFeedUrl,
                  'https-feed',
                  '🔗 Google Calendar Feed URL Copied!',
                  'In Google Calendar: Other Calendars (+) > From URL > Paste link'
                )
              }
              className="px-3 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
            >
              {copiedKey === 'https-feed' ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>{copiedKey === 'https-feed' ? 'Copied URL' : 'Google Feed URL'}</span>
            </button>

            <button
              onClick={() =>
                triggerIcsDownload(
                  masterIcsString,
                  'apple-calendar-itinerary.ics',
                  'Apple Calendar Bundle'
                )
              }
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>Apple .ICS Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Booked Itinerary Segments List with Individual Google & Apple Calendar Export */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <span>Booked Itinerary Events ({calendarEvents.length})</span>
            </h2>
            <p className="text-xs text-slate-400">
              Export individual segments to Google Calendar or Apple Calendar (.ics), or select segments for your master feed.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setSelectedIds(bookingHistory.map((b) => b.id))}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 font-semibold cursor-pointer"
            >
              Select All ({bookingHistory.length})
            </button>
            <button
              onClick={() => setShowRawIcs(!showRawIcs)}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-cyan-400 font-semibold flex items-center space-x-1.5 cursor-pointer"
            >
              <FileCode2 className="w-3.5 h-3.5" />
              <span>{showRawIcs ? 'Hide Raw .ICS Feed' : 'Inspect Raw .ICS Feed'}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {calendarEvents.map(({ listing, event }) => {
            const badge = getModeBadge(listing.type);
            const isSelected = selectedIds.includes(listing.id);

            return (
              <div
                key={`${listing.id}-${event.startUtc}`}
                className={`rounded-3xl bg-slate-900 border transition-all p-5 flex flex-col justify-between space-y-4 shadow-lg ${
                  isSelected
                    ? 'border-indigo-500/60 ring-1 ring-indigo-500/20'
                    : 'border-slate-800 opacity-75'
                }`}
              >
                <div className="space-y-3">
                  {/* Top Bar: Checkbox + Mode Badge + Confirmation Code */}
                  <div className="flex items-center justify-between gap-2">
                    <label className="inline-flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelection(listing.id)}
                        aria-label={`Include ${listing.title} in master .ics feed`}
                        className="rounded border-slate-700 bg-slate-950 text-indigo-600"
                      />
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border flex items-center space-x-1.5 ${badge.style}`}
                      >
                        {badge.icon}
                        <span>{badge.label}</span>
                      </span>
                    </label>
                    <span className="font-mono text-[11px] font-bold text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/50">
                      {event.confirmationCode}
                    </span>
                  </div>

                  {/* Event Title & Location */}
                  <div>
                    <h3 className="text-sm font-bold text-white leading-snug">
                      {listing.title}
                    </h3>
                    <div className="flex items-center space-x-1.5 text-xs text-slate-400 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                      <span>{event.location}</span>
                    </div>
                  </div>

                  {/* Timestamp & Alarm Box */}
                  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/90 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5 text-indigo-400" />
                        <span>DTSTART:</span>
                      </span>
                      <span className="font-mono text-slate-200 font-semibold">
                        {event.startUtc}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5 text-cyan-400" />
                        <span>DTEND:</span>
                      </span>
                      <span className="font-mono text-slate-200 font-semibold">
                        {event.endUtc}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-900">
                      <span className="text-slate-400 flex items-center space-x-1">
                        <Bell className="w-3.5 h-3.5 text-amber-400" />
                        <span>VALARM:</span>
                      </span>
                      <span className="text-amber-300 font-medium">
                        {reminderMinutes}m prior (-PT{reminderMinutes}M)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons: Google Calendar + Apple/Outlook .ICS */}
                <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setActivePreviewEvent(event);
                      handleCopyText(
                        event.googleCalendarUrl,
                        `gcal-${listing.id}`,
                        `🗓️ Google Calendar Event Ready: ${listing.title}`,
                        'Event template link copied & opened in preview!'
                      );
                    }}
                    className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Google Cal</span>
                  </button>

                  <button
                    onClick={() => {
                      const singleIcs = generateIcsFeed([listing], exportOptions);
                      triggerIcsDownload(
                        singleIcs,
                        `${listing.id}.ics`,
                        listing.title
                      );
                    }}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 font-bold text-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Apple .ICS</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Google Calendar Interactive Event Template Preview Modal */}
      {activePreviewEvent && (
        <div
          role="dialog"
          aria-label="Google Calendar Event Export Preview"
          className="p-6 rounded-3xl bg-gradient-to-r from-indigo-950/90 via-slate-900 to-slate-900 border border-indigo-500/50 shadow-2xl space-y-4"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">
                Google Calendar & Apple Calendar Event Payload Ready
              </h3>
            </div>
            <button
              onClick={() => setActivePreviewEvent(null)}
              className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded-lg bg-slate-800"
            >
              Close Preview ✕
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5 p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <div className="text-slate-400 font-semibold">SUMMARY (Event Title)</div>
              <div className="text-white font-bold text-sm">{activePreviewEvent.title}</div>
              <div className="text-slate-400 font-semibold pt-2">LOCATION</div>
              <div className="text-cyan-300">{activePreviewEvent.location}</div>
              <div className="text-slate-400 font-semibold pt-2">UTC WINDOW</div>
              <div className="font-mono text-indigo-300">
                {activePreviewEvent.startUtc} → {activePreviewEvent.endUtc}
              </div>
            </div>

            <div className="space-y-2 p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="text-slate-400 font-semibold mb-1">
                  Google Calendar Deep-Link URL
                </div>
                <div className="font-mono text-[11px] text-slate-300 break-all line-clamp-3 bg-slate-900 p-2 rounded-lg border border-slate-800">
                  {activePreviewEvent.googleCalendarUrl}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2">
                <a
                  href={activePreviewEvent.googleCalendarUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs inline-flex items-center space-x-1.5"
                >
                  <span>Open in Google Calendar</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  onClick={() =>
                    handleCopyText(
                      activePreviewEvent.googleCalendarUrl,
                      'modal-gcal-copy',
                      'Copied Google Calendar Template URL!',
                      'Paste in any browser tab to add directly to Google Calendar'
                    )
                  }
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs inline-flex items-center space-x-1.5 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Template Link</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Live RFC 5545 .ICS Feed Inspector */}
      {showRawIcs && (
        <div className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
          <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <FileCode2 className="w-4 h-4 text-cyan-400" />
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Live RFC 5545 .ICS Feed Output ({selectedBookings.length} VEVENT Blocks)
                </h3>
                <p className="text-[11px] text-slate-400">
                  Standard iCalendar format compatible with Apple Calendar, Google Calendar, Microsoft Outlook, and Fastmail
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() =>
                  handleCopyText(
                    masterIcsString,
                    'raw-ics-copy',
                    '📋 Copied Raw .ICS Feed Payload!',
                    `${masterIcsString.split('\r\n').length} lines of RFC 5545 iCalendar data copied to clipboard`
                  )
                }
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center space-x-1.5 cursor-pointer"
              >
                {copiedKey === 'raw-ics-copy' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-cyan-400" />
                )}
                <span>{copiedKey === 'raw-ics-copy' ? 'Copied .ICS' : 'Copy Raw .ICS'}</span>
              </button>

              <button
                onClick={() =>
                  triggerIcsDownload(
                    masterIcsString,
                    `aethervoyage-itinerary-${baseDate}.ics`,
                    'Full RFC 5545 Feed'
                  )
                }
                className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center space-x-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .ICS</span>
              </button>
            </div>
          </div>

          <pre
            aria-label="Generated RFC 5545 iCalendar Feed"
            className="p-5 bg-slate-950/90 text-[11px] font-mono text-cyan-300 overflow-x-auto max-h-80 leading-relaxed"
          >
            {masterIcsString}
          </pre>
        </div>
      )}
    </div>
  );
};
