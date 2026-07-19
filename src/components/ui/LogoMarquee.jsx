"use client";

import React from "react";
import { 
  Building2, 
  Briefcase, 
  Award, 
  Hexagon, 
  Component,
  Database,
  Target,
  Cpu,
  Sparkles,
  ArrowUpRight
} from "lucide-react";

const items = [
  { type: "div", icon: Building2, text: "KEC. MAGELANG UTARA" },
  { type: "div", icon: Briefcase, text: "BKPPD MAGELANG" },
  { type: "a", icon: Sparkles, text: "HALOHUDDIN", href: "https://www.google.com/search?q=%22HaloHuddin%22" },
  { type: "div", icon: Hexagon, text: "KEL. KEDUNGSARI" },
  { type: "div", icon: Component, text: "KEL. KRAMAT SELATAN" },
  { type: "div", icon: Database, text: "KEL. KRAMAT UTARA" },
  { type: "div", icon: Target, text: "KEL. POTROBANGSAN" },
  { type: "div", icon: Cpu, text: "KEL. WATES" },
];

function MarqueeItem({ item }) {
  const Icon = item.icon;
  const isLink = item.type === "a";
  
  const content = (
    <>
      <Icon className="w-5 h-5 shrink-0" />
      <span className="font-bold text-[11px] tracking-wider flex items-center gap-1.5">
        {item.text}
        {isLink && (
          <ArrowUpRight className="w-3.5 h-3.5 opacity-60 group-hover/item:translate-x-0.5 group-hover/item:-translate-y-0.5 transition-transform duration-200" />
        )}
      </span>
    </>
  );

  const baseClass = "flex items-center gap-2 hover:grayscale-0 text-muted-foreground hover:text-primary opacity-85 hover:opacity-100 transition-all duration-300 shrink-0 group/item select-none cursor-pointer";

  if (isLink) {
    return (
      <a
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        className={baseClass}
      >
        {content}
      </a>
    );
  }

  return (
    <div className={baseClass}>
      {content}
    </div>
  );
}

export function LogoMarquee() {
  return (
    <div className="relative w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,white_15%,white_85%,transparent)] py-2">
      <div className="group flex w-max gap-0">
        {/* Track 1 */}
        <div className="flex gap-16 pr-16 shrink-0 animate-marquee group-hover:[animation-play-state:paused] [animation-duration:60s]">
          {items.map((item, index) => (
            <MarqueeItem key={`track1-${index}`} item={item} />
          ))}
        </div>
        
        {/* Track 2 */}
        <div className="flex gap-16 pr-16 shrink-0 animate-marquee group-hover:[animation-play-state:paused] [animation-duration:60s]">
          {items.map((item, index) => (
            <MarqueeItem key={`track2-${index}`} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
}
