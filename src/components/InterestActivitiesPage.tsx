import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  ExternalLink,
  Clock,
  CheckCircle2,
  MapPin,
  Compass,
  Utensils,
  Landmark,
  Waves,
  Heart,
  SlidersHorizontal,
  MessageSquareQuote,
  Sparkles,
} from 'lucide-react';
import { Listing, LanguageCode } from '../types/travel';
import { SupportedCurrency, formatCurrency } from '../utils/currency';

export type InterestCategoryKey = 'outdoors' | 'food' | 'culture' | 'water';

export interface InterestAttractionItem {
  id: string;
  category: InterestCategoryKey;
  subCategory: string;
  title: string;
  location: string;
  country: string;
  rating: number;
  reviewCount: number;
  priceUsd: number;
  duration: string;
  cancellation: string;
  badge?: string;
  highlights: string[];
  reviewAuthor: string;
  reviewSnippet: string;
  imageUrl: string;
  gradientClass: string;
}

export interface InterestCategoryMeta {
  id: InterestCategoryKey;
  title: string;
  regionalTag: string;
  headline: string;
  subtitle: string;
  description: string;
  imageUrl: string;
  subCategories: string[];
}

export const INTEREST_CATEGORIES: Record<InterestCategoryKey, InterestCategoryMeta> = {
  outdoors: {
    id: 'outdoors',
    title: 'Outdoors',
    regionalTag: 'Srimangal Tea Estates & Sajek Cloud Peaks',
    headline: 'Outdoor Activities & Nature Expeditions',
    subtitle: 'Sajek cloud peaks, Srimangal tea valleys, rainforest treks, and canyon trails',
    description:
      'Explore iconic Bangladesh highland trails in Sajek Valley and Srimangal lush tea estates alongside world-renowned sandstone canyons, national park safaris, and alpine treks.',
    imageUrl:
      'https://images.unsplash.com/photo-1502784444187-359ac186c5bb?auto=format&fit=crop&w=1200&q=85',
    subCategories: ['All Outdoors', 'Nature & Wildlife', 'Hiking & Trekking', 'Canyon & Geology'],
  },
  food: {
    id: 'food',
    title: 'Food',
    regionalTag: 'Old Dhaka Kacchi Biryani & Sylheti Cuisine',
    headline: 'Food & Culinary Experiences',
    subtitle: 'Old Dhaka royal biryani walks, traditional bhorta platters, and artisan cooking classes',
    description:
      'Savor authentic culinary traditions—from Old Dhaka wood-fired Kacchi Biryani dastarkhwans and Sylheti shatkora feasts to hands-on artisan culinary workshops around the world.',
    imageUrl:
      'https://images.unsplash.com/photo-1580822184713-fc5400e7fe10?auto=format&fit=crop&w=1200&q=85',
    subCategories: ['All Food', 'Street Food Walks', 'Cooking Classes', 'Artisan Tastings'],
  },
  culture: {
    id: 'culture',
    title: 'Culture',
    regionalTag: 'Ahsan Manzil, Lalbagh & UNESCO Heritage',
    headline: 'Culture, Art & Heritage Attractions',
    subtitle: 'Mughal riverfront palaces, ancient terracotta monasteries, and living heritage tours',
    description:
      'Immerse yourself in Bangladesh’s timeless architectural wonders—from Ahsan Manzil Pink Palace, Lalbagh Fort, and Paharpur Somapura Mahavihara to illuminated global heritage landmarks.',
    imageUrl:
      'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1200&q=85',
    subCategories: ['All Culture', 'Heritage Sites', 'Art & Exhibitions', 'Night & Light Tours'],
  },
  water: {
    id: 'water',
    title: 'Water',
    regionalTag: "Saint Martin's Coral Lagoon & Sundarbans",
    headline: 'Water Activities & Marine Adventures',
    subtitle: 'Saint Martin coral snorkeling, Ratargul swamp boats, and turquoise lagoon cruises',
    description:
      'Set sail across crystal-clear coral waters at Saint Martin’s Island, glide silently through Ratargul freshwater swamp forest and Kaptai Lake, or dive tropical coastal reefs.',
    imageUrl:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=85',
    subCategories: ['All Water', 'Snorkeling & Reefs', 'Catamaran & Cruises', 'Kayaking & Diving'],
  },
};

export const INTEREST_ATTRACTIONS: InterestAttractionItem[] = [
  // OUTDOORS
  {
    id: 'attr-out-3',
    category: 'outdoors',
    subCategory: 'Nature & Wildlife',
    title: 'Sundarbans UNESCO Mangrove Reserve & Kotka Wildlife Sanctuary Safari',
    location: 'Khulna & Karamjal',
    country: 'Bangladesh',
    rating: 4.9,
    reviewCount: 1290,
    priceUsd: 95,
    duration: 'Full Day (9 hours)',
    cancellation: 'Free cancellation up to 24 hours before start',
    badge: 'Bangladesh Signature Eco-Tour',
    highlights: ['Silent Wooden Boat Creek Cruise', 'Spotted Deer & Birding Canopy Walk', 'Traditional Launch Lunch'],
    reviewAuthor: 'Tanvir H. · Dhaka',
    reviewSnippet:
      'Cruising into the narrow mangrove creeks at dawn while kingfishers darted past our wooden boat was unforgettable.',
    imageUrl:
      'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1000&q=80',
    gradientClass: 'from-emerald-800 via-teal-900 to-slate-950',
  },
  {
    id: 'attr-out-4',
    category: 'outdoors',
    subCategory: 'Hiking & Trekking',
    title: 'Srimangal Lawachara Rainforest & Seven-Layer Tea Estate Guided Hike',
    location: 'Srimangal, Sylhet',
    country: 'Bangladesh',
    rating: 4.8,
    reviewCount: 940,
    priceUsd: 42,
    duration: '5 hours',
    cancellation: 'Free cancellation up to 24 hours before start',
    badge: 'Local Favorite',
    highlights: ['Hoolock Gibbon Canopy Trail', 'Manipur Craft Village Visit', 'Nilkantha 7-Layer Tea Tasting'],
    reviewAuthor: 'Hannah W. · London',
    reviewSnippet:
      'Lush emerald tea hills as far as the eye can see. Our naturalist guide spotted gibbons high in the Lawachara fig trees within 20 minutes.',
    imageUrl:
      'https://images.unsplash.com/photo-1502784444187-359ac186c5bb?auto=format&fit=crop&w=1000&q=80',
    gradientClass: 'from-lime-800 via-emerald-900 to-slate-950',
  },
  {
    id: 'attr-out-1',
    category: 'outdoors',
    subCategory: 'Canyon & Geology',
    title: 'Upper Antelope Slot Canyon & Horseshoe Bend Guided Photography Trek',
    location: 'Page, Arizona',
    country: 'United States',
    rating: 4.9,
    reviewCount: 4820,
    priceUsd: 118,
    duration: '4 hours',
    cancellation: 'Free cancellation up to 24 hours before start',
    badge: 'Best of the Best',
    highlights: ['Navajo Nation Authorized Guide', 'Midday Sunbeam Slot Access', 'Small Group (Max 10)'],
    reviewAuthor: 'Elena R. · Madrid',
    reviewSnippet:
      'The glowing orange sandstone waves inside the canyon looked unreal. Our guide showed us the exact camera angles for the light beams.',
    imageUrl:
      'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1000&q=80',
    gradientClass: 'from-amber-700 via-orange-600 to-stone-900',
  },
  {
    id: 'attr-out-2',
    category: 'outdoors',
    subCategory: 'Nature & Wildlife',
    title: 'Arenal Volcano Hanging Bridges, La Fortuna Waterfall & Sloth Sanctuary',
    location: 'La Fortuna, Alajuela',
    country: 'Costa Rica',
    rating: 4.9,
    reviewCount: 3610,
    priceUsd: 89,
    duration: '6 hours',
    cancellation: 'Free cancellation up to 24 hours before start',
    badge: 'Top Rated Eco-Safari',
    highlights: ['Canopy Suspension Bridges', 'Natural Volcanic Hot Springs', 'Authentic Casado Lunch'],
    reviewAuthor: 'Marcus T. · Toronto',
    reviewSnippet:
      'We spotted three-toed sloths, toucans, and poison dart frogs along the rainforest canopy walk before cooling off at the waterfall base.',
    imageUrl:
      'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1000&q=80',
    gradientClass: 'from-emerald-700 via-green-800 to-slate-950',
  },
  {
    id: 'attr-out-5',
    category: 'outdoors',
    subCategory: 'Hiking & Trekking',
    title: 'Dolomites Seceda Ridgeline & Alpe di Siusi Panoramic Alpine Walk',
    location: 'Ortisei, South Tyrol',
    country: 'Italy',
    rating: 4.9,
    reviewCount: 2150,
    priceUsd: 134,
    duration: '7 hours',
    cancellation: 'Free cancellation up to 24 hours before start',
    highlights: ['Cable Car Passes Included', 'Alpine Mountain Hut Tasting', 'Certified UIMLA Mountain Guide'],
    reviewAuthor: 'Lukas K. · Munich',
    reviewSnippet:
      'Standing on the dramatic jagged peaks of Seceda with 360-degree views of the Dolomites was the highlight of our summer trip.',
    imageUrl:
      'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1000&q=80',
    gradientClass: 'from-sky-700 via-slate-800 to-slate-950',
  },
  {
    id: 'attr-out-6',
    category: 'outdoors',
    subCategory: 'Canyon & Geology',
    title: 'Cappadocia Red & Rose Valley Sunrise Trail with Goreme Fairy Chimneys',
    location: 'Goreme, Nevsehir',
    country: 'Turkiye',
    rating: 4.8,
    reviewCount: 1875,
    priceUsd: 68,
    duration: '5 hours',
    cancellation: 'Free cancellation up to 24 hours before start',
    highlights: ['Sunrise Balloon Viewpoint', 'Rock-Cut Cave Churches', 'Pigeon Valley Descent'],
    reviewAuthor: 'Chloe D. · Paris',
    reviewSnippet:
      'Hiking through Rose Valley just as hundreds of hot air balloons rose over the volcanic formations felt like walking on another planet.',
    imageUrl:
      'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=1000&q=80',
    gradientClass: 'from-orange-700 via-rose-800 to-slate-950',
  },

  // FOOD
  {
    id: 'attr-food-3',
    category: 'food',
    subCategory: 'Street Food Walks',
    title: 'Old Dhaka Royal Mughlai Food Walk: Haji Kacchi Biryani, Bakarkhani & Faluda',
    location: 'Old Dhaka (Puran Dhaka)',
    country: 'Bangladesh',
    rating: 4.9,
    reviewCount: 1640,
    priceUsd: 38,
    duration: '4 hours',
    cancellation: 'Free cancellation up to 24 hours before start',
    badge: 'Bangladesh Culinary Heritage',
    highlights: ['8 Heritage Food Stops', 'Authentic Wood-Fired Kacchi Tasting', 'Rickshaw Heritage Lane Ride'],
    reviewAuthor: 'Nadia S. · Kuala Lumpur',
    reviewSnippet:
      'From smoky seekh kebabs near Chawkbazar to hot crispy bakarkhani and saffron faluda, every single bite carried centuries of Mughal history.',
    imageUrl:
      'https://images.unsplash.com/photo-1580822184713-fc5400e7fe10?auto=format&fit=crop&w=1000&q=80',
    gradientClass: 'from-orange-700 via-amber-800 to-slate-950',
  },
  {
    id: 'attr-food-6',
    category: 'food',
    subCategory: 'Artisan Tastings',
    title: 'Sylhet Shatkora Beef, 22-Bhorta Clay Platter & Tea Sommelier Experience',
    location: 'Zindabazar, Sylhet',
    country: 'Bangladesh',
    rating: 4.9,
    reviewCount: 880,
    priceUsd: 32,
    duration: '3 hours',
    cancellation: 'Free cancellation up to 24 hours before start',
    badge: 'Sylheti Gastronomy',
    highlights: ['22 Traditional Mash Bhortas', 'Citrus Shatkora Slow-Cooked Beef', 'Single-Estate White Tea Pairing'],
    reviewAuthor: 'Farhan A. · Chattogram',
    reviewSnippet:
      'The aromatic shatkora citrus notes combined with 22 smoky roasted bhortas makes this an essential culinary stop in Sylhet.',
    imageUrl:
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1000&q=80',
    gradientClass: 'from-amber-800 via-emerald-950 to-slate-950',
  },
  {
    id: 'attr-food-1',
    category: 'food',
    subCategory: 'Cooking Classes',
    title: 'Authentic Handmade Ravioli, Fettuccine & Tiramisu Masterclass with Nonna',
    location: 'Trastevere, Rome',
    country: 'Italy',
    rating: 5.0,
    reviewCount: 5490,
    priceUsd: 79,
    duration: '3.5 hours',
    cancellation: 'Free cancellation up to 24 hours before start',
    badge: 'Best of the Best',
    highlights: ['Fresh Egg Dough from Scratch', 'Organic Frascati Wine Pairing', 'Take-Home Recipe Booklet'],
    reviewAuthor: 'David & Sarah · Melbourne',
    reviewSnippet:
      'Crimping fresh ricotta ravioli by hand on a wooden board in a 17th-century Trastevere kitchen was the most delicious afternoon of our trip.',
    imageUrl:
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1000&q=80',
    gradientClass: 'from-amber-700 via-red-800 to-stone-950',
  },
  {
    id: 'attr-food-2',
    category: 'food',
    subCategory: 'Cooking Classes',
    title: 'Traditional Argentine Empanada Folding, Chimichurri & Asado Workshop',
    location: 'Palermo Soho, Buenos Aires',
    country: 'Argentina',
    rating: 4.9,
    reviewCount: 2340,
    priceUsd: 65,
    duration: '3 hours',
    cancellation: 'Free cancellation up to 24 hours before start',
    badge: 'Chef-Led Workshop',
    highlights: ['3 Regional Repulgue Folds', 'Malbec Reserve Tasting', 'Dulce de Leche Alfajores'],
    reviewAuthor: 'Sofia M. · Sao Paulo',
    reviewSnippet:
      'Learning the braided repulgue fold for juicy beef empanadas right before baking them in a clay oven was so much fun.',
    imageUrl:
      'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=1000&q=80',
    gradientClass: 'from-rose-700 via-orange-800 to-stone-950',
  },
  {
    id: 'attr-food-4',
    category: 'food',
    subCategory: 'Artisan Tastings',
    title: 'Kyoto Nishiki Market & Gion Backstreet Izakaya Kaiseki Tasting Tour',
    location: 'Nakagyo Ward, Kyoto',
    country: 'Japan',
    rating: 4.9,
    reviewCount: 3120,
    priceUsd: 105,
    duration: '3.5 hours',
    cancellation: 'Free cancellation up to 24 hours before start',
    highlights: ['10 Seasonal Artisan Dishes', 'Uji Ceremonial Matcha Pairing', 'Small Group (Max 8)'],
    reviewAuthor: 'Liam O. · Dublin',
    reviewSnippet:
      'Our local culinary host introduced us to family-run stalls in Nishiki Market that have been perfecting yuba and dashi for 9 generations.',
    imageUrl:
      'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1000&q=80',
    gradientClass: 'from-red-800 via-stone-800 to-slate-950',
  },
  {
    id: 'attr-food-5',
    category: 'food',
    subCategory: 'Street Food Walks',
    title: 'Oaxaca Mezcal Palenque, Mole Negro & Tlayuda Night Market Crawl',
    location: 'Centro Historico, Oaxaca',
    country: 'Mexico',
    rating: 4.9,
    reviewCount: 1980,
    priceUsd: 72,
    duration: '4 hours',
    cancellation: 'Free cancellation up to 24 hours before start',
    highlights: ['28-Ingredient Mole Tasting', 'Ancestral Clay-Pot Mezcal', '20 de Noviembre Smoke Alley'],
    reviewAuthor: 'Rachel G. · Chicago',
    reviewSnippet:
      'Tasting smoky tasajo grilled to order in the market hall and learning how chocolate is stone-ground with chilies was unforgettable.',
    imageUrl:
      'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1000&q=80',
    gradientClass: 'from-amber-800 via-stone-900 to-slate-950',
  },

  // CULTURE
  {
    id: 'attr-cul-2',
    category: 'culture',
    subCategory: 'Heritage Sites',
    title: 'Sonargaon Panam City, Ahsan Manzil Pink Palace & Lalbagh Mughal Fort Tour',
    location: 'Dhaka & Sonargaon',
    country: 'Bangladesh',
    rating: 4.9,
    reviewCount: 1450,
    priceUsd: 52,
    duration: '7 hours',
    cancellation: 'Free cancellation up to 24 hours before start',
    badge: 'Bangladesh Heritage Icon',
    highlights: ['Jamdani Muslin Weaving Studio', 'Buriganga River Heritage Boat', 'Historian Guide Included'],
    reviewAuthor: 'Dr.Tariq M. · London',
    reviewSnippet:
      'Walking down the colonnaded merchant street of Panam Nagar and watching master weavers craft UNESCO Jamdani by hand was extraordinary.',
    imageUrl:
      'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1000&q=80',
    gradientClass: 'from-rose-800 via-amber-900 to-slate-950',
  },
  {
    id: 'attr-cul-3',
    category: 'culture',
    subCategory: 'Heritage Sites',
    title: 'Paharpur Somapura Mahavihara UNESCO Buddhist Monastery & Puthia Temple Trail',
    location: 'Naogaon & Rajshahi',
    country: 'Bangladesh',
    rating: 4.9,
    reviewCount: 830,
    priceUsd: 68,
    duration: 'Full Day (8 hours)',
    cancellation: 'Free cancellation up to 24 hours before start',
    badge: 'UNESCO World Heritage',
    highlights: ['8th-Century Terracotta Plaques', 'Puthia Rajbari Terracotta Temples', 'Rajshahi Silk Loom Visit'],
    reviewAuthor: 'Kenji T. · Osaka',
    reviewSnippet:
      'The scale of the 8th-century Somapura Mahavihara stupa and the intricate terracotta carvings at Puthia Shiva Temple rival anything in Asia.',
    imageUrl:
      'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1000&q=80',
    gradientClass: 'from-amber-800 via-orange-950 to-slate-950',
  },
  {
    id: 'attr-cul-1',
    category: 'culture',
    subCategory: 'Night & Light Tours',
    title: 'Gardens by the Bay Cloud Forest, Flower Dome & Supertree Observatory',
    location: 'Marina Bay',
    country: 'Singapore',
    rating: 4.9,
    reviewCount: 8940,
    priceUsd: 46,
    duration: '4 hours',
    cancellation: 'Free cancellation up to 24 hours before start',
    badge: 'Best of the Best',
    highlights: ['35m Indoor Cloud Waterfall', 'OCBC Skyway Canopy Walk', 'Garden Rhapsody Light Show'],
    reviewAuthor: 'Mei Lin C. · Taipei',
    reviewSnippet:
      'Walking along the illuminated walkway suspended between the glowing purple Supertrees during the evening symphony was pure magic.',
    imageUrl:
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1000&q=80',
    gradientClass: 'from-fuchsia-700 via-purple-800 to-slate-950',
  },
  {
    id: 'attr-cul-4',
    category: 'culture',
    subCategory: 'Art & Exhibitions',
    title: 'teamLab Planets Digital Art Museum & Toyosu Waterfront Immersive Tour',
    location: 'Toyosu, Tokyo',
    country: 'Japan',
    rating: 4.9,
    reviewCount: 6420,
    priceUsd: 54,
    duration: '3 hours',
    cancellation: 'Free cancellation up to 24 hours before start',
    highlights: ['Infinite Crystal Universe', 'Floating Orchid Sanctuary', 'Timed Skip-the-Line Entry'],
    reviewAuthor: 'Alex & Priya · San Francisco',
    reviewSnippet:
      'Wading barefoot through glowing koi projections that burst into digital flowers on contact felt like stepping inside a living painting.',
    imageUrl:
      'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1000&q=80',
    gradientClass: 'from-indigo-700 via-violet-900 to-slate-950',
  },
  {
    id: 'attr-cul-5',
    category: 'culture',
    subCategory: 'Heritage Sites',
    title: 'Alhambra Nasrid Palaces, Generalife Gardens & Albaicin Sunset Walk',
    location: 'Granada, Andalusia',
    country: 'Spain',
    rating: 4.9,
    reviewCount: 4190,
    priceUsd: 84,
    duration: '4.5 hours',
    cancellation: 'Free cancellation up to 24 hours before start',
    highlights: ['Guaranteed Nasrid Palaces Slot', 'Court of the Lions Access', 'Official Art Historian Guide'],
    reviewAuthor: 'beatriz_v · Lisbon',
    reviewSnippet:
      'The geometric stucco carvings and reflecting pools of the Nasrid Palaces come alive when explained by a specialist in Moorish architecture.',
    imageUrl:
      'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=1000&q=80',
    gradientClass: 'from-amber-700 via-rose-900 to-slate-950',
  },
  {
    id: 'attr-cul-6',
    category: 'culture',
    subCategory: 'Night & Light Tours',
    title: 'Petra by Night Candlelight Treasury Walk & Bedouin Starlight Tea',
    location: 'Wadi Musa, Maan',
    country: 'Jordan',
    rating: 4.8,
    reviewCount: 2760,
    priceUsd: 59,
    duration: '3 hours',
    cancellation: 'Free cancellation up to 24 hours before start',
    highlights: ['1,500 Candlelit Siq Canyon', 'Al-Khazneh Treasury Flute Music', 'Bedouin Mint Tea Under Stars'],
    reviewAuthor: 'Jonas V. · Amsterdam',
    reviewSnippet:
      'Emerging from the narrow canyon walls to see the rose-red Treasury illuminated by 1,500 flickering candles left the entire group speechless.',
    imageUrl:
      'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=1000&q=80',
    gradientClass: 'from-orange-800 via-purple-950 to-slate-950',
  },

  // WATER
  {
    id: 'attr-wat-2',
    category: 'water',
    subCategory: 'Snorkeling & Reefs',
    title: "Saint Martin's Coral Island & Chera Dwip Turquoise Lagoon Snorkeling Cruise",
    location: "Saint Martin's Island, Cox's Bazar",
    country: 'Bangladesh',
    rating: 4.9,
    reviewCount: 1520,
    priceUsd: 58,
    duration: 'Full Day (7 hours)',
    cancellation: 'Free cancellation up to 24 hours before start',
    badge: 'Bangladesh Coral Paradise',
    highlights: ['Chera Dwip Coral Tidepools', 'Wooden Sampan Island Transfer', 'Fresh Grilled Coral Fish Lunch'],
    reviewAuthor: 'Sadia K. · Dhaka',
    reviewSnippet:
      'The water around Chera Dwip is crystal clear turquoise. Snorkeling over the living coral boulders and dining on fresh grilled rupchanda was heavenly.',
    imageUrl:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80',
    gradientClass: 'from-teal-600 via-cyan-800 to-slate-950',
  },
  {
    id: 'attr-wat-3',
    category: 'water',
    subCategory: 'Kayaking & Diving',
    title: 'Ratargul Freshwater Swamp Forest Canopy Boat & Kaptai Lake Emerald Kayak',
    location: 'Sylhet & Rangamati',
    country: 'Bangladesh',
    rating: 4.8,
    reviewCount: 1120,
    priceUsd: 44,
    duration: '5 hours',
    cancellation: 'Free cancellation up to 24 hours before start',
    badge: 'Eco-Waterway Trail',
    highlights: ['Submerged Koroch Forest Canals', 'Shuvolong Waterfall Gorge', 'Private Country Boat & Paddles'],
    reviewAuthor: 'Oliver P. · Zurich',
    reviewSnippet:
      'Gliding silently beneath the submerged tree canopy of Ratargul felt like exploring the Amazon of South Asia.',
    imageUrl:
      'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1000&q=80',
    gradientClass: 'from-emerald-700 via-cyan-900 to-slate-950',
  },
  {
    id: 'attr-wat-1',
    category: 'water',
    subCategory: 'Snorkeling & Reefs',
    title: 'Bora Bora Coral Gardens, Lagoon Ray Encounter & Outrigger Snorkeling Safari',
    location: 'Vaitape, Bora Bora',
    country: 'French Polynesia',
    rating: 5.0,
    reviewCount: 4120,
    priceUsd: 128,
    duration: '5 hours',
    cancellation: 'Free cancellation up to 24 hours before start',
    badge: 'Best of the Best',
    highlights: ['Crystal Turquoise Coral Lagoon', 'Pro Snorkeling Gear & GoPro Photos', 'Motu Island Coconut Feast'],
    reviewAuthor: 'Camille B. · Lyon',
    reviewSnippet:
      'Floating in crystal-clear turquoise water surrounded by colourful reef fish and gentle rays with Mount Otemanu in the background was a dream.',
    imageUrl:
      'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=1000&q=80',
    gradientClass: 'from-cyan-600 via-sky-700 to-blue-950',
  },
  {
    id: 'attr-wat-4',
    category: 'water',
    subCategory: 'Catamaran & Cruises',
    title: 'Santorini Caldera Red Beach, Hot Springs & Oia Sunset Catamaran Cruise',
    location: 'Ammoudi Bay, Santorini',
    country: 'Greece',
    rating: 4.9,
    reviewCount: 5380,
    priceUsd: 145,
    duration: '5 hours',
    cancellation: 'Free cancellation up to 24 hours before start',
    highlights: ['3 Aegean Swim & Snorkel Stops', 'Onboard Greek BBQ & Assyrtiko Wine', 'Caldera Sunset Deck'],
    reviewAuthor: 'Noah & Maya · New York',
    reviewSnippet:
      'Diving off the catamaran into the deep cobalt Aegean waters near White Beach and watching the Oia sunset from the bow was unbeatable.',
    imageUrl:
      'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1000&q=80',
    gradientClass: 'from-blue-600 via-indigo-800 to-slate-950',
  },
  {
    id: 'attr-wat-5',
    category: 'water',
    subCategory: 'Snorkeling & Reefs',
    title: 'Great Barrier Reef Outer Agincourt Ribbon Reefs Pontoon & Scuba Day',
    location: 'Port Douglas, Queensland',
    country: 'Australia',
    rating: 4.9,
    reviewCount: 3290,
    priceUsd: 168,
    duration: '8 hours',
    cancellation: 'Free cancellation up to 24 hours before start',
    highlights: ['3 Outer Coral Reef Sites', 'Marine Biologist Guided Snorkel', 'Semi-Submersible Coral Observatory'],
    reviewAuthor: 'Kieran M. · Auckland',
    reviewSnippet:
      'Giant clams, green sea turtles, and neon parrotfish everywhere. Having a marine biologist guide us over the outer reef drop-off made all the difference.',
    imageUrl:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80',
    gradientClass: 'from-cyan-700 via-teal-900 to-slate-950',
  },
  {
    id: 'attr-wat-6',
    category: 'water',
    subCategory: 'Kayaking & Diving',
    title: 'Milford Sound Fiordland Sea Kayaking & Bowen Falls Glacier Spray Tour',
    location: 'Milford Sound, South Island',
    country: 'New Zealand',
    rating: 4.9,
    reviewCount: 1740,
    priceUsd: 119,
    duration: '4.5 hours',
    cancellation: 'Free cancellation up to 24 hours before start',
    highlights: ['Mitre Peak Fjord Paddling', 'New Zealand Fur Seal Sightings', 'Underwater Observatory Entry'],
    reviewAuthor: 'Freja L. · Stockholm',
    reviewSnippet:
      'Paddling at water level beneath sheer 1,200-meter granite cliffs with waterfalls thundering all around us was awe-inspiring.',
    imageUrl:
      'https://images.unsplash.com/photo-1502784444187-359ac186c5bb?auto=format&fit=crop&w=1000&q=80',
    gradientClass: 'from-sky-800 via-slate-800 to-slate-950',
  },
];

interface FindThingsToDoSectionProps {
  onSelectCategory: (category: InterestCategoryKey) => void;
}

/**
 * Renders the "Find things to do by interest" 4-card showcase section
 * directly before "Featured Bangladesh Hotels, Rail, Flights & Experiences".
 * Uses a dark/black homepage-matched background and Iconic Bangladesh photography
 * for Outdoors, Food, Culture, and Water, without any Tripadvisor buttons.
 */
export const FindThingsToDoByInterestSection: React.FC<FindThingsToDoSectionProps> = ({
  onSelectCategory,
}) => {
  const categoryOrder: InterestCategoryKey[] = ['outdoors', 'food', 'culture', 'water'];

  return (
    <section
      aria-labelledby="interest-section-heading"
      className="p-6 sm:p-8 rounded-3xl bg-black/90 text-white border border-slate-800/80 shadow-2xl space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1">
          <h2
            id="interest-section-heading"
            className="text-2xl sm:text-[28px] font-extrabold tracking-tight text-white leading-tight"
          >
            Find things to do by interest
          </h2>
          <p className="text-sm sm:text-base text-slate-400 font-normal">
            Whatever you&apos;re into, we&apos;ve got it
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>Click any card to open its dedicated page or launch in a new window</span>
        </div>
      </div>

      {/* 4-Card Grid with Iconic Bangladesh Photography */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {categoryOrder.map((key) => {
          const item = INTEREST_CATEGORIES[key];
          const standalonePageHref = `?interest=${item.id}`;

          return (
            <div
              key={item.id}
              className="group relative aspect-[405/412] w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 hover:border-emerald-500/50 transition-all duration-200 hover:-translate-y-0.5"
            >
              {/* Iconic Bangladesh Category Photograph */}
              <img
                src={item.imageUrl}
                alt={`${item.title} — ${item.regionalTag}`}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover pointer-events-none select-none transition-transform duration-500 group-hover:scale-105"
              />

              {/* Bottom gradient scrim for crisp bottom-left title contrast */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent pointer-events-none" />

              {/* Primary Card Click Area: Opens Dedicated Separate Page (and supports middle-click / Ctrl-click new tab) */}
              <a
                href={standalonePageHref}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  if (!e.metaKey && !e.ctrlKey && !e.shiftKey && e.button === 0) {
                    e.preventDefault();
                    onSelectCategory(item.id);
                  }
                }}
                className="absolute inset-0 z-10 flex flex-col justify-end p-5 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                aria-label={`Explore ${item.title} attractions page`}
              >
                <span className="text-xs font-medium text-emerald-300/95 tracking-wide mb-1 drop-shadow">
                  {item.regionalTag}
                </span>
                <span className="text-2xl sm:text-[26px] font-extrabold text-white tracking-tight drop-shadow-md leading-none">
                  {item.title}
                </span>
              </a>

              {/* Top-Right New-Window Action Link (Standalone Page in New Tab only — Tripadvisor button removed) */}
              <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 opacity-95 group-hover:opacity-100 transition-opacity">
                <a
                  href={standalonePageHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={`Open ${item.title} dedicated page in a new window`}
                  className="px-2.5 py-1 rounded-lg bg-slate-950/85 hover:bg-slate-900 text-white text-[11px] font-semibold backdrop-blur-md border border-white/15 inline-flex items-center gap-1 transition-colors whitespace-nowrap shrink-0"
                >
                  <span>New Window</span>
                  <ExternalLink className="w-3 h-3 text-emerald-400" />
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

interface InterestActivitiesPageProps {
  activeCategory: InterestCategoryKey;
  onSelectCategory: (category: InterestCategoryKey) => void;
  onBackToMarketplace: () => void;
  currentCurrency: SupportedCurrency;
  currentLang: LanguageCode;
  onBookAttraction: (listing: Listing) => void;
}

/**
 * Full dedicated page for Outdoors, Food, Culture, and Water attractions
 * featuring Iconic Bangladesh & global attraction cards, ratings, reviews, and instant booking.
 */
export const InterestActivitiesPage: React.FC<InterestActivitiesPageProps> = ({
  activeCategory,
  onSelectCategory,
  onBackToMarketplace,
  currentCurrency,
  onBookAttraction,
}) => {
  const categoryMeta = INTEREST_CATEGORIES[activeCategory];
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>(
    categoryMeta.subCategories[0]
  );
  const [sortBy, setSortBy] = useState<'featured' | 'rating' | 'reviews' | 'price_low'>('featured');
  const [savedIds, setSavedIds] = useState<string[]>([]);

  // Reset subcategory when switching main interest tab
  const handleCategorySwitch = (cat: InterestCategoryKey) => {
    onSelectCategory(cat);
    setSelectedSubCategory(INTEREST_CATEGORIES[cat].subCategories[0]);
  };

  const filteredAttractions = useMemo(() => {
    const base = INTEREST_ATTRACTIONS.filter((item) => {
      if (item.category !== activeCategory) return false;
      if (
        selectedSubCategory !== categoryMeta.subCategories[0] &&
        item.subCategory !== selectedSubCategory
      ) {
        return false;
      }
      return true;
    });

    if (sortBy === 'rating') {
      return [...base].sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount);
    }
    if (sortBy === 'reviews') {
      return [...base].sort((a, b) => b.reviewCount - a.reviewCount);
    }
    if (sortBy === 'price_low') {
      return [...base].sort((a, b) => a.priceUsd - b.priceUsd);
    }
    return base;
  }, [activeCategory, selectedSubCategory, categoryMeta.subCategories, sortBy]);

  const handleToggleFavorite = (id: string) => {
    setSavedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const handleBookItem = (attr: InterestAttractionItem) => {
    const asListing: Listing = {
      id: attr.id,
      type: 'experience',
      title: attr.title,
      tagline: `${attr.subCategory} · ${attr.location}`,
      destination: attr.location,
      country: attr.country,
      priceUsd: attr.priceUsd,
      rating: attr.rating,
      reviewCount: attr.reviewCount,
      imageUrl: attr.imageUrl,
      badge: attr.badge || attr.subCategory,
      localPaymentMethods: ['bKash', 'Nagad', 'Visa/Mastercard'],
      provider: {
        name: 'AetherVoyage Verified Experience Operator',
        verified: true,
        avatar: 'AV',
      },
      details: {
        durationOrNights: attr.duration,
        classOrRoomType: attr.subCategory,
        departureTime: '09:00 AM Daily',
        capacity: 12,
        amenities: attr.highlights,
        cancellationPolicy: 'Free cancellation 24h',
      },
    };
    onBookAttraction(asListing);
  };

  const getCategoryIcon = (cat: InterestCategoryKey) => {
    switch (cat) {
      case 'outdoors':
        return <Compass className="w-4 h-4 text-amber-400" />;
      case 'food':
        return <Utensils className="w-4 h-4 text-orange-400" />;
      case 'culture':
        return <Landmark className="w-4 h-4 text-fuchsia-400" />;
      case 'water':
        return <Waves className="w-4 h-4 text-cyan-400" />;
    }
  };

  return (
    <div className="space-y-8 pb-14">
      {/* Top Navigation & Category Switcher Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToMarketplace}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-200 inline-flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap shrink-0"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-400" />
            <span>Back to All Bookings</span>
          </button>

          <div className="text-xs text-slate-400 hidden md:flex items-center gap-2">
            <span>Attractions by Interest</span>
            <span aria-hidden="true">/</span>
            <span className="text-white font-semibold">{categoryMeta.title}</span>
          </div>
        </div>

        {/* Category Switcher Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800 overflow-x-auto">
          {(['outdoors', 'food', 'culture', 'water'] as InterestCategoryKey[]).map((catKey) => {
            const meta = INTEREST_CATEGORIES[catKey];
            const isActive = activeCategory === catKey;
            return (
              <button
                key={catKey}
                type="button"
                onClick={() => handleCategorySwitch(catKey)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {getCategoryIcon(catKey)}
                <span>{meta.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Category Hero Split Banner with Iconic Bangladesh Artwork */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch p-6 sm:p-8 rounded-3xl bg-slate-950 border border-slate-800">
        <div className="lg:col-span-8 flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-xs text-emerald-400 font-medium">
              <span>{categoryMeta.regionalTag}</span>
              <span aria-hidden="true">·</span>
              <span>Verified Traveler Reviews</span>
              <span aria-hidden="true">·</span>
              <span>Instant Digital Wallet Booking</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              {categoryMeta.headline}
            </h1>

            <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
              {categoryMeta.description}
            </p>
          </div>

          {/* Standalone Window Action (Tripadvisor buttons removed) */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <a
              href={`?interest=${categoryMeta.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 text-xs font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <span>Open This Page in New Window</span>
              <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
            </a>
          </div>
        </div>

        {/* Right Hero Artwork Preview Card */}
        <div className="lg:col-span-4">
          <div className="relative aspect-[405/412] max-h-64 lg:max-h-none w-full h-full rounded-2xl overflow-hidden border border-slate-800 bg-slate-900">
            <img
              src={categoryMeta.imageUrl}
              alt={categoryMeta.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover pointer-events-none select-none"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between">
              <div>
                <span className="text-xs text-emerald-300 font-medium block">
                  {categoryMeta.regionalTag}
                </span>
                <span className="text-2xl font-extrabold text-white tracking-tight">
                  {categoryMeta.title}
                </span>
              </div>
              <span className="text-xs font-mono tabular-nums text-slate-200">
                {filteredAttractions.length} Experiences
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Sort Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Subcategory Segmented Buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800 overflow-x-auto">
          {categoryMeta.subCategories.map((sub) => (
            <button
              key={sub}
              type="button"
              onClick={() => setSelectedSubCategory(sub)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                selectedSubCategory === sub
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {sub}
            </button>
          ))}
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-400">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) =>
              setSortBy(e.target.value as 'featured' | 'rating' | 'reviews' | 'price_low')
            }
            aria-label="Sort attractions"
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white font-medium focus:outline-none cursor-pointer"
          >
            <option value="featured">Traveler Favorites (Featured)</option>
            <option value="rating">Highest Rated (5.0 to 4.0)</option>
            <option value="reviews">Most Reviewed</option>
            <option value="price_low">Price: Low to High</option>
          </select>
        </div>
      </div>

      {/* 3-Column Attraction Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAttractions.map((attr, idx) => {
          const isSaved = savedIds.includes(attr.id);

          return (
            <article
              key={attr.id}
              className="rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 overflow-hidden flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5"
            >
              <div>
                {/* Visual Header Banner with Attraction Photography & Rank */}
                <div
                  className={`relative h-44 w-full overflow-hidden bg-gradient-to-br ${attr.gradientClass}`}
                >
                  <img
                    src={attr.imageUrl}
                    alt={attr.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover opacity-80 pointer-events-none select-none"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/35 to-transparent" />

                  {/* Top Row: Editorial Numbering + Save Heart */}
                  <div className="absolute top-3 left-4 right-4 flex items-center justify-between">
                    <span className="text-xs font-mono tabular-nums font-bold text-white/95 drop-shadow">
                      0{idx + 1} · {attr.subCategory}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleToggleFavorite(attr.id)}
                      aria-label={`Save ${attr.title}`}
                      className="p-2 rounded-full bg-slate-950/75 hover:bg-slate-950 text-white border border-white/15 cursor-pointer transition-colors"
                    >
                      <Heart
                        className={`w-4 h-4 ${
                          isSaved ? 'fill-rose-500 text-rose-500' : 'text-slate-200'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Bottom Location & Award Line */}
                  <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between gap-2 text-xs text-slate-200">
                    <span className="inline-flex items-center gap-1 truncate font-medium">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="truncate">
                        {attr.location}, {attr.country}
                      </span>
                    </span>
                    {attr.badge && (
                      <span className="text-[11px] text-amber-300 font-semibold shrink-0">
                        {attr.badge}
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Content Body */}
                <div className="p-5 space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-base font-bold text-white leading-snug">{attr.title}</h3>

                    {/* Rating Bubbles & Review Count */}
                    <div className="flex items-center gap-2 text-xs">
                      <div
                        className="flex items-center gap-1"
                        aria-label={`Rated ${attr.rating} out of 5`}
                      >
                        {[1, 2, 3, 4, 5].map((b) => (
                          <span
                            key={b}
                            className={`w-3 h-3 rounded-full inline-block ${
                              b <= Math.round(attr.rating) ? 'bg-emerald-500' : 'bg-slate-700'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="font-mono tabular-nums font-bold text-white">
                        {attr.rating.toFixed(1)}
                      </span>
                      <span aria-hidden="true" className="text-slate-600">
                        ·
                      </span>
                      <span className="font-mono tabular-nums text-slate-400">
                        {attr.reviewCount.toLocaleString()} reviews
                      </span>
                    </div>
                  </div>

                  {/* Highlights Metadata */}
                  <div className="text-xs text-slate-300">{attr.highlights.join(' · ')}</div>

                  {/* Verified Traveler Review Quote Box */}
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1.5 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-400 font-medium">
                      <MessageSquareQuote className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{attr.reviewAuthor}</span>
                    </div>
                    <p className="text-slate-300 italic leading-relaxed">
                      &ldquo;{attr.reviewSnippet}&rdquo;
                    </p>
                  </div>

                  {/* Duration & Free Cancellation */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{attr.duration}</span>
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1 text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{attr.cancellation}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer: Price & Book Action (Tripadvisor button removed) */}
              <div className="px-5 py-4 bg-slate-950/70 border-t border-slate-800/80 flex items-center justify-between gap-3">
                <div>
                  <span className="text-[11px] text-slate-400 block">From</span>
                  <span className="text-lg font-extrabold text-white font-mono tabular-nums">
                    {formatCurrency(attr.priceUsd, currentCurrency)}
                  </span>
                  <span className="text-[11px] text-slate-500 block">per adult</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleBookItem(attr)}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Book Now</span>
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};
