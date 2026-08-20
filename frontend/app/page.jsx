"use client";
import React, { useState, useEffect, useRef } from 'react';

export default function AegisCommandCenter() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws/stream";

  const [scenarioData, setScenarioData] = useState(null);
  const [kpiData, setKpiData] = useState({ active_trains: 4, delayed_trains: 1 });
  const wsRef = useRef(null); 

  const [countdown, setCountdown] = useState(60);
  const [actionExpired, setActionExpired] = useState(false);
  const [approved, setApproved] = useState(false);

  const [selectedTrain, setSelectedTrain] = useState(null);

  const [alerts, setAlerts] = useState([]);
  const [statusMsg, setStatusMsg] = useState('');
  const [formData, setFormData] = useState({
    train_id: 'TR-801', alert_type: 'SPEED_VIOLATION', severity: 'WARNING', description: '', location: ''
  });

  const hasCriticalAlert = alerts.some(alt => alt.severity === 'CRITICAL');

  const fetchAlerts = () => {
    fetch(`${API_URL}/api/v1/alerts`)
      .then((res) => res.ok ? res.json() : [])
      .then((data) => { if (Array.isArray(data)) setAlerts(data); })
      .catch(() => {
        setAlerts([
          { id: "ALT-1001", train_id: "TR-404", alert_type: "SPEED_VIOLATION", severity: "RESOLVED", description: "Locomotive exceeded track curved threshold.", location: "Kalyan Outer Line #3", timestamp: new Date().toISOString() },
        ]);
      });
  };

  useEffect(() => { fetchAlerts(); }, []);

  useEffect(() => {
    const socket = new WebSocket(WS_URL);
    socket.onopen = () => socket.send("NEXT"); 
    socket.onmessage = (event) => {
      setScenarioData(JSON.parse(event.data));
      setCountdown(60); 
      setActionExpired(false);
      setApproved(false);
      setSelectedTrain(null); 
    };
    wsRef.current = socket;
    return () => socket.close();
  }, [WS_URL]);

  useEffect(() => {
    if (scenarioData && !approved && !actionExpired) {
      const risk = scenarioData.scenario?.delay_risk;
      if (risk === "HIGH" || risk === "CRITICAL") {
        const autoTimer = setTimeout(() => {
          const autoAlert = {
            id: `SYS-${Math.floor(Math.random() * 10000)}`,
            train_id: scenarioData.scenario.train_1_id,
            alert_type: 'COLLISION_WARNING',
            severity: 'CRITICAL',
            description: 'Automated telemetry detected critical overlap in sector approach. AI intervention required.',
            location: scenarioData.scenario.location || 'Central Junction',
            timestamp: new Date().toISOString(),
            showAction: false
          };
          setAlerts(prev => [autoAlert, ...prev]);
        }, 3000); 
        return () => clearTimeout(autoTimer);
      }
    }
  }, [scenarioData, approved, actionExpired]);

  useEffect(() => {
    let timer;
    if (approved || actionExpired) {
      timer = setTimeout(() => { handleNextScenario(); }, 4000); 
    }
    return () => clearTimeout(timer);
  }, [approved, actionExpired]);

  useEffect(() => {
    const timers = alerts.map((alert, index) => {
      if (alert.severity === 'CRITICAL' && !alert.showAction) {
        return setTimeout(() => {
          setAlerts(prev => {
            const newList = [...prev];
            if(newList[index]) newList[index] = { ...newList[index], showAction: true };
            return newList;
          });
        }, 2000); 
      }
      return null;
    });
    return () => timers.forEach(t => t && clearTimeout(t));
  }, [alerts]);

  useEffect(() => {
    if (scenarioData && countdown > 0 && !actionExpired && !approved) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && scenarioData && !approved && !actionExpired) {
      if (hasCriticalAlert) {
        handleApprove("AUTO-EXECUTED: Safety protocol engaged");
        setActionExpired(true);
      } else {
        setApproved(true); 
      }
    }
  }, [countdown, actionExpired, approved, scenarioData, hasCriticalAlert]);

  const handleNextScenario = () => {
    setApproved(false);
    setActionExpired(false);
    setScenarioData(null);
    setSelectedTrain(null);

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send("NEXT");
    } else {
      const socket = new WebSocket(WS_URL);
      socket.onopen = () => socket.send("NEXT");
      socket.onmessage = (event) => {
        setScenarioData(JSON.parse(event.data));
        setCountdown(60); 
        setActionExpired(false);
        setApproved(false);
        setSelectedTrain(null); 
      };
      wsRef.current = socket;
    }
  };

  const handleApprove = async (actionType = "Controller Overridden & Approved") => {
    setApproved(true);
    setAlerts(prev => prev.map(a => a.severity === 'CRITICAL' ? { ...a, severity: 'RESOLVED', showAction: false } : a));

    try {
      await fetch(`${API_URL}/api/v1/audit/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario_id: scenarioData?.scenario?.scenario_id || 0,
          priority_train_id: priorityTrain,
          action_taken: actionType 
        })
      });
    } catch (error) { console.error("Failed to log approval"); }
  };

  const handleCustomAlertSubmit = async (e) => {
    e.preventDefault();
    setStatusMsg('LOGGING TO BACKEND...');
    const newAlert = { id: `MNL-${Math.floor(Math.random() * 1000)}`, ...formData, timestamp: new Date().toISOString(), showAction: false };
    setAlerts(prev => [newAlert, ...prev]);
    setStatusMsg('ALERT LOGGED!');
    setFormData({ train_id: 'TR-801', alert_type: 'SPEED_VIOLATION', severity: 'WARNING', description: '', location: '' });
    setTimeout(() => setStatusMsg(''), 3000);
  };

  const handleTrainClick = (trainId, simulatedType) => {
    const isFreight = simulatedType.includes("Freight") || simulatedType.includes("Rake");
    setSelectedTrain({
      id: trainId,
      type: simulatedType,
      origin: isFreight ? 'Mundra Port (MDPR)' : 'New Delhi (NDLS)',
      destination: isFreight ? 'Kanpur Goods Shed (KPG)' : 'Mumbai Central (MMCT)',
      status: hasCriticalAlert && (trainId === train1Id || trainId === train2Id) ? 'DELAYED' : 'ON TIME',
      speed: isFreight ? '75 km/h' : '110 km/h',
      weight: isFreight ? '4500 t' : '1200 t'
    });
  };

  // === CLASSIC X-INTERSECTION KINEMATIC MATH (60s Duration) ===
  const train1Id = scenarioData?.scenario?.train_1_id || "TR-801";
  const train2Id = scenarioData?.scenario?.train_2_id || "TR-404";
  const train3Id = scenarioData ? `WAG-12 Freight (${10000 + (scenarioData.scenario.scenario_id * 7)})` : "TR-102"; 
  const train4Id = scenarioData ? `EMU Local (${11000 + (scenarioData.scenario.scenario_id * 3)})` : "TR-909"; 
  
  const priorityTrain = scenarioData?.priority_train || train1Id; 
  
  let t1X = 100, t1Y = 150, t2X = 900, t2Y = 100, t3X = 100, t3Y = 400, t4X = 900, t4Y = 350; 
  
  if (scenarioData) {
    const creep = 60 - countdown;
    if (approved || actionExpired) {
      t1X = priorityTrain === train1Id ? 900 : 420; t1Y = priorityTrain === train1Id ? 350 : 230;
      t2X = priorityTrain === train2Id ? 100 : 580; t2Y = priorityTrain === train2Id ? 400 : 220;
      t3X = priorityTrain === train3Id ? 900 : 420; t3Y = priorityTrain === train3Id ? 100 : 280; 
      t4X = priorityTrain === train4Id ? 100 : 580; t4Y = priorityTrain === train4Id ? 150 : 270;
    } else {
      // Convergence math towards center (500, 250) over 60 seconds
      t1X = 100 + (creep * 5.33); t1Y = 150 + (creep * 1.33);
      t2X = 900 - (creep * 5.33); t2Y = 100 + (creep * 2.0);
      t3X = 100 + (creep * 5.33); t3Y = 400 - (creep * 2.0);
      t4X = 900 - (creep * 5.33); t4Y = 350 - (creep * 1.33);
    }
  }
  const movementTransition = (approved || actionExpired) ? 'transform 2.5s cubic-bezier(0.4, 0, 0.2, 1)' : 'transform 1s linear';

  return (
    <div className="min-h-screen w-full bg-[#111116] text-[#EAEAEA] font-mono selection:bg-[#B48599] selection:text-white pb-24 overflow-x-hidden">
      
      <nav className="flex items-center justify-between border-b border-[#282834] bg-[#1A1A22] px-6 py-4 text-xs tracking-widest uppercase shadow-md">
        <div className="flex items-center gap-3">
          <div className="flex h-6 w-6 items-center justify-center bg-[#B48599] font-bold text-[#111116]">A</div>
          <span className="text-lg font-bold">AEGIS-RAIL</span>
        </div>
        <div className="flex items-center gap-2 border border-[#282834] px-3 py-1 bg-[#111116]">
          <div className="h-2 w-2 bg-[#B48599] animate-pulse rounded-full"></div>
          <span className="text-[#8A8A9E] font-bold">LIVE TELEMETRY</span>
        </div>
      </nav>

      <div className="max-w-[1600px] mx-auto px-6 mt-8 space-y-6">
        
        <div className="flex justify-between items-end border-b border-[#282834] pb-4">
          <div>
            <h1 className="flex items-center gap-3 text-2xl font-bold uppercase tracking-widest">
              <div className="h-3 w-3 bg-[#B48599]"></div>
              NETWORK COMMAND CENTER
            </h1>
            <p className="mt-2 text-[10px] text-[#8A8A9E] tracking-widest uppercase">
              INTERSECTION CONVERGENCE & CONFLICT RESOLUTION
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-2 flex flex-col gap-6">
            
            {/* INTERSECTION MAP */}
            <div className="border border-[#282834] bg-[#1A1A22] p-1 flex flex-col relative h-[500px]">
              <div className="flex justify-between items-center px-4 py-3 border-b border-[#282834]">
                <h3 className="text-xs font-bold uppercase tracking-widest">JUNCTION CONFLICT MAP</h3>
                <span className="text-[10px] text-[#8A8A9E] tracking-widest">TIME_REMAINING: {countdown}s</span>
              </div>
              
              <div className="flex-1 relative bg-[#0D0D12] overflow-hidden">
                <svg className="w-full h-full drop-shadow-2xl" viewBox="0 0 1000 500">
                  <defs>
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1A1A22" strokeWidth="1" />
                    </pattern>
                  </defs>
                  
                  <rect width="1000" height="500" fill="url(#grid)" />
                  <line x1="500" y1="0" x2="500" y2="500" stroke="#282834" strokeWidth="2" />
                  
                  {/* Intersecting Tracks */}
                  <line x1="100" y1="150" x2="900" y2="350" stroke="#3A3A4C" strokeWidth="2" strokeDasharray="6 6" />
                  <line x1="100" y1="400" x2="900" y2="100" stroke="#3A3A4C" strokeWidth="2" strokeDasharray="6 6" />

                  {/* TRAIN 3 (Hovering HUD Alert on top) */}
                  <g onClick={() => handleTrainClick(train3Id, "Heavy Freight")} style={{ transform: `translate(${t3X}px, ${t3Y}px)`, transition: movementTransition, opacity: 1, cursor: 'pointer' }}>
                    <rect x="-20" y="-15" width="40" height="30" fill="#8A8A9E" fillOpacity="0.15" stroke="#8A8A9E" strokeWidth="1" className="animate-pulse" />
                    <rect x="-6" y="-6" width="12" height="12" fill={(approved || actionExpired) && priorityTrain !== train3Id ? "#444" : "#8A8A9E"} />
                    {/* Hovering HUD Status Badge */}
                    <rect x="-45" y="-32" width="90" height="14" fill="#111116" stroke="#3A3A4C" strokeWidth="1" />
                    <text x="0" y="-22" fill="#8A8A9E" fontSize="8" fontWeight="bold" textAnchor="middle" className="tracking-widest">{train3Id} [NOMINAL]</text>
                  </g>

                  {/* TRAIN 4 */}
                  <g onClick={() => handleTrainClick(train4Id, "Commuter Local")} style={{ transform: `translate(${t4X}px, ${t4Y}px)`, transition: movementTransition, opacity: 1, cursor: 'pointer' }}>
                    <rect x="-20" y="-15" width="40" height="30" fill="#EAEAEA" fillOpacity="0.1" stroke="#EAEAEA" strokeWidth="1" className="animate-pulse" />
                    <rect x="-6" y="-6" width="12" height="12" fill={(approved || actionExpired) && priorityTrain !== train4Id ? "#444" : "#EAEAEA"} />
                    <rect x="-45" y="20" width="90" height="14" fill="#111116" stroke="#3A3A4C" strokeWidth="1" />
                    <text x="0" y="30" fill="#EAEAEA" fontSize="8" fontWeight="bold" textAnchor="middle" className="tracking-widest">{train4Id} [NOMINAL]</text>
                  </g>

                  {/* TRAIN 1 */}
                  <g onClick={() => handleTrainClick(train1Id, scenarioData?.scenario?.train_1_type || "Express")} style={{ transform: `translate(${t1X}px, ${t1Y}px)`, transition: movementTransition, opacity: 1, cursor: 'pointer' }}>
                    <rect x="-20" y="-15" width="40" height="30" fill="#EAEAEA" fillOpacity="0.1" stroke="#EAEAEA" strokeWidth="1" className="animate-pulse" />
                    <rect x="-6" y="-6" width="12" height="12" fill={(approved || actionExpired) && priorityTrain !== train1Id ? "#444" : "#EAEAEA"} />
                    <rect x="-50" y="-32" width="100" height="14" fill="#111116" stroke={hasCriticalAlert ? "#B48599" : "#3A3A4C"} strokeWidth="1" />
                    <text x="0" y="-22" fill={hasCriticalAlert ? "#B48599" : "#EAEAEA"} fontSize="8" fontWeight="bold" textAnchor="middle" className="tracking-widest">
                      {train1Id} {hasCriticalAlert ? "[DELAYED]" : "[ACTIVE]"}
                    </text>
                  </g>
                  
                  {/* TRAIN 2 */}
                  <g onClick={() => handleTrainClick(train2Id, scenarioData?.scenario?.train_2_type || "Express")} style={{ transform: `translate(${t2X}px, ${t2Y}px)`, transition: movementTransition, opacity: 1, cursor: 'pointer' }}>
                    <rect x="-20" y="-15" width="40" height="30" fill="#B48599" fillOpacity="0.15" stroke="#B48599" strokeWidth="1" className="animate-pulse" />
                    <rect x="-6" y="-6" width="12" height="12" fill={(approved || actionExpired) && priorityTrain !== train2Id ? "#444" : "#B48599"} />
                    <rect x="-50" y="20" width="100" height="14" fill="#111116" stroke={hasCriticalAlert ? "#B48599" : "#3A3A4C"} strokeWidth="1" />
                    <text x="0" y="30" fill="#B48599" fontSize="8" fontWeight="bold" textAnchor="middle" className="tracking-widest">
                      {train2Id} {hasCriticalAlert ? "[CONFLICT]" : "[ACTIVE]"}
                    </text>
                  </g>
                </svg>
              </div>
            </div>

            {/* RECENT ISSUES */}
            <div className="border border-[#282834] bg-[#1A1A22] p-6 space-y-4">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#EAEAEA] mb-4">
                AUTOMATED & MANUAL INCIDENT LOGS
              </h3>
              
              <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 scrollbar-hide">
                {alerts.map((alt) => (
                  <div key={alt.id} className={`border p-4 transition-all ${
                    alt.severity === 'CRITICAL' ? 'border-[#B48599] border-l-4 border-l-[#B48599] bg-[#2A1E24]/30' : 
                    alt.severity === 'WARNING' ? 'border-amber-600/50 border-l-4 border-l-amber-500 bg-amber-900/10' :
                    'border-emerald-900/50 border-l-4 border-l-emerald-600 bg-emerald-900/10'
                  }`}>
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-xs font-bold tracking-widest text-[#EAEAEA]">{alt.id} <span className="text-[#8A8A9E]">[{alt.train_id}]</span></div>
                      <div className={`px-2 py-0.5 text-[10px] font-bold tracking-widest border ${
                        alt.severity === 'CRITICAL' ? 'bg-[#B48599]/10 text-[#B48599] border-[#B48599]' : 'bg-emerald-900/30 text-emerald-500 border-emerald-600'
                      }`}>
                        {alt.severity}
                      </div>
                    </div>
                    <div className="text-sm font-bold text-[#EAEAEA] mb-1">{alt.alert_type}</div>
                    <p className="text-[11px] text-[#8A8A9E] leading-relaxed">{alt.description}</p>
                    {alt.showAction && (
                      <button onClick={() => handleApprove("AI Recommendation Executed via Alerts")} className="mt-4 w-full py-2 bg-[#B48599] text-[#111116] text-[10px] font-bold tracking-widest uppercase transition-all animate-pulse">
                        EXECUTE AI SUGGESTION →
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT CONTROLS */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            
            <button onClick={handleNextScenario} className="w-full bg-[#0D0D12] border border-[#282834] hover:border-[#B48599] text-[#EAEAEA] py-4 px-6 text-xs tracking-widest uppercase transition-all text-left flex justify-between items-center group">
              <span className="group-hover:text-[#B48599] transition-colors">LOAD NEXT SCENARIO</span>
              <span className="text-lg leading-none">⏭</span>
            </button>

            <div className="border border-[#282834] bg-[#1A1A22] p-6 space-y-4">
               <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#EAEAEA] mb-4 border-b border-[#282834] pb-2">
                AI BOTTLENECK PROTOCOL
              </h3>
              <p className="text-xs text-[#8A8A9E] leading-relaxed min-h-[40px]">
                {scenarioData?.ai_recommendation || "System monitoring for network conflicts..."}
              </p>
              
              <button
                onClick={() => handleApprove("Controller Overridden & Approved")}
                disabled={actionExpired || approved || !scenarioData || !hasCriticalAlert}
                className={`w-full py-4 font-bold tracking-widest text-[10px] uppercase transition-all ${
                  approved ? 'bg-emerald-900/30 text-emerald-500 border border-emerald-600/50 cursor-default' : 
                  !hasCriticalAlert ? 'bg-[#282834] text-[#EAEAEA] border border-[#3A3A4C] cursor-default' :
                  'bg-[#B48599] text-[#111116] hover:bg-white shadow-[0_0_15px_rgba(180,133,153,0.2)]'
                }`}
              >
                {approved ? 'REROUTE APPROVED ✓' : hasCriticalAlert ? `APPROVE REROUTE (${countdown}s)` : 'SYSTEM NOMINAL'}
              </button>
            </div>

            {/* CREATE CUSTOM ALERT */}
            <div className="border border-[#282834] bg-[#1A1A22] p-6">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#EAEAEA] mb-6">
                CREATE CUSTOM ALERT
              </h3>
              <form onSubmit={handleCustomAlertSubmit} className="space-y-4 text-xs tracking-wide text-[#EAEAEA]">
                <div>
                  <label className="block text-[10px] text-[#8A8A9E] uppercase tracking-widest mb-1.5">Train ID</label>
                  <input type="text" value={formData.train_id} onChange={(e) => setFormData({...formData, train_id: e.target.value})} required className="w-full bg-[#0D0D12] border border-[#282834] p-2.5 outline-none focus:border-[#B48599]" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-[#8A8A9E] uppercase tracking-widest mb-1.5">Issue Type</label>
                    <select value={formData.alert_type} onChange={(e) => setFormData({...formData, alert_type: e.target.value})} className="w-full bg-[#0D0D12] border border-[#282834] p-2.5 outline-none focus:border-[#B48599]">
                      <option value="SPEED_VIOLATION">SPEED_VIOLATION</option>
                      <option value="SIGNAL_DELAY">SIGNAL_DELAY</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#8A8A9E] uppercase tracking-widest mb-1.5">Severity</label>
                    <select value={formData.severity} onChange={(e) => setFormData({...formData, severity: e.target.value})} className="w-full bg-[#0D0D12] border border-[#282834] p-2.5 outline-none focus:border-[#B48599]">
                      <option value="CRITICAL">CRITICAL</option>
                      <option value="WARNING">WARNING</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] text-[#8A8A9E] uppercase tracking-widest mb-1.5">TRACK SECTOR</label>
                  <input type="text" placeholder="e.g. Kanpur Switch B-4" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} required className="w-full bg-[#0D0D12] border border-[#282834] p-2.5 outline-none focus:border-[#B48599]" />
                </div>
                <div>
                  <label className="block text-[10px] text-[#8A8A9E] uppercase tracking-widest mb-1.5">AUDIT DESCRIPTION</label>
                  <textarea rows={2} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} required className="w-full bg-[#0D0D12] border border-[#282834] p-2.5 outline-none focus:border-[#B48599] resize-none" />
                </div>
                <button type="submit" className="w-full bg-[#1A1A22] hover:bg-[#282834] text-[#EAEAEA] border border-[#282834] font-bold py-3 text-[10px] tracking-widest uppercase transition-colors">
                  + DISPATCH OVERRIDE
                </button>
              </form>
            </div>

          </div>
        </div>
      </div>

      {/* ================= BOTTOM FIXED TELEMETRY BANNER ================= */}
      {selectedTrain && (
        <div className="fixed bottom-0 left-0 right-0 bg-[#1A1A22] border-t-2 border-[#B48599] p-4 px-8 shadow-[0_-5px_25px_rgba(0,0,0,0.8)] z-50 flex items-center justify-between animate-in slide-in-from-bottom duration-300">
          <div className="flex items-center gap-6">
            <div className="flex h-10 w-10 items-center justify-center bg-[#B48599]/20 border border-[#B48599] text-[#B48599] font-bold">
              🚂
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h4 className="text-sm font-bold text-[#EAEAEA] tracking-widest">{selectedTrain.id}</h4>
                <span className={`px-2 py-0.5 text-[9px] font-bold border ${selectedTrain.status === 'DELAYED' ? 'bg-[#B48599]/20 text-[#B48599] border-[#B48599] animate-pulse' : 'bg-emerald-900/30 text-emerald-500 border-emerald-600'}`}>
                  {selectedTrain.status}
                </span>
              </div>
              <p className="text-[10px] text-[#8A8A9E] tracking-widest mt-1">
                TYPE: {selectedTrain.type} | ROUTE: {selectedTrain.origin} → {selectedTrain.destination}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-8 text-xs tracking-widest">
            <div>
              <span className="text-[#8A8A9E] block text-[9px]">SPEED</span>
              <span className="font-bold text-[#EAEAEA]">{selectedTrain.speed}</span>
            </div>
            <div>
              <span className="text-[#8A8A9E] block text-[9px]">WEIGHT</span>
              <span className="font-bold text-[#EAEAEA]">{selectedTrain.weight}</span>
            </div>
            <button onClick={() => setSelectedTrain(null)} className="ml-4 px-3 py-1 bg-[#282834] hover:bg-[#3A3A4C] text-[#EAEAEA] text-[10px] font-bold uppercase tracking-widest transition-colors">
              CLOSE PANEL ✕
            </button>
          </div>
        </div>
      )}

    </div>
  );
}