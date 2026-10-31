import { useState, useEffect } from 'react';
import { Cpu } from 'lucide-react';
import { fuiAudio } from './AudioSynthesizer';

interface SciFiLoadingScreenProps {
  onComplete: () => void;
  onSkip?: () => void;
}

export function SciFiLoadingScreen({ onComplete }: SciFiLoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [stageIndex, setStageIndex] = useState(0);

  const stages = [
    'INICIALIZANDO KERNEL ESPACIAL COGNITIVO...',
    'CONECTANDO AO MOTOR LOCAL // http://localhost:8730 ...',
    'CALIBRANDO MATRIZ BAYESIANA GROOT-1 [ 0.952 ]...',
    'SINCRONIZANDO NÓS DE PESQUISA ARXIV E VÍDEO RECON...',
    'ATIVANDO PIPELINE TÁTICO AIRLLM COM ZERO OVERHEAD DE GPU...',
    'ARQUITETURA ESPACIAL PRONTA // TODOS OS SISTEMAS EM OPERAÇÃO',
  ];

  useEffect(() => {
    fuiAudio.playChirp();
    const startTime = Date.now();
    const duration = 2400; // 2.4s cinematic loading

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.floor((elapsed / duration) * 100));
      setProgress(pct);

      const stage = Math.min(stages.length - 1, Math.floor((pct / 100) * stages.length));
      setStageIndex(stage);

      if (pct % 15 === 0) {
        fuiAudio.playBlip(600 + pct * 6, 0.04);
      }

      if (pct >= 100) {
        clearInterval(interval);
        fuiAudio.playGestureDetect();
        setTimeout(() => {
          onComplete();
        }, 300);
      }
    }, 40);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 select-none overflow-hidden">
      {/* Grade de Fundo Cibernética */}
      <div className="absolute inset-0 opacity-20 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      {/* Anéis Holográficos Giratórios em Laranja Fluorescente */}
      <div className="absolute w-[560px] h-[560px] rounded-full border border-white/10 flex items-center justify-center pointer-events-none">
        <div className="w-[450px] h-[450px] rounded-full border border-dashed border-[#ff5500]/40 animate-spin [animation-duration:20s]" />
        <div className="w-[320px] h-[320px] rounded-full border border-white/20 animate-spin [animation-duration:12s] [animation-direction:reverse]" />
        <div className="w-[180px] h-[180px] rounded-full border border-[#ff5500]/60 animate-ping [animation-duration:3s]" />
      </div>

      {/* Painel Central em Liquid Glass */}
      <div className="relative z-10 w-full max-w-xl p-8 liquid-glass-panel rounded-3xl border border-[#ff5500]/50 shadow-[0_0_60px_rgba(255,85,0,0.35)] flex flex-col items-center text-center">
        {/* Emblema Sci-Fi */}
        <div className="w-14 h-14 rounded-2xl bg-black/80 border border-[#ff5500] flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(255,85,0,0.4)]">
          <Cpu className="w-7 h-7 text-[#ff5500] animate-pulse" />
        </div>

        {/* Tag de Segurança */}
        <div className="flex items-center gap-2 mb-2 text-xs font-mono-fui text-zinc-400">
          <span className="w-1.5 h-1.5 rounded-full bg-[#ff5500] shadow-[0_0_6px_#ff5500]" />
          <span>FUI C4ISR // DESCOBERTA DE FLUXOS EM PRODUÇÃO</span>
        </div>

        <h1 className="text-2xl md:text-3xl font-hud font-bold tracking-widest text-white uppercase mb-6">
          CARREGANDO AMBIENTE ESPACIAL
        </h1>

        {/* Porcentagem */}
        <div className="text-5xl font-mono-fui font-bold text-[#ff5500] tracking-wider mb-4 drop-shadow-[0_0_15px_rgba(255,85,0,0.5)]">
          {progress.toString().padStart(3, '0')}%
        </div>

        {/* Barra de Progresso em Laranja Fluorescente */}
        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mb-5 border border-white/15">
          <div
            className="h-full bg-gradient-to-r from-[#ff5500] to-[#ffaa00] transition-all duration-75 shadow-[0_0_12px_#ff5500]"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Mensagem Dinâmica da Etapa */}
        <div className="h-6 flex items-center justify-center font-mono-fui text-xs text-zinc-300 tracking-wider">
          <span className="text-[#ff5500] mr-2">›</span>
          <span>{stages[stageIndex]}</span>
        </div>

        {/* Diagnóstico em Grade */}
        <div className="w-full mt-6 pt-5 border-t border-white/10 grid grid-cols-3 gap-2 text-[10px] font-mono-fui text-zinc-400">
          <div className="flex flex-col">
            <span className="text-zinc-500 text-[8.5px]">MOTOR:</span>
            <span className="text-white">NÚCLEO AIRLLM</span>
          </div>
          <div className="flex flex-col">
            <span className="text-zinc-500 text-[8.5px]">HOST VSCODE:</span>
            <span className="text-[#ff5500] font-bold">PORTA 8730 OK</span>
          </div>
          <div className="flex flex-col">
            <span className="text-zinc-500 text-[8.5px]">GROOT-1:</span>
            <span className="text-white">CALIBRADO 0.952</span>
          </div>
        </div>

        {/* Botão de Pular */}
        <button
          onClick={() => {
            fuiAudio.playChirp();
            onComplete();
          }}
          className="mt-6 text-[11px] font-mono-fui text-zinc-400 hover:text-[#ff5500] underline tracking-wider cursor-pointer transition"
        >
          [ PULAR ANIMAÇÃO ]
        </button>
      </div>
    </div>
  );
}
