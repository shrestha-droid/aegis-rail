'use client';

import Link from 'next/link';
import { useWebSocketTelemetry } from '../../hooks/useWebSocketTelemetry';

export default function DashboardPage() {
  const { telemetryData, isConnected } = useWebSocketTelemetry();

  // Initial fallback trains if WS is connecting
  const activeTrains = telemetryData.length > 0 ? telemetryData : [
    { train_id: "TR-801", latitude: 28.6139, longitude: 77.2090, current_speed: 112.5, current_weight: 2450.0, passenger_count: 420, status: "ON_TIME" },
    { train_id: "TR-404", latitude: 19.0760, longitude: 72.8777, current_speed: 98.0, current_weight: 3800.0, passenger_count: 120, status: "DELAYED" },
    { train_id: "TR-909", latitude: 13.0827, longitude: 80.2707, current_speed: 135.0, current_weight: 1850.0, passenger_count: 650, status: "CRITICAL" },
    { train_id: "TR-102", latitude: 22.5726, longitude: 88.3639, current_speed: 85.2, current_weight: 4100.0, passenger_count: 0, status: "ON_TIME" }
  ];

  const totalActive = activeTrains.length;
  const delayedCount = activeTrains.filter(t => t.status === "DELAYED").length;
  const criticalCount = activeTrains.filter(t => t.status === "CRITICAL").length;

  return (
    <div className="w-full bg-ocean-bg min-h-screen p-4 md:p-6 font-mono space-y-6">

      {/* Top Header & Status */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border border-ocean-border bg-ocean-surface p-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold uppercase text-ocean-light tracking-wider flex items-center gap-3">
            <span className="w-3 h-3 bg-ocean-mauve inline-block"></span>
            Main Network Map
          </h1>
          <p className="text-ocean-soft text-xs mt-1">REAL-TIME SPATIAL POSITIONING & NETWORK HEALTH</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="border border-ocean-border bg-ocean-bg px-3 py-1.5 text-xs flex items-center gap-2">
            <span className={`w-2 h-2 ${isConnected ? 'bg-ocean-peach' : 'bg-ocean-mauve animate-pulse'}`}></span>
            <span className="text-ocean-soft">STREAM:</span>
            <span className={isConnected ? 'text-ocean-peach font-bold' : 'text-ocean-mauve font-bold'}>
              {isConnected ? 'LIVE WEBSOCKET' : 'FALLBACK SIM'}
            </span>
          </div>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border border-ocean-border bg-ocean-surface p-4 border-l-4 border-l-ocean-mauve">
          <span className="text-ocean-soft text-xs block">Active Trains or Running Trains</span>
          <div className="text-3xl font-extrabold text-ocean-light mt-1">{totalActive}</div>
          <span className="text-[10px] text-ocean-peach mt-2 block">TRACK SECTORS FULLY MONITORED</span>
        </div>

        <div className="border border-ocean-border bg-ocean-surface p-4 border-l-4 border-l-ocean-peach">
          <span className="text-ocean-soft text-xs block">DELAYED TRAINS</span>
          <div className="text-3xl font-extrabold text-ocean-peach mt-1">{delayedCount}</div>
          <span className="text-[10px] text-ocean-soft mt-2 block">Delay Time or Minutes Late &gt; +10 MINS</span>
        </div>

        <div className="border border-ocean-border bg-ocean-surface p-4 border-l-4 border-l-ocean-light">
          <span className="text-ocean-soft text-xs block">CRITICAL ALERTS / OVERRIDES</span>
          <div className="text-3xl font-extrabold text-ocean-mauve mt-1">{criticalCount}</div>
          <span className="text-[10px] text-ocean-mauve mt-2 block">IMMEDIATE DISPATCH ATTENTION REQ.</span>
        </div>
      </div>

      {/* Main Grid: Interactive Map & Live Feed Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Interactive Tactical Map Container (2 Cols) */}
        <div className="lg:col-span-2 border border-ocean-border bg-ocean-surface p-4 relative min-h-[450px] flex flex-col justify-between grid-bg">
          <div className="flex justify-between items-center border-b border-ocean-border pb-2">
            <span className="text-ocean-peach font-bold text-xs uppercase tracking-wider">Live Train Map</span>
            <span className="text-ocean-soft text-[10px]">GRID_SCALE: 1:50000</span>
          </div>

          {/* Interactive Map Visual Simulation Nodes */}
          <div className="relative w-full h-[360px] my-4 border border-ocean-border bg-ocean-bg/90 overflow-hidden flex items-center justify-center">
            {/* Grid Track SVG Lines */}
            <svg className="absolute inset-0 w-full h-full stroke-ocean-border stroke-1" xmlns="http://www.w3.org/2000/svg">
              <line x1="10%" y1="20%" x2="90%" y2="80%" stroke="#383C4D" strokeWidth="2" strokeDasharray="4 4" />
              <line x1="10%" y1="80%" x2="90%" y2="20%" stroke="#383C4D" strokeWidth="2" strokeDasharray="4 4" />
              <line x1="50%" y1="0%" x2="50%" y2="100%" stroke="#383C4D" strokeWidth="1" />
            </svg>

            {/* Dynamic Moving Nodes */}
            {activeTrains.map((train, idx) => {
              const xPos = 20 + ((idx * 25) % 65);
              const yPos = 25 + ((idx * 20) % 55);

              const isCritical = train.status === 'CRITICAL';
              const isDelayed = train.status === 'DELAYED';

              return (
                <Link
                  key={train.train_id}
                  href={`/trains/${train.train_id}`}
                  style={{ left: `${xPos}%`, top: `${yPos}%` }}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
                >
                  <div className={`relative p-2 border bg-ocean-bg transition-transform group-hover:scale-110 ${isCritical ? 'border-ocean-mauve bg-ocean-mauve/20' : isDelayed ? 'border-ocean-peach bg-ocean-peach/20' : 'border-ocean-mauve bg-ocean-surface'
                    }`}>
                    {/* Pulsing indicator */}
                    <div className={`w-3 h-3 ${isCritical ? 'bg-ocean-mauve animate-ping' : isDelayed ? 'bg-ocean-peach' : 'bg-ocean-mauve'}`} />

                    {/* Tooltip on Hover */}
                    <div className="absolute left-6 top-0 hidden group-hover:block bg-ocean-surface border border-ocean-mauve p-2 z-30 whitespace-nowrap text-xs shadow-lg">
                      <div className="text-ocean-light font-bold">{train.train_id}</div>
                      <div className="text-ocean-peach">SPEED: {train.current_speed} km/h</div>
                      <div className="text-ocean-soft">WEIGHT: {train.current_weight} t</div>
                      <div className="text-ocean-mauve text-[10px] underline mt-1">CLICK FOR TELEMETRY DASHBOARD →</div>
                    </div>
                  </div>
                  <span className="text-[10px] text-ocean-light font-bold block text-center mt-1 bg-ocean-bg/90 px-1 border border-ocean-border">
                    {train.train_id}
                  </span>
                </Link>
              );
            })}
          </div>

          <div className="flex justify-between items-center text-[10px] text-ocean-soft border-t border-ocean-border pt-2">
            <span>CLICK NODE TO VIEW DETAILED TELEMETRY</span>
            <span className="text-ocean-peach font-bold">LIVE WEBSOCKET UPDATES ACTIVE</span>
          </div>
        </div>

        {/* Active Trains List Panel (1 Col) */}
        <div className="border border-ocean-border bg-ocean-surface p-4 space-y-4">
          <h3 className="text-ocean-peach font-bold text-xs uppercase tracking-wider border-b border-ocean-border pb-2">
            Active Trains List
          </h3>

          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
            {activeTrains.map((train) => (
              <div key={train.train_id} className="border border-ocean-border bg-ocean-bg p-3 hover:border-ocean-mauve transition-colors">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-ocean-light font-bold text-sm">{train.train_id}</span>
                    <span className="text-[10px] text-ocean-soft block">POS: {train.latitude}, {train.longitude}</span>
                  </div>
                  <span className={`px-2 py-0.5 text-[10px] font-bold border ${train.status === 'CRITICAL' ? 'border-ocean-mauve bg-ocean-mauve/20 text-ocean-mauve' :
                    train.status === 'DELAYED' ? 'border-ocean-peach bg-ocean-peach/20 text-ocean-peach' :
                      'border-ocean-soft bg-ocean-surface text-ocean-light'
                    }`}>
                    {train.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-3 text-xs border-t border-ocean-border pt-2">
                  <div>
                    <span className="text-ocean-soft text-[10px] block">SPEED</span>
                    <span className="text-ocean-peach font-bold">{train.current_speed} km/h</span>
                  </div>
                  <div>
                    <span className="text-ocean-soft text-[10px] block">Train Weight or Total Load</span>
                    <span className="text-ocean-light font-bold">{train.current_weight} t</span>
                  </div>
                </div>

                <Link
                  href={`/trains/${train.train_id}`}
                  className="mt-3 block w-full text-center bg-ocean-surface hover:bg-ocean-mauve hover:text-ocean-bg border border-ocean-border text-ocean-light text-xs py-1.5 transition-colors font-bold uppercase"
                >
                  View Train Details or Live Stats →
                </Link>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
