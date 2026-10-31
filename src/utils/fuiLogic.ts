/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Pure logic calculations for FUI Gestures, Groot-1 Calibration, and Spatial Canvas Math
 */

export interface Point2D {
  x: number;
  y: number;
}

export type GestureType = 'open' | 'pan' | 'zoom' | 'pinch_click' | 'v_gesture';

export interface GestureResult {
  type: GestureType;
  confidence: number;
  label: string;
  actionDescription: string;
}

/**
 * Classifies hand landmark geometry into standard FUI gestural controls:
 * - 1 Mão Fechada: Mover Cenário (Pan)
 * - 2 Mãos Fechadas (Puxar): Ampliar / Reduzir Cena (Zoom)
 * - Pinça (1 Mão): Clicar / Arrastar Aba (Click)
 * - Gesto "V" (1 Mão): Fechar Tela (Close/Reset)
 */
export function classifyGesture(
  landmarks: Point2D[],
  handCount: number = 1
): GestureResult {
  if (handCount >= 2) {
    return {
      type: 'zoom',
      confidence: 0.94,
      label: '2 MÃOS FECHADAS',
      actionDescription: 'Ampliar / Reduzir Cena (Zoom)',
    };
  }

  if (!landmarks || landmarks.length < 5) {
    return {
      type: 'open',
      confidence: 0.8,
      label: 'MODO: OPEN',
      actionDescription: 'Mão aberta / Rastreando',
    };
  }

  const thumb = landmarks[0];
  const index = landmarks[1];
  const middle = landmarks[2];
  const ring = landmarks[3];
  const pinky = landmarks[4];

  // Distances from tips to thumb/palm base
  const dIndex = Math.hypot(index.x - thumb.x, index.y - thumb.y);
  const dMiddle = Math.hypot(middle.x - thumb.x, middle.y - thumb.y);
  const dRing = Math.hypot(ring.x - thumb.x, ring.y - thumb.y);
  const dPinky = Math.hypot(pinky.x - thumb.x, pinky.y - thumb.y);

  // Closed fist (all fingers curled into palm)
  const isFist = dIndex < 0.15 && dMiddle < 0.15 && dRing < 0.15 && dPinky < 0.15;
  if (isFist) {
    return {
      type: 'pan',
      confidence: 0.92,
      label: '1 MÃO FECHADA',
      actionDescription: 'Mover Cenário (Pan)',
    };
  }

  // Pinch distance between thumb and index when remaining fingers are open
  const pinchDist = Math.hypot(thumb.x - index.x, thumb.y - index.y);
  if (pinchDist < 0.12 && (dMiddle > 0.12 || dRing > 0.12)) {
    return {
      type: 'pinch_click',
      confidence: 0.96,
      label: 'PINÇA DETECTADA',
      actionDescription: 'Clicar / Arrastar Aba',
    };
  }

  // Check V gesture (index and middle fingers up, ring and pinky down)
  const indexUp = index.y < thumb.y - 0.1;
  const middleUp = middle.y < thumb.y - 0.1;
  const ringDown = ring.y > thumb.y - 0.05;
  const pinkyDown = pinky.y > thumb.y - 0.05;
  const spread = Math.abs(index.x - middle.x);

  if (indexUp && middleUp && ringDown && pinkyDown && spread > 0.06) {
    return {
      type: 'v_gesture',
      confidence: 0.93,
      label: 'GESTO "V"',
      actionDescription: 'Fechar Tela / Reset Visão',
    };
  }

  return {
    type: 'open',
    confidence: 0.88,
    label: 'MODO: OPEN',
    actionDescription: 'Mão aberta / Rastreando',
  };
}

/**
 * Calculates Bayesian decision calibration score (0.000 to 1.000) for Groot-1
 */
export function calculateGrootCalibration(
  relevanceProbability: number,
  sensorSyncRate: number,
  latencyFactor: number = 0.98
): number {
  const boundedRelevance = Math.max(0, Math.min(1, relevanceProbability));
  const boundedSync = Math.max(0, Math.min(1, sensorSyncRate));
  const rawScore = (boundedRelevance * 0.65) + (boundedSync * 0.35 * latencyFactor);
  return Math.round(rawScore * 1000) / 1000;
}

/**
 * Generates smooth cubic bezier path string between two spatial canvas nodes
 */
export function generateBezierConnector(
  start: Point2D,
  end: Point2D,
  curvature: number = 0.5
): string {
  const dx = end.x - start.x;
  const cx1 = start.x + dx * curvature;
  const cy1 = start.y;
  const cx2 = end.x - dx * curvature;
  const cy2 = end.y;
  return `M ${start.x.toFixed(1)} ${start.y.toFixed(1)} C ${cx1.toFixed(1)} ${cy1.toFixed(1)}, ${cx2.toFixed(1)} ${cy2.toFixed(1)}, ${end.x.toFixed(1)} ${end.y.toFixed(1)}`;
}

/**
 * Computes 2D radar screen coordinate from target bearing (degrees) and range (km)
 */
export function calculateRadarScreenPosition(
  rangeKm: number,
  bearingDeg: number,
  center: Point2D,
  pixelsPerKm: number = 2.5
): Point2D {
  const rad = ((bearingDeg - 90) * Math.PI) / 180;
  const radius = rangeKm * pixelsPerKm;
  return {
    x: center.x + radius * Math.cos(rad),
    y: center.y + radius * Math.sin(rad),
  };
}

/**
 * Formats tactical coordinate timestamp
 */
export function formatTacticalTimestamp(date: Date = new Date()): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  const hh = pad(date.getHours());
  const mm = pad(date.getMinutes());
  const ss = pad(date.getSeconds());
  return `[${hh}:${mm}:${ss}]`;
}
