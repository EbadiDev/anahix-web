import { Check, CheckCircle2, Clock, Copy, Loader2, Radio } from 'lucide-react'
import type React from 'react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiService } from '../../services/api'
import type { VirtualNumberOrder } from '../../types'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'

interface ProfileNumberSessionsTabProps {
  virtualOrders: VirtualNumberOrder[]
  onUpdateVirtualOrders?: (orders: VirtualNumberOrder[]) => void
}

export const ProfileNumberSessionsTab: React.FC<
  ProfileNumberSessionsTabProps
> = ({ virtualOrders, onUpdateVirtualOrders }) => {
  const [sessions, setSessions] = useState<VirtualNumberOrder[]>(virtualOrders)
  const [copiedKey, setCopiedKey] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Sync if prop updates
  useEffect(() => {
    if (virtualOrders.length > 0) {
      setSessions(virtualOrders)
    }
  }, [virtualOrders])

  // Periodic status poll for pending sessions
  useEffect(() => {
    const pending = sessions.filter((s) => s.status === 'PENDING')
    if (pending.length === 0) return

    const timer = setInterval(async () => {
      try {
        const updatedPromises = pending.map((p) =>
          apiService.getVirtualOrderDetail(p.id),
        )
        const results = await Promise.all(updatedPromises)

        setSessions((prev) =>
          prev.map((s) => {
            const found = results.find((r) => r.id === s.id)
            return found || s
          }),
        )
      } catch (e) {
        console.error('Polling virtual orders error:', e)
      }
    }, 4000)

    return () => clearInterval(timer)
  }, [sessions])

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(''), 2000)
  }

  const handleCancelOrder = async (orderId: string) => {
    setActionLoading(orderId)
    try {
      await apiService.cancelVirtualOrder(orderId)
      const updated = await apiService.getVirtualOrderDetail(orderId)
      apiService.updateCustomerVirtualOrder(updated)
      setSessions((prev) => {
        const next = prev.map((s) => (s.id === orderId ? updated : s))
        onUpdateVirtualOrders?.(next)
        return next
      })
    } catch (err: any) {
      alert(err.message || 'خطا در لغو شماره')
    } finally {
      setActionLoading(null)
    }
  }

  const handleFinishOrder = async (orderId: string) => {
    setActionLoading(orderId)
    try {
      await apiService.finishVirtualOrder(orderId)
      const updated = await apiService.getVirtualOrderDetail(orderId)
      apiService.updateCustomerVirtualOrder(updated)
      setSessions((prev) => {
        const next = prev.map((s) => (s.id === orderId ? updated : s))
        onUpdateVirtualOrders?.(next)
        return next
      })
    } catch (err: any) {
      alert(err.message || 'خطا در تکمیل سفارش')
    } finally {
      setActionLoading(null)
    }
  }

  const activeSessions = sessions.filter(
    (s) => s.status === 'PENDING' || s.status === 'RECEIVED',
  )
  const historySessions = sessions.filter(
    (s) => s.status !== 'PENDING' && s.status !== 'RECEIVED',
  )

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Header Banner */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Radio className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              میزکار نشست‌های شماره مجازی (Virtual Number Sessions)
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            دریافت لحظه‌ای پیامک، کد تایید یکبارمصرف (OTP)، تایمر ۱۵ دقیقه‌ای و
            ضمانت بازگشت وجه
          </p>
        </div>

        <Link to="/virtual-numbers">
          <Button className="h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm shadow-blue-500/20">
            <Radio className="w-3.5 h-3.5" />+ دریافت شماره جدید
          </Button>
        </Link>
      </div>

      {/* 2. Active Number Sessions Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            نشست‌های فعال (در حال انتظار برای پیامک)
          </h4>
          <span className="text-xs text-slate-400 font-mono">
            {activeSessions.length} نشست فعال
          </span>
        </div>

        {activeSessions.length === 0 ? (
          <div className="p-8 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-center">
            <Radio className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
              هم‌اکنون شماره مجازی فعالی در انتظار پیامک ندارید
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              جهت فعال‌سازی تلگرام، واتس‌اپ، گوگل یا OpenAI شماره موقت دریافت کنید
            </p>
            <Link to="/virtual-numbers" className="inline-block mt-3">
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs rounded-xl"
              >
                مشاهده لیست سرویس‌ها و کشورها
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeSessions.map((session) => (
              <div
                key={session.id}
                className="p-5 rounded-2xl border border-blue-200 dark:border-blue-900/80 bg-gradient-to-br from-white to-blue-50/20 dark:from-slate-900 dark:to-blue-950/20 shadow-md space-y-4 relative overflow-hidden"
              >
                {/* Header info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{session.country_flag}</span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        {session.country_name_fa} • {session.service_name_fa}
                      </h4>
                      <span className="text-[10px] font-mono text-slate-400">
                        سفارش #{session.order_no}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800 text-[11px] font-mono font-bold text-blue-700 dark:text-blue-300">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    <span>
                      {Math.floor(session.seconds_remaining / 60)}:
                      {(session.seconds_remaining % 60)
                        .toString()
                        .padStart(2, '0')}
                    </span>
                  </div>
                </div>

                {/* Phone Number Display */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-0.5">
                      شماره اختصاص داده شده:
                    </span>
                    <span
                      dir="ltr"
                      className="text-base font-bold font-mono tracking-wider text-slate-900 dark:text-white"
                    >
                      {session.phone}
                    </span>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      copyToClipboard(session.phone, `phone_${session.id}`)
                    }
                    className="h-8 text-xs rounded-lg px-2.5"
                  >
                    {copiedKey === `phone_${session.id}` ? (
                      <>
                        <Check className="w-3.5 h-3.5 ml-1 text-emerald-500" />
                        کپی شد
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 ml-1" />
                        کپی شماره
                      </>
                    )}
                  </Button>
                </div>

                {/* OTP & SMS Status */}
                {session.sms_code ? (
                  <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-2.5 animate-in zoom-in-95">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        پیامک تایید دریافت شد:
                      </span>

                      <Button
                        size="sm"
                        onClick={() =>
                          copyToClipboard(
                            session.sms_code || '',
                            `code_${session.id}`,
                          )
                        }
                        className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-3"
                      >
                        {copiedKey === `code_${session.id}`
                          ? 'کپی شد!'
                          : 'کپی کد OTP'}
                      </Button>
                    </div>

                    <div className="text-center py-2 bg-white dark:bg-slate-900 rounded-lg border border-emerald-200 dark:border-emerald-800/80 font-mono text-2xl font-black tracking-widest text-emerald-600 dark:text-emerald-400">
                      {session.sms_code}
                    </div>

                    {session.sms_text && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono bg-slate-50 dark:bg-slate-950/60 p-2 rounded border border-slate-100 dark:border-slate-800 truncate">
                        {session.sms_text}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/40 flex items-center gap-2.5 text-xs text-amber-800 dark:text-amber-300">
                    <Loader2 className="w-4 h-4 animate-spin text-amber-600 shrink-0" />
                    <span>
                      منتظر دریافت پیامک از سرویس {session.service_name_fa}...
                    </span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-1 gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={actionLoading === session.id}
                    onClick={() => handleCancelOrder(session.id)}
                    className="h-8 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg px-2.5"
                  >
                    لغو و استرداد وجه
                  </Button>

                  {session.sms_code && (
                    <Button
                      size="sm"
                      disabled={actionLoading === session.id}
                      onClick={() => handleFinishOrder(session.id)}
                      className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-3"
                    >
                      تکمیل و پایان نشست
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Past Sessions History */}
      {historySessions.length > 0 && (
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
            تاریخچه نشست‌های قبلی
          </h4>

          <div className="space-y-2">
            {historySessions.map((hist) => (
              <div
                key={hist.id}
                className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{hist.country_flag}</span>
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {hist.country_name_fa} • {hist.service_name_fa}
                    </span>
                    <span
                      className="text-[11px] font-mono text-slate-400 block"
                      dir="ltr"
                    >
                      {hist.phone}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {hist.sms_code && (
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      کد: {hist.sms_code}
                    </span>
                  )}
                  <Badge
                    variant="outline"
                    className="text-[10px] text-slate-500 border-slate-200 dark:border-slate-800"
                  >
                    {hist.status === 'FINISHED' ? 'تکمیل شده' : 'لغو شده'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
