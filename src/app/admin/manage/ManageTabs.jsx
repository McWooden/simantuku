'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FolderArchive, FileSignature, UploadCloud, Trash2 } from 'lucide-react'

export function ManageTabs() {
  const pathname = usePathname()
  
  const tabs = [
    { name: 'Lampiran Cuti', href: '/admin/manage/attachments', icon: FolderArchive },
    { name: 'Daftar Tanda Tangan', href: '/admin/manage/signatures', icon: FileSignature },
    { name: 'Unggah Tanda Tangan', href: '/admin/manage/signatures/upload', icon: UploadCloud },
    { name: 'Stempel Unit', href: '/admin/manage/stamps', icon: FolderArchive }, // using FolderArchive or another icon
    { name: 'Pembersihan Data', href: '/admin/manage/cleanup', icon: Trash2 }
  ]

  return (
    <div className="flex flex-col md:flex-row md:border-b border-slate-200 gap-1 md:gap-0">
      {tabs.map(tab => {
        const isActive = pathname === tab.href
        const Icon = tab.icon
        return (
          <Link
            key={tab.name}
            href={tab.href}
            className={`flex items-center gap-2 px-4 md:px-6 py-2.5 md:py-3 font-medium text-sm transition-colors rounded-lg md:rounded-none md:border-b-2 ${
              isActive 
                ? 'bg-primary/10 md:bg-transparent text-primary md:border-primary' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50 md:hover:bg-transparent md:border-transparent md:hover:border-slate-300'
            }`}
          >
            <Icon className="w-4 h-4" /> {tab.name}
          </Link>
        )
      })}
    </div>
  )
}
