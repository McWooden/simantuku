'use client'

import { useState } from 'react'
import { MessageSquare, Phone, ShieldAlert, ChevronDown, HelpCircle, Eye, EyeOff } from 'lucide-react'

export default function HelpPage() {
  const supportContacts = [
    {
      name: "Utari, S.Sos",
      role: "Manager",
      phone: "6281234567890",
      whatsappUrl: "https://wa.me/6281234567890"
    },
    {
      name: "Halo Huddin",
      role: "Developer",
      phone: "6287745457767",
      whatsappUrl: "https://wa.me/6287745457767"
    }
  ]

  const faqs = [
    {
      q: "Bagaimana cara mengajukan permohonan cuti?",
      a: "Anda dapat mengajukan permohonan cuti melalui halaman 'Ajukan Cuti' di sidebar. Isi form dengan benar, pilih Atasan Langsung dan Pejabat Berwenang, masukkan alamat serta nomor kontak selama cuti, lalu unggah berkas pendukung jika kategori cuti tersebut membutuhkannya."
    },
    {
      q: "Kategori cuti apa saja yang memerlukan berkas/lampiran?",
      a: "Kategori cuti Sakit, Melahirkan, Penting, Besar, dan Luar Tanggungan memerlukan lampiran berkas pendukung (misal: surat keterangan dokter, surat undangan, dll.). Kategori Cuti Tahunan tidak memerlukan lampiran berkas pendukung."
    },
    {
      q: "Bagaimana sistem perhitungan saldo cuti tahunan?",
      a: "Saldo cuti tahunan menggunakan sistem carryover hingga 3 tahun (tahun berjalan N, tahun lalu N-1, dan dua tahun lalu N-2). Perhitungan sisa hari dilakukan secara otomatis berdasarkan histori permohonan yang disetujui."
    },
    {
      q: "Bagaimana alur persetujuan permohonan cuti?",
      a: "Setiap permohonan cuti harus disetujui oleh Atasan Langsung dan Pejabat Berwenang yang ditunjuk. Status berubah menjadi 'DISETUJUI' (acc) setelah keduanya membubuhkan tanda tangan. Khusus Manager dapat langsung menyetujui permohonan secara instan."
    },
    {
      q: "Apakah saya bisa membatalkan cuti yang sudah disetujui?",
      a: "Permohonan berstatus pending dapat dibatalkan atau dihapus secara mandiri. Apabila permohonan sudah disetujui dan ingin dibatalkan, Anda perlu berkoordinasi dengan Administrator atau Manager untuk melakukan penyesuaian data."
    },
    {
      q: "Apakah cuti sakit mengurangi saldo cuti tahunan saya?",
      a: "Tidak. Cuti sakit adalah kategori cuti terpisah dan tidak memotong saldo cuti tahunan (N, N-1, atau N-2) Anda, selama Anda melampirkan bukti surat keterangan medis/dokter yang sah."
    },
    {
      q: "Bagaimana jika pengajuan cuti saya ditolak?",
      a: "Jika permohonan ditolak oleh atasan atau pejabat, Anda akan melihat status 'DITOLAK' di dashboard beserta catatan penolakan. Anda dapat membuat pengajuan baru dengan melakukan revisi tanggal atau ketentuan sesuai arahan."
    },
    {
      q: "Apakah hari libur akhir pekan (Sabtu/Minggu) memotong jatah cuti?",
      a: "Tidak. Pengajuan cuti di Sicerdas secara otomatis mendeteksi hari kerja efektif saja (Senin-Jumat). Hari Sabtu, Minggu, dan Hari Libur Nasional tidak akan dihitung memotong kuota saldo cuti tahunan Anda."
    },
    {
      q: "Bagaimana cara mengoreksi data profil atau alamat email saya?",
      a: "Data kepegawaian sinkron langsung dengan data administrasi utama. Jika terdapat ketidaksesuaian penulisan nama, NIP, jabatan, atau email, silakan hubungi Administrator sistem melalui kontak bantuan di sebelah kiri."
    },
    {
      q: "Berapa hari batas maksimal pengajuan sebelum tanggal pelaksanaan cuti?",
      a: "Untuk pengajuan cuti tahunan reguler, disarankan untuk mengajukan paling lambat 3 hari kerja sebelum cuti dimulai guna memberikan waktu yang cukup bagi atasan untuk meninjau dan menandatangani permohonan Anda."
    }
  ]

  const [showAllFaqs, setShowAllFaqs] = useState(false)
  const [expandedIndices, setExpandedIndices] = useState([0]) // First FAQ open by default

  const visibleFaqs = showAllFaqs ? faqs : faqs.slice(0, 5)

  const toggleFaq = (idx) => {
    if (expandedIndices.includes(idx)) {
      setExpandedIndices(expandedIndices.filter(i => i !== idx))
    } else {
      setExpandedIndices([...expandedIndices, idx])
    }
  }

  const expandAll = () => {
    const allIndices = visibleFaqs.map((_, i) => i)
    setExpandedIndices(allIndices)
  }

  const collapseAll = () => {
    setExpandedIndices([])
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl space-y-8 animate-in fade-in duration-300">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Bantuan & Dukungan</h1>
        <p className="text-muted-foreground mt-1.5">
          Butuh bantuan teknis atau informasi kebijakan cuti Sicerdas? Temukan jawaban Anda di bawah ini.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Support Cards Column (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <h2 className="text-lg font-bold text-slate-800 pb-2 border-b border-slate-100">Kontak Bantuan</h2>
          
          <div className="space-y-4">
            {supportContacts.map((contact, idx) => (
              <a
                key={idx}
                href={contact.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-5 bg-white border border-slate-200 rounded-2xl shadow-xs text-left"
              >
                <div className="flex items-center justify-between gap-4">
                  {/* Left: Avatar & Info */}
                  <div className="flex items-center gap-4 min-w-0">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-100 shadow-xs relative">
                      <img
                        src={`https://api.dicebear.com/10.x/icons/svg?seed=${contact.name}`}
                        alt={contact.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    {/* Info */}
                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-800 text-base truncate">
                        {contact.name}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="inline-flex px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded bg-slate-50 border border-slate-100 text-slate-500">
                          {contact.role}
                        </span>
                      </div>
                      <span className="block text-xs font-mono text-slate-400 mt-1 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-300" />
                        +{contact.phone}
                      </span>
                    </div>
                  </div>

                  {/* Right: Chat CTA */}
                  <div className="flex-shrink-0">
                    <span className="inline-flex items-center justify-center h-9 px-3.5 rounded-lg text-xs font-bold text-white bg-primary hover:bg-primary/95 transition-all gap-1.5 cursor-pointer">
                      <MessageSquare className="w-3.5 h-3.5" />
                      Chat
                    </span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Right Side: FAQ Accordion (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-100 gap-2">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-indigo-500" />
              Tanya Jawab (FAQ)
            </h2>
            <div className="flex items-center gap-3 text-xs">
              <button
                type="button"
                onClick={expandAll}
                className="text-primary hover:underline font-semibold cursor-pointer"
              >
                Buka Semua
              </button>
              <span className="text-slate-300">|</span>
              <button
                type="button"
                onClick={collapseAll}
                className="text-slate-500 hover:text-slate-700 hover:underline font-semibold cursor-pointer"
              >
                Tutup Semua
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {visibleFaqs.map((faq, idx) => {
              const isOpen = expandedIndices.includes(idx)
              return (
                <div 
                  key={idx}
                  className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs transition-all duration-200"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    className="w-full flex items-center justify-between p-4 text-left font-semibold text-slate-800 hover:text-primary transition-colors gap-4 text-sm"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-primary' : ''}`} />
                  </button>
                  
                  {isOpen && (
                    <div className="px-4 pb-4 text-xs text-slate-500 leading-relaxed border-t border-slate-100 pt-3 bg-slate-50/30">
                      {faq.a}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Show More / Show Less Button */}
          <div className="pt-2 flex justify-center">
            <button
              type="button"
              onClick={() => {
                setShowAllFaqs(!showAllFaqs)
                if (showAllFaqs) {
                  setExpandedIndices(expandedIndices.filter(i => i < 5))
                }
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200/80 text-slate-600 transition-colors cursor-pointer"
            >
              {showAllFaqs ? (
                <>
                  <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                  <span>Sembunyikan FAQ</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5 text-slate-400" />
                  <span>Tampilkan FAQ Lainnya</span>
                </>
              )}
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showAllFaqs ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Info Safety Note */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-slate-500 leading-relaxed">
          <strong>Catatan Keamanan:</strong> Harap berhati-hati saat membagikan data pribadi Anda. Tim pengelola Sicerdas tidak akan pernah meminta data kata sandi atau kode akses rahasia. Pertanyaan seputar kebijakan cuti resmi sebaiknya ditanyakan langsung kepada Manager.
        </p>
      </div>
    </div>
  )
}
