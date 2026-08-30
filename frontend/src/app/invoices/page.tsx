'use client';
import { useEffect, useState } from 'react';

export default function Invoices() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/invoices`)
      .then(res => res.json())
      .then(data => {
        setInvoices(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load invoices", err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="mb-10">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 mb-2">Invoices & Delivery</h1>
        <p className="text-gray-400">Track incoming payments and automated project delivery.</p>
      </header>
      
      {loading ? (
        <div className="glass-panel flex items-center justify-center py-32">
          <div className="w-12 h-12 border-4 border-orange-500/30 border-t-purple-500 rounded-full animate-spin" />
        </div>
      ) : invoices.length === 0 ? (
        <div className="glass-panel text-center py-32 flex flex-col items-center border-dashed border-purple-500/20 shadow-[0_0_50px_rgba(249,115,22,0.05)]">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-purple-500/10 to-orange-500/10 flex items-center justify-center mb-6 shadow-[inset_0_0_20px_rgba(249,115,22,0.2)] animate-[bounce_4s_infinite]">
            <svg className="w-10 h-10 text-orange-500/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-orange-400 mb-2 drop-shadow-md">No Invoices Yet</h2>
          <p className="text-orange-200/60 font-medium tracking-wide">Closed deals will appear here automatically.</p>
        </div>
      ) : (
        <div className="glass-panel overflow-hidden p-0 border-purple-500/20">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-purple-500/20 bg-purple-900/10">
                <th className="p-5 text-[10px] font-bold text-purple-400/60 uppercase tracking-widest">Invoice ID</th>
                <th className="p-5 text-[10px] font-bold text-purple-400/60 uppercase tracking-widest">Status</th>
                <th className="p-5 text-[10px] font-bold text-purple-400/60 uppercase tracking-widest text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-500/10">
              {invoices.map(invoice => (
                <tr key={invoice.id} className="hover:bg-purple-500/10 transition-colors group">
                  <td className="p-5">
                    <div className="font-mono text-sm text-purple-200 group-hover:text-white transition-colors">{invoice.id.substring(0,8)}</div>
                  </td>
                  <td className="p-5">
                    <span className={`badge shadow-sm ${invoice.status === 'PAID' ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30' : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'}`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="p-5 text-right">
                    <div className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-l from-orange-400 to-purple-400 group-hover:drop-shadow-[0_0_10px_rgba(249,115,22,0.4)] transition-all">
                      ${invoice.amountUsd.toLocaleString()}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
