'use client'

import { useState, useEffect } from 'react'
import { Bell, BellOff, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function PushNotificationToggle() {
  const [enabled, setEnabled] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check initial subscription state
    const checkState = async () => {
      try {
        const { getPushSubscriptionState } = await import('@/lib/pushNotification')
        const state = await getPushSubscriptionState()
        setEnabled(state)
      } catch (err) {
        console.error("Failed to fetch initial push status:", err)
      } finally {
        setLoading(false)
      }
    }
    
    // OneSignal initialization might take a fraction of a second, wait slightly to query state accurately
    const timer = setTimeout(checkState, 1500)
    return () => clearTimeout(timer)
  }, [])

  const handleToggle = async () => {
    setLoading(true)
    try {
      const { setPushEnabledState } = await import('@/lib/pushNotification')
      const targetState = !enabled
      await setPushEnabledState(targetState)
      setEnabled(targetState)
    } catch (err) {
      console.error("Failed to toggle push state:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg transition-colors ${enabled ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-400'}`}>
          {enabled ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
        </div>
        <div className="text-left">
          <p className="text-sm font-bold text-slate-800">Notifikasi Web Push</p>
          <p className="text-xs text-slate-400 font-medium">Terima pemberitahuan langsung di perangkat Anda</p>
        </div>
      </div>
      <Button
        type="button"
        variant={enabled ? "default" : "outline"}
        size="sm"
        disabled={loading}
        onClick={handleToggle}
        className={`font-bold rounded-xl transition-all h-9 px-4 ${enabled ? 'bg-primary text-white hover:bg-primary/95 shadow-sm' : 'text-slate-600 border-slate-200 hover:bg-slate-50'}`}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : enabled ? (
          "Aktif"
        ) : (
          "Nonaktif"
        )}
      </Button>
    </div>
  )
}
