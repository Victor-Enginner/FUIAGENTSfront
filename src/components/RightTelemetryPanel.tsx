import { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { fuiAudio } from './AudioSynthesizer';

export function RightTelemetryPanel() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [freqZ, setFreqZ] = useState(59.98);
  const [pulseXY, setPulseXY] = useState(69.83);

  // Subtle real-time oscillation to feel alive
  useEffect(() => {
    const interval = setInterval(() => {
      setFreqZ(+(59.5 + Math.random() * 0.9).toFixed(2));
      setPulseXY(+(69.2 + Math.random() * 1.1).toFixed(2));
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={`fixed top-20 right-6 z-40 transition-transform duration-300 pointer-events-auto select-none ${
        isCollapsed ? 'translate-x-[calc(100%-24px)]' : 'translate-x-0'
      }`}
    >
      <div className="flex items-start gap-1">
        {/* Collapse toggle tab */}
        <button
          onClick={() => {
            setIsCollapsed(!isCollapsed);
            fuiAudio.playBlip(700);
          }}
          className="mt-1 p-1 bg-black/80 hover:bg-[#ff5500]/20 border border-white/15 text-zinc-300 hover:text-white rounded-l cursor-pointer backdrop-blur-md shadow-md"
          title={isCollapsed ? 'Expandir Telemetria' : 'Ocultar Telemetria'}
        >
          {isCollapsed ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </button>

        {/* Panel Container (Black/Grey with Fluorescent Orange accents) */}
        <div className="w-[260px] liquid-glass-panel rounded-2xl p-3 shadow-[0_20px_50px_rgba(0,0,0,0.7)] border border-white/10 flex flex-col gap-2.5">
          {/* Circular Gauges Row */}
          <div className="grid grid-cols-2 gap-2">
            {/* Gauge 1: Frequência [Z] */}
            <div className="flex flex-col items-center p-2 bg-black/50 rounded-xl border border-white/10">
              <span className="text-[8.5px] font-mono-fui text-zinc-400 text-center leading-tight">
                Frequência [ Z ]
                <span className="block text-[7.5px] text-zinc-500">ESPACIAL // CANAL 39</span>
              </span>

              {/* Circular SVG Meter in Fluorescent Orange */}
              <div className="relative w-14 h-14 my-1 flex items-center justify-center">
                <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
                  <circle cx="32" cy="32" r="26" fill="none" stroke="#222226" strokeWidth="4" />
                  <circle
                    cx="32"
                    cy="32"
                    r="26"
                    fill="none"
                    stroke="#ff5500"
                    strokeWidth="4"
                    strokeDasharray={2 * Math.PI * 26}
                    strokeDashoffset={2 * Math.PI * 26 * (1 - freqZ / 100)}
                    className="transition-all duration-500 shadow-[0_0_8px_#ff5500]"
                  />
                </svg>
                <span className="absolute text-[11px] font-mono-fui font-bold text-white">
                  {freqZ}
                </span>
              </div>
            </div>

            {/* Gauge 2: Pulso [XY] */}
            <div className="flex flex-col items-center p-2 bg-black/50 rounded-xl border border-white/10">
              <span className="text-[8.5px] font-mono-fui text-zinc-400 text-center leading-tight">
                Pulso [ XY ]
                <span className="block text-[7.5px] text-zinc-500">ESPACIAL // CANAL 74</span>
              </span>

              {/* Circular SVG Meter in Fluorescent Orange */}
              <div className="relative w-14 h-14 my-1 flex items-center justify-center">
                <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
                  <circle cx="32" cy="32" r="26" fill="none" stroke="#222226" strokeWidth="4" />
                  <circle
                    cx="32"
                    cy="32"
                    r="26"
                    fill="none"
                    stroke="#ff5500"
                    strokeWidth="4"
                    strokeDasharray={2 * Math.PI * 26}
                    strokeDashoffset={2 * Math.PI * 26 * (1 - pulseXY / 100)}
                    className="transition-all duration-500 shadow-[0_0_8px_#ff5500]"
                  />
                </svg>
                <span className="absolute text-[11px] font-mono-fui font-bold text-white">
                  {pulseXY}
                </span>
              </div>
            </div>
          </div>

          {/* System Protocol Telemetry Box */}
          <div className="p-2.5 bg-black/60 rounded-xl border border-white/10 text-[8.5px] font-mono-fui leading-relaxed space-y-0.5 text-zinc-300">
            <div className="text-[#ff5500] font-bold">
              SIS [ATIVO] // PROTOCOLO ALFA-000.101.112
            </div>
            <div>ALVO ADQUIRIDO // N 38°53'42" O 77°02'11"</div>
            <div className="text-zinc-500">LOC SECUNDÁRIA: 1909834763560 // VEÍCULO-Q v2.0004</div>
            <div>SAÍDA ESPACIAL // FREQUÊNCIA [Z] BLOQUEADA</div>
            <div className="text-white font-medium">SISTEMA-1 GROOT // MATRIZ BAYESIANA OK</div>
            <div className="text-[#ff5500]">ARXIV.ORG // TELEMETRIA NEURAL SINCRONIZADA</div>
          </div>
        </div>
      </div>
    </div>
  );
}
