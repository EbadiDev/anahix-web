import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Coins,
  CreditCard,
  Eye,
  EyeOff,
  KeyRound,
  Landmark,
  Loader2,
  LogIn,
  Minus,
  Percent,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Tag,
  Trash2,
  Wallet,
  X,
  Zap,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useCart } from '../lib/cartStore'
import { apiService } from '../services/api'
import type { CustomerProfile, PaymentGateway } from '../types'
import { formatToman, toPersianDigits } from '../utils/formatters'
import { AuthModal } from './AuthModal'
import { ClaudeIcon, CursorIcon, GeminiIcon, OpenAIIcon } from './BrandIcons'
import { WalletTopupModal } from './profile/WalletTopupModal'
import { ModalCloseButton } from './vibefarsi/ModalCloseButton'

function getProductBrandConfig(category: string, title: string) {
  const t = `${title} ${category}`.toLowerCase()
  if (category === 'virtual_number' || t.includes('شماره مجازی')) {
    return {
      icon: <Smartphone className="w-6 h-6 text-brand" />,
      bg: 'bg-brand/10 dark:bg-brand/15 border-brand/20 text-brand',
      badge: 'شماره مجازی',
    }
  }
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

function getGatewayIcon(
  iconType?: string,
  platform?: string,
  iconUrl?: string,
) {
  if (iconUrl) {
    return (
      <img src={iconUrl} alt="" className="h-4 w-4 object-contain rounded-xs" />
    )
  }
  const t = `${iconType || ''} ${platform || ''}`.toLowerCase()
  if (t.includes('wallet') || t.includes('balance')) {
    return <Wallet className="h-4 w-4 text-emerald-500" />
  }
  if (
    t.includes('zarinpal') ||
    t.includes('credit') ||
    t.includes('card') ||
    t.includes('shaparak') ||
    t.includes('saman') ||
    t.includes('parsian')
  ) {
    return <CreditCard className="h-4 w-4 text-brand" />
  }
  if (
    t.includes('bank') ||
    t.includes('landmark') ||
    t.includes('melli') ||
    t.includes('mellat') ||
    t.includes('sepah')
  ) {
    return <Landmark className="h-4 w-4 text-sky-500" />
  }
  if (
    t.includes('bitcoin') ||
    t.includes('crypto') ||
    t.includes('usdt') ||
    t.includes('trx')
  ) {
    return <Coins className="h-4 w-4 text-amber-500" />
  }
  return <CreditCard className="h-4 w-4 text-brand" />
}

interface CartDrawerProps {
  isOpen: boolean
  onClose: () => void
  customer?: CustomerProfile | null
  payments?: PaymentGateway[]
  onSubmit?: (data: {
    items: { product_id: string; plan_id?: string; quantity: number }[]
    payment_platform: string
    customer_phone: string
    customer_email?: string
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
  const [phone, setPhone] = useState(() => {
    if (customer?.phone && !/^098[0-9a-f]{8}$/i.test(customer.phone)) {
      return customer.phone
    }
    return ''
  })
  const [emailAddress, setEmailAddress] = useState(() => customer?.email || '')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const triggerError = (msg: string) => {
    setSubmitError(msg)
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current)
    errorTimerRef.current = setTimeout(() => {
      setSubmitError(null)
    }, 6000)
  }

  useEffect(() => {
    return () => {
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current)
    }
  }, [])

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [isTopupModalOpen, setIsTopupModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [internalCustomer, setInternalCustomer] =
    useState<CustomerProfile | null>(customer || null)
  const [dbPayments, setDbPayments] = useState<PaymentGateway[]>([])
  const [promotionalCoupons, setPromotionalCoupons] = useState<
    Array<{ code: string; label: string }>
  >([])

  // Auto-resolve customer profile, gateways, and public coupons from apiService
  useEffect(() => {
    if (customer) {
      setInternalCustomer(customer)
      if (customer.email && !emailAddress) setEmailAddress(customer.email)
      if (
        customer.phone &&
        !phone &&
        !/^098[0-9a-f]{8}$/i.test(customer.phone)
      ) {
        setPhone(customer.phone)
      }
    } else if (apiService.isCustomerLoggedIn()) {
      apiService.getCustomerProfile().then((p) => {
        if (p) {
          setInternalCustomer(p)
          if (p.email && !emailAddress) setEmailAddress(p.email)
          if (p.phone && !phone && !/^098[0-9a-f]{8}$/i.test(p.phone)) {
            setPhone(p.phone)
          }
        }
      })
    }

    if (isOpen) {
      // 1. Fetch live payment gateways from DB / Admin
      apiService.getPayments().then((list) => {
        if (list && Array.isArray(list)) {
          setDbPayments(list)
        }
      })
      // 2. Fetch live promotional coupons strictly from verified DB/API
      apiService.getPublicCoupons().then((list) => {
        const validList = Array.isArray(list) ? list : []
        setPromotionalCoupons(validList)

        // Real-time verification of currently applied coupon
        if (coupon?.code) {
          apiService
            .validateCoupon({
              code: coupon.code,
              subtotal_toman: subtotal,
              customer_phone: customer?.phone || phone || undefined,
            })
            .then((res) => {
              if (!res.valid) {
                removeCoupon()
              } else {
                applyCoupon(res)
              }
            })
            .catch(() => {
              removeCoupon()
            })
        }
      })
    }
  }, [customer, isOpen])

  // Listen to live coupon changes (deletion, toggle) from Admin Panel or Calendar
  useEffect(() => {
    const handleCouponChanged = (e: any) => {
      apiService.getPublicCoupons().then((list) => {
        setPromotionalCoupons(Array.isArray(list) ? list : [])
      })
      const changedCode = e?.detail?.code
      if (coupon?.code) {
        if (
          changedCode &&
          coupon.code.toUpperCase() === changedCode.toUpperCase() &&
          e?.detail?.action === 'deleted'
        ) {
          removeCoupon()
          setCouponError('کد تخفیف اعمال‌شده حذف شد')
          setTimeout(() => setCouponError(null), 4000)
        } else {
          apiService
            .validateCoupon({
              code: coupon.code,
              subtotal_toman: subtotal,
              customer_phone: customer?.phone || phone || undefined,
            })
            .then((res) => {
              if (!res.valid) {
                removeCoupon()
              }
            })
            .catch(() => {
              removeCoupon()
            })
        }
      }
    }

    window.addEventListener('anahix:coupon:changed', handleCouponChanged)
    return () =>
      window.removeEventListener('anahix:coupon:changed', handleCouponChanged)
  }, [coupon, customer, phone, removeCoupon, subtotal])

  const activeCustomer = customer || internalCustomer
  const isUserLoggedIn =
    apiService.isCustomerLoggedIn() || Boolean(activeCustomer)

  const savedAccountPhone = useMemo(() => {
    const raw = activeCustomer?.phone || customer?.phone || ''
    if (raw && !/^098[0-9a-f]{8}$/i.test(raw)) {
      return raw
    }
    return ''
  }, [activeCustomer?.phone, customer?.phone])

  const savedAccountEmail = activeCustomer?.email || customer?.email || ''

  useEffect(() => {
    if (savedAccountPhone && !phone) {
      setPhone(savedAccountPhone)
    }
  }, [savedAccountPhone, phone])

  useEffect(() => {
    if (savedAccountEmail && !emailAddress) {
      setEmailAddress(savedAccountEmail)
    }
  }, [savedAccountEmail, emailAddress])

  // Design 1: Contextual Per-Item Credentials state (product.id -> { email, password, showPassword })
  const [itemCreds, setItemCreds] = useState<
    Record<string, { email: string; password: string; showPassword?: boolean }>
  >({})

  // Mobile navigation step: 'items' | 'checkout'
  const [mobileStep, setMobileStep] = useState<'items' | 'checkout'>('items')

  // Stock check helper
  const isProductOutOfStock = (prod: Product) => {
    return (
      prod.stock_mode === 'out_of_stock' ||
      prod.is_out_of_stock ||
      (prod.stock_mode !== 'always_in_stock' &&
        prod.available_stock !== undefined &&
        prod.available_stock <= 0)
    )
  }

  const hasOutOfStockItems = items.some(({ product }) =>
    isProductOutOfStock(product),
  )

  // Reset to items view when drawer closes
  useEffect(() => {
    if (!isOpen) {
      setMobileStep('items')
    }
  }, [isOpen])

  // Sync phone when customer prop changes (ignore synthetic hex phones)
  useEffect(() => {
    if (
      customer?.phone &&
      !phone &&
      !/^098[0-9a-f]{8}$/i.test(customer.phone)
    ) {
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
        setTimeout(() => setCouponError(null), 4000)
      }
    } catch (err: any) {
      setCouponError(err.message || 'خطا در اعتبارسنجی کد تخفیف')
      setTimeout(() => setCouponError(null), 4000)
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

  const firstFilledModeC = modeCItems.find((it) => {
    const c = itemCreds[String(it.product.id)]
    return c?.email?.trim() && c?.password?.trim()
  })
  const isFirstCredFilled = Boolean(firstFilledModeC)

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

  const walletBalance = activeCustomer?.balance_toman || 0
  const isBalanceSufficient = walletBalance >= total

  // Gateways resolved from DB / Admin with CardToCard strictly disabled
  const availableGateways = useMemo(() => {
    const sourceList =
      payments.length > 0 ? payments : dbPayments.length > 0 ? dbPayments : []

    const filtered = sourceList.filter((p) => {
      // Must not be card_to_card per admin instructions
      if (p.platform === 'card_to_card') return false
      // If hidden, do not display
      if (p.display_mode === 'hidden') return false
      // If enable flag is false and not disabled_visible, do not display
      if (p.enable === false && p.display_mode !== 'disabled_visible')
        return false
      return true
    })

    if (filtered.length > 0) return filtered

    return [
      {
        id: -1,
        name: 'کیف پول / موجودی حساب',
        name_fa: 'کیف پول / موجودی حساب',
        platform: 'balance',
        is_default: true,
        fee_percentage: 0,
        icon_type: 'wallet',
        description_fa: 'پرداخت مستقیم و آنی از طریق شارژ کیف پول حساب کاربری',
      },
      {
        id: 1,
        name: 'درگاه پرداخت زرین‌پال (کارت‌های شتاب)',
        name_fa: 'درگاه پرداخت زرین‌پال (کارت‌های شتاب)',
        platform: 'zarinpal',
        is_default: false,
        fee_percentage: 0,
        icon_type: 'credit-card',
        description_fa:
          'پرداخت امن اینترنتی با تمامی کارت‌های بانکی عضو شبکه شتاب',
      },
    ]
  }, [payments, dbPayments])

  // Submit Handler
  const handleFinalSubmit = async () => {
    setSubmitError(null)

    if (hasOutOfStockItems) {
      triggerError(
        'یکی از کالاهای سبد خرید شما ناموجود است (موجودی صفر). امکان ثبت سفارش وجود ندارد.',
      )
      return
    }

    // Auth gate check
    if (!isUserLoggedIn) {
      triggerError(
        'برای نهایی‌سازی سفارش و اتصال به درگاه، لطفاً ابتدا وارد حساب کاربری خود شوید یا ثبت‌نام کنید.',
      )
      setIsAuthModalOpen(true)
      return
    }

    const userPhone = savedAccountPhone || customer?.phone || phone.trim()
    const userEmail =
      savedAccountEmail || customer?.email || emailAddress.trim()

    // Validate Mode C items
    for (const it of modeCItems) {
      const c = itemCreds[String(it.product.id)]
      if (!c?.email?.trim() || !c?.password?.trim()) {
        triggerError(
          `لطفاً اطلاعات اکانت مربوط به «${it.product.title_fa}» را وارد نمایید.`,
        )
        return
      }
    }

    // Balance check
    if (selectedPlatform === 'balance') {
      if (!isUserLoggedIn) {
        triggerError('جهت پرداخت از کیف پول ابتدا باید وارد حساب کاربری شوید.')
        setIsAuthModalOpen(true)
        return
      }
      if (!isBalanceSufficient) {
        triggerError(
          `موجودی کیف پول شما (${toPersianDigits(walletBalance.toLocaleString('fa-IR'))} تومان) کمتر از مبلغ کل است. لطفاً درگاه شاپرک را انتخاب کنید یا کیف پول خود را شارژ نمایید.`,
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
            plan_id: it.plan?.id,
            quantity: it.quantity,
          })),
          payment_platform: selectedPlatform,
          customer_phone:
            userPhone ||
            (savedAccountPhone ? savedAccountPhone : '09120000000'),
          customer_email: userEmail || firstCred?.email,
          account_email: firstCred?.email || userEmail,
          account_password: firstCred?.password,
          customer_notes: notes,
          coupon_code: coupon?.code,
        })
      }
    } catch (err: any) {
      triggerError(err.message || 'خطا در ثبت سفارش. لطفاً دوباره تلاش کنید.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Mobile validation for advancing from items to checkout
  const handleProceedToCheckout = () => {
    if (hasOutOfStockItems) {
      triggerError(
        'یکی از کالاهای سبد خرید شما ناموجود است (موجودی صفر). لطفاً کالای ناموجود را حذف فرمایید تا بتوانید ادامه دهید.',
      )
      return
    }
    for (const it of modeCItems) {
      const c = itemCreds[String(it.product.id)]
      if (!c?.email?.trim() || !c?.password?.trim()) {
        triggerError(
          `جهت ادامه، لطفاً ابتدا مشخصات اکانت (ایمیل و پسورد) را برای «${it.product.title_fa}» وارد نمایید.`,
        )
        return
      }
    }
    setSubmitError(null)
    setMobileStep('checkout')
  }

  if (!isOpen) return null

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center sm:p-4 md:p-6 overflow-hidden"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 2147483600,
      }}
      dir="rtl"
    >
      {/* Ambient Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-200 animate-in fade-in"
      />

      {/* Main Centered Workbench Modal (max-w-5xl) - Graphite Minimal Technical */}
      <div className="relative w-full h-[100dvh] max-h-[100dvh] sm:h-auto sm:max-h-[88vh] sm:max-w-5xl bg-card border border-border/80 sm:rounded-surface sm:shadow-overlay flex flex-col overflow-hidden animate-in zoom-in-95 fade-in duration-200 z-10 text-foreground">
        {/* 1. Modal Top Bar */}
        <div className="px-3 sm:px-6 py-2.5 sm:py-3.5 border-b border-border/60 bg-card flex items-center justify-between gap-2 sm:gap-3 shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {mobileStep === 'checkout' && (
              <button
                type="button"
                onClick={() => setMobileStep('items')}
                className="lg:hidden h-8 px-2.5 rounded-control border border-border/60 bg-muted/40 hover:bg-muted text-foreground text-xs font-bold flex items-center gap-1 cursor-pointer duration-motion active:scale-[0.98] shrink-0"
                title="بازگشت به اقلام"
                aria-label="بازگشت به اقلام"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>بازگشت</span>
              </button>
            )}

            <div className="relative flex items-center justify-center w-8 h-8 sm:w-11 sm:h-11 rounded-control bg-secondary text-secondary-foreground border border-border/60 shadow-control shrink-0">
              <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-brand" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 sm:h-5 min-w-[18px] sm:min-w-[20px] px-1 sm:px-1.5 items-center justify-center rounded-control bg-primary text-[10px] sm:text-[11px] font-black text-primary-foreground shadow-control animate-pulse font-latin">
                  {toPersianDigits(itemCount)}
                </span>
              )}
            </div>

            <div className="min-w-0">
              <h3 className="font-black text-xs sm:text-base text-foreground whitespace-nowrap truncate">
                {mobileStep === 'checkout' ? (
                  <>
                    <span className="sm:hidden">تسویه‌حساب</span>
                    <span className="hidden sm:inline">
                      تسویه‌حساب و روش پرداخت
                    </span>
                  </>
                ) : (
                  'سبد خرید شما'
                )}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {items.length > 0 && (
              <button
                type="button"
                onClick={clearCart}
                title="خالی کردن کل سبد"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-control text-xs font-bold text-rose-500 hover:text-rose-600 dark:text-rose-400 border border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/15 hover:border-rose-500/50 shadow-xs duration-motion ease-motion active:scale-[0.98] transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span className="hidden sm:inline">خالی کردن سبد</span>
              </button>
            )}
            <ModalCloseButton onClick={onClose} />
          </div>
        </div>

        {/* Consolidated Single Error Toast / Banner with auto-dismiss & close button */}
        {submitError && (
          <div className="mx-4 sm:mx-6 mt-3 p-3 rounded-surface bg-rose-500/10 border border-rose-500/30 flex items-start sm:items-center justify-between gap-2.5 text-xs text-rose-500 font-bold animate-in fade-in slide-in-from-top-1 shrink-0">
            <div className="flex items-start sm:items-center gap-2 flex-1 min-w-0">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5 sm:mt-0" />
              <span className="leading-relaxed break-words whitespace-normal flex-1">
                {submitError}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSubmitError(null)}
              className="p-1 rounded-control text-rose-500 hover:bg-rose-500/20 transition-colors cursor-pointer shrink-0"
              title="بستن پیام خطا"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* 2. Modal Body */}
        {items.length === 0 ? (
          <div className="flex-1 min-h-0 py-16 sm:py-20 flex flex-col items-center justify-center text-center p-6 space-y-5 overflow-y-auto">
            <div className="relative">
              <div className="w-20 h-20 rounded-control bg-secondary text-secondary-foreground border border-border/60 flex items-center justify-center shadow-control">
                <ShoppingBag className="w-10 h-10 text-brand stroke-[1.5]" />
              </div>
            </div>

            <div className="space-y-1.5 max-w-sm">
              <h4 className="font-black text-base sm:text-lg text-white">
                سبد خرید شما در حال حاضر خالی است
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                می‌توانید از کاتالوگ فروشگاه اشتراک‌های هوش مصنوعی را به سبد خرید
                اضافه کرده و سفارش خود را تکمیل کنید.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="h-11 px-7 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs sm:text-sm duration-motion ease-motion active:scale-[0.98] shadow-control flex items-center gap-2 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>مشاهده و انتخاب اشتراک‌ها</span>
            </button>
          </div>
        ) : (
          <div className="flex-1 min-h-0 overflow-hidden flex flex-col lg:flex-row relative">
            {/* Items Column (Desktop: visible, Mobile: visible only on mobileStep === 'items') */}
            <div
              className={`flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-4 overscroll-contain ${
                mobileStep === 'checkout'
                  ? 'hidden lg:block'
                  : 'block pb-28 lg:pb-6'
              }`}
            >
              <div className="flex items-center justify-between pb-2 border-b border-border/60">
                <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                  <span>اقلام سفارش</span>
                  <span className="text-[10px] text-muted-foreground font-latin">
                    ({toPersianDigits(itemCount)} مورد)
                  </span>
                </div>
                <span className="text-[11px] text-muted-foreground hidden sm:inline">
                  ویرایش تعداد و مشخصات اکانت
                </span>
              </div>

              {/* Multi-Product 1-Click Sync Banner (Only shown if at least 2 Mode C products exist AND the first one has credentials entered) */}
              {modeCItems.length >= 2 && isFirstCredFilled && (
                <div className="p-3 rounded-control bg-brand/10 border border-brand/30 flex items-center justify-between gap-3 text-xs animate-in fade-in">
                  <div className="flex items-center gap-2 text-foreground font-bold min-w-0">
                    <KeyRound className="w-4 h-4 text-brand shrink-0" />
                    <span className="truncate">
                      {toPersianDigits(modeCItems.length)} سرویس نیازمند مشخصات
                      اکانت شخصی
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleSyncFirstCredToAll}
                    className="px-3 py-1.5 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-black transition shadow-control shrink-0 flex items-center gap-1 active:scale-[0.98] duration-motion cursor-pointer"
                    title="کپی ایمیل و پسورد اکانت اول روی بقیه سرویس‌ها"
                  >
                    <span>کپی اطلاعات اکانت اول روی همه</span>
                  </button>
                </div>
              )}

              {/* Products List */}
              <div className="space-y-3">
                {items.map(({ product, quantity, plan }) => {
                  const brand = getProductBrandConfig(
                    product.category,
                    product.title_fa,
                  )
                  const unitPrice = plan?.price_toman ?? product.price_toman
                  const lineTotal = unitPrice * quantity
                  const isModeC = product.delivery_mode === 'UPGRADE_EXISTING'
                  const cred = itemCreds[String(product.id)] || {
                    email: '',
                    password: '',
                    showPassword: false,
                  }
                  const isCredFilled = Boolean(
                    cred.email?.trim() && cred.password?.trim(),
                  )
                  const isItemUnavailable = isProductOutOfStock(product)

                  return (
                    <div
                      key={`${product.id}-${plan?.id || 'default'}`}
                      className={`group relative rounded-surface border bg-card p-3.5 sm:p-4 shadow-surface transition-all space-y-3 ${
                        isItemUnavailable
                          ? 'border-rose-500/40 bg-rose-500/5'
                          : 'border-border/60'
                      }`}
                    >
                      {/* Out of Stock Warning */}
                      {isItemUnavailable && (
                        <div className="p-2.5 rounded-control bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-bold flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                            <span>این محصول در حال حاضر ناموجود است (موجودی صفر)</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeItem(product.id, plan?.id)}
                            className="text-[11px] underline hover:text-rose-400 font-bold cursor-pointer"
                          >
                            حذف این آیتم
                          </button>
                        </div>
                      )}

                      {/* Product Header & Info */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 sm:gap-3.5 min-w-0">
                          <div
                            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-control border border-border/60 flex items-center justify-center shrink-0 shadow-control transition-transform group-hover:scale-105 ${brand.bg}`}
                          >
                            {brand.icon}
                          </div>

                          <div className="min-w-0 space-y-1.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-bold text-xs sm:text-sm text-foreground truncate max-w-[200px] sm:max-w-[340px]">
                                {product.title_fa}
                              </h4>
                              {plan ? (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-control bg-brand/10 text-brand border border-brand/20">
                                  {plan.title} ({plan.duration_text})
                                </span>
                              ) : (
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded-control bg-muted text-muted-foreground font-semibold">
                                  {brand.badge}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2.5 flex-wrap text-xs">
                              {isModeC ? (
                                <span className="inline-flex items-center gap-1 text-brand font-medium text-[10px] sm:text-[11px] bg-brand/10 px-2 py-0.5 rounded-control border border-brand/20">
                                  <ShieldCheck className="w-3.5 h-3.5" />
                                  <span>ارتقا روی اکانت شخصی</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-emerald-400 font-medium text-[10px] sm:text-[11px] bg-emerald-500/10 px-2 py-0.5 rounded-control border border-emerald-500/20">
                                  <Zap className="w-3.5 h-3.5" />
                                  <span>تحویل آنی</span>
                                </span>
                              )}

                              <span className="text-muted-foreground text-[10px] sm:text-[11px] flex items-center gap-1">
                                <span>واحد:</span>
                                <span className="font-bold text-foreground font-sans">
                                  {formatToman(unitPrice)}
                                </span>
                                <span>تومان</span>
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Remove Action */}
                        <button
                          type="button"
                          onClick={() => removeItem(product.id, plan?.id)}
                          className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-control transition-colors shrink-0 cursor-pointer"
                          title="حذف این مورد از سبد"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Contextual Per-Item Credential Expander for Mode C */}
                      {isModeC && (
                        <div
                          className={`rounded-control border p-3 space-y-2.5 transition-all ${
                            isCredFilled
                              ? 'bg-emerald-500/5 border-emerald-500/25'
                              : 'bg-muted/20 border-border/60'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                              <KeyRound className="w-3.5 h-3.5 text-brand" />
                              <span>مشخصات اکانت {brand.badge} جهت ارتقا:</span>
                            </div>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-control border ${
                                isCredFilled
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                                  : 'bg-amber-500/10 text-amber-500 border-amber-500/30'
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
                              <input
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
                                className="w-full h-10 px-3.5 text-xs font-latin rounded-field bg-muted/20 border border-border/60 text-foreground placeholder:text-muted-foreground outline-none focus:border-brand transition-colors"
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
                                  className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer"
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
                              <input
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
                                className="w-full h-10 px-3.5 text-xs font-latin rounded-field bg-muted/20 border border-border/60 text-foreground placeholder:text-muted-foreground outline-none focus:border-brand transition-colors"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Quantity Stepper & Subtotal Row */}
                      <div className="flex items-center justify-between pt-2 border-t border-border/50">
                        {/* Stepper with tactile touch */}
                        <div className="flex items-center border border-border/60 bg-muted/20 rounded-control p-0.5 shadow-xs">
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(product.id, quantity - 1, plan?.id)
                            }
                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-control flex items-center justify-center text-muted-foreground hover:bg-card hover:text-foreground transition active:scale-90"
                            aria-label="کاهش تعداد"
                          >
                            {quantity === 1 ? (
                              <Trash2 className="w-4 h-4 text-rose-500" />
                            ) : (
                              <Minus className="w-4 h-4" />
                            )}
                          </button>

                          <span className="w-8 sm:w-9 text-center font-black text-xs sm:text-sm text-foreground font-mono font-latin">
                            {quantity}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(product.id, quantity + 1, plan?.id)
                            }
                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-control flex items-center justify-center text-muted-foreground hover:bg-card hover:text-foreground transition active:scale-90"
                            aria-label="افزایش تعداد"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Calculated Line Total */}
                        <div className="text-left">
                          <div className="flex items-baseline justify-end gap-1.5">
                            <span className="font-black text-sm sm:text-base text-foreground font-sans">
                              {formatToman(lineTotal)}
                            </span>
                            <span className="text-xs text-muted-foreground font-sans">
                              تومان
                            </span>
                          </div>
                          {quantity > 1 && (
                            <div className="text-[10px] sm:text-[11px] text-muted-foreground font-sans">
                              {toPersianDigits(quantity)} ×{' '}
                              {formatToman(unitPrice)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
                {/* Mobile Sticky Bottom Action Dock in Step 1 (< lg only) */}
                {mobileStep === 'items' && items.length > 0 && (
                  <div className="lg:hidden fixed inset-x-0 bottom-0 border-t border-border/80 bg-card/98 backdrop-blur-md p-3.5 flex items-center justify-between gap-3 shadow-2xl z-30">
                    <div className="space-y-0.5 select-none">
                      <span className="text-[11px] text-muted-foreground block">
                        مجموع کل اقلام
                      </span>
                      <div className="flex items-baseline gap-1 font-black text-base text-foreground font-sans">
                        <span>{formatToman(total)}</span>
                        <span className="text-[10px] font-normal text-muted-foreground font-sans">
                          تومان
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleProceedToCheckout}
                      className="h-10 px-5 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs duration-motion ease-motion active:scale-[0.98] shadow-control flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>
                        ادامه به پرداخت ({toPersianDigits(itemCount)})
                      </span>
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Financial & Payment Column (Visible lg:flex on desktop, on mobile visible only when mobileStep === 'checkout') */}
            <div
              className={`w-full lg:w-[410px] shrink-0 min-h-0 lg:border-r border-border/60 bg-card p-4 sm:p-6 flex flex-col overflow-y-auto space-y-4 pb-28 lg:pb-6 overscroll-contain ${
                mobileStep === 'checkout' ? 'flex' : 'hidden lg:flex'
              }`}
            >
              <div className="space-y-4">
                {/* Guest Callout Banner (if not logged in) */}
                {!isUserLoggedIn && (
                  <div className="rounded-surface border border-border/80 bg-card p-4 shadow-surface flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                    <div className="text-right space-y-0.5">
                      <span className="font-bold text-foreground block">
                        ورود به حساب کاربری جهت تسویه‌حساب
                      </span>
                      <span className="text-[11px] text-muted-foreground block">
                        برای ثبت نهایی سفارش، صدور لایسنس و پیگیری، ابتدا وارد
                        حساب خود شوید.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsAuthModalOpen(true)}
                      className="h-9 px-4 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs duration-motion ease-motion active:scale-[0.98] shadow-control flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>ورود / عضویت سریع</span>
                    </button>
                  </div>
                )}

                {/* 2. Embedded Payment Method Selector (انتخاب روش پرداخت:) */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-foreground block">
                    انتخاب روش پرداخت:
                  </label>
                  <div className="space-y-1.5">
                    {availableGateways.map((p: PaymentGateway) => {
                      const isDisabled = p.display_mode === 'disabled_visible'
                      const isSelected =
                        selectedPlatform === p.platform && !isDisabled
                      return (
                        <div
                          key={p.id}
                          onClick={() => {
                            if (isDisabled) return
                            setSelectedPlatform(p.platform)
                          }}
                          className={`flex items-center justify-between rounded-control border p-2.5 transition-all duration-motion ease-motion ${
                            isDisabled
                              ? 'opacity-55 cursor-not-allowed bg-muted/20 border-border/40 select-none'
                              : isSelected
                                ? 'border-primary bg-primary/10 ring-1 ring-primary/30 shadow-control cursor-pointer'
                                : 'border-border/60 bg-card hover:bg-muted/40 cursor-pointer'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-control bg-secondary border border-border/80 text-foreground shrink-0 shadow-control">
                              {getGatewayIcon(
                                p.icon_type,
                                p.platform,
                                p.icon_url,
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-foreground">
                                  {p.name}
                                </span>
                                {isDisabled ? (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded-control font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                    موقتاً غیرفعال
                                  </span>
                                ) : p.platform === 'balance' ? (
                                  <span
                                    className={`text-[9px] px-1.5 py-0.2 rounded-control font-bold border ${
                                      isBalanceSufficient
                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                        : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                    }`}
                                  >
                                    {isBalanceSufficient
                                      ? 'موجودی کافی ✓'
                                      : 'موجودی ناکافی'}
                                  </span>
                                ) : null}
                              </div>
                              <p className="text-[10px] text-muted-foreground mt-0.5">
                                {isDisabled
                                  ? 'این درگاه موقتاً در دسترس نمی‌باشد'
                                  : p.platform === 'balance'
                                    ? `موجودی: ${formatToman(walletBalance)} تومان`
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
                      <Tag className="w-4 h-4 text-brand" />
                      <span>کد تخفیف و پروموشن</span>
                    </span>
                    {coupon?.valid && (
                      <span className="text-[10px] text-emerald-400 font-mono font-bold">
                        تخفیف فعال ✓
                      </span>
                    )}
                  </div>

                  {coupon?.valid ? (
                    <div className="p-2.5 rounded-control bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between text-xs animate-in zoom-in-95">
                      <div className="flex items-center gap-2 text-emerald-400 font-bold">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>
                          {coupon.code} ({discount.toLocaleString('fa-IR')}{' '}
                          تومان تخفیف)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={removeCoupon}
                        className="text-xs text-muted-foreground hover:text-destructive transition-colors px-2 py-1 rounded-control hover:bg-destructive/10 cursor-pointer"
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
                        <input
                          value={couponCodeInput}
                          onChange={(e) => {
                            setCouponCodeInput(e.target.value)
                            if (couponError) setCouponError(null)
                          }}
                          placeholder="کد تخفیف (مثال: WELCOME10)"
                          className="h-10 text-xs uppercase font-latin rounded-field bg-muted/20 border border-border/60 px-3 text-foreground outline-none focus:border-brand transition-colors flex-1"
                        />
                        <button
                          type="submit"
                          disabled={couponLoading || !couponCodeInput.trim()}
                          className="h-10 px-4 text-xs font-black bg-primary hover:bg-primary-hover text-primary-foreground rounded-control shrink-0 transition duration-motion active:scale-[0.98] shadow-control cursor-pointer disabled:opacity-50"
                        >
                          {couponLoading ? '...' : 'اعمال'}
                        </button>
                      </form>

                      {couponError && (
                        <div className="p-2.5 rounded-control bg-rose-500/10 border border-rose-500/25 flex items-center justify-between text-xs text-rose-500 font-bold animate-in fade-in duration-200">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{couponError}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setCouponError(null)}
                            className="p-1 rounded-control hover:bg-rose-500/20 text-rose-500 cursor-pointer"
                            title="بستن پیام خطا"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      {/* Quick Chips from Database / Admin Panel */}
                      {promotionalCoupons.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                          {promotionalCoupons.map((p) => {
                            const isThisApplied =
                              coupon?.code === p.code ||
                              quickCouponApplied === p.code
                            return (
                              <button
                                key={p.code}
                                type="button"
                                onClick={() => handleApplyCoupon(p.code)}
                                className={`text-[10px] font-latin px-2 py-0.5 rounded-control border transition-all duration-motion cursor-pointer ${
                                  isThisApplied
                                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400 font-bold'
                                    : 'border-border/60 bg-muted/20 hover:bg-muted text-foreground'
                                }`}
                              >
                                {isThisApplied ? `✓ ${p.code}` : p.code}{' '}
                                {p.label && (
                                  <span className="text-[9px] text-muted-foreground font-sans">
                                    ({p.label})
                                  </span>
                                )}
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 4. Price Ledger Breakdown */}
                <div className="rounded-surface border border-border/80 bg-card p-4 space-y-2.5 text-xs shadow-surface">
                  <div className="flex justify-between text-muted-foreground">
                    <span>ارزش کل اقلام:</span>
                    <span className="font-bold text-foreground text-sm font-sans">
                      {formatToman(subtotal)} تومان
                    </span>
                  </div>

                  {discount > 0 && (
                    <div className="flex justify-between text-emerald-400 font-bold">
                      <span className="flex items-center gap-1">
                        <Percent className="w-3.5 h-3.5" />
                        تخفیف پروموشن:
                      </span>
                      <span className="text-sm font-sans">
                        -{formatToman(discount)} تومان
                      </span>
                    </div>
                  )}

                  <div className="pt-2.5 border-t border-border/80 flex justify-between items-baseline">
                    <span className="font-black text-sm text-foreground">
                      مبلغ قابل پرداخت:
                    </span>
                    <div className="flex items-baseline gap-1 text-xl font-black text-foreground font-sans">
                      <span>{formatToman(total)}</span>
                      <span className="text-xs font-normal text-muted-foreground font-sans">
                        تومان
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 5. Checkout CTA Button & Balance Warnings */}
              <div className="space-y-3 pt-3 mt-auto shrink-0">
                {/* Explicit Balance Insufficient Warning Card */}
                {isUserLoggedIn &&
                  selectedPlatform === 'balance' &&
                  !isBalanceSufficient && (
                    <div className="p-3 rounded-control bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs space-y-2 animate-in fade-in">
                      <div className="flex items-center gap-1.5 font-bold">
                        <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
                        <span>موجودی کیف پول شما کمتر از مبلغ سفارش است</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        موجودی شما{' '}
                        {toPersianDigits(walletBalance.toLocaleString('fa-IR'))}{' '}
                        تومان و مبلغ کل{' '}
                        {toPersianDigits(total.toLocaleString('fa-IR'))} تومان
                        است. می‌توانید درگاه شاپرک را انتخاب کرده یا کیف پول خود
                        را به صورت آنی شارژ کنید.
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            const onlineGateway =
                              availableGateways.find(
                                (g) =>
                                  g.platform !== 'balance' &&
                                  g.display_mode !== 'disabled_visible',
                              ) ||
                              availableGateways.find(
                                (g) => g.platform !== 'balance',
                              )
                            setSelectedPlatform(
                              onlineGateway?.platform || 'zarinpal',
                            )
                          }}
                          className="px-3 py-1.5 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs duration-motion active:scale-95 shadow-control cursor-pointer"
                        >
                          سوییچ به درگاه شاپرک
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsTopupModalOpen(true)}
                          className="px-3 py-1.5 rounded-control border border-border/80 bg-muted/40 hover:bg-muted text-foreground text-xs font-bold transition duration-motion active:scale-95 cursor-pointer"
                        >
                          شارژ آنی کیف پول
                        </button>
                      </div>
                    </div>
                  )}

                <button
                  type="button"
                  onClick={() => {
                    if (!isUserLoggedIn) {
                      setIsAuthModalOpen(true)
                      return
                    }
                    handleFinalSubmit()
                  }}
                  disabled={
                    isSubmitting ||
                    hasOutOfStockItems ||
                    (isUserLoggedIn &&
                      selectedPlatform === 'balance' &&
                      !isBalanceSufficient)
                  }
                  className={`w-full h-11 rounded-control font-black text-xs sm:text-sm duration-motion ease-motion active:scale-[0.98] shadow-control flex items-center justify-center gap-2 cursor-pointer ${
                    hasOutOfStockItems
                      ? 'bg-rose-500/10 text-rose-500 border border-rose-500/30 cursor-not-allowed opacity-80'
                      : !isUserLoggedIn
                        ? 'bg-primary hover:bg-primary-hover text-primary-foreground shadow-control'
                        : selectedPlatform === 'balance' && !isBalanceSufficient
                          ? 'bg-muted text-muted-foreground cursor-not-allowed opacity-60'
                          : 'bg-primary hover:bg-primary-hover text-primary-foreground'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>در حال ثبت سفارش...</span>
                    </>
                  ) : hasOutOfStockItems ? (
                    <>
                      <AlertCircle className="w-4 h-4 text-rose-500" />
                      <span>کالای ناموجود در سبد خرید (امکان پرداخت نیست)</span>
                    </>
                  ) : !isUserLoggedIn ? (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>ورود به حساب جهت ثبت و پرداخت سفارش</span>
                    </>
                  ) : selectedPlatform === 'balance' && !isBalanceSufficient ? (
                    <span>موجودی کیف پول ناکافی است</span>
                  ) : (
                    <>
                      <span>ثبت نهایی سفارش و پرداخت</span>
                      <ArrowLeft className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Customer Auth Modal for Gated Checkout */}
      <AuthModal
        isOpen={isAuthModalOpen}
        initialMode="login"
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => {
          setIsAuthModalOpen(false)
          apiService.getCustomerProfile().then((p) => {
            if (p) setInternalCustomer(p)
          })
        }}
      />

      {/* Wallet Topup Modal */}
      <WalletTopupModal
        isOpen={isTopupModalOpen}
        onClose={() => setIsTopupModalOpen(false)}
        currentBalance={walletBalance}
        onSuccess={(newBal) => {
          if (activeCustomer) {
            setInternalCustomer({
              ...activeCustomer,
              balance_toman: newBal,
            })
          }
        }}
      />
    </div>,
    document.body,
  )
}
