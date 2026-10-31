/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { TopNavbar, ViewMode } from './components/TopNavbar';
import { HeroSection } from './components/HeroSection';
import { FUISpatialAgentsView } from './components/FUISpatialAgentsView';
import { CameraGesturesView } from './components/CameraGesturesView';
import { SciFiLoadingScreen } from './components/SciFiLoadingScreen';
import { GestureResult } from './utils/fuiLogic';
import { fuiAudio } from './components/AudioSynthesizer';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewMode>('hero');
  const [isLoadingSciFi, setIsLoadingSciFi] = useState<boolean>(false);
  const [isZenMode, setIsZenMode] = useState<boolean>(false);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);
  const [activeGesture, setActiveGesture] = useState<GestureResult | null>(null);
  const [mousePos, setMousePos] = useState({ x: -400, y: -400 });
  const videoRef = useRef<HTMLVideoElement>(null);

  // Subtle fluid liquid caustics following mouse in warm fluorescent orange & white
  useEffect(() => {
    const handlePointerMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('pointermove', handlePointerMove);
    return () => window.removeEventListener('pointermove', handlePointerMove);
  }, []);

  const handleGestureDetected = (gesture: GestureResult) => {
    setActiveGesture(gesture);
  };

  const handleToggleAudio = () => {
    const next = !isAudioMuted;
    setIsAudioMuted(next);
    fuiAudio.enabled = !next;
    fuiAudio.playBlip(700);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black text-white font-sans select-none">
      {/* 
        Background video (fixed, behind everything):
        A `<video>` element fixed to the viewport (`position: fixed; top: 0; left: 0; width: 100%; height: 100vh; object-fit: cover; z-index: 0`)
      */}
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260514_135830_bb6491d1-9b66-4aec-9722-13b4dfe3fb46.mp4"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100vh',
          objectFit: 'cover',
          zIndex: 0,
          opacity: currentView === 'hero' ? 1.0 : 0.7,
          transition: 'opacity 0.5s ease',
        }}
      />

      {/* Interactive mouse light spot (Fluorescent Orange & White Caustic) */}
      <div
        className="liquid-caustic-spot fixed pointer-events-none transition-transform duration-100 ease-out"
        style={{
          zIndex: 1,
          width: '450px',
          height: '450px',
          left: `${mousePos.x - 225}px`,
          top: `${mousePos.y - 225}px`,
          background: 'radial-gradient(circle, rgba(255, 85, 0, 0.12) 0%, rgba(255, 255, 255, 0.04) 50%, transparent 70%)',
        }}
      />

      {/* Sleek Top Navigation Capsule */}
      {!isZenMode && (
        <TopNavbar
          currentView={currentView}
          onViewChange={(v) => {
            if (v === 'agents' && currentView !== 'agents') {
              setIsLoadingSciFi(true);
            }
            setCurrentView(v);
          }}
          isZenMode={isZenMode}
          onToggleZenMode={() => setIsZenMode(!isZenMode)}
          isAudioMuted={isAudioMuted}
          onToggleAudio={handleToggleAudio}
        />
      )}

      {/* Sci-Fi Movie FUI Loading Screen Transition */}
      {isLoadingSciFi && (
        <SciFiLoadingScreen
          onComplete={() => setIsLoadingSciFi(false)}
          onSkip={() => setIsLoadingSciFi(false)}
        />
      )}

      {/* Main Content Viewport */}
      <main className="relative z-10 w-full h-full flex flex-col justify-center overflow-hidden">
        {/* VIEW 1: HERO OVERVIEW */}
        {currentView === 'hero' && (
          <HeroSection
            onEnterAgents={() => {
              fuiAudio.playChirp();
              setIsLoadingSciFi(true);
              setCurrentView('agents');
            }}
            onEnterCamera={() => {
              fuiAudio.playBlip(900);
              setCurrentView('camera');
            }}
          />
        )}

        {/* VIEW 2: AUTHENTIC FUI SPATIAL AGENTS WORKSPACE */}
        {currentView === 'agents' && (
          <FUISpatialAgentsView
            onGestureDetected={handleGestureDetected}
            activeGesture={activeGesture}
          />
        )}

        {/* VIEW 3: LIVE CAMERA & GESTURE RECOGNITION */}
        {currentView === 'camera' && (
          <CameraGesturesView
            onGestureDetected={handleGestureDetected}
            activeGesture={activeGesture}
          />
        )}

        {/* Active Gesture Floating Pill in Fluorescent Orange */}
        {activeGesture && activeGesture.type !== 'open' && !isZenMode && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-1.5 liquid-glass-panel rounded-full shadow-lg flex items-center gap-2 pointer-events-none animate-fade-in border border-[#ff5500]/50">
            <span className="w-1.5 h-1.5 rounded-full bg-[#ff5500] shadow-[0_0_6px_#ff5500]" />
            <span className="text-xs font-mono-fui text-white font-medium">
              {activeGesture.label}
            </span>
            <span className="text-xs font-mono-fui text-zinc-400">
              · {activeGesture.actionDescription}
            </span>
          </div>
        )}

        {/* Zen Mode Exit Button */}
        {isZenMode && (
          <button
            onClick={() => setIsZenMode(false)}
            className="fixed top-6 right-6 z-50 liquid-glass-button px-4 py-2 rounded-full text-xs font-mono-fui text-white cursor-pointer shadow-lg hover:border-[#ff5500]/50"
          >
            Sair do Modo Zen (Mostrar UI)
          </button>
        )}
      </main>
    </div>
  );
}
