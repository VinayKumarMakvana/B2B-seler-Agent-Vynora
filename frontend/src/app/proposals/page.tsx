'use client';
import { useEffect, useState } from 'react';

export default function Proposals() {
  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/closing/proposals`)
      .then(res => res.json())
      .then(data => {
        setProposals(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load proposals", err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="mb-10">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 mb-2">Active Proposals</h1>
        <p className="text-gray-400">Track and manage AI-generated project proposals.</p>
      </header>
      
      {loading ? (
        <div className="glass-panel flex items-center justify-center py-32">
          <div className="w-12 h-12 border-4 border-purple-500/30 border-t-orange-500 rounded-full animate-spin" />
        </div>
      ) : proposals.length === 0 ? (
        <div className="glass-panel text-center py-32 flex flex-col items-center border-dashed border-purple-500/20">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-purple-500/10 to-orange-500/10 flex items-center justify-center mb-6 animate-[pulse_4s_infinite] shadow-[inset_0_0_20px_rgba(168,85,247,0.2)]">
            <svg className="w-10 h-10 text-purple-400/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-300 to-purple-400 mb-2 drop-shadow-md">No Active Proposals</h2>
          <p className="text-purple-300/60 font-medium tracking-wide">The AI hasn't generated any proposals yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {proposals.map(proposal => (
            <div key={proposal.id} className="glass-panel group relative overflow-hidden border-purple-500/20 hover:border-purple-400/50 hover:shadow-[0_0_40px_rgba(168,85,247,0.2)] transition-all duration-500 hover:-translate-y-2">
              <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-orange-500/20 to-purple-600/30 rounded-full blur-[40px] -mr-16 -mt-16 transition-all duration-1000 group-hover:scale-150 animate-pulse" />
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-purple-200 mb-1 drop-shadow-sm">Proposal #{proposal.id.substring(0,8)}</h3>
                    <p className="text-purple-400/50 text-xs font-mono tracking-widest uppercase">Lead ID: {proposal.leadId}</p>
                  </div>
                  <span className="badge bg-purple-500/20 text-purple-300 border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.3)] px-3 py-1">{proposal.status}</span>
                </div>

                <div className="bg-[#05030a]/60 p-5 rounded-2xl border border-purple-500/10 mb-6 flex justify-between items-center shadow-[inset_0_2px_15px_rgba(0,0,0,0.5)]">
                  <div>
                    <p className="text-[10px] text-purple-400/60 font-bold uppercase tracking-widest mb-1">Version</p>
                    <p className="text-2xl font-black text-white">v{proposal.version}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-orange-400/60 font-bold uppercase tracking-widest mb-1">Value</p>
                    <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-l from-orange-400 to-purple-400 drop-shadow-[0_0_10px_rgba(249,115,22,0.3)]">${proposal.priceUsd.toLocaleString()}</p>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] text-purple-400/60 font-bold uppercase tracking-widest mb-2">Scope Data</p>
                  <pre className="bg-[#05030a]/80 p-5 rounded-2xl border border-purple-500/10 text-xs text-purple-200/80 font-mono overflow-x-auto shadow-inner">
                    {JSON.stringify(proposal.scopeData, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
