'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Speedometer from '../../../components/Speedometer';
import { useWebSocketTelemetry } from '../../../hooks/useWebSocketTelemetry';

export default function TrainTelemetryPage({ params }) {
  const trainId = params?.id || 'TR-801';
  const { telemetryData } = useWebSocketTelemetry();
  const [routeData, setRouteData] = useState(null);

  // Fetch static route data from FastAPI
  useEffect(() => {
    fetch(`http://localhost:8000/api/v1/trains/${trainId}/route`)
      .then((res) => res.json())
      .then((data) => setRouteData(data))
      .catch(() => {
        // Fallback default mock if API is offline
        setRouteData({
          train_id: trainId,
          locomotive_model: "Vande Bharat Express (Class 18)",
          max_speed_limit: 160.0,
          max_capacity: 1128,
          max_weight: 3000.0,
          current_weight: 2450.0,
          passenger_count: 420,
          current_speed: 112.5,
          delay_delta_minutes: +3.5,
          route_waypoints: [
            { station_id: "NDLS", station_name: "New Delhi Central", eta: "10:00 AM", status: "COMPLETED" },
            { station_id: "CNB", station_name: "Kanpur Central", eta: "02:15 PM", status: "IN_TRANSIT" },
            { station_id: "PRYJ", station_name: "Prayagraj Junction", eta: "05:00 PM", status: "SCHEDULED" },
            { station_id: "BSB", station_name: "Varanasi Junction", eta: "07:30 PM", status: "SCHEDULED" },
          ]
        });
      });
  }, [trainId]);

  // Find live dynamic telemetry stream matching this train_id
  const liveMatch = telemetryData.find((t) => t.train_id === trainId);
  const currentSpeed = liveMatch ? liveMatch.current_speed : (routeData?.current_speed || 112.5);
  const currentWeight = liveMatch ? liveMatch.current_weight : (routeData?.current_weight || 2450.0);
  const passengerCount = liveMatch ? liveMatch.passenger_count : (routeData?.passenger_count || 420);

  if (!routeData) {
    return <div className="p-8 text-center text-ocean-peach font-mono bg-ocean-bg min-h-screen">LOADING LOCOMOTIVE TELEMETRY...</div>;
  }

  return (
    <div className="w-full bg-ocean-bg min-h-screen p-4 md:p-6 font-mono space-y-6">

      {/* Back Link & Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border border-ocean-border bg-ocean-surface p-4">
        <div>
          <Link href="/dashboard" className="text-ocean-peach text-xs hover:underline block mb-1">
            ← BACK TO MAIN NETWORK MAP
          </Link>
          <h1 className="text-xl md:text-2xl font-bold uppercase text-ocean-light tracking-wider flex items-center gap-3">
            LOCOMOTIVE TELEMETRY // {routeData.train_id}
          </h1>
          <span className="text-ocean-soft text-xs block mt-1">MODEL: {routeData.locomotive_model}</span>
        </div>

        {/* Delay Status Indicator */}
        <div className={`border p-3 text-right font-mono ${routeData.delay_delta_minutes > 0 ? 'border-ocean-peach bg-ocean-peach/10 text-ocean-peach' : 'border-ocean-mauve bg-ocean-mauve/10 text-ocean-light'
          }`}>
          <span className="text-[10px] text-ocean-soft block uppercase">Delay Status</span>
          <span className="text-xl font-extrabold">
            {routeData.delay_delta_minutes > 0 ? `+${routeData.delay_delta_minutes} MINS` : `${routeData.delay_delta_minutes} MINS (ON TIME)`}
          </span>
        </div>
      </div>

      {/* Main Grid: Speedometer + Load Metrics + Route Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column: Speedometer & Train Weight or Total Load/Passenger Load Cards */}
        <div className="space-y-6">

          {/* Dynamic Speedometer Gauge */}
          <Speedometer currentSpeed={currentSpeed} maxLimit={routeData.max_speed_limit} />

          {/* Load Metrics Card */}
          <div className="border border-ocean-border bg-ocean-surface p-4 space-y-4">
            <h3 className="text-ocean-peach font-bold text-xs uppercase tracking-wider border-b border-ocean-border pb-2">
              LOAD & Train Weight or Total Load METRICS
            </h3>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs text-ocean-soft mb-1">
                  <span>GROSS WEIGHT Train Weight or Total Load</span>
                  <span className="text-ocean-light font-bold">{currentWeight} / {routeData.max_weight} t</span>
                </div>
                <div className="w-full bg-ocean-bg h-2">
                  <div
                    className="bg-ocean-mauve h-2"
                    style={{ width: `${Math.min(100, (currentWeight / routeData.max_weight) * 100)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-ocean-soft mb-1">
                  <span>PASSENGER OCCUPANCY</span>
                  <span className="text-ocean-light font-bold">{passengerCount} / {routeData.max_capacity}</span>
                </div>
                <div className="w-full bg-ocean-bg h-2">
                  <div
                    className="bg-ocean-peach h-2"
                    style={{ width: `${Math.min(100, (passengerCount / (routeData.max_capacity || 1)) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Vertical Route Timeline & Dynamic ETAs (2 Cols) */}
        <div className="lg:col-span-2 border border-ocean-border bg-ocean-surface p-6 space-y-6">
          <h3 className="text-ocean-peach font-bold text-xs uppercase tracking-wider border-b border-ocean-border pb-3">
            VERTICAL ROUTE TIMELINE & DYNAMIC STATIONS ETAs
          </h3>

          <div className="relative pl-6 space-y-8 border-l-2 border-ocean-border my-4">
            {routeData.route_waypoints.map((stn, idx) => {
              const isDone = stn.status === 'COMPLETED';
              const isInTransit = stn.status === 'IN_TRANSIT';

              return (
                <div key={stn.station_id} className="relative group">
                  {/* Timeline Dot */}
                  <div className={`absolute -left-[31px] top-1 w-4 h-4 border border-ocean-bg ${isDone ? 'bg-ocean-medium' : isInTransit ? 'bg-ocean-mauve animate-ping' : 'bg-ocean-bg border-ocean-border'
                    }`} />
                  <div className={`absolute -left-[31px] top-1 w-4 h-4 border ${isDone ? 'bg-ocean-medium border-ocean-soft' : isInTransit ? 'bg-ocean-mauve border-ocean-peach' : 'bg-ocean-bg border-ocean-border'
                    }`} />

                  <div className="border border-ocean-border bg-ocean-bg p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                    <div>
                      <span className="text-xs text-ocean-peach font-bold tracking-widest">{stn.station_id}</span>
                      <h4 className="text-ocean-light font-bold text-base">{stn.station_name}</h4>
                    </div>

                    <div className="flex items-center gap-4 text-xs">
                      <div>
                        <span className="text-ocean-soft block text-[10px]">SCHEDULED ETA</span>
                        <span className="text-ocean-light font-bold">{stn.eta}</span>
                      </div>
                      <span className={`px-2 py-1 text-[10px] font-bold border ${isDone ? 'border-ocean-border bg-ocean-surface text-ocean-soft' :
                        isInTransit ? 'border-ocean-mauve bg-ocean-mauve/20 text-ocean-peach' :
                          'border-ocean-border bg-ocean-bg text-ocean-soft'
                        }`}>
                        {stn.status}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
