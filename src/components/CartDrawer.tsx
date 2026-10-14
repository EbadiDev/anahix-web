import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Coins,
  CreditCard,
  Eye,
  EyeOff,
  KeyRound,
  Landmark,
  Loader2,
  Minus,
  Percent,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Tag,
  Trash2,
  Wallet,
  X,
  Zap,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useState } from 'react'
import { useCart } from '../lib/cartStore'
import { apiService } from '../services/api'
import type { CustomerProfile, PaymentGateway } from '../types'
import { ClaudeIcon, CursorIcon, GeminiIcon, OpenAIIcon } from './BrandIcons'
import { Button } from './ui/button'
import { Input } from './ui/input'

function getProductBrandConfig(category: string, title: string) {
  const t = `${title} ${category}`.toLowerCase()
  if (t.includes('chatgpt') || t.includes('openai')) {
    return {
      icon: <OpenAIIcon className="w-6 h-6 text-emerald-500" />,
      bg: 'bg-emerald-500/10 dark:bg-emerald-500/15 border-emerald-500/20 text-emerald-600 dark:text-emerald-400',
      badge: 'OpenAI',
    }
  }
  if (t.includes('claude') || t.includes('anthropic')) {
    return {
      icon: <ClaudeIcon className="w-6 h-6 text-amber-500" />,
      bg: 'bg-amber-500/10 dark:bg-amber-500/15 border-amber-500/20 text-amber-600 dark:text-amber-400',
      badge: 'Anthropic',
    }
  }
  if (t.includes('gemini') || t.includes('google')) {
    return {
      icon: <GeminiIcon className="w-6 h-6 text-blue-500" />,
      bg: 'bg-blue-500/10 dark:bg-blue-500/15 border-blue-500/20 text-blue-600 dark:text-blue-400',
      badge: 'Google AI',
    }
  }
  if (t.includes('cursor')) {
    return {
      icon: <CursorIcon className="w-6 h-6 text-sky-500" />,
      bg: 'bg-sky-500/10 dark:bg-sky-500/15 border-sky-500/20 text-sky-600 dark:text-sky-400',
      badge: 'Cursor',
    }
  }
  return {
    icon: <Zap className="w-6 h-6 text-blue-600" />,
    bg: 'bg-blue-500/10 dark:bg-blue-500/15 border-blue-500/20 text-blue-600 dark:text-blue-400',
    badge: 'دیجیتال',
  }
}

function getGatewayIcon(iconType: string) {
  switch (iconType) {
    case 'wallet':
      return (
        <Wallet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
      )
    case 'credit-card':
    case 'zarinpal':
      return <CreditCard className="h-4 w-4 text-blue-600 dark:text-blue-400" />
    case 'bank':
      return <Landmark className="h-4 w-4 text-sky-600 dark:text-sky-400" />
    case 'bitcoin':
    case 'crypto':
      return <Coins className="h-4 w-4 text-amber-500" />
    default:
      return <CreditCard className="h-4 w-4 text-blue-600" />
  }
}

interface CartDrawerProps {
  isOpen: boolean
  onClose: () => void
  customer?: CustomerProfile | null
  payments?: PaymentGateway[]
  onSubmit?: (data: {
    items: { product_id: string; quantity: number }[]
    payment_platform: string
    customer_phone: string
    account_email?: string
    account_password?: string
    customer_notes?: string
    coupon_code?: string
  }) => Promise<void>
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  customer,
  payments = [],
  onSubmit,
}) => {
  const {
    items,
    coupon,
    itemCount,
    subtotal,
    discount,
    total,
    updateQuantity,
    removeItem,
    clearCart,
    applyCoupon,
    removeCoupon,
  } = useCart()

  // Coupon state
  const [couponCodeInput, setCouponCodeInput] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponError, setCouponError] = useState<string | null>(null)
  const [quickCouponApplied, setQuickCouponApplied] = useState<string | null>(
    null,
  )

  // Payment method & customer phone state
  const defaultGateway = payments.find((p) => p.is_default) ||
    payments[0] || {
      id: -1,
      name: 'موجودی کیف پول (آنی)',
      platform: 'balance',
      is_default: true,
      icon_type: 'wallet',
      fee_percentage: 0,
      description_fa: 'کسر مستقیم از موجودی حساب',
    }

  const [selectedPlatform, setSelectedPlatform] = useState<string>(
    defaultGateway.platform || 'balance',
  )
  const [phone, setPhone] = useState(customer?.phone || '')
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Design 1: Contextual Per-Item Credentials state (product.id -> { email, password, showPassword })
  const [itemCreds, setItemCreds] = useState<
    Record<string, { email: string; password: string; showPassword?: boolean }>
  >({})

  // Mobile summary sheet toggle
  const [showMobileDetails, setShowMobileDetails] = useState(false)

  // Sync phone when customer prop changes
  useEffect(() => {
    if (customer?.phone && !phone) {
      setPhone(customer.phone)
    }
  }, [customer?.phone, phone])

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleApplyCoupon = async (codeToApply?: string) => {
    const code = (codeToApply || couponCodeInput).trim().toUpperCase()
    if (!code) return

    setCouponLoading(true)
    setCouponError(null)

    try {
      const res = await apiService.validateCoupon({
        code,
        subtotal_toman: subtotal,
        customer_phone: customer?.phone || phone || undefined,
      })

      if (res.valid) {
        applyCoupon(res)
        setCouponCodeInput('')
        setQuickCouponApplied(code)
        setTimeout(() => setQuickCouponApplied(null), 2500)
      } else {
        setCouponError(res.message || 'کد تخفیف معتبر نیست یا منقضی شده است')
      }
    } catch (err: any) {
      setCouponError(err.message || 'خطا در اعتبارسنجی کد تخفیف')
    } finally {
      setCouponLoading(false)
    }
  }

  // Update item credentials
  const updateItemCred = (
    productId: string | number,
    field: 'email' | 'password',
    value: string,
  ) => {
    const key = String(productId)
    setItemCreds((prev) => ({
      ...prev,
      [key]: {
        email: prev[key]?.email || '',
        password: prev[key]?.password || '',
        showPassword: prev[key]?.showPassword || false,
        [field]: value,
      },
    }))
    setSubmitError(null)
  }

  const toggleItemShowPassword = (productId: string | number) => {
    const key = String(productId)
    setItemCreds((prev) => ({
      ...prev,
      [key]: {
        email: prev[key]?.email || '',
        password: prev[key]?.password || '',
        showPassword: !prev[key]?.showPassword,
      },
    }))
  }

  // Multi-product 1-Click Sync: copies first filled credential to all Mode C items
  const modeCItems = items.filter(
    (it) => it.product.delivery_mode === 'UPGRADE_EXISTING',
  )

  const handleSyncFirstCredToAll = () => {
    const firstFilled = modeCItems.find((it) => {
      const c = itemCreds[String(it.product.id)]
      return c?.email?.trim() || c?.password?.trim()
    })

    if (!firstFilled) return
    const source = itemCreds[String(firstFilled.product.id)]
    if (!source) return

    setItemCreds((prev) => {
      const next = { ...prev }
      for (const it of modeCItems) {
        next[String(it.product.id)] = {
          email: source.email,
          password: source.password,
          showPassword: source.showPassword || false,
        }
      }
      return next
    })
  }

  const walletBalance = customer?.balance_toman || 0
  const isBalanceSufficient = walletBalance >= total

  // List of gateways (prop or fallbacks)
  const availableGateways: PaymentGateway[] =
    payments.length > 0
      ? payments
      : [
          {
            id: -1,
            name: 'موجودی کیف پول (آنی)',
            platform: 'balance',
            is_default: true,
            fee_percentage: 0,
            icon_type: 'wallet',
            description_fa: 'کسر مستقیم از کیف پول آناهیکس',
          },
          {
            id: 1,
            name: 'درگاه پرداخت شاپرک',
            platform: 'zarinpal',
            is_default: false,
            fee_percentage: 0,
            icon_type: 'credit-card',
            description_fa: 'کلیه کارت‌های عضو شتاب',
          },
        ]

  // Submit Handler
  const handleFinalSubmit = async () => {
    setSubmitError(null)
    setPhoneError(null)

    const cleanPhone = phone.trim()
    if (!cleanPhone || cleanPhone.length < 11) {
      setPhoneError(
        'لطفاً شماره موبایل معتبر (۱۱ رقمی، مانند 0912...) وارد کنید.',
      )
      return
    }

    // Validate Mode C items
    for (const it of modeCItems) {
      const c = itemCreds[String(it.product.id)]
      if (!c?.email?.trim() || !c?.password?.trim()) {
        setSubmitError(
          `لطفاً اطلاعات اکانت مربوط به «${it.product.title_fa}» را وارد نمایید.`,
        )
        return
      }
    }

    // Balance check
    if (selectedPlatform === 'balance') {
      if (!customer) {
        setSubmitError(
          'جهت پرداخت از کیف پول ابتدا باید وارد حساب کاربری شوید.',
        )
        return
      }
      if (walletBalance < total) {
        setSubmitError(
          `موجودی کیف پول (${walletBalance.toLocaleString('fa-IR')} تومان) کمتر از مبلغ کل است. درگاه شاپرک را انتخاب کنید.`,
        )
        return
      }
    }

    setIsSubmitting(true)
    try {
      const firstModeC = modeCItems[0]
      const firstCred = firstModeC
        ? itemCreds[String(firstModeC.product.id)]
        : undefined

      const notes =
        modeCItems.length > 1
          ? modeCItems
              .map(
                (it) =>
                  `[${it.product.title_fa}]: ${itemCreds[String(it.product.id)]?.email} / ${itemCreds[String(it.product.id)]?.password}`,
              )
              .join(' | ')
          : undefined

      if (onSubmit) {
        await onSubmit({
          items: items.map((it) => ({
            product_id: String(it.product.id),
            quantity: it.quantity,
          })),
          payment_platform: selectedPlatform,
          customer_phone: cleanPhone,
          account_email: firstCred?.email,
          account_password: firstCred?.password,
          customer_notes: notes,
          coupon_code: coupon?.code,
        })
      }
    } catch (err: any) {
      setSubmitError(err.message || 'خطا در ثبت سفارش. لطفاً دوباره تلاش کنید.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const popularCoupons = [
    { code: 'WELCOME10', label: '۱۰٪ هدیه خوش‌آمدگویی' },
    { code: 'ANAHIX50', label: '۵۰ هزار تومان تخفیف' },
    { code: 'TELEGRAM20', label: '۲۰٪ تخفیف تلگرام' },
  ]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center sm:p-4 md:p-6 overflow-hidden"
      dir="rtl"
    >
      {/* Ambient Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity duration-200 animate-in fade-in"
      />

      {/* Main Centered Workbench Modal (max-w-5xl) */}
      <div className="relative w-full h-full sm:h-auto sm:max-h-[88vh] sm:max-w-5xl bg-background dark:bg-[#020817] sm:border sm:border-border/80 sm:rounded-3xl sm:shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 fade-in duration-200 z-10">
        {/* 1. Modal Top Bar */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-border/70 bg-card/60 dark:bg-slate-900/40 backdrop-blur-md flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 shadow-inner shrink-0">
              <ShoppingBag className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] px-1.5 items-center justify-center rounded-full bg-blue-600 text-[11px] font-black text-white shadow-xs animate-pulse">
                  {itemCount}
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-black text-base sm:text-lg text-foreground">
                  سبد خرید شما
                </h3>
                <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 font-bold">
                  {itemCount} محصول دیجیتال
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <button
                type="button"
                onClick={clearCart}
                title="خالی کردن کل سبد"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors border border-transparent hover:border-rose-500/20"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">خالی کردن سبد</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="بستن پنجره"
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors border border-border/50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Global Submit Error Banner */}
        {submitError && (
          <div className="mx-4 sm:mx-6 mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-center gap-2 text-xs text-rose-500 font-medium animate-in fade-in shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        {/* 2. Modal Body */}
        {items.length === 0 ? (
          <div className="flex-1 py-20 flex flex-col items-center justify-center text-center p-6 space-y-5 overflow-y-auto">
            <div className="relative">
              <div className="w-24 h-24 rounded-3xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-inner">
                <ShoppingBag className="w-12 h-12 stroke-[1.5]" />
              </div>
              <div className="absolute -bottom-1.5 -right-1.5 w-8 h-8 rounded-2xl bg-card border border-border flex items-center justify-center text-amber-500 shadow-md">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>

            <div className="space-y-2 max-w-sm">
              <h4 className="font-black text-base sm:text-lg text-foreground">
                سبد خرید شما در حال حاضر خالی است
              </h4>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                می‌توانید از کاتالوگ فروشگاه اشتراک‌های هوش مصنوعی را به سبد خرید
                اضافه کرده و سفارش خود را تکمیل کنید.
              </p>
            </div>

            <Button
              onClick={onClose}
              className="h-11 px-7 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs sm:text-sm shadow-lg shadow-blue-600/25 transition-all active:scale-95 flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>مشاهده و انتخاب اشتراک‌ها</span>
            </Button>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden flex flex-col lg:flex-row relative">
            {/* Items Column (Desktop: 60% width, Mobile: Full scroll area with bottom padding) */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-28 lg:pb-6 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-border/60">
                <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                  <span>اقلام سفارش</span>
                  <span className="text-[10px] text-muted-foreground">
                    ({itemCount} مورد)
                  </span>
                </div>
                <span className="text-[11px] text-muted-foreground hidden sm:inline">
                  ویرایش تعداد و مشخصات اکانت
                </span>
              </div>

              {/* Design 1: Multi-Product 1-Click Sync Banner */}
              {modeCItems.length >= 2 && (
                <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-between gap-3 text-xs animate-in fade-in">
                  <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-bold min-w-0">
                    <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="truncate">
                      {modeCItems.length} سرویس نیازمند مشخصات اکانت شخصی
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleSyncFirstCredToAll}
                    className="px-3 py-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold transition shadow-xs shrink-0 flex items-center gap-1 active:scale-95"
                    title="کپی ایمیل و پسورد اکانت اول روی بقیه سرویس‌ها"
                  >
                    <span>کپی اطلاعات اکانت اول روی همه</span>
                  </button>
                </div>
              )}

              {/* Products List */}
              <div className="space-y-3">
                {items.map(({ product, quantity }) => {
                  const brand = getProductBrandConfig(
                    product.category,
                    product.title_fa,
                  )
                  const lineTotal = product.price_toman * quantity
                  const isModeC = product.delivery_mode === 'UPGRADE_EXISTING'
                  const cred = itemCreds[String(product.id)] || {
                    email: '',
                    password: '',
                    showPassword: false,
                  }
                  const isCredFilled = Boolean(
                    cred.email?.trim() && cred.password?.trim(),
                  )

                  return (
                    <div
                      key={product.id}
                      className="group relative rounded-2xl border border-border/80 bg-card/70 hover:bg-card hover:border-blue-500/40 p-3.5 sm:p-4 shadow-xs transition-all space-y-3"
                    >
                      {/* Product Header & Info */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 sm:gap-3.5 min-w-0">
                          <div
                            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl border flex items-center justify-center shrink-0 shadow-xs transition-transform group-hover:scale-105 ${brand.bg}`}
                          >
                            {brand.icon}
                          </div>

                          <div className="min-w-0 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-bold text-xs sm:text-sm text-foreground truncate max-w-[180px] sm:max-w-[320px]">
                                {product.title_fa}
                              </h4>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-semibold">
                                {brand.badge}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap text-xs">
                              {isModeC ? (
                                <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium text-[10px] sm:text-[11px] bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">
                                  <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                  <span>ارتقا روی اکانت شخصی</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium text-[10px] sm:text-[11px] bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                                  <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                  <span>تحویل آنی</span>
                                </span>
                              )}

                              <span className="text-muted-foreground text-[10px] sm:text-[11px] flex items-center gap-1">
                                <span>واحد:</span>
                                <span className="font-mono font-bold text-foreground">
                                  {product.price_toman.toLocaleString('fa-IR')}
                                </span>
                                <span>تومان</span>
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Remove Action */}
                        <button
                          type="button"
                          onClick={() => removeItem(product.id)}
                          className="p-1.5 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors shrink-0"
                          title="حذف این مورد از سبد"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Design 1: Contextual Per-Item Credential Expander for Mode C */}
                      {isModeC && (
                        <div
                          className={`rounded-xl border p-3 space-y-2.5 transition-all ${
                            isCredFilled
                              ? 'bg-emerald-500/5 border-emerald-500/25 dark:bg-emerald-950/20'
                              : 'bg-blue-500/5 border-blue-500/20 dark:bg-blue-950/20'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                              <KeyRound className="w-3.5 h-3.5 text-blue-600" />
                              <span>مشخصات اکانت {brand.badge} جهت ارتقا:</span>
                            </div>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                                isCredFilled
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25'
                                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                              }`}
                            >
                              {isCredFilled
                                ? 'مشخصات ثبت شد ✓'
                                : 'نیازمند ایمیل و پسورد'}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                              <label className="text-[11px] text-muted-foreground block mb-1">
                                ایمیل اکانت {brand.badge}:
                              </label>
                              <Input
                                type="email"
                                dir="ltr"
                                value={cred.email}
                                onChange={(e) =>
                                  updateItemCred(
                                    product.id,
                                    'email',
                                    e.target.value,
                                  )
                                }
                                placeholder="name@example.com"
                                className="h-8 text-xs font-mono rounded-lg bg-background border-border"
                              />
                            </div>
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <label className="text-[11px] text-muted-foreground">
                                  کلمه عبور اکانت:
                                </label>
                                <button
                                  type="button"
                                  onClick={() =>
                                    toggleItemShowPassword(product.id)
                                  }
                                  className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1"
                                >
                                  {cred.showPassword ? (
                                    <>
                                      <EyeOff className="w-3 h-3" />
                                      <span>مخفی</span>
                                    </>
                                  ) : (
                                    <>
                                      <Eye className="w-3 h-3" />
                                      <span>نمایش</span>
                                    </>
                                  )}
                                </button>
                              </div>
                              <Input
                                type={cred.showPassword ? 'text' : 'password'}
                                dir="ltr"
                                value={cred.password}
                                onChange={(e) =>
                                  updateItemCred(
                                    product.id,
                                    'password',
                                    e.target.value,
                                  )
                                }
                                placeholder="••••••••"
                                className="h-8 text-xs font-mono rounded-lg bg-background border-border"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Quantity Stepper & Subtotal Row */}
                      <div className="flex items-center justify-between pt-2 border-t border-border/50">
                        {/* Stepper with tactile touch */}
                        <div className="flex items-center border border-border bg-muted/40 rounded-xl p-0.5 sm:p-1 shadow-xs">
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(product.id, quantity - 1)
                            }
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-card hover:text-foreground transition active:scale-90"
                            aria-label="کاهش تعداد"
                          >
                            {quantity === 1 ? (
                              <Trash2 className="w-4 h-4 text-rose-500" />
                            ) : (
                              <Minus className="w-4 h-4" />
                            )}
                          </button>

                          <span className="w-8 sm:w-9 text-center font-black text-xs sm:text-sm text-foreground font-mono">
                            {quantity}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(product.id, quantity + 1)
                            }
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-card hover:text-foreground transition active:scale-90"
                            aria-label="افزایش تعداد"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Calculated Line Total */}
                        <div className="text-left">
                          <div className="flex items-baseline justify-end gap-1.5">
                            <span className="font-black text-sm sm:text-base text-foreground font-mono">
                              {lineTotal.toLocaleString('fa-IR')}
                            </span>
                            <span className="text-xs text-muted-foreground font-sans">
                              تومان
                            </span>
                          </div>
                          {quantity > 1 && (
                            <div className="text-[10px] sm:text-[11px] text-muted-foreground font-mono">
                              {quantity} ×{' '}
                              {product.price_toman.toLocaleString('fa-IR')}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Desktop Financial & Payment Column (Hidden on Mobile, Visible lg:flex) */}
            <div className="hidden lg:flex w-[410px] shrink-0 border-r border-border/80 bg-card/50 dark:bg-slate-900/30 p-5 sm:p-6 flex-col justify-between overflow-y-auto space-y-4">
              <div className="space-y-4">
                {/* 1. Customer Phone Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground block">
                    شماره موبایل جهت دریافت فاکتور و پیگیری:
                  </label>
                  <Input
                    type="tel"
                    dir="ltr"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value)
                      setPhoneError(null)
                    }}
                    placeholder="09xxxxxxxxx"
                    className="h-10 text-xs font-mono rounded-xl bg-background border-border focus:ring-1 focus:ring-blue-500"
                  />
                  {phoneError && (
                    <p className="text-[11px] text-rose-500 font-medium">
                      {phoneError}
                    </p>
                  )}
                </div>

                {/* 2. Embedded Payment Method Selector (انتخاب روش پرداخت:) */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-foreground block">
                    انتخاب روش پرداخت:
                  </label>
                  <div className="space-y-1.5">
                    {availableGateways.map((p) => {
                      const isSelected = selectedPlatform === p.platform
                      return (
                        <div
                          key={p.id}
                          onClick={() => setSelectedPlatform(p.platform)}
                          className={`flex items-center justify-between rounded-xl border p-2.5 cursor-pointer transition-all ${
                            isSelected
                              ? 'border-blue-600 bg-blue-500/10 ring-1 ring-blue-600 shadow-xs'
                              : 'border-border/80 bg-background/80 hover:bg-muted/50'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-background border border-border/80 text-foreground shrink-0">
                              {getGatewayIcon(p.icon_type)}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-foreground">
                                  {p.name}
                                </span>
                                {p.platform === 'balance' && (
                                  <span
                                    className={`text-[9px] px-1.5 py-0.2 rounded-md font-bold border ${
                                      isBalanceSufficient
                                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                                    }`}
                                  >
                                    {isBalanceSufficient
                                      ? 'موجودی کافی ✓'
                                      : 'موجودی ناکافی'}
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-muted-foreground mt-0.5">
                                {p.platform === 'balance'
                                  ? `موجودی: ${walletBalance.toLocaleString('fa-IR')} تومان`
                                  : p.description_fa ||
                                    'پرداخت با کلیه کارت‌های شتاب'}
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* 3. Coupon Section */}
                <div className="space-y-2 pt-1 border-t border-border/60">
                  <div className="flex items-center justify-between text-xs font-bold text-foreground">
                    <span className="flex items-center gap-1.5">
                      <Tag className="w-4 h-4 text-blue-600" />
                      <span>کد تخفیف و پروموشن</span>
                    </span>
                    {coupon?.valid && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                        تخفیف فعال ✓
                      </span>
                    )}
                  </div>

                  {coupon?.valid ? (
                    <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between text-xs animate-in zoom-in-95">
                      <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>
                          {coupon.code} ({discount.toLocaleString('fa-IR')}{' '}
                          تومان تخفیف)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={removeCoupon}
                        className="text-xs text-muted-foreground hover:text-rose-500 transition-colors px-2 py-1 rounded-lg hover:bg-rose-500/10"
                      >
                        حذف
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <form
                        onSubmit={(e) => {
                          e.preventDefault()
                          handleApplyCoupon()
                        }}
                        className="flex gap-2"
                      >
                        <Input
                          value={couponCodeInput}
                          onChange={(e) => setCouponCodeInput(e.target.value)}
                          placeholder="کد تخفیف (مثال: WELCOME10)"
                          className="h-9 text-xs uppercase font-mono rounded-xl bg-background border-border focus:ring-1 focus:ring-blue-500 flex-1"
                        />
                        <Button
                          type="submit"
                          disabled={couponLoading || !couponCodeInput.trim()}
                          className="h-9 px-3 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shrink-0 transition shadow-sm"
                        >
                          {couponLoading ? '...' : 'اعمال'}
                        </Button>
                      </form>

                      {couponError && (
                        <div className="flex items-center gap-1.5 text-xs text-rose-500 font-medium">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>{couponError}</span>
                        </div>
                      )}

                      {/* Quick Chips with Persian labels */}
                      <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                        {popularCoupons.map((p) => {
                          const isThisApplied =
                            coupon?.code === p.code ||
                            quickCouponApplied === p.code
                          return (
                            <button
                              key={p.code}
                              type="button"
                              onClick={() => handleApplyCoupon(p.code)}
                              className={`text-[10px] font-mono px-2 py-0.5 rounded-lg border transition-all ${
                                isThisApplied
                                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold'
                                  : 'border-border/80 bg-background/80 hover:bg-blue-500/10 hover:border-blue-500/30 hover:text-blue-600 dark:hover:text-blue-400'
                              }`}
                            >
                              {isThisApplied ? `✓ ${p.code}` : p.code}{' '}
                              <span className="text-[9px] text-muted-foreground font-sans">
                                ({p.label})
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. Price Ledger Breakdown */}
                <div className="rounded-2xl border border-border/80 bg-background/90 p-3.5 space-y-2.5 text-xs shadow-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span>ارزش کل اقلام:</span>
                    <span className="font-mono font-bold text-foreground text-sm">
                      {subtotal.toLocaleString('fa-IR')} تومان
                    </span>
                  </div>

                  {discount > 0 && (
                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                      <span className="flex items-center gap-1">
                        <Percent className="w-3.5 h-3.5" />
                        تخفیف پروموشن:
                      </span>
                      <span className="font-mono text-sm">
                        -{discount.toLocaleString('fa-IR')} تومان
                      </span>
                    </div>
                  )}

                  <div className="pt-2.5 border-t border-border/80 flex justify-between items-baseline">
                    <span className="font-black text-sm text-foreground">
                      مبلغ قابل پرداخت:
                    </span>
                    <div className="flex items-baseline gap-1 text-xl font-black text-blue-600 dark:text-blue-400 font-mono">
                      <span>{total.toLocaleString('fa-IR')}</span>
                      <span className="text-xs font-normal text-muted-foreground font-sans">
                        تومان
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 5. Checkout CTA Button */}
              <div className="space-y-2 pt-2">
                <Button
                  onClick={handleFinalSubmit}
                  disabled={isSubmitting}
                  className="w-full h-12 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white font-black text-sm shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.98] disabled:opacity-70"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>در حال ثبت سفارش...</span>
                    </>
                  ) : (
                    <>
                      <span>ثبت نهایی سفارش و پرداخت</span>
                      <ArrowLeft className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Mobile Expanded Details Drawer (Slides up over items when toggled on Mobile) */}
            {showMobileDetails && (
              <div className="lg:hidden absolute inset-x-0 bottom-24 max-h-[75vh] overflow-y-auto bg-background/98 dark:bg-[#020817]/98 border-t border-border shadow-2xl p-4 space-y-4 z-20 animate-in slide-in-from-bottom duration-200">
                <div className="flex items-center justify-between pb-2 border-b border-border/60">
                  <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-blue-600" />
                    <span>روش پرداخت و کد تخفیف</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowMobileDetails(false)}
                    className="p-1 rounded-lg hover:bg-muted text-muted-foreground"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Mobile Customer Phone */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground block">
                    شماره موبایل جهت پیگیری:
                  </label>
                  <Input
                    type="tel"
                    dir="ltr"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value)
                      setPhoneError(null)
                    }}
                    placeholder="09xxxxxxxxx"
                    className="h-9 text-xs font-mono rounded-xl bg-background border-border"
                  />
                  {phoneError && (
                    <p className="text-[11px] text-rose-500 font-medium">
                      {phoneError}
                    </p>
                  )}
                </div>

                {/* Mobile Payment Methods */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground block">
                    انتخاب روش پرداخت:
                  </label>
                  <div className="space-y-1.5">
                    {availableGateways.map((p) => {
                      const isSelected = selectedPlatform === p.platform
                      return (
                        <div
                          key={p.id}
                          onClick={() => setSelectedPlatform(p.platform)}
                          className={`flex items-center justify-between rounded-xl border p-2.5 cursor-pointer transition-all ${
                            isSelected
                              ? 'border-blue-600 bg-blue-500/10 ring-1 ring-blue-600 shadow-xs'
                              : 'border-border/80 bg-background/80'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-background border border-border/80 shrink-0">
                              {getGatewayIcon(p.icon_type)}
                            </div>
                            <span className="text-xs font-bold text-foreground">
                              {p.name}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Mobile Coupon Section */}
                <div className="space-y-2 pt-2 border-t border-border/60">
                  {coupon?.valid ? (
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>
                          {coupon.code} ({discount.toLocaleString('fa-IR')} ت
                          تخفیف)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={removeCoupon}
                        className="text-xs text-muted-foreground hover:text-rose-500 transition-colors px-1.5 py-0.5 rounded-md hover:bg-rose-500/10"
                      >
                        حذف
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <form
                        onSubmit={(e) => {
                          e.preventDefault()
                          handleApplyCoupon()
                        }}
                        className="flex gap-2"
                      >
                        <Input
                          value={couponCodeInput}
                          onChange={(e) => setCouponCodeInput(e.target.value)}
                          placeholder="کد تخفیف (مثال: WELCOME10)"
                          className="h-9 text-xs uppercase font-mono rounded-xl bg-background border-border flex-1"
                        />
                        <Button
                          type="submit"
                          disabled={couponLoading || !couponCodeInput.trim()}
                          className="h-9 px-3.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shrink-0"
                        >
                          {couponLoading ? '...' : 'اعمال'}
                        </Button>
                      </form>
                    </div>
                  )}
                </div>

                {/* Mobile Price Ledger */}
                <div className="rounded-xl border border-border/80 bg-muted/30 p-3 space-y-2 text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span>مجموع قیمت اقلام:</span>
                    <span className="font-mono font-bold text-foreground">
                      {subtotal.toLocaleString('fa-IR')} تومان
                    </span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                      <span>تخفیف پروموشن:</span>
                      <span className="font-mono">
                        -{discount.toLocaleString('fa-IR')} تومان
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Mobile Fixed Sticky Bottom Action Dock (< lg only) */}
            <div className="lg:hidden absolute inset-x-0 bottom-0 border-t border-border bg-background/95 dark:bg-[#020817]/95 backdrop-blur-md p-3.5 flex items-center justify-between gap-3 shadow-xl z-30">
              <div
                onClick={() => setShowMobileDetails(!showMobileDetails)}
                className="cursor-pointer space-y-0.5 select-none"
              >
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <span>مبلغ کل</span>
                  {showMobileDetails ? (
                    <ChevronDown className="w-3.5 h-3.5 text-blue-600" />
                  ) : (
                    <ChevronUp className="w-3.5 h-3.5 text-blue-600" />
                  )}
                  {discount > 0 && (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                      (تخفیف دارد)
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-1 font-black text-base text-foreground font-mono">
                  <span>{total.toLocaleString('fa-IR')}</span>
                  <span className="text-[10px] font-normal text-muted-foreground font-sans">
                    تومان
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={handleFinalSubmit}
                  disabled={isSubmitting}
                  className="h-11 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs shadow-md shadow-blue-600/25 flex items-center gap-1.5 active:scale-95 disabled:opacity-70"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>ثبت سفارش...</span>
                    </>
                  ) : (
                    <>
                      <span>ثبت و پرداخت</span>
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
