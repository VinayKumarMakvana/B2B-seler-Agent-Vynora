'use client';
import { useEffect, useState } from 'react';

export default function ApprovalsInbox() {
  const [approvals, setApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/approvals`)
      .then(res => res.json())
      .then(data => {
        setApprovals(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load approvals", err);
        setLoading(false);
      });
  }, []);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/approvals/${id}/${action}`, {
        method: 'POST',
      });
      setApprovals(prev => prev.filter(a => a.id !== id));
    } catch (e) {
      console.error(`Failed to ${action} approval`, e);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 mb-2">Approvals Inbox</h1>
          <p className="text-gray-400">Review AI-generated actions before they are executed.</p>
        </div>
        <span className="badge badge-pending px-4 py-2 text-sm backdrop-blur-md shadow-lg shadow-amber-500/10">
          <span className="w-2 h-2 rounded-full bg-amber-500 mr-2 animate-pulse inline-block"></span>
          {approvals.length} Pending
        </span>
      </header>
      
      {loading ? (
        <div className="glass-panel flex items-center justify-center py-32">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
            <h2 className="text-gray-400 font-medium tracking-widest uppercase text-sm">Loading pending tasks...</h2>
          </div>
        </div>
      ) : approvals.length === 0 ? (
        <div className="glass-panel text-center py-32 flex flex-col items-center border-dashed border-purple-500/20 shadow-[0_0_50px_rgba(168,85,247,0.05)]">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-orange-500/20 to-purple-600/20 flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(168,85,247,0.2)] animate-[bounce_3s_infinite]">
            <svg className="w-10 h-10 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-300 to-purple-400 mb-2 drop-shadow-md">Inbox Zero!</h2>
          <p className="text-purple-300/60 font-medium tracking-wide">No pending approvals. The AI is waiting for new triggers.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {approvals.map(approval => (
            <div key={approval.id} className="glass-panel group relative overflow-hidden border-purple-500/10 hover:border-purple-400/30 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_5px_30px_rgba(168,85,247,0.2)]">
              <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-orange-500/10 to-purple-600/10 rounded-full blur-[50px] -mr-40 -mt-40 transition-all duration-1000 group-hover:scale-150 group-hover:opacity-100 opacity-50" />
              
              <div className="relative z-10 flex flex-col gap-5">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="flex items-center gap-3 text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-purple-200 mb-1">
                      {approval.entityType.replace(/_/g, ' ').toUpperCase()}
                      <span className="badge bg-orange-500/20 text-orange-400 border-orange-500/30 shadow-[0_0_10px_rgba(249,115,22,0.3)]">{approval.riskLevel} Risk</span>
                    </h3>
                    <p className="text-purple-300/50 text-xs font-mono tracking-wider">ENTITY ID: {approval.entityId}</p>
                  </div>
                </div>

                <div className="bg-[#05030a]/60 p-6 rounded-xl border-l-4 border-purple-500 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]">
                  <p className="italic text-purple-100/90 text-sm leading-relaxed font-medium">
                    "{approval.proposedContent?.hookText || approval.proposedContent?.bumpText || JSON.stringify(approval.proposedContent)}"
                  </p>
                </div>
                
                <div className="bg-purple-900/10 p-5 rounded-xl border border-purple-500/10 backdrop-blur-md">
                  <p className="text-xs text-purple-300/80 leading-relaxed">
                    <strong className="text-orange-400 mr-2 uppercase tracking-widest font-bold">AI Reasoning:</strong> 
                    {approval.aiReasoning}
                  </p>
                </div>

                <div className="flex gap-4 mt-2">
                  <button className="btn btn-primary bg-gradient-to-r from-purple-600 to-indigo-600 border border-purple-400/30 shadow-[0_0_15px_rgba(147,51,234,0.4)]" onClick={() => handleAction(approval.id, 'approve')}>
                    Approve & Execute
                  </button>
                  <button className="btn bg-rose-900/40 text-rose-300 border border-rose-500/30 hover:bg-rose-800/60 hover:text-white transition-all shadow-[0_0_10px_rgba(225,29,72,0.2)]" onClick={() => handleAction(approval.id, 'reject')}>
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
