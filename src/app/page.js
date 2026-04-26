import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import {
  CalendarCheck2,
  ShieldCheck,
  Zap,
  FileText,
  ArrowRight,
  Clock,
  LayoutDashboard,
  Users
} from "lucide-react";

export default function Home() {
  return (
    <>
      <Navbar />
      <div className="flex flex-col min-h-[calc(100vh-64px)] scroll-smooth">
        {/* Hero Section */}
        <section className="relative py-20 px-4 md:py-32 overflow-hidden">
          {/* Abstract background elements */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full -z-10 pointer-events-none">
            <div className="absolute top-[10%] right-[10%] w-[300px] h-[300px] bg-primary/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-[20%] left-[5%] w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px]" />
          </div>

          <div className="container mx-auto max-w-5xl text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-8 border border-primary/20 animate-in fade-in slide-in-from-bottom-4 duration-1000">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Semua yang Anda butuhkan untuk Manajemen Cuti
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/70 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
              Kelola Cuti Tanpa Ribet, <br className="hidden md:block" />
              <span className="text-primary">Tingkatkan Kinerja Pegawai.</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-12 duration-700 delay-200">
              Generasi terbaru manajemen cuti. Pengajuan tanpa ribet, pemantauan real-time, dan analitik mendalam untuk instansi modern bersama Sicerdas.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-in fade-in slide-in-from-bottom-16 duration-700 delay-300">
              <Button size="lg" className="rounded-full px-8 h-12 text-base font-semibold group transition-all hover:pr-6" asChild>
                <Link href="/login">
                  Mulai Sekarang
                  <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="rounded-full px-8 h-12 text-base font-semibold transition-all hover:bg-muted" asChild>
                <Link href="/dashboard">
                  Lihat Dashboard
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Bento Features Grid */}
        <section className="py-24 bg-muted/30 border-y border-border">
          <div className="container mx-auto max-w-6xl px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">Lebih Cerdas, Lebih Efisien</h2>
              <p className="text-muted-foreground max-w-xl mx-auto text-lg">
                Dibangun khusus untuk merampingkan alur birokrasi tanpa melanggar prosedur administrasi resmi.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[minmax(220px,auto)]">
              {/* Box 1 - Col Span 2 (Primary Feature) */}
              <BentoCard
                className="md:col-span-2 bg-primary text-primary-foreground"
                icon={<FileText className="w-8 h-8 text-primary-foreground" />}
                title="Pusat Cetak PDF Otomatis"
                description="Lupakan pengisian formulir manual yang memakan waktu. Sicerdas memetakan seluruh data Anda ke dalam template cuti resmi secara otomatis. Cukup unduh, cetak, dan ajukan langsung ke atasan Anda."
              />
              
              {/* Box 2 - Tall Row Span 2 */}
              <BentoCard
                className="md:row-span-2 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20"
                icon={<CalendarCheck2 className="w-8 h-8 text-primary" />}
                title="Manajemen Kuota Cerdas"
                description="Sistem mutakhir yang mendukung perhitungan kuota berjalan bertingkat. Kuota dari tahun terlama akan otomatis diprioritaskan saat pengajuan, memastikan hak cuti pegawai terkelola dengan presisi tinggi dan tidak ada yang hangus sia-sia."
              />

              {/* Box 3 - Small */}
              <BentoCard
                icon={<LayoutDashboard className="w-8 h-8 text-primary" />}
                title="Dashboard Intuitif"
                description="Pantau sisa cuti Anda secara real-time, pantau status pengajuan, dan lihat riwayat dokumen cuti Anda dalam satu layar yang sangat nyaman."
              />

              {/* Box 4 - Small */}
              <BentoCard
                icon={<Users className="w-8 h-8 text-primary" />}
                title="Kontrol Terpadu Admin"
                description="Sinkronisasi akun instan, kelola data pegawai, penyesuaian tanggal masuk, dan atur wewenang dengan kendali penuh."
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
              <p className="text-sm font-bold uppercase tracking-widest text-primary">
                PENGGAGAS APLIKASI
              </p>
              <h3 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-slate-800 leading-snug italic">
                "Birokrasi yang cerdas berawal dari sistem yang memberikan kemudahan. Sicerdas dirancang untuk memotong kerumitan administratif tanpa mengorbankan prosedur resmi instansi."
              </h3>
              <div className="pt-8">
                <div className="w-16 h-1 bg-primary/20 mx-auto rounded-full mb-6"></div>
                <h4 className="text-xl font-bold text-slate-900">Utari, S.Sos.</h4>
                <p className="text-sm font-medium text-muted-foreground mt-1 uppercase tracking-wider">
                  Pemimpin Proyek & Inisiator Sicerdas
                </p>
              </div>
            </div>
          </div>
        </section>

        <footer className="mt-auto py-12 px-4 border-t border-border bg-background">
          <div className="container mx-auto max-w-5xl flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex flex-col items-center md:items-start gap-2">
              <span className="font-bold text-xl tracking-tight text-primary">Sicerdas</span>
              <p className="text-sm text-muted-foreground">© 2026 Sicerdas. Hak cipta dilindungi.</p>
            </div>
            <div className="flex gap-8 text-sm text-muted-foreground font-medium">
              <Link href="#" className="hover:text-primary transition-colors">Privasi</Link>
              <Link href="#" className="hover:text-primary transition-colors">Syarat</Link>
              <Link href="#" className="hover:text-primary transition-colors">Keamanan</Link>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

function BentoCard({ icon, title, description, className = "" }) {
  const isDark = className.includes('bg-slate-900') || className.includes('bg-primary');
  
  return (
    <div className={`p-8 rounded-3xl border shadow-sm transition-all duration-300 hover:shadow-md flex flex-col justify-start ${isDark ? 'border-transparent' : 'bg-background border-border'} ${className}`}>
      <div className={`mb-6 p-4 w-fit rounded-2xl ${isDark ? 'bg-white/10' : 'bg-primary/5'}`}>
        {icon}
      </div>
      <h3 className={`text-xl md:text-2xl font-bold mb-3 ${isDark ? 'text-primary-foreground' : 'text-slate-900'}`}>
        {title}
      </h3>
      <p className={`leading-relaxed ${isDark ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
        {description}
      </p>
    </div>
  );
}
