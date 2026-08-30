'use client';
import { useEffect, useState } from 'react';

export default function AnalyticsDashboard() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/analytics/pipeline`)
      .then(res => res.json())
      .then(data => setData(data))
      .catch(err => console.error("Failed to load analytics", err));
  }, []);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="mb-10">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 mb-2">Analytics & Performance</h1>
        <p className="text-gray-400">Deep insights into your automated outreach and closing metrics.</p>
      </header>
      
      {!data ? (
        <div className="glass-panel flex items-center justify-center py-32">
          <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8">
          
          <div className="glass-panel group relative overflow-hidden border-purple-500/20 hover:border-purple-400/50 hover:shadow-[0_0_40px_rgba(168,85,247,0.2)] transition-all duration-700">
             <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-orange-500/10 to-purple-600/20 rounded-full blur-[60px] -mr-32 -mt-32 transition-all duration-1000 group-hover:scale-150 animate-pulse" style={{ animationDuration: '4s' }} />
             <div className="relative z-10">
                <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-300 to-purple-400 mb-8 flex items-center gap-3 drop-shadow-md">
                  <svg className="w-6 h-6 text-orange-400 drop-shadow-[0_0_10px_rgba(249,115,22,0.8)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Pipeline Overview
                </h2>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="bg-[#05030a]/50 p-6 rounded-2xl border border-purple-500/10 shadow-[inset_0_2px_15px_rgba(0,0,0,0.5)] group-hover:border-purple-500/30 transition-colors">
                    <p className="text-xs text-purple-400/60 uppercase tracking-widest font-bold mb-2">Total Leads</p>
                    <p className="text-4xl font-black text-white">{data.kpis?.totalLeads}</p>
                  </div>
                  <div className="bg-[#05030a]/50 p-6 rounded-2xl border border-orange-500/10 shadow-[inset_0_2px_15px_rgba(0,0,0,0.5)] group-hover:border-orange-500/30 transition-colors">
                    <p className="text-xs text-orange-400/60 uppercase tracking-widest font-bold mb-2">Contacted</p>
                    <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-orange-300">{data.kpis?.contacted}</p>
                  </div>
                  <div className="bg-[#05030a]/50 p-6 rounded-2xl border border-purple-500/10 shadow-[inset_0_2px_15px_rgba(0,0,0,0.5)] group-hover:border-purple-500/30 transition-colors">
                    <p className="text-xs text-purple-400/60 uppercase tracking-widest font-bold mb-2">Replied</p>
                    <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-purple-300">{data.kpis?.replied}</p>
                  </div>
                  <div className="bg-[#05030a]/50 p-6 rounded-2xl border border-indigo-500/10 shadow-[inset_0_2px_15px_rgba(0,0,0,0.5)] group-hover:border-indigo-500/30 transition-colors">
                    <p className="text-xs text-indigo-400/60 uppercase tracking-widest font-bold mb-2">Pending Approvals</p>
                    <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-indigo-300">{data.kpis?.pendingApprovals}</p>
                  </div>
                </div>
             </div>
          </div>

        </div>
      )}
    </div>
  );
}
