import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { DashboardMiniature } from "@/components/ui/DashboardMiniature";
import { LogoMarquee } from "@/components/ui/LogoMarquee";
import {
  CalendarCheck2,
  ShieldCheck,
  Zap,
  FileText,
  ArrowRight,
  Clock,
  LayoutDashboard,
  Users,
  CheckCircle2,
  Download,
  ToggleLeft,
  Globe,
  MapPin,
  Phone
} from "lucide-react";

export const metadata = {
  title: "Sicerdas - Manajemen Cuti Organisasi Cerdas & Otomatis",
  description: "Sistem manajemen cuti modern dan otomatis untuk instansi Anda. Ajukan cuti secara praktis, pantau persetujuan real-time, dan optimalkan administrasi kepegawaian.",
  keywords: ["manajemen cuti", "pengajuan cuti online", "cuti pegawai", "aplikasi cuti", "sicerdas", "kepegawaian"],
  openGraph: {
    title: "Sicerdas - Manajemen Cuti Organisasi Cerdas & Otomatis",
    description: "Sistem manajemen cuti modern dan otomatis untuk instansi Anda. Ajukan cuti secara praktis, pantau persetujuan real-time, dan optimalkan administrasi kepegawaian.",
    type: "website",
    locale: "id_ID",
  },
};

export default function Home() {
  return (
    <>
      <Navbar />
      <div className="flex flex-col min-h-screen scroll-smooth bg-background text-foreground">
        {/* Hero Section */}
        <section className="relative pt-36 pb-20 px-4 md:pt-40 md:pb-28 overflow-hidden">
          {/* Glowing Purple Background Blurs */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] -z-10 pointer-events-none" />
          <div className="absolute top-1/3 right-10 w-[300px] h-[300px] bg-purple-500/5 rounded-full blur-[90px] -z-10 pointer-events-none" />

          <div className="container mx-auto max-w-5xl">
            <div className="flex flex-col items-center text-center space-y-7">
              {/* Flat Tagline Badge */}
              <div className="inline-flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
                <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-800">
                  SISTEM CUTI NO. 1 DI MAGELANG
                </span>
              </div>

              {/* Headings */}
              <div className="space-y-4 max-w-3xl">
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-normal tracking-tight leading-[1.1] text-slate-900 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
                  Kelola Cuti Praktis, <br className="hidden sm:inline" />
                  <span className="text-primary bg-clip-text">Kerja Lebih Mudah.</span>
                </h1>
                <p className="text-sm md:text-base text-slate-500 max-w-xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-12 duration-700 delay-200 font-normal">
                  Generasi terbaru manajemen cuti instansi. Pengajuan tanpa ribet, pemantauan kuota real-time, dan analitik otomatis dalam satu dasbor.
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex justify-center items-center w-full animate-in fade-in slide-in-from-bottom-16 duration-700 delay-300">
                <Button size="lg" className="rounded-full px-8 h-12 text-base font-semibold group transition-all hover:scale-[1.02] shadow-lg shadow-primary/25 w-full sm:w-auto" asChild>
                  <Link href="/form">
                    Ajukan Sekarang
                    <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              </div>

              {/* Centered Social Proof Text */}
              <p className="text-xs text-muted-foreground animate-in fade-in duration-1000 delay-500 flex items-center justify-center gap-1.5">
                <Zap className="w-3 h-3 text-amber-500 shrink-0" />
                <span>
                  Lebih dari <span className="font-bold text-primary">10,000+ pengajuan cuti</span> telah sukses diproses
                </span>
              </p>

              {/* Dashboard Miniature Centered Below */}
              <div className="w-full max-w-4xl mx-auto flex justify-center pt-8 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300">
                <DashboardMiniature />
              </div>
            </div>
          </div>
        </section>

        {/* Client Logos / "Who Uses This App" Section with Infinite Marquee */}
        <section className="hidden md:block py-10 border-y border-border/80 bg-muted/10 overflow-hidden">
          <div className="container mx-auto max-w-5xl px-4">
            <p className="text-center text-xs font-bold uppercase tracking-widest text-muted-foreground mb-8">
              Telah Digunakan & Dipercayai Oleh
            </p>

            {/* Infinite Interactive Drag Marquee */}
            <LogoMarquee />
          </div>
        </section>

        {/* Bento Features Grid */}
        <section className="py-24 bg-muted/20">
          <div className="container mx-auto max-w-6xl px-4">
            <div className="text-center mb-16 space-y-3">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
                Lebih Cerdik, Lebih Efisien
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto text-base">
                Dibangun khusus untuk mempercepat birokrasi internal tanpa melanggar regulasi kepegawaian resmi.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[minmax(250px,auto)]">
              {/* Box 1 - Col Span 2 (Primary Feature) */}
              <BentoCard
                className="md:col-span-2 bg-primary text-primary-foreground relative overflow-hidden group"
                icon={<FileText className="w-6 h-6" />}
                title="Pusat Cetak PDF Otomatis"
                description="Sistem memetakan seluruh data Anda ke dalam template PDF formulir cuti resmi secara otomatis untuk diunduh secara instan."
                isWide={true}
                visual={
                  <div className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 text-white/90 text-xs shadow-inner transition-all duration-300 group-hover:bg-white/15">
                    <div className="flex justify-between items-center border-b border-white/10 pb-3 mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                        <span className="font-bold tracking-wide text-white">FORM_CUTI_TAHUNAN.pdf</span>
                      </div>
                      <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded text-white font-mono">132 KB</span>
                    </div>
                    <div className="space-y-2 font-mono text-[10px] opacity-80 text-white/90">
                      <p>KATEGORI: Cuti Tahunan</p>
                      <p>DURASI: 3 Hari Kerja</p>
                      <p>TANGGAL: 20 - 22 Jul 2026</p>
                      <p>ALASAN: Cuti Tahunan Wilayah Magelang</p>
                    </div>
                    <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center text-[9px] font-bold text-white">Ttd</div>
                        <span className="text-[9px] italic text-white/60">Digital Signature OK</span>
                      </div>
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-primary rounded-lg font-bold text-[10px] shadow-xs">
                        <Download className="w-3.5 h-3.5" /> Unduh PDF
                      </div>
                    </div>
                  </div>
                }
              />

              {/* Box 2 - Tall Row Span 2 */}
              <BentoCard
                className="md:row-span-2 bg-card border-border/80 relative overflow-hidden group"
                icon={<CalendarCheck2 className="w-6 h-6" />}
                title="Manajemen Kuota Cerdas"
                description="Perhitungan kuota cuti tahunan bertingkat (N, N-1, N-2) dengan prioritas penggunaan otomatis agar saldo cuti Anda tidak hangus."
                visual={
                  <div className="bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-border/60 p-4 space-y-4 transition-all duration-300 group-hover:border-primary/20">
                    {/* Multi-segment Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        <span>Ikhtisar Kuota (18 Hari)</span>
                        <span className="text-primary font-extrabold">Sisa 12 Hari</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-200/60 dark:bg-slate-800 rounded-full flex overflow-hidden">
                        <div className="bg-primary h-full" style={{ width: "50%" }} title="Tersedia (9 hari)" />
                        <div className="bg-amber-500 h-full animate-pulse" style={{ width: "16.7%" }} title="Ditinjau (3 hari)" />
                        <div className="bg-slate-350 dark:bg-slate-700 h-full" style={{ width: "33.3%" }} title="Digunakan (6 hari)" />
                      </div>
                      <div className="flex justify-between text-[9px] text-muted-foreground/80 font-medium">
                        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-primary block" /> 9 Tersedia</span>
                        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-500 block" /> 3 Ditinjau</span>
                        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-slate-350 dark:bg-slate-700 block" /> 6 Digunakan</span>
                      </div>
                    </div>

                    {/* Year Buckets */}
                    <div className="space-y-2 border-t border-border/60 pt-3">
                      <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span className="font-semibold text-slate-750 dark:text-slate-300">Tahun 2026</span>
                          <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">Tahun Ini</span>
                        </div>
                        <span className="font-bold text-slate-850 dark:text-slate-150">12 Hari</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                          <span className="font-semibold text-slate-750 dark:text-slate-300">Tahun 2025</span>
                          <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded font-medium">Tahun Lalu</span>
                        </div>
                        <span className="font-bold text-slate-850 dark:text-slate-150">6 Hari <span className="text-[9px] text-primary">(Prioritas)</span></span>
                      </div>
                      
                      {/* Extra Category info */}
                      <div className="flex justify-between items-center text-xs border-t border-border/60 pt-3">
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                          <span className="font-semibold text-slate-750 dark:text-slate-300">Cuti Sakit</span>
                        </div>
                        <span className="font-bold text-slate-850 dark:text-slate-150">14 Hari Tersedia</span>
                      </div>
                    </div>
                  </div>
                }
              />

              {/* Box 3 - Small */}
              <BentoCard
                className="bg-card border-border/80 relative overflow-hidden group"
                icon={<LayoutDashboard className="w-6 h-6" />}
                title="Dashboard Intuitif"
                description="Pantau saldo cuti tahunan, lacak persetujuan atasan, dan lihat histori pengajuan secara real-time."
                visual={
                  <div className="bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-border/60 p-4 space-y-3 transition-all duration-300 group-hover:border-primary/20">
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Permohonan Cuti Terbaru</div>
                    
                    <div className="flex items-center justify-between p-2 bg-background rounded-xl border border-border/50 text-xs hover:border-primary/20 transition-all duration-200">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px]">Cuti Tahunan</span>
                        <span className="text-[9px] text-muted-foreground">20-22 Jul 2026 (3 hari)</span>
                      </div>
                      <span className="px-1.5 py-0.5 rounded bg-green-500/10 text-[9px] font-bold text-green-600 border border-green-500/25">
                        Disetujui
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2 bg-background rounded-xl border border-border/50 text-xs hover:border-primary/20 transition-all duration-200">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px]">Cuti Tahunan</span>
                        <span className="text-[9px] text-muted-foreground">5-6 Agt 2026 (2 hari)</span>
                      </div>
                      <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-[9px] font-bold text-amber-600 border border-amber-500/25 animate-pulse">
                        Menunggu
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2 bg-background rounded-xl border border-border/50 text-xs hover:border-primary/20 transition-all duration-200">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px]">Cuti Sakit</span>
                        <span className="text-[9px] text-muted-foreground">12 Jun 2026 (1 hari)</span>
                      </div>
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[9px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                        Selesai
                      </span>
                    </div>
                  </div>
                }
              />

              {/* Box 4 - Small */}
              <BentoCard
                className="bg-card border-border/80 relative overflow-hidden group"
                icon={<Users className="w-6 h-6" />}
                title="Kontrol Terpadu Admin"
                description="Sinkronisasi instan data kepegawaian, penyesuaian saldo cuti, dan kelola wewenang persetujuan pejabat."
                visual={
                  <div className="bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-border/60 p-4 space-y-3 transition-all duration-300 group-hover:border-primary/20">
                    <div className="flex items-center justify-between pb-2 border-b border-border/60">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Akses Administratif</span>
                      <span className="flex items-center gap-1.5 text-[9px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/25">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
                        Sistem Normal
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div className="p-2 bg-background rounded-xl border border-border/50 flex flex-col justify-center">
                        <span className="text-[9px] text-muted-foreground font-medium">Permintaan</span>
                        <span className="text-xs font-black text-slate-800 dark:text-slate-200">3 Menunggu</span>
                      </div>
                      <div className="p-2 bg-background rounded-xl border border-border/50 flex flex-col justify-center">
                        <span className="text-[9px] text-muted-foreground font-medium">Pegawai</span>
                        <span className="text-xs font-black text-slate-800 dark:text-slate-200">42 Aktif</span>
                      </div>
                    </div>

                    <div className="mt-3 space-y-2 border-t border-border/60 pt-3">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-muted-foreground font-medium">Metode Approval</span>
                        <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold">Bertingkat</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-muted-foreground font-medium">Notifikasi WhatsApp</span>
                        <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold">Aktif</span>
                      </div>
                    </div>
                  </div>
                }
              />
            </div>
          </div>
        </section>

        {/* Founder Section */}
        <section className="py-24 bg-background border-t border-border relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-primary/5 rounded-full blur-[100px] -z-10 pointer-events-none" />

          <div className="container mx-auto max-w-4xl px-4 text-center">
            <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
              <p className="text-xs font-bold uppercase tracking-widest text-primary">
                PENGGAGAS APLIKASI
              </p>
              <h3 className="text-xl md:text-2xl lg:text-3xl font-medium text-foreground leading-relaxed italic">
                "Birokrasi yang cerdas berawal dari sistem yang memberikan kemudahan. Sicerdas dirancang untuk memotong kerumitan administratif tanpa mengorbankan prosedur resmi instansi."
              </h3>
              <div className="pt-4">
                <div className="w-12 h-1 bg-primary/30 mx-auto rounded-full mb-6"></div>
                <h4 className="text-lg font-bold text-foreground">Utari, S.Sos.</h4>
                <p className="text-xs font-medium text-muted-foreground mt-1 uppercase tracking-wider">
                  Pemimpin Proyek & Inisiator Sicerdas
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Unified Bottom CTA & Footer Section */}
        <section className="py-20 border-t border-border bg-accent/30 text-muted-foreground relative overflow-hidden backdrop-blur-xs">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent -z-10" />
          <div className="container mx-auto max-w-5xl px-6">
            
            {/* Grid Content */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              
              {/* Column 1: CTA Message */}
              <div className="space-y-4 pr-4">
                <h3 className="text-xl md:text-2xl font-bold tracking-tight text-foreground leading-snug">
                  Siap mempermudah manajemen cuti instansi Anda?
                </h3>
                <p className="text-muted-foreground text-xs md:text-sm leading-relaxed">
                  Hubungi tim dukungan kami untuk pertanyaan kebijakan cuti, bantuan integrasi teknis, atau pengajuan demo sistem secara langsung.
                </p>
              </div>

              {/* Column 2: Support Contacts */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Hubungi Kami</h4>
                <ul className="space-y-3.5 text-sm">
                  <li>
                    <a 
                      href="https://wa.me/6281234567890" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="group flex items-start gap-3 text-foreground hover:text-primary transition-colors"
                    >
                      <div className="p-1.5 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                        <Phone className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-xs">Utari, S.Sos</span>
                        <span className="text-xs text-muted-foreground">Manager • +62 812-3456-7890</span>
                      </div>
                    </a>
                  </li>
                  <li>
                    <a 
                      href="https://wa.me/6287745457767" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="group flex items-start gap-3 text-foreground hover:text-primary transition-colors"
                    >
                      <div className="p-1.5 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                        <Phone className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-xs">Halo Huddin</span>
                        <span className="text-xs text-muted-foreground">Developer • +62 877-4545-7767</span>
                      </div>
                    </a>
                  </li>
                  <li className="pt-2">
                    <Link href="/help" className="text-xs text-primary hover:underline font-semibold inline-flex items-center gap-1">
                      Cari Bantuan & FAQ <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Column 3: Locations & Maps */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Lokasi Kantor & Studio</h4>
                <ul className="space-y-3.5 text-sm">
                  <li>
                    <a 
                      href="https://share.google/Kmir4nBfxlk1V3zCg" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="group flex items-start gap-3 text-foreground hover:text-primary transition-colors"
                    >
                      <div className="p-1.5 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-xs flex items-center gap-1">
                          Kantor Kelurahan Kramat Selatan
                          <span className="text-[10px] text-muted-foreground font-normal">(Utari)</span>
                        </span>
                        <span className="text-[10px] text-muted-foreground leading-relaxed mt-0.5">
                          Kec. Magelang Utara, Kota Magelang, Jawa Tengah 56115
                        </span>
                      </div>
                    </a>
                  </li>
                  <li>
                    <a 
                      href="https://share.google/CSGnr6dslbtDunnSp" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="group flex items-start gap-3 text-foreground hover:text-primary transition-colors"
                    >
                      <div className="p-1.5 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-xs flex items-center gap-1">
                          Home Studio
                          <span className="text-[10px] text-muted-foreground font-normal">(HaloHuddin)</span>
                        </span>
                        <span className="text-[10px] text-muted-foreground leading-relaxed mt-0.5">
                          Jl. Telaga Warna, Rejowinangun Utara, Kec. Magelang Tengah, Kota Magelang, Jawa Tengah
                        </span>
                      </div>
                    </a>
                  </li>
                </ul>
              </div>

            </div>

            {/* Bottom Links */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 border-t border-border pt-8 text-xs text-muted-foreground/80 mt-12">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-center sm:text-left">
                <span className="font-bold text-sm text-foreground tracking-tight">Sicerdas</span>
                <span>© 2026. Hak cipta dilindungi.</span>
              </div>
              <div className="flex gap-8 font-medium">
                <Link href="#" className="hover:text-primary transition-colors">Privasi</Link>
                <Link href="#" className="hover:text-primary transition-colors">Syarat</Link>
                <Link href="#" className="hover:text-primary transition-colors">Keamanan</Link>
              </div>
            </div>

          </div>
        </section>
      </div>
    </>
  );
}

function BentoCard({ icon, title, description, className = "", visual, isWide = false }) {
  const isDark = className.includes('bg-primary');

  return (
    <div className={`p-8 rounded-3xl border shadow-sm transition-all duration-300 hover:shadow-md hover:border-primary/20 flex flex-col justify-between ${isDark ? 'border-transparent text-primary-foreground' : 'bg-card border-border'} ${className}`}>
      <div className={isWide ? "grid grid-cols-1 lg:grid-cols-2 gap-8 items-center h-full w-full" : "flex flex-col justify-between h-full w-full"}>
        <div className="flex flex-col justify-center h-full">
          <div className={`mb-6 p-3 w-fit rounded-2xl ${isDark ? 'bg-white/15' : 'bg-primary/10 text-primary'}`}>
            {icon}
          </div>
          <h3 className={`text-xl font-bold mb-3 ${isDark ? 'text-primary-foreground' : 'text-foreground'}`}>
            {title}
          </h3>
          <p className={`text-sm leading-relaxed ${isDark ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
            {description}
          </p>
        </div>
        {visual && (
          <div className={isWide ? "w-full" : "mt-6 w-full"}>
            {visual}
          </div>
        )}
      </div>
    </div>
  );
}

