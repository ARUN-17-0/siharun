import React from 'react';
import { 
  Thermometer, 
  Droplets, 
  Wind, 
  CloudRain, 
  Compass, 
  Activity, 
  Camera, 
  Radio, 
  ShieldAlert, 
  Cpu, 
  Crown, 
  Layers, 
  CheckCircle2, 
  AlertTriangle,
  Zap,
  Clock
} from 'lucide-react';
import { NodeState } from '../types';

interface RightInspectorProps {
  selectedNode: NodeState | undefined;
  currentMasterId: number;
}

export const RightInspector: React.FC<RightInspectorProps> = ({
  selectedNode,
  currentMasterId
}) => {
  if (!selectedNode) {
    return (
      <aside className="w-96 h-full bg-[#0c121e]/90 backdrop-blur-md border-l border-slate-800/80 p-6 flex flex-col items-center justify-center text-center select-none z-10">
        <Cpu className="w-12 h-12 text-slate-700 mb-3 animate-pulse" />
        <h3 className="text-sm font-bold text-slate-300 font-mono uppercase">
          No Node Selected
        </h3>
        <p className="text-xs text-slate-500 mt-1 max-w-[240px]">
          Click any sensor node in the 3D digital-twin viewport or the fleet list to inspect its ESP32-S3 sensor matrix and Edge AI telemetry.
        </p>
      </aside>
    );
  }

  const { sensorData, temporalFeatures, aiResult, health } = selectedNode;
  const isMaster = selectedNode.id === currentMasterId;

  const getStatusColor = () => {
    if (!selectedNode.isAlive) return 'text-slate-500';
    switch (aiResult.status) {
      case 'CRITICAL': return 'text-red-400';
      case 'WARNING': return 'text-amber-400';
      case 'WATCH': return 'text-cyan-400';
      case 'NORMAL': return 'text-emerald-400';
    }
  };

  return (
    <aside className="w-96 h-full bg-[#0c121e]/90 backdrop-blur-md border-l border-slate-800/80 flex flex-col z-10 select-none overflow-hidden shadow-xl">
      {/* Node Header */}
      <div className="p-3.5 border-b border-slate-800 bg-slate-900/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-md bg-cyan-600/20 border border-cyan-500/40 text-cyan-300 flex items-center justify-center font-mono font-black text-sm">
              N{selectedNode.id}
            </span>
            <div>
              <h3 className="text-xs font-bold text-slate-100 font-mono leading-tight">
                {selectedNode.name}
              </h3>
              <p className="text-[10px] text-slate-400 font-mono">
                Zone: <span className="text-cyan-300">{selectedNode.zone.replace('_', ' ')}</span>
              </p>
            </div>
          </div>

          {/* Master Badge / Status */}
          <div className="text-right">
            {isMaster ? (
              <span className="inline-flex items-center gap-1 bg-amber-500/20 text-amber-300 border border-amber-500/50 px-2 py-0.5 rounded text-[10px] font-mono font-black">
                <Crown className="w-3 h-3 text-amber-400" />
                REGIONAL MASTER
              </span>
            ) : (
              <span className={`text-[11px] font-mono font-bold ${getStatusColor()}`}>
                {aiResult.status}
              </span>
            )}
          </div>
        </div>

        {/* GPS Coordinates & Altitude */}
        <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-mono text-slate-400">
          <span>Lat: {sensorData.gps.lat.toFixed(4)}°N</span>
          <span>Lng: {sensorData.gps.lng.toFixed(4)}°E</span>
          <span className="text-slate-300 font-semibold">{sensorData.gps.alt}m MSL</span>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3.5 text-xs font-mono">
        
        {/* SECTION 1: EDGE AI INFERENCE ENGINE */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-2.5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-cyan-400 font-bold text-[11px] uppercase">
              <Zap className="w-3.5 h-3.5" />
              <span>ESP32-S3 Edge AI Output</span>
            </div>
            <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.2 rounded">
              {aiResult.inferenceTimeMs}ms
            </span>
          </div>

          {/* Multi-Head Hazard Probabilities */}
          <div className="space-y-1.5">
            {/* Fire */}
            <div>
              <div className="flex justify-between text-[10px] mb-0.5">
                <span className="text-slate-300">Fire Risk Probability</span>
                <span className={aiResult.fireProbability > 60 ? 'text-red-400 font-bold' : 'text-slate-300'}>
                  {aiResult.fireProbability}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-orange-500 to-red-600 transition-all" 
                  style={{ width: `${aiResult.fireProbability}%` }} 
                />
              </div>
            </div>

            {/* Flood */}
            <div>
              <div className="flex justify-between text-[10px] mb-0.5">
                <span className="text-slate-300">Flood Risk Probability</span>
                <span className={aiResult.floodProbability > 60 ? 'text-cyan-400 font-bold' : 'text-slate-300'}>
                  {aiResult.floodProbability}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all" 
                  style={{ width: `${aiResult.floodProbability}%` }} 
                />
              </div>
            </div>

            {/* Landslide */}
            <div>
              <div className="flex justify-between text-[10px] mb-0.5">
                <span className="text-slate-300">Landslide Risk Probability</span>
                <span className={aiResult.landslideProbability > 60 ? 'text-amber-400 font-bold' : 'text-slate-300'}>
                  {aiResult.landslideProbability}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-yellow-500 to-amber-600 transition-all" 
                  style={{ width: `${aiResult.landslideProbability}%` }} 
                />
              </div>
            </div>

            {/* Pollution */}
            <div>
              <div className="flex justify-between text-[10px] mb-0.5">
                <span className="text-slate-300">Pollution Risk Probability</span>
                <span className={aiResult.pollutionProbability > 60 ? 'text-yellow-400 font-bold' : 'text-slate-300'}>
                  {aiResult.pollutionProbability}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-yellow-500 transition-all" 
                  style={{ width: `${aiResult.pollutionProbability}%` }} 
                />
              </div>
            </div>
          </div>

          {/* Severity & Hysteresis Status */}
          <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
            <div>
              <span className="text-slate-400">Total Severity: </span>
              <strong className={aiResult.severity > 70 ? 'text-red-400' : 'text-slate-200'}>
                {aiResult.severity}%
              </strong>
            </div>
            <div>
              <span className="text-slate-400">Confidence: </span>
              <strong className="text-cyan-300">{aiResult.confidence}%</strong>
            </div>
            {aiResult.hysteresisLocked && (
              <span className="text-[9px] bg-slate-800 text-cyan-300 px-1.5 py-0.2 rounded border border-cyan-800">
                Hysteresis Active
              </span>
            )}
          </div>
        </div>

        {/* SECTION 2: 11 SIMULATED HARDWARE SENSORS */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-2.5">
          <div className="flex items-center gap-1.5 text-slate-200 font-bold text-[11px] uppercase mb-2">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>ESP32-S3 Hardware Sensors</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px]">
            {/* Temperature */}
            <div className="bg-slate-950/60 p-1.5 rounded border border-slate-800/60">
              <div className="text-slate-400 flex items-center justify-between">
                <span>Temperature</span>
                <Thermometer className="w-3 h-3 text-red-400" />
              </div>
              <div className="text-slate-200 font-bold mt-0.5 text-xs">
                {sensorData.temperature}°C
              </div>
              <div className="text-[9px] text-slate-500">
                Δ {temporalFeatures.rateOfChange.temperatureRate > 0 ? '+' : ''}{temporalFeatures.rateOfChange.temperatureRate}°C/min
              </div>
            </div>

            {/* Humidity */}
            <div className="bg-slate-950/60 p-1.5 rounded border border-slate-800/60">
              <div className="text-slate-400 flex items-center justify-between">
                <span>Humidity</span>
                <Droplets className="w-3 h-3 text-blue-400" />
              </div>
              <div className="text-slate-200 font-bold mt-0.5 text-xs">
                {sensorData.humidity}% RH
              </div>
              <div className="text-[9px] text-slate-500">
                Capacitive Sensor
              </div>
            </div>

            {/* Smoke / Combustible Gas */}
            <div className="bg-slate-950/60 p-1.5 rounded border border-slate-800/60">
              <div className="text-slate-400 flex items-center justify-between">
                <span>Smoke / Gas</span>
                <Wind className="w-3 h-3 text-amber-400" />
              </div>
              <div className="text-slate-200 font-bold mt-0.5 text-xs">
                {sensorData.smokeGas} ppm
              </div>
              <div className="text-[9px] text-slate-500">
                MQ-2 Gas Chamber
              </div>
            </div>

            {/* Particulate PM2.5 / PM10 */}
            <div className="bg-slate-950/60 p-1.5 rounded border border-slate-800/60">
              <div className="text-slate-400 flex items-center justify-between">
                <span>Particulates</span>
                <Activity className="w-3 h-3 text-yellow-400" />
              </div>
              <div className="text-slate-200 font-bold mt-0.5 text-xs">
                {sensorData.pm25} / {sensorData.pm10}
              </div>
              <div className="text-[9px] text-slate-500">
                PM2.5 / PM10 (µg/m³)
              </div>
            </div>

            {/* Rainfall Rate */}
            <div className="bg-slate-950/60 p-1.5 rounded border border-slate-800/60">
              <div className="text-slate-400 flex items-center justify-between">
                <span>Precipitation</span>
                <CloudRain className="w-3 h-3 text-cyan-400" />
              </div>
              <div className="text-slate-200 font-bold mt-0.5 text-xs">
                {sensorData.rainfall} mm/h
              </div>
              <div className="text-[9px] text-slate-500">
                Cumul: {temporalFeatures.cumulativeRainfall}mm
              </div>
            </div>

            {/* Soil Moisture */}
            <div className="bg-slate-950/60 p-1.5 rounded border border-slate-800/60">
              <div className="text-slate-400 flex items-center justify-between">
                <span>Soil Moisture</span>
                <Droplets className="w-3 h-3 text-emerald-400" />
              </div>
              <div className="text-slate-200 font-bold mt-0.5 text-xs">
                {sensorData.soilMoisture}%
              </div>
              <div className="text-[9px] text-slate-500">
                Volumetric Saturation
              </div>
            </div>

            {/* Water Level */}
            <div className="bg-slate-950/60 p-1.5 rounded border border-slate-800/60">
              <div className="text-slate-400 flex items-center justify-between">
                <span>Water Level</span>
                <Activity className="w-3 h-3 text-blue-400" />
              </div>
              <div className="text-slate-200 font-bold mt-0.5 text-xs">
                {sensorData.waterLevel} m
              </div>
              <div className="text-[9px] text-slate-500">
                Δ {temporalFeatures.rateOfChange.waterLevelRiseRate > 0 ? '+' : ''}{temporalFeatures.rateOfChange.waterLevelRiseRate} m/min
              </div>
            </div>

            {/* Tilt / Inclination */}
            <div className="bg-slate-950/60 p-1.5 rounded border border-slate-800/60">
              <div className="text-slate-400 flex items-center justify-between">
                <span>Tilt Angle</span>
                <Compass className="w-3 h-3 text-amber-400" />
              </div>
              <div className="text-slate-200 font-bold mt-0.5 text-xs">
                {sensorData.tilt}° (Vib {sensorData.vibration}g)
              </div>
              <div className="text-[9px] text-slate-500">
                MPU-6050 3-Axis IMU
              </div>
            </div>
          </div>

          {/* Camera Edge Vision Vectors */}
          <div className="mt-2 pt-2 border-t border-slate-800/60">
            <div className="flex items-center gap-1 text-[10px] text-slate-400 mb-1">
              <Camera className="w-3 h-3 text-cyan-400" />
              <span>Camera Edge Vision Confidence:</span>
            </div>
            <div className="grid grid-cols-4 gap-1 text-[9px] text-center">
              <div className="bg-slate-950 p-1 rounded">
                <div className="text-slate-500">Flame</div>
                <div className="font-bold text-red-400">{(sensorData.camera.fireConfidence * 100).toFixed(0)}%</div>
              </div>
              <div className="bg-slate-950 p-1 rounded">
                <div className="text-slate-500">Flood</div>
                <div className="font-bold text-blue-400">{(sensorData.camera.floodConfidence * 100).toFixed(0)}%</div>
              </div>
              <div className="bg-slate-950 p-1 rounded">
                <div className="text-slate-500">Debris</div>
                <div className="font-bold text-amber-400">{(sensorData.camera.debrisConfidence * 100).toFixed(0)}%</div>
              </div>
              <div className="bg-slate-950 p-1 rounded">
                <div className="text-slate-500">Smog</div>
                <div className="font-bold text-yellow-400">{(sensorData.camera.smogConfidence * 100).toFixed(0)}%</div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: 443MHz LORA ROUTING & TOPOLOGY */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-2.5">
          <div className="flex items-center gap-1.5 text-slate-200 font-bold text-[11px] uppercase mb-2">
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
            <span>443MHz Multi-Hop Routing</span>
          </div>

          <div className="space-y-1 text-[10px]">
            <div className="flex justify-between">
              <span className="text-slate-400">Next Hop Relay:</span>
              <span className="text-cyan-300 font-bold">
                {selectedNode.nextHop === 0 ? 'Village Gateway (Direct)' : selectedNode.nextHop ? `Node ${selectedNode.nextHop}` : 'None'}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-400">Full Path to Gateway:</span>
              <span className="text-slate-200 font-mono">
                {selectedNode.routeToGateway.map((id, idx) => (
                  <span key={`p-${idx}`}>
                    {id === 0 ? 'GW' : `N${id}`}
                    {idx < selectedNode.routeToGateway.length - 1 ? ' → ' : ''}
                  </span>
                ))}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-400">RF Neighbors ({selectedNode.neighbors.length}):</span>
              <span className="text-slate-300">
                {selectedNode.neighbors.map(n => `N${n}`).join(', ') || 'Isolated'}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-400">Packets Transmitted:</span>
              <span className="text-slate-300">{selectedNode.transmittedPackets} packets</span>
            </div>

            <div className="flex justify-between pt-1 border-t border-slate-800/60">
              <span className="text-slate-400">Master Election Fitness:</span>
              <span className="text-amber-400 font-bold">{selectedNode.electionScore} pts</span>
            </div>
          </div>
        </div>

      </div>
    </aside>
  );
};
