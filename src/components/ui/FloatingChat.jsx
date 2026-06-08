'use client'

import { useState } from 'react'
import { X, Sparkles } from 'lucide-react'

export function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [showModal, setShowModal] = useState(false)

  const handleGoToRagmy = () => {
    window.open("https://ragmyai.com/", "_blank", "noopener,noreferrer")
    setShowModal(false)
  }

  return (
    <>
      {/* Chat Window Panel */}
      <div
        className={`fixed bottom-[88px] sm:bottom-24 right-4 sm:right-6 w-[calc(100vw-2rem)] sm:w-[380px] bg-[#0c0d14] border border-slate-800 rounded-3xl shadow-2xl flex flex-col z-50 overflow-hidden transition-all duration-300 origin-bottom-right ${isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4 pointer-events-none'
          }`}
        style={{ height: 'min(520px, 80dvh)', maxHeight: '80dvh' }}
      >
        {/* Header */}
        <div className="bg-slate-950 px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
              <Sparkles className="w-4.5 h-4.5 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-[13px] text-slate-100 leading-tight">Asisten AI SiCerdas</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
                <span className="text-[10px] text-emerald-400 font-medium tracking-wide">Online</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Iframe & Overlay Wrapper */}
        <div className="relative flex-1 w-full bg-[#0c0d14]">
          <iframe
            src="https://chat.ragmyai.com/SiCerdas"
            className="w-full h-full border-0"
            title="SiCerdas AI Chatbot"
            frameBorder="0"
          />

          {/* Custom Overlay to block the RagmyAI Free Plan Watermark */}
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="absolute bottom-[54px] left-0 right-0 h-[68px] bg-[#141726] flex items-center justify-center gap-2 text-[11px] text-slate-100 font-bold tracking-widest uppercase cursor-pointer select-none z-10 w-[98%] mx-auto rounded-[4px]"
          >
            <img src="/ragmyai-icon.png" alt="RagmyAI" className="w-5 h-5 rounded object-contain" />
            AI by ragmyai.com
          </button>

          {/* Integrated Modal Overlay */}
          {showModal && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs z-20 flex items-center justify-center p-6 animate-in fade-in duration-200">
              <div className="bg-[#121424] border border-slate-800 rounded-2xl p-5 w-full max-w-[290px] text-center space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
                <img
                  src="/ragmyai-icon.png"
                  alt="RagmyAI"
                  className="w-16 h-16 rounded-2xl mx-auto object-contain"
                />

                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-slate-100 font-sans">Kunjungi RagmyAI.com?</h4>
                  <p className="text-xs text-slate-400 leading-relaxed font-sans">
                    SiCerdas menggunakan ragmyai.com untuk menjawab pertanyaan Anda. Mohon dukung juga ragmyai.com agar terus berkembang ❤️❤️❤️
                  </p>
                </div>

                <div className="space-y-2 pt-1">
                  <button
                    type="button"
                    onClick={handleGoToRagmy}
                    className="w-full bg-primary hover:bg-primary/95 text-white text-xs font-bold py-2.5 px-4 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <img src="/ragmyai-icon.png" alt="RagmyAI" className="w-4 h-4 rounded object-contain" />
                    Kunjungi RagmyAI.com
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="w-full bg-slate-800/60 hover:bg-slate-850 text-slate-300 text-xs font-semibold py-2.5 px-4 rounded-xl border border-slate-700/60 transition-all cursor-pointer"
                  >
                    Tetap di SiCerdas
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-primary hover:bg-primary/95 text-white flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all z-50 cursor-pointer overflow-hidden"
        title="Tanya Asisten AI"
      >
        {isOpen ? (
          <X className="w-6 h-6 animate-in spin-in-90 duration-200" />
        ) : (
          <img src="/ragmyai-icon.png" alt="RagmyAI" className="w-9 h-9 object-contain animate-in zoom-in-50 duration-200" />
        )}
      </button>
    </>
  )
}
