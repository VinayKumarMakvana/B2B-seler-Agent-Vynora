'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();

  const links = [
    { name: 'Dashboard', path: '/' },
    { name: 'Analytics', path: '/analytics' },
    { name: 'CRM Leads', path: '/crm' },
    { name: 'Approvals', path: '/approvals', badge: 'Queue' },
    { name: 'Proposals', path: '/proposals' },
    { name: 'Invoices & Delivery', path: '/invoices' },
  ];

  return (
    <aside className="w-[280px] bg-[#0d0816]/80 backdrop-blur-2xl border-r border-white/5 p-6 flex flex-col gap-8 z-20 shadow-[4px_0_24px_rgba(0,0,0,0.5)]">
      <div className="group cursor-default relative">
        <div className="absolute -inset-2 bg-gradient-to-r from-orange-500/20 to-purple-600/20 blur-lg opacity-0 group-hover:opacity-100 transition duration-1000"></div>
        <h2 className="relative text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-purple-500 to-indigo-600 tracking-widest drop-shadow-[0_0_15px_rgba(168,85,247,0.3)]">VYNORA</h2>
        <p className="relative text-[9px] text-purple-300/70 font-bold tracking-[0.2em] uppercase mt-1">Technology • Innovation • Impact</p>
      </div>

      <nav className="flex flex-col gap-2">
        {links.map((link) => {
          const isActive = pathname === link.path;
          return (
            <Link key={link.path} href={link.path} className="no-underline group/link">
              <div
                className={`flex justify-between items-center px-4 py-3 rounded-xl transition-all duration-500 ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-500/20 to-orange-500/10 text-purple-300 font-bold shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] border border-purple-500/30'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent hover:border-white/5 hover:translate-x-1'
                }`}
              >
                <span>{link.name}</span>
                {link.badge && (
                  <span className="bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-[0_0_10px_rgba(244,63,94,0.2)]">
                    {link.badge}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </nav>
      
      <div className="mt-auto pt-6 border-t border-white/5">
        <div className="flex items-center gap-3 px-2 group/admin cursor-pointer">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-orange-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white shadow-[0_0_15px_rgba(168,85,247,0.4)] group-hover/admin:shadow-[0_0_25px_rgba(249,115,22,0.6)] transition-all duration-500">
            VY
          </div>
          <div>
            <p className="text-sm font-bold text-white group-hover/admin:text-purple-300 transition-colors">Vynora Admin</p>
            <p className="text-xs text-purple-400/60 uppercase tracking-widest">System Control</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
