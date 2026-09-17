import { SensorData, TemporalFeatures, AIResult, RiskState, HazardType } from '../types';

export interface EdgeInferenceState {
  lastState: RiskState;
  stateHoldCounter: number;
  lastPrimaryHazard: HazardType;
}

export function createInitialInferenceState(): EdgeInferenceState {
  return {
    lastState: 'NORMAL',
    stateHoldCounter: 0,
    lastPrimaryHazard: 'NONE'
  };
}

/**
 * Deterministic Edge Computing Multi-Sensor Classifier (ESP32-S3 firmware simulation)
 * Correlates real-time telemetry, rates of change, and camera edge features
 * across the 3 core environmental hazards: Forest Fire, Flood, and Landslide.
 */
export function runEdgeAIInference(
  current: SensorData,
  temporal: TemporalFeatures,
  inferenceState: EdgeInferenceState
): { result: AIResult; updatedState: EdgeInferenceState } {
  const { rateOfChange, persistenceCycles } = temporal;

  // 1. FOREST FIRE INFERENCE HEAD
  const tempFactor = Math.max(0, (current.temperature - 30) / 45); // 0 at 30°C, 1.0 at 75°C
  const tempRateFactor = Math.max(0, rateOfChange.temperatureRate / 8.0);
  const drynessFactor = Math.max(0, (50 - current.humidity) / 42);
  const smokeFactor = Math.max(0, (current.smokeGas - 40) / 400);
  const pm25Factor = Math.max(0, (current.pm25 - 25) / 250);
  const cameraFireFactor = current.camera.fireConfidence;

  const fireLogit = 
    0.30 * tempFactor +
    0.15 * tempRateFactor +
    0.10 * drynessFactor +
    0.15 * smokeFactor +
    0.10 * pm25Factor +
    0.35 * cameraFireFactor;

  const fireCorroboration = (cameraFireFactor > 0.35 && tempFactor > 0.25 && smokeFactor > 0.2) ? 0.25 : 0.0;
  let rawFireProb = Math.min(1.0, Math.max(0, fireLogit + fireCorroboration));
  if (rawFireProb < 0.08) rawFireProb = 0.02;
  const fireProbability = Math.round(rawFireProb * 100);

  // 2. FLOOD INFERENCE HEAD
  const waterLevelFactor = Math.max(0, (current.waterLevel - 1.4) / 4.8);
  const waterRiseRateFactor = Math.max(0, rateOfChange.waterLevelRiseRate / 1.2);
  const rainfallFactor = Math.max(0, current.rainfall / 60.0);
  const soilSaturationFactor = Math.max(0, (current.soilMoisture - 55) / 40);
  const cameraFloodFactor = current.camera.floodConfidence;

  const floodLogit = 
    0.35 * waterLevelFactor +
    0.20 * waterRiseRateFactor +
    0.15 * rainfallFactor +
    0.10 * soilSaturationFactor +
    0.25 * cameraFloodFactor;

  const floodCorroboration = (waterLevelFactor > 0.25 && (waterRiseRateFactor > 0.15 || rainfallFactor > 0.25)) ? 0.22 : 0.0;
  let rawFloodProb = Math.min(1.0, Math.max(0, floodLogit + floodCorroboration));
  if (rawFloodProb < 0.06) rawFloodProb = 0.01;
  const floodProbability = Math.round(rawFloodProb * 100);

  // 3. LANDSLIDE INFERENCE HEAD
  const tiltFactor = Math.max(0, (current.tilt - 2.0) / 16.0);
  const tiltRateFactor = Math.max(0, rateOfChange.tiltRate / 2.5);
  const vibrationFactor = Math.max(0, (current.vibration - 0.05) / 1.4);
  const soilSaturated = Math.max(0, (current.soilMoisture - 65) / 30);
  const cameraDebrisFactor = current.camera.debrisConfidence;

  const landslideLogit = 
    0.35 * tiltFactor +
    0.15 * tiltRateFactor +
    0.20 * vibrationFactor +
    0.15 * soilSaturated +
    0.20 * cameraDebrisFactor;

  const landslideCorroboration = (tiltFactor > 0.2 && soilSaturated > 0.25) ? 0.22 : 0.0;
  let rawLandslideProb = Math.min(1.0, Math.max(0, landslideLogit + landslideCorroboration));
  if (rawLandslideProb < 0.05) rawLandslideProb = 0.02;
  const landslideProbability = Math.round(rawLandslideProb * 100);

  // Determine Primary Hazard & Severity across the 3 hazards
  const probs: { type: HazardType; prob: number }[] = [
    { type: 'FIRE', prob: fireProbability },
    { type: 'FLOOD', prob: floodProbability },
    { type: 'LANDSLIDE', prob: landslideProbability }
  ];

  probs.sort((a, b) => b.prob - a.prob);
  const maxHazard = probs[0];
  const primaryHazard: HazardType = maxHazard.prob >= 25 ? maxHazard.type : 'NONE';

  const rawSeverity = Math.min(100, Math.round(maxHazard.prob * 0.95 + probs[1].prob * 0.1));

  // Multi-cycle Hysteresis
  let targetState: RiskState = 'NORMAL';
  if (rawSeverity >= 75) {
    targetState = 'CRITICAL';
  } else if (rawSeverity >= 50) {
    targetState = 'WARNING';
  } else if (rawSeverity >= 25) {
    targetState = 'WATCH';
  } else {
    targetState = 'NORMAL';
  }

  let finalState = inferenceState.lastState;
  let hysteresisLocked = false;

  const stateRank: Record<RiskState, number> = {
    NORMAL: 0,
    WATCH: 1,
    WARNING: 2,
    CRITICAL: 3
  };

  if (stateRank[targetState] > stateRank[inferenceState.lastState]) {
    finalState = targetState;
    inferenceState.stateHoldCounter = 0;
  } else if (stateRank[targetState] < stateRank[inferenceState.lastState]) {
    const deescalateThresholds: Record<RiskState, number> = {
      CRITICAL: 67,
      WARNING: 42,
      WATCH: 18,
      NORMAL: 0
    };
    const needed = deescalateThresholds[inferenceState.lastState] || 0;
    if (rawSeverity < needed) {
      inferenceState.stateHoldCounter += 1;
      if (inferenceState.stateHoldCounter >= 2) {
        finalState = targetState;
        inferenceState.stateHoldCounter = 0;
      } else {
        hysteresisLocked = true;
      }
    } else {
      hysteresisLocked = true;
    }
  }

  inferenceState.lastState = finalState;
  inferenceState.lastPrimaryHazard = primaryHazard;

  const confidence = Math.min(99, Math.max(70, Math.round(74 + persistenceCycles * 2.5 + (maxHazard.prob > 50 ? 15 : 0))));

  return {
    result: {
      fireProbability,
      floodProbability,
      landslideProbability,
      severity: rawSeverity,
      primaryHazard,
      status: finalState,
      confidence,
      inferenceTimeMs: 14.2,
      hysteresisLocked
    },
    updatedState: inferenceState
  };
}
