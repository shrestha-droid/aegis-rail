"use client";
import React, { useState, useEffect } from 'react';

export default function AegisMergedDashboard() {
  // === ENVIRONMENT VARIABLES (Fixes Vercel Deployment) ===
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws/stream";

  // === UI & SYSTEM STATES ===
  const [scenarioData, setScenarioData] = useState(null);
  const [sandboxMode, setSandboxMode] = useState(false);
  const [viewMode, setViewMode] = useState('RADAR'); 
  const [kpiData, setKpiData] = useState(null);
  const [ws, setWs] = useState(null);

  // === SIMULATION & TIMING STATES ===
  const [countdown, setCountdown] = useState(30);
  const [actionExpired, setActionExpired] = useState(false);
  const [approved, setApproved] = useState(false);

  // === ALERTS & FORM STATES (From your code) ===
  const [alerts, setAlerts] = useState([]);
  const [statusMsg, setStatusMsg] = useState('');
  const [formData, setFormData] = useState({
    train_id: 'TR-801', alert_type: 'SPEED_VIOLATION', severity: 'CRITICAL', description: '', location: ''
  });

  // 1. Fetch KPI Data
  useEffect(() => {
    const fetchKPIs = async () => {
      try {
        const response = await fetch(`${API_URL}/api/v1/kpi`);
        if (response.ok) setKpiData(await response.json());
      } catch (error) { console.error("Failed to fetch KPIs"); }
    };
    fetchKPIs();
  }, [API_URL]);

  // 2. Fetch Alerts (From your code, upgraded with API_URL)
  const fetchAlerts = () => {
    fetch(`${API_URL}/api/v1/alerts`)
      .then((res) => res.json())
      .then((data) => setAlerts(data))
      .catch(() => {
        // Fallback mock data
        setAlerts([
          { id: "ALT-1001", train_id: "TR-404", alert_type: "SPEED_VIOLATION", severity: "CRITICAL", description: "Locomotive exceeded track curved threshold by +12 km/h at Switch Sector B-4.", location: "Kalyan Outer Line #3", timestamp: new Date().toISOString() },
          { id: "ALT-1002", train_id: "TR-801", alert_type: "SIGNAL_DELAY", severity: "WARNING", description: "Holding on automatic block signal #142 due to clearance delay ahead.", location: "Kanpur Central Approach", timestamp: new Date().toISOString() }
        ]);
      });
  };

  useEffect(() => { fetchAlerts(); }, []);

  // 3. WebSocket Connection (Using WS_URL Fix)
  useEffect(() => {
    const socket = new WebSocket(WS_URL);
    socket.onopen = () => {
      console.log("WebSocket Connected: Live Stream Active");
      socket.send("NEXT"); 
    };
    socket.onmessage = (event) => {
      setScenarioData(JSON.parse(event.data));
      setCountdown(30);
      setActionExpired(false);
      setApproved(false);
    };
    setWs(socket);
    return () => socket.close();
  }, [WS_URL]);

  // 4. Auto-Advance Loop (Waits 3s after resolution for animation to finish)
  useEffect(() => {
    let clearanceTimer;
    if (approved || actionExpired) {
      clearanceTimer = setTimeout(() => { handleNextScenario(); }, 3000); 
    }
    return () => clearTimeout(clearanceTimer);
  }, [approved, actionExpired]);

  // 5. Delayed 'Execute AI' Pop-up Logic for Critical Alerts
  useEffect(() => {
    const timers = alerts.map((alert, index) => {
      if (alert.severity === 'CRITICAL' && !alert.showAction) {
        return setTimeout(() => {
          setAlerts(prev => {
            const newList = [...prev];
            if(newList[index]) newList[index] = { ...newList[index], showAction: true };
            return newList;
          });
        }, 3000); // 3 second delay
      }
      return null;
    });
    return () => timers.forEach(t => t && clearTimeout(t));
  }, [alerts]);

  // 6. HITL Countdown Timer
  useEffect(() => {
    if (scenarioData && countdown > 0 && !actionExpired && !approved) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && scenarioData && !approved && !actionExpired) {
      handleApprove("AUTO-EXECUTED: Safety protocol engaged");
      setActionExpired(true);
    }
  }, [countdown, actionExpired, approved, scenarioData]);

  // === HANDLERS ===
  const handleNextScenario = () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      setScenarioData(null); 
      ws.send("NEXT");
    }
  };

  const handleApprove = async (actionType = "Controller Overridden & Approved") => {
    setApproved(true);
    // Auto-resolve critical alerts visually
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
    try {
      const res = await fetch(`${API_URL}/api/v1/alerts/trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setStatusMsg('ALERT SUCCESSFULLY LOGGED!');
        setFormData({ train_id: 'TR-801', alert_type: 'SPEED_VIOLATION', severity: 'CRITICAL', description: '', location: '' });
        fetchAlerts();
      } else throw new Error();
    } catch (err) {
      setStatusMsg('LOCAL MOCK LOGGED (API OFFLINE)');
      setAlerts([{ id: `ALT-${Date.now()}`, ...formData, timestamp: new Date().toISOString() }, ...alerts]);
    }
  };

  // === DATA EXTRACTION & KINEMATICS ===
  const train1Id = scenarioData?.scenario?.train_1_id || "TR-801";
  const train2Id = scenarioData?.scenario?.train_2_id || "TR-404";
  const priorityTrain = scenarioData?.priority_train || train1Id; 
  const recommendation = scenarioData?.ai_recommendation || "Calculating optimal route...";
  
  let t1X = -150, t1Y = 0, t2X = 1050, t2Y = 0;
  if (scenarioData) {
    if (approved || actionExpired) {
      // Smooth exit animation
      t1X = priorityTrain === train1Id ? 1100 : 350;
      t1Y = priorityTrain === train1Id ? 0 : -115;
      t2X = priorityTrain === train2Id ? -200 : 550;
      t2Y = priorityTrain === train2Id ? 0 : -115;
    } else {
      // Smooth creep towards bottleneck
      t1X = 0 + (30 - countdown) * 4;
      t2X = 900 - (30 - countdown) * 4;
    }
  }
  const movementTransition = (approved || actionExpired) ? 'transform 2.5s cubic-bezier(0.4, 0, 0.2, 1)' : 'transform 1s linear';

  return (
    <div className="min-h-screen w-full bg-ocean-bg text-ocean-light font-mono flex flex-col xl:flex-row overflow-hidden">
      
      {/* ================= LEFT SIDE: MERGED VIEWPORT & ALERTS ================= */}
      <div className="flex-1 relative flex flex-col p-6 overflow-y-auto h-screen scrollbar-hide">
        
        {/* Header Setup */}
        <div className="w-full max-w-5xl mx-auto flex justify-between items-center mb-6">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-black tracking-widest text-ocean-light flex items-center gap-3">
              <span className="w-3 h-3 bg-ocean-mauve inline-block animate-pulse"></span>
              AEGIS<span className="text-ocean-peach">RAIL</span>
            </h1>
            <div className={`px-3 py-1 text-[10px] font-bold rounded-full border uppercase tracking-wider ${sandboxMode ? 'border-ocean-mauve text-ocean-mauve' : 'border-ocean-border text-ocean-soft'}`}>
              {sandboxMode ? 'SANDBOX ACTIVE' : 'LIVE STREAM FEED'}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button onClick={handleNextScenario} className="px-4 py-2 text-[10px] font-bold rounded-full border border-ocean-peach/50 text-ocean-peach hover:bg-ocean-peach/10 transition-all tracking-wider mr-2 uppercase">
              SCENARIO ⏭
            </button>
            <button onClick={() => setViewMode('RADAR')} className={`px-4 py-2 text-[10px] rounded-full border font-bold uppercase tracking-wider transition-all ${viewMode === 'RADAR' ? 'bg-ocean-mauve border-ocean-mauve text-ocean-bg' : 'border-ocean-border text-ocean-soft hover:bg-ocean-surface'}`}>
              TRACK MIMIC
            </button>
            <button onClick={() => setViewMode('KPI')} className={`px-4 py-2 text-[10px] rounded-full border font-bold uppercase tracking-wider transition-all ${viewMode === 'KPI' ? 'bg-ocean-mauve border-ocean-mauve text-ocean-bg' : 'border-ocean-border text-ocean-soft hover:bg-ocean-surface'}`}>
              NETWORK KPIs
            </button>
          </div>
        </div>

        {/* Dynamic Viewport (Map or KPI) */}
        <div className="w-full max-w-5xl mx-auto aspect-[21/9] border border-ocean-border bg-ocean-surface overflow-hidden shadow-[0_0_30px_rgba(162,117,142,0.15)] flex items-center justify-center shrink-0">
          {viewMode === 'RADAR' ? (
            <svg viewBox="0 0 1000 400" className="w-full h-full drop-shadow-2xl">
              <defs>
                <pattern id="track" width="20" height="10" patternUnits="userSpaceOnUse">
                  <rect width="20" height="10" fill="none" />
                  <line x1="10" y1="-5" x2="10" y2="15" stroke="#222" strokeWidth="3" />
                </pattern>
                <linearGradient id="beamRight" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#A2758E" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#A2758E" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="beamLeft" x1="100%" y1="0%" x2="0%" y2="0%">
                  <stop offset="0%" stopColor="#D98A7A" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#D98A7A" stopOpacity="0" />
                </linearGradient>
              </defs>

              <path d="M 250 200 C 350 80, 650 80, 750 200" fill="none" stroke="#111" strokeWidth="16" />
              <path d="M 250 200 C 350 80, 650 80, 750 200" fill="none" stroke="url(#track)" strokeWidth="16" />
              <path d="M 250 200 C 350 80, 650 80, 750 200" fill="none" stroke="#A2758E" strokeWidth="1" />

              <line x1="0" y1="200" x2="1000" y2="200" stroke="#111" strokeWidth="16" />
              <line x1="0" y1="200" x2="1000" y2="200" stroke="url(#track)" strokeWidth="16" />
              <line x1="0" y1="200" x2="1000" y2="200" stroke="#A2758E" strokeWidth="1" />

              <circle cx="250" cy="200" r="6" fill={(approved || actionExpired) && priorityTrain !== train1Id ? "#A2758E" : "#333"} className="transition-colors duration-500" />
              <circle cx="750" cy="200" r="6" fill={(approved || actionExpired) && priorityTrain !== train2Id ? "#A2758E" : "#333"} className="transition-colors duration-500" />

              <rect x="220" y="215" width="16" height="32" rx="4" fill="#111" stroke="#333" />
              <circle cx="228" cy="223" r="5" fill={(approved || actionExpired) ? (priorityTrain === train1Id ? "#10b981" : "#D98A7A") : "#A2758E"} className="transition-colors duration-500" />
              <circle cx="228" cy="239" r="5" fill={(approved || actionExpired) ? (priorityTrain !== train1Id ? "#10b981" : "#222") : "#222"} className="transition-colors duration-500" />

              <rect x="764" y="215" width="16" height="32" rx="4" fill="#111" stroke="#333" />
              <circle cx="772" cy="223" r="5" fill={(approved || actionExpired) ? (priorityTrain === train2Id ? "#10b981" : "#D98A7A") : "#A2758E"} className="transition-colors duration-500" />
              <circle cx="772" cy="239" r="5" fill={(approved || actionExpired) ? (priorityTrain !== train2Id ? "#10b981" : "#222") : "#222"} className="transition-colors duration-500" />

              {scenarioData && (
                <>
                  <g style={{ transform: `translate(${t1X}px, ${t1Y}px)`, transition: movementTransition }}>
                    <polygon points="100,195 250,150 250,250" fill="url(#beamRight)" />
                    <rect x="0" y="186" width="100" height="28" rx="4" fill="#E8DCD5" className="drop-shadow-lg" />
                    <rect x="75" y="182" width="20" height="36" rx="2" fill="#A2758E" />
                    <text x="45" y="175" fill="#E8DCD5" fontSize="13" fontWeight="bold" textAnchor="middle" className="tracking-widest">{train1Id}</text>
                  </g>

                  <g style={{ transform: `translate(${t2X}px, ${t2Y}px)`, transition: movementTransition }}>
                    <polygon points="0,195 -150,150 -150,250" fill="url(#beamLeft)" />
                    <rect x="0" y="186" width="100" height="28" rx="4" fill="#D98A7A" className="drop-shadow-lg" />
                    <rect x="5" y="182" width="20" height="36" rx="2" fill="#A2758E" />
                    <text x="55" y="235" fill="#D98A7A" fontSize="13" fontWeight="bold" textAnchor="middle" className="tracking-widest">{train2Id}</text>
                  </g>
                </>
              )}
            </svg>
          ) : (
            <div className="h-full w-full flex flex-col justify-center p-12">
              <h3 className="text-xl font-bold tracking-widest text-ocean-peach mb-8 text-center uppercase">Section Throughput Overview</h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-ocean-bg border border-ocean-border rounded-xl p-6 text-center">
                  <p className="text-xs uppercase tracking-wider text-ocean-soft mb-2">Throughput Efficiency</p>
                  <p className="text-4xl font-bold text-ocean-light">{kpiData?.throughput_efficiency || "..."}</p>
                </div>
                <div className="bg-ocean-bg border border-ocean-border rounded-xl p-6 text-center">
                  <p className="text-xs uppercase tracking-wider text-ocean-soft mb-2">Avg Delay Prevented</p>
                  <p className="text-4xl font-bold text-ocean-light">{kpiData?.avg_delay_prevented_mins || "..."} <span className="text-lg text-ocean-soft">mins</span></p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ================= MERGED ALERTS LIST (From Your Code) ================= */}
        <div className="w-full max-w-5xl mx-auto mt-8 flex-1">
          <h3 className="text-ocean-peach font-bold text-xs uppercase tracking-wider border-b border-ocean-border pb-3 mb-4">
            Recent Issues & Alert History
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {alerts.map((alt) => (
              <div key={alt.id} className={`border p-4 space-y-2 transition-all ${
                alt.severity === 'CRITICAL' ? 'bg-ocean-mauve/10 border-ocean-mauve border-l-4 border-l-ocean-mauve' : 
                alt.severity === 'RESOLVED' ? 'bg-emerald-900/10 border-emerald-500/50 border-l-4 border-l-emerald-500' :
                'bg-ocean-surface border-ocean-peach border-l-4 border-l-ocean-peach'
              }`}>
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-ocean-light font-bold">{alt.id}</span>
                    <span className="text-ocean-soft font-bold">[{alt.train_id}]</span>
                  </div>
                  <span className={`px-2 py-0.5 text-[10px] font-bold ${
                    alt.severity === 'CRITICAL' ? 'bg-ocean-mauve/20 text-ocean-mauve border border-ocean-mauve' : 
                    alt.severity === 'RESOLVED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500' :
                    'bg-ocean-peach/20 text-ocean-peach border border-ocean-peach'
                  }`}>
                    {alt.severity}
                  </span>
                </div>
                <div className="text-sm font-bold text-ocean-light">{alt.alert_type}</div>
                <p className="text-xs text-ocean-soft leading-relaxed">{alt.description}</p>
                
                <div className="flex justify-between items-center text-[10px] text-ocean-soft border-t border-ocean-border pt-2 mt-2">
                  <span>LOC: <strong className="text-ocean-light">{alt.location}</strong></span>
                  <span>{new Date(alt.timestamp).toLocaleTimeString()}</span>
                </div>

                {/* Delayed Execute Suggestion Button */}
                {alt.showAction && (
                  <button onClick={() => handleApprove("AI Recommendation Executed via Alerts")} className="mt-4 w-full py-2 bg-ocean-mauve hover:bg-ocean-mauve/80 text-ocean-bg text-xs font-bold tracking-widest transition-all animate-pulse shadow-[0_0_15px_rgba(162,117,142,0.4)]">
                    EXECUTE AI SUGGESTION →
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ================= RIGHT SIDE: CONTROL PANEL & CUSTOM ALERTS ================= */}
      <div className="w-full xl:w-96 bg-ocean-surface border-l border-ocean-border p-6 flex flex-col overflow-y-auto h-screen scrollbar-hide shrink-0 shadow-[-10px_0_30px_rgba(0,0,0,0.3)]">
        
        {/* AI Control Header */}
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-ocean-border">
          <h2 className="text-xs font-bold tracking-widest uppercase text-ocean-light">AI Protocol Console</h2>
          <button onClick={() => setSandboxMode(!sandboxMode)} className={`w-10 h-5 rounded-full relative transition-colors border ${sandboxMode ? 'bg-ocean-peach border-ocean-peach' : 'bg-ocean-bg border-ocean-border'}`}>
            <div className={`w-3 h-3 rounded-full bg-ocean-light absolute top-0.5 transition-transform ${sandboxMode ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>

        {/* AI Recommendation Panel */}
        <div className="bg-ocean-bg border border-ocean-border p-4 mb-4">
          <p className="text-[10px] uppercase tracking-wider text-ocean-soft mb-2">AI Recommendation</p>
          <p className="text-xs font-bold text-ocean-light leading-relaxed">{recommendation}</p>
        </div>

        {/* Dynamic Approve Button */}
        <button
          onClick={() => handleApprove("Controller Overridden & Approved")}
          disabled={actionExpired || approved || !scenarioData}
          className={`w-full py-4 font-bold tracking-widest text-xs transition-all mb-8 ${
            approved && !actionExpired ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-500/50 cursor-default' : 
            actionExpired ? 'bg-ocean-peach/20 text-ocean-peach border border-ocean-peach cursor-default' : 
            'bg-ocean-light text-ocean-bg hover:bg-white shadow-[0_0_20px_rgba(232,220,213,0.2)]'
          }`}
        >
          {approved && !actionExpired ? 'REROUTE APPROVED ✓' : actionExpired ? 'AUTO-EXECUTED ⚠' : `APPROVE REROUTE (${countdown}s)`}
        </button>

        {/* Manual Override Form (From Your Code) */}
        <div className="space-y-4">
          <h3 className="text-ocean-peach font-bold text-xs uppercase tracking-wider border-b border-ocean-border pb-3">
            Report Manual Issue
          </h3>
          
          {statusMsg && (
            <div className="p-2 border border-ocean-mauve bg-ocean-mauve/20 text-ocean-peach text-[10px] font-bold">
              {statusMsg}
            </div>
          )}

          <form onSubmit={handleCustomAlertSubmit} className="space-y-3 text-xs">
            <div>
              <label className="block text-ocean-soft mb-1">Train ID</label>
              <input type="text" value={formData.train_id} onChange={(e) => setFormData({ ...formData, train_id: e.target.value })} required className="w-full bg-ocean-bg border border-ocean-border text-ocean-light p-2 focus:border-ocean-mauve outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-ocean-soft mb-1">Issue Type</label>
                <select value={formData.alert_type} onChange={(e) => setFormData({ ...formData, alert_type: e.target.value })} className="w-full bg-ocean-bg border border-ocean-border text-ocean-light p-2 focus:border-ocean-mauve outline-none">
                  <option value="SPEED_VIOLATION">SPEED_VIOLATION</option>
                  <option value="ROUTE_DEV">ROUTE_DEV</option>
                  <option value="SIGNAL_PASSED_RED">SIGNAL_PASSED_RED</option>
                </select>
              </div>
              <div>
                <label className="block text-ocean-soft mb-1">Severity</label>
                <select value={formData.severity} onChange={(e) => setFormData({ ...formData, severity: e.target.value })} className="w-full bg-ocean-bg border border-ocean-border text-ocean-light p-2 focus:border-ocean-mauve outline-none">
                  <option value="CRITICAL">CRITICAL</option>
                  <option value="WARNING">WARNING</option>
                  <option value="INFO">INFO</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-ocean-soft mb-1">Location / Sector</label>
              <input type="text" placeholder="e.g. Kanpur Switch B-4" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} required className="w-full bg-ocean-bg border border-ocean-border text-ocean-light p-2 focus:border-ocean-mauve outline-none" />
            </div>
            <div>
              <label className="block text-ocean-soft mb-1">Dispatcher Description</label>
              <textarea rows={2} placeholder="Context for record..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} required className="w-full bg-ocean-bg border border-ocean-border text-ocean-light p-2 focus:border-ocean-mauve outline-none resize-none" />
            </div>
            <button type="submit" className="w-full bg-ocean-surface hover:bg-ocean-border text-ocean-light border border-ocean-border font-bold p-3 uppercase tracking-wider transition-all text-[10px]">
              + DISPATCH MANUAL ALERT
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}