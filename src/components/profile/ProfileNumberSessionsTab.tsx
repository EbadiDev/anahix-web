import { Check, CheckCircle2, Clock, Copy, Loader2, Radio } from 'lucide-react'
import type React from 'react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiService } from '../../services/api'
import type { VirtualNumberOrder } from '../../types'
import { formatDisplayPhone, toPersianDigits } from '../../utils/formatters'
import { useNotification } from '../vibefarsi/NotificationContext'
import { SearchInput } from '../vibefarsi/SearchInput'

interface ProfileNumberSessionsTabProps {
  virtualOrders: VirtualNumberOrder[]
  onUpdateVirtualOrders?: (orders: VirtualNumberOrder[]) => void
}

export const ProfileNumberSessionsTab: React.FC<
  ProfileNumberSessionsTabProps
> = ({ virtualOrders, onUpdateVirtualOrders }) => {
  const { success, error } = useNotification()
  const [sessions, setSessions] = useState<VirtualNumberOrder[]>(virtualOrders)
  const [copiedKey, setCopiedKey] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [visibleHistoryCount, setVisibleHistoryCount] = useState<number>(4)

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

  const copyToClipboard = (text: string, key: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    success(`${label} کپی شد`, text)
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
      success(
        'سفارش لغو شد',
        'مبلغ شماره به صورت خودکار به کیف پول استرداد گردید.',
      )
    } catch (err: any) {
      error('خطا در لغو شماره', err.message || 'عملیات لغو ناموفق بود')
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
      success('نشست تکمیل شد', 'از خرید و همراهی شما سپاسگزاریم.')
    } catch (err: any) {
      error('خطا در تکمیل نشست', err.message || 'عملیات پایان نشست ناموفق بود')
    } finally {
      setActionLoading(null)
    }
  }

  const activeSessions = useMemo(() => {
    return sessions.filter(
      (s) => s.status === 'PENDING' || s.status === 'RECEIVED',
    )
  }, [sessions])

  const historySessions = useMemo(() => {
    const list = sessions.filter(
      (s) => s.status !== 'PENDING' && s.status !== 'RECEIVED',
    )
    if (!searchQuery.trim()) return list
    const q = searchQuery.toLowerCase().trim()
    return list.filter(
      (s) =>
        s.service_name_fa?.toLowerCase().includes(q) ||
        s.country_name_fa?.toLowerCase().includes(q) ||
        s.phone?.includes(q) ||
        s.order_no?.includes(q),
    )
  }, [sessions, searchQuery])

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Header Banner - Graphite Minimal Technical */}
      <div className="rounded-surface border border-border/60 bg-card p-5 sm:p-6 shadow-surface flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-control bg-secondary text-secondary-foreground border border-border/60 flex items-center justify-center shadow-control">
              <Radio className="w-4 h-4 text-brand" />
            </div>
            <h3 className="text-base font-bold text-foreground">
              میزکار شماره‌های مجازی من (Virtual Numbers)
            </h3>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            دریافت لحظه‌ای پیامک، کد تایید یکبارمصرف (OTP) و ضمانت بازگشت وجه
            خودکار
          </p>
        </div>

        <Link to="/virtual-numbers">
          <button
            type="button"
            className="h-9 px-4 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-black flex items-center gap-1.5 duration-motion ease-motion active:scale-[0.98] shadow-control cursor-pointer"
          >
            <Radio className="w-3.5 h-3.5" />
            <span>دریافت شماره جدید</span>
          </button>
        </Link>
      </div>

      {/* 2. Active Number Sessions Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            نشست‌های فعال (در حال انتظار برای پیامک)
          </h4>
          <span className="text-xs text-muted-foreground font-mono">
            {toPersianDigits(activeSessions.length)} شماره فعال
          </span>
        </div>

        {activeSessions.length === 0 ? (
          <div className="p-8 rounded-surface border border-dashed border-border/60 bg-card/40 text-center space-y-2">
            <Radio className="w-8 h-8 text-muted-foreground/60 mx-auto" />
            <p className="text-xs font-bold text-foreground">
              هم‌اکنون شماره مجازی فعالی در انتظار پیامک ندارید
            </p>
            <p className="text-[11px] text-muted-foreground">
              جهت فعال‌سازی تلگرام، واتس‌اپ، گوگل یا OpenAI شماره موقت دریافت کنید
            </p>
            <Link to="/virtual-numbers" className="inline-block mt-2">
              <button
                type="button"
                className="h-8 px-4 rounded-control border border-border/60 bg-card hover:bg-muted text-xs font-bold text-foreground duration-motion ease-motion active:scale-[0.98] cursor-pointer"
              >
                مشاهده لیست کشورها
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeSessions.map((session) => (
              <div
                key={session.id}
                className="p-5 rounded-surface border border-border/60 bg-card shadow-surface space-y-4 relative overflow-hidden duration-motion ease-motion"
              >
                {/* Header info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{session.country_flag}</span>
                    <div>
                      <h4 className="text-xs font-bold text-foreground">
                        {session.country_name_fa} • {session.service_name_fa}
                      </h4>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        سفارش #{session.order_no}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-control bg-muted/60 border border-border/60 text-[11px] font-mono font-bold text-foreground">
                    <Clock className="w-3.5 h-3.5 text-brand" />
                    <span>
                      {toPersianDigits(
                        Math.floor(session.seconds_remaining / 60),
                      )}
                      :
                      {toPersianDigits(
                        (session.seconds_remaining % 60)
                          .toString()
                          .padStart(2, '0'),
                      )}
                    </span>
                  </div>
                </div>

                {/* Phone Number Display */}
                <div className="p-3 rounded-control bg-muted/20 border border-border/60 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-muted-foreground block mb-0.5">
                      شماره اختصاص داده شده:
                    </span>
                    <span
                      dir="ltr"
                      className="text-base font-bold font-mono tracking-wider text-foreground font-latin"
                    >
                      {session.phone}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(
                        session.phone,
                        `phone_${session.id}`,
                        'شماره تلفن',
                      )
                    }
                    className="h-8 text-xs rounded-control px-3 border border-border/60 bg-card hover:bg-muted text-foreground duration-motion ease-motion active:scale-[0.98] flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === `phone_${session.id}` ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>کپی شد</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>کپی</span>
                      </>
                    )}
                  </button>
                </div>

                {/* OTP & SMS Status */}
                {session.sms_code ? (
                  <div className="p-4 rounded-control bg-emerald-500/10 border border-emerald-500/20 space-y-2.5 animate-in zoom-in-95">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        پیامک تایید دریافت شد:
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          copyToClipboard(
                            session.sms_code || '',
                            `code_${session.id}`,
                            'کد تایید پیامکی',
                          )
                        }
                        className="h-7 text-xs bg-primary hover:bg-primary-hover text-primary-foreground font-black rounded-control px-3 duration-motion ease-motion active:scale-[0.98] shadow-control cursor-pointer"
                      >
                        {copiedKey === `code_${session.id}`
                          ? 'کپی شد!'
                          : 'کپی کد OTP'}
                      </button>
                    </div>

                    <div className="text-center py-2 bg-card rounded-control border border-emerald-500/30 font-mono text-2xl font-black tracking-widest text-emerald-400 font-latin">
                      {session.sms_code}
                    </div>

                    {session.sms_text && (
                      <p
                        className="text-[11px] text-muted-foreground font-mono bg-muted/40 p-2 rounded-control border border-border/40 truncate text-left"
                        dir="ltr"
                      >
                        {session.sms_text}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="p-3.5 rounded-control bg-brand/5 border border-brand/20 flex items-center gap-2.5 text-xs text-foreground">
                    <Loader2 className="w-4 h-4 animate-spin text-brand shrink-0" />
                    <span>
                      منتظر دریافت پیامک از سرویس {session.service_name_fa}...
                    </span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-1 gap-2">
                  <button
                    type="button"
                    disabled={actionLoading === session.id}
                    onClick={() => handleCancelOrder(session.id)}
                    className="h-8 text-xs text-destructive hover:bg-destructive/10 border border-destructive/20 rounded-control px-3 duration-motion ease-motion active:scale-[0.98] cursor-pointer disabled:opacity-50"
                  >
                    لغو و استرداد وجه
                  </button>

                  {session.sms_code && (
                    <button
                      type="button"
                      disabled={actionLoading === session.id}
                      onClick={() => handleFinishOrder(session.id)}
                      className="h-8 text-xs bg-primary hover:bg-primary-hover text-primary-foreground font-black rounded-control px-3 duration-motion ease-motion active:scale-[0.98] shadow-control cursor-pointer"
                    >
                      تکمیل و پایان نشست
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Past Sessions History */}
      {historySessions.length > 0 && (
        <div className="rounded-surface border border-border/60 bg-card p-5 shadow-surface space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-border/40">
            <h4 className="text-sm font-bold text-foreground">
              تاریخچه نشست‌های قبلی ({toPersianDigits(historySessions.length)})
            </h4>

            <div className="w-full sm:w-56">
              <SearchInput
                value={searchQuery}
                onChange={(val) => {
                  setSearchQuery(val)
                  setVisibleHistoryCount(4)
                }}
                placeholder="جستجو در تاریخچه..."
                size="sm"
                debounceMs={250}
              />
            </div>
          </div>

          <div className="space-y-2">
            {historySessions.slice(0, visibleHistoryCount).map((hist) => (
              <div
                key={hist.id}
                className="p-3 rounded-control border border-border/40 bg-muted/20 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{hist.country_flag}</span>
                  <div>
                    <span className="font-bold text-foreground">
                      {hist.country_name_fa} • {hist.service_name_fa}
                    </span>
                    <span
                      className="text-[11px] font-mono text-muted-foreground block font-latin"
                      dir="ltr"
                    >
                      {formatDisplayPhone(hist.phone)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {hist.sms_code && (
                    <span className="font-mono text-xs px-2 py-0.5 rounded-control bg-muted text-foreground border border-border/40 font-latin">
                      کد: {hist.sms_code}
                    </span>
                  )}
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-control border ${
                      hist.status === 'FINISHED'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-muted text-muted-foreground border-border/40'
                    }`}
                  >
                    {hist.status === 'FINISHED' ? 'تکمیل شده' : 'لغو شده'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Load More History Button */}
          {visibleHistoryCount < historySessions.length && (
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => setVisibleHistoryCount((prev) => prev + 4)}
                className="h-9 px-4 rounded-control border border-border/60 bg-card hover:bg-muted text-foreground font-black text-xs duration-motion ease-motion active:scale-[0.98] shadow-control cursor-pointer inline-flex items-center gap-2"
              >
                <span>بارگذاری تاریخچه بیشتر</span>
                <span className="text-[11px] text-muted-foreground font-latin">
                  (نمایش{' '}
                  {toPersianDigits(
                    Math.min(visibleHistoryCount, historySessions.length),
                  )}{' '}
                  از {toPersianDigits(historySessions.length)})
                </span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
