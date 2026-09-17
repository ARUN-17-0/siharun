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
      smogConfidence: 0.03,
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
  // Give realistic slight variations: Node 1 has 88% battery, Node 7 has 94% battery, etc.
  const battery = nodeId === 1 ? 88 : nodeId === 7 ? 94 : 85 + (nodeId * 3) % 14;
  return {
    overallScore: 95,
    batteryLevel: battery,
    internalTemp: 26.5,
    rfQualityScore: 92,
    hazardExposure: 0,
    isSafe: true,
    status: 'HEALTHY'
  };
}

// Epicenter targets for each disaster scenario
export const HAZARD_EPICENTERS: Record<ScenarioType, [number, number, number]> = {
  NORMAL: [0, 0, 0],
  FIRE: [-24, 7.0, -23],           // Near Node 1 & Node 2 in Forest Upper Ridge
  FLOOD: [-10, 1.2, 0],            // In River Valley near Node 4 & Node 5
  LANDSLIDE: [-18, 4.8, 17],       // On steep slope near Node 6
  POLLUTION: [12, 1.8, 0],         // Industrial/traffic near Node 8 & Node 9
  MASTER_FAILURE: [-26, 7.2, -22], // Node 1
  MASTER_HANDOVER: [-26, 7.2, -22],// Node 1
  COMPLETE_DEMO: [-24, 7.0, -23]   // Starts with Fire
};

/**
 * Deterministically updates a node's sensors toward scenario targets.
 * Rate of change is tracked to feed temporal features for the Edge AI model.
 */
export function updateNodeSensors(
  currentData: SensorData,
  prevData: SensorData,
  temporal: TemporalFeatures,
  health: NodeHealth,
  def: NodePositionDefinition,
  scenario: ScenarioType,
  scenarioIntensity: number, // 0.0 to 1.0 (gradual escalation)
  dtSec: number
): { sensorData: SensorData; temporalFeatures: TemporalFeatures; health: NodeHealth } {
  const epicenter = HAZARD_EPICENTERS[scenario] || [0, 0, 0];
  const distToEpicenter = calculateDistance3D(def.position3D, epicenter);
  
  // Proximity factor: closer nodes suffer higher intensity (decay over radius ~24 units)
  const proximity = Math.max(0, 1 - distToEpicenter / 26);
  const effectiveHazard = scenarioIntensity * proximity;

  // Target values based on scenario
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
    smogConfidence: 0.03,
    timestamp: Date.now()
  };

  // Apply scenario physical dynamics
  switch (scenario) {
    case 'FIRE':
    case 'COMPLETE_DEMO': {
      if (effectiveHazard > 0.05) {
        // Temperature spikes up to 88°C for Node 1 / close forest nodes
        targetTemp += effectiveHazard * 66.0;
        targetHumidity = Math.max(8.0, targetHumidity - effectiveHazard * 46.0);
        targetSmoke += effectiveHazard * 680.0;
        targetPM25 += effectiveHazard * 380.0;
        targetPM10 += effectiveHazard * 520.0;
        targetCamera.fireConfidence = Math.min(0.98, 0.05 + effectiveHazard * 0.93);
      }
      break;
    }
    case 'FLOOD': {
      if (effectiveHazard > 0.05 || def.zone === 'RIVER_VALLEY') {
        const floodFactor = Math.max(effectiveHazard, def.zone === 'RIVER_VALLEY' ? scenarioIntensity * 0.9 : 0);
        targetRainfall = floodFactor * 95.0; // Heavy monsoon downpour mm/h
        targetHumidity = Math.min(99.0, 60.0 + floodFactor * 38.0);
        targetSoilMoisture = Math.min(99.0, 45.0 + floodFactor * 54.0);
        if (def.zone === 'RIVER_VALLEY') {
          targetWaterLevel = 1.2 + floodFactor * 6.5; // Up to 7.7m river overflow!
        }
        targetCamera.floodConfidence = Math.min(0.96, 0.05 + floodFactor * 0.92);
      }
      break;
    }
    case 'LANDSLIDE': {
      if (effectiveHazard > 0.05 || def.zone === 'SLOPE_RIDGE') {
        const slopeFactor = Math.max(effectiveHazard, def.zone === 'SLOPE_RIDGE' ? scenarioIntensity * 0.85 : 0);
        targetRainfall = slopeFactor * 70.0;
        targetSoilMoisture = Math.min(98.0, 42.0 + slopeFactor * 55.0); // Saturation
        targetTilt = 1.0 + slopeFactor * 24.5; // Shear displacement up to 25.5°
        targetVibration = 0.02 + slopeFactor * 2.8; // Seismic rumble
        targetCamera.debrisConfidence = Math.min(0.95, 0.04 + slopeFactor * 0.91);
      }
      break;
    }
    case 'POLLUTION': {
      if (effectiveHazard > 0.05 || def.zone === 'VILLAGE_APPROACH') {
        const pollFactor = Math.max(effectiveHazard, def.zone === 'VILLAGE_APPROACH' ? scenarioIntensity * 0.85 : 0);
        targetSmoke += pollFactor * 350.0;
        targetPM25 += pollFactor * 420.0; // Severe air quality emergency
        targetPM10 += pollFactor * 650.0;
        targetCamera.smogConfidence = Math.min(0.97, 0.05 + pollFactor * 0.92);
      }
      break;
    }
    case 'MASTER_HANDOVER': {
      // Specifically stress Node 1 thermally and degrade battery
      if (def.id === 1) {
        targetTemp = 82.0; // Dangerous overheat
        targetSmoke = 420.0;
        targetCamera.fireConfidence = 0.88;
      }
      break;
    }
    case 'MASTER_FAILURE': {
      // Abrupt failure handled outside sensor step
      break;
    }
    default:
      break;
  }

  // Smooth low-pass interpolation towards targets (physical inertia)
  const alpha = Math.min(1.0, dtSec * 1.2);
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
    smogConfidence: currentData.camera.smogConfidence + (targetCamera.smogConfidence - currentData.camera.smogConfidence) * alpha,
    timestamp: Date.now()
  };

  // Compute rates of change (per minute equivalent)
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
    persistenceCycles: effectiveHazard > 0.25 ? temporal.persistenceCycles + 1 : Math.max(0, temporal.persistenceCycles - 1),
    cumulativeRainfall: Math.round((temporal.cumulativeRainfall * 0.98 + (newRain * dtMin) / 60) * 10) / 10
  };

  // Update node health based on temperature stress, battery consumption, and threat exposure
  const internalTemp = Math.round(newTemp * 0.85 + 5.0); // Enclosure internal heat
  let battery = health.batteryLevel;
  if (scenario === 'MASTER_HANDOVER' && def.id === 1) {
    battery = Math.max(18, battery - dtSec * 3.5); // Rapid drain
  } else {
    // Normal slow solar balancing
    battery = Math.min(100, Math.max(10, battery - dtSec * 0.05));
  }

  // Hazard exposure score
  const hazardExposure = Math.round(Math.min(100, effectiveHazard * 100));

  // Overall health score calculation:
  // Penalize internal temp > 55°C, low battery < 30%, high hazard exposure
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

  const updatedHealth: NodeHealth = {
    overallScore: healthScore,
    batteryLevel: Math.round(battery * 10) / 10,
    internalTemp: Math.round(internalTemp * 10) / 10,
    rfQualityScore: Math.round(Math.max(20, 95 - hazardExposure * 0.4)),
    hazardExposure,
    isSafe,
    status
  };

  const updatedSensorData: SensorData = {
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
      smogConfidence: Math.round(newCamera.smogConfidence * 100) / 100,
      timestamp: Date.now()
    }
  };

  return {
    sensorData: updatedSensorData,
    temporalFeatures: updatedTemporal,
    health: updatedHealth
  };
}
