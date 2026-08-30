import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "../components/Sidebar";

export const metadata: Metadata = {
  title: "Vynora Autonomous BDM",
  description: "AI-Powered CRM and Outreach Engine",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased text-gray-100 bg-[#05030a] selection:bg-purple-500/30">
        <div className="flex min-h-screen relative overflow-hidden">
          {/* Subtle background glow effect */}
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none -z-10 animate-pulse" style={{ animationDuration: '8s' }} />
          <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-orange-500/10 rounded-full blur-[150px] pointer-events-none -z-10 animate-pulse" style={{ animationDuration: '12s' }} />
          
          <Sidebar />
          <main className="flex-1 p-8 overflow-y-auto z-10 relative">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
