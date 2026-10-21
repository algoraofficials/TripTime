import React, { useState } from 'react';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Calendar, 
  Star, 
  Plus, 
  Edit, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Building2, 
  Plane, 
  Train, 
  Ship, 
  ArrowUpRight,
  Sliders,
  Percent,
  BarChart3
} from 'lucide-react';
import { Listing, TransitMode, LanguageCode } from '../types/travel';
import { SupportedCurrency, convertCurrency, formatCurrency } from '../utils/currency';

interface VendorDashboardProps {
  listings: Listing[];
  currentCurrency: SupportedCurrency;
  currentLang: LanguageCode;
  onAddListing: (listing: Listing) => void;
  onToggleStatus?: (id: string) => void;
}

export const VendorDashboard: React.FC<VendorDashboardProps> = ({
  listings,
  currentCurrency,
  onAddListing,
}) => {
  const [activeFilter, setActiveFilter] = useState<TransitMode | 'all'>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // New listing state
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<TransitMode>('hotel');
  const [newDestination, setNewDestination] = useState('');
  const [newCountry, setNewCountry] = useState('');
  const [newPrice, setNewPrice] = useState(450);
  const [newTagline, setNewTagline] = useState('');
  const [newCapacity, setNewCapacity] = useState(2);
  const [newAmenities, setNewAmenities] = useState('High-Speed Wi-Fi, Panoramic View, Breakfast Included');

  // Vendor analytics metrics
  const totalRevenueUsd = 184500;
  const convertedRevenue = convertCurrency(totalRevenueUsd, 'USD', currentCurrency);
  const totalBookingsCount = 428;
  const averageOccupancy = 94.2;
  const cancellationRate = 2.1;

  const filteredListings = activeFilter === 'all' 
    ? listings 
    : listings.filter(l => l.type === activeFilter);

  const handleCreateListing = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDestination.trim()) return;

    const newListing: Listing = {
      id: `listing-${Date.now()}`,
      type: newType,
      title: newTitle.trim(),
      tagline: newTagline.trim() || 'Premier luxury accommodation with world-class amenities',
      destination: newDestination.trim(),
      country: newCountry.trim() || 'Global',
      priceUsd: newPrice,
      rating: 5.0,
      reviewCount: 1,
      imageUrl: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80',
      badge: 'New Listing',
      provider: {
        name: 'You (Verified Host / Agency)',
        verified: true,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      },
      details: {
        durationOrNights: newType === 'hotel' ? '1 night' : '1 journey',
        classOrRoomType: 'Executive Suite',
        capacity: newCapacity,
        amenities: newAmenities.split(',').map(s => s.trim()).filter(Boolean),
        carbonOffsetKg: 10,
        cancellationPolicy: 'Free cancellation 24h',
      },
    };

    onAddListing(newListing);
    setShowAddModal(false);
    setNewTitle('');
    setNewDestination('');
    setNewTagline('');
  };

  return (
    <div className="space-y-8 pb-16">
      
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-800 gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold mb-2">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Host & Transit Agency Operations Hub</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Comprehensive Vendor Analytics & Yield Management
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time performance, dynamic pricing yield, listing inventory, and traveler reviews.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/25 flex items-center justify-center space-x-2 transition-all self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Publish New Transit / Hotel Listing</span>
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Gross Revenue (30d)</span>
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-white">
            {formatCurrency(convertedRevenue, currentCurrency)}
          </div>
          <div className="flex items-center space-x-1 text-xs text-emerald-400">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+18.4% vs last month</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Occupancy / Load Factor</span>
            <span className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
              <Percent className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-white">
            {averageOccupancy}%
          </div>
          <div className="flex items-center space-x-1 text-xs text-cyan-400">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Optimal pricing yield</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Completed Journeys</span>
            <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Calendar className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-white">
            {totalBookingsCount}
          </div>
          <div className="flex items-center space-x-1 text-xs text-indigo-400">
            <Users className="w-3.5 h-3.5" />
            <span>98.6% positive ratings</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Cancellation Rate</span>
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-white">
            {cancellationRate}%
          </div>
          <div className="text-xs text-slate-500">
            Industry average 8.4%
          </div>
        </div>
      </div>

      {/* Inventory & Listing Management Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-6 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-white">Active Inventory & Fleet Management</h3>
            <p className="text-xs text-slate-400">Manage real-time prices, seat/room availability, and group split options.</p>
          </div>

          {/* Mode Tabs */}
          <div className="flex flex-wrap gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                activeFilter === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({listings.length})
            </button>
            <button
              onClick={() => setActiveFilter('hotel')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                activeFilter === 'hotel' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Hotels
            </button>
            <button
              onClick={() => setActiveFilter('flight')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                activeFilter === 'flight' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Flights
            </button>
            <button
              onClick={() => setActiveFilter('train')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                activeFilter === 'train' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Trains
            </button>
            <button
              onClick={() => setActiveFilter('ship')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                activeFilter === 'ship' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Yachts / Ships
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-6 py-3">Listing & Route</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">Capacity</th>
                <th className="px-6 py-3">Price ({currentCurrency})</th>
                <th className="px-6 py-3">Rating</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredListings.map((listing) => {
                const converted = convertCurrency(listing.priceUsd, 'USD', currentCurrency);
                return (
                  <tr key={listing.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <img
                          src={listing.imageUrl}
                          alt={listing.title}
                          className="w-12 h-10 rounded-lg object-cover border border-slate-700"
                        />
                        <div>
                          <span className="font-bold text-white block">{listing.title}</span>
                          <span className="text-[11px] text-slate-400">{listing.destination}, {listing.country}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300 capitalize border border-slate-700">
                        {listing.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span>{listing.details.capacity} guests</span>
                    </td>
                    <td className="px-6 py-4 font-bold text-white">
                      {formatCurrency(converted, currentCurrency)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-1 text-amber-400 font-semibold">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>{listing.rating}</span>
                        <span className="text-slate-500 font-normal">({listing.reviewCount})</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        <CheckCircle className="w-3 h-3" />
                        <span>Active & Instant Book</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium">
                        Edit Yield
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Listing Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-2xl text-slate-100 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Publish New Travel Service</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateListing} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Transit Service Type</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['hotel', 'flight', 'train', 'ship'] as TransitMode[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setNewType(type)}
                      className={`p-2 rounded-xl text-center capitalize font-semibold border ${
                        newType === type ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-950 text-slate-400 border-slate-800'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Listing Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kyoto Private Zen Onsen Villa"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Destination City</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kyoto"
                    value={newDestination}
                    onChange={(e) => setNewDestination(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Country</label>
                  <input
                    type="text"
                    placeholder="e.g. Japan"
                    value={newCountry}
                    onChange={(e) => setNewCountry(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Base Price in USD ($)</label>
                  <input
                    type="number"
                    min={10}
                    value={newPrice}
                    onChange={(e) => setNewPrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Capacity (Guests)</label>
                  <input
                    type="number"
                    min={1}
                    value={newCapacity}
                    onChange={(e) => setNewCapacity(parseInt(e.target.value, 10) || 1)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Tagline & Highlights</label>
                <input
                  type="text"
                  placeholder="e.g. Exclusive riverside onsen with private cypress wooden bath"
                  value={newTagline}
                  onChange={(e) => setNewTagline(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Amenities (Comma separated)</label>
                <input
                  type="text"
                  value={newAmenities}
                  onChange={(e) => setNewAmenities(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  Publish Listing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
