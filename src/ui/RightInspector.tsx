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
  Crown, 
  Layers, 
  Zap,
  Flame,
  Mountain
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
      <aside className="w-96 h-full bg-[#080d18] border-l-2 border-slate-700 p-6 flex flex-col items-center justify-center text-center select-none z-10">
        <Radio className="w-12 h-12 text-slate-600 mb-3 animate-pulse" />
        <h3 className="text-sm font-black text-white font-mono uppercase">
          No Node Selected
        </h3>
        <p className="text-xs text-slate-400 mt-1 max-w-[240px]">
          Select any sensor node in the 3D digital-twin viewport or the fleet list to inspect its ESP32-S3 sensor suite and edge computing outputs.
        </p>
      </aside>
    );
  }

  const { sensorData, temporalFeatures, aiResult, health } = selectedNode;
  const isMaster = selectedNode.id === currentMasterId;

  return (
    <aside className="w-96 h-full bg-[#080d18] border-l-2 border-slate-700 flex flex-col z-10 select-none overflow-hidden shadow-2xl">
      {/* Node Header */}
      <div className="p-3.5 border-b-2 border-slate-700 bg-slate-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded bg-cyan-900 border-2 border-cyan-400 text-cyan-200 flex items-center justify-center font-mono font-black text-sm">
              N{selectedNode.id}
            </span>
            <div>
              <h3 className="text-xs font-black text-white font-mono leading-tight">
                {selectedNode.name}
              </h3>
              <p className="text-[10px] text-slate-300 font-mono">
                Zone: <strong className="text-cyan-400">{selectedNode.zone.replace('_', ' ')}</strong>
              </p>
            </div>
          </div>

          <div className="text-right">
            {isMaster ? (
              <span className="inline-flex items-center gap-1 bg-amber-500 text-slate-950 border border-amber-400 px-2 py-0.5 rounded text-[10px] font-mono font-black shadow-md">
                <Crown className="w-3 h-3" />
                MASTER NODE
              </span>
            ) : (
              <span className={`text-xs font-mono font-black ${
                aiResult.status === 'CRITICAL' ? 'text-red-400' :
                aiResult.status === 'WARNING' ? 'text-amber-400' :
                aiResult.status === 'WATCH' ? 'text-cyan-400' : 'text-emerald-400'
              }`}>
                STATUS: {aiResult.status}
              </span>
            )}
          </div>
        </div>

        {/* GPS Coordinates */}
        <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] font-mono text-slate-300 font-semibold">
          <span>Lat: {sensorData.gps.lat.toFixed(4)}°N</span>
          <span>Lng: {sensorData.gps.lng.toFixed(4)}°E</span>
          <span className="text-white bg-slate-800 px-1.5 py-0.2 rounded border border-slate-700">{sensorData.gps.alt}m MSL</span>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3.5 text-xs font-mono">
        
        {/* 1. EDGE CLASSIFIER HEADS (3 HAZARDS ONLY) */}
        <div className="bg-slate-900 border-2 border-slate-700 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-white font-black text-[11px] uppercase">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span>ESP32-S3 Threat Assessment</span>
            </div>
            <span className="text-[10px] text-cyan-300 bg-cyan-950 border border-cyan-700 px-2 py-0.2 rounded font-bold">
              {aiResult.inferenceTimeMs}ms latency
            </span>
          </div>

          <div className="space-y-2">
            {/* 1. Fire */}
            <div>
              <div className="flex justify-between text-[10px] mb-0.5 font-bold">
                <span className="text-slate-200 flex items-center gap-1">
                  <Flame className="w-3 h-3 text-red-400" />
                  Forest Fire Risk
                </span>
                <span className={aiResult.fireProbability > 50 ? 'text-red-400 font-black' : 'text-white'}>
                  {aiResult.fireProbability}%
                </span>
              </div>
              <div className="w-full h-2 bg-slate-950 rounded border border-slate-800 overflow-hidden">
                <div 
                  className="h-full bg-red-500 transition-all" 
                  style={{ width: `${aiResult.fireProbability}%` }} 
                />
              </div>
            </div>

            {/* 2. Flood */}
            <div>
              <div className="flex justify-between text-[10px] mb-0.5 font-bold">
                <span className="text-slate-200 flex items-center gap-1">
                  <Droplets className="w-3 h-3 text-cyan-400" />
                  Flash Flood Risk
                </span>
                <span className={aiResult.floodProbability > 50 ? 'text-cyan-400 font-black' : 'text-white'}>
                  {aiResult.floodProbability}%
                </span>
              </div>
              <div className="w-full h-2 bg-slate-950 rounded border border-slate-800 overflow-hidden">
                <div 
                  className="h-full bg-cyan-400 transition-all" 
                  style={{ width: `${aiResult.floodProbability}%` }} 
                />
              </div>
            </div>

            {/* 3. Landslide */}
            <div>
              <div className="flex justify-between text-[10px] mb-0.5 font-bold">
                <span className="text-slate-200 flex items-center gap-1">
                  <Mountain className="w-3 h-3 text-amber-400" />
                  Landslide / Shear Risk
                </span>
                <span className={aiResult.landslideProbability > 50 ? 'text-amber-400 font-black' : 'text-white'}>
                  {aiResult.landslideProbability}%
                </span>
              </div>
              <div className="w-full h-2 bg-slate-950 rounded border border-slate-800 overflow-hidden">
                <div 
                  className="h-full bg-amber-400 transition-all" 
                  style={{ width: `${aiResult.landslideProbability}%` }} 
                />
              </div>
            </div>
          </div>

          {/* Aggregate Severity & Hysteresis Lock */}
          <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] font-bold">
            <div>
              <span className="text-slate-400">Total Threat Severity: </span>
              <strong className={aiResult.severity > 65 ? 'text-red-400 text-sm' : 'text-white text-sm'}>
                {aiResult.severity}%
              </strong>
            </div>
            {aiResult.hysteresisLocked && (
              <span className="bg-slate-800 text-cyan-300 px-2 py-0.5 rounded border border-cyan-500 text-[9px]">
                Hysteresis Filtered
              </span>
            )}
          </div>
        </div>

        {/* 2. ESP32-S3 SENSOR TELEMETRY SUITE */}
        <div className="bg-slate-900 border-2 border-slate-700 rounded-lg p-3">
          <div className="flex items-center gap-1.5 text-white font-black text-[11px] uppercase mb-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Hardware Sensor Streams</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px]">
            {/* Temperature */}
            <div className="bg-slate-950 p-2 rounded border border-slate-800">
              <div className="text-slate-400 flex items-center justify-between">
                <span>Temperature</span>
                <Thermometer className="w-3.5 h-3.5 text-red-400" />
              </div>
              <div className="text-white font-black text-sm mt-0.5">
                {sensorData.temperature}°C
              </div>
              <div className="text-[9px] text-slate-400">
                Rate: {temporalFeatures.rateOfChange.temperatureRate > 0 ? '+' : ''}{temporalFeatures.rateOfChange.temperatureRate}°C/min
              </div>
            </div>

            {/* Humidity */}
            <div className="bg-slate-950 p-2 rounded border border-slate-800">
              <div className="text-slate-400 flex items-center justify-between">
                <span>Rel Humidity</span>
                <Droplets className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <div className="text-white font-black text-sm mt-0.5">
                {sensorData.humidity}% RH
              </div>
              <div className="text-[9px] text-slate-400">
                Capacitive Sensor
              </div>
            </div>

            {/* Smoke / Gas */}
            <div className="bg-slate-950 p-2 rounded border border-slate-800">
              <div className="text-slate-400 flex items-center justify-between">
                <span>Combustible Gas</span>
                <Wind className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="text-white font-black text-sm mt-0.5">
                {sensorData.smokeGas} ppm
              </div>
              <div className="text-[9px] text-slate-400">
                MQ-2 Sensor Array
              </div>
            </div>

            {/* Particulates PM2.5 / PM10 */}
            <div className="bg-slate-950 p-2 rounded border border-slate-800">
              <div className="text-slate-400 flex items-center justify-between">
                <span>PM2.5 / PM10</span>
                <Activity className="w-3.5 h-3.5 text-yellow-400" />
              </div>
              <div className="text-white font-black text-sm mt-0.5">
                {sensorData.pm25} / {sensorData.pm10}
              </div>
              <div className="text-[9px] text-slate-400">
                µg/m³ Laser Scatter
              </div>
            </div>

            {/* Rainfall Rate */}
            <div className="bg-slate-950 p-2 rounded border border-slate-800">
              <div className="text-slate-400 flex items-center justify-between">
                <span>Precipitation</span>
                <CloudRain className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <div className="text-white font-black text-sm mt-0.5">
                {sensorData.rainfall} mm/h
              </div>
              <div className="text-[9px] text-slate-400">
                Cumul: {temporalFeatures.cumulativeRainfall}mm
              </div>
            </div>

            {/* Soil Moisture */}
            <div className="bg-slate-950 p-2 rounded border border-slate-800">
              <div className="text-slate-400 flex items-center justify-between">
                <span>Soil Moisture</span>
                <Droplets className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-white font-black text-sm mt-0.5">
                {sensorData.soilMoisture}%
              </div>
              <div className="text-[9px] text-slate-400">
                TDR Probe
              </div>
            </div>

            {/* Water Level */}
            <div className="bg-slate-950 p-2 rounded border border-slate-800">
              <div className="text-slate-400 flex items-center justify-between">
                <span>Water Level</span>
                <Activity className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <div className="text-white font-black text-sm mt-0.5">
                {sensorData.waterLevel} m
              </div>
              <div className="text-[9px] text-slate-400">
                Rise: {temporalFeatures.rateOfChange.waterLevelRiseRate > 0 ? '+' : ''}{temporalFeatures.rateOfChange.waterLevelRiseRate}m/min
              </div>
            </div>

            {/* Tilt / Inclination */}
            <div className="bg-slate-950 p-2 rounded border border-slate-800">
              <div className="text-slate-400 flex items-center justify-between">
                <span>Tilt & Vibration</span>
                <Compass className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="text-white font-black text-sm mt-0.5">
                {sensorData.tilt}° / {sensorData.vibration}g
              </div>
              <div className="text-[9px] text-slate-400">
                MPU-6050 Accelerometer
              </div>
            </div>
          </div>

          {/* Camera Edge Confidence */}
          <div className="mt-2.5 pt-2 border-t border-slate-800">
            <div className="flex items-center gap-1.5 text-[10px] text-slate-300 font-bold mb-1.5">
              <Camera className="w-3.5 h-3.5 text-cyan-400" />
              <span>Camera Vision Feature Confidence:</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
              <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
                <div className="text-slate-400 text-[9px]">Flame Plume</div>
                <div className="font-black text-red-400">{(sensorData.camera.fireConfidence * 100).toFixed(0)}%</div>
              </div>
              <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
                <div className="text-slate-400 text-[9px]">Catchment Surge</div>
                <div className="font-black text-cyan-400">{(sensorData.camera.floodConfidence * 100).toFixed(0)}%</div>
              </div>
              <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
                <div className="text-slate-400 text-[9px]">Slope Debris</div>
                <div className="font-black text-amber-400">{(sensorData.camera.debrisConfidence * 100).toFixed(0)}%</div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. 443MHz LORA ROUTING & MULTI-HOP PATH */}
        <div className="bg-slate-900 border-2 border-slate-700 rounded-lg p-3">
          <div className="flex items-center gap-1.5 text-white font-black text-[11px] uppercase mb-2">
            <Radio className="w-4 h-4 text-cyan-400" />
            <span>443MHz LoRa Mesh Routing</span>
          </div>

          <div className="space-y-1.5 text-[10px]">
            <div className="flex justify-between">
              <span className="text-slate-400">Immediate Next Hop:</span>
              <strong className="text-cyan-300 text-xs">
                {selectedNode.nextHop === 0 ? 'Village Gateway (Direct)' : selectedNode.nextHop ? `Node ${selectedNode.nextHop}` : '—'}
              </strong>
            </div>

            <div>
              <span className="text-slate-400 block mb-0.5">Full Multi-Hop Route to Gateway:</span>
              <div className="bg-slate-950 p-1.5 rounded border border-slate-800 text-white font-bold flex items-center gap-1 flex-wrap">
                {selectedNode.routeToGateway.map((id, idx) => (
                  <span key={`p-${idx}`} className="flex items-center gap-1">
                    <span className={
                      id === currentMasterId 
                        ? 'text-amber-400 font-black' 
                        : id === 0 
                        ? 'text-emerald-400 font-black' 
                        : 'text-slate-200'
                    }>
                      {id === 0 ? 'GATEWAY' : id === currentMasterId ? `N${id}(MASTER)` : `N${id}`}
                    </span>
                    {idx < selectedNode.routeToGateway.length - 1 && (
                      <span className="text-cyan-400">→</span>
                    )}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex justify-between pt-1 border-t border-slate-800">
              <span className="text-slate-400">Master Candidate Score:</span>
              <span className="text-amber-400 font-bold">{selectedNode.electionScore} pts</span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-400">Transmitted Packets:</span>
              <span className="text-white font-bold">{selectedNode.transmittedPackets} pkts</span>
            </div>
          </div>
        </div>

      </div>
    </aside>
  );
};
