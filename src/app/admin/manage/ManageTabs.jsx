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
    { name: 'Pembersihan Data', href: '/admin/manage/cleanup', icon: Trash2 }
  ]

  return (
    <div className="flex border-b border-slate-200">
      {tabs.map(tab => {
        const isActive = pathname === tab.href
        const Icon = tab.icon
        return (
          <Link
            key={tab.name}
            href={tab.href}
            className={`flex items-center gap-2 px-6 py-3 font-medium text-sm transition-colors border-b-2 ${
              isActive 
                ? 'border-primary text-primary' 
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <Icon className="w-4 h-4" /> {tab.name}
          </Link>
        )
      })}
    </div>
  )
}
