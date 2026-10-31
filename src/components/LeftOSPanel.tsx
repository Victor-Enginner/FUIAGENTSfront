import { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Eye, EyeOff, Send, Video, VideoOff, Mic, MicOff } from 'lucide-react';
import { GestureResult, formatTacticalTimestamp, classifyGesture } from '../utils/fuiLogic';
import { fuiAudio } from './AudioSynthesizer';

interface LeftOSPanelProps {
  onGestureDetected?: (gesture: GestureResult) => void;
  onTriggerSearch?: (query: string) => void;
}

export function LeftOSPanel({
  onGestureDetected,
  onTriggerSearch,
}: LeftOSPanelProps) {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [visionOverlay, setVisionOverlay] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [grootScore, setGrootScore] = useState(0.951);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isMicActive, setIsMicActive] = useState(false);
  const [activeGesture, setActiveGesture] = useState<GestureResult>({
    type: 'open',
    confidence: 0.95,
    label: 'MODO: OPEN',
    actionDescription: 'Mão aberta / Rastreando',
  });

  const [logs, setLogs] = useState<string[]>([
    '[01:18:53] AGENTE-05 // RECONHECIMENTO: Janela FUI-033 materializada no canvas (1280x720)',
    '[01:18:54] AGENTE-05 // RECONHECIMENTO: Janela FUI-032 sincronizada com sucesso',
    '[01:18:55] GROOT-1 // CALIBRADOR: ArXiv 2604.08224 P(relevância) = 0.951 -> APROVADO',
    '[01:19:02] AGENTE-06 // TOPOLOGIA: Diagrama de fluxo neural estabelecido',
  ]);

  const logContainerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number>(0);
  const speechRecRef = useRef<any>(null);

  // Auto-scroll logs
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  // Periodic log telemetry events
  useEffect(() => {
    const timer = setInterval(() => {
      const timeStr = formatTacticalTimestamp();
      const events = [
        `${timeStr} AGENTE-02 // PESQUISA-AUTÔNOMA: Buscando novas interfaces neurais no ArXiv`,
        `${timeStr} GROOT-1 // CALIBRAÇÃO: Matriz Bayesiana atualizada com índice 0.952`,
        `${timeStr} AGENTE-04 // DESCOBERTA-FLUXO: Nó de telemetria materializado no canvas`,
        `${timeStr} AGENTE-01 // MOTOR-AIRLLM: Camada neural processada com 0% sobrecarga de GPU`,
      ];
      const nextEvent = events[Math.floor(Math.random() * events.length)];
      setLogs((prev) => [...prev.slice(-10), nextEvent]);
      setGrootScore((prev) => Math.min(0.999, Math.max(0.89, prev + (Math.random() - 0.48) * 0.003)));
    }, 10000);

    return () => clearInterval(timer);
  }, []);

  // Camera Toggle
  const toggleCamera = async () => {
    fuiAudio.playBlip(750);
    if (isCameraActive) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      setIsCameraActive(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 480 }, height: { ideal: 360 }, facingMode: 'user' },
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
        setIsCameraActive(true);
        fuiAudio.playChirp();
      } catch (err) {
        console.warn('Camera fallback:', err);
        setIsCameraActive(true);
      }
    }
  };

  // Mic Toggle
  const toggleMic = async () => {
    fuiAudio.playBlip(900);
    if (isMicActive) {
      if (speechRecRef.current) {
        try { speechRecRef.current.stop(); } catch {}
      }
      setIsMicActive(false);
    } else {
      const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRec) {
        try {
          const rec = new SpeechRec();
          rec.continuous = true;
          rec.interimResults = true;
          rec.lang = 'pt-BR';

          rec.onresult = (e: any) => {
            const current = e.resultIndex;
            const transcript = e.results[current][0].transcript;
            setSearchQuery(transcript);
            onTriggerSearch?.(transcript);
            fuiAudio.playBlip(1000);
          };

          rec.start();
          speechRecRef.current = rec;
        } catch (e) {
          console.warn('Speech error:', e);
        }
      }
      setIsMicActive(true);
      fuiAudio.playChirp();
    }
  };

  // Canvas processing loop
  useEffect(() => {
    const process = () => {
      if (!canvasRef.current) return;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (videoRef.current && videoRef.current.readyState >= 2) {
        ctx.save();
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        ctx.restore();

        // Minimalist fluorescent orange reticle
        ctx.strokeStyle = '#ff5500';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2, 26, 0, Math.PI * 2);
        ctx.stroke();
      } else if (isCameraActive) {
        // Monochromatic simulation with fluorescent orange tracker
        ctx.fillStyle = '#0a0a0c';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const t = Date.now() * 0.002;
        const cx = canvas.width / 2 + Math.sin(t) * 35;
        const cy = canvas.height / 2 + Math.cos(t) * 20;

        ctx.strokeStyle = '#ff5500';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(cx, cy, 22, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#ff5500';
        ctx.beginPath();
        ctx.arc(cx, cy, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      animFrameRef.current = requestAnimationFrame(process);
    };

    animFrameRef.current = requestAnimationFrame(process);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [isCameraActive]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const triggerGesture = (type: 'pan' | 'zoom' | 'pinch_click' | 'v_gesture') => {
    fuiAudio.playGestureDetect();
    const map: Record<string, GestureResult> = {
      pan: { type: 'pan', confidence: 0.98, label: '1 MÃO FECHADA', actionDescription: 'Mover Cenário (Pan)' },
      zoom: { type: 'zoom', confidence: 0.98, label: '2 MÃOS FECHADAS', actionDescription: 'Ampliar / Reduzir Cena' },
      pinch_click: { type: 'pinch_click', confidence: 0.99, label: 'PINÇA DETECTADA', actionDescription: 'Clicar / Arrastar Aba' },
      v_gesture: { type: 'v_gesture', confidence: 0.97, label: 'GESTO "V"', actionDescription: 'Fechar Tela / Reset' },
    };
    const g = map[type];
    setActiveGesture(g);
    onGestureDetected?.(g);
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;
    const q = searchQuery.trim();
    fuiAudio.playChirp();
    const timeStr = formatTacticalTimestamp();
    setLogs((prev) => [
      ...prev,
      `${timeStr} USER // TRIGGER: Pesquisa "${q}"`,
      `${timeStr} AGENT-07 // SYNTHESIS: Materializando novo fluxo no canvas`,
    ]);
    onTriggerSearch?.(q);
    setSearchQuery('');
  };

  const handleQuickTopic = (topic: string) => {
    fuiAudio.playBlip(880);
    const timeStr = formatTacticalTimestamp();
    setLogs((prev) => [...prev, `${timeStr} MULTI-SOURCE: ${topic}`]);
    onTriggerSearch?.(topic);
  };

  return (
    <aside className="w-[340px] md:w-[380px] max-h-[calc(100vh-100px)] flex flex-col liquid-glass-panel rounded-2xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.7)] overflow-y-auto pointer-events-auto transition-all select-none border border-white/10">
      <video ref={videoRef} className="hidden" playsInline muted autoPlay />

      {/* Header */}
      <div className="flex items-start justify-between pb-3 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#ff5500] shadow-[0_0_8px_#ff5500]" />
            <h2 className="text-xs font-hud font-bold tracking-wider text-white">
              AGENTES FUI // SISTEMA OPERACIONAL ESPACIAL COGNITIVO
            </h2>
          </div>
          <span className="text-[9px] font-mono-fui text-zinc-400 block mt-0.5">
            ARXIV + YOUTUBE + WEB + TEORIA MARCIANO GROOT-1
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              fuiAudio.enabled = !soundEnabled;
              fuiAudio.playBlip(600);
            }}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-zinc-300 border border-white/10 cursor-pointer transition"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-[#ff5500]" /> : <VolumeX className="w-3.5 h-3.5 text-zinc-500" />}
          </button>
          <button
            onClick={() => {
              setVisionOverlay(!visionOverlay);
              fuiAudio.playBlip(750);
            }}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-zinc-300 border border-white/10 cursor-pointer transition"
          >
            {visionOverlay ? <Eye className="w-3.5 h-3.5 text-[#ff5500]" /> : <EyeOff className="w-3.5 h-3.5 text-zinc-500" />}
          </button>
        </div>
      </div>

      {/* Camera & Mic Action Buttons */}
      <div className="grid grid-cols-2 gap-2 mt-3">
        <button
          onClick={toggleCamera}
          className={`py-2 px-2.5 rounded-xl border text-[11px] font-mono-fui font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            isCameraActive
              ? 'bg-[#ff5500]/20 border-[#ff5500] text-[#ff5500] shadow-[0_0_12px_rgba(255,85,0,0.3)]'
              : 'bg-white/5 border-white/15 text-zinc-300 hover:border-white/30'
          }`}
        >
          {isCameraActive ? <Video className="w-3.5 h-3.5 text-[#ff5500]" /> : <VideoOff className="w-3.5 h-3.5 text-zinc-400" />}
          <span>{isCameraActive ? 'MÃOS: ON' : 'LIGAR MÃOS'}</span>
        </button>

        <button
          onClick={toggleMic}
          className={`py-2 px-2.5 rounded-xl border text-[11px] font-mono-fui font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            isMicActive
              ? 'bg-[#ff5500]/20 border-[#ff5500] text-[#ff5500] shadow-[0_0_12px_rgba(255,85,0,0.3)]'
              : 'bg-white/5 border-white/15 text-zinc-300 hover:border-white/30'
          }`}
        >
          {isMicActive ? <Mic className="w-3.5 h-3.5 text-[#ff5500]" /> : <MicOff className="w-3.5 h-3.5 text-zinc-400" />}
          <span>{isMicActive ? 'VOZ: ON' : 'LIGAR VOZ'}</span>
        </button>
      </div>

      {/* Mini Camera Monitor Box */}
      <div className="relative w-full h-[120px] bg-black/60 rounded-xl border border-white/15 overflow-hidden my-3">
        <canvas ref={canvasRef} width={280} height={120} className="w-full h-full object-cover" />
        <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-0.5 bg-black/80 border border-white/20 rounded text-[9px] font-mono-fui text-white">
          <span className="w-1.5 h-1.5 rounded-full bg-[#ff5500]" />
          <span>{activeGesture.label}</span>
        </div>
        <div className="absolute bottom-1.5 left-2 right-2 flex items-center justify-between text-[8.5px] font-mono-fui text-zinc-400 bg-black/70 px-2 py-0.5 rounded">
          <span className="text-white">{isCameraActive ? 'CV 60FPS // WebGL' : 'CAMERA OFF'}</span>
          <span className="text-zinc-300">{activeGesture.actionDescription}</span>
        </div>
      </div>

      {/* Gesture Simulation Chips */}
      <div className="flex items-center justify-between gap-1 text-[9px] font-mono-fui text-zinc-400 pb-2">
        <span>GESTOS:</span>
        <button
          onClick={() => triggerGesture('pan')}
          className="px-2 py-0.5 bg-white/5 hover:bg-white/15 border border-white/10 text-white rounded cursor-pointer"
        >
          ✊ Pan
        </button>
        <button
          onClick={() => triggerGesture('zoom')}
          className="px-2 py-0.5 bg-white/5 hover:bg-white/15 border border-white/10 text-white rounded cursor-pointer"
        >
          ✊+✊ Zoom
        </button>
        <button
          onClick={() => triggerGesture('pinch_click')}
          className="px-2 py-0.5 bg-white/5 hover:bg-white/15 border border-white/10 text-white rounded cursor-pointer"
        >
          👌 Pinça
        </button>
        <button
          onClick={() => triggerGesture('v_gesture')}
          className="px-2 py-0.5 bg-white/5 hover:bg-white/15 border border-white/10 text-white rounded cursor-pointer"
        >
          ✌ Reset
        </button>
      </div>

      {/* Groot-1 Calibration Bar */}
      <div className="p-2.5 bg-black/40 rounded-xl border border-white/10 flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-[10px] font-hud font-bold">
          <span className="flex items-center gap-1.5 text-zinc-300">
            <span className="w-1.5 h-1.5 rounded bg-[#ff5500]" />
            GROOT 1 CALIBRATION:
          </span>
          <span className="text-[#ff5500] font-mono-fui text-xs">{grootScore.toFixed(3)}</span>
        </div>
        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#ff5500] transition-all duration-300 shadow-[0_0_8px_#ff5500]"
            style={{ width: `${grootScore * 100}%` }}
          />
        </div>
      </div>

      {/* Search Input */}
      <form onSubmit={handleSearchSubmit} className="mt-3">
        <div className="relative flex items-center">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Diga ou digite: 'Pesquisar arxiv'..."
            className="w-full py-2 pl-3 pr-8 bg-black/50 border border-white/20 rounded-xl text-[11px] font-mono-fui text-white placeholder-zinc-500 focus:outline-none focus:border-[#ff5500] transition"
          />
          <button type="submit" className="absolute right-2 p-1 text-[#ff5500] hover:text-white cursor-pointer">
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>

      {/* Multi-Source Shortcuts */}
      <div className="mt-3">
        <span className="text-[9px] font-mono-fui text-zinc-400 uppercase block mb-1.5 tracking-wider">
          INTELIGÊNCIA MULTI-FONTE:
        </span>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => handleQuickTopic('ArXiv 2604.08224: Diagramas de IA')}
            className="p-2 bg-black/40 hover:bg-white/10 border border-white/10 text-left rounded-lg cursor-pointer transition text-[10px] font-mono-fui"
          >
            <span className="text-white block font-bold">ArXiv 2604.08224:</span>
            <span className="text-zinc-400">Diagramas de IA</span>
          </button>

          <button
            onClick={() => handleQuickTopic('YouTube: Reconhecimento HUD')}
            className="p-2 bg-black/40 hover:bg-white/10 border border-white/10 text-left rounded-lg cursor-pointer transition text-[10px] font-mono-fui"
          >
            <span className="text-[#ff5500] block font-bold">YouTube:</span>
            <span className="text-zinc-400">Reconhecimento HUD</span>
          </button>

          <button
            onClick={() => handleQuickTopic('Militar: Comando Tático Aéreo')}
            className="p-2 bg-black/40 hover:bg-white/10 border border-white/10 text-left rounded-lg cursor-pointer transition text-[10px] font-mono-fui"
          >
            <span className="text-white block font-bold">Militar:</span>
            <span className="text-zinc-400">Comando Aéreo</span>
          </button>

          <button
            onClick={() => handleQuickTopic('CERN LHC & Telemetria Web')}
            className="p-2 bg-black/40 hover:bg-white/10 border border-white/10 text-left rounded-lg cursor-pointer transition text-[10px] font-mono-fui"
          >
            <span className="text-[#ff5500] block font-bold">CERN LHC:</span>
            <span className="text-zinc-400">Telemetria Web</span>
          </button>
        </div>
      </div>

      {/* Status Engine Banner */}
      <div className="mt-3 py-1.5 px-3 bg-black/60 border border-white/10 rounded-lg text-center text-[9.5px] font-mono-fui text-white font-medium tracking-wider">
        AIRLLM + ARXIV CORR + AGENTES LEVES (0% GPU)
      </div>

      {/* Terminal Real-Time Event Log Box */}
      <div className="mt-2.5">
        <div className="text-[8.5px] font-mono-fui text-zinc-400 uppercase mb-1">
          LOGS DE EXECUÇÃO EM TEMPO REAL:
        </div>
        <div
          ref={logContainerRef}
          className="h-[75px] p-2 bg-black/70 border border-white/10 rounded-lg overflow-y-auto text-[8.5px] font-mono-fui space-y-1"
        >
          {logs.map((log, index) => (
            <div key={index} className="text-zinc-300 leading-tight">
              {log}
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
