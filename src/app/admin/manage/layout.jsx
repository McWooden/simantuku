import { ManageTabs } from './ManageTabs'

export default function ManageLayout({ children }) {
  return (
    <div className="container mx-auto p-4 md:p-8 max-w-6xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Manajemen Storage</h1>
        <p className="text-slate-500 mt-1">Kelola lampiran cuti dan tanda tangan pegawai.</p>
      </div>
      
      <ManageTabs />
      
      <div className="mt-6">
        {children}
      </div>
    </div>
  )
}
