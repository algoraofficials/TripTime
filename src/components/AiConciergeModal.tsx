import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  BrainCircuit, 
  Zap, 
  Compass, 
  Image as ImageIcon, 
  Camera, 
  Download, 
  RefreshCw, 
  CheckCircle, 
  Sliders, 
  BookmarkCheck,
  History,
  Plane,
  Train,
  Building2,
  Ship,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { ChatMessage, LanguageCode, Listing } from '../types/travel';
import { SupportedCurrency, formatCurrency } from '../utils/currency';

interface AiConciergeModalProps {
  currentCurrency: SupportedCurrency;
  currentLang: LanguageCode;
  bookingHistory?: Listing[];
  onSelectSuggestedListing?: (listing: Listing) => void;
  inlineMode?: boolean; // When embedded directly inside booking flow
}

export const AiConciergeModal: React.FC<AiConciergeModalProps> = ({
  currentCurrency,
  bookingHistory = [],
  onSelectSuggestedListing,
  inlineMode = false,
}) => {
  // Navigation inside AI Studio: Chatbot, Image Generation (1K/2K/4K), Vision Analysis
  const [activeSubTab, setActiveSubTab] = useState<'chat' | 'image_gen' | 'vision_analysis'>('chat');

  // --- CHAT STATE ---
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      role: 'assistant',
      content: `Assalamu Alaikum! Welcome to AetherVoyage BD AI Concierge! I analyze Bangladesh Railway intercity trains, domestic flights (Biman, US-Bangla), resorts in Cox's Bazar, Sylhet & Sajek Valley, and Dhaka budget hotels to build seamless itineraries in BDT (৳). How can I plan your Bangladesh trip today?`,
      modelUsed: 'gemini-3.8-flash',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [selectedChatModel, setSelectedChatModel] = useState<'gemini-3.8-flash' | 'gemini-4-argon' | 'gemini-3.1-flash-lite'>('gemini-3.8-flash');
  const [enableHighThinking, setEnableHighThinking] = useState(false);
  const [conciergeRole, setConciergeRole] = useState<'general' | 'itinerary_agent' | 'rapid_transit' | 'high_logistics'>('itinerary_agent');

  // User travel preferences
  const [travelPace, setTravelPace] = useState<'luxury_relax' | 'cultural_deep' | 'high_speed_transit' | 'eco_sustainable'>('luxury_relax');
  const [travelParty, setTravelParty] = useState<'solo' | 'couple' | 'group_friends' | 'family'>('group_friends');
  const [showMobilePrefs, setShowMobilePrefs] = useState(false);

  // --- IMAGE GEN STATE ---
  const [imagePrompt, setImagePrompt] = useState("Golden sunset over Cox's Bazar Marine Drive and Inani coral beach with traditional sampan boats in Bay of Bengal");
  const [imageSize, setImageSize] = useState<'1K' | '2K' | '4K'>('2K');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '1:1' | '4:3' | '9:16'>('16:9');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [imageGenModel, setImageGenModel] = useState<string>('gemini-3-pro-image-preview');

  // --- VISION / PHOTO ANALYSIS STATE ---
  const [selectedPhotoSample, setSelectedPhotoSample] = useState<string>('ticket');
  const [photoAnalysisResult, setPhotoAnalysisResult] = useState<string | null>(null);
  const [isVisionLoading, setIsVisionLoading] = useState(false);
  const [customImageBase64, setCustomImageBase64] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isChatLoading]);

  // Format simple markdown into JSX for clean reading
  const renderFormattedContent = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      const parts = line.split(/(\*\*.*?\*\*)/g);
      const formattedLine = parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={pIdx} className="text-white font-bold">{part.slice(2, -2)}</strong>;
        }
        return part;
      });

      if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
        return (
          <li key={idx} className="ml-3 list-disc my-1 pl-1 text-slate-200">
            {formattedLine}
          </li>
        );
      }

      return (
        <p key={idx} className={line.trim() === '' ? 'h-2' : 'my-1'}>
          {formattedLine}
        </p>
      );
    });
  };

  // Handle Chat Submit
  const handleSendMessage = async (e?: React.FormEvent, directPrompt?: string) => {
    if (e) e.preventDefault();
    const promptToSend = directPrompt || inputText;
    if (!promptToSend.trim() || isChatLoading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: promptToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updated = [...messages, userMsg];
    setMessages(updated);
    if (!directPrompt) setInputText('');
    setIsChatLoading(true);

    // Build system instructions based on role and travel context
    let systemInstruction = 'You are an agentic AI travel planner for AetherVoyage.';
    if (conciergeRole === 'itinerary_agent') {
      systemInstruction = `You are an agentic travel concierge who designs bespoke day-by-day itineraries combining hotels, bullet trains, flights, and yachts. Tailor suggestions to preference: ${travelPace}, party: ${travelParty}. Include departure times, transit connections, scenic highlights, and payment splitting suggestions for groups.`;
    } else if (conciergeRole === 'high_logistics') {
      systemInstruction = `You are a high-reasoning logistical master for complex multi-country travel. Solve tight layovers, visa requirements, multi-city rail passes, high-speed rail transfers, and contingency plans.`;
    } else if (conciergeRole === 'rapid_transit') {
      systemInstruction = `You are a rapid response transit assistant. Provide concise, immediate answers for train platforms, airport terminals, flight status, and emergency transit hubs.`;
    }

    // Include booking history in prompt context if available
    let contextualHistory = '';
    if (bookingHistory.length > 0) {
      contextualHistory = ` [User Past Bookings Context: ${bookingHistory.map(b => `${b.title} (${b.destination})`).join(', ')}]`;
    }

    try {
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updated.map(m => ({
            role: m.role,
            content: m.id === userMsg.id ? m.content + contextualHistory : m.content,
          })),
          model: enableHighThinking ? 'gemini-4-argon' : selectedChatModel,
          systemInstruction,
          enableHighThinking,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reach AI service');

      const botReply: ChatMessage = {
        id: `msg-bot-${Date.now()}`,
        role: 'assistant',
        content: data.reply,
        modelUsed: data.modelUsed || (enableHighThinking ? 'gemini-4-argon' : selectedChatModel),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isThinking: enableHighThinking,
      };

      setMessages((prev) => [...prev, botReply]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-err-${Date.now()}`,
          role: 'assistant',
          content: `Unable to complete query: ${err.message}. Please try again or switch model.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Handle Image Generation
  const handleGenerateImage = async () => {
    if (!imagePrompt.trim() || isImageLoading) return;
    setIsImageLoading(true);

    try {
      const res = await fetch('/api/gemini/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: imagePrompt,
          imageSize,
          aspectRatio,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Image generation failed');

      setGeneratedImage(data.imageUrl);
      setImageGenModel(data.model || 'gemini-3-pro-image-preview');
    } catch (err: any) {
      alert(`Image generation notice: ${err.message}`);
    } finally {
      setIsImageLoading(false);
    }
  };

  // Sample photos for vision analysis
  const sampleImages: Record<string, { label: string; url: string; prompt: string }> = {
    ticket: {
      label: 'Boarding Pass & Train Ticket',
      url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80',
      prompt: 'Extract flight and rail departure times, terminal gate, seat class, and check for any tight connection warnings or baggage allowance notes.',
    },
    passport: {
      label: 'Passport & Visa Verification',
      url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80',
      prompt: 'Analyze this passport cover and travel document context. Explain international 6-month validity rules and Schengen/Japan visa requirements.',
    },
    landmark: {
      label: 'Landmark / Photo Discovery',
      url: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80',
      prompt: 'Identify this scenic destination or hotel setting, best season to visit, nearby transit access, and top culinary experiences.',
    },
  };

  // Handle Vision Analysis using gemini-4-argon
  const handleAnalyzePhoto = async () => {
    setIsVisionLoading(true);
    setPhotoAnalysisResult(null);

    const targetUrl = customImageBase64 || sampleImages[selectedPhotoSample].url;
    const prompt = sampleImages[selectedPhotoSample].prompt;

    try {
      // Convert sample URL to base64 if needed, or pass placeholder
      let base64Data = customImageBase64;
      if (!base64Data) {
        // Fetch and convert image to base64
        const imgRes = await fetch(targetUrl);
        const blob = await imgRes.blob();
        base64Data = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      }

      const res = await fetch('/api/gemini/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64Data,
          mimeType: 'image/jpeg',
          prompt,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Vision analysis failed');

      setPhotoAnalysisResult(data.analysis);
    } catch (err: any) {
      setPhotoAnalysisResult(`Vision analysis notice: ${err.message}.`);
    } finally {
      setIsVisionLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomImageBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className={`bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl ${inlineMode ? 'p-6' : 'p-6 sm:p-8 max-w-6xl mx-auto'}`}>
      
      {/* Top Banner & Tab Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-800 gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-fuchsia-600 via-indigo-600 to-cyan-500 text-white shadow-lg shadow-fuchsia-600/30">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white tracking-tight flex items-center space-x-2">
              <span>Agentic AI Travel Concierge</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30 uppercase">
                Gemini 4 & 3.8
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Personalized itineraries, multi-modal routes, 1K/2K/4K visualizer & document scanner
            </p>
          </div>
        </div>

        {/* Feature Tabs */}
        <div className="flex items-center bg-slate-950 p-1.5 rounded-2xl border border-slate-800" role="tablist">
          <button
            onClick={() => setActiveSubTab('chat')}
            role="tab"
            aria-selected={activeSubTab === 'chat'}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all ${
              activeSubTab === 'chat'
                ? 'bg-fuchsia-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Interactive Chat</span>
          </button>

          <button
            onClick={() => setActiveSubTab('image_gen')}
            role="tab"
            aria-selected={activeSubTab === 'image_gen'}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all ${
              activeSubTab === 'image_gen'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>1K-4K Studio</span>
          </button>

          <button
            onClick={() => setActiveSubTab('vision_analysis')}
            role="tab"
            aria-selected={activeSubTab === 'vision_analysis'}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all ${
              activeSubTab === 'vision_analysis'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Document Scanner</span>
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: MULTI-TURN CHAT WITH MODEL SELECTION & HIGH THINKING */}
      {activeSubTab === 'chat' && (
        <div className="pt-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Mobile Preferences & Model Toggle */}
          <div className="lg:hidden">
            <button
              type="button"
              onClick={() => setShowMobilePrefs(!showMobilePrefs)}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-300 flex items-center justify-between"
            >
              <div className="flex items-center space-x-2">
                <Sliders className="w-3.5 h-3.5 text-fuchsia-400" />
                <span>Model & Itinerary Preferences ({selectedChatModel})</span>
              </div>
              <span className="text-[10px] text-fuchsia-400 font-bold">
                {showMobilePrefs ? 'Hide Options ▲' : 'Customize Options ▼'}
              </span>
            </button>
          </div>

          {/* Configuration Sidebar: Preferences & Model controls */}
          <div className={`${showMobilePrefs ? 'block' : 'hidden'} lg:block space-y-5 lg:border-r lg:border-slate-800 lg:pr-6`}>
            
            {/* Model Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 block">
                Model Engine
              </label>
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => { setSelectedChatModel('gemini-3.8-flash'); setEnableHighThinking(false); }}
                  className={`w-full p-2.5 rounded-xl text-left text-xs font-semibold border transition-all flex items-center justify-between ${
                    selectedChatModel === 'gemini-3.8-flash' && !enableHighThinking
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Zap className="w-3.5 h-3.5 text-indigo-400" />
                    <div>
                      <span className="block text-white">gemini-3.8-flash</span>
                      <span className="text-[10px] text-slate-500">General Travel Tasks</span>
                    </div>
                  </div>
                  <CheckCircle className={`w-3.5 h-3.5 ${selectedChatModel === 'gemini-3.8-flash' && !enableHighThinking ? 'opacity-100 text-indigo-400' : 'opacity-0'}`} />
                </button>

                <button
                  type="button"
                  onClick={() => { setSelectedChatModel('gemini-4-argon'); }}
                  className={`w-full p-2.5 rounded-xl text-left text-xs font-semibold border transition-all flex items-center justify-between ${
                    selectedChatModel === 'gemini-4-argon'
                      ? 'bg-fuchsia-600/20 border-fuchsia-500 text-fuchsia-200'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <BrainCircuit className="w-3.5 h-3.5 text-fuchsia-400" />
                    <div>
                      <span className="block text-white">gemini-4-argon</span>
                      <span className="text-[10px] text-slate-500">Complex Itinerary & Reasoning</span>
                    </div>
                  </div>
                  <CheckCircle className={`w-3.5 h-3.5 ${selectedChatModel === 'gemini-4-argon' ? 'opacity-100 text-fuchsia-400' : 'opacity-0'}`} />
                </button>

                <button
                  type="button"
                  onClick={() => { setSelectedChatModel('gemini-3.1-flash-lite'); setEnableHighThinking(false); }}
                  className={`w-full p-2.5 rounded-xl text-left text-xs font-semibold border transition-all flex items-center justify-between ${
                    selectedChatModel === 'gemini-3.1-flash-lite' && !enableHighThinking
                      ? 'bg-cyan-600/20 border-cyan-500 text-cyan-200'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Compass className="w-3.5 h-3.5 text-cyan-400" />
                    <div>
                      <span className="block text-white">gemini-3.1-flash-lite</span>
                      <span className="text-[10px] text-slate-500">Ultra-fast queries</span>
                    </div>
                  </div>
                  <CheckCircle className={`w-3.5 h-3.5 ${selectedChatModel === 'gemini-3.1-flash-lite' && !enableHighThinking ? 'opacity-100 text-cyan-400' : 'opacity-0'}`} />
                </button>
              </div>
            </div>

            {/* High Thinking Mode Toggle */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-fuchsia-950/40 via-slate-950 to-slate-950 border border-fuchsia-900/40 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <BrainCircuit className="w-4 h-4 text-fuchsia-400" />
                  <span className="text-xs font-bold text-white">Enable High Thinking</span>
                </div>
                <input
                  type="checkbox"
                  id="high-thinking-checkbox"
                  checked={enableHighThinking}
                  onChange={(e) => {
                    setEnableHighThinking(e.target.checked);
                    if (e.target.checked) setSelectedChatModel('gemini-4-argon');
                  }}
                  className="w-4 h-4 accent-fuchsia-500 cursor-pointer rounded"
                />
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">
                Uses <strong>gemini-4-argon</strong> with <code>thinkingLevel: HIGH</code> for complex multi-city connections and transit logistics.
              </p>
            </div>

            {/* Travel Preferences */}
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <span className="text-xs font-bold text-slate-300 block">Personalized Preferences</span>
              
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Travel Style / Pace</label>
                <select
                  value={travelPace}
                  onChange={(e) => setTravelPace(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white"
                >
                  <option value="luxury_relax">Luxury & Relaxation (Onsens, Suites)</option>
                  <option value="cultural_deep">Cultural & Historical Immersion</option>
                  <option value="high_speed_transit">High-Speed Rail & Fast Hops</option>
                  <option value="eco_sustainable">Eco & Zero-Emission Transit</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Traveling Party</label>
                <select
                  value={travelParty}
                  onChange={(e) => setTravelParty(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white"
                >
                  <option value="solo">Solo Explorer</option>
                  <option value="couple">Couple / Duo</option>
                  <option value="group_friends">Friends (Group Bill Split)</option>
                  <option value="family">Family with Children</option>
                </select>
              </div>
            </div>

            {/* Past Booking Context Card */}
            {bookingHistory.length > 0 && (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="flex items-center space-x-1.5 text-xs text-indigo-400 font-semibold">
                  <History className="w-3.5 h-3.5" />
                  <span>Linked Booking History ({bookingHistory.length})</span>
                </div>
                {bookingHistory.map((b) => (
                  <div key={b.id} className="text-[11px] text-slate-300 truncate">
                    • {b.title}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Main Chat Thread */}
          <div className="lg:col-span-3 flex flex-col h-[520px] bg-slate-950/80 rounded-2xl border border-slate-800/80 overflow-hidden">
            
            {/* Scrollable Message Thread */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-start space-x-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-fuchsia-600 to-indigo-600 flex items-center justify-center flex-shrink-0 text-white shadow-md">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed space-y-2 ${
                      msg.role === 'user'
                        ? 'bg-indigo-600 text-white rounded-tr-none'
                        : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] opacity-70 pb-1 border-b border-white/10">
                      <span className="font-semibold">{msg.role === 'user' ? 'You' : 'AetherVoyage Concierge'}</span>
                      <div className="flex items-center space-x-1.5">
                        {msg.modelUsed && (
                          <span className="bg-white/10 px-1.5 py-0.5 rounded font-mono">
                            {msg.modelUsed}
                          </span>
                        )}
                        <span>{msg.timestamp}</span>
                      </div>
                    </div>

                    {msg.isThinking && (
                      <div className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-md bg-fuchsia-500/10 border border-fuchsia-500/30 text-fuchsia-300 text-[10px] font-semibold">
                        <BrainCircuit className="w-3 h-3 animate-spin" />
                        <span>High Thinking Mode (Deep Multi-Hop Synthesis)</span>
                      </div>
                    )}

                    <div className="space-y-1">
                      {renderFormattedContent(msg.content)}
                    </div>
                  </div>

                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0 text-slate-300 border border-slate-700">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))}

              {isChatLoading && (
                <div className="flex items-center space-x-3 text-xs text-slate-400 pl-2">
                  <div className="w-8 h-8 rounded-full bg-indigo-600/30 flex items-center justify-center text-indigo-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                  <span>
                    {enableHighThinking
                      ? 'gemini-4-argon is evaluating transit itineraries in High Thinking mode...'
                      : 'Gemini is preparing your personalized travel recommendations...'}
                  </span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompt Suggestions */}
            <div className="px-4 py-2 border-t border-slate-800/80 bg-slate-900/40 flex items-center space-x-2 overflow-x-auto text-[11px]">
              <span className="text-slate-500 font-semibold flex-shrink-0">Quick Prompts:</span>
              <button
                onClick={() => handleSendMessage(undefined, "Create a 4-day Cox's Bazar & Saint Martin's Island itinerary from Dhaka using Cox's Bazar Express train and MV Bay One cruise.")}
                className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 whitespace-nowrap flex-shrink-0"
              >
                🏖️ 4-Day Cox&apos;s Bazar &amp; St. Martin&apos;s
              </button>
              <button
                onClick={() => handleSendMessage(undefined, 'How do we split a Sajek Valley & Sreemangal Tea Resort trip among 4 friends using bKash and Nagad in BDT?')}
                className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 whitespace-nowrap flex-shrink-0"
              >
                🌿 Split Sajek &amp; Sylhet Tea Tour
              </button>
              <button
                onClick={() => handleSendMessage(undefined, 'Compare budget Dhaka hotels in Motijheel, Fakirapool & Old Dhaka near Kamalapur Railway Station.')}
                className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 whitespace-nowrap flex-shrink-0"
              >
                🏨 Dhaka Budget Hotels Near Kamalapur
              </button>
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendMessage} className="p-3 bg-slate-950 border-t border-slate-800 flex items-center space-x-2">
              <input
                type="text"
                placeholder={
                  enableHighThinking
                    ? "Ask a complex multi-city transit or logistical question..."
                    : "Ask about itineraries, flight transfers, group splitting, or local tips..."
                }
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={isChatLoading || !inputText.trim()}
                className="p-2.5 rounded-xl bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500 text-white disabled:opacity-50 transition-all shadow-md"
                aria-label="Send message to AI Concierge"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: HIGH QUALITY IMAGE GENERATION (1K, 2K, 4K) */}
      {activeSubTab === 'image_gen' && (
        <div className="pt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Controls */}
          <div className="space-y-5 bg-slate-950 p-5 rounded-2xl border border-slate-800">
            <div>
              <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 text-[11px] font-bold mb-2">
                <span>Model: gemini-3-pro-image-preview</span>
              </span>
              <h3 className="text-sm font-bold text-white">Destination Moodboard Visualizer</h3>
              <p className="text-xs text-slate-400 mt-1">
                Generate photo-realistic travel visualizations with custom resolution affordance (1K, 2K, 4K).
              </p>
            </div>

            {/* Resolution Selector: 1K, 2K, 4K (Explicit Requirement) */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-2">
                Image Resolution (Affordance)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['1K', '2K', '4K'] as const).map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setImageSize(size)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                      imageSize === size
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <span>{size}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Aspect Ratio */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-2">
                Aspect Ratio
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {(['16:9', '1:1', '4:3', '9:16'] as const).map((ratio) => (
                  <button
                    key={ratio}
                    type="button"
                    onClick={() => setAspectRatio(ratio)}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold border ${
                      aspectRatio === ratio
                        ? 'bg-slate-800 text-cyan-300 border-cyan-500/50'
                        : 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>

            {/* Prompt */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Travel Scene Prompt
              </label>
              <textarea
                rows={3}
                value={imagePrompt}
                onChange={(e) => setImagePrompt(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                placeholder="Describe your dream destination scene..."
              />
            </div>

            {/* Preset Buttons */}
            <div className="space-y-1.5">
              <span className="text-[11px] text-slate-500 font-semibold block">Inspirational Presets:</span>
              <button
                type="button"
                onClick={() => setImagePrompt('Modern Japanese Shinkansen bullet train passing snowcapped Mount Fuji at sunrise with cherry blossoms in foreground')}
                className="text-[11px] text-left text-slate-300 hover:text-indigo-300 block truncate w-full"
              >
                • Shinkansen & Mount Fuji Sunrise
              </button>
              <button
                type="button"
                onClick={() => setImagePrompt('Swiss Glacier Express train crossing Landwasser viaduct through snowy alpine pine forests under clear blue sky')}
                className="text-[11px] text-left text-slate-300 hover:text-indigo-300 block truncate w-full"
              >
                • Swiss Glacier Express on Landwasser
              </button>
              <button
                type="button"
                onClick={() => setImagePrompt('Luxury private yacht cruising through the emerald waters of Positano with pastel cliffside villas bathed in golden hour light')}
                className="text-[11px] text-left text-slate-300 hover:text-indigo-300 block truncate w-full"
              >
                • Positano Golden Hour Catamaran
              </button>
            </div>

            <button
              type="button"
              onClick={handleGenerateImage}
              disabled={isImageLoading || !imagePrompt.trim()}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {isImageLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Synthesizing {imageSize} Artwork...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate {imageSize} Travel Visual</span>
                </>
              )}
            </button>
          </div>

          {/* Generated Canvas Preview */}
          <div className="lg:col-span-2 bg-slate-950 p-6 rounded-2xl border border-slate-800 flex flex-col items-center justify-center min-h-[420px]">
            {isImageLoading ? (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mx-auto text-indigo-400">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Rendering with {imageGenModel}</h4>
                  <p className="text-xs text-slate-400 max-w-sm mt-1">
                    Generating high-fidelity textures at {imageSize} resolution with {aspectRatio} aspect ratio.
                  </p>
                </div>
              </div>
            ) : generatedImage ? (
              <div className="w-full space-y-4">
                <div className="relative rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-900 group">
                  <img
                    src={generatedImage}
                    alt="AI Generated Travel Destination"
                    className="w-full h-auto max-h-[460px] object-cover"
                  />
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md text-white text-[11px] font-bold border border-slate-700">
                    Resolution: {imageSize} • {aspectRatio}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Model: {imageGenModel}</span>
                  <a
                    href={generatedImage}
                    download={`aethervoyage-${imageSize}.png`}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center space-x-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download {imageSize} Render</span>
                  </a>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-3 max-w-sm">
                <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-white">No Visual Rendered Yet</h4>
                <p className="text-xs text-slate-400">
                  Choose a resolution (1K, 2K, or 4K), enter a prompt, and click Generate to produce custom destination artwork.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: IMAGE UNDERSTANDING & DOCUMENT SCANNER (gemini-4-argon) */}
      {activeSubTab === 'vision_analysis' && (
        <div className="pt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left: Document selection & upload */}
          <div className="space-y-4 bg-slate-950 p-5 rounded-2xl border border-slate-800">
            <div>
              <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 text-[11px] font-bold mb-2">
                <span>Model: gemini-4-argon Vision</span>
              </span>
              <h3 className="text-sm font-bold text-white">Travel Document & Photo Intelligence</h3>
              <p className="text-xs text-slate-400 mt-1">
                Upload or select a boarding pass, passport, or landmark photo to analyze with <strong>gemini-4-argon</strong>.
              </p>
            </div>

            {/* Sample selection */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-2">
                Select Test Sample
              </label>
              <div className="space-y-2">
                {Object.entries(sampleImages).map(([key, sample]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => { setSelectedPhotoSample(key); setCustomImageBase64(null); }}
                    className={`w-full p-2.5 rounded-xl text-left text-xs font-medium border transition-all flex items-center space-x-3 ${
                      selectedPhotoSample === key && !customImageBase64
                        ? 'bg-cyan-950/40 border-cyan-500 text-cyan-200'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <img src={sample.url} alt={sample.label} className="w-10 h-10 rounded-lg object-cover" />
                    <div>
                      <span className="font-bold text-white block">{sample.label}</span>
                      <span className="text-[10px] text-slate-400 line-clamp-1">{sample.prompt}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom File Upload */}
            <div className="pt-2 border-t border-slate-800">
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Or Upload Custom Travel Photo / Ticket
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700 cursor-pointer"
              />
            </div>

            <button
              type="button"
              onClick={handleAnalyzePhoto}
              disabled={isVisionLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/30 flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {isVisionLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Scanning with gemini-4-argon...</span>
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4" />
                  <span>Analyze Travel Photo with Gemini 4</span>
                </>
              )}
            </button>
          </div>

          {/* Right: Vision Results */}
          <div className="lg:col-span-2 bg-slate-950 p-6 rounded-2xl border border-slate-800 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Document Preview & Vision Insights
                </h4>
                <span className="text-[11px] text-cyan-400 font-mono">
                  Engine: gemini-4-argon
                </span>
              </div>

              {/* Image Preview */}
              <div className="h-44 w-full rounded-xl overflow-hidden bg-slate-900 border border-slate-800">
                <img
                  src={customImageBase64 || sampleImages[selectedPhotoSample].url}
                  alt="Analyzing Target"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Analysis Text Box */}
              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 min-h-[160px] text-xs leading-relaxed text-slate-200">
                {isVisionLoading ? (
                  <div className="flex items-center space-x-2 text-cyan-400 pt-4">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Extracting metadata, boarding rules, and location intelligence...</span>
                  </div>
                ) : photoAnalysisResult ? (
                  <div className="space-y-2 whitespace-pre-wrap">
                    <div className="flex items-center space-x-2 text-emerald-400 font-semibold mb-1">
                      <CheckCircle className="w-4 h-4" />
                      <span>gemini-4-argon Analysis Complete</span>
                    </div>
                    {photoAnalysisResult}
                  </div>
                ) : (
                  <p className="text-slate-500 italic pt-4 text-center">
                    Click "Analyze Travel Photo with Gemini 4" to scan boarding credentials, baggage sizes, or scenic landmark origins.
                  </p>
                )}
              </div>
            </div>

            <div className="pt-4 text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-800/80">
              <span>Automatic OCR + Multi-lingual parsing</span>
              <span>Encrypted processing in us-east1</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
