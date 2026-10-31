import {
  AlertCircle,
  AlertTriangle,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  FileText,
  KeyRound,
  Printer,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  ShoppingBag,
} from 'lucide-react'
import type React from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiService } from '../services/api'
import type { Order } from '../types'
import { formatToman, toPersianDigits } from '../utils/formatters'
import { OfficialInvoiceModal } from './invoice/OfficialInvoiceModal'
import { LoadingState } from './vibefarsi/LoadingState'
import { type StepItem, Stepper } from './vibefarsi/Stepper'

interface OrderTrackingViewProps {
  orders: Order[]
  onUpdateOrder: (updated: Order) => void
  initialOrderNo?: string
}

function resolveDefaultOrderNo(
  orders: Order[],
  initialOrderNo?: string,
): string {
  if (initialOrderNo?.trim()) return initialOrderNo.trim()
  try {
    const saved = localStorage.getItem('anahix_last_tracked_order')
    if (
      saved &&
      orders.some((o) => o.order_no.toLowerCase() === saved.toLowerCase())
    ) {
      return saved
    }
  } catch {}
  if (orders.length > 0) {
    const sorted = [...orders].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
    return sorted[0]?.order_no || orders[0].order_no
  }
  return ''
}

export const OrderTrackingView: React.FC<OrderTrackingViewProps> = ({
  orders,
  onUpdateOrder,
  initialOrderNo,
}) => {
  const [selectedOrderNo, setSelectedOrderNo] = useState<string>(() =>
    resolveDefaultOrderNo(orders, initialOrderNo),
  )
  const [searchQuery, setSearchQuery] = useState<string>(() =>
    resolveDefaultOrderNo(orders, initialOrderNo),
  )
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [copiedCreds, setCopiedCreds] = useState(false)
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false)

  // 2FA live handshake state
  const [otpCode, setOtpCode] = useState('')
  const [otpLoading, setOtpLoading] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [otpError, setOtpError] = useState('')
  const [countdown, setCountdown] = useState(120)

  const [paymentFeedback] = useState<{
    status: 'success' | 'failed' | null
    message: string
  }>(() => {
    try {
      const url = new URL(window.location.href)
      const st = url.searchParams.get('payment_status')
      const msg = url.searchParams.get('msg')
      if (st === 'success') {
        return {
          status: 'success',
          message:
            'پرداخت شما با موفقیت از طریق درگاه شاپرک تایید و سفارش ثبت گردید.',
        }
      }
      if (st === 'failed') {
        return {
          status: 'failed',
          message:
            msg ||
            'پرداخت از طریق درگاه بانکی تکمیل نشد یا توسط کاربر لغو گردید.',
        }
      }
    } catch {}
    return { status: null, message: '' }
  })

  // Sync active order selection & persist URL & localStorage
  const selectAndSyncOrder = (orderNo: string) => {
    const clean = orderNo.trim()
    if (!clean) return
    setSelectedOrderNo(clean)
    setSearchQuery(clean)
    setOtpSent(false)
    setCountdown(120)
    setSearchError('')
    try {
      localStorage.setItem('anahix_last_tracked_order', clean)
      const url = new URL(window.location.href)
      url.searchParams.set('order_no', clean)
      window.history.replaceState({}, '', url.toString())
    } catch {}
  }

  // Sync initialOrderNo if passed or changed
  useEffect(() => {
    const targetNo = resolveDefaultOrderNo(orders, initialOrderNo)
    if (targetNo) {
      setSelectedOrderNo(targetNo)
      setSearchQuery(targetNo)
      try {
        localStorage.setItem('anahix_last_tracked_order', targetNo)
      } catch {}
    }
  }, [initialOrderNo, orders])

  const activeOrder =
    orders.find(
      (o) =>
        o?.order_no &&
        o.order_no.toLowerCase() ===
          (searchQuery || selectedOrderNo).toLowerCase(),
    ) || orders[0]

  // If order is not present in local memory yet (e.g. direct URL navigation), fetch it from API
  useEffect(() => {
    const target = (
      searchQuery ||
      selectedOrderNo ||
      initialOrderNo ||
      ''
    ).trim()
    if (!activeOrder && target) {
      setSearchLoading(true)
      apiService
        .getOrderDetail(target)
        .then((ord) => {
          if (ord) {
            onUpdateOrder(ord)
          }
        })
        .catch(() => {
          setSearchError('سفارشی با این شماره در سامانه آناهیکس یافت نشد.')
        })
        .finally(() => {
          setSearchLoading(false)
        })
    }
  }, [activeOrder, searchQuery, selectedOrderNo, initialOrderNo, onUpdateOrder])

  // Filter active tracking orders to prevent endless clutter of old completed orders
  const activeTrackingOrders = useMemo(() => {
    if (!orders || orders.length === 0) return []
    return orders.filter((o: Order) => {
      if (!o?.order_no) return false
      if (
        activeOrder?.order_no &&
        o.order_no.toLowerCase() === activeOrder.order_no.toLowerCase()
      ) {
        return true
      }
      return (
        o.status !== 'COMPLETED' &&
        o.status !== 'FAILED' &&
        o.status !== 'REFUNDED'
      )
    })
  }, [orders, activeOrder])

  // Group identical items cleanly in the table
  const groupedDeliveredItems = useMemo(() => {
    if (
      !activeOrder?.delivered_items ||
      activeOrder.delivered_items.length === 0
    )
      return []
    const map = new Map<
      string,
      {
        product_title: string
        product_slug?: string
        delivery_type: string
        count: number
        payloads: string[]
        instructions: string
      }
    >()
    for (const it of activeOrder.delivered_items) {
      const key = `${it.product_title}-${it.delivery_type}-${it.instructions || ''}`
      const existing = map.get(key)
      if (existing) {
        existing.count++
        if (it.payload && !existing.payloads.includes(it.payload)) {
          existing.payloads.push(it.payload)
        }
      } else {
        map.set(key, {
          product_title: it.product_title,
          product_slug: it.product_slug,
          delivery_type: it.delivery_type,
          count: 1,
          payloads: it.payload ? [it.payload] : [],
          instructions: it.instructions || '',
        })
      }
    }
    return Array.from(map.values())
  }, [activeOrder?.delivered_items])

  // Live polling for the active order
  const pollActiveOrder = useCallback(async () => {
    if (!activeOrder) return
    if (activeOrder.status === 'COMPLETED' || activeOrder.status === 'FAILED') {
      return
    }

    try {
      const orderIdOrNo = String(activeOrder.id || activeOrder.order_no)
      const freshOrder = await apiService.getOrderDetail(
        orderIdOrNo,
        activeOrder.token,
      )

      if (freshOrder) {
        const merged: Order = {
          ...activeOrder,
          ...freshOrder,
          token: activeOrder.token || freshOrder.token,
          product_title: freshOrder.product_title || activeOrder.product_title,
        }

        if (
          freshOrder.two_factor_status === 'requested' ||
          freshOrder.status === 'WAITING_CUSTOMER_2FA'
        ) {
          if (activeOrder.two_factor_status !== 'requested') {
            setOtpSent(false)
            setCountdown(120)
          }
        }

        onUpdateOrder(merged)
      }
    } catch {
      // Quiet fail during background polling
    }
  }, [activeOrder, onUpdateOrder])

  // Polling interval timer
  useEffect(() => {
    if (!activeOrder) return
    if (activeOrder.status === 'COMPLETED' || activeOrder.status === 'FAILED') {
      return
    }

    const interval = setInterval(() => {
      pollActiveOrder()
    }, 4000)

    return () => clearInterval(interval)
  }, [activeOrder, pollActiveOrder])

  // Countdown timer for 2FA OTP prompt
  useEffect(() => {
    const isWaiting =
      activeOrder?.status === 'WAITING_CUSTOMER_2FA' ||
      activeOrder?.two_factor_status === 'requested'

    if (isWaiting && !otpSent) {
      const timer = setInterval(() => {
        setCountdown((prev) => (prev > 0 ? prev - 1 : 0))
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [activeOrder?.status, activeOrder?.two_factor_status, otpSent])

  const handleManualRefresh = async () => {
    setIsRefreshing(true)
    await pollActiveOrder()
    setTimeout(() => setIsRefreshing(false), 600)
  }

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSearchError('')
    const query = searchQuery.trim()
    if (!query) return

    // Check if in local list
    const foundLocal = orders.find(
      (o) => o.order_no.toLowerCase() === query.toLowerCase(),
    )
    if (foundLocal) {
      selectAndSyncOrder(foundLocal.order_no)
      return
    }

    // Otherwise lookup from backend
    setSearchLoading(true)
    try {
      const order = await apiService.getOrderDetail(query)
      if (order) {
        onUpdateOrder(order)
        selectAndSyncOrder(order.order_no)
      }
    } catch {
      setSearchError('سفارشی با این شماره در سامانه آناهیکس یافت نشد.')
    } finally {
      setSearchLoading(false)
    }
  }

  const handleCopyLink = () => {
    if (activeOrder?.delivered_link) {
      navigator.clipboard.writeText(activeOrder.delivered_link)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2500)
    }
  }

  const handleCopyCreds = () => {
    if (activeOrder?.delivered_credentials) {
      const text = `Email: ${activeOrder.delivered_credentials.email}\nPassword: ${activeOrder.delivered_credentials.password}`
      navigator.clipboard.writeText(text)
      setCopiedCreds(true)
      setTimeout(() => setCopiedCreds(false), 2500)
    }
  }

  const handleSubmitOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setOtpError('')
    if (!otpCode || otpCode.trim().length === 0) {
      setOtpError('لطفا کد تایید یا عبارت ۲FA را وارد نمایید')
      return
    }

    if (!activeOrder) return

    setOtpLoading(true)
    try {
      const orderIdOrNo = String(activeOrder.id || activeOrder.order_no)
      await apiService.submitOrderTwoFactor(
        orderIdOrNo,
        activeOrder.token || '',
        otpCode,
      )

      setOtpSent(true)
      const updated: Order = {
        ...activeOrder,
        two_factor_code: otpCode,
        two_factor_status: 'submitted',
        status: 'PROCESSING',
      }
      onUpdateOrder(updated)
    } catch (err: any) {
      setOtpError(err.message || 'خطا در ارسال کد به اپراتور')
    } finally {
      setOtpLoading(false)
    }
  }

  if (!activeOrder) {
    return (
      <div className="rounded-surface border border-border/80 bg-card p-12 text-center shadow-surface">
        <div className="w-12 h-12 rounded-control bg-secondary text-brand flex items-center justify-center mx-auto mb-3 shadow-control">
          <ShoppingBag className="w-6 h-6" />
        </div>
        <h3 className="text-base font-black text-foreground">
          هنوز سفارشی برای پیگیری ثبت نشده است
        </h3>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
          برای ثبت سفارش جدید و خرید اشتراک‌های پرمیوم هوش مصنوعی، به بخش فروشگاه
          آناهیکس مراجعه فرمایید.
        </p>
      </div>
    )
  }

  const isModeC = activeOrder.delivery_mode === 'UPGRADE_EXISTING'
  const isWaiting2FA =
    activeOrder.status === 'WAITING_CUSTOMER_2FA' ||
    activeOrder.two_factor_status === 'requested'
  const is2FASubmitted =
    activeOrder.two_factor_status === 'submitted' || otpSent
  const isCompleted = activeOrder.status === 'COMPLETED'

  // Construct VibeFarsi 4-Step Stepper items for Mode C Personal Upgrades
  const stepperSteps: StepItem[] = [
    {
      number: 1,
      title: 'ثبت و پرداخت موفق',
      description: 'سفارش در سیستم تایید شد',
      status: 'completed',
    },
    {
      number: 2,
      title: 'تخصیص به اپراتور امن',
      description: 'در صف بررسی اپراتور',
      status:
        activeOrder.status !== 'PENDING_PAYMENT' ? 'completed' : 'current',
    },
    {
      number: 3,
      title: 'تبادل لایو ۲FA',
      description: isWaiting2FA
        ? 'نیازمند ارسال کد تایید'
        : is2FASubmitted || isCompleted
          ? 'کد دریافت شد'
          : 'آماده‌سازی ورود',
      status:
        isCompleted || is2FASubmitted
          ? 'completed'
          : isWaiting2FA
            ? 'current'
            : 'upcoming',
    },
    {
      number: 4,
      title: 'فعال‌سازی و پاکسازی امن',
      description: isCompleted
        ? 'رمزها به طور خودکار پاکسازی شد'
        : 'تحویل نهایی اشتراک',
      status: isCompleted ? 'completed' : 'upcoming',
    },
  ]

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* In-Container Breadcrumb Navigation matching BlogDetailPage & HelpDetailPage */}
      <nav
        aria-label="Breadcrumb"
        className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap"
      >
        <Link to="/" className="hover:text-foreground transition-colors">
          خانه
        </Link>
        <span className="opacity-40">/</span>
        <Link to="/track" className="hover:text-foreground transition-colors">
          پیگیری سفارش
        </Link>
        {activeOrder && (
          <>
            <span className="opacity-40">/</span>
            <span className="text-brand font-bold font-latin">
              {activeOrder.order_no}
            </span>
          </>
        )}
      </nav>

      {/* Search Bar & Order Switcher - Separated & High-Stability Layout */}
      <div className="rounded-surface border border-border/60 bg-card p-4 sm:p-5 shadow-surface space-y-4">
        {/* Top: Permanent, Stable Search Input (Never shrinks!) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <form
            onSubmit={handleSearchSubmit}
            className="flex items-center gap-2 w-full sm:max-w-md shrink-0"
          >
            <div className="relative flex-1">
              <Search className="h-4 w-4 text-muted-foreground absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                dir="ltr"
                placeholder="جستجو با شماره سفارش (مثال: ANX-123456)..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setSearchError('')
                }}
                className="w-full pr-10 pl-3 h-10 text-xs font-latin rounded-field border border-border/60 bg-background text-foreground outline-none focus:border-brand/50 transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={searchLoading}
              className="h-10 px-5 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs duration-motion ease-motion active:scale-[0.98] shadow-control flex items-center justify-center gap-1.5 cursor-pointer shrink-0 disabled:opacity-50"
            >
              {searchLoading ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                'رهگیری'
              )}
            </button>
          </form>

          {orders.length > 0 && (
            <span className="text-xs text-muted-foreground font-latin self-end sm:self-center">
              {toPersianDigits(orders.length)} سفارش در تاریخچه شما
            </span>
          )}
        </div>

        {/* Bottom: Dedicated Fast-Switcher Track for User Orders (Filtered for Active/Pending) */}
        {activeTrackingOrders.length > 1 && (
          <div className="pt-3 border-t border-border/40 space-y-2">
            <div className="text-[11px] font-bold text-muted-foreground flex items-center justify-between">
              <span>سفارش‌های در دست اقدام شما جهت پیگیری:</span>
              <span className="text-[10px] opacity-70 hidden sm:inline">
                برای مشاهده اطلاعات هر سفارش روی آن کلیک کنید
              </span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin scroll-smooth">
              {activeTrackingOrders.map((o: Order) => {
                const isSelected =
                  activeOrder?.order_no &&
                  activeOrder.order_no.toLowerCase() ===
                    o.order_no.toLowerCase()
                return (
                  <button
                    key={o.order_no}
                    type="button"
                    onClick={() => selectAndSyncOrder(o.order_no)}
                    className={`flex items-center gap-2 rounded-control px-3.5 py-2 text-xs font-latin font-bold transition-all border duration-motion ease-motion active:scale-[0.98] cursor-pointer shrink-0 ${
                      isSelected
                        ? 'border-primary bg-primary text-primary-foreground shadow-control font-black ring-1 ring-primary/40'
                        : 'border-border/60 bg-muted/20 text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <span>{o.order_no}</span>
                    {o.status === 'COMPLETED' ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    ) : o.status === 'WAITING_CUSTOMER_2FA' ? (
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping shrink-0" />
                    ) : (
                      <Clock className="h-3.5 w-3.5 text-brand shrink-0" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {searchError && (
          <div className="mt-3 flex items-center gap-2 text-xs text-destructive font-bold bg-destructive/10 p-2.5 rounded-control border border-destructive/20 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{searchError}</span>
          </div>
        )}
      </div>

      {/* Main Order Details Card - Clean, Uncluttered Graphite Card */}
      {!activeOrder ? (
        <div className="rounded-surface border border-border/60 bg-card p-12 text-center shadow-surface space-y-3">
          {searchLoading ? (
            <LoadingState
              message="در حال استعلام وضعیت سفارش از پایگاه داده..."
              subMessage="لطفاً شکیبا باشید"
            />
          ) : (
            <div className="space-y-2 text-muted-foreground">
              <ShoppingBag className="w-10 h-10 mx-auto opacity-40 text-brand" />
              <span className="font-bold text-sm text-foreground block">
                سفارشی انتخاب نشده است
              </span>
              <p className="text-xs">
                شماره سفارش خود را در کادر بالا وارد نموده و دکمه رهگیری را
                بزنید.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-surface border border-border/60 bg-card p-5 sm:p-7 shadow-surface space-y-6">
          {/* Payment Feedback Banner (From Gateway Return) */}
          {paymentFeedback.status === 'success' && (
            <div className="flex items-center gap-2.5 p-3.5 rounded-control bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{paymentFeedback.message}</span>
            </div>
          )}
          {paymentFeedback.status === 'failed' && (
            <div className="flex items-center gap-2.5 p-3.5 rounded-control bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-bold animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{paymentFeedback.message}</span>
            </div>
          )}

          {/* Top Header: Order Number, Status, Price & Invoice Button */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-5 border-b border-border/60 pb-6">
            <div className="space-y-2.5">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black text-foreground flex items-center gap-2">
                  <span>سفارش</span>
                  <span className="font-latin text-brand">
                    {activeOrder.order_no}
                  </span>
                </h2>

                {/* Status Badge */}
                {activeOrder.status === 'COMPLETED' ? (
                  <span className="inline-flex items-center gap-1.5 py-1 px-3 rounded-control bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-black">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>تکمیل و تحویل داده شد</span>
                  </span>
                ) : isWaiting2FA ? (
                  <span className="inline-flex items-center gap-1.5 py-1 px-3 rounded-control bg-amber-500/15 text-amber-500 border border-amber-500/40 text-xs font-black animate-pulse">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <span>نیازمند کد ۲FA کاربر</span>
                  </span>
                ) : activeOrder.status === 'PROCESSING' || is2FASubmitted ? (
                  <span className="inline-flex items-center gap-1.5 py-1 px-3 rounded-control bg-brand/10 text-brand border border-brand/30 text-xs font-black">
                    <Clock className="h-3.5 w-3.5 animate-spin" />
                    <span>در حال تایید و فعال‌سازی اپراتور</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 py-1 px-3 rounded-control bg-muted text-foreground border border-border/60 text-xs font-bold">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>در حال پردازش در صف</span>
                  </span>
                )}
              </div>

              <p className="text-xs text-muted-foreground flex flex-wrap items-center gap-2.5">
                <span>سرویس:</span>
                <strong className="text-foreground">
                  {activeOrder.product_title ||
                    activeOrder.delivered_items?.[0]?.product_title ||
                    'اشتراک دیجیتال'}
                </strong>
                <span className="opacity-40">•</span>
                <span>روش پرداخت:</span>
                <span className="text-foreground font-medium">
                  {activeOrder.payment_platform === 'balance'
                    ? 'کیف پول کاربر'
                    : activeOrder.payment_platform === 'payping'
                      ? 'درگاه شاپرک (پی‌پینگ)'
                      : activeOrder.payment_platform === 'zarinpal'
                        ? 'درگاه شاپرک (زرین‌پال)'
                        : activeOrder.payment_platform}
                </span>
                {activeOrder.customer_phone && (
                  <>
                    <span className="opacity-40">•</span>
                    <span
                      className="font-latin text-muted-foreground"
                      dir="ltr"
                    >
                      {activeOrder.customer_phone}
                    </span>
                  </>
                )}
              </p>
            </div>

            {/* Amount & Actions */}
            <div className="flex flex-col md:items-end gap-2.5">
              <div className="text-right md:text-left font-sans">
                <div className="text-xl sm:text-2xl font-black text-foreground">
                  {formatToman(activeOrder.amount_toman)}{' '}
                  <span className="text-xs font-sans text-muted-foreground font-normal">
                    تومان
                  </span>
                </div>
                <div className="text-[11px] text-muted-foreground font-sans">
                  {new Date(activeOrder.created_at).toLocaleDateString(
                    'fa-IR',
                    {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    },
                  )}
                </div>
              </div>

              {/* Single Clean Actions Group (Duplicate Banner Removed!) */}
              <div className="flex items-center gap-2 pt-1 flex-wrap">
                <button
                  type="button"
                  onClick={() => setIsInvoiceModalOpen(true)}
                  className="h-8 px-3 rounded-control border border-border/80 bg-card hover:bg-muted text-xs font-bold text-foreground duration-motion ease-motion active:scale-[0.98] shadow-control flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-brand" />
                  <span>
                    {activeOrder.status === 'COMPLETED' ||
                    activeOrder.status === 'PAID'
                      ? 'رسید و فاکتور رسمی'
                      : 'پیش‌فاکتور رسمی'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleManualRefresh}
                  disabled={isRefreshing}
                  className="h-8 px-2.5 rounded-control border border-border/60 bg-muted/20 hover:bg-muted text-xs text-muted-foreground hover:text-foreground duration-motion ease-motion active:scale-[0.98] flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title="همگام‌سازی وضعیت زنده"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-brand' : ''}`}
                  />
                  <span className="text-[11px]">همگام‌سازی</span>
                </button>
              </div>
            </div>
          </div>

          {/* MULTI-ITEM PURCHASES & ORDER BREAKDOWN (Responsive Table for Large Baskets) */}
          {activeOrder.delivered_items &&
            activeOrder.delivered_items.length > 0 && (
              <div className="rounded-surface border border-border/60 bg-muted/15 p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-black text-foreground flex items-center gap-2">
                    <FileText className="w-4 h-4 text-brand" />
                    <span>اقلام خریداری‌شده در این سفارش</span>
                  </span>
                  <span className="text-[11px] text-muted-foreground font-latin">
                    {toPersianDigits(activeOrder.delivered_items.length)} قلم
                    کالا
                  </span>
                </div>

                <div className="overflow-x-auto max-h-[380px] scrollbar-thin">
                  <table className="w-full text-right text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border/60 text-muted-foreground text-[11px]">
                        <th className="py-2.5 px-3 font-bold w-12 text-center">
                          #
                        </th>
                        <th className="py-2.5 px-3 font-bold">
                          شرح کالا و سرویس
                        </th>
                        <th className="py-2.5 px-3 font-bold">نوع تحویل</th>
                        <th className="py-2.5 px-3 font-bold text-left">
                          اطلاعات تحویل / لایسنس
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40 text-foreground">
                      {groupedDeliveredItems.map((it: any) => (
                        <tr
                          key={`order-item-${it.product_title}-${it.delivery_type}`}
                          className="hover:bg-muted/30 transition-colors"
                        >
                          <td className="py-3 px-3 text-center text-muted-foreground font-latin">
                            •
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-foreground">
                                {it.product_title}
                              </span>
                              {it.count > 1 && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                                  {toPersianDigits(it.count)} عدد
                                </span>
                              )}
                            </div>
                            {it.instructions && (
                              <span className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                                {it.instructions}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <span className="inline-block px-2 py-0.5 rounded-control text-[10px] font-bold bg-muted text-muted-foreground border border-border/40">
                              {it.delivery_type || 'تحویل دیجیتال'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-left">
                            {it.payloads.length > 0 ? (
                              <div className="space-y-1.5">
                                {it.payloads.map((payloadStr: string) => (
                                  <div
                                    key={`payload-${payloadStr.slice(0, 32)}`}
                                  >
                                    {payloadStr.startsWith('http') ? (
                                      <a
                                        href={payloadStr}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-xs font-bold text-brand hover:underline font-mono"
                                      >
                                        <span>لینک فعال‌سازی</span>
                                        <ExternalLink className="w-3 h-3" />
                                      </a>
                                    ) : (
                                      <div
                                        className="inline-flex items-center gap-1.5 font-mono text-xs bg-muted/60 px-2.5 py-1 rounded-control border border-border/40"
                                        dir="ltr"
                                      >
                                        <span className="truncate max-w-[200px]">
                                          {payloadStr}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            navigator.clipboard.writeText(
                                              payloadStr,
                                            )
                                          }}
                                          className="text-muted-foreground hover:text-foreground cursor-pointer"
                                          title="کپی مشخصات"
                                        >
                                          <Copy className="w-3 h-3" />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-[11px]">
                                در صف تخصیص اپراتور
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          {/* MODE A: SINGLE INSTANT LINK FULFILLMENT */}
          {activeOrder.delivery_mode === 'INSTANT_LINK' &&
            activeOrder.delivered_link &&
            (!activeOrder.delivered_items ||
              activeOrder.delivered_items.length <= 1) && (
              <div className="rounded-surface border border-brand/30 bg-brand/5 p-5 space-y-3.5">
                <div className="flex items-center gap-2 text-brand font-bold text-sm">
                  <CheckCircle2 className="h-5 w-5 text-brand" />
                  <span>لینک فعال‌سازی اختصاصی شما صادر شد (تحویل آنی)</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  این لینک یک‌بارمصرف و قانونی است. با کلیک بر روی آن یا باز کردن
                  در مرورگر، اشتراک بلافاصله روی حساب کاربری شما فعال می‌گردد:
                </p>

                <div className="flex items-center gap-2 rounded-control border border-border/60 bg-background p-2.5">
                  <input
                    type="text"
                    readOnly
                    value={activeOrder.delivered_link}
                    dir="ltr"
                    className="w-full bg-transparent text-xs font-latin text-brand outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="h-8 px-3 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-bold shrink-0 flex items-center gap-1.5 shadow-control cursor-pointer"
                  >
                    {copiedLink ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    <span>{copiedLink ? 'کپی شد' : 'کپی لینک'}</span>
                  </button>
                </div>

                <div>
                  <a
                    href={activeOrder.delivered_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-brand hover:underline"
                  >
                    <span>باز کردن لینک مستقیم در تب جدید</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            )}

          {/* MODE B: READY ACCOUNT CREDENTIALS */}
          {activeOrder.delivery_mode === 'INSTANT_ACCOUNT' &&
            activeOrder.delivered_credentials &&
            (!activeOrder.delivered_items ||
              activeOrder.delivered_items.length <= 1) && (
              <div className="rounded-surface border border-brand/30 bg-brand/5 p-5 space-y-3.5">
                <div className="flex items-center gap-2 text-brand font-bold text-sm">
                  <KeyRound className="h-5 w-5 text-brand" />
                  <span>اطلاعات اکانت اختصاصی تحویل داده شد</span>
                </div>

                <div
                  className="grid grid-cols-1 md:grid-cols-2 gap-3 rounded-control border border-border/60 bg-background p-4 font-latin text-xs text-left"
                  dir="ltr"
                >
                  <div>
                    <span className="text-[11px] text-muted-foreground font-sans block mb-1">
                      ایمیل اکانت:
                    </span>
                    <div className="font-bold text-foreground select-all">
                      {activeOrder.delivered_credentials.email}
                    </div>
                  </div>
                  <div>
                    <span className="text-[11px] text-muted-foreground font-sans block mb-1">
                      رمز عبور:
                    </span>
                    <div className="font-bold text-foreground select-all">
                      {activeOrder.delivered_credentials.password}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCopyCreds}
                  className="h-8 px-4 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-bold flex items-center gap-1.5 shadow-control cursor-pointer"
                >
                  {copiedCreds ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  <span>
                    {copiedCreds ? 'مشخصات کپی شد' : 'کپی اطلاعات ورود'}
                  </span>
                </button>
              </div>
            )}

          {/* MODE C: VibeFarsi 4-Step Stepper & Live 2FA Handshake */}
          {isModeC && (
            <div className="space-y-6 pt-2">
              {/* VibeFarsi Stepper Component */}
              <div className="p-4 sm:p-6 rounded-surface border border-border/60 bg-muted/15 shadow-xs">
                <Stepper steps={stepperSteps} />
              </div>

              {/* LIVE 2FA PROMPT CARD */}
              {isWaiting2FA && (
                <div className="rounded-surface border-2 border-dashed border-amber-500/60 bg-amber-500/10 p-5 sm:p-6 space-y-4 animate-in fade-in-50 duration-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 text-amber-700 dark:text-amber-300">
                      <div className="w-10 h-10 rounded-control bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
                        <AlertTriangle className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black">
                          {activeOrder.two_factor_prompt ||
                            'اپراتور نیازمند کد تایید دو مرحله‌ای (۲FA / OTP) حساب شماست'}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          کد تایید ارسال‌شده به ایمیل یا پیامک حساب خود را وارد
                          کرده و برای اپراتور ارسال نمایید:
                        </p>
                      </div>
                    </div>

                    <div className="rounded-control border border-amber-500/30 bg-amber-500/20 px-3.5 py-1.5 font-latin text-xs font-black text-amber-700 dark:text-amber-300 shrink-0 self-start sm:self-auto">
                      مهلت کد: {Math.floor(countdown / 60)}:
                      {(countdown % 60).toString().padStart(2, '0')}
                    </div>
                  </div>

                  {!otpSent ? (
                    <form
                      onSubmit={handleSubmitOtp}
                      className="flex flex-col sm:flex-row gap-2.5 max-w-md pt-2"
                    >
                      <input
                        type="text"
                        dir="ltr"
                        maxLength={32}
                        placeholder="کد تایید یا عبارت ۲FA"
                        value={otpCode}
                        onChange={(e) => {
                          setOtpCode(e.target.value.trim())
                          setOtpError('')
                        }}
                        className="text-center font-latin text-base tracking-wider font-bold h-11 bg-background rounded-field border border-border/80 text-foreground outline-none focus:border-brand flex-1"
                        required
                      />
                      <button
                        type="submit"
                        disabled={otpLoading}
                        className="h-11 px-5 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-black duration-motion ease-motion active:scale-[0.98] shadow-control flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
                      >
                        {otpLoading ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                        <span>ارسال به اپراتور</span>
                      </button>
                    </form>
                  ) : (
                    <div className="flex items-center gap-2.5 rounded-control border border-emerald-500/30 bg-emerald-500/15 p-4 text-xs text-emerald-700 dark:text-emerald-300 font-bold">
                      <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                      <span>
                        کد تایید با موفقیت در میز اپراتور دریافت شد! در حال
                        فعال‌سازی قانونی اشتراک شما...
                      </span>
                    </div>
                  )}

                  {otpError && (
                    <div className="text-xs text-destructive font-bold flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{otpError}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Zeroize Security Guardrail Badge - Clean Graphite Minimal */}
              <div
                className={`flex items-start gap-3 rounded-surface border p-4 text-xs leading-relaxed transition-colors ${
                  isCompleted
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200'
                    : 'border-border/60 bg-muted/20 text-muted-foreground'
                }`}
              >
                <div
                  className={`p-2 rounded-control shrink-0 mt-0.5 ${
                    isCompleted
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-brand/10 text-brand'
                  }`}
                >
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <div className="font-black text-foreground flex items-center gap-2 flex-wrap">
                    <span>سیاست پاکسازی امن و نابودسازی خودکار (Zeroize)</span>
                    {isCompleted ? (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-control">
                        رمزهای عبور پاکسازی شد
                      </span>
                    ) : (
                      <span className="text-[10px] bg-brand/10 text-brand font-bold px-2 py-0.5 rounded-control">
                        محافظت با AES-256-GCM
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    {isCompleted
                      ? 'سفارش فعال‌سازی شما با موفقیت به اتمام رسید. جهت رعایت کامل حریم خصوصی و امنیت حساب، تمامی رمزهای عبور ارسال‌شده به طور دائمی و برگشت‌ناپذیر از پایگاه داده آناهیکس پاکسازی (Zeroize) شدند.'
                      : 'کلیه اطلاعات حساس و رمزهای عبور اکانت با کلید سخت‌افزاری AES-256-GCM رمزنگاری شده‌اند. پس از تایید اپراتور و تکمیل اشتراک، رمزها به طور خودکار از سرور پاکسازی خواهند شد.'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Official Tax Invoice & Proforma Modal */}
      {activeOrder && (
        <OfficialInvoiceModal
          isOpen={isInvoiceModalOpen}
          onClose={() => setIsInvoiceModalOpen(false)}
          orderIdOrNo={activeOrder.order_no}
          accessToken={activeOrder.token}
        />
      )}
    </div>
  )
}
