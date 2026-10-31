import test from 'node:test';
import assert from 'node:assert/strict';
import {
  classifyGesture,
  calculateGrootCalibration,
  generateBezierConnector,
  calculateRadarScreenPosition,
  formatTacticalTimestamp
} from './fuiLogic';

test('classifyGesture returns zoom when 2 hands are detected', () => {
  const result = classifyGesture([], 2);
  assert.equal(result.type, 'zoom');
  assert.equal(result.label, '2 MÃOS FECHADAS');
});

test('classifyGesture detects pinch_click when thumb and index are close', () => {
  const landmarks = [
    { x: 0.5, y: 0.5 }, // thumb
    { x: 0.52, y: 0.53 }, // index (distance ~ 0.036 < 0.12)
    { x: 0.7, y: 0.7 },
    { x: 0.75, y: 0.75 },
    { x: 0.8, y: 0.8 },
  ];
  const result = classifyGesture(landmarks, 1);
  assert.equal(result.type, 'pinch_click');
  assert.equal(result.label, 'PINÇA DETECTADA');
});

test('classifyGesture detects V gesture correctly', () => {
  const landmarks = [
    { x: 0.5, y: 0.6 }, // thumb
    { x: 0.45, y: 0.3 }, // index up
    { x: 0.55, y: 0.3 }, // middle up
    { x: 0.6, y: 0.7 }, // ring down
    { x: 0.65, y: 0.7 }, // pinky down
  ];
  const result = classifyGesture(landmarks, 1);
  assert.equal(result.type, 'v_gesture');
  assert.equal(result.label, 'GESTO "V"');
});

test('classifyGesture detects pan (closed fist)', () => {
  const landmarks = [
    { x: 0.5, y: 0.5 }, // thumb
    { x: 0.52, y: 0.52 }, // index close
    { x: 0.51, y: 0.53 }, // middle close
    { x: 0.49, y: 0.52 }, // ring close
    { x: 0.48, y: 0.51 }, // pinky close
  ];
  const result = classifyGesture(landmarks, 1);
  assert.equal(result.type, 'pan');
  assert.equal(result.label, '1 MÃO FECHADA');
});

test('calculateGrootCalibration bounds and weights correctly', () => {
  const score = calculateGrootCalibration(0.95, 0.98, 1.0);
  assert.ok(score >= 0.9 && score <= 1.0);
  // Max score boundary
  const maxScore = calculateGrootCalibration(1.0, 1.0, 1.0);
  assert.equal(maxScore, 1.0);
  // Zero score boundary
  const minScore = calculateGrootCalibration(0, 0, 1.0);
  assert.equal(minScore, 0.0);
});

test('generateBezierConnector creates valid SVG path format', () => {
  const path = generateBezierConnector({ x: 10, y: 20 }, { x: 100, y: 200 });
  assert.ok(path.startsWith('M 10.0 20.0 C '));
  assert.ok(path.endsWith('100.0 200.0'));
});

test('calculateRadarScreenPosition calculates polar to Cartesian accurately', () => {
  const center = { x: 200, y: 200 };
  // 90 degrees bearing (due East)
  const posEast = calculateRadarScreenPosition(10, 90, center, 2.0);
  assert.equal(Math.round(posEast.x), 220);
  assert.equal(Math.round(posEast.y), 200);

  // 0 degrees bearing (due North)
  const posNorth = calculateRadarScreenPosition(10, 0, center, 2.0);
  assert.equal(Math.round(posNorth.x), 200);
  assert.equal(Math.round(posNorth.y), 180);
});

test('formatTacticalTimestamp formats standard brackets format', () => {
  const fixedDate = new Date(2026, 9, 30, 14, 25, 9);
  const formatted = formatTacticalTimestamp(fixedDate);
  assert.equal(formatted, '[14:25:09]');
});
