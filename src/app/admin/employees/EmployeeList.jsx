'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Search } from 'lucide-react'

export function EmployeeList({ initialEmployees = [] }) {
  const [searchQuery, setSearchQuery] = useState('')

  // Filter employees based on search query (name, nip, unit, or role)
  const filteredEmployees = initialEmployees.filter((u) => {
    if (!searchQuery.trim()) return true
    const name = (u.name || '').toLowerCase()
    const nip = (u.nip || '').toLowerCase()
    const unit = (u.unit || '').toLowerCase()
    const role = (u.role || '').toLowerCase()
    const query = searchQuery.toLowerCase()

    return name.includes(query) || nip.includes(query) || unit.includes(query) || role.includes(query)
  })

  return (
    <div className="space-y-4">
      {/* Search Box */}
      <div className="flex justify-end mb-2">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama, NIP, atau unit..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder-slate-400"
          />
        </div>
      </div>

      {/* Table / Cards Container */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm transition-all duration-300 min-h-[200px]">
        {/* Desktop Table View */}
        <div className="hidden md:block">
          <Table containerClassName="overflow-x-auto">
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead className="font-semibold text-slate-700 pl-6">Nama</TableHead>
                <TableHead className="font-semibold text-slate-700">NIP</TableHead>
                <TableHead className="font-semibold text-slate-700">Peran</TableHead>
                <TableHead className="font-semibold text-slate-700">Bergabung</TableHead>
                <TableHead className="font-semibold text-slate-700">Cuti Tahunan Terpakai</TableHead>
                <TableHead className="font-semibold text-slate-700 pr-6">Sisa Kuota</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100">
              {filteredEmployees.length > 0 ? (
                filteredEmployees.map((u) => (
                  <TableRow key={u.id} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell className="font-medium pl-6">
                      <Link href={`/admin/employees/${u.id}`} className="text-primary font-semibold hover:underline">
                        {u.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-slate-650 font-medium">{u.nip ?? '-'}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={u.role === 'admin' || u.role === 'manager' ? 'default' : 'secondary'}
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                          u.role === 'admin' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                          u.role === 'manager' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                          'bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                      >
                        {u.role.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-500 text-sm">
                      {new Date(u.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </TableCell>
                    <TableCell className="text-slate-700 font-medium">{u.daysUsed} hari</TableCell>
                    <TableCell className="pr-6">
                      <span className={`text-sm font-semibold ${u.remaining < 3 ? "text-red-650 font-bold" : "text-slate-700"}`}>
                        {u.remaining} hari
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-48 text-center bg-slate-50/20">
                    <div className="flex flex-col items-center justify-center space-y-3 p-6 text-slate-400">
                      <Search className="w-8 h-8 text-slate-300" />
                      <div className="max-w-xs">
                        <h3 className="font-semibold text-slate-800">Tidak Ada Hasil</h3>
                        <p className="text-sm text-slate-500 mt-1">
                          Pencarian untuk "{searchQuery}" tidak menemukan pegawai yang cocok.
                        </p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Cards View */}
        <div className="block md:hidden divide-y divide-slate-100">
          {filteredEmployees.length > 0 ? (
            filteredEmployees.map((u) => (
              <div key={u.id} className="p-4 space-y-3 hover:bg-slate-50/50 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <Link href={`/admin/employees/${u.id}`} className="text-primary font-bold text-sm hover:underline">
                    {u.name}
                  </Link>
                  <Badge 
                    variant={u.role === 'admin' || u.role === 'manager' ? 'default' : 'secondary'}
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold border shrink-0 ${
                      u.role === 'admin' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                      u.role === 'manager' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                      'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    {u.role.toUpperCase()}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 font-medium">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">NIP</span>
                    <span>{u.nip ?? '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Bergabung</span>
                    <span>{new Date(u.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Terpakai</span>
                    <span>{u.daysUsed} hari</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Sisa Kuota</span>
                    <span className={`font-semibold ${u.remaining < 3 ? "text-red-650" : "text-slate-700"}`}>
                      {u.remaining} hari
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center space-y-3 p-12 text-center bg-slate-50/20 text-slate-400">
              <Search className="w-8 h-8 text-slate-300" />
              <div className="max-w-xs">
                <h3 className="font-semibold text-slate-800">Tidak Ada Hasil</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Pencarian untuk "{searchQuery}" tidak menemukan pegawai yang cocok.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
