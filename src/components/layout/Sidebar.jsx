'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, CheckSquare, Inbox, Users, LogOut, Menu, X, FileSignature, FolderArchive, HelpCircle, PlayCircle } from 'lucide-react'

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

export function Sidebar({
  role,
  employee,
  avatarUrl,
  pendingMyActionCount = 0,
  pendingOthersActionCount = 0
}) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  const isHelpActive = pathname === '/help'
  const isTutorialActive = pathname === '/tutorial'

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden absolute top-4 left-4 z-30 p-1.5 bg-white rounded-xl shadow-sm text-slate-800 border border-slate-100"
      >
        <Menu className="w-5 h-5" />
        {(pendingMyActionCount > 0 || pendingOthersActionCount > 0) && (
          <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-orange-500" />
        )}
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
          <img
            src="/favicon-io/apple-touch-icon.png"
            alt="Sicerdas Logo"
            className="w-8 h-8 object-contain transition-transform group-hover:scale-105"
          />
          <span className="font-bold text-xl tracking-tight text-slate-800 group-hover:text-primary transition-colors">SiCerdas</span>
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

          {(role === 'admin' || role === 'manager') && (
            <div className="mb-6">
              <p className="px-4 text-[10px] font-bold text-slate-400 mb-3 tracking-widest">ADMINISTRASI</p>
              <nav className="space-y-1.5">
                <NavLink href="/admin" icon={LayoutDashboard} exact={true} onClick={() => setIsOpen(false)}>
                  Pusat Admin
                </NavLink>
                <NavLink href="/admin/requests" icon={Inbox} onClick={() => setIsOpen(false)}>
                  <span className="flex-1">Kotak Masuk Cuti</span>
                  {pendingMyActionCount > 0 ? (
                    <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold animate-pulse">
                      {pendingMyActionCount}
                    </span>
                  ) : pendingOthersActionCount > 0 ? (
                    <span className="bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                      {pendingOthersActionCount}
                    </span>
                  ) : null}
                </NavLink>
                <NavLink href="/admin/manage" icon={FolderArchive} onClick={() => setIsOpen(false)}>
                  Penyimpanan
                </NavLink>
                <NavLink href="/admin/employees" icon={Users} onClick={() => setIsOpen(false)}>
                  Pegawai
                </NavLink>
              </nav>
            </div>
          )}        </div>

        {/* FAQ & Support & Tutorial links (above profile) */}
        <div className="px-6 pt-4 border-t border-slate-50 mt-auto">
          <div className="px-2 flex items-center gap-4">
            <Link
              href="/help"
              onClick={() => setIsOpen(false)}
              className={`group text-[11px] font-semibold flex items-center gap-1.5 ${isHelpActive
                ? 'text-primary'
                : 'text-slate-400 hover:text-primary'
                }`}
            >
              <HelpCircle className={`w-3.5 h-3.5 ${isHelpActive
                ? 'text-primary'
                : 'text-slate-400 group-hover:text-primary'
                }`} />
              FAQ & Support
            </Link>

            <Link
              href="/tutorial"
              onClick={() => setIsOpen(false)}
              className={`group text-[11px] font-semibold flex items-center gap-1.5 ${isTutorialActive
                ? 'text-primary'
                : 'text-slate-400 hover:text-primary'
                }`}
            >
              <PlayCircle className={`w-3.5 h-3.5 ${isTutorialActive
                ? 'text-primary'
                : 'text-slate-400 group-hover:text-primary'
                }`} />
              Tutorial
            </Link>
          </div>
        </div>

        {/* Fixed Profile & Logout Section / Login Button */}
        <div className="px-6 pt-4 border-t border-slate-50 mb-2 mt-2">
          {employee ? (
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
          ) : (
            <div className="px-2">
              <Link
                href="/login"
                className="flex items-center justify-center gap-2 w-full bg-primary hover:bg-primary/95 text-white text-xs font-semibold py-2.5 px-4 rounded-xl transition-all cursor-pointer"
              >
                Masuk ke Aplikasi
              </Link>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
