import { motion } from 'framer-motion';
import { ArrowRight, Video } from 'lucide-react';
import { fuiAudio } from './AudioSynthesizer';

interface HeroSectionProps {
  onEnterAgents: () => void;
  onEnterCamera: () => void;
}

export function HeroSection({ onEnterAgents, onEnterCamera }: HeroSectionProps) {
  const headline = 'CRIAMOS SISTEMAS COMPLETOS DE AUTOMAÇÃO COM IA.';
  const words = headline.split(' ');

  return (
    <section
      className="relative z-10 flex flex-col justify-center h-screen max-w-full overflow-hidden"
      style={{
        padding: 'clamp(70px, 8vh, 90px) clamp(18px, 4vw, 32px) 32px clamp(18px, 4vw, 32px)',
      }}
    >
      <div className="flex flex-col items-start max-w-[720px] relative z-20">
        {/* Subtle Kicker */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.05 }}
          className="flex items-center gap-2 mb-4 px-3.5 py-1.5 rounded-full liquid-glass-panel text-xs font-mono-fui uppercase tracking-wider text-white"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#ff5500] shadow-[0_0_6px_#ff5500]" />
          <span>SISTEMA OPERACIONAL ESPACIAL COGNITIVO · AGENTES AUTÔNOMOS</span>
        </motion.div>

        {/* Heading <h2> with exact staggered word animation */}
        <h2
          className="flex flex-wrap gap-[0.25em] m-0 text-white uppercase"
          style={{
            fontSize: 'clamp(26px, 3vw, 42px)',
            fontWeight: 700,
            lineHeight: 1.08,
            letterSpacing: '-0.01em',
          }}
        >
          {words.map((word, index) => {
            const delay = 0.15 + index * 0.08;
            return (
              <motion.span
                key={`${word}-${index}`}
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{
                  duration: 0.7,
                  delay,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="inline-block"
              >
                {word}
              </motion.span>
            );
          })}
        </h2>

        {/* Subtext <p> with exact properties */}
        <motion.p
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{
            duration: 0.7,
            delay: 0.9,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="mt-6 text-[14px] leading-[1.65] text-white/85 max-w-[320px]"
        >
          Oferecemos soluções completas de automação e agentes inteligentes em um só lugar.
        </motion.p>

        {/* Liquid Glass Interactive Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, delay: 1.1 }}
          className="mt-8 flex flex-wrap items-center gap-3"
        >
          <button
            onClick={() => {
              fuiAudio.playChirp();
              onEnterAgents();
            }}
            className="liquid-glass-button px-5 py-2.5 rounded-full text-xs font-semibold text-white tracking-wide flex items-center gap-2 cursor-pointer shadow-lg hover:border-[#ff5500]/70"
          >
            <span>ACESSAR AGENTES FUI</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#ff5500]" />
          </button>

          <button
            onClick={() => {
              fuiAudio.playBlip(950);
              onEnterCamera();
            }}
            className="liquid-glass-panel px-4 py-2.5 rounded-full text-xs font-mono-fui text-zinc-300 hover:text-white flex items-center gap-2 cursor-pointer transition hover:bg-white/10"
          >
            <Video className="w-3.5 h-3.5 text-[#ff5500]" />
            <span>CÂMERA & GESTOS</span>
          </button>
        </motion.div>
      </div>
    </section>
  );
}
