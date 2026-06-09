'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { updateLeaveStatusAction, signLeaveAction } from '@/app/actions/leaveActions'
import { Button } from '@/components/ui/button'
import { Check, X, Lock, PenTool, Loader2, ChevronDown, CheckSquare } from 'lucide-react'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'

export function RequestActions({ request, currentEmployeeId, currentEmployeeRole, redirectUrl }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [activeAction, setActiveAction] = useState(null) // 'atasan', 'pejabat', or 'tolak'
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  // Reset active action when transition completes
  useEffect(() => {
    if (!isPending && activeAction !== null) {
      setActiveAction(null)
    }
  }, [isPending, activeAction])

  const handleUpdate = (status) => {
    if (status === 'ditolak') {
      if (!confirm('Anda yakin ingin menolak permohonan cuti ini?')) return
    }
    setActiveAction('tolak')
    startTransition(async () => {
      try {
        const res = await updateLeaveStatusAction(request.id, status)
        if (res?.error) {
          alert(res.error)
          setActiveAction(null)
        } else {
          router.refresh()
          if (redirectUrl) {
            router.push(redirectUrl)
          }
        }
      } catch (err) {
        console.error(err)
        alert('Terjadi kesalahan saat menolak permohonan.')
        setActiveAction(null)
      }
    })
  }

  const handleSign = (roleType) => {
    setActiveAction(roleType)
    startTransition(async () => {
      try {
        const res = await signLeaveAction(request.id, roleType)
        if (res?.error) {
          alert(res.error)
          setActiveAction(null)
        } else {
          router.refresh()
          if (redirectUrl) {
            router.push(redirectUrl)
          }
        }
      } catch (err) {
        console.error(err)
        alert('Terjadi kesalahan saat menandatangani.')
        setActiveAction(null)
      }
    })
  }

  const isAtasanSignatory = request.atasan_id === currentEmployeeId || currentEmployeeRole === 'admin' || currentEmployeeRole === 'manager'
  const isPejabatSignatory = request.pejabat_id === currentEmployeeId || currentEmployeeRole === 'admin' || currentEmployeeRole === 'manager'

  const isManager = currentEmployeeRole === 'manager'
  const isAdmin = currentEmployeeRole === 'admin'
  const isManagerOrAdmin = isManager || isAdmin

  return (
    <div className="flex flex-wrap items-center justify-end gap-2 relative">
      {isManagerOrAdmin ? (
        (() => {
          const isAtasanRefer = request.atasan_id === currentEmployeeId
          const isPejabatRefer = request.pejabat_id === currentEmployeeId
          const isDropdownButtonLocked = isAdmin && !isManager && !isAtasanRefer && !isPejabatRefer

          return (
            <div 
              title={isDropdownButtonLocked ? "Anda bukan pejabat/atasan yang ditunjuk pada permohonan ini" : undefined}
              className="inline-block"
            >
              <Popover open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
                <PopoverTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className={isDropdownButtonLocked
                      ? "text-slate-400 bg-transparent opacity-50 cursor-not-allowed border-slate-200 font-semibold flex items-center gap-1"
                      : "text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 border-indigo-200 font-semibold flex items-center gap-1"
                    }
                    disabled={isPending || isDropdownButtonLocked}
                  >
                    {isPending && activeAction ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-500" />
                    ) : isDropdownButtonLocked ? (
                      <Lock className="h-3.5 w-3.5 text-slate-300" />
                    ) : (
                      <PenTool className="h-3.5 w-3.5 text-indigo-500 animate-pulse" />
                    )}
                    <span>Tandatangani</span>
                    {!isDropdownButtonLocked && <ChevronDown className="h-3.5 w-3.5 text-indigo-400" />}
                  </Button>
                </PopoverTrigger>

                <PopoverContent align="end" className="w-60 p-1.5 bg-white border border-slate-200 rounded-xl flex flex-col gap-0 shadow-lg text-slate-700">
                  <div className="px-2 py-1.5 text-[10px] font-bold text-slate-400 tracking-wider uppercase border-b border-slate-100 mb-1">
                    Pilih Tanda Tangan
                  </div>
                  
                  {/* Option 1: Atasan Langsung */}
                  {(() => {
                    const isAtasanRefer = request.atasan_id === currentEmployeeId
                    const isAtasanLocked = isAdmin && !isManager && !isAtasanRefer
                    const isItemDisabled = request.is_atasan_approved || isAtasanLocked || isPending

                    return (
                      <div title={isAtasanLocked ? "Anda bukan Atasan Langsung yang ditunjuk untuk permohonan ini" : undefined}>
                        <button
                          type="button"
                          disabled={isItemDisabled}
                          onClick={() => {
                            handleSign('atasan')
                            setIsDropdownOpen(false)
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg transition-colors text-left ${
                            request.is_atasan_approved
                              ? 'text-slate-400 bg-slate-50 cursor-not-allowed'
                              : isAtasanLocked
                                ? 'text-slate-400 bg-transparent opacity-50 cursor-not-allowed'
                                : 'text-slate-700 hover:bg-slate-50 hover:text-indigo-600 cursor-pointer'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            {isAtasanLocked ? (
                              <Lock className="h-3.5 w-3.5 text-slate-400" />
                            ) : (
                              <PenTool className={`h-3.5 w-3.5 ${request.is_atasan_approved ? 'text-slate-300' : 'text-indigo-500'}`} />
                            )}
                            Atasan Langsung
                          </span>
                          {request.is_atasan_approved && (
                            <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200 flex items-center gap-0.5">
                              <Check className="h-2.5 w-2.5" /> Signed
                            </span>
                          )}
                        </button>
                      </div>
                    )
                  })()}

                  {/* Option 2: Atas Atasan Langsung */}
                  {(() => {
                    const isPejabatRefer = request.pejabat_id === currentEmployeeId
                    const isPejabatLocked = isAdmin && !isManager && !isPejabatRefer
                    const isItemDisabled = request.is_pejabat_approved || isPejabatLocked || isPending

                    return (
                      <div title={isPejabatLocked ? "Anda bukan Pejabat Berwenang yang ditunjuk untuk permohonan ini" : undefined}>
                        <button
                          type="button"
                          disabled={isItemDisabled}
                          onClick={() => {
                            handleSign('pejabat')
                            setIsDropdownOpen(false)
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg transition-colors text-left ${
                            request.is_pejabat_approved
                              ? 'text-slate-400 bg-slate-50 cursor-not-allowed'
                              : isPejabatLocked
                                ? 'text-slate-400 bg-transparent opacity-50 cursor-not-allowed'
                                : 'text-slate-700 hover:bg-slate-50 hover:text-indigo-600 cursor-pointer'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            {isPejabatLocked ? (
                              <Lock className="h-3.5 w-3.5 text-slate-400" />
                            ) : (
                              <PenTool className={`h-3.5 w-3.5 ${request.is_pejabat_approved ? 'text-slate-300' : 'text-indigo-500'}`} />
                            )}
                            Atas Atasan Langsung
                          </span>
                          {request.is_pejabat_approved && (
                            <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200 flex items-center gap-0.5">
                              <Check className="h-2.5 w-2.5" /> Signed
                            </span>
                          )}
                        </button>
                      </div>
                    )
                  })()}

                  <div className="border-t border-slate-100 my-1"></div>

                  {/* Option 3: Tanda Tangani Semua */}
                  {(() => {
                    const isAllLocked = isAdmin && !isManager
                    const isBothApproved = request.is_atasan_approved && request.is_pejabat_approved
                    const isItemDisabled = isBothApproved || isAllLocked || isPending

                    return (
                      <div title={isAllLocked ? "Hanya Manager yang dapat menyetujui semua sekaligus" : undefined}>
                        <button
                          type="button"
                          disabled={isItemDisabled}
                          onClick={() => {
                            handleSign('all')
                            setIsDropdownOpen(false)
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg transition-colors text-left ${
                            isBothApproved
                              ? 'text-slate-400 bg-slate-50 cursor-not-allowed'
                              : isAllLocked
                                ? 'text-slate-400 bg-transparent opacity-50 cursor-not-allowed'
                                : 'text-indigo-600 hover:bg-indigo-50 cursor-pointer'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            {isAllLocked ? (
                              <Lock className="h-3.5 w-3.5 text-slate-400" />
                            ) : (
                              <CheckSquare className="h-3.5 w-3.5" />
                            )}
                            Tanda Tangani Semua
                          </span>
                        </button>
                      </div>
                    )
                  })()}
                </PopoverContent>
              </Popover>
            </div>
          )
        })()
      ) : (
        <>
          {request.atasan_id && (
            <>
              {request.is_atasan_approved ? (
                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 py-1.5 px-3 rounded-lg flex items-center gap-1 text-xs font-semibold select-none shadow-xs border">
                  <Check className="h-3.5 w-3.5" />
                  Signed (Atasan)
                </Badge>
              ) : (
                <Button 
                  size="sm" 
                  variant={isAtasanSignatory ? "outline" : "ghost"}
                  className={isAtasanSignatory 
                    ? "text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 border-indigo-200 font-semibold" 
                    : "text-slate-400 cursor-not-allowed bg-slate-50 border-slate-100 hover:bg-slate-50"
                  }
                  onClick={() => handleSign('atasan')}
                  disabled={isPending || !isAtasanSignatory}
                  title={isAtasanSignatory ? "Tandatangani sebagai Atasan Langsung" : "Anda bukan Atasan Langsung untuk permohonan ini"}
                >
                  {activeAction === 'atasan' && isPending ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin text-indigo-500" />
                      Proses...
                    </>
                  ) : isAtasanSignatory ? (
                    <>
                      <PenTool className="h-3.5 w-3.5 mr-1 text-indigo-500 animate-pulse" />
                      Sign Atasan
                    </>
                  ) : (
                    <>
                      <Lock className="h-3.5 w-3.5 mr-1 text-slate-300" />
                      Sign Atasan
                    </>
                  )}
                </Button>
              )}
            </>
          )}

          {request.pejabat_id && (
            <>
              {request.is_pejabat_approved ? (
                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 py-1.5 px-3 rounded-lg flex items-center gap-1 text-xs font-semibold select-none shadow-xs border">
                  <Check className="h-3.5 w-3.5" />
                  Signed (Pejabat)
                </Badge>
              ) : (
                <Button 
                  size="sm" 
                  variant={isPejabatSignatory ? "outline" : "ghost"}
                  className={isPejabatSignatory 
                    ? "text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 border-indigo-200 font-semibold" 
                    : "text-slate-400 cursor-not-allowed bg-slate-50 border-slate-100 hover:bg-slate-50"
                  }
                  onClick={() => handleSign('pejabat')}
                  disabled={isPending || !isPejabatSignatory}
                  title={isPejabatSignatory ? "Tandatangani sebagai Pejabat Berwenang" : "Anda bukan Pejabat Berwenang untuk permohonan ini"}
                >
                  {activeAction === 'pejabat' && isPending ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin text-indigo-500" />
                      Proses...
                    </>
                  ) : isPejabatSignatory ? (
                    <>
                      <PenTool className="h-3.5 w-3.5 mr-1 text-indigo-500 animate-pulse" />
                      Sign Pejabat
                    </>
                  ) : (
                    <>
                      <Lock className="h-3.5 w-3.5 mr-1 text-slate-300" />
                      Sign Pejabat
                    </>
                  )}
                </Button>
              )}
            </>
          )}
        </>
      )}

      {/* Reject/Tolak Button */}
      {(() => {
        const isDesignatedSignatory = request.atasan_id === currentEmployeeId || request.pejabat_id === currentEmployeeId
        const isTolakLocked = isAdmin && !isManager && !isDesignatedSignatory
        
        return (
          <div 
            title={isTolakLocked ? "Anda bukan Atasan/Pejabat yang ditunjuk untuk permohonan ini" : undefined}
            className="inline-block"
          >
            <Button 
              size="sm" 
              variant="outline" 
              className={isTolakLocked 
                ? "text-slate-400 bg-transparent opacity-50 cursor-not-allowed border-slate-200" 
                : "text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-100"
              }
              onClick={() => !isTolakLocked && handleUpdate('ditolak')}
              disabled={isPending || isTolakLocked}
            >
              {activeAction === 'tolak' && isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin text-rose-500" />
                  Proses...
                </>
              ) : isTolakLocked ? (
                <>
                  <Lock className="h-3.5 w-3.5 mr-1 text-slate-300" />
                  Tolak
                </>
              ) : (
                <>
                  <X className="h-3.5 w-3.5 mr-1" />
                  Tolak
                </>
              )}
            </Button>
          </div>
        )
      })()}
    </div>
  )
}

// Simple placeholder badge in case importing is complex
function Badge({ className, children }) {
  return (
    <span className={className}>
      {children}
    </span>
  )
}
