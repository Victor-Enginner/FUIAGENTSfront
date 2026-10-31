import { useState, useRef, useEffect } from 'react';
import { Camera, ZoomIn, ZoomOut, Crosshair, Scan, ShieldAlert, Cpu } from 'lucide-react';
import { fuiAudio } from './AudioSynthesizer';

interface AROverlayHUDProps {
  gestureAction?: string;
}

export function AROverlayHUD({ gestureAction }: AROverlayHUDProps) {
  const [zoomLevel, setZoomLevel] = useState<number>(1.8);
  const [isLiveCamera, setIsLiveCamera] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<string>('NEURAL_COPROCESSOR_X8');
  const [scanProgress, setScanProgress] = useState<number>(92);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize camera for AR mode if available
  useEffect(() => {
    let active = true;
    async function setupCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'environment' },
          audio: false,
        });
        if (active && videoRef.current) {
          streamRef.current = stream;
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
          setIsLiveCamera(true);
        }
      } catch (e) {
        console.warn('AR camera fallback:', e);
        setIsLiveCamera(false);
      }
    }
    setupCamera();

    return () => {
      active = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Handle external gesture actions (fist pan, pinch zoom, v gesture)
  useEffect(() => {
    if (gestureAction === 'zoom') {
      setZoomLevel((prev) => Math.min(4.5, prev + 0.4));
      fuiAudio.playBlip(1100);
    } else if (gestureAction === 'v_gesture') {
      setZoomLevel(1.0);
      fuiAudio.playChirp();
    }
  }, [gestureAction]);

  const targetList = [
    {
      id: 'NEURAL_COPROCESSOR_X8',
      name: 'GROOT-1 NEURAL COPROCESSOR',
      x: 48,
      y: 42,
      specs: 'TSMC 3nm // 128 TFLOPS FP8 // 0% GPU OVERHEAD',
      confidence: 0.985,
    },
    {
      id: 'OPTICAL_SENSOR_ARRAY',
      name: 'OPTICAL SENSOR RIG EF-09/B',
      x: 72,
      y: 28,
      specs: 'HYPERSPECTRAL 4K // 240FPS TELEMETRY // DUAL IR',
      confidence: 0.942,
    },
    {
      id: 'QUANTUM_MEMORY_BUS',
      name: 'CRYOGENIC BUFFER VLMTRC',
      x: 32,
      y: 68,
      specs: 'MUTHUR PRO 12-6 B // 2.4 TB/S BANDWIDTH',
      confidence: 0.967,
    },
  ];

  return (
    <div className="relative w-full h-full bg-[#020910] overflow-hidden select-none">
      {/* Background Live Camera Feed or Procedural Cyber Feed */}
      <div className="absolute inset-0 overflow-hidden">
        {isLiveCamera ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover transition-transform duration-200"
            style={{ transform: `scale(${zoomLevel})` }}
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center transition-transform duration-200 bg-[radial-gradient(ellipse_at_center,#052233_0%,#01080e_100%)]"
            style={{ transform: `scale(${zoomLevel})` }}
          >
            {/* Holographic Wireframe Skull Hologram (as in screenshot image_4c284c4a.png) */}
            <div className="relative w-[520px] h-[380px] border border-[#00f3ff]/30 rounded-lg p-6 bg-[#031521]/60 backdrop-blur-sm shadow-[0_0_30px_rgba(0,243,255,0.2)]">
              {/* Animated SVG Wireframe Head / Object Topology */}
              <svg viewBox="0 0 400 300" className="w-full h-full">
                <defs>
                  <linearGradient id="cyberGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#00f3ff" />
                    <stop offset="50%" stopColor="#9933ff" />
                    <stop offset="100%" stopColor="#ff00aa" />
                  </linearGradient>
                </defs>
                {/* 3D mesh lines */}
                <ellipse cx="200" cy="140" rx="140" ry="90" fill="none" stroke="url(#cyberGrad)" strokeWidth="1.2" strokeDasharray="3 3" />
                <ellipse cx="200" cy="140" rx="100" ry="120" fill="none" stroke="#00f3ff" strokeWidth="0.8" opacity="0.6" />
                <ellipse cx="200" cy="140" rx="60" ry="70" fill="none" stroke="#00f3ff" strokeWidth="1" opacity="0.8" />
                <path d="M 60 140 Q 200 60 340 140" fill="none" stroke="#00f3ff" strokeWidth="1" opacity="0.7" />
                <path d="M 60 140 Q 200 220 340 140" fill="none" stroke="#00f3ff" strokeWidth="1" opacity="0.7" />
                <path d="M 200 20 Q 120 140 200 260" fill="none" stroke="#ffaa00" strokeWidth="1" opacity="0.7" />
                <path d="M 200 20 Q 280 140 200 260" fill="none" stroke="#ffaa00" strokeWidth="1" opacity="0.7" />
                {/* Scan crosshair */}
                <circle cx="210" cy="135" r="22" fill="none" stroke="#ff3366" strokeWidth="1.5" />
                <circle cx="210" cy="135" r="3" fill="#ff3366" />
                <line x1="170" y1="135" x2="250" y2="135" stroke="#ff3366" strokeWidth="1" strokeDasharray="2 2" />
                <line x1="210" y1="95" x2="210" y2="175" stroke="#ff3366" strokeWidth="1" strokeDasharray="2 2" />
              </svg>

              <div className="absolute top-3 left-3 text-[10px] font-mono-fui text-[#00f3ff]">
                MODEL: CRANIAL_VLMTRC_3D // 14,280 POLY
              </div>
              <div className="absolute bottom-3 right-3 text-[10px] font-mono-fui text-[#ffaa00]">
                SPECTRAL SCAN: COMPLETE (0.982)
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Cyber Grid & Scanline Filter */}
      <div className="absolute inset-0 fui-scanline pointer-events-none opacity-30" />
      <div className="absolute inset-0 fui-grid-bg pointer-events-none opacity-20" />

      {/* AR HUD Framing: Top Bar (matching screenshot image_4c284c4a.png) */}
      <div className="absolute top-4 left-6 right-6 flex items-center justify-between text-xs font-hud z-30 pointer-events-none">
        <div className="flex items-center gap-3">
          <div className="px-3 py-1 bg-[#021824]/90 border border-[#00f3ff] text-[#00f3ff] font-bold rounded flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00f3ff] animate-ping" />
            <span>WD MGP BH_T834_003</span>
          </div>
          <span className="text-[#00f3ff]/70 font-mono-fui text-[11px]">VLMTRC.SCN // PROJ.07</span>
        </div>

        <div className="flex items-center gap-4 bg-[#021824]/90 border border-[#00f3ff]/40 px-4 py-1 rounded text-[#00f3ff]">
          <span className="font-mono-fui text-[11px]">EF-09/B CONV.</span>
          <span className="text-emerald-400 font-bold">{scanProgress}%</span>
          <span className="text-slate-400">|</span>
          <span className="font-mono-fui text-[11px] text-[#ffaa00]">MUTHUR PRO 12-6 B</span>
        </div>
      </div>

      {/* Center Tactical Crosshairs & Reticle */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
        <div className="relative w-64 h-64 border border-[#00f3ff]/30 rounded-full flex items-center justify-center">
          <div className="w-48 h-48 border border-dashed border-[#00f3ff]/50 rounded-full animate-spin [animation-duration:30s]" />
          <div className="w-16 h-16 border border-[#ffaa00]/60 rounded-full flex items-center justify-center">
            <div className="w-2 h-2 bg-[#ffaa00] rounded-full" />
          </div>

          {/* Crosshair arms */}
          <div className="absolute top-0 bottom-0 w-px bg-[#00f3ff]/40" />
          <div className="absolute left-0 right-0 h-px bg-[#00f3ff]/40" />

          {/* Reticle Specs */}
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-mono-fui text-[#00f3ff] bg-[#02141e]/90 px-2 py-0.5 rounded border border-[#00f3ff]/30">
            ZOOM: {zoomLevel.toFixed(1)}X // OPTICAL ENHANCE
          </div>
        </div>
      </div>

      {/* Interactive AR Target Tags in Scene */}
      {targetList.map((target) => (
        <div
          key={target.id}
          onClick={() => {
            setSelectedTarget(target.id);
            fuiAudio.playChirp();
          }}
          style={{ left: `${target.x}%`, top: `${target.y}%` }}
          className={`absolute -translate-x-1/2 -translate-y-1/2 z-30 cursor-pointer transition-all duration-200 group ${
            selectedTarget === target.id ? 'scale-110' : 'opacity-85 hover:opacity-100'
          }`}
        >
          {/* Target Reticle Box */}
          <div
            className={`p-2 rounded border transition-all duration-200 ${
              selectedTarget === target.id
                ? 'bg-[#031d27]/95 border-[#00f3ff] shadow-[0_0_20px_rgba(0,243,255,0.4)]'
                : 'bg-[#02141e]/80 border-[#00f3ff]/40 hover:border-[#00f3ff]'
            }`}
          >
            <div className="flex items-center gap-1.5 text-[10px] font-hud font-bold text-[#00f3ff]">
              <Crosshair className="w-3.5 h-3.5 text-[#00f3ff]" />
              <span>{target.name}</span>
            </div>
            <div className="text-[9px] font-mono-fui text-slate-300 mt-0.5">
              CONF: {(target.confidence * 100).toFixed(1)}%
            </div>
          </div>
        </div>
      ))}

      {/* Right Holographic Spec Card (matching screenshot image_4c284c4a.png) */}
      <div className="absolute right-6 top-20 w-[290px] bg-[#02141e]/90 border border-[#00f3ff]/50 rounded-lg p-4 z-30 shadow-[0_0_25px_rgba(0,243,255,0.2)] backdrop-blur-md pointer-events-auto">
        <div className="flex items-center justify-between pb-2 border-b border-[#00f3ff]/30 mb-3">
          <span className="text-xs font-hud font-bold text-[#00f3ff]">ANÁLISE DE OBJETO AR</span>
          <span className="text-[10px] font-mono-fui text-emerald-400">STATUS: LOCKED</span>
        </div>

        {/* Selected target metadata */}
        <div className="flex flex-col gap-2 text-xs font-mono-fui">
          <div>
            <span className="text-slate-400 text-[10px]">ALVO SELECIONADO:</span>
            <div className="text-[#00f3ff] font-bold text-[11px]">{selectedTarget}</div>
          </div>
          <div>
            <span className="text-slate-400 text-[10px]">ESPECIFICAÇÕES TÉCNICAS:</span>
            <div className="text-slate-200 text-[11px] leading-relaxed">
              {targetList.find((t) => t.id === selectedTarget)?.specs || 'REAL-TIME CV OBJECT ANALYSIS'}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-[#00f3ff]/20">
            <div className="p-2 bg-[#031d27] rounded border border-[#00f3ff]/30">
              <span className="text-[9px] text-slate-400 block">RKJ-RSSN RATIO</span>
              <span className="text-sm font-bold text-[#ffaa00]">10:1</span>
            </div>
            <div className="p-2 bg-[#031d27] rounded border border-[#00f3ff]/30">
              <span className="text-[9px] text-slate-400 block">PRECISÃO (CV)</span>
              <span className="text-sm font-bold text-emerald-400">99.4%</span>
            </div>
          </div>
        </div>

        {/* Zoom controller bar */}
        <div className="mt-4 pt-3 border-t border-[#00f3ff]/30 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[10px] font-mono-fui text-[#00f3ff]">
            <span>MAGNIFICAÇÃO:</span>
            <span className="font-bold">{zoomLevel.toFixed(1)}x</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setZoomLevel((z) => Math.max(1.0, z - 0.2));
                fuiAudio.playBlip(700);
              }}
              className="p-1.5 bg-[#031d27] hover:bg-[#00f3ff]/20 border border-[#00f3ff]/30 text-[#00f3ff] rounded cursor-pointer"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <input
              type="range"
              min="1.0"
              max="4.5"
              step="0.1"
              value={zoomLevel}
              onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
              className="w-full accent-[#00f3ff] cursor-pointer"
            />
            <button
              onClick={() => {
                setZoomLevel((z) => Math.min(4.5, z + 0.2));
                fuiAudio.playBlip(950);
              }}
              className="p-1.5 bg-[#031d27] hover:bg-[#00f3ff]/20 border border-[#00f3ff]/30 text-[#00f3ff] rounded cursor-pointer"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom AR info strip */}
      <div className="absolute bottom-4 left-6 right-6 flex items-center justify-between text-[11px] font-mono-fui text-slate-400 bg-[#02141e]/80 border border-[#00f3ff]/30 px-4 py-2 rounded backdrop-blur-sm z-30">
        <span className="text-[#00f3ff]">
          [GESTOS ATIVOS]: ✊ FIST = PAN | ✊+✊ = ZOOM | 👌 = INSPECIONAR | ✌ = RESET
        </span>
        <span className="text-emerald-400">SCAN HEADS STABLE // LATENCY 0ms</span>
      </div>
    </div>
  );
}
