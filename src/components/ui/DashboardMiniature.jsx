"use client";

import { 
  LayoutDashboard, 
  CalendarCheck, 
  Inbox, 
  FolderHeart, 
  Users, 
  HelpCircle,
  Clock,
  Calendar,
  CheckCircle2
} from "lucide-react";

export function DashboardMiniature() {
  return (
    <div className="w-full max-w-3xl bg-[#f8fafc] border border-slate-200/80 shadow-2xl rounded-3xl overflow-hidden flex text-[10px] select-none font-sans text-slate-800 animate-in fade-in zoom-in-95 duration-1000">
      
      {/* Icon-Only Sidebar Mockup */}
      <div className="w-14 bg-white border-r border-slate-100 py-4 flex flex-col items-center shrink-0 gap-6">
        {/* Logo */}
        <img 
          src="/favicon-io/android-chrome-192x192.png" 
          className="w-7 h-7 rounded-full shadow-md object-contain hover:scale-105 transition-transform" 
          alt="Si Cerdas Logo" 
        />

        {/* Navigation Group Icons */}
        <div className="flex flex-col gap-4 w-full items-center mt-2">
          {/* Active state Dashboard */}
          <div className="p-2 bg-primary text-white rounded-xl cursor-pointer shadow-md shadow-primary/20 hover:scale-105 transition-transform">
            <LayoutDashboard className="w-4 h-4" />
          </div>
          <div className="p-2 text-slate-400 hover:text-primary rounded-xl hover:bg-slate-50 transition-all cursor-pointer">
            <CalendarCheck className="w-4 h-4" />
          </div>
          <div className="p-2 text-slate-400 hover:text-primary rounded-xl hover:bg-slate-50 transition-all cursor-pointer">
            <Inbox className="w-4 h-4" />
          </div>
          <div className="p-2 text-slate-400 hover:text-primary rounded-xl hover:bg-slate-50 transition-all cursor-pointer">
            <FolderHeart className="w-4 h-4" />
          </div>
          <div className="p-2 text-slate-400 hover:text-primary rounded-xl hover:bg-slate-50 transition-all cursor-pointer">
            <Users className="w-4 h-4" />
          </div>
        </div>

        {/* Bottom Sidebar */}
        <div className="mt-auto flex flex-col gap-3 items-center w-full pt-4 border-t border-slate-100">
          <div className="text-slate-400 hover:text-primary cursor-pointer transition-colors">
            <HelpCircle className="w-4 h-4" />
          </div>
          
          <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[8px] cursor-pointer hover:scale-105 transition-all">
            U
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-5 flex flex-col gap-4 overflow-hidden min-w-0">
        
        {/* Top Welcome Banner */}
        <div className="relative rounded-2xl bg-gradient-to-r from-primary to-purple-600 text-white p-4 flex flex-col gap-0.5 shadow-lg shadow-primary/10 shrink-0">
          <span className="text-[7px] opacity-75 font-medium">Minggu, 19 Juli 2026</span>
          <h3 className="font-bold text-xs leading-tight tracking-tight">
            Selamat datang kembali, Utari, S.Sos.!
          </h3>
          <p className="text-[7px] opacity-85 leading-normal">
            Berikut ini adalah ikhtisar sisa cuti Anda dan permintaan cuti terbaru.
          </p>
        </div>

        {/* Grid Layout: Kuota Cuti (Left) and Permintaan Terbaru (Right) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 flex-1 min-h-0 overflow-y-auto p-1 pb-4">
          
          {/* Kuota Cuti Card (Vertical Column) */}
          <div className="md:col-span-5 bg-white border border-slate-100 rounded-2xl p-4 flex flex-col gap-3.5 shadow-sm justify-between">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">
                  Kuota Cuti Tahunan
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-black text-primary">14</span>
                  <span className="text-slate-400 font-semibold">/ 24</span>
                </div>
              </div>
              <div className="p-2 bg-primary/10 text-primary rounded-xl">
                <CalendarCheck className="w-4 h-4" />
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1">
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden flex">
                <div className="h-full bg-primary" style={{ width: "45.8%" }} />
                <div className="h-full bg-orange-400" style={{ width: "12.5%" }} />
              </div>
              <div className="flex gap-2 text-[6.5px] text-slate-500 font-semibold">
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
                  <span>Tersedia (11 h)</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400 inline-block" />
                  <span>Ditinjau (3 h)</span>
                </div>
              </div>
            </div>

            {/* Rincian Kuota list */}
            <div className="space-y-2 pt-2 border-t border-slate-50">
              <span className="text-[7.5px] font-bold text-slate-400 uppercase tracking-widest block">
                Rincian Kuota
              </span>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[9px]">
                  <span className="font-bold text-slate-800">Tahun 2026</span>
                  <div className="text-right">
                    <span className="font-bold text-slate-800">8</span>
                    <span className="text-slate-400"> / 12</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center text-[9px]">
                  <span className="font-bold text-slate-800">Tahun 2025</span>
                  <div className="text-right">
                    <span className="font-bold text-slate-800">3</span>
                    <span className="text-slate-400"> / 6</span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-[9px]">
                  <span className="font-bold text-slate-800">Tahun 2024</span>
                  <div className="text-right">
                    <span className="text-slate-550">6</span>
                    <span className="text-slate-400 mx-1">&rarr;</span>
                    <span className="font-bold text-orange-500">3</span>
                    <span className="text-slate-400"> / 6</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Subtext warning */}
            <p className="text-[6px] text-slate-400 leading-normal italic">
              * Kuota tahunan dihitung berdasarkan tahun kalender berjalan. Sisa cuti tidak diakumulasikan ke tahun berikutnya.
            </p>
          </div>

          {/* Permintaan Terbaru Card (Right Column - Compact Feed) */}
          <div className="md:col-span-7 bg-white border border-slate-100 rounded-2xl p-4 flex flex-col gap-3 shadow-sm justify-between">
            <div className="space-y-3">
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">
                Permintaan Terbaru
              </span>
              
              {/* Stack of Compact List Items */}
              <div className="flex flex-col gap-2">
                
                {/* Item 1: Pending request (Detailed with thin progress) */}
                <div className="border border-slate-100 rounded-xl p-3 bg-[#f8fafc]/50 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="font-bold text-slate-800 text-[9.5px]">Tahunan</span>
                      <span className="text-slate-450 text-[7.5px] font-medium">29 Jul - 31 Jul (3 hari)</span>
                    </div>
                    <span className="px-1.5 py-0.5 rounded-full bg-orange-50 text-orange-600 font-bold text-[6.5px] border border-orange-100 uppercase tracking-wider scale-95">
                      pending
                    </span>
                  </div>
                  
                  {/* Thin Progress bar */}
                  <div className="space-y-1 border-t border-slate-100/50 pt-1.5">
                    <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: "66%" }} />
                    </div>
                    <div className="flex justify-between items-center text-[6px] text-slate-400 font-bold">
                      <div className="flex gap-2">
                        <span>Atasan: <span className="text-green-600">Disetujui</span></span>
                        <span>Pejabat: <span className="text-orange-500">Menunggu</span></span>
                      </div>
                      <span>66%</span>
                    </div>
                  </div>
                </div>

                {/* Item 2: Approved request (Compact inline) */}
                <div className="border border-slate-100 rounded-xl p-2.5 bg-white flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0" />
                    <span className="font-bold text-slate-800 text-[9.5px]">Sakit</span>
                    <span className="text-slate-455 text-[7.5px] font-medium">10 Jun - 12 Jun (3 hari)</span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded-full bg-green-50 text-green-600 font-bold text-[6.5px] border border-green-100 uppercase tracking-wider scale-95">
                    disetujui
                  </span>
                </div>

                {/* Item 3: Approved request (Compact inline) */}
                <div className="border border-slate-100 rounded-xl p-2.5 bg-white flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0" />
                    <span className="font-bold text-slate-800 text-[9.5px]">Tahunan</span>
                    <span className="text-slate-455 text-[7.5px] font-medium">02 Feb - 10 Feb (7 hari)</span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded-full bg-green-50 text-green-600 font-bold text-[6.5px] border border-green-100 uppercase tracking-wider scale-95">
                    disetujui
                  </span>
                </div>

              </div>
            </div>

            {/* Bottom link */}
            <div className="border-t border-slate-50 pt-2 flex items-center justify-between text-[7px] text-muted-foreground mt-2">
              <span>* Pantau status persetujuan dari atasan.</span>
              <span className="text-primary font-bold hover:underline cursor-pointer">Lihat Semua Riwayat &rarr;</span>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
