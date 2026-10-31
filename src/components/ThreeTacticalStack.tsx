import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { fuiAudio } from './AudioSynthesizer';
import { Maximize2, Minimize2, RotateCcw } from 'lucide-react';

interface ThreeTacticalStackProps {
  gestureAction?: string;
  onSelectStack?: (stackName: string) => void;
}

export function ThreeTacticalStack({ gestureAction, onSelectStack }: ThreeTacticalStackProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [activeStack, setActiveStack] = useState<'top' | 'middle' | 'bottom'>('top');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const rotationRef = useRef({ x: 0.35, y: -0.45 });
  const zoomRef = useRef(14);
  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    // Detect software WebGL as per threejs guidelines
    const isSoftwareGl = (() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x020a10, 0.025);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 4.5, zoomRef.current);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    container.appendChild(renderer.domElement);

    // Procedural Studio Environment
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x00f3ff, 0.4);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(5, 12, 7);
    scene.add(dirLight);

    const hemiLight = new THREE.HemisphereLight(0x00f3ff, 0x051824, 0.6);
    scene.add(hemiLight);

    // Root tactical group
    const tacticalGroup = new THREE.Group();
    scene.add(tacticalGroup);

    // Helper: create circular tactical disc geometry
    function createRadarDisc(y: number, radius: number, segments: number, isDashed: boolean = true) {
      const discGroup = new THREE.Group();
      discGroup.position.y = y;

      // Outer ring
      const ringGeo = new THREE.RingGeometry(radius - 0.04, radius, segments);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x00f3ff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = Math.PI / 2;
      discGroup.add(ringMesh);

      // Inner dashed ring
      const innerRadius = radius * 0.72;
      const innerGeo = new THREE.RingGeometry(innerRadius - 0.03, innerRadius, isDashed ? 32 : segments);
      const innerMat = new THREE.MeshBasicMaterial({
        color: 0x00c8e0,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.5,
        wireframe: isDashed,
      });
      const innerMesh = new THREE.Mesh(innerGeo, innerMat);
      innerMesh.rotation.x = Math.PI / 2;
      discGroup.add(innerMesh);

      // Core center ring
      const coreRadius = radius * 0.35;
      const coreGeo = new THREE.RingGeometry(coreRadius - 0.02, coreRadius, 48);
      const coreMat = new THREE.MeshBasicMaterial({
        color: 0x00f3ff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.3,
      });
      const coreMesh = new THREE.Mesh(coreGeo, coreMat);
      coreMesh.rotation.x = Math.PI / 2;
      discGroup.add(coreMesh);

      // Radial spokes / crosshair
      const spokeGeo = new THREE.BufferGeometry();
      const spokePts = [
        new THREE.Vector3(-radius, 0, 0),
        new THREE.Vector3(radius, 0, 0),
        new THREE.Vector3(0, 0, -radius),
        new THREE.Vector3(0, 0, radius),
      ];
      spokeGeo.setFromPoints(spokePts);
      const spokeMat = new THREE.LineBasicMaterial({
        color: 0x00f3ff,
        transparent: true,
        opacity: 0.25,
      });
      const spokes = new THREE.LineSegments(spokeGeo, spokeMat);
      discGroup.add(spokes);

      // Translucent cyan disc floor
      const fillGeo = new THREE.CircleGeometry(radius, 48);
      const fillMat = new THREE.MeshBasicMaterial({
        color: 0x002838,
        transparent: true,
        opacity: 0.22,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const fillMesh = new THREE.Mesh(fillGeo, fillMat);
      fillMesh.rotation.x = Math.PI / 2;
      discGroup.add(fillMesh);

      return discGroup;
    }

    // Top Stack (High Vantage)
    const topStack = createRadarDisc(2.8, 4.2, 64);
    tacticalGroup.add(topStack);

    // Middle Stack (Multi-Role)
    const middleStack = createRadarDisc(0.0, 4.6, 64);
    tacticalGroup.add(middleStack);

    // Bottom Stack (Execution) with 3D elevation wave grid
    const bottomStack = createRadarDisc(-2.8, 5.0, 64);
    tacticalGroup.add(bottomStack);

    // 3D Wireframe Terrain on bottom stack
    const terrainGeo = new THREE.PlaneGeometry(5.2, 5.2, 28, 28);
    const posAttr = terrainGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const u = posAttr.getX(i);
      const v = posAttr.getY(i);
      const dist = Math.hypot(u, v);
      if (dist < 2.5) {
        const heightVal = Math.sin(u * 1.5) * Math.cos(v * 1.5) * 0.45 + Math.sin(dist * 3.0) * 0.2;
        posAttr.setZ(i, heightVal);
      } else {
        posAttr.setZ(i, 0);
      }
    }
    terrainGeo.computeVertexNormals();
    const terrainMat = new THREE.MeshBasicMaterial({
      color: 0x00f3ff,
      wireframe: true,
      transparent: true,
      opacity: 0.28,
    });
    const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    terrainMesh.rotation.x = -Math.PI / 2;
    terrainMesh.position.y = -2.75;
    tacticalGroup.add(terrainMesh);

    // Connecting Laser Beams (Vertical laser rods connecting top to bottom)
    const beam1Geo = new THREE.CylinderGeometry(0.015, 0.015, 6.2, 12);
    const beamMatCyan = new THREE.MeshBasicMaterial({
      color: 0x00f3ff,
      transparent: true,
      opacity: 0.8,
    });
    const beam1 = new THREE.Mesh(beam1Geo, beamMatCyan);
    beam1.position.set(-1.2, 0, -0.6);
    tacticalGroup.add(beam1);

    const beam2Geo = new THREE.CylinderGeometry(0.015, 0.015, 6.2, 12);
    const beamMatOrange = new THREE.MeshBasicMaterial({
      color: 0xff6622,
      transparent: true,
      opacity: 0.85,
    });
    const beam2 = new THREE.Mesh(beam2Geo, beamMatOrange);
    beam2.position.set(-1.8, 0, 0.8);
    tacticalGroup.add(beam2);

    const beam3Geo = new THREE.CylinderGeometry(0.015, 0.015, 6.2, 12);
    const beamMatYellow = new THREE.MeshBasicMaterial({
      color: 0xffaa00,
      transparent: true,
      opacity: 0.85,
    });
    const beam3 = new THREE.Mesh(beam3Geo, beamMatYellow);
    beam3.position.set(0.6, 0, 0.4);
    tacticalGroup.add(beam3);

    // Target Markers:
    // 1. E-3 (Top Stack) - Cyan Delta Jet
    const jetGeo = new THREE.ConeGeometry(0.2, 0.4, 3);
    const jetMat = new THREE.MeshBasicMaterial({ color: 0x00f3ff, wireframe: true });
    const jetMesh = new THREE.Mesh(jetGeo, jetMat);
    jetMesh.position.set(-1.2, 2.9, -0.6);
    jetMesh.rotation.x = -Math.PI / 2;
    tacticalGroup.add(jetMesh);

    // 2. AIRCRAFT (Middle Stack) - Orange Marker
    const planeGeo = new THREE.ConeGeometry(0.22, 0.45, 3);
    const planeMat = new THREE.MeshBasicMaterial({ color: 0xff6622, wireframe: true });
    const planeMesh = new THREE.Mesh(planeGeo, planeMat);
    planeMesh.position.set(-1.8, 0.1, 0.8);
    planeMesh.rotation.x = -Math.PI / 2;
    tacticalGroup.add(planeMesh);

    // 3. TOI (Target of Interest) - Yellow Diamond Octahedron
    const toiGeo = new THREE.OctahedronGeometry(0.25);
    const toiMat = new THREE.MeshBasicMaterial({ color: 0xffcc00, wireframe: true });
    const toiMesh = new THREE.Mesh(toiGeo, toiMat);
    toiMesh.position.set(0.6, 0.1, 0.4);
    tacticalGroup.add(toiMesh);

    // Radar Scanning Beam Mesh
    const scanBeamGeo = new THREE.BufferGeometry();
    const scanPts = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(4.2, 0, 0)];
    scanBeamGeo.setFromPoints(scanPts);
    const scanBeamMat = new THREE.LineBasicMaterial({ color: 0x00f3ff, transparent: true, opacity: 0.9 });
    const scanBeamTop = new THREE.Line(scanBeamGeo, scanBeamMat);
    topStack.add(scanBeamTop);

    const scanBeamMid = new THREE.Line(scanBeamGeo, scanBeamMat);
    middleStack.add(scanBeamMid);

    // Ambient floating particles
    const particleCount = 180;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * 10;
      particlePositions[i + 1] = (Math.random() - 0.5) * 8;
      particlePositions[i + 2] = (Math.random() - 0.5) * 10;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x00f3ff,
      size: 0.04,
      transparent: true,
      opacity: 0.5,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // Mouse Drag interaction
    const handleMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const dx = e.clientX - lastMousePosRef.current.x;
      const dy = e.clientY - lastMousePosRef.current.y;
      rotationRef.current.y += dx * 0.005;
      rotationRef.current.x = Math.max(0.1, Math.min(1.2, rotationRef.current.x + dy * 0.005));
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      zoomRef.current = Math.max(8, Math.min(22, zoomRef.current + e.deltaY * 0.01));
      camera.position.z = zoomRef.current;
    };

    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('wheel', handleWheel, { passive: false });

    // Render loop
    let frameId: number = 0;
    const clock = new THREE.Clock();

    function animate() {
      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();

      // Subtle slow auto-spin when idle
      if (!isDraggingRef.current) {
        rotationRef.current.y += delta * 0.12;
      }

      tacticalGroup.rotation.y = rotationRef.current.y;
      tacticalGroup.rotation.x = rotationRef.current.x;
      camera.position.z = zoomRef.current;

      // Radar scan rotation
      scanBeamTop.rotation.y = elapsedTime * 1.8;
      scanBeamMid.rotation.y = -elapsedTime * 1.4;

      // Marker pulse
      jetMesh.rotation.z = elapsedTime * 2.0;
      toiMesh.rotation.y = elapsedTime * 1.5;

      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    }

    animate();

    // Resize handler
    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('wheel', handleWheel);
      window.removeEventListener('resize', handleResize);
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Handle external gesture actions (from webcam gesture engine)
  useEffect(() => {
    if (gestureAction === 'pan') {
      rotationRef.current.y += 0.08;
    } else if (gestureAction === 'zoom') {
      zoomRef.current = Math.max(8, zoomRef.current - 0.3);
    } else if (gestureAction === 'v_gesture') {
      rotationRef.current = { x: 0.35, y: -0.45 };
      zoomRef.current = 14;
    }
  }, [gestureAction]);

  return (
    <div
      className={`relative w-full h-full flex flex-col items-center justify-center overflow-hidden transition-all duration-300 ${
        isFullscreen ? 'fixed inset-0 z-50 bg-[#020b12]' : 'h-full'
      }`}
    >
      {/* 3D Canvas Mount Point */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Banner: COMMAND THE STACK (as in screenshot image_18ad9c5b.png) */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none z-20">
        <span className="text-[10px] font-mono-fui text-[#00f3ff]/70 tracking-[0.25em]">
          U.S. AIR FORCE // C4ISR SPATIAL ARCHITECTURE
        </span>
        <h1 className="text-xl md:text-2xl font-hud font-bold tracking-[0.2em] text-[#00f3ff] drop-shadow-[0_0_12px_rgba(0,243,255,0.6)]">
          COMMAND THE STACK
        </h1>
      </div>

      {/* Right Column Tactical Stack Spec Cards (matching image_18ad9c5b.png) */}
      <div className="absolute right-4 md:right-8 top-36 md:top-40 flex flex-col gap-3.5 max-w-[270px] md:max-w-[320px] pointer-events-auto z-20">
        {/* Card 1: TOP STACK */}
        <div
          onClick={() => {
            setActiveStack('top');
            fuiAudio.playBlip(980);
            onSelectStack?.('top');
          }}
          className={`p-3.5 rounded border transition-all duration-200 cursor-pointer ${
            activeStack === 'top'
              ? 'bg-[#031d27]/90 border-[#00f3ff] shadow-[0_0_15px_rgba(0,243,255,0.3)]'
              : 'bg-[#03141d]/70 border-[#00f3ff]/30 hover:border-[#00f3ff]/60'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-hud font-bold tracking-wider text-[#00f3ff]">
              TOP STACK // HIGH VANTAGE
            </span>
            <span className="text-[10px] font-mono-fui text-[#00f3ff]/70">LVL 03</span>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-300 font-sans">
            A higher vantage point enables Airmen & AI Agents in this stack to provide vital intelligence
            (ArXiv CoRR & C4ISR) to lower execution stacks.
          </p>
        </div>

        {/* Card 2: MIDDLE STACK */}
        <div
          onClick={() => {
            setActiveStack('middle');
            fuiAudio.playBlip(780);
            onSelectStack?.('middle');
          }}
          className={`p-3.5 rounded border transition-all duration-200 cursor-pointer ${
            activeStack === 'middle'
              ? 'bg-[#031d27]/90 border-[#ffaa00] shadow-[0_0_15px_rgba(255,170,0,0.3)]'
              : 'bg-[#03141d]/70 border-[#00f3ff]/30 hover:border-[#00f3ff]/60'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-hud font-bold tracking-wider text-[#ffaa00]">
              MIDDLE STACK // MULTI-ROLE
            </span>
            <span className="text-[10px] font-mono-fui text-[#ffaa00]/70">LVL 02</span>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-300 font-sans">
            Middle ground means multi-role orchestration. AirLLM Layer-Wise Agents + Groot-1 Calibration
            fused for zero-lag tactical decision-making.
          </p>
        </div>

        {/* Card 3: BOTTOM STACK */}
        <div
          onClick={() => {
            setActiveStack('bottom');
            fuiAudio.playBlip(620);
            onSelectStack?.('bottom');
          }}
          className={`p-3.5 rounded border transition-all duration-200 cursor-pointer ${
            activeStack === 'bottom'
              ? 'bg-[#031d27]/90 border-[#00f3ff] shadow-[0_0_15px_rgba(0,243,255,0.3)]'
              : 'bg-[#03141d]/70 border-[#00f3ff]/30 hover:border-[#00f3ff]/60'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-hud font-bold tracking-wider text-[#00f3ff]">
              BOTTOM STACK // EXECUTION
            </span>
            <span className="text-[10px] font-mono-fui text-[#00f3ff]/70">LVL 01</span>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-300 font-sans">
            Responsible for ground-truth extraction: Diagram Design synthesis, PDF figure CV & local CPU
            execution with 0% background GPU overhead.
          </p>
        </div>
      </div>

      {/* Bottom Degree Ticks Scale (290 300 310 320 330) */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-8 text-[11px] font-mono-fui text-[#00f3ff]/80 pointer-events-none z-20 bg-[#02131d]/60 px-6 py-1.5 rounded border border-[#00f3ff]/30 backdrop-blur-sm">
        <span>| 290</span>
        <span>| 300</span>
        <span className="text-[#00f3ff] font-bold">| 310 [BEARING]</span>
        <span>| 320</span>
        <span>| 330</span>
      </div>

      {/* Floating Canvas Action Controls */}
      <div className="absolute top-6 right-8 flex items-center gap-2 z-30">
        <button
          onClick={() => {
            rotationRef.current = { x: 0.35, y: -0.45 };
            zoomRef.current = 14;
            fuiAudio.playBlip(800);
          }}
          title="Reset Camera View"
          className="p-2 bg-[#03141d]/80 hover:bg-[#042838] border border-[#00f3ff]/40 text-[#00f3ff] rounded transition cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          onClick={() => {
            setIsFullscreen(!isFullscreen);
            fuiAudio.playChirp();
          }}
          title="Toggle Fullscreen Canvas"
          className="p-2 bg-[#03141d]/80 hover:bg-[#042838] border border-[#00f3ff]/40 text-[#00f3ff] rounded transition cursor-pointer"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
