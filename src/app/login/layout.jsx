export const metadata = {
  title: "Masuk ke Akun Anda - Sicerdas",
  description: "Masuk menggunakan NIP resmi instansi Anda atau melalui Google OAuth untuk mengelola permohonan cuti Anda secara aman di Sicerdas.",
  openGraph: {
    title: "Masuk ke Akun Anda - Sicerdas",
    description: "Masuk menggunakan NIP resmi instansi Anda atau melalui Google OAuth untuk mengelola permohonan cuti Anda secara aman di Sicerdas.",
    type: "website",
  },
}

export default function LoginLayout({ children }) {
  return (
    <div className="bg-slate-50 min-h-screen text-slate-800">
      {children}
    </div>
  )
}
