import { useState, useRef, useEffect, MouseEvent as ReactMouseEvent } from 'react';
import { Play, Pause, Volume2, VolumeX, FileText, Cpu } from 'lucide-react';
import { generateBezierConnector, Point2D } from '../utils/fuiLogic';
import { fuiAudio } from './AudioSynthesizer';

export interface MindNode {
  id: string;
  title: string;
  subtitle: string;
  x: number;
  y: number;
  type: 'video' | 'arxiv' | 'recon' | 'spectrogram' | 'agent';
  confidence: number;
  thumbnailUrl?: string;
  youtubeId?: string;
  isPlaying?: boolean;
}

interface SpatialMindMapProps {
  gestureAction?: string;
  searchTrigger?: string;
}

export function SpatialMindMap({ gestureAction, searchTrigger }: SpatialMindMapProps) {
  const [nodes, setNodes] = useState<MindNode[]>([
    {
      id: 'node-yt-main',
      title: 'YouTube: Reconhecimento HUD Iron Man',
      subtitle: 'Janela FUI-033 materializada no canvas (1280x720)',
      x: 390,
      y: 150,
      type: 'video',
      confidence: 0.952,
      youtubeId: 'BbUNGSYVTK0',
      isPlaying: false,
    },
    {
      id: 'node-arxiv-1',
      title: 'ArXiv 2604.08224: Diagramas de IA',
      subtitle: 'Extração por Camadas AirLLM & Telemetria Zero GPU',
      x: 100,
      y: 280,
      type: 'arxiv',
      confidence: 0.891,
    },
    {
      id: 'node-spectro',
      title: 'Espectrograma Topográfico e Fluxo',
      subtitle: 'Elevação Espectral & Fluxo de Dados Topológico',
      x: 750,
      y: 190,
      type: 'spectrogram',
      confidence: 0.945,
    },
    {
      id: 'node-recon-c4isr',
      title: 'Militar: Estrutura de Comando Aéreo',
      subtitle: 'Calibração de Decisão Groot-1 & Camadas Espaciais',
      x: 490,
      y: 440,
      type: 'recon',
      confidence: 0.951,
    },
  ]);

  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [pan, setPan] = useState<Point2D>({ x: 40, y: 30 });
  const [zoom, setZoom] = useState<number>(0.95);
  const isDraggingCanvasRef = useRef(false);
  const startDragRef = useRef<Point2D>({ x: 0, y: 0 });

  useEffect(() => {
    if (searchTrigger) {
      const newNode: MindNode = {
        id: `node-${Date.now()}`,
        title: searchTrigger,
        subtitle: 'Agente gerador de fluxo automatizado em tempo real',
        x: 400 + (Math.random() - 0.5) * 180,
        y: 300 + (Math.random() - 0.5) * 140,
        type: 'agent',
        confidence: 0.92 + Math.random() * 0.07,
      };
      setNodes((prev) => [...prev, newNode]);
      fuiAudio.playChirp();
    }
  }, [searchTrigger]);

  useEffect(() => {
    if (gestureAction === 'pan') {
      setPan((p) => ({ x: p.x + 30, y: p.y }));
    } else if (gestureAction === 'zoom') {
      setZoom((z) => Math.min(1.5, z + 0.15));
    } else if (gestureAction === 'v_gesture') {
      setPan({ x: 40, y: 30 });
      setZoom(0.95);
    }
  }, [gestureAction]);

  const handleMouseDown = (e: ReactMouseEvent) => {
    if ((e.target as HTMLElement).closest('.mindmap-card')) return;
    isDraggingCanvasRef.current = true;
    startDragRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: ReactMouseEvent) => {
    if (!isDraggingCanvasRef.current) return;
    setPan({
      x: e.clientX - startDragRef.current.x,
      y: e.clientY - startDragRef.current.y,
    });
  };

  const handleMouseUp = () => {
    isDraggingCanvasRef.current = false;
  };

  return (
    <div
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className="relative w-full h-full bg-transparent overflow-hidden cursor-grab active:cursor-grabbing select-none"
    >
      {/* Background Monochrome Radar Rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-15">
        <div className="w-[820px] h-[820px] border border-white/40 rounded-full" />
        <div className="absolute w-[590px] h-[590px] border border-dashed border-white/50 rounded-full" />
        <div className="absolute w-[360px] h-[360px] border border-white/40 rounded-full" />
      </div>

      {/* SVG Connecting Bezier Lines (Fluorescent Orange & White) */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
        }}
      >
        <defs>
          <linearGradient id="neonOrangeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ff5500" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.4" />
          </linearGradient>
        </defs>

        {nodes.map((node, i) => {
          if (i === 0) return null;
          const parent = nodes[0];
          const path = generateBezierConnector(
            { x: parent.x + 160, y: parent.y + 70 },
            { x: node.x + 140, y: node.y + 50 }
          );
          return (
            <g key={`edge-${node.id}`}>
              <path
                d={path}
                fill="none"
                stroke="url(#neonOrangeGrad)"
                strokeWidth="1.8"
                strokeDasharray="4 2"
                opacity="0.75"
              />
              <circle cx={node.x + 140} cy={node.y + 50} r="3.5" fill="#ff5500" />
            </g>
          );
        })}
      </svg>

      {/* Scalable Node Container */}
      <div
        className="absolute inset-0 z-20 pointer-events-none"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
        }}
      >
        {nodes.map((node) => (
          <div
            key={node.id}
            style={{ left: `${node.x}px`, top: `${node.y}px` }}
            className="absolute pointer-events-auto mindmap-card"
          >
            {node.type === 'video' ? (
              /* YouTube Video Card in Monochrome Glass & Fluorescent Orange */
              <div className="w-[330px] rounded-2xl liquid-glass-panel border border-[#ff5500]/50 shadow-[0_20px_45px_rgba(0,0,0,0.8)] overflow-hidden backdrop-blur-xl">
                {/* Header bar */}
                <div className="flex items-center justify-between px-3.5 py-2 bg-black/60 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#ff5500] shadow-[0_0_8px_#ff5500]" />
                    <button
                      onClick={() => {
                        setActiveVideoId(activeVideoId ? null : node.youtubeId || null);
                        fuiAudio.playChirp();
                      }}
                      className="px-2.5 py-1 bg-[#ff5500] hover:bg-[#ff6611] text-black text-[10px] font-bold font-hud rounded-full flex items-center gap-1 cursor-pointer transition shadow-sm"
                    >
                      {activeVideoId ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                      <span>{activeVideoId ? 'TOCANDO COM SOM' : 'OUVIR VÍDEO AQUI'}</span>
                    </button>
                  </div>
                  <span className="text-[10px] font-mono-fui text-[#ff5500] font-bold">
                    G1 - {node.confidence.toFixed(3)}
                  </span>
                </div>

                {/* Video Container */}
                <div className="relative w-full h-[180px] bg-black">
                  {activeVideoId ? (
                    <iframe
                      src={`https://www.youtube.com/embed/${node.youtubeId}?autoplay=1&mute=${isAudioMuted ? 1 : 0}&enablejsapi=1`}
                      title="FUI Recon Video"
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <div
                      onClick={() => {
                        setActiveVideoId(node.youtubeId || null);
                        fuiAudio.playChirp();
                      }}
                      className="w-full h-full relative cursor-pointer group flex items-center justify-center bg-black/80"
                    >
                      {/* Monochromatic SVG Preview */}
                      <svg viewBox="0 0 200 140" className="w-full h-full p-4 opacity-50 group-hover:opacity-80 transition">
                        <ellipse cx="100" cy="70" rx="70" ry="45" fill="none" stroke="#ffffff" strokeWidth="1" strokeDasharray="3 2" />
                        <ellipse cx="100" cy="70" rx="50" ry="60" fill="none" stroke="#ff5500" strokeWidth="1" />
                        <circle cx="100" cy="70" r="16" fill="none" stroke="#ffffff" strokeWidth="1" />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/20 transition">
                        <div className="w-12 h-12 rounded-full bg-[#ff5500] text-black flex items-center justify-center shadow-lg group-hover:scale-110 transition">
                          <Play className="w-5 h-5 ml-0.5 fill-black" />
                        </div>
                      </div>
                      <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[10px] font-mono-fui text-white">
                        <span>RECONHECIMENTO: HUD IRON MAN</span>
                        <span className="text-[#ff5500]">FUI-033</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Controls */}
                <div className="p-2.5 bg-black/60 border-t border-white/10 flex items-center justify-between text-[10px] font-mono-fui">
                  <span className="text-zinc-300 truncate max-w-[200px]">{node.title}</span>
                  <button
                    onClick={() => {
                      setIsAudioMuted(!isAudioMuted);
                      fuiAudio.playBlip(600);
                    }}
                    className="p-1 hover:bg-white/10 text-white rounded cursor-pointer transition"
                  >
                    {isAudioMuted ? <VolumeX className="w-3.5 h-3.5 text-zinc-500" /> : <Volume2 className="w-3.5 h-3.5 text-[#ff5500]" />}
                  </button>
                </div>
              </div>
            ) : node.type === 'spectrogram' ? (
              /* Topographic Spectrogram Card in Monochrome + Orange */
              <div className="w-[300px] rounded-2xl liquid-glass-panel border border-white/15 p-3.5 shadow-xl backdrop-blur-xl">
                <div className="flex items-center justify-between pb-1.5 border-b border-white/10 mb-2">
                  <span className="text-[11px] font-hud font-bold text-white">{node.title}</span>
                  <span className="text-[9px] font-mono-fui text-[#ff5500]">92% ESPECTRAL</span>
                </div>

                <div className="relative w-full h-[95px] bg-black/70 rounded-xl border border-white/10 overflow-hidden p-1">
                  <svg viewBox="0 0 280 80" className="w-full h-full">
                    <path
                      d="M 10 60 Q 40 20, 80 50 T 150 30 T 210 60 T 270 20"
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth="1.5"
                    />
                    <path
                      d="M 10 70 Q 50 40, 90 65 T 160 45 T 220 70 T 270 35"
                      fill="none"
                      stroke="#ff5500"
                      strokeWidth="1.5"
                    />
                    <path
                      d="M 10 50 Q 60 15, 110 40 T 180 20 T 240 50 T 270 15"
                      fill="none"
                      stroke="#888888"
                      strokeWidth="1.2"
                      opacity="0.6"
                    />
                  </svg>
                  <div className="absolute top-1 left-2 text-[8px] font-mono-fui text-zinc-400">
                    50HZ · 100HZ · 150HZ · 200HZ
                  </div>
                </div>

                <div className="mt-2 text-[10px] font-mono-fui text-zinc-300">
                  {node.subtitle}
                </div>
              </div>
            ) : (
              /* Standard Research & Agent Intelligence Node */
              <div className="w-[280px] rounded-2xl liquid-glass-panel border border-white/15 p-3.5 shadow-xl backdrop-blur-xl hover:border-[#ff5500]/50 transition">
                <div className="flex items-center justify-between pb-1.5 border-b border-white/10 mb-2">
                  <div className="flex items-center gap-1.5 text-white font-hud text-[11px] font-bold">
                    {node.type === 'arxiv' ? <FileText className="w-3.5 h-3.5 text-[#ff5500]" /> : <Cpu className="w-3.5 h-3.5 text-[#ff5500]" />}
                    <span className="truncate max-w-[180px]">{node.title}</span>
                  </div>
                  <span className="text-[9px] font-mono-fui text-[#ff5500]">
                    P = {node.confidence.toFixed(3)}
                  </span>
                </div>
                <p className="text-[10px] text-zinc-300 leading-relaxed font-sans mb-2">
                  {node.subtitle}
                </p>
                <div className="flex items-center justify-between pt-1 border-t border-white/10 text-[9px] font-mono-fui text-zinc-400">
                  <span className="text-[#ff5500]">ESTADO: ATIVO</span>
                  <span>AGENTE AUTÔNOMO</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Mini-map Locator in Bottom Right */}
      <div className="absolute bottom-6 right-6 w-44 h-32 liquid-glass-panel border border-white/15 rounded-2xl p-2.5 z-30 shadow-lg pointer-events-none">
        <div className="flex items-center justify-between text-[9px] font-mono-fui text-zinc-400 mb-1">
          <span>MINI-MAPA</span>
          <span className="text-[#ff5500] font-bold">{nodes.length} NÓS</span>
        </div>
        <div className="relative w-full h-[85px] bg-black/60 rounded-xl border border-white/10 overflow-hidden">
          {nodes.map((n) => (
            <div
              key={`dot-${n.id}`}
              style={{
                left: `${Math.min(90, Math.max(10, (n.x / 1000) * 100))}%`,
                top: `${Math.min(90, Math.max(10, (n.y / 600) * 100))}%`,
              }}
              className="absolute w-2 h-2 rounded-full bg-[#ff5500] -translate-x-1/2 -translate-y-1/2 shadow-[0_0_6px_#ff5500]"
            />
          ))}
          {/* Active viewport box */}
          <div
            style={{
              left: `${Math.min(60, Math.max(10, (-pan.x / 1000) * 100))}%`,
              top: `${Math.min(60, Math.max(10, (-pan.y / 600) * 100))}%`,
            }}
            className="absolute w-12 h-8 border border-white/40 bg-white/5"
          />
        </div>
      </div>
    </div>
  );
}
