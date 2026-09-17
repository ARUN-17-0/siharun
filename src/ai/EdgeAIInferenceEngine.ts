import { SensorData, TemporalFeatures, AIResult, RiskState, HazardType } from '../types';

/**
 * ESP32-S3 Edge AI Inference Engine Simulation
 * Emulates a lightweight quantized multi-head neural network / fuzzy inference system
 * taking multimodal sensor streams, temporal rate-of-change, camera classification vectors,
 * and applying hysteresis stabilization.
 */

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
 * Sigmoid activation helper for smooth normalized output
 */
function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

/**
 * Computes deterministic multi-modal Edge AI inference
 */
export function runEdgeAIInference(
  current: SensorData,
  temporal: TemporalFeatures,
  inferenceState: EdgeInferenceState
): { result: AIResult; updatedState: EdgeInferenceState } {
  const { rateOfChange, persistenceCycles } = temporal;

  // -------------------------------------------------------------
  // 1. FOREST FIRE INFERENCE HEAD
  // Sensors: Temperature, Rate of Temp Rise, Humidity (dryness), Smoke/Gas, PM2.5, Camera Fire
  // -------------------------------------------------------------
  // Baseline temp: 22°C, trigger starts above 36°C, extreme > 65°C
  const tempFactor = Math.max(0, (current.temperature - 30) / 45); // 0 at 30°C, 1.0 at 75°C
  const tempRateFactor = Math.max(0, rateOfChange.temperatureRate / 8.0); // Spiking heat
  const drynessFactor = Math.max(0, (50 - current.humidity) / 42); // Low humidity < 35%
  const smokeFactor = Math.max(0, (current.smokeGas - 40) / 400); // Smoke > 40ppm
  const pm25Factor = Math.max(0, (current.pm25 - 25) / 250);
  const cameraFireFactor = current.camera.fireConfidence;

  // Multi-sensor fusion weights:
  // Thermal (30%), Smoke/Particulate (25%), Rate-of-Rise (15%), Camera (30%)
  const fireLogit = 
    0.30 * tempFactor +
    0.15 * tempRateFactor +
    0.10 * drynessFactor +
    0.15 * smokeFactor +
    0.10 * pm25Factor +
    0.35 * cameraFireFactor;

  // Corroboration boost: if BOTH camera detects flame AND smoke/temp are elevated
  const fireCorroboration = (cameraFireFactor > 0.4 && tempFactor > 0.3 && smokeFactor > 0.2) ? 0.25 : 0.0;
  
  let rawFireProb = Math.min(1.0, Math.max(0, fireLogit + fireCorroboration));
  if (rawFireProb < 0.08) rawFireProb = 0.02; // Nominal floor
  const fireProbability = Math.round(rawFireProb * 100);

  // -------------------------------------------------------------
  // 2. FLOOD INFERENCE HEAD
  // Sensors: Rainfall, Water Level, Water Level Rise Rate, Soil Moisture, Camera Flood
  // -------------------------------------------------------------
  // Baseline river level ~1.2m, alert > 3.0m, danger > 5.5m
  const waterLevelFactor = Math.max(0, (current.waterLevel - 1.5) / 5.0);
  const waterRiseRateFactor = Math.max(0, rateOfChange.waterLevelRiseRate / 1.5);
  const rainfallFactor = Math.max(0, current.rainfall / 65.0); // Heavy downpour > 40 mm/h
  const soilSaturationFactor = Math.max(0, (current.soilMoisture - 55) / 40); // Saturated soil
  const cameraFloodFactor = current.camera.floodConfidence;

  const floodLogit = 
    0.35 * waterLevelFactor +
    0.20 * waterRiseRateFactor +
    0.15 * rainfallFactor +
    0.10 * soilSaturationFactor +
    0.25 * cameraFloodFactor;

  const floodCorroboration = (waterLevelFactor > 0.3 && (waterRiseRateFactor > 0.2 || rainfallFactor > 0.3)) ? 0.22 : 0.0;
  let rawFloodProb = Math.min(1.0, Math.max(0, floodLogit + floodCorroboration));
  if (rawFloodProb < 0.06) rawFloodProb = 0.01;
  const floodProbability = Math.round(rawFloodProb * 100);

  // -------------------------------------------------------------
  // 3. LANDSLIDE INFERENCE HEAD
  // Sensors: Soil Moisture, Tilt Angle, Tilt Rate, Vibration, Rainfall, Camera Debris
  // -------------------------------------------------------------
  // Baseline tilt ~1.0°, warning > 8.0°, critical > 16.0°
  const tiltFactor = Math.max(0, (current.tilt - 2.0) / 18.0);
  const tiltRateFactor = Math.max(0, rateOfChange.tiltRate / 3.0);
  const vibrationFactor = Math.max(0, (current.vibration - 0.05) / 1.5);
  const soilSaturated = Math.max(0, (current.soilMoisture - 65) / 32);
  const cameraDebrisFactor = current.camera.debrisConfidence;

  const landslideLogit = 
    0.35 * tiltFactor +
    0.15 * tiltRateFactor +
    0.20 * vibrationFactor +
    0.15 * soilSaturated +
    0.20 * cameraDebrisFactor;

  // Landslide critical condition: saturated soil + ground shear angle change
  const landslideCorroboration = (tiltFactor > 0.25 && soilSaturated > 0.3) ? 0.20 : 0.0;
  let rawLandslideProb = Math.min(1.0, Math.max(0, landslideLogit + landslideCorroboration));
  if (rawLandslideProb < 0.05) rawLandslideProb = 0.02;
  const landslideProbability = Math.round(rawLandslideProb * 100);

  // -------------------------------------------------------------
  // 4. POLLUTION INFERENCE HEAD
  // Sensors: PM2.5, PM10, Smoke/Gas, Camera Smog
  // -------------------------------------------------------------
  const pm25Pollution = Math.max(0, (current.pm25 - 35) / 250);
  const pm10Pollution = Math.max(0, (current.pm10 - 50) / 350);
  const gasPollution = Math.max(0, (current.smokeGas - 30) / 300);
  const cameraSmog = current.camera.smogConfidence;

  const pollutionLogit = 
    0.40 * pm25Pollution +
    0.30 * pm10Pollution +
    0.15 * gasPollution +
    0.20 * cameraSmog;

  let rawPollutionProb = Math.min(1.0, Math.max(0, pollutionLogit));
  if (rawPollutionProb < 0.08) rawPollutionProb = 0.03;
  const pollutionProbability = Math.round(rawPollutionProb * 100);

  // -------------------------------------------------------------
  // 5. DETERMINE PRIMARY HAZARD & SEVERITY
  // -------------------------------------------------------------
  const probs: { type: HazardType; prob: number }[] = [
    { type: 'FIRE', prob: fireProbability },
    { type: 'FLOOD', prob: floodProbability },
    { type: 'LANDSLIDE', prob: landslideProbability },
    { type: 'POLLUTION', prob: pollutionProbability }
  ];

  probs.sort((a, b) => b.prob - a.prob);
  const maxHazard = probs[0];
  const primaryHazard: HazardType = maxHazard.prob >= 25 ? maxHazard.type : 'NONE';

  // Multi-hazard compounding severity
  // Top threat is primary, secondary threats add compounded risk
  const primaryWeight = maxHazard.prob;
  const secondaryCompounding = (probs[1].prob * 0.15) + (probs[2].prob * 0.05);
  const rawSeverity = Math.min(100, Math.round(primaryWeight * 0.9 + secondaryCompounding));

  // -------------------------------------------------------------
  // 6. HYSTERESIS / PERSISTENCE STATE MACHINE
  // Prevents jittery transitions between NORMAL, WATCH, WARNING, CRITICAL
  // -------------------------------------------------------------
  const currentRisk = rawSeverity;
  const lastState = inferenceState.lastState;
  let targetState: RiskState = 'NORMAL';

  // Rising thresholds
  if (currentRisk >= 75) {
    targetState = 'CRITICAL';
  } else if (currentRisk >= 50) {
    targetState = 'WARNING';
  } else if (currentRisk >= 25) {
    targetState = 'WATCH';
  } else {
    targetState = 'NORMAL';
  }

  // Hysteresis deadband: to step DOWN a level, risk must be 8% lower than threshold
  // and maintain it for 3 consecutive cycles
  let finalState = lastState;
  let hysteresisLocked = false;

  const stateRank: Record<RiskState, number> = {
    NORMAL: 0,
    WATCH: 1,
    WARNING: 2,
    CRITICAL: 3
  };

  const targetRank = stateRank[targetState];
  const lastRank = stateRank[lastState];

  if (targetRank > lastRank) {
    // Escalate immediately on threat detection
    finalState = targetState;
    inferenceState.stateHoldCounter = 0;
  } else if (targetRank < lastRank) {
    // Demoting requires hysteresis buffer
    const deescalateThresholds: Record<RiskState, number> = {
      CRITICAL: 67, // Down from 75
      WARNING: 42,  // Down from 50
      WATCH: 18,    // Down from 25
      NORMAL: 0
    };

    const thresholdNeeded = deescalateThresholds[lastState] || 0;
    if (currentRisk < thresholdNeeded) {
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
  } else {
    inferenceState.stateHoldCounter = 0;
  }

  inferenceState.lastState = finalState;
  inferenceState.lastPrimaryHazard = primaryHazard;

  // AI confidence estimation (based on sensor agreement and persistence)
  const confidence = Math.min(99, Math.max(65, Math.round(72 + persistenceCycles * 2.5 + (maxHazard.prob > 50 ? 14 : 0))));

  return {
    result: {
      fireProbability,
      floodProbability,
      landslideProbability,
      pollutionProbability,
      severity: rawSeverity,
      primaryHazard,
      status: finalState,
      confidence,
      inferenceTimeMs: 14.2, // Simulated ESP32-S3 NN execution latency
      hysteresisLocked
    },
    updatedState: inferenceState
  };
}
