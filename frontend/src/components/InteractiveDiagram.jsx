import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Play, Info, Loader2, ChevronRight, Target, Zap, Clock, Brain, Search } from 'lucide-react';

const InteractiveDiagram = ({ diagramData, onComponentClick }) => {
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [hoveredMarker, setHoveredMarker] = useState(null);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const containerRef = useRef(null);

  const { 
    image: initialImage = 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=800',
    title = 'Interactive Diagram',
    markers = [],
    description = 'Explore the parts of the system by clicking on the markers.'
  } = diagramData || {};

  // Dynamic API URL for proxy
  const getProxyUrl = (url) => {
    if (!url || url.startsWith('data:')) return url;
    
    // We should proxy external images (DALL-E, Pollinations, etc.) to avoid CORS/ORB
    const isExternal = url.includes('pollinations.ai') || url.includes('openai.com') || url.includes('blob.core.windows.net');
    if (!isExternal) return url;

    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8081/api';
    const proxyBase = baseUrl.replace('/api', '/api/diagram/proxy');
    return `${proxyBase}?url=${encodeURIComponent(url)}`;
  };

  const image = getProxyUrl(initialImage);

  // Reset loading state when image URL changes
  useEffect(() => {
    setIsImageLoading(true);
    setImageError(false);
    setSelectedMarker(null);
    setHoveredMarker(null);
  }, [image]);

  const handleMarkerClick = (marker) => {
    setSelectedMarker(selectedMarker?.id === marker.id ? null : marker);
    if (onComponentClick) {
      onComponentClick(marker);
    }
  };

  const handleClose = () => {
    setSelectedMarker(null);
  };

  const getIcon = (label, index) => {
    const lower = label.toLowerCase();
    if (lower.includes('search') || lower.includes('find')) return <Search className="w-3 h-3" />;
    if (lower.includes('target') || lower.includes('goal')) return <Target className="w-3 h-3" />;
    if (lower.includes('time') || lower.includes('clock')) return <Clock className="w-3 h-3" />;
    if (lower.includes('process') || lower.includes('work')) return <Zap className="w-3 h-3" />;
    if (lower.includes('result') || lower.includes('end')) return <Brain className="w-3 h-3" />;
    return <span className="text-[10px] font-black">{index + 1}</span>;
  };

  return (
    <div className="w-full bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800">
      {/* Header Section */}
      <div className="pt-10 pb-4 px-8 text-center bg-white dark:bg-slate-900 z-10 relative">
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
            <Brain className="w-6 h-6 text-blue-600" />
          </div>
          <h2 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight">
            {title}
          </h2>
        </div>
        <p className="text-slate-500 dark:text-slate-400 text-lg max-w-2xl mx-auto italic font-medium">
          {description}
        </p>
        <div className="w-24 h-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 mx-auto mt-6 rounded-full shadow-lg shadow-blue-200 dark:shadow-none"></div>
      </div>

      {/* Main Interactive Area */}
      <div className="relative flex flex-col lg:flex-row h-[650px]">
        
        {/* Left Labels Column */}
        <div className="w-full lg:w-72 p-6 space-y-3 bg-slate-50/50 dark:bg-slate-900/50 overflow-y-auto border-r border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Components</h3>
            <span className="text-[10px] px-2 py-0.5 border border-slate-200 rounded-full text-slate-400 uppercase font-black">Interactive</span>
          </div>
          {markers.map((marker, index) => (
            <motion.button
              key={marker.id}
              onClick={() => handleMarkerClick(marker)}
              onMouseEnter={() => setHoveredMarker(marker.id)}
              onMouseLeave={() => setHoveredMarker(null)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all group relative ${
                selectedMarker?.id === marker.id
                  ? 'bg-blue-600 text-white shadow-xl shadow-blue-200 dark:shadow-blue-900/40 translate-x-2'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-100 dark:border-slate-700 shadow-sm'
              }`}
              whileHover={{ x: selectedMarker?.id === marker.id ? 8 : 5 }}
              layout
            >
              <div className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                selectedMarker?.id === marker.id 
                  ? 'bg-white/20 rotate-12 scale-110' 
                  : 'bg-blue-100 dark:bg-blue-900/40 group-hover:rotate-12 group-hover:scale-110'
              }`}>
                <div className={selectedMarker?.id === marker.id ? 'text-white' : 'text-blue-600'}>
                  {getIcon(marker.label, index)}
                </div>
              </div>
              <span className="truncate flex-1 text-left tracking-tight">{marker.label}</span>
              <ChevronRight className={`w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity ${selectedMarker?.id === marker.id ? 'text-white/60' : 'text-blue-400'}`} />
              
              {/* Active Indicator */}
              {selectedMarker?.id === marker.id && (
                <motion.div 
                  layoutId="active-pill"
                  className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-8 bg-white rounded-full"
                />
              )}
            </motion.button>
          ))}
        </div>

        {/* Center Diagram Image */}
        <div 
          ref={containerRef}
          className="flex-1 relative bg-white dark:bg-slate-900 overflow-hidden flex items-center justify-center p-8"
        >
          {/* Connection Lines Layer */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-visible">
            <defs>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <linearGradient id="line-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#6366f1" />
              </linearGradient>
            </defs>
            {markers.map((marker) => {
              const isActive = hoveredMarker === marker.id || selectedMarker?.id === marker.id;
              if (!isActive) return null;

              return (
                <motion.path
                  key={`path-${marker.id}`}
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  d={`M -20,${(markers.findIndex(m => m.id === marker.id) + 0.5) * (100 / markers.length)}% Q 10,${(markers.findIndex(m => m.id === marker.id) + 0.5) * (100 / markers.length)}% ${marker.x}%,${marker.y}%`}
                  fill="none"
                  stroke="url(#line-grad)"
                  strokeWidth="4"
                  strokeDasharray="8,6"
                  strokeLinecap="round"
                  style={{ filter: 'url(#glow)' }}
                />
              );
            })}
          </svg>

          {/* Loading and Error States */}
          <AnimatePresence>
            {isImageLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-8"
              >
                <div className="relative w-24 h-24 mb-8">
                  <div className="absolute inset-0 rounded-full border-4 border-blue-100 dark:border-blue-900/30"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-t-blue-600 animate-spin"></div>
                  <Loader2 className="absolute inset-0 m-auto w-10 h-10 text-blue-600 animate-pulse" />
                </div>
                <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-widest">Building Visualization</h3>
                <p className="text-slate-500 dark:text-slate-400 mt-3 font-medium">Synthesizing high-fidelity educational blueprint...</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Diagram Image */}
          <div className="w-full h-full relative z-5 flex items-center justify-center group/img">
            <motion.img
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: isImageLoading ? 0 : 1, scale: isImageLoading ? 0.95 : 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              src={image}
              alt={title}
              className="max-w-full max-h-full object-contain rounded-[3rem] shadow-2xl transition-all duration-500 group-hover/img:scale-[1.02] border-8 border-white dark:border-slate-800"
              onLoad={() => setIsImageLoading(false)}
              onError={(e) => {
                setImageError(true);
                setIsImageLoading(false);
                // Fallback to direct URL if proxy fails
                if (!e.target.src.includes('proxy')) return;
                e.target.src = initialImage;
              }}
            />
            {/* Image Overlay/Reflection Effect */}
            <div className="absolute inset-0 pointer-events-none rounded-[3rem] bg-gradient-to-tr from-white/5 to-transparent opacity-50"></div>
          </div>

          {/* Diagram Markers */}
          {!isImageLoading && markers.map((marker, index) => (
            <motion.button
              key={marker.id}
              onClick={() => handleMarkerClick(marker)}
              onMouseEnter={() => setHoveredMarker(marker.id)}
              onMouseLeave={() => setHoveredMarker(null)}
              className="absolute z-10"
              style={{
                left: `${marker.x}%`,
                top: `${marker.y}%`,
                transform: 'translate(-50%, -50%)'
              }}
              initial={{ scale: 0, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.08, type: "spring", stiffness: 200 }}
              whileHover={{ scale: 1.25, zIndex: 30 }}
            >
              <div className={`relative group/marker`}>
                <div className={`absolute inset-[-8px] rounded-full animate-ping opacity-20 ${
                  selectedMarker?.id === marker.id ? 'bg-indigo-400' : 'bg-blue-400'
                }`}></div>
                
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-2xl border-4 ${
                  selectedMarker?.id === marker.id
                    ? 'bg-gradient-to-br from-indigo-600 to-blue-700 border-white scale-110 rotate-[15deg]'
                    : 'bg-white dark:bg-slate-800 border-blue-600 text-blue-600 hover:scale-110 hover:rotate-[5deg]'
                }`}>
                  <div className={selectedMarker?.id === marker.id ? 'text-white' : 'text-blue-600'}>
                    {getIcon(marker.label, index)}
                  </div>
                </div>
                
                {/* Tooltip on Hover */}
                <AnimatePresence>
                  {hoveredMarker === marker.id && !selectedMarker && (
                    <motion.div
                      initial={{ opacity: 0, y: 15, scale: 0.8 }}
                      animate={{ opacity: 1, y: -55, scale: 1 }}
                      exit={{ opacity: 0, y: 15, scale: 0.8 }}
                      className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-900/90 backdrop-blur-md text-white px-4 py-2 rounded-xl text-xs font-black shadow-2xl pointer-events-none border border-white/10"
                    >
                      <div className="flex items-center gap-2">
                        <span className="h-4 w-4 bg-blue-600 flex items-center justify-center rounded-md text-[8px] text-white">{index + 1}</span>
                        {marker.label}
                      </div>
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900/90"></div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.button>
          ))}
        </div>

        {/* Right Floating Detail Card */}
        <AnimatePresence>
          {selectedMarker && (
            <motion.div
              initial={{ opacity: 0, x: 60, scale: 0.9, rotateY: 20 }}
              animate={{ opacity: 1, x: 0, scale: 1, rotateY: 0 }}
              exit={{ opacity: 0, x: 60, scale: 0.9, rotateY: 20 }}
              transition={{ type: "spring", damping: 20 }}
              className="w-full lg:w-[420px] lg:absolute right-8 top-1/2 lg:-translate-y-1/2 z-40 bg-white/95 dark:bg-slate-800/95 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_40px_100px_-15px_rgba(0,0,0,0.4)] border border-white/40 dark:border-slate-700/50 overflow-hidden"
            >
              <div className="p-10">
                <div className="flex items-start justify-between mb-8">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></div>
                      <span className="text-blue-600 font-black text-[10px] uppercase tracking-[0.3em] block">Component Insight</span>
                    </div>
                    <h3 className="text-4xl font-black text-slate-800 dark:text-white leading-tight tracking-tighter">
                      {selectedMarker.label}
                    </h3>
                  </div>
                  <button 
                    onClick={handleClose} 
                    className="p-3 bg-slate-100 dark:bg-slate-700 hover:bg-red-500 hover:text-white dark:hover:bg-red-500 rounded-2xl transition-all shadow-sm"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-[2rem] mb-8 border border-blue-100 dark:border-blue-900/30 relative overflow-hidden group/card">
                  <div className="absolute -right-4 -bottom-4 opacity-5 group-hover/card:scale-110 transition-transform duration-700">
                    <Brain className="w-32 h-32 text-blue-600" />
                  </div>
                  <p className="text-slate-700 dark:text-slate-200 text-base leading-relaxed font-medium relative z-10">
                    {selectedMarker.description || `Comprehensive structural analysis for ${selectedMarker.label} is being synchronized by InsightLearn AI engine.`}
                  </p>
                </div>

                {/* Video Preview */}
                <div className="relative rounded-[2rem] overflow-hidden bg-slate-900 aspect-video mb-8 group/vid cursor-pointer shadow-2xl border-4 border-white dark:border-slate-700">
                  <img
                    src={`https://images.unsplash.com/photo-1576086213369-97a306d36557?w=500&q=80`}
                    alt={selectedMarker.label}
                    className="w-full h-full object-cover opacity-60 group-hover/vid:scale-110 group-hover/vid:opacity-30 transition-all duration-1000"
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                    <motion.div 
                      className="w-24 h-16 bg-red-600 rounded-2xl flex items-center justify-center shadow-[0_0_50px_rgba(220,38,38,0.6)] group-hover/vid:scale-110 transition-transform duration-500"
                      whileHover={{ scale: 1.15 }}
                    >
                      <Play className="w-10 h-10 text-white fill-current shadow-inner" />
                    </motion.div>
                    <span className="text-white font-black text-xs uppercase tracking-widest mt-6 opacity-0 group-hover/vid:opacity-100 transition-opacity duration-500">Launch Video Masterclass</span>
                  </div>
                </div>

                {/* Watch Link */}
                <a
                  href={selectedMarker.videoUrl || `https://www.youtube.com/results?search_query=how+${encodeURIComponent(selectedMarker.label)}+works`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-5 rounded-[1.5rem] font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-blue-200 dark:shadow-none hover:shadow-2xl hover:-translate-y-1 active:translate-y-0"
                >
                  <Play className="w-5 h-5 fill-current" />
                  <span>Start Full Lesson</span>
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Section */}
      <div className="py-10 bg-slate-50 dark:bg-slate-800/80 text-center border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-center gap-8 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-blue-600" />
            <span className="text-[10px] font-black uppercase tracking-widest">Real-time Synthesis</span>
          </div>
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-blue-600" />
            <span className="text-[10px] font-black uppercase tracking-widest">High-Precision Mapping</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <span className="text-[10px] font-black uppercase tracking-widest">Dynamic Complexity</span>
          </div>
        </div>
        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.4em] mt-8">
          Powered by InsightLearn AI • Professional Educational Blueprint v2.0
        </p>
      </div>
    </div>
  );
};

export default InteractiveDiagram;

