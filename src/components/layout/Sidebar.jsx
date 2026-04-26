'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, CheckSquare, Inbox, Users, LogOut, Menu, X } from 'lucide-react'

function NavLink({ href, icon: Icon, children, exact = false, onClick }) {
  const pathname = usePathname()
  
  const isActive = exact 
    ? pathname === href 
    : pathname.startsWith(href)

  const activeClasses = "flex items-center gap-3 px-4 py-3 rounded-2xl bg-primary text-white font-semibold shadow-[0_5px_15px_rgba(var(--primary),0.3)]"
  const inactiveClasses = "flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-500 hover:bg-slate-50 hover:text-slate-800 font-medium transition-colors"

  return (
    <Link href={href} className={isActive ? activeClasses : inactiveClasses} onClick={onClick}>
      <Icon className={`w-5 h-5 ${isActive ? 'opacity-90' : ''}`} />
      {children}
    </Link>
  )
}

export function Sidebar({ role, employee, avatarUrl }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button 
        onClick={() => setIsOpen(true)}
        className="lg:hidden absolute top-4 left-4 z-30 p-2 bg-white rounded-xl shadow-sm text-slate-800 border border-slate-100"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 
        w-[280px] bg-white border-r border-slate-100 
        flex flex-col h-full py-8 flex-shrink-0 z-50 
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        
        {/* Mobile Close Button */}
        <button 
          onClick={() => setIsOpen(false)}
          className="lg:hidden absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-800 bg-slate-50 rounded-full"
        >
          <X className="w-5 h-5" />
        </button>

        <a href="/" className="px-8 mb-10 flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center transition-transform group-hover:scale-105">
            <div className="w-4 h-4 bg-white rounded-sm rotate-45" />
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-800 group-hover:text-primary transition-colors">Sicerdas</span>
        </a>

        <div className="flex-1 overflow-y-auto px-4 custom-scrollbar">
          <div className="mb-6">
            <p className="px-4 text-[10px] font-bold text-slate-400 mb-3 tracking-widest">IKHTISAR</p>
            <nav className="space-y-1.5">
              <NavLink href="/dashboard" icon={LayoutDashboard} exact={true} onClick={() => setIsOpen(false)}>
                Dashboard
              </NavLink>
              <NavLink href="/dashboard/form" icon={CheckSquare} onClick={() => setIsOpen(false)}>
                Ajukan Cuti
              </NavLink>
            </nav>
          </div>

          {role === 'admin' && (
            <div className="mb-6">
              <p className="px-4 text-[10px] font-bold text-slate-400 mb-3 tracking-widest">ADMINISTRASI</p>
              <nav className="space-y-1.5">
                <NavLink href="/admin" icon={LayoutDashboard} exact={true} onClick={() => setIsOpen(false)}>
                  Pusat Admin
                </NavLink>
                <NavLink href="/admin/requests" icon={Inbox} onClick={() => setIsOpen(false)}>
                  Kotak Masuk Cuti
                </NavLink>
                <NavLink href="/admin/employees" icon={Users} onClick={() => setIsOpen(false)}>
                  Pegawai
                </NavLink>
              </nav>
            </div>
          )}
        </div>

        {/* Fixed Profile & Logout Section */}
        <div className="px-6 pt-6 border-t border-slate-50 mt-auto mb-2">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3 min-w-0">
              <img src={avatarUrl} alt="User Avatar" className="w-9 h-9 rounded-full object-cover shadow-sm bg-slate-100 flex-shrink-0" />
              <span className="font-bold text-[13px] text-slate-800 tracking-tight truncate">{employee.name}</span>
            </div>
            <form action="/auth/signout" method="POST">
              <button type="submit" className="p-2 text-slate-400 hover:text-orange-500 transition-colors flex-shrink-0" title="Logout">
                <LogOut className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </aside>
    </>
  )
}
