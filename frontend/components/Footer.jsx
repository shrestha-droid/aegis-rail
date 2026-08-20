import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="w-full bg-ocean-bg border-t border-ocean-border py-8 px-4 font-mono rounded-none">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-4 h-4 bg-ocean-mauve rounded-none"></div>
            <span className="font-bold text-ocean-light text-base tracking-wider">AEGIS-RAIL DISPATCH</span>
          </div>
          <p className="text-ocean-soft text-xs leading-relaxed">
            High-performance real-time railway conflict prediction & dispatch engine. Exclusively for authorized railway operations officials.
          </p>
        </div>

        <div>
          <h4 className="text-ocean-peach font-bold text-xs tracking-widest uppercase mb-3 border-b border-ocean-border pb-1">
            INTERNAL ADMIN
          </h4>
          <ul className="space-y-1.5 text-xs text-ocean-soft">
            <li><Link href="/dashboard" className="hover:text-ocean-peach transition-colors">Main Network Map</Link></li>
            <li><Link href="/stations" className="hover:text-ocean-peach transition-colors">Station Manifests & Gantt</Link></li>
            <li><Link href="/alerts" className="hover:text-ocean-peach transition-colors">Manual Alerts or Issue Management Console</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-ocean-peach font-bold text-xs tracking-widest uppercase mb-3 border-b border-ocean-border pb-1">
            SYSTEM VERSIONING
          </h4>
          <ul className="space-y-1 text-xs text-ocean-soft">
            <li>CORE_BUILD: <span className="text-ocean-light">v2.0.4-PROD</span></li>
            <li>FASTAPI_WS: <span className="text-ocean-light">ONLINE (PORT 8000)</span></li>
            <li>AI_OPTIMIZER: <span className="text-ocean-peach">OR-TOOLS ACTIVE</span></li>
          </ul>
        </div>

        <div>
          <h4 className="text-ocean-peach font-bold text-xs tracking-widest uppercase mb-3 border-b border-ocean-border pb-1">
            DISPATCH SUPPORT
          </h4>
          <p className="text-xs text-ocean-soft">EMERGENCY HOTLINE: <span className="text-ocean-light font-bold">+91 1800 1234</span></p>
          <p className="text-xs text-ocean-soft mt-1">SECURE NETWORK: <span className="text-ocean-mauve">GRID-NET-SEC-7</span></p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto border-t border-ocean-dark/40 mt-8 pt-4 flex flex-col md:flex-row justify-between items-center text-[11px] text-ocean-soft">
        <span>© 2026 AEGIS-RAIL DISPATCH SYSTEMS. STRICTLY CONFIDENTIAL.</span>
        
      </div>
    </footer>
  );
}
