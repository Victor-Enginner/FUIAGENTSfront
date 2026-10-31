import { useState, useRef, useEffect, useCallback } from 'react';
import { Video, VideoOff, Plus, Check, RotateCcw, Sparkles, Hand, Zap, ShieldCheck } from 'lucide-react';
import { classifyGesture, GestureResult } from '../utils/fuiLogic';
import { fuiAudio } from './AudioSynthesizer';

interface CameraGesturesViewProps {
  onGestureDetected?: (gesture: GestureResult) => void;
  activeGesture?: GestureResult | null;
}

interface CustomGesture {
  id: string;
  name: string;
  action: string;
  icon: string;
  confidence: number;
}

export function CameraGesturesView({
  onGestureDetected,
  activeGesture,
}: CameraGesturesViewProps) {
  const [isCameraActive, setIsCameraActive] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'learn' | 'create'>('learn');
  const [selectedTutorial, setSelectedTutorial] = useState<string>('pan');
  
  // Custom gesture creation state
  const [newGestureName, setNewGestureName] = useState<string>('Dois Indicadores');
  const [newGestureAction, setNewGestureAction] = useState<string>('Alternar Janela');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingProgress, setRecordingProgress] = useState<number>(0);
  const [recordingComplete, setRecordingComplete] = useState<boolean>(false);
  
  const [customGestures, setCustomGestures] = useState<CustomGesture[]>([
    {
      id: 'custom-1',
      name: 'Três Dedos Fechados',
      action: 'Disparar Agente ArXiv CoRR',
      icon: '🤟',
      confidence: 0.962,
    },
    {
      id: 'custom-2',
      name: 'Palma Aberta Estendida',
      action: 'Modo Mudo Imediato',
      icon: '✋',
      confidence: 0.948,
    },
  ]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number>(0);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setIsCameraActive(true);
    } catch (err) {
      console.warn('Camera fallback simulation:', err);
      setIsCameraActive(true);
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // Frame processing loop
  const processFrame = useCallback(() => {
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

      // Optical centroid detection
      const frameData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = frameData.data;
      let totalX = 0;
      let totalY = 0;
      let count = 0;

      for (let y = 0; y < canvas.height; y += 12) {
        for (let x = 0; x < canvas.width; x += 12) {
          const idx = (y * canvas.width + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          if (r > 95 && g > 40 && b > 20 && r > g && r - g > 15) {
            totalX += x;
            totalY += y;
            count++;
          }
        }
      }

      if (count > 20) {
        const cx = totalX / count;
        const cy = totalY / count;

        ctx.strokeStyle = '#ff5500';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, 28, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(cx - 36, cy);
        ctx.lineTo(cx + 36, cy);
        ctx.moveTo(cx, cy - 36);
        ctx.lineTo(cx, cy + 36);
        ctx.stroke();

        const simPoints = [
          { x: cx / canvas.width, y: cy / canvas.height },
          { x: (cx - 15) / canvas.width, y: (cy - 30) / canvas.height },
          { x: cx / canvas.width, y: (cy - 35) / canvas.height },
          { x: (cx + 15) / canvas.width, y: (cy - 25) / canvas.height },
          { x: (cx + 25) / canvas.width, y: (cy - 15) / canvas.height },
        ];
        const g = classifyGesture(simPoints, 1);
        onGestureDetected?.(g);
      }
    } else {
      ctx.fillStyle = '#0a0a0c';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const t = Date.now() * 0.002;
      const cx = canvas.width / 2 + Math.sin(t) * 35;
      const cy = canvas.height / 2 + Math.cos(t) * 20;

      ctx.strokeStyle = '#ff5500';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, 26, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#ff5500';
      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    animFrameRef.current = requestAnimationFrame(processFrame);
  }, [onGestureDetected]);

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(processFrame);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [processFrame]);

  const toggleCamera = () => {
    fuiAudio.playBlip(750);
    if (isCameraActive) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      setIsCameraActive(false);
    } else {
      startCamera();
    }
  };

  const triggerTutorialGesture = (type: 'pan' | 'zoom' | 'pinch_click' | 'v_gesture') => {
    fuiAudio.playGestureDetect();
    setSelectedTutorial(type);
    const map: Record<string, GestureResult> = {
      pan: { type: 'pan', confidence: 0.98, label: '1 MÃO FECHADA', actionDescription: 'Mover Cenário (Pan)' },
      zoom: { type: 'zoom', confidence: 0.98, label: '2 MÃOS FECHADAS', actionDescription: 'Ampliar / Reduzir Cena' },
      pinch_click: { type: 'pinch_click', confidence: 0.99, label: 'PINÇA DETECTADA', actionDescription: 'Clicar / Arrastar Aba' },
      v_gesture: { type: 'v_gesture', confidence: 0.97, label: 'GESTO "V"', actionDescription: 'Fechar Tela / Reset' },
    };
    onGestureDetected?.(map[type]);
  };

  // Start recording new custom gesture
  const handleStartRecording = () => {
    if (isRecording) return;
    fuiAudio.playChirp();
    setIsRecording(true);
    setRecordingProgress(0);
    setRecordingComplete(false);

    let progress = 0;
    const interval = setInterval(() => {
      progress += 5;
      setRecordingProgress(progress);
      if (progress % 20 === 0) {
        fuiAudio.playBlip(600 + progress * 4, 0.04);
      }
      if (progress >= 100) {
        clearInterval(interval);
        setIsRecording(false);
        setRecordingComplete(true);
        fuiAudio.playGestureDetect();

        // Add newly calibrated gesture
        const newG: CustomGesture = {
          id: `custom-${Date.now()}`,
          name: newGestureName || 'Gesto Personalizado',
          action: newGestureAction || 'Ação FUI Personalizada',
          icon: '✨',
          confidence: +(0.94 + Math.random() * 0.05).toFixed(3),
        };
        setCustomGestures((prev) => [newG, ...prev]);
      }
    }, 80);
  };

  const tutorialList = [
    {
      id: 'pan',
      title: '✊ 1 Mão Fechada',
      subtitle: 'Mover Cenário (Pan)',
      badge: 'BÁSICO',
      description: 'Feche uma das mãos em punho firme na frente do sensor. Arraste suavemente no ar para movimentar o mapa espacial 3D em qualquer direção.',
      actionDetail: 'Delta de deslocamento XY relativo ao centro da tela.',
    },
    {
      id: 'zoom',
      title: '✊+✊ 2 Mãos Fechadas',
      subtitle: 'Zoom In / Out (Escala)',
      badge: 'PROFUNDIDADE',
      description: 'Feche os dois punhos no campo visual. Afaste as mãos para ampliar (Zoom In) ou aproxime-as para reduzir a escala espacial (Zoom Out).',
      actionDetail: 'Cálculo euclidiano da distância entre punhos com interpolação linear.',
    },
    {
      id: 'pinch_click',
      title: '👌 Pinça de Dedo',
      subtitle: 'Clicar / Arrastar Aba',
      badge: 'PRECISÃO',
      description: 'Encoste a ponta do dedo indicador na ponta do polegar. Use para selecionar nós de agentes, dar play em vídeos ou ancorar janelas de telemetria.',
      actionDetail: 'Threshold de proximidade < 0.05 com feedback sonoro tático.',
    },
    {
      id: 'v_gesture',
      title: '✌ Gesto "V"',
      subtitle: 'Reset de Visualização',
      badge: 'SISTEMA',
      description: 'Estenda o indicador e o dedo médio em formato de "V" (Vitória). Reseta a câmera espacial para o centro (0, 0) e zoom padrão 1.0x.',
      actionDetail: 'Classificação angular de dois dedos abertos com palma virada para a frente.',
    },
  ];

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-start overflow-y-auto px-4 pt-20 pb-8 select-none">
      {/* Header Container */}
      <div className="w-full max-w-5xl mb-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#ff5500] shadow-[0_0_8px_#ff5500]" />
            <h1 className="text-sm md:text-base font-hud font-bold tracking-wider text-white uppercase">
              LABORATÓRIO DE APRENDIZADO & CRIAÇÃO DE GESTOS
            </h1>
          </div>
          <p className="text-[11px] font-mono-fui text-zinc-400 mt-0.5">
            TREINE OS GESTOS DA INTERFACE SPATIAL OU CALIBRE NOVOS GESTOS PERSONALIZADOS
          </p>
        </div>

        {/* Tab Switcher: Aprender vs Criar */}
        <div className="liquid-glass-panel rounded-full p-1 flex items-center gap-1 shrink-0 border border-white/10">
          <button
            onClick={() => {
              setActiveTab('learn');
              fuiAudio.playBlip(700);
            }}
            className={`px-4 py-1.5 rounded-full text-xs font-mono-fui font-medium transition cursor-pointer ${
              activeTab === 'learn'
                ? 'bg-[#ff5500] text-black font-bold shadow-[0_0_10px_rgba(255,85,0,0.5)]'
                : 'text-zinc-300 hover:text-white'
            }`}
          >
            Aprender Gestos
          </button>
          <button
            onClick={() => {
              setActiveTab('create');
              fuiAudio.playBlip(850);
            }}
            className={`px-4 py-1.5 rounded-full text-xs font-mono-fui font-medium transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'create'
                ? 'bg-[#ff5500] text-black font-bold shadow-[0_0_10px_rgba(255,85,0,0.5)]'
                : 'text-zinc-300 hover:text-white'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Criar Novo Gesto</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left is Video/Live Feed, Right is Learning Cards or Creation Form */}
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN: Live Camera Feed & Sensor Reticle (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          <div className="relative w-full h-[320px] rounded-3xl overflow-hidden liquid-glass-panel border border-white/15 shadow-2xl flex items-center justify-center">
            <video ref={videoRef} className="hidden" playsInline muted autoPlay />
            <canvas
              ref={canvasRef}
              width={480}
              height={320}
              className="w-full h-full object-cover"
            />

            {/* Top telemetry bar */}
            <div className="absolute top-3 left-4 right-4 flex items-center justify-between text-[10px] font-mono-fui pointer-events-none">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/70 border border-white/10 text-white">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ff5500] shadow-[0_0_6px_#ff5500]" />
                <span>CV SENSOR · 60 FPS</span>
              </div>
              <div className="px-2.5 py-1 rounded-full bg-black/70 border border-white/10 text-[#ff5500]">
                LATÊNCIA: 0ms
              </div>
            </div>

            {/* Center Reticle */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative w-32 h-32 border border-white/20 rounded-full flex items-center justify-center">
                <div className="w-16 h-16 border border-dashed border-[#ff5500]/60 rounded-full animate-spin [animation-duration:16s]" />
                <div className="w-2 h-2 rounded-full bg-[#ff5500] shadow-[0_0_8px_#ff5500]" />
              </div>
            </div>

            {/* Bottom Camera Toggle */}
            <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between pointer-events-auto">
              <button
                onClick={toggleCamera}
                className="px-3.5 py-1.5 rounded-full liquid-glass-button text-xs font-mono-fui text-white flex items-center gap-2 cursor-pointer shadow-lg hover:border-[#ff5500]"
              >
                {isCameraActive ? (
                  <Video className="w-3.5 h-3.5 text-[#ff5500]" />
                ) : (
                  <VideoOff className="w-3.5 h-3.5 text-zinc-400" />
                )}
                <span>{isCameraActive ? 'WEBCAM LIGADA' : 'LIGAR WEBCAM'}</span>
              </button>

              <div className="px-2.5 py-1 rounded-full bg-black/80 border border-white/15 text-[10px] font-mono-fui text-zinc-300">
                GROOT-1: 0.952
              </div>
            </div>
          </div>

          {/* Active Gesture Live Diagnostic Card */}
          <div className="liquid-glass-panel rounded-2xl p-3 border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-black/60 border border-[#ff5500]/50 flex items-center justify-center text-[#ff5500]">
                <Hand className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[9px] font-mono-fui text-zinc-400 uppercase block">
                  GESTO ATIVO DETECTADO:
                </span>
                <span className="text-xs font-mono-fui font-bold text-white">
                  {activeGesture?.label || 'MÃO ABERTA // RASTREANDO'}
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[9px] font-mono-fui text-zinc-400 block">CONFIANÇA</span>
              <span className="text-xs font-mono-fui font-bold text-[#ff5500]">
                {((activeGesture?.confidence || 0.95) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Mode-dependent view (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          {activeTab === 'learn' ? (
            /* ============================================================ */
            /* TAB 1: APRENDER GESTOS (Tutorial Cards & Practice)           */
            /* ============================================================ */
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between text-xs font-mono-fui text-zinc-400 pb-1">
                <span>SELECIONE UM GESTO PARA APRENDER E PRATICAR:</span>
                <span className="text-[#ff5500] font-bold">4 GESTOS CORE</span>
              </div>

              {tutorialList.map((item) => {
                const isSelected = selectedTutorial === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => triggerTutorialGesture(item.id as any)}
                    className={`liquid-glass-panel rounded-2xl p-4 border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#ff5500] bg-white/[0.08] shadow-[0_0_20px_rgba(255,85,0,0.2)]'
                        : 'border-white/10 hover:border-white/25 hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{item.title.split(' ')[0]}</span>
                        <h3 className="text-sm font-hud font-bold text-white">
                          {item.title.substring(item.title.indexOf(' ') + 1)}
                        </h3>
                        <span className="text-xs font-mono-fui text-zinc-400">· {item.subtitle}</span>
                      </div>

                      <span
                        className={`text-[9px] font-mono-fui px-2 py-0.5 rounded-full border ${
                          isSelected
                            ? 'bg-[#ff5500]/20 border-[#ff5500] text-[#ff5500] font-bold'
                            : 'bg-black/50 border-white/10 text-zinc-400'
                        }`}
                      >
                        {item.badge}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-300 font-sans mt-2 leading-relaxed">
                      {item.description}
                    </p>

                    <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-[10px] font-mono-fui">
                      <span className="text-zinc-500">{item.actionDetail}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerTutorialGesture(item.id as any);
                        }}
                        className={`px-3 py-1 rounded-full text-[10px] font-mono-fui font-medium cursor-pointer transition ${
                          isSelected
                            ? 'bg-[#ff5500] text-black font-bold'
                            : 'bg-white/10 hover:bg-white/20 text-white'
                        }`}
                      >
                        {isSelected ? '✓ Praticando Agora' : 'Praticar Gesto'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* ============================================================ */
            /* TAB 2: CRIAR / CALIBRAR NOVO GESTO                           */
            /* ============================================================ */
            <div className="flex flex-col gap-4">
              {/* Creation Form Box */}
              <div className="liquid-glass-panel rounded-2xl p-5 border border-[#ff5500]/40 shadow-xl">
                <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#ff5500]" />
                    <h3 className="text-xs font-hud font-bold text-white uppercase tracking-wider">
                      GRAVADOR & CALIBRADOR DE NOVO GESTO
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono-fui text-zinc-400">
                    SISTEMA BAYESIANO GROOT-1
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className="text-[10px] font-mono-fui text-zinc-400 block mb-1">
                      NOME DO GESTO:
                    </label>
                    <input
                      type="text"
                      value={newGestureName}
                      onChange={(e) => setNewGestureName(e.target.value)}
                      placeholder="Ex: Três Dedos Abertos"
                      className="w-full px-3 py-2 bg-black/60 border border-white/20 rounded-xl text-xs font-mono-fui text-white focus:outline-none focus:border-[#ff5500]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono-fui text-zinc-400 block mb-1">
                      AÇÃO ASSOCIADA NA INTERFACE:
                    </label>
                    <select
                      value={newGestureAction}
                      onChange={(e) => setNewGestureAction(e.target.value)}
                      className="w-full px-3 py-2 bg-black/60 border border-white/20 rounded-xl text-xs font-mono-fui text-white focus:outline-none focus:border-[#ff5500] cursor-pointer"
                    >
                      <option value="Alternar Janela">Alternar Janela / Mover Foco</option>
                      <option value="Modo Mudo">Ativar / Desativar Áudio</option>
                      <option value="Screenshot FUI">Capturar Screenshot Telemetria</option>
                      <option value="Disparar Agente ArXiv">Disparar Agente ArXiv</option>
                      <option value="Resetar Posição">Resetar Posição do Canvas</option>
                    </select>
                  </div>
                </div>

                {/* Calibration progress bar during recording */}
                {isRecording && (
                  <div className="mb-4 p-3 bg-black/70 rounded-xl border border-[#ff5500]/50">
                    <div className="flex items-center justify-between text-xs font-mono-fui mb-1.5">
                      <span className="text-white flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#ff5500] animate-ping" />
                        GRAVANDO POSTURA DE MÃO... FAÇA O GESTO EM FRENTE À CÂMERA
                      </span>
                      <span className="text-[#ff5500] font-bold">{recordingProgress}%</span>
                    </div>
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#ff5500] to-[#ffaa00] transition-all duration-100 shadow-[0_0_8px_#ff5500]"
                        style={{ width: `${recordingProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Success state */}
                {recordingComplete && !isRecording && (
                  <div className="mb-4 p-3 bg-[#ff5500]/15 border border-[#ff5500] rounded-xl flex items-center justify-between text-xs font-mono-fui">
                    <div className="flex items-center gap-2 text-white">
                      <Check className="w-4 h-4 text-[#ff5500]" />
                      <span>GESTO CALIBRADO COM SUCESSO! ADICIONADO AO SEU PERFIL.</span>
                    </div>
                    <span className="text-[#ff5500] font-bold">SCORE: 0.968</span>
                  </div>
                )}

                {/* Record Button */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleStartRecording}
                    disabled={isRecording}
                    className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-mono-fui font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition ${
                      isRecording
                        ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                        : 'bg-[#ff5500] text-black hover:bg-[#ff6600] shadow-[0_0_15px_rgba(255,85,0,0.4)]'
                    }`}
                  >
                    <Zap className="w-4 h-4 fill-current" />
                    <span>{isRecording ? 'Gravando Amostras (Mantenha o Gesto)...' : 'Gravar e Calibrar Gesto'}</span>
                  </button>

                  {recordingComplete && (
                    <button
                      onClick={() => {
                        setRecordingComplete(false);
                        setRecordingProgress(0);
                        fuiAudio.playBlip(700);
                      }}
                      className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-zinc-300 border border-white/15 cursor-pointer"
                      title="Gravar outro"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* List of active custom gestures */}
              <div>
                <span className="text-[10px] font-mono-fui text-zinc-400 uppercase block mb-2">
                  GESTOS PERSONALIZADOS GRAVADOS ({customGestures.length}):
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {customGestures.map((cg) => (
                    <div
                      key={cg.id}
                      className="p-3 liquid-glass-panel rounded-xl border border-white/10 flex items-center justify-between hover:border-[#ff5500]/50 transition"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-lg">{cg.icon}</span>
                        <div>
                          <span className="text-xs font-mono-fui font-bold text-white block">
                            {cg.name}
                          </span>
                          <span className="text-[10px] font-mono-fui text-zinc-400">
                            {cg.action}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[9px] font-mono-fui text-[#ff5500] block font-bold">
                          {(cg.confidence * 100).toFixed(1)}%
                        </span>
                        <button
                          onClick={() => {
                            fuiAudio.playGestureDetect();
                            onGestureDetected?.({
                              type: 'pan',
                              confidence: cg.confidence,
                              label: cg.name.toUpperCase(),
                              actionDescription: cg.action,
                            });
                          }}
                          className="mt-1 px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-[9px] font-mono-fui text-white cursor-pointer"
                        >
                          Testar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
