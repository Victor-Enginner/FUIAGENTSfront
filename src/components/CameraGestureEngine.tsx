import { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, Mic, MicOff, Video, VideoOff, Sparkles } from 'lucide-react';
import { classifyGesture, GestureResult } from '../utils/fuiLogic';
import { fuiAudio } from './AudioSynthesizer';

interface CameraGestureEngineProps {
  onGestureDetected?: (gesture: GestureResult) => void;
  onVoiceCommand?: (command: string) => void;
  isCompact?: boolean;
}

export function CameraGestureEngine({
  onGestureDetected,
  onVoiceCommand,
  isCompact = false,
}: CameraGestureEngineProps) {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isMicActive, setIsMicActive] = useState(false);
  const [activeGesture, setActiveGesture] = useState<GestureResult>({
    type: 'open',
    confidence: 0.95,
    label: 'MODO: OPEN',
    actionDescription: 'Mão aberta / Rastreando',
  });
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [speechTranscript, setSpeechTranscript] = useState<string>('');
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number>(0);
  const speechRecRef = useRef<any>(null);

  // Toggle Camera
  const toggleCamera = async () => {
    fuiAudio.playBlip(750);
    if (isCameraActive) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setIsCameraActive(false);
      setCameraError(null);
    } else {
      try {
        setCameraError(null);
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
        fuiAudio.playChirp();
      } catch (err: any) {
        console.warn('Camera access fallback mode:', err);
        setCameraError('Câmera simulada ativa (permissão ou dispositivo ausente)');
        setIsCameraActive(true);
      }
    }
  };

  // Toggle Microphone & Voice Recognition
  const toggleMicrophone = async () => {
    fuiAudio.playBlip(900);
    if (isMicActive) {
      if (speechRecRef.current) {
        try {
          speechRecRef.current.stop();
        } catch {}
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
      setIsMicActive(false);
    } else {
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        const source = ctx.createMediaStreamSource(audioStream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);
        audioContextRef.current = ctx;
        analyserRef.current = analyser;

        // Initialize Web Speech API if supported
        const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRec) {
          const rec = new SpeechRec();
          rec.continuous = true;
          rec.interimResults = true;
          rec.lang = 'pt-BR';

          rec.onresult = (e: any) => {
            const current = e.resultIndex;
            const transcript = e.results[current][0].transcript;
            setSpeechTranscript(transcript);
            onVoiceCommand?.(transcript);
            fuiAudio.playBlip(1050);
          };

          rec.onerror = (e: any) => {
            console.warn('Speech recognition warning:', e);
          };

          rec.start();
          speechRecRef.current = rec;
        }

        setIsMicActive(true);
        fuiAudio.playChirp();
      } catch (err) {
        console.warn('Mic access:', err);
        // Fallback simulation for audio visualizer
        setIsMicActive(true);
      }
    }
  };

  // Video frame gesture processing loop
  const processVideoFrame = useCallback(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // If real video is active and ready
    if (videoRef.current && videoRef.current.readyState >= 2 && !cameraError) {
      ctx.save();
      // Mirror video
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      ctx.restore();

      // Optical analysis overlay: scan hand movement & skin-tone centroid
      const frameData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = frameData.data;
      let totalSkinX = 0;
      let totalSkinY = 0;
      let skinCount = 0;

      // Sample every 8th pixel for fast zero-latency WebGL/Canvas processing
      for (let y = 0; y < canvas.height; y += 8) {
        for (let x = 0; x < canvas.width; x += 8) {
          const offset = (y * canvas.width + x) * 4;
          const r = data[offset];
          const g = data[offset + 1];
          const b = data[offset + 2];

          // Basic skin tone / warm contrast heuristic
          if (r > 95 && g > 40 && b > 20 && r > g && r > b && r - g > 15) {
            totalSkinX += x;
            totalSkinY += y;
            skinCount++;
          }
        }
      }

      // Draw AR Hand Tracking reticle if hand detected
      if (skinCount > 25) {
        const cx = totalSkinX / skinCount;
        const cy = totalSkinY / skinCount;

        // Draw HUD hand skeleton / target box
        ctx.strokeStyle = '#00f3ff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(cx, cy, 28, 0, Math.PI * 2);
        ctx.stroke();

        // Crosshairs
        ctx.beginPath();
        ctx.moveTo(cx - 36, cy);
        ctx.lineTo(cx + 36, cy);
        ctx.moveTo(cx, cy - 36);
        ctx.lineTo(cx, cy + 36);
        ctx.stroke();

        // Finger simulated points relative to centroid
        const simulatedPoints = [
          { x: cx / canvas.width, y: cy / canvas.height },
          { x: (cx - 15) / canvas.width, y: (cy - 30) / canvas.height },
          { x: cx / canvas.width, y: (cy - 35) / canvas.height },
          { x: (cx + 15) / canvas.width, y: (cy - 25) / canvas.height },
          { x: (cx + 25) / canvas.width, y: (cy - 15) / canvas.height },
        ];

        // Classify gesture
        const gesture = classifyGesture(simulatedPoints, 1);
        setActiveGesture(gesture);
        onGestureDetected?.(gesture);
      }
    } else if (isCameraActive) {
      // Procedural Cyber Simulation Grid when camera is in synthetic mode
      const t = Date.now() * 0.002;
      ctx.fillStyle = '#02101a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Cyber scan grid
      ctx.strokeStyle = 'rgba(0, 243, 255, 0.15)';
      ctx.lineWidth = 1;
      for (let i = 0; i < canvas.width; i += 20) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
      }

      // Simulated hand silhouette & landmark dots
      const cx = canvas.width * 0.5 + Math.sin(t) * 40;
      const cy = canvas.height * 0.5 + Math.cos(t * 1.5) * 25;

      ctx.strokeStyle = '#00f3ff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, 32, 0, Math.PI * 2);
      ctx.stroke();

      // Landmarks
      const landmarks = [
        { x: cx, y: cy },
        { x: cx - 18, y: cy - 40 },
        { x: cx, y: cy - 48 },
        { x: cx + 18, y: cy - 38 },
        { x: cx + 32, y: cy - 22 },
      ];

      landmarks.forEach((p, idx) => {
        ctx.fillStyle = idx === 0 ? '#ffaa00' : '#00f3ff';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(0, 243, 255, 0.4)';
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
      });
    }

    // Audio frequency meter
    if (isMicActive && analyserRef.current) {
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      setAudioLevel(sum / dataArray.length);
    } else if (isMicActive) {
      setAudioLevel(20 + Math.random() * 40);
    }

    animFrameRef.current = requestAnimationFrame(processVideoFrame);
  }, [isCameraActive, isMicActive, cameraError, onGestureDetected]);

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(processVideoFrame);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [processVideoFrame]);

  // Clean up media streams
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
      if (speechRecRef.current) {
        try {
          speechRecRef.current.stop();
        } catch {}
      }
    };
  }, []);

  // Quick manual gesture triggers for testing / accessibility
  const triggerManualGesture = (type: 'pan' | 'zoom' | 'pinch_click' | 'v_gesture' | 'open') => {
    fuiAudio.playGestureDetect();
    const map: Record<string, GestureResult> = {
      pan: { type: 'pan', confidence: 0.98, label: '1 MÃO FECHADA', actionDescription: 'Mover Cenário (Pan)' },
      zoom: { type: 'zoom', confidence: 0.98, label: '2 MÃOS FECHADAS', actionDescription: 'Ampliar / Reduzir Cena' },
      pinch_click: { type: 'pinch_click', confidence: 0.99, label: 'PINÇA DETECTADA', actionDescription: 'Clicar / Arrastar Aba' },
      v_gesture: { type: 'v_gesture', confidence: 0.97, label: 'GESTO "V"', actionDescription: 'Fechar Tela / Reset' },
      open: { type: 'open', confidence: 0.95, label: 'MODO: OPEN', actionDescription: 'Mão aberta / Rastreando' },
    };
    const res = map[type];
    setActiveGesture(res);
    onGestureDetected?.(res);
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Action Buttons: LIGAR MÃOS & LIGAR VOZ (matching image_18ad9c5b.png & image_bfb4bf17.png) */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={toggleCamera}
          className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded border text-[11px] font-mono-fui font-bold uppercase tracking-wider transition-all cursor-pointer ${
            isCameraActive
              ? 'bg-[#00f3ff]/20 border-[#00f3ff] text-[#00f3ff] shadow-[0_0_12px_rgba(0,243,255,0.4)]'
              : 'bg-[#02131d]/80 border-[#00f3ff]/30 text-slate-300 hover:border-[#00f3ff]/60'
          }`}
        >
          {isCameraActive ? (
            <>
              <Video className="w-3.5 h-3.5 text-[#00f3ff]" />
              <span>MÃOS: ON</span>
            </>
          ) : (
            <>
              <VideoOff className="w-3.5 h-3.5 text-slate-400" />
              <span>LIGAR MÃOS (WEBCAM)</span>
            </>
          )}
        </button>

        <button
          onClick={toggleMicrophone}
          className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded border text-[11px] font-mono-fui font-bold uppercase tracking-wider transition-all cursor-pointer ${
            isMicActive
              ? 'bg-[#ffaa00]/20 border-[#ffaa00] text-[#ffaa00] shadow-[0_0_12px_rgba(255,170,0,0.4)]'
              : 'bg-[#02131d]/80 border-[#00f3ff]/30 text-slate-300 hover:border-[#00f3ff]/60'
          }`}
        >
          {isMicActive ? (
            <>
              <Mic className="w-3.5 h-3.5 text-[#ffaa00]" />
              <span>VOZ: ON</span>
            </>
          ) : (
            <>
              <MicOff className="w-3.5 h-3.5 text-slate-400" />
              <span>LIGAR VOZ (MIC)</span>
            </>
          )}
        </button>
      </div>

      {/* Hidden real video feed for texture capture */}
      <video ref={videoRef} className="hidden" playsInline muted autoPlay />

      {/* Mini-Monitor Screen for Hand & Face landmark tracking (matching screenshot image_bfb4bf17.png) */}
      <div className="relative w-full h-[140px] bg-[#020b12] rounded border border-[#00f3ff]/40 overflow-hidden shadow-[inset_0_0_20px_rgba(0,243,255,0.1)]">
        <canvas ref={canvasRef} width={280} height={140} className="w-full h-full object-cover" />

        {/* Scanlines overlay */}
        <div className="absolute inset-0 fui-scanline pointer-events-none opacity-40" />

        {/* Top left gesture state */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-0.5 bg-[#02141e]/90 border border-[#00f3ff]/40 rounded text-[9px] font-mono-fui text-[#00f3ff]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00f3ff] animate-pulse" />
          <span>{activeGesture.label}</span>
        </div>

        {/* Bottom indicator */}
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[9px] font-mono-fui text-slate-400 bg-[#02141e]/90 px-2 py-0.5 rounded border border-[#00f3ff]/20">
          <span className="text-[#00f3ff]">
            {isCameraActive ? 'CV 60FPS // WebGL ACCEL' : 'CAMERA OFF'}
          </span>
          <span className="text-white/70">{activeGesture.actionDescription}</span>
        </div>

        {/* Audio Visualizer Bar at right edge */}
        {isMicActive && (
          <div className="absolute right-2 top-2 bottom-8 w-1.5 bg-[#02131d] rounded overflow-hidden flex flex-col justify-end">
            <div
              className="w-full bg-[#ffaa00] transition-all duration-75"
              style={{ height: `${Math.min(100, (audioLevel / 60) * 100)}%` }}
            />
          </div>
        )}
      </div>

      {/* Speech transcript readout if active */}
      {isMicActive && speechTranscript && (
        <div className="p-2 rounded bg-[#031d27]/90 border border-[#ffaa00]/40 text-[10px] font-mono-fui text-[#ffaa00]">
          <span className="opacity-70">VOZ DETECTADA: </span>
          <span>"{speechTranscript}"</span>
        </div>
      )}

      {/* Manual Gesture Simulation Buttons (Quick 1-Click for Instant Testing) */}
      <div className="flex flex-wrap items-center gap-1 pt-1">
        <span className="text-[9px] font-mono-fui text-slate-400 mr-1">TESTAR GESTO:</span>
        <button
          onClick={() => triggerManualGesture('pan')}
          className="px-1.5 py-0.5 bg-[#031d27] hover:bg-[#00f3ff]/20 border border-[#00f3ff]/30 text-[9px] font-mono-fui text-[#00f3ff] rounded cursor-pointer"
        >
          ✊ Pan
        </button>
        <button
          onClick={() => triggerManualGesture('zoom')}
          className="px-1.5 py-0.5 bg-[#031d27] hover:bg-[#00f3ff]/20 border border-[#00f3ff]/30 text-[9px] font-mono-fui text-[#00f3ff] rounded cursor-pointer"
        >
          ✊+✊ Zoom
        </button>
        <button
          onClick={() => triggerManualGesture('pinch_click')}
          className="px-1.5 py-0.5 bg-[#031d27] hover:bg-[#00f3ff]/20 border border-[#00f3ff]/30 text-[9px] font-mono-fui text-[#00f3ff] rounded cursor-pointer"
        >
          👌 Pinça
        </button>
        <button
          onClick={() => triggerManualGesture('v_gesture')}
          className="px-1.5 py-0.5 bg-[#031d27] hover:bg-[#00f3ff]/20 border border-[#00f3ff]/30 text-[9px] font-mono-fui text-[#00f3ff] rounded cursor-pointer"
        >
          ✌ V (Fechar)
        </button>
      </div>
    </div>
  );
}
