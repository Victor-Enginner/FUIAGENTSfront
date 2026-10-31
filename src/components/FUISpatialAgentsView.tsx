import { useState } from 'react';
import { SpatialMindMap } from './SpatialMindMap';
import { LeftOSPanel } from './LeftOSPanel';
import { RightTelemetryPanel } from './RightTelemetryPanel';
import { GestureResult } from '../utils/fuiLogic';

interface FUISpatialAgentsViewProps {
  onGestureDetected?: (gesture: GestureResult) => void;
  activeGesture?: GestureResult | null;
}

export function FUISpatialAgentsView({
  onGestureDetected,
  activeGesture,
}: FUISpatialAgentsViewProps) {
  const [searchTrigger, setSearchTrigger] = useState<string>('');

  const handleTriggerSearch = (query: string) => {
    setSearchTrigger(query);
  };

  return (
    <div className="relative w-full h-full overflow-hidden select-none">
      {/* Center Interactive Spatial Mind Map of Agents */}
      <SpatialMindMap
        gestureAction={activeGesture?.type}
        searchTrigger={searchTrigger}
      />

      {/* Left Floating Cognitive Spatial OS Console (matching user reference screenshot) */}
      <div className="fixed left-6 top-20 bottom-6 z-40 flex pointer-events-none">
        <LeftOSPanel
          onGestureDetected={onGestureDetected}
          onTriggerSearch={handleTriggerSearch}
        />
      </div>

      {/* Right Floating Telemetry & Gauges Panel (Frequency [Z] & Pulse [XY]) */}
      <RightTelemetryPanel />
    </div>
  );
}
