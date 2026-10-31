import { Volume2, VolumeX, Eye, EyeOff, Cpu, Video } from 'lucide-react';
import { fuiAudio } from './AudioSynthesizer';

export type ViewMode = 'hero' | 'agents' | 'camera';

interface TopNavbarProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  isZenMode: boolean;
  onToggleZenMode: () => void;
  isAudioMuted: boolean;
  onToggleAudio: () => void;
}

export function TopNavbar({
  currentView,
  onViewChange,
  isZenMode,
  onToggleZenMode,
  isAudioMuted,
  onToggleAudio,
}: TopNavbarProps) {
  return (
    <header className="fixed top-5 left-1/2 -translate-x-1/2 z-50 w-full max-w-5xl px-4 flex items-center justify-between pointer-events-none select-none">
      {/* Brand Capsule (Monochrome with fluorescent orange accent) */}
      <div className="liquid-glass-panel rounded-full px-4 py-2 flex items-center gap-2.5 shadow-lg pointer-events-auto">
        <div className="w-6 h-6 rounded-full bg-[#ff5500] flex items-center justify-center font-bold text-[11px] text-black shadow-[0_0_10px_rgba(255,85,0,0.5)]">
          N
        </div>
        <span className="text-xs font-bold text-white tracking-wider">
          AGENTES FUI
        </span>
      </div>

      {/* Center Nav Capsule Tabs */}
      <nav className="liquid-glass-panel rounded-full p-1.5 flex items-center gap-1 shadow-lg pointer-events-auto">
        <button
          onClick={() => {
            onViewChange('hero');
            fuiAudio.playBlip(700);
          }}
          className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer ${
            currentView === 'hero'
              ? 'bg-white/20 text-white shadow-sm font-semibold'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          Visão Geral
        </button>

        <button
          onClick={() => {
            onViewChange('agents');
            fuiAudio.playBlip(850);
          }}
          className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
            currentView === 'agents'
              ? 'bg-[#ff5500]/20 text-[#ff5500] border border-[#ff5500]/50 shadow-[0_0_12px_rgba(255,85,0,0.3)] font-semibold'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Cpu className="w-3.5 h-3.5 text-[#ff5500]" />
          <span>Agentes Espaciais</span>
        </button>

        <button
          onClick={() => {
            onViewChange('camera');
            fuiAudio.playBlip(1000);
          }}
          className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
            currentView === 'camera'
              ? 'bg-[#ff5500]/20 text-[#ff5500] border border-[#ff5500]/50 shadow-[0_0_12px_rgba(255,85,0,0.3)] font-semibold'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Video className="w-3.5 h-3.5 text-[#ff5500]" />
          <span>Câmera & Gestos</span>
        </button>
      </nav>

      {/* Right Controls */}
      <div className="liquid-glass-panel rounded-full px-3 py-1.5 flex items-center gap-2 shadow-lg pointer-events-auto">
        {/* Audio Toggle */}
        <button
          onClick={onToggleAudio}
          title={isAudioMuted ? 'Ativar Som' : 'Silenciar'}
          className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
        >
          {isAudioMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
        </button>

        {/* Zen Mode Toggle */}
        <button
          onClick={onToggleZenMode}
          title={isZenMode ? 'Mostrar UI' : 'Modo Zen (Só Background)'}
          className={`p-1 rounded-full transition cursor-pointer ${
            isZenMode ? 'text-[#ff5500] bg-white/20' : 'text-zinc-400 hover:text-white hover:bg-white/10'
          }`}
        >
          {isZenMode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
        </button>

        {/* Groot-1 Calib Badge */}
        <div className="hidden sm:flex items-center gap-1.5 pl-1.5 border-l border-white/15 text-[10px] font-mono-fui text-[#ff5500]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#ff5500] shadow-[0_0_6px_#ff5500]" />
          <span>G1 · 0.952</span>
        </div>
      </div>
    </header>
  );
}
