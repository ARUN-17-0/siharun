import { SensorData, TemporalFeatures, NodeHealth, ScenarioType, CameraEvidence } from '../types';
import { NodePositionDefinition, calculateDistance3D } from './NodePhysics';

// Baseline nominal sensor values for clean mountain forest conditions
export function createBaselineSensorData(def: NodePositionDefinition): SensorData {
  const seed = def.id * 1.37;
  return {
    temperature: Math.round((21.5 + Math.sin(seed) * 2.5) * 10) / 10,
    humidity: Math.round((58 + Math.cos(seed) * 6) * 10) / 10,
    smokeGas: Math.round(18 + (seed % 7)),
    pm25: Math.round(12 + (seed % 5)),
    pm10: Math.round(22 + (seed % 8)),
    rainfall: 0.0,
    soilMoisture: Math.round((42 + Math.sin(seed * 2) * 5) * 10) / 10,
    waterLevel: def.zone === 'RIVER_VALLEY' ? 1.2 : 0.1,
    tilt: Math.round((0.8 + (seed % 3) * 0.4) * 10) / 10,
    vibration: 0.02,
    gps: { ...def.gps },
    camera: {
      fireConfidence: 0.02,
      floodConfidence: 0.01,
      debrisConfidence: 0.02,
      timestamp: Date.now()
    }
  };
}

export function createInitialTemporalFeatures(): TemporalFeatures {
  return {
    rateOfChange: {
      temperatureRate: 0.0,
      waterLevelRiseRate: 0.0,
      smokeGasRate: 0.0,
      tiltRate: 0.0
    },
    persistenceCycles: 0,
    cumulativeRainfall: 0.0
  };
}

export function createInitialNodeHealth(nodeId: number): NodeHealth {
  // Balanced realistic initial battery and health
  const battery = nodeId === 1 ? 88 : nodeId === 7 ? 96 : 84 + (nodeId * 3) % 15;
  return {
    overallScore: 95,
    batteryLevel: battery,
    internalTemp: 25.5,
    rfQualityScore: 94,
    hazardExposure: 0,
    isSafe: true,
    status: 'HEALTHY'
  };
}

// Epicenter targets for the 3 Core Disaster Scenarios
export const HAZARD_EPICENTERS: Record<ScenarioType, [number, number, number]> = {
  NORMAL: [0, 0, 0],
  FIRE: [-24, 7.0, -23],           // Near Node 1 & Node 2 in Forest Upper Ridge
  FLOOD: [-10, 1.2, 0],            // In River Valley near Node 4 & Node 5
  LANDSLIDE: [-19, 4.8, 16],       // On steep slope near Node 6
  MASTER_FAILURE: [-26, 7.2, -22], // Node 1
  MASTER_HANDOVER: [-26, 7.2, -22],// Node 1
  COMPLETE_DEMO: [-24, 7.0, -23]   // Starts with Fire
};

/**
 * Deterministically updates a node's sensors with 4-phase staged causal progression:
 * Phase 1: Incipient Anomaly (initial uptick, triggers early warning threshold)
 * Phase 2: Warning Dispatched across LoRa Mesh
 * Phase 3: Village Evacuation in Progress
 * Phase 4: Full Catastrophic Disaster Peak (Flood surge / wildfire / mudflow)
 */
export function updateNodeSensors(
  currentData: SensorData,
  prevData: SensorData,
  temporal: TemporalFeatures,
  health: NodeHealth,
  def: NodePositionDefinition,
  scenario: ScenarioType,
  disasterPhase: number, // 1 to 4
  phaseProgress: number, // 0.0 to 1.0 within current phase
  dtSec: number
): { sensorData: SensorData; temporalFeatures: TemporalFeatures; health: NodeHealth } {
  const epicenter = HAZARD_EPICENTERS[scenario] || [0, 0, 0];
  const distToEpicenter = calculateDistance3D(def.position3D, epicenter);
  
  // Proximity factor (attenuation over radius ~26 units)
  const proximity = Math.max(0, 1 - distToEpicenter / 26);

  // Target values based on scenario and staged causal phase
  let targetTemp = 22.0 + Math.sin(def.id) * 2;
  let targetHumidity = 58.0;
  let targetSmoke = 20.0;
  let targetPM25 = 14.0;
  let targetPM10 = 24.0;
  let targetRainfall = 0.0;
  let targetSoilMoisture = def.zone === 'RIVER_VALLEY' ? 50 : 40;
  let targetWaterLevel = def.zone === 'RIVER_VALLEY' ? 1.2 : 0.1;
  let targetTilt = 1.0;
  let targetVibration = 0.02;

  const targetCamera: CameraEvidence = {
    fireConfidence: 0.02,
    floodConfidence: 0.01,
    debrisConfidence: 0.02,
    timestamp: Date.now()
  };

  // Staged Disaster Dynamics
  if (scenario === 'FLOOD') {
    if (def.zone === 'RIVER_VALLEY' || proximity > 0.05) {
      if (disasterPhase === 1) {
        // Phase 1: Incipient rain & catchment rise rate starts climbing
        targetRainfall = 45.0 * phaseProgress;
        targetHumidity = 75.0;
        targetSoilMoisture = 65.0;
        if (def.zone === 'RIVER_VALLEY') {
          targetWaterLevel = 1.2 + 1.2 * phaseProgress; // Rises from 1.2m to 2.4m
        }
        targetCamera.floodConfidence = 0.35 * phaseProgress;
      } else if (disasterPhase === 2) {
        // Phase 2: Warning Dispatched across mesh
        targetRainfall = 65.0;
        targetHumidity = 85.0;
        targetSoilMoisture = 78.0;
        if (def.zone === 'RIVER_VALLEY') {
          targetWaterLevel = 2.4 + 0.8 * phaseProgress; // 2.4m to 3.2m
        }
        targetCamera.floodConfidence = 0.55;
      } else if (disasterPhase === 3) {
        // Phase 3: Village Evacuation Active (water is high, but not yet peak overflow)
        targetRainfall = 80.0;
        targetHumidity = 92.0;
        targetSoilMoisture = 88.0;
        if (def.zone === 'RIVER_VALLEY') {
          targetWaterLevel = 3.2 + 1.6 * phaseProgress; // 3.2m to 4.8m
        }
        targetCamera.floodConfidence = 0.75;
      } else if (disasterPhase >= 4) {
        // Phase 4: Peak Inundation (Only AFTER village is evacuated)
        targetRainfall = 110.0;
        targetHumidity = 98.0;
        targetSoilMoisture = 98.0;
        if (def.zone === 'RIVER_VALLEY') {
          targetWaterLevel = 4.8 + 2.8 * phaseProgress; // Surges up to 7.6m!
        }
        targetCamera.floodConfidence = 0.96;
      }
    }
  } else if (scenario === 'FIRE' || scenario === 'COMPLETE_DEMO') {
    if (proximity > 0.05) {
      if (disasterPhase === 1) {
        // Phase 1: Incipient thermal plume
        targetTemp = 24.0 + 22.0 * proximity * phaseProgress; // Up to 46°C
        targetHumidity = 32.0;
        targetSmoke = 20.0 + 120.0 * proximity * phaseProgress;
        targetPM25 = 14.0 + 80.0 * proximity * phaseProgress;
        targetCamera.fireConfidence = 0.35 * phaseProgress;
      } else if (disasterPhase === 2) {
        // Phase 2: Mesh warning issued
        targetTemp = 46.0 + 18.0 * proximity * phaseProgress;
        targetHumidity = 22.0;
        targetSmoke = 140.0 + 180.0 * proximity * phaseProgress;
        targetCamera.fireConfidence = 0.65;
      } else if (disasterPhase === 3) {
        // Phase 3: Village alerts and defensible space evacuation
        targetTemp = 64.0 + 12.0 * proximity * phaseProgress;
        targetHumidity = 14.0;
        targetSmoke = 320.0 + 200.0 * proximity * phaseProgress;
        targetCamera.fireConfidence = 0.82;
      } else if (disasterPhase >= 4) {
        // Phase 4: Engulfment peak
        targetTemp = 76.0 + 12.0 * proximity; // Up to 88°C
        targetHumidity = 8.0;
        targetSmoke = 720.0 * proximity;
        targetPM25 = 420.0 * proximity;
        targetCamera.fireConfidence = 0.98;
      }
    }
  } else if (scenario === 'LANDSLIDE') {
    if (def.zone === 'SLOPE_RIDGE' || proximity > 0.05) {
      if (disasterPhase === 1) {
        targetRainfall = 40.0;
        targetSoilMoisture = 75.0;
        targetTilt = 1.0 + 3.0 * phaseProgress; // 1° to 4°
        targetVibration = 0.02 + 0.3 * phaseProgress;
        targetCamera.debrisConfidence = 0.3;
      } else if (disasterPhase === 2) {
        targetRainfall = 60.0;
        targetSoilMoisture = 86.0;
        targetTilt = 4.0 + 4.0 * phaseProgress; // 4° to 8°
        targetVibration = 0.35 + 0.5 * phaseProgress;
        targetCamera.debrisConfidence = 0.6;
      } else if (disasterPhase === 3) {
        targetRainfall = 75.0;
        targetSoilMoisture = 94.0;
        targetTilt = 8.0 + 6.0 * phaseProgress; // 8° to 14°
        targetVibration = 0.85 + 0.8 * phaseProgress;
        targetCamera.debrisConfidence = 0.8;
      } else if (disasterPhase >= 4) {
        targetRainfall = 90.0;
        targetSoilMoisture = 98.0;
        targetTilt = 14.0 + 8.5 * phaseProgress; // Massive slope shear up to 22.5°
        targetVibration = 2.8;
        targetCamera.debrisConfidence = 0.96;
      }
    }
  } else if (scenario === 'MASTER_HANDOVER') {
    if (def.id === 1) {
      targetTemp = 82.0;
      targetSmoke = 420.0;
      targetCamera.fireConfidence = 0.9;
    }
  }

  // Smooth interpolation toward target
  const alpha = Math.min(1.0, dtSec * 1.5);
  const newTemp = currentData.temperature + (targetTemp - currentData.temperature) * alpha;
  const newHumidity = currentData.humidity + (targetHumidity - currentData.humidity) * alpha;
  const newSmoke = currentData.smokeGas + (targetSmoke - currentData.smokeGas) * alpha;
  const newPM25 = currentData.pm25 + (targetPM25 - currentData.pm25) * alpha;
  const newPM10 = currentData.pm10 + (targetPM10 - currentData.pm10) * alpha;
  const newRain = currentData.rainfall + (targetRainfall - currentData.rainfall) * alpha;
  const newSoil = currentData.soilMoisture + (targetSoilMoisture - currentData.soilMoisture) * alpha;
  const newWater = currentData.waterLevel + (targetWaterLevel - currentData.waterLevel) * alpha;
  const newTilt = currentData.tilt + (targetTilt - currentData.tilt) * alpha;
  const newVib = currentData.vibration + (targetVibration - currentData.vibration) * alpha;

  const newCamera: CameraEvidence = {
    fireConfidence: currentData.camera.fireConfidence + (targetCamera.fireConfidence - currentData.camera.fireConfidence) * alpha,
    floodConfidence: currentData.camera.floodConfidence + (targetCamera.floodConfidence - currentData.camera.floodConfidence) * alpha,
    debrisConfidence: currentData.camera.debrisConfidence + (targetCamera.debrisConfidence - currentData.camera.debrisConfidence) * alpha,
    timestamp: Date.now()
  };

  // Compute rates of change (per minute)
  const dtMin = Math.max(0.01, dtSec / 60);
  const tempRate = (newTemp - prevData.temperature) / dtMin;
  const waterRate = (newWater - prevData.waterLevel) / dtMin;
  const smokeRate = (newSmoke - prevData.smokeGas) / dtMin;
  const tiltRate = (newTilt - prevData.tilt) / dtMin;

  const updatedTemporal: TemporalFeatures = {
    rateOfChange: {
      temperatureRate: Math.round(tempRate * 100) / 100,
      waterLevelRiseRate: Math.round(waterRate * 100) / 100,
      smokeGasRate: Math.round(smokeRate * 100) / 100,
      tiltRate: Math.round(tiltRate * 100) / 100
    },
    persistenceCycles: disasterPhase >= 2 ? temporal.persistenceCycles + 1 : Math.max(0, temporal.persistenceCycles - 1),
    cumulativeRainfall: Math.round((temporal.cumulativeRainfall * 0.98 + (newRain * dtMin) / 60) * 10) / 10
  };

  // Node health calculation
  const internalTemp = Math.round(newTemp * 0.85 + 5.0);
  let battery = health.batteryLevel;
  if (scenario === 'MASTER_HANDOVER' && def.id === 1) {
    battery = Math.max(18, battery - dtSec * 3.5);
  } else {
    battery = Math.min(100, Math.max(10, battery - dtSec * 0.05));
  }

  const hazardExposure = Math.round(Math.min(100, proximity * (disasterPhase / 4) * 100));

  let healthScore = 100;
  if (internalTemp > 50) healthScore -= (internalTemp - 50) * 1.8;
  if (battery < 40) healthScore -= (40 - battery) * 1.2;
  healthScore -= hazardExposure * 0.45;
  healthScore = Math.max(5, Math.min(100, Math.round(healthScore)));

  const isSafe = healthScore > 35 && internalTemp < 72 && battery > 15;
  let status = health.status;
  if (healthScore >= 75) status = 'HEALTHY';
  else if (healthScore >= 45) status = 'DEGRADED';
  else if (healthScore >= 15) status = 'CRITICAL';
  else status = 'FAILED';

  return {
    sensorData: {
      temperature: Math.round(newTemp * 10) / 10,
      humidity: Math.round(newHumidity * 10) / 10,
      smokeGas: Math.round(newSmoke * 10) / 10,
      pm25: Math.round(newPM25 * 10) / 10,
      pm10: Math.round(newPM10 * 10) / 10,
      rainfall: Math.round(newRain * 10) / 10,
      soilMoisture: Math.round(newSoil * 10) / 10,
      waterLevel: Math.round(newWater * 100) / 100,
      tilt: Math.round(newTilt * 10) / 10,
      vibration: Math.round(newVib * 100) / 100,
      gps: { ...def.gps },
      camera: {
        fireConfidence: Math.round(newCamera.fireConfidence * 100) / 100,
        floodConfidence: Math.round(newCamera.floodConfidence * 100) / 100,
        debrisConfidence: Math.round(newCamera.debrisConfidence * 100) / 100,
        timestamp: Date.now()
      }
    },
    temporalFeatures: updatedTemporal,
    health: {
      overallScore: healthScore,
      batteryLevel: Math.round(battery * 10) / 10,
      internalTemp: Math.round(internalTemp * 10) / 10,
      rfQualityScore: Math.round(Math.max(20, 95 - hazardExposure * 0.4)),
      hazardExposure,
      isSafe,
      status
    }
  };
}
