'use client';
import { useState, useEffect } from 'react';

export default function Home() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/analytics/pipeline`)
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error('Failed to load dashboard stats', err));
  }, []);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="mb-10">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 mb-2">Command Center</h1>
        <p className="text-gray-400">Real-time overview of your autonomous BDM pipeline.</p>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
        
        {/* Pending Approvals */}
        <div className="glass-panel group relative overflow-hidden border-purple-500/20 hover:border-purple-400/50 hover:shadow-[0_0_30px_rgba(168,85,247,0.3)] transition-all duration-500 hover:-translate-y-2">
          <div className="absolute top-0 right-0 w-48 h-48 bg-purple-600/20 rounded-full blur-[40px] -mr-20 -mt-20 group-hover:bg-purple-500/40 transition-all duration-700 animate-pulse" />
          <div className="relative z-10">
            <h3 className="text-xs font-bold text-purple-300 uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-purple-500 shadow-[0_0_10px_#a855f7] animate-ping" style={{ animationDuration: '2s' }}></span>
              Pending Approvals
            </h3>
            <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-purple-200 mb-2 drop-shadow-md">
              {stats ? stats.kpis?.pendingApprovals : '-'}
            </div>
            <p className="text-purple-400/80 text-sm font-semibold tracking-wide">Action required to unblock AI</p>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-purple-600 to-transparent scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-700" />
        </div>

        {/* Active Leads */}
        <div className="glass-panel group relative overflow-hidden border-orange-500/20 hover:border-orange-400/50 hover:shadow-[0_0_30px_rgba(249,115,22,0.3)] transition-all duration-500 hover:-translate-y-2">
          <div className="absolute top-0 right-0 w-48 h-48 bg-orange-600/20 rounded-full blur-[40px] -mr-20 -mt-20 group-hover:bg-orange-500/40 transition-all duration-700 animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="relative z-10">
            <h3 className="text-xs font-bold text-orange-300 uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-orange-500 shadow-[0_0_10px_#f97316]"></span>
              Active Leads
            </h3>
            <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-orange-200 mb-2 drop-shadow-md">
              {stats ? stats.kpis?.totalLeads : '-'}
            </div>
            <p className="text-orange-400/80 text-sm font-semibold tracking-wide">Currently in automated sequences</p>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-transparent scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-700" />
        </div>

        {/* Win Rate */}
        <div className="glass-panel group relative overflow-hidden border-indigo-500/20 hover:border-indigo-400/50 hover:shadow-[0_0_30px_rgba(99,102,241,0.3)] transition-all duration-500 hover:-translate-y-2">
          <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-600/20 rounded-full blur-[40px] -mr-20 -mt-20 group-hover:bg-indigo-500/40 transition-all duration-700 animate-pulse" style={{ animationDelay: '0.5s' }} />
          <div className="relative z-10">
            <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-indigo-500 shadow-[0_0_10px_#818cf8]"></span>
              Win Rate
            </h3>
            <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-indigo-200 mb-2 drop-shadow-md">
              {stats ? stats.kpis?.winRate : '-'}
            </div>
            <p className="text-indigo-400/80 text-sm font-semibold tracking-wide">System automated closing rate</p>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-transparent scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-700" />
        </div>

      </div>
    </div>
  );
}
