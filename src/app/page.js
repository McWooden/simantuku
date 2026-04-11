import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { 
  CalendarCheck2, 
  ShieldCheck, 
  Zap, 
  BarChart3, 
  ArrowRight,
  Clock,
  LayoutDashboard
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
            Everything you need for Leave Management
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/70 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
            Simplifying Leave, <br className="hidden md:block" /> 
            <span className="text-primary">Empowering Your Team.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-12 duration-700 delay-200">
            The next generation of leave management. Effortless requests, real-time tracking, and powerful insights for modern organizations with Simantuku.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-in fade-in slide-in-from-bottom-16 duration-700 delay-300">
            <Button size="lg" className="rounded-full px-8 h-12 text-base font-semibold group transition-all hover:pr-6" asChild>
              <Link href="/login">
                Get Started for Free
                <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="rounded-full px-8 h-12 text-base font-semibold transition-all hover:bg-muted" asChild>
              <Link href="/dashboard">
                View Dashboard
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-muted/30 border-y border-border">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Why choose Simantuku?</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Our platform offers comprehensive tools to help you manage employee attendance and leave efficiently.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Zap className="w-8 h-8 text-primary" />}
              title="Instant Approval"
              description="Get leave requests approved in seconds with our automated notification system."
            />
            <FeatureCard 
              icon={<CalendarCheck2 className="w-8 h-8 text-primary" />}
              title="Real-time Tracking"
              description="Monitor team availability with our interactive team calendar and reporting tools."
            />
            <FeatureCard 
              icon={<ShieldCheck className="w-8 h-8 text-primary" />}
              title="Compliance Built-in"
              description="Automatically calculation of balances based on your company's specific policies."
            />
            <FeatureCard 
              icon={<BarChart3 className="w-8 h-8 text-primary" />}
              title="Advanced Analytics"
              description="Identify trends and manage workforce planning with detailed leave reports."
            />
            <FeatureCard 
              icon={<Clock className="w-8 h-8 text-primary" />}
              title="History & Audit"
              description="Keep a complete record of all leave transactions for compliance and transparency."
            />
            <FeatureCard 
              icon={<LayoutDashboard className="w-8 h-8 text-primary" />}
              title="Admin Controls"
              description="Powerful administrative tools to manage users, roles, and leave types easily."
            />
          </div>
        </div>
      </section>

      {/* Social Proof/Trust Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto max-w-5xl px-4 text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground mb-8">
            Trusted by modern companies worldwide
          </p>
          <div className="flex flex-wrap justify-center gap-12 md:gap-20 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
            {/* Placeholder icons representing company logos */}
            <div className="text-2xl font-black italic tracking-tighter">TECHLEAP</div>
            <div className="text-2xl font-black tracking-widest">NEXUS</div>
            <div className="text-2xl font-bold">LUMINA</div>
            <div className="text-2xl font-extrabold italic">FLOW.</div>
          </div>
        </div>
      </section>

      <footer className="mt-auto py-12 px-4 border-t border-border bg-background">
        <div className="container mx-auto max-w-5xl flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col items-center md:items-start gap-2">
            <span className="font-bold text-xl tracking-tight text-primary">Simantuku</span>
            <p className="text-sm text-muted-foreground">© 2026 Simantuku. All rights reserved.</p>
          </div>
          <div className="flex gap-8 text-sm text-muted-foreground font-medium">
            <Link href="#" className="hover:text-primary transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-primary transition-colors">Terms</Link>
            <Link href="#" className="hover:text-primary transition-colors">Security</Link>
          </div>
        </div>
      </footer>
    </div>
    </>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="p-8 rounded-2xl bg-background border border-border shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300">
      <div className="mb-6 p-3 w-fit rounded-xl bg-primary/5">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">
        {description}
      </p>
    </div>
  );
}
