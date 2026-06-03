'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { updateLeaveStatusAction, signLeaveAction } from '@/app/actions/leaveActions'
import { Button } from '@/components/ui/button'
import { Check, X, Lock, PenTool, Loader2 } from 'lucide-react'

export function RequestActions({ request, currentEmployeeId, redirectUrl }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [activeAction, setActiveAction] = useState(null) // 'atasan', 'pejabat', or 'tolak'

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

  const isAtasanSignatory = request.atasan_id === currentEmployeeId
  const isPejabatSignatory = request.pejabat_id === currentEmployeeId

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {/* Atasan Langsung Signature Button */}
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

      {/* Pejabat Berwenang Signature Button */}
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

      {/* Reject/Tolak Button */}
      <Button 
        size="sm" 
        variant="outline" 
        className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-100"
        onClick={() => handleUpdate('ditolak')}
        disabled={isPending}
      >
        {activeAction === 'tolak' && isPending ? (
          <>
            <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin text-rose-500" />
            Proses...
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
}

// Simple placeholder badge in case importing is complex
function Badge({ className, children }) {
  return (
    <span className={className}>
      {children}
    </span>
  )
}
