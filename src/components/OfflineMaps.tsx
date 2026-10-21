import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, 
  Download, 
  Check, 
  WifiOff, 
  Compass, 
  Navigation, 
  PhoneCall, 
  Hospital, 
  ShieldAlert, 
  Train, 
  Sparkles, 
  Layers, 
  Eye, 
  FileText,
  AlertTriangle,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { OfflinePack } from '../types/travel';
import { INITIAL_OFFLINE_PACKS } from '../data/mockData';

interface OfflineMapsProps {
  onNotify?: (msg: string) => void;
}

export const OfflineMaps: React.FC<OfflineMapsProps> = () => {
  const [packs, setPacks] = useState<OfflinePack[]>(INITIAL_OFFLINE_PACKS);
  const [selectedPackId, setSelectedPackId] = useState<string>('pack-dhaka-metro');
  const [activePoiFilter, setActivePoiFilter] = useState<{
    station: boolean;
    hospital: boolean;
    embassy: boolean;
    landmark: boolean;
    wifi: boolean;
  }>({
    station: true,
    hospital: true,
    embassy: true,
    landmark: true,
    wifi: true,
  });

  const [selectedPoi, setSelectedPoi] = useState<any | null>(null);
  const [navRouteOrigin, setNavRouteOrigin] = useState<string>('poi-kamalapur');
  const [navRouteDest, setNavRouteDest] = useState<string>('poi-lalbagh');
  const [isSimulatingNav, setIsSimulatingNav] = useState(false);
  const [offlineModeActive, setOfflineModeActive] = useState(true);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const currentPack = packs.find((p) => p.id === selectedPackId) || packs[0];

  const handleDownloadToggle = (packId: string) => {
    setPacks((prev) =>
      prev.map((p) => {
        if (p.id === packId) {
          return { ...p, isDownloaded: !p.isDownloaded };
        }
        return p;
      })
    );
  };

  // Draw offline vector map onto canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Background terrain
    ctx.fillStyle = '#0b0f19';
    ctx.fillRect(0, 0, width, height);

    // Subtle grid pattern (coordinates)
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw stylized river / water body
    ctx.fillStyle = '#0e2439';
    ctx.beginPath();
    ctx.moveTo(0, height * 0.65);
    ctx.bezierCurveTo(width * 0.3, height * 0.45, width * 0.7, height * 0.85, width, height * 0.6);
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fill();

    // Draw main railway / transit arterials
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.moveTo(width * 0.15, height * 0.3);
    ctx.lineTo(width * 0.5, height * 0.5);
    ctx.lineTo(width * 0.85, height * 0.7);
    ctx.stroke();

    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 3;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(width * 0.25, height * 0.8);
    ctx.lineTo(width * 0.5, height * 0.5);
    ctx.lineTo(width * 0.75, height * 0.25);
    ctx.stroke();

    ctx.setLineDash([]); // Reset dash

    // If navigating route, draw active glowing path between origin and destination
    if (isSimulatingNav) {
      const origin = currentPack.pois.find((p) => p.id === navRouteOrigin);
      const dest = currentPack.pois.find((p) => p.id === navRouteDest);
      if (origin && dest) {
        const ox = (origin.x / 100) * width;
        const oy = (origin.y / 100) * height;
        const dx = (dest.x / 100) * width;
        const dy = (dest.y / 100) * height;

        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 5;
        ctx.shadowColor = '#10b981';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.moveTo(ox, oy);
        ctx.lineTo((ox + dx) / 2, Math.min(oy, dy) - 20);
        ctx.lineTo(dx, dy);
        ctx.stroke();
        ctx.shadowBlur = 0; // reset
      }
    }

    // Render POI markers
    currentPack.pois.forEach((poi) => {
      if (!activePoiFilter[poi.type]) return;

      const px = (poi.x / 100) * width;
      const py = (poi.y / 100) * height;

      // Outer glow circle
      ctx.beginPath();
      ctx.arc(px, py, 14, 0, Math.PI * 2);
      let fillColor = '#6366f1';
      if (poi.type === 'hospital') fillColor = '#ef4444';
      if (poi.type === 'embassy') fillColor = '#f59e0b';
      if (poi.type === 'station') fillColor = '#06b6d4';
      if (poi.type === 'landmark') fillColor = '#8b5cf6';
      if (poi.type === 'wifi') fillColor = '#10b981';

      ctx.fillStyle = `${fillColor}33`;
      ctx.fill();

      // Inner dot
      ctx.beginPath();
      ctx.arc(px, py, 7, 0, Math.PI * 2);
      ctx.fillStyle = fillColor;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Label
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.fillText(poi.name, px + 12, py + 4);
    });
  }, [currentPack, activePoiFilter, isSimulatingNav, navRouteOrigin, navRouteDest]);

  // Click on canvas to inspect POI
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * 100;
    const clickY = ((e.clientY - rect.top) / rect.height) * 100;

    // Find closest POI within 8% radius
    let closest: any = null;
    let minDistance = 8.0;

    currentPack.pois.forEach((poi) => {
      const dist = Math.hypot(poi.x - clickX, poi.y - clickY);
      if (dist < minDistance) {
        minDistance = dist;
        closest = poi;
      }
    });

    if (closest) {
      setSelectedPoi(closest);
      setNavRouteDest(closest.id);
    }
  };

  const handleExportEmergencyDossier = () => {
    const dossierContent = {
      title: `${currentPack.name} - Emergency Survival & Transit Dossier`,
      generatedAt: new Date().toISOString(),
      offlinePackVersion: currentPack.version,
      emergencyHotlines: currentPack.emergencyHotlines,
      offlineStationsAndEmbassies: currentPack.pois.filter(
        (p) => p.type === 'embassy' || p.type === 'hospital' || p.type === 'station'
      ),
      instructions:
        'This dossier is stored in IndexedDB/LocalCache. No cellular data is needed to view transit lines or phone numbers.',
    };

    const blob = new Blob([JSON.stringify(dossierContent, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AetherVoyage-Offline-Emergency-${currentPack.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 pb-16">
      
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-cyan-950/40 to-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
            <WifiOff className="w-3.5 h-3.5" />
            <span>Zero-Connectivity Offline Vector Maps & Route Compass</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            High-Precision Offline Regional Navigation
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Download complete vector tiles, rail transit routes, emergency hospitals, and consular embassies directly to your device storage before departure. Operates without roaming data or Wi-Fi.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <button
            onClick={handleExportEmergencyDossier}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center space-x-2 border border-slate-700 transition-colors"
          >
            <FileText className="w-4 h-4 text-cyan-400" />
            <span>Export Emergency Dossier</span>
          </button>

          <button
            onClick={() => handleDownloadToggle(currentPack.id)}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 shadow-lg transition-all ${
              currentPack.isDownloaded
                ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-600/25'
            }`}
          >
            {currentPack.isDownloaded ? (
              <>
                <Check className="w-4 h-4" />
                <span>Pack Cached ({currentPack.sizeMb} MB)</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download {currentPack.name} ({currentPack.sizeMb} MB)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Grid: Pack Picker + Interactive Canvas Vector Map */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left: Pack Switcher & Layer Filters */}
        <div className="space-y-6">
          
          {/* Regional Packs */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              Available Regional Packs
            </span>
            <div className="space-y-2">
              {packs.map((pack) => (
                <button
                  key={pack.id}
                  onClick={() => setSelectedPackId(pack.id)}
                  className={`w-full p-3 rounded-2xl text-left border transition-all ${
                    selectedPackId === pack.id
                      ? 'bg-cyan-950/40 border-cyan-500 shadow-md shadow-cyan-500/10'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white">{pack.name}</span>
                    {pack.isDownloaded ? (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                        Cached
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500">{pack.sizeMb} MB</span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 block">{pack.region}, {pack.country}</span>
                  <div className="flex items-center space-x-3 text-[10px] text-slate-500 mt-2">
                    <span>{pack.poisCount} POIs</span>
                    <span>•</span>
                    <span>{pack.routesCount} Transit Arterials</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* POI Layer Toggles */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <span className="text-xs font-bold text-slate-300 block">
              Offline Map Layers & POIs
            </span>
            <div className="space-y-2 text-xs">
              <label className="flex items-center justify-between cursor-pointer text-slate-300 hover:text-white">
                <span className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                  <span>Train & Metro Stations</span>
                </span>
                <input
                  type="checkbox"
                  checked={activePoiFilter.station}
                  onChange={(e) => setActivePoiFilter({ ...activePoiFilter, station: e.target.checked })}
                  className="accent-cyan-400"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer text-slate-300 hover:text-white">
                <span className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <span>Hospitals & Trauma SOS</span>
                </span>
                <input
                  type="checkbox"
                  checked={activePoiFilter.hospital}
                  onChange={(e) => setActivePoiFilter({ ...activePoiFilter, hospital: e.target.checked })}
                  className="accent-red-400"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer text-slate-300 hover:text-white">
                <span className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <span>Embassies & Consulates</span>
                </span>
                <input
                  type="checkbox"
                  checked={activePoiFilter.embassy}
                  onChange={(e) => setActivePoiFilter({ ...activePoiFilter, embassy: e.target.checked })}
                  className="accent-amber-400"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer text-slate-300 hover:text-white">
                <span className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
                  <span>Scenic Landmarks & Hotels</span>
                </span>
                <input
                  type="checkbox"
                  checked={activePoiFilter.landmark}
                  onChange={(e) => setActivePoiFilter({ ...activePoiFilter, landmark: e.target.checked })}
                  className="accent-purple-400"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer text-slate-300 hover:text-white">
                <span className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  <span>Offline Mesh Wi-Fi Hotspots</span>
                </span>
                <input
                  type="checkbox"
                  checked={activePoiFilter.wifi}
                  onChange={(e) => setActivePoiFilter({ ...activePoiFilter, wifi: e.target.checked })}
                  className="accent-emerald-400"
                />
              </label>
            </div>
          </div>

          {/* Emergency Hotlines Box */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5">
            <div className="flex items-center space-x-2 text-xs font-bold text-amber-400">
              <PhoneCall className="w-3.5 h-3.5" />
              <span>{currentPack.name} Emergency SOS</span>
            </div>
            <div className="space-y-1.5 text-xs">
              {currentPack.emergencyHotlines.map((h, i) => (
                <div key={i} className="flex items-center justify-between py-1 border-b border-slate-800/60 last:border-0">
                  <span className="text-slate-400 text-[11px] truncate max-w-[150px]">{h.label}</span>
                  <a href={`tel:${h.number}`} className="font-mono font-bold text-cyan-300 hover:underline">
                    {h.number}
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center & Right: Canvas Vector Map + POI Inspector */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* Map Surface */}
          <div className="relative rounded-3xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl">
            
            {/* Top map status overlay */}
            <div className="absolute top-4 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
              <div className="pointer-events-auto flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-800 text-xs text-white">
                <Compass className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                <span className="font-bold">{currentPack.name}</span>
                <span className="text-slate-400">• Offline Vector v{currentPack.version}</span>
              </div>

              {/* Navigation Route simulation button */}
              <div className="pointer-events-auto flex items-center space-x-2">
                <button
                  onClick={() => setIsSimulatingNav(!isSimulatingNav)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-md transition-all ${
                    isSimulatingNav
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-900/90 text-slate-200 hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>{isSimulatingNav ? 'Active Turn-by-Turn GPS Simulation' : 'Simulate Offline Route'}</span>
                </button>
              </div>
            </div>

            {/* Canvas */}
            <canvas
              ref={canvasRef}
              width={800}
              height={500}
              onClick={handleCanvasClick}
              className="w-full h-[480px] cursor-crosshair block"
              aria-label="Interactive offline vector map. Click any point of interest or station to inspect details."
            />

            {/* Bottom Tip */}
            <div className="absolute bottom-3 left-4 right-4 z-10 flex items-center justify-between text-[11px] text-slate-400 pointer-events-none">
              <span>Click any marker to inspect offline contact & route guidance</span>
              <span>Vector Tile Cache: IndexedDB Verified</span>
            </div>
          </div>

          {/* POI Card or Navigation Guidance Drawer */}
          {selectedPoi && (
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                  <h4 className="text-sm font-bold text-white">{selectedPoi.name}</h4>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-slate-800 text-slate-300">
                    {selectedPoi.type}
                  </span>
                </div>
                <p className="text-xs text-slate-400">{selectedPoi.description}</p>
              </div>

              <div className="flex items-center space-x-2 flex-shrink-0">
                <button
                  onClick={() => {
                    setNavRouteDest(selectedPoi.id);
                    setIsSimulatingNav(true);
                  }}
                  className="px-3 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center space-x-1.5"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Navigate Here</span>
                </button>
                <button
                  onClick={() => setSelectedPoi(null)}
                  className="px-3 py-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white text-xs"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
