'use client';
import { useEffect, useState } from 'react';

export default function CrmLeads() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/leads`)
      .then(res => res.json())
      .then(data => {
        setLeads(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load leads", err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="mb-10">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 mb-2">CRM Leads</h1>
        <p className="text-gray-400">Manage and track your AI-driven lead pipeline.</p>
      </header>
      
      <div className="glass-panel overflow-hidden p-0">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/5 bg-white/5">
              <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Company</th>
              <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Contact</th>
              <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
              <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Priority Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-purple-400/60 font-medium tracking-widest uppercase text-sm animate-pulse">Loading intelligence...</td>
              </tr>
            ) : leads.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-20 text-center">
                  <div className="flex flex-col items-center">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-purple-500/10 to-orange-500/10 flex items-center justify-center mb-6 shadow-[inset_0_0_20px_rgba(168,85,247,0.2)] animate-[spin_10s_linear_infinite]">
                      <svg className="w-10 h-10 text-purple-500/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <p className="text-purple-300/60 font-medium tracking-wide">No active leads found in the pipeline.</p>
                  </div>
                </td>
              </tr>
            ) : (
              leads.map(lead => (
                <tr key={lead.id} className="hover:bg-purple-900/20 transition-all duration-300 group">
                  <td className="p-5">
                    <div className="font-bold text-white group-hover:text-purple-200 transition-colors">{lead.company?.name || 'Unknown'}</div>
                    <div className="text-xs text-purple-400/50 mt-1 uppercase tracking-wider">{lead.company?.domain}</div>
                  </td>
                  <td className="p-5">
                    <div className="text-gray-200 font-medium">{lead.contact?.name || 'Unknown'}</div>
                    <div className="text-xs text-orange-400/60 mt-1 tracking-wider uppercase">{lead.contact?.role}</div>
                  </td>
                  <td className="p-5">
                    <span className={`badge shadow-sm ${
                      lead.status === 'CONTACTED' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 
                      lead.status === 'FOLLOW_UP' ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30' : 
                      'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                    }`}>
                      {lead.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="p-5 text-right">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#05030a]/80 border border-purple-500/20 font-mono text-sm font-black text-transparent bg-clip-text bg-gradient-to-br from-orange-400 to-purple-500 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] group-hover:shadow-[0_0_15px_rgba(168,85,247,0.4)] transition-all duration-500">
                      {lead.priorityScore}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
