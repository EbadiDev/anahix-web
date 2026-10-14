import {
  AlertCircle,
  AlertTriangle,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  KeyRound,
  Lock,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  UserCheck,
} from 'lucide-react'
import type React from 'react'
import { useCallback, useEffect, useState } from 'react'
import { apiService } from '../services/api'
import type { Order } from '../types'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { Input } from './ui/input'

interface OrderTrackingViewProps {
  orders: Order[]
  onUpdateOrder: (updated: Order) => void
  initialOrderNo?: string
}

export const OrderTrackingView: React.FC<OrderTrackingViewProps> = ({
  orders,
  onUpdateOrder,
  initialOrderNo,
}) => {
  const [selectedOrderNo, setSelectedOrderNo] = useState<string>(
    initialOrderNo || orders[0]?.order_no || '',
  )
  const [searchQuery, setSearchQuery] = useState(initialOrderNo || '')
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [copiedCreds, setCopiedCreds] = useState(false)

  // 2FA state
  const [otpCode, setOtpCode] = useState('')
  const [otpLoading, setOtpLoading] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [otpError, setOtpError] = useState('')
  const [countdown, setCountdown] = useState(120)

  // Sync initialOrderNo if passed or changed
  useEffect(() => {
    if (initialOrderNo) {
      setSelectedOrderNo(initialOrderNo)
      setSearchQuery(initialOrderNo)
    }
  }, [initialOrderNo])

  const activeOrder =
    orders.find(
      (o) =>
        o.order_no.toLowerCase() ===
        (searchQuery || selectedOrderNo).toLowerCase(),
    ) || orders[0]

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
        // Merge preserved fields like token and custom titles if any
        const merged: Order = {
          ...activeOrder,
          ...freshOrder,
          token: activeOrder.token || freshOrder.token,
          product_title: freshOrder.product_title || activeOrder.product_title,
        }

        // Detect if 2FA was just requested
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
      setSelectedOrderNo(foundLocal.order_no)
      return
    }

    // Otherwise lookup from backend
    setSearchLoading(true)
    try {
      const order = await apiService.getOrderDetail(query)
      if (order) {
        onUpdateOrder(order)
        setSelectedOrderNo(order.order_no)
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
    if (!otpCode || otpCode.length < 4) {
      setOtpError('لطفا کد تایید معتبر حداقل ۴ رقمی را وارد نمایید')
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
      <Card className="p-12 text-center border-border/80">
        <h3 className="text-base font-bold text-foreground">
          هنوز سفارشی ثبت نشده است
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          برای ثبت اولین سفارش خود به بخش فروشگاه سرویس‌ها مراجعه فرمایید.
        </p>
      </Card>
    )
  }

  const isModeC = activeOrder.delivery_mode === 'UPGRADE_EXISTING'
  const isWaiting2FA =
    activeOrder.status === 'WAITING_CUSTOMER_2FA' ||
    activeOrder.two_factor_status === 'requested'
  const is2FASubmitted =
    activeOrder.two_factor_status === 'submitted' || otpSent
  const isCompleted = activeOrder.status === 'COMPLETED'

  return (
    <div className="space-y-6">
      {/* Search Bar & Order Switcher */}
      <Card className="p-4 border-border/80 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Search Form */}
          <form
            onSubmit={handleSearchSubmit}
            className="flex items-center gap-2 flex-1 min-w-[280px]"
          >
            <div className="relative flex-1 max-w-md">
              <Search className="h-4 w-4 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                type="text"
                dir="ltr"
                placeholder="جستجو با شماره سفارش (مثال: ANX-123456)..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setSearchError('')
                }}
                className="pr-9 h-9 text-xs font-mono"
              />
            </div>
            <Button
              type="submit"
              size="sm"
              disabled={searchLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-9 px-3"
            >
              {searchLoading ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                'رهگیری'
              )}
            </Button>
          </form>

          {/* Local Orders Quick Selectors */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {orders.map((o) => {
              const isSelected =
                activeOrder.order_no.toLowerCase() === o.order_no.toLowerCase()
              return (
                <button
                  key={o.order_no}
                  onClick={() => {
                    setSelectedOrderNo(o.order_no)
                    setSearchQuery(o.order_no)
                    setOtpSent(false)
                    setCountdown(120)
                    setSearchError('')
                  }}
                  className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-mono font-semibold transition-all border shrink-0 ${
                    isSelected
                      ? 'border-blue-600 bg-blue-500/10 text-blue-600 dark:text-blue-400 shadow-xs ring-1 ring-blue-500/20'
                      : 'border-border bg-card text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                  }`}
                >
                  <span>{o.order_no}</span>
                  {o.status === 'COMPLETED' ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  ) : o.status === 'WAITING_CUSTOMER_2FA' ? (
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                  ) : (
                    <Clock className="h-3.5 w-3.5 text-amber-500" />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {searchError && (
          <div className="mt-3 flex items-center gap-2 text-xs text-red-500 font-medium bg-red-500/10 p-2.5 rounded-xl border border-red-500/20">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{searchError}</span>
          </div>
        )}
      </Card>

      {/* Main Order Details Card */}
      <Card className="p-6 border-border/80 shadow-sm space-y-6">
        {/* Top Header & Price */}
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-black text-foreground flex items-center gap-2">
                <span>سفارش</span>
                <span className="font-mono text-blue-600 dark:text-blue-400">
                  {activeOrder.order_no}
                </span>
              </h2>

              {activeOrder.status === 'COMPLETED' ? (
                <Badge variant="emerald" className="gap-1.5 py-1 px-2.5">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  تکمیل و تحویل داده شد
                </Badge>
              ) : isWaiting2FA ? (
                <Badge
                  variant="amber"
                  className="gap-1.5 py-1 px-2.5 animate-pulse"
                >
                  <AlertTriangle className="h-3.5 w-3.5" />
                  نیازمند کد ۲FA کاربر
                </Badge>
              ) : activeOrder.status === 'PROCESSING' || is2FASubmitted ? (
                <Badge variant="blue" className="gap-1.5 py-1 px-2.5">
                  <Clock className="h-3.5 w-3.5 animate-spin" />
                  در حال تایید و فعال‌سازی اپراتور
                </Badge>
              ) : (
                <Badge variant="blue" className="gap-1.5 py-1 px-2.5">
                  <Clock className="h-3.5 w-3.5" />
                  در حال پردازش در صف
                </Badge>
              )}
            </div>

            <p className="text-xs text-muted-foreground flex flex-wrap items-center gap-2">
              <span>سرویس:</span>
              <strong className="text-foreground">
                {activeOrder.product_title}
              </strong>
              <span>•</span>
              <span>درگاه:</span>
              <span className="text-foreground">
                {activeOrder.payment_platform === 'balance'
                  ? 'کیف پول کاربر'
                  : activeOrder.payment_platform}
              </span>
              <span>•</span>
              <span className="font-mono" dir="ltr">
                {activeOrder.customer_phone}
              </span>
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="text-left font-mono" dir="ltr">
              <div className="text-xl font-black text-blue-600 dark:text-blue-400">
                {activeOrder.amount_toman.toLocaleString('fa-IR')}{' '}
                <span className="text-xs font-sans text-muted-foreground">
                  تومان
                </span>
              </div>
              <div className="text-[11px] text-muted-foreground">
                {new Date(activeOrder.created_at).toLocaleDateString('fa-IR', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>

            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 hover:text-blue-600 transition-colors"
            >
              <RefreshCw
                className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`}
              />
              <span>همگام‌سازی لحظه‌ای</span>
            </button>
          </div>
        </div>

        {/* MODE A: INSTANT LINK FULFILLMENT */}
        {activeOrder.delivery_mode === 'INSTANT_LINK' &&
          activeOrder.delivered_link && (
            <div className="rounded-2xl border border-blue-500/25 bg-blue-500/5 p-5 space-y-4">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-bold text-sm">
                <CheckCircle2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <span>لینک فعال‌سازی اختصاصی شما صادر شد (تحویل آنی)</span>
              </div>
              <p className="text-xs text-muted-foreground">
                این لینک یک‌بارمصرف و قانونی است. با کلیک بر روی آن یا باز کردن
                در مرورگر، اشتراک بلافاصله روی جیمیل شما فعال می‌گردد:
              </p>

              <div className="flex items-center gap-2 rounded-xl border border-border bg-background p-2.5">
                <input
                  type="text"
                  readOnly
                  value={activeOrder.delivered_link}
                  dir="ltr"
                  className="w-full bg-transparent text-xs font-mono text-blue-600 dark:text-blue-400 outline-none"
                />
                <Button
                  size="sm"
                  onClick={handleCopyLink}
                  className="bg-blue-600 hover:bg-blue-700 text-white shrink-0 text-xs h-8"
                >
                  {copiedLink ? (
                    <Check className="h-3.5 w-3.5 ml-1" />
                  ) : (
                    <Copy className="h-3.5 w-3.5 ml-1" />
                  )}
                  <span>{copiedLink ? 'کپی شد' : 'کپی لینک'}</span>
                </Button>
              </div>

              <a
                href={activeOrder.delivered_link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
              >
                <span>باز کردن لینک مستقیم در تب جدید</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          )}

        {/* MODE B: READY ACCOUNT CREDENTIALS */}
        {activeOrder.delivery_mode === 'INSTANT_ACCOUNT' &&
          activeOrder.delivered_credentials && (
            <div className="rounded-2xl border border-blue-500/25 bg-blue-500/5 p-5 space-y-4">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-bold text-sm">
                <KeyRound className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <span>اطلاعات اکانت اختصاصی تحویل داده شد</span>
              </div>

              <div
                className="grid grid-cols-1 md:grid-cols-2 gap-3 rounded-xl border border-border bg-background p-4 font-mono text-xs text-left"
                dir="ltr"
              >
                <div>
                  <span className="text-[11px] text-muted-foreground font-sans">
                    ایمیل اکانت:
                  </span>
                  <div className="font-bold text-foreground mt-0.5 select-all">
                    {activeOrder.delivered_credentials.email}
                  </div>
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground font-sans">
                    رمز عبور:
                  </span>
                  <div className="font-bold text-foreground mt-0.5 select-all">
                    {activeOrder.delivered_credentials.password}
                  </div>
                </div>
              </div>

              <Button
                size="sm"
                onClick={handleCopyCreds}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8"
              >
                {copiedCreds ? (
                  <Check className="h-3.5 w-3.5 ml-1" />
                ) : (
                  <Copy className="h-3.5 w-3.5 ml-1" />
                )}
                <span>
                  {copiedCreds ? 'مشخصات کپی شد' : 'کپی اطلاعات ورود'}
                </span>
              </Button>
            </div>
          )}

        {/* MODE C: LIVE 2FA OPERATOR HANDSHAKE */}
        {isModeC && (
          <div className="space-y-6">
            {/* 4-Step Interactive Stepper */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Step 1 */}
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5">
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                  مرحله ۱
                </div>
                <div className="text-xs font-bold text-foreground mt-0.5 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>ثبت و پرداخت موفق</span>
                </div>
              </div>

              {/* Step 2 */}
              <div
                className={`rounded-xl border p-3.5 ${
                  activeOrder.status !== 'PENDING_PAYMENT'
                    ? 'border-emerald-500/30 bg-emerald-500/10'
                    : 'border-border bg-card'
                }`}
              >
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                  مرحله ۲
                </div>
                <div className="text-xs font-bold text-foreground mt-0.5 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-emerald-500" />
                  <span>تخصیص به اپراتور امن</span>
                </div>
              </div>

              {/* Step 3 */}
              <div
                className={`rounded-xl border p-3.5 transition-all ${
                  isWaiting2FA
                    ? 'border-amber-500/50 bg-amber-500/15 shadow-sm ring-1 ring-amber-500/30'
                    : is2FASubmitted || isCompleted
                      ? 'border-emerald-500/30 bg-emerald-500/10'
                      : 'border-blue-500/30 bg-blue-500/10'
                }`}
              >
                <div
                  className={`text-[11px] font-bold ${
                    isWaiting2FA
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-blue-600 dark:text-blue-400'
                  }`}
                >
                  مرحله ۳ (تبادل لایو)
                </div>
                <div className="text-xs font-bold text-foreground mt-0.5 flex items-center gap-1.5">
                  {isWaiting2FA ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                      <span>ورود کد ۲FA توسط شما</span>
                    </>
                  ) : is2FASubmitted || isCompleted ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span>کد ۲FA دریافت شد</span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-4 h-4 text-blue-500" />
                      <span>آماده‌سازی ورود اپراتور</span>
                    </>
                  )}
                </div>
              </div>

              {/* Step 4 */}
              <div
                className={`rounded-xl border p-3.5 ${
                  isCompleted
                    ? 'border-emerald-500/30 bg-emerald-500/10'
                    : 'border-border bg-card text-muted-foreground'
                }`}
              >
                <div className="text-[11px] font-bold">مرحله ۴</div>
                <div className="text-xs font-bold mt-0.5 flex items-center gap-1.5">
                  {isCompleted ? (
                    <>
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      <span className="text-emerald-700 dark:text-emerald-300">
                        فعال‌سازی + پاکسازی رمزها
                      </span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>فعال‌سازی نهایی</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* LIVE 2FA PROMPT CARD */}
            {isWaiting2FA && (
              <div className="rounded-2xl border-2 border-dashed border-amber-500/60 bg-amber-500/10 p-6 space-y-4 animate-in fade-in-50 duration-200">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3 text-amber-800 dark:text-amber-200">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-600 flex items-center justify-center shrink-0">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold">
                        {activeOrder.two_factor_prompt ||
                          'اپراتور نیازمند کد تایید دو مرحله‌ای (۲FA / OTP) حساب شماست'}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        کد تایید ارسال‌شده به ایمیل یا پیامک حساب خود را وارد
                        کرده و برای اپراتور ارسال نمایید:
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/20 px-3.5 py-1.5 font-mono text-xs font-bold text-amber-800 dark:text-amber-300 shrink-0">
                    مهلت کد: {Math.floor(countdown / 60)}:
                    {(countdown % 60).toString().padStart(2, '0')}
                  </div>
                </div>

                {!otpSent ? (
                  <form
                    onSubmit={handleSubmitOtp}
                    className="flex flex-col sm:flex-row gap-2.5 max-w-md pt-2"
                  >
                    <Input
                      type="text"
                      dir="ltr"
                      maxLength={8}
                      placeholder="کد ۶ رقمی"
                      value={otpCode}
                      onChange={(e) => {
                        setOtpCode(e.target.value.replace(/\D/g, ''))
                        setOtpError('')
                      }}
                      className="text-center font-mono text-lg tracking-widest font-bold h-11 bg-background"
                      autoFocus
                      required
                    />
                    <Button
                      type="submit"
                      disabled={otpLoading}
                      className="bg-blue-600 hover:bg-blue-700 text-white shrink-0 text-xs font-bold h-11 px-5 shadow-sm"
                    >
                      {otpLoading ? (
                        <RefreshCw className="h-4 w-4 animate-spin ml-1.5" />
                      ) : (
                        <Send className="h-4 w-4 ml-1.5" />
                      )}
                      <span>ارسال به اپراتور</span>
                    </Button>
                  </form>
                ) : (
                  <div className="flex items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/15 p-4 text-xs text-emerald-800 dark:text-emerald-200 font-medium">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>
                      کد تایید با موفقیت در میز اپراتور دریافت شد! در حال
                      فعال‌سازی قانونی اشتراک شما...
                    </span>
                  </div>
                )}

                {otpError && (
                  <div className="text-xs text-red-500 font-medium flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{otpError}</span>
                  </div>
                )}
              </div>
            )}

            {/* Zeroize Security Guardrail Badge */}
            <div
              className={`flex items-start gap-3 rounded-2xl border p-4 text-xs leading-relaxed transition-colors ${
                isCompleted
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200'
                  : 'border-border bg-card text-muted-foreground'
              }`}
            >
              <div
                className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                  isCompleted
                    ? 'bg-emerald-500/20 text-emerald-600'
                    : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                }`}
              >
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <div className="font-bold text-foreground flex items-center gap-2">
                  <span>سیاست پاکسازی امن و نابودسازی خودکار (Zeroize)</span>
                  {isCompleted ? (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-full">
                      رمزهای عبور پاکسازی شد
                    </span>
                  ) : (
                    <span className="text-[10px] bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold px-2 py-0.5 rounded-full">
                      محافظت با AES-256-GCM
                    </span>
                  )}
                </div>
                <p>
                  {isCompleted
                    ? 'سفارش فعال‌سازی شما با موفقیت به اتمام رسید. جهت رعایت کامل حریم خصوصی و امنیت حساب، تمامی رمزهای عبور ارسال‌شده به طور دائمی و برگشت‌ناپذیر از پایگاه داده آناهیکس پاکسازی (Zeroize) شدند.'
                    : 'کلیه اطلاعات حساس و رمزهای عبور اکانت با کلید معتبر سخت‌افزاری AES-256-GCM رمزنگاری شده‌اند. پس از تایید اپراتور و تکمیل اشتراک، رمزها به طور خودکار از سرور پاکسازی خواهند شد.'}
                </p>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
