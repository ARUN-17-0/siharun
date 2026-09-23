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
  Mountain,
  Gauge,
  ShieldAlert
} from 'lucide-react';
import { NodeState, ScenarioType } from '../types';
import { LiveStationCameraFeed } from './LiveStationCameraFeed';

interface RightInspectorProps {
  selectedNode: NodeState | undefined;
  currentMasterId: number;
  scenario?: ScenarioType;
  disasterPhase?: number;
}

export const RightInspector: React.FC<RightInspectorProps> = ({
  selectedNode,
  currentMasterId,
  scenario = 'NORMAL',
  disasterPhase = 1
}) => {
  if (!selectedNode) {
    return (
      <aside className="w-96 h-full bg-[#0c1322]/95 backdrop-blur-md border-l border-slate-800 p-6 flex flex-col items-center justify-center text-center select-none z-10 font-sans">
        <Radio className="w-10 h-10 text-slate-600 mb-3 animate-pulse" />
        <h3 className="text-sm font-semibold text-slate-200">
          No Node Selected
        </h3>
        <p className="text-xs text-slate-400 mt-1 max-w-[240px]">
          Select any sensor node in the 3D digital-twin viewport or the fleet list to inspect its ESP32-S3 sensor suite, live surveillance camera feed, and edge computing outputs.
        </p>
      </aside>
    );
  }

  const { sensorData, temporalFeatures, aiResult, health } = selectedNode;
  const isMaster = selectedNode.id === currentMasterId;

  // Scientific derived metrics
  const factorOfSafety = Math.max(0.65, Math.round((1.45 - (sensorData.soilMoisture / 100) * 0.5 - (sensorData.tilt / 30) * 0.4) * 100) / 100);
  const porePressureKPa = Math.round((sensorData.soilMoisture * 0.65 + sensorData.rainfall * 0.4) * 10) / 10;
  const riverDischargeM3s = Math.round((sensorData.waterLevel * 48.5) * 10) / 10;

  return (
    <aside className="w-96 h-full bg-[#0c1322]/95 backdrop-blur-md border-l border-slate-800 flex flex-col z-10 select-none overflow-hidden shadow-lg font-sans">
      {/* Node Header */}
      <div className="p-3.5 border-b border-slate-800 bg-slate-900/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-400 flex items-center justify-center font-mono font-semibold text-sm">
              N{selectedNode.id}
            </span>
            <div>
              <h3 className="text-xs font-semibold text-slate-200 leading-tight">
                {selectedNode.name}
              </h3>
              <p className="text-[11px] text-slate-400">
                Zone: <strong className="text-sky-400 font-medium">{selectedNode.zone.replace('_', ' ')}</strong>
              </p>
            </div>
          </div>

          <div className="text-right">
            {isMaster ? (
              <span className="inline-flex items-center gap-1 bg-amber-500/15 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded text-[10px] font-medium shadow-sm">
                <Crown className="w-3 h-3 text-amber-400" />
                MASTER NODE
              </span>
            ) : (
              <span className={`text-xs font-medium ${
                aiResult.status === 'CRITICAL' ? 'text-rose-400' :
                aiResult.status === 'WARNING' ? 'text-amber-400' :
                aiResult.status === 'WATCH' ? 'text-sky-400' : 'text-emerald-400'
              }`}>
                Status: {aiResult.status}
              </span>
            )}
          </div>
        </div>

        {/* GPS Coordinates */}
        <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span>Lat: {sensorData.gps.lat.toFixed(4)}°N</span>
          <span>Lng: {sensorData.gps.lng.toFixed(4)}°E</span>
          <span className="text-slate-300 bg-slate-800/60 px-1.5 py-0.5 rounded border border-slate-700/40 text-[10px]">{sensorData.gps.alt}m MSL</span>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs">
        
        {/* 1. REAL-TIME OPTICAL & THERMAL SURVEILLANCE CAMERA FEED */}
        <LiveStationCameraFeed 
          node={selectedNode}
          scenario={scenario}
          disasterPhase={disasterPhase}
        />

        {/* 2. EDGE CLASSIFIER HEADS (3 HAZARDS ONLY) */}
        <div className="bg-slate-800/30 border border-slate-800/80 rounded-xl p-3">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-1.5 text-slate-200 font-semibold text-xs">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>ESP32-S3 Threat Assessment</span>
            </div>
            <span className="text-[10px] text-sky-400 bg-sky-500/10 border border-sky-500/30 px-2 py-0.2 rounded font-mono">
              {aiResult.inferenceTimeMs}ms latency
            </span>
          </div>

          <div className="space-y-2">
            {/* 1. Fire */}
            <div>
              <div className="flex justify-between text-[11px] mb-1 font-medium">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-rose-400" />
                  Forest Fire Risk
                </span>
                <span className={`font-mono ${aiResult.fireProbability > 50 ? 'text-rose-400 font-semibold' : 'text-slate-300'}`}>
                  {aiResult.fireProbability}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-rose-500 rounded-full transition-all" 
                  style={{ width: `${aiResult.fireProbability}%` }} 
                />
              </div>
            </div>

            {/* 2. Flood */}
            <div>
              <div className="flex justify-between text-[11px] mb-1 font-medium">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <Droplets className="w-3.5 h-3.5 text-sky-400" />
                  Flash Flood Risk
                </span>
                <span className={`font-mono ${aiResult.floodProbability > 50 ? 'text-sky-400 font-semibold' : 'text-slate-300'}`}>
                  {aiResult.floodProbability}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-sky-400 rounded-full transition-all" 
                  style={{ width: `${aiResult.floodProbability}%` }} 
                />
              </div>
            </div>

            {/* 3. Landslide */}
            <div>
              <div className="flex justify-between text-[11px] mb-1 font-medium">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <Mountain className="w-3.5 h-3.5 text-amber-400" />
                  Landslide / Shear Risk
                </span>
                <span className={`font-mono ${aiResult.landslideProbability > 50 ? 'text-amber-400 font-semibold' : 'text-slate-300'}`}>
                  {aiResult.landslideProbability}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-amber-400 rounded-full transition-all" 
                  style={{ width: `${aiResult.landslideProbability}%` }} 
                />
              </div>
            </div>
          </div>
        </div>

        {/* 3. SCIENTIFIC GEOTECHNICAL & HYDROLOGICAL METRICS (CWC & USGS STANDARDS) */}
        <div className="bg-slate-800/30 border border-slate-800/80 rounded-xl p-3">
          <div className="flex items-center gap-1.5 text-slate-200 font-semibold text-xs mb-2.5">
            <Gauge className="w-3.5 h-3.5 text-emerald-400" />
            <span>Disaster Physics Telemetry</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            {/* Hydrograph or Geotechnical based on zone */}
            {selectedNode.zone === 'RIVER_VALLEY' ? (
              <>
                <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60">
                  <div className="text-slate-400 text-[10px]">River Discharge</div>
                  <div className="text-sky-300 font-semibold font-mono text-xs mt-0.5">{riverDischargeM3s} m³/s</div>
                  <div className="text-[9px] text-slate-500 mt-0.5">Threshold: 160 m³/s</div>
                </div>
                <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60">
                  <div className="text-slate-400 text-[10px]">Stage Gauge</div>
                  <div className={`font-semibold font-mono text-xs mt-0.5 ${sensorData.waterLevel > 2.5 ? 'text-rose-400' : 'text-slate-200'}`}>
                    {sensorData.waterLevel} m MSL
                  </div>
                  <div className="text-[9px] text-slate-500 mt-0.5">Danger: 3.2m</div>
                </div>
              </>
            ) : (
              <>
                <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60">
                  <div className="text-slate-400 text-[10px]">Factor of Safety (Fs)</div>
                  <div className={`font-semibold font-mono text-xs mt-0.5 ${factorOfSafety < 1.0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {factorOfSafety} {factorOfSafety < 1.0 ? '(SLIP)' : '(STABLE)'}
                  </div>
                  <div className="text-[9px] text-slate-500 mt-0.5">Critical: &lt; 1.00</div>
                </div>
                <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60">
                  <div className="text-slate-400 text-[10px]">Pore Pressure (u)</div>
                  <div className="text-amber-300 font-semibold font-mono text-xs mt-0.5">{porePressureKPa} kPa</div>
                  <div className="text-[9px] text-slate-500 mt-0.5">TDR Piezometer</div>
                </div>
              </>
            )}

            {/* Fire Weather Index or Geophone Vibration */}
            <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60">
              <div className="text-slate-400 text-[10px]">Combustible Gas / VOC</div>
              <div className="text-amber-300 font-semibold font-mono text-xs mt-0.5">{sensorData.smokeGas} ppm</div>
              <div className="text-[9px] text-slate-500 mt-0.5">MQ-2 NDIR Array</div>
            </div>
            <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60">
              <div className="text-slate-400 text-[10px]">Geophone Vibration</div>
              <div className="text-sky-300 font-semibold font-mono text-xs mt-0.5">{sensorData.vibration} mm/s</div>
              <div className="text-[9px] text-slate-500 mt-0.5">Seismic Trigger</div>
            </div>
          </div>
        </div>

        {/* 4. SENSOR HARDWARE SUITE */}
        <div className="bg-slate-800/30 border border-slate-800/80 rounded-xl p-3">
          <div className="flex items-center gap-1.5 text-slate-200 font-semibold text-xs mb-2.5">
            <Layers className="w-3.5 h-3.5 text-sky-400" />
            <span>Environmental Sensor Suite</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* Ambient Temp */}
            <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60">
              <div className="text-slate-400 flex items-center justify-between text-[10px]">
                <span>Temperature</span>
                <Thermometer className="w-3.5 h-3.5 text-rose-400" />
              </div>
              <div className="text-slate-200 font-semibold font-mono text-sm mt-0.5">
                {sensorData.temperature}°C
              </div>
              <div className="text-[9px] text-slate-500 mt-0.5">
                Rate: {temporalFeatures.rateOfChange.temperatureRate > 0 ? '+' : ''}{temporalFeatures.rateOfChange.temperatureRate}°C/m
              </div>
            </div>

            {/* Humidity */}
            <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60">
              <div className="text-slate-400 flex items-center justify-between text-[10px]">
                <span>Rel Humidity</span>
                <Droplets className="w-3.5 h-3.5 text-sky-400" />
              </div>
              <div className="text-slate-200 font-semibold font-mono text-sm mt-0.5">
                {sensorData.humidity}% RH
              </div>
              <div className="text-[9px] text-slate-500 mt-0.5">
                Capacitive Sensor
              </div>
            </div>

            {/* Precipitation */}
            <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60">
              <div className="text-slate-400 flex items-center justify-between text-[10px]">
                <span>Precipitation</span>
                <CloudRain className="w-3.5 h-3.5 text-sky-400" />
              </div>
              <div className="text-slate-200 font-semibold font-mono text-sm mt-0.5">
                {sensorData.rainfall} mm/h
              </div>
              <div className="text-[9px] text-slate-500 mt-0.5 font-mono">
                Cumul: {temporalFeatures.cumulativeRainfall}mm
              </div>
            </div>

            {/* Soil Moisture */}
            <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60">
              <div className="text-slate-400 flex items-center justify-between text-[10px]">
                <span>Soil Moisture</span>
                <Droplets className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-slate-200 font-semibold font-mono text-sm mt-0.5">
                {sensorData.soilMoisture}%
              </div>
              <div className="text-[9px] text-slate-500 mt-0.5">
                Volumetric VWC
              </div>
            </div>
          </div>
        </div>

        {/* 5. 443MHz LORAWAN MESH ROUTING & PHYSICAL LAYER */}
        <div className="bg-slate-800/30 border border-slate-800/80 rounded-xl p-3">
          <div className="flex items-center gap-1.5 text-slate-200 font-semibold text-xs mb-2">
            <Radio className="w-3.5 h-3.5 text-sky-400" />
            <span>443MHz LoRa Mesh Routing</span>
          </div>

          <div className="space-y-1.5 text-[11px]">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Immediate Next Hop:</span>
              <strong className="text-sky-300 font-medium font-mono text-xs">
                {selectedNode.nextHop === 0 ? 'Village Gateway (Direct)' : selectedNode.nextHop ? `Node ${selectedNode.nextHop}` : '—'}
              </strong>
            </div>

            <div>
              <span className="text-slate-400 block mb-1">Multi-Hop Path to Gateway:</span>
              <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800/60 text-slate-200 font-medium flex items-center gap-1.5 flex-wrap text-[10px]">
                {selectedNode.routeToGateway.map((id, idx) => (
                  <span key={`p-${idx}`} className="flex items-center gap-1">
                    <span className={
                      id === currentMasterId 
                        ? 'text-amber-300 font-semibold' 
                        : id === 0 
                        ? 'text-emerald-400 font-semibold' 
                        : 'text-slate-300'
                    }>
                      {id === 0 ? 'GATEWAY' : id === currentMasterId ? `N${id}(MASTER)` : `N${id}`}
                    </span>
                    {idx < selectedNode.routeToGateway.length - 1 && (
                      <span className="text-sky-400">→</span>
                    )}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-slate-800/60 text-[10px]">
              <div className="flex justify-between text-slate-400">
                <span>Modulation:</span>
                <span className="text-slate-200 font-mono">SF7 / 125kHz</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Carrier:</span>
                <span className="text-slate-200 font-mono">443.50 MHz</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>RF Signal:</span>
                <span className="text-emerald-400 font-mono font-medium">-88 dBm</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>SNR Ratio:</span>
                <span className="text-emerald-400 font-mono font-medium">+8.4 dB</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </aside>
  );
};
