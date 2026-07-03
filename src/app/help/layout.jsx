export const metadata = {
  title: "Pusat Bantuan & FAQ Kebijakan Cuti - Sicerdas",
  description: "Temukan jawaban atas pertanyaan umum seputar kebijakan cuti, carryover saldo kuota berjalan (N, N-1, N-2), dan hubungi kontak dukungan teknis Sicerdas.",
  openGraph: {
    title: "Pusat Bantuan & FAQ Kebijakan Cuti - Sicerdas",
    description: "Temukan jawaban atas pertanyaan umum seputar kebijakan cuti, carryover saldo kuota berjalan (N, N-1, N-2), dan hubungi kontak dukungan teknis Sicerdas.",
    type: "website",
  },
}

export default function HelpLayout({ children }) {
  return (
    <div className="bg-slate-50 min-h-screen text-slate-800">
      {children}
    </div>
  )
}
