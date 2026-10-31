import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Bell,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  Globe,
  Headphones,
  HelpCircle,
  Lock,
  Package,
  Send,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Star,
  Table,
  UserCheck,
  Zap,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AuthModal } from '../components/AuthModal'
import { ClaudeIcon, GeminiIcon, OpenAIIcon } from '../components/BrandIcons'
import { CartDrawer } from '../components/CartDrawer'
import { MarkdownRenderer } from '../components/content/MarkdownRenderer'
import { Header } from '../components/Header'
import { OrderSuccessModal } from '../components/OrderSuccessModal'
import { PrePurchaseNoticeModal } from '../components/PrePurchaseNoticeModal'
import { ProductReviewsSection } from '../components/reviews/ProductReviewsSection'
import { TelegramIcon } from '../components/SocialIcons'
import { StockAlertModal } from '../components/StockAlertModal'
import { Badge } from '../components/ui/badge'
import { Accordion } from '../components/vibefarsi/Accordion'
import { Breadcrumb } from '../components/vibefarsi/Breadcrumb'
import { LoadingState } from '../components/vibefarsi/LoadingState'
import { useNotification } from '../components/vibefarsi/NotificationContext'
import { QuantitySelector } from '../components/vibefarsi/QuantitySelector'
import { ScrollReveal } from '../components/vibefarsi/ScrollReveal'
import { cartStore, useCart } from '../lib/cartStore'
import { apiService } from '../services/api'
import type {
  CustomerProfile,
  Order,
  PaymentGateway,
  ProductDetail,
  ProductPlan,
} from '../types'
import { getSiteBrandName } from '../utils/brand'
import { formatToman, toPersianDigits } from '../utils/formatters'

interface ProductDetailPageProps {
  orders: Order[]
  onOrderCreated: (order: Order) => void
  setBalance?: React.Dispatch<React.SetStateAction<number>>
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  orders,
  onOrderCreated,
  setBalance,
}) => {
  const { slug } = useParams<{ slug: string }>()
  const cart = useCart()

  const [product, setProduct] = useState<ProductDetail | null>(null)
  const [payments, setPayments] = useState<PaymentGateway[]>([])
  const [customer, setCustomer] = useState<CustomerProfile | null>(null)
  const [themeSettings, setThemeSettings] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Plan selection state
  const [selectedPlan, setSelectedPlan] = useState<ProductPlan | null>(null)
  const [isStockAlertOpen, setIsStockAlertOpen] = useState(false)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [addedToast, setAddedToast] = useState(false)
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [successOrderModal, setSuccessOrderModal] = useState<Order | null>(null)
  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false)
  const [_pendingNoticeAction, setPendingNoticeAction] = useState<
    'buy' | 'add' | null
  >(null)
  const { warning } = useNotification()

  // DNS copy feedback
  const [copiedDns, setCopiedDns] = useState<string | null>(null)

  // Fetch product detail by slug
  useEffect(() => {
    let isMounted = true
    async function loadData() {
      if (!slug) return
      setLoading(true)
      setError(null)
      try {
        const [prodData, paysData, custData, theme] = await Promise.all([
          apiService.getProductBySlug(slug),
          apiService.getPayments(),
          apiService.getCustomerProfile(),
          apiService.getThemeSettings().catch(() => null),
        ])

        if (!isMounted) return

        if (!prodData) {
          setError('محصول مورد نظر یافت نشد یا ممکن است غیرفعال شده باشد.')
          setLoading(false)
          return
        }

        setProduct(prodData)
        setPayments(paysData)
        if (custData) setCustomer(custData)
        if (theme) setThemeSettings(theme)

        // Select default plan or first plan
        const plans = prodData.plans || []
        const def =
          plans.find((p: ProductPlan) => p.is_default) || plans[0] || null
        setSelectedPlan(def)

        // Dynamic SEO Head injection
        const brand = getSiteBrandName()
        const seoTitle =
          prodData.seo?.meta_title ||
          prodData.meta_title ||
          `خرید ${prodData.title_fa} (${prodData.title_en}) | تحویل قانونی و آنی - ${brand}`
        const seoDesc =
          prodData.seo?.meta_description ||
          prodData.meta_description ||
          prodData.description_fa ||
          `خرید اشتراک قانونی ${prodData.title_fa} با بهترین قیمت، فعال‌سازی فوری، ضمانت عدم قطعی و پشتیبانی شبانه‌روزی در ${brand}.`

        document.title = seoTitle

        // Update meta description
        let metaDescEl = document.querySelector(
          'meta[name="description"]',
        ) as HTMLMetaElement | null
        if (!metaDescEl) {
          metaDescEl = document.createElement('meta')
          metaDescEl.name = 'description'
          document.head.appendChild(metaDescEl)
        }
        metaDescEl.content = seoDesc

        // Update OpenGraph
        const ogTitleEl = document.querySelector('meta[property="og:title"]')
        if (ogTitleEl) ogTitleEl.setAttribute('content', seoTitle)
        const ogDescEl = document.querySelector(
          'meta[property="og:description"]',
        )
        if (ogDescEl) ogDescEl.setAttribute('content', seoDesc)
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'خطا در بارگذاری مشخصات محصول')
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadData()

    return () => {
      isMounted = false
    }
  }, [slug])

  // Reset document title on unmount
  useEffect(() => {
    return () => {
      document.title = `${getSiteBrandName()} | مرجع رسمی اشتراک‌های قانونی و شماره مجازی`
    }
  }, [])

  // Brand Icon helper
  const getBrandDetails = () => {
    if (product?.icon_url) {
      return {
        icon: (
          <img
            src={product.icon_url}
            alt={product.title_fa}
            className="h-8 w-8 object-contain"
            onError={(e) => {
              ;(e.target as HTMLElement).style.display = 'none'
            }}
          />
        ),
        bg: 'bg-primary/10 border-primary/20 text-primary',
        brandName: product.group_title_fa || product.title_fa,
      }
    }

    const s =
      `${product?.title_en || ''} ${product?.group_tag || ''}`.toLowerCase()
    if (s.includes('chatgpt') || s.includes('openai')) {
      return {
        icon: (
          <OpenAIIcon className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
        ),
        bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600',
        brandName: 'OpenAI Ecosystem',
      }
    }
    if (s.includes('claude') || s.includes('anthropic')) {
      return {
        icon: (
          <ClaudeIcon className="h-8 w-8 text-amber-600 dark:text-amber-400" />
        ),
        bg: 'bg-amber-500/10 border-amber-500/20 text-amber-600',
        brandName: 'Anthropic AI',
      }
    }
    if (s.includes('gemini') || s.includes('google')) {
      return {
        icon: (
          <GeminiIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
        ),
        bg: 'bg-blue-500/10 border-blue-500/20 text-blue-600',
        brandName: 'Google Cloud & One',
      }
    }
    return {
      icon: <Sparkles className="h-8 w-8 text-brand" />,
      bg: 'bg-brand/10 border-brand/20 text-brand',
      brandName:
        product?.group_title_fa ||
        product?.title_fa ||
        getSiteBrandName('پلی شاپ'),
    }
  }

  const isOutOfStock =
    product?.stock_mode === 'out_of_stock' ||
    product?.is_out_of_stock ||
    (product?.stock_mode !== 'always_in_stock' &&
      product?.available_stock !== undefined &&
      product.available_stock <= 0)

  const shouldShowNoticeModal = () => {
    if (!product?.pre_purchase_notice) return false
    if (
      product.pre_purchase_notice_mode !== 'modal_confirm' &&
      product.pre_purchase_notice_mode !== 'both'
    )
      return false
    try {
      const snoozeExpiry = localStorage.getItem(
        `anahix_notice_snooze_${product.id}`,
      )
      if (snoozeExpiry && Number(snoozeExpiry) > Date.now()) return false
      if (sessionStorage.getItem(`anahix_notice_snooze_${product.id}`))
        return false
    } catch {}
    return true
  }

  // Handle Add to Cart
  const handleAddToCart = () => {
    if (!product || isOutOfStock) return
    if (shouldShowNoticeModal()) {
      setPendingNoticeAction('add')
      setIsNoticeModalOpen(true)
      return
    }
    executeAddToCart()
  }

  const executeAddToCart = () => {
    if (!product) return
    cartStore.addItem(product, 1, selectedPlan || undefined)
    setAddedToast(true)
    setTimeout(() => setAddedToast(false), 3000)
    setIsNoticeModalOpen(false)
  }

  // Handle in-place quantity changes
  const handleQuantityChange = (newQty: number) => {
    if (!product) return
    if (newQty <= 0) {
      cartStore.removeItem(product.id, selectedPlan?.id)
    } else {
      cartStore.updateQuantity(product.id, newQty, selectedPlan?.id)
    }
  }

  // Handle Instant Buy (Add and open cart drawer)
  const handleInstantBuy = () => {
    if (!product || isOutOfStock) return
    if (!apiService.isCustomerLoggedIn()) {
      warning(
        'نیاز به ورود به حساب کاربری',
        'برای خرید آنی و نهایی‌سازی سفارش، لطفاً ابتدا وارد حساب کاربری خود شوید یا ثبت‌نام کنید.',
      )
      setIsAuthOpen(true)
      return
    }
    if (shouldShowNoticeModal()) {
      setPendingNoticeAction('buy')
      setIsNoticeModalOpen(true)
      return
    }
    executeInstantBuy()
  }

  const executeInstantBuy = () => {
    if (!product) return
    cartStore.addItem(product, 1, selectedPlan || undefined)
    setIsCartOpen(true)
    setIsNoticeModalOpen(false)
  }

  // Handle checkout submission inside cart
  const handleCartCheckoutSubmit = async (data: {
    items: { product_id: string; plan_id?: string; quantity: number }[]
    payment_platform: string
    customer_phone: string
    account_email?: string
    account_password?: string
    customer_notes?: string
    coupon_code?: string
  }) => {
    const newOrder = await apiService.createOrder({
      items: data.items,
      payment_platform: data.payment_platform,
      customer_phone: data.customer_phone,
      account_email: data.account_email,
      account_password: data.account_password,
      customer_notes: data.customer_notes,
      coupon_code: cart.coupon?.code || data.coupon_code,
    })

    cart.clearCart()
    setIsCartOpen(false)

    if (
      newOrder.payment_url &&
      (newOrder.payment_url.startsWith('http') ||
        newOrder.payment_url.startsWith('/payment/callback'))
    ) {
      window.location.href = newOrder.payment_url
      return
    }

    if (data.payment_platform === 'balance') {
      if (setBalance) {
        setBalance((prev) => Math.max(0, prev - newOrder.amount_toman))
      }
      if (customer) {
        setCustomer((prev) =>
          prev
            ? {
                ...prev,
                balance_toman: Math.max(
                  0,
                  prev.balance_toman - newOrder.amount_toman,
                ),
              }
            : null,
        )
      }
    }

    onOrderCreated(newOrder)
    setSuccessOrderModal(newOrder)
  }

  // Copy DNS to clipboard helper
  const handleCopyDNS = (dns: string, name: string) => {
    navigator.clipboard.writeText(dns)
    setCopiedDns(name)
    setTimeout(() => setCopiedDns(null), 2500)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
        <Header
          activeOrdersCount={
            orders.filter((o) => o.status !== 'COMPLETED').length
          }
          onOpenCart={() => setIsCartOpen(true)}
        />
        <main className="flex-1 max-w-7xl mx-auto px-4 py-24 w-full flex items-center justify-center">
          <LoadingState
            message="در حال بارگذاری صفحه اختصاصی محصول..."
            subMessage="دریافت اطلاعات پلن‌ها، قیمت‌های زنده و جدول مقایسه"
            size="lg"
            minHeight="40vh"
          />
        </main>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
        <Header
          activeOrdersCount={
            orders.filter((o) => o.status !== 'COMPLETED').length
          }
          onOpenCart={() => setIsCartOpen(true)}
        />
        <main className="flex-1 max-w-xl mx-auto px-4 py-16 w-full text-center">
          <div className="rounded-surface border border-border/80 bg-card p-8 sm:p-10 shadow-surface space-y-4">
            <div className="w-14 h-14 rounded-control bg-secondary text-brand border border-border/60 flex items-center justify-center mx-auto shadow-xs">
              <Package className="h-7 w-7 text-brand" />
            </div>
            <h2 className="text-lg sm:text-xl font-black text-foreground">
              محصول مورد نظر یافت نشد
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto">
              {error ||
                'آدرس این سرویس نامعتبر است یا ممکن است این محصول از کاتالوگ فروشگاه برداشته شده باشد.'}
            </p>
            <div className="pt-2">
              <Link
                to="/"
                className="h-10 px-5 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs shadow-control transition-all duration-motion active:scale-[0.98] inline-flex items-center gap-2 cursor-pointer"
              >
                <ArrowRight className="h-4 w-4" />
                <span>بازگشت به ویترین اصلی فروشگاه</span>
              </Link>
            </div>
          </div>
        </main>
      </div>
    )
  }

  const brand = getBrandDetails()
  const effectivePrice = selectedPlan?.price_toman ?? product.price_toman
  const originalPrice =
    selectedPlan?.original_price_toman &&
    selectedPlan.original_price_toman > effectivePrice
      ? selectedPlan.original_price_toman
      : product.original_price_toman &&
          product.original_price_toman > effectivePrice
        ? product.original_price_toman
        : effectivePrice
  const savingsToman = Math.max(0, originalPrice - effectivePrice)
  const savingsPercent =
    originalPrice > effectivePrice
      ? Math.round((savingsToman / originalPrice) * 100)
      : 0

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans transition-colors duration-200">
      <Header
        activeOrdersCount={
          orders.filter((o) => o.status !== 'COMPLETED').length
        }
        onOpenCart={() => setIsCartOpen(true)}
      />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full space-y-12">
        {/* Unified Breadcrumb Navigation */}
        <Breadcrumb
          items={[
            {
              label:
                product.group_title_fa ||
                (product.category === 'ai_chat'
                  ? 'هوش مصنوعی و چت‌بات'
                  : product.category === 'coding_ai'
                    ? 'دستیار کدنویسی'
                    : 'کاتالوگ سرویس‌ها'),
              to: `/category/${product.category || 'all'}`,
            },
            {
              label: product.title_fa,
            },
          ]}
        />

        {/* TOP SECTION: PRODUCT HERO & PLAN SWITCHER */}
        <ScrollReveal>
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Right/Main Column: Product Overview & Info (7 cols) */}
            <div className="lg:col-span-7 space-y-6 text-right">
              {/* Badges row */}
              <div className="flex items-center gap-2.5 flex-wrap">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${brand.bg}`}
                >
                  {brand.icon}
                </div>
                <div>
                  <span className="text-xs font-bold text-muted-foreground font-latin">
                    {brand.brandName}
                  </span>
                  <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
                    <span>
                      {selectedPlan?.duration_text
                        ? `لایسنس ۱۰۰٪ قانونی (${selectedPlan.duration_text})`
                        : product.duration_days
                          ? `لایسنس ۱۰۰٪ قانونی (${toPersianDigits(product.duration_days)} روزه)`
                          : 'لایسنس ۱۰۰٪ معتبر و قانونی'}
                    </span>
                  </div>
                </div>

                {product.required_customer_input === 'telegram_username' ? (
                  <Badge
                    variant="blue"
                    className="gap-1.5 text-xs font-bold py-1 px-3 bg-sky-500/10 text-sky-400 border border-sky-500/20"
                  >
                    <Send className="h-3.5 w-3.5" />
                    فعال‌سازی با آیدی تلگرام (بدون نیاز به پسورد)
                  </Badge>
                ) : product.required_customer_input === 'account_creds' ||
                  product.delivery_mode === 'UPGRADE_EXISTING' ? (
                  <Badge
                    variant="amber"
                    className="gap-1.5 text-xs font-bold py-1 px-3"
                  >
                    <UserCheck className="h-3.5 w-3.5" />
                    ارتقا روی اکانت شخصی (دستی اپراتور)
                  </Badge>
                ) : (
                  <Badge
                    variant="blue"
                    className="gap-1.5 text-xs font-bold py-1 px-3 bg-muted text-foreground border border-border/60"
                  >
                    <Zap className="h-3.5 w-3.5 text-brand" />
                    تحویل آنی و بدون رمز عبور
                  </Badge>
                )}

                <a
                  href="#product-reviews"
                  className="inline-flex items-center gap-1.5 text-xs text-foreground bg-muted/40 hover:bg-muted px-3 py-1.5 rounded-control border border-border/60 font-bold transition mr-auto shadow-xs"
                >
                  <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                  <span>نظرات خریداران</span>
                </a>
              </div>

              {/* Titles */}
              <div className="space-y-1.5">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-foreground leading-tight">
                  {product.title_fa}
                </h1>
                <p
                  className="text-sm sm:text-base text-muted-foreground font-latin text-left"
                  dir="ltr"
                >
                  {product.title_en}
                </p>
              </div>

              {/* Description */}
              {(product.description || product.description_fa) && (
                <p className="text-sm text-muted-foreground/90 leading-relaxed">
                  {product.description || product.description_fa}
                </p>
              )}

              {/* Features Checklist */}
              {product.features && product.features.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-card border border-border/80 rounded-2xl p-4">
                  {product.features.map((feat) => (
                    <div key={feat} className="flex items-start gap-2.5">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 mt-0.5">
                        <Check className="h-3 w-3" />
                      </div>
                      <span className="text-xs text-foreground/90 font-medium leading-relaxed">
                        {feat}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Delivery & SLA Specifications */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl border border-border bg-card/60 space-y-1">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-blue-600" />
                    <span>زمان فعال‌سازی:</span>
                  </span>
                  <span className="font-bold text-foreground block">
                    {product.sla_display_text ||
                      (product.delivery_mode === 'UPGRADE_EXISTING'
                        ? `${product.sla_min_minutes || 15} الی ${product.sla_max_minutes || 30} دقیقه`
                        : 'تحویل خودکار ۰ ثانیه‌ای')}
                  </span>
                </div>

                <div className="p-3 rounded-xl border border-border bg-card/60 space-y-1">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Lock className="h-3.5 w-3.5 text-blue-600" />
                    <span>
                      {product.required_customer_input === 'telegram_username'
                        ? 'شیوه احراز:'
                        : product.required_customer_input === 'none'
                          ? 'نحوه دریافت:'
                          : 'امنیت پسورد:'}
                    </span>
                  </span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 block">
                    {product.required_customer_input === 'telegram_username'
                      ? 'آیدی تلگرام (بدون پسورد)'
                      : product.required_customer_input === 'none'
                        ? 'صدور مستقیم و آنی'
                        : 'پروتکل امنیتی Zeroize'}
                  </span>
                </div>

                <div className="p-3 rounded-xl border border-border bg-card/60 space-y-1 col-span-2 sm:col-span-1">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
                    <span>ضمانت اصالت:</span>
                  </span>
                  <span className="font-bold text-foreground block">
                    {selectedPlan?.duration_text
                      ? `گارانتی ${selectedPlan.duration_text}`
                      : selectedPlan?.duration_days
                        ? `گارانتی ${toPersianDigits(selectedPlan.duration_days)} روزه`
                        : product.duration_days
                          ? `گارانتی ${toPersianDigits(product.duration_days)} روزه`
                          : 'ضمانت سلامت و اصالت فعال‌سازی'}
                  </span>
                </div>

                {/* Stock Display Badge */}
                {product?.stock_display_mode === 'show_exact' &&
                  product.available_stock !== undefined &&
                  product.available_stock > 0 && (
                    <div className="p-3 rounded-xl border border-border bg-card/60 space-y-1 col-span-2 sm:col-span-1">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Package className="h-3.5 w-3.5 text-brand" />
                        <span>موجودی در انبار:</span>
                      </span>
                      <span className="font-bold text-foreground block">
                        {toPersianDigits(product.available_stock)} عدد موجود
                      </span>
                    </div>
                  )}
              </div>
            </div>

            {/* Left Column: Interactive Plan Switcher & Checkout Card (5 cols) */}
            <div className="lg:col-span-5">
              <div className="rounded-surface border border-border/80 bg-card p-5 sm:p-6 shadow-surface space-y-6 sticky top-24 relative overflow-hidden">
                {/* Plan Options Selector Grid (Rendered ONLY if product has multiple plans configured in admin) */}
                {product.plans && product.plans.length > 1 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-black text-foreground flex items-center gap-1.5">
                        <Calendar className="h-4 w-4 text-brand" />
                        <span>انتخاب پلن و دوره زمانی:</span>
                      </span>
                      <span className="text-[11px] text-muted-foreground font-sans">
                        {toPersianDigits(product.plans.length)} دوره قابل انتخاب
                      </span>
                    </div>

                    <div className="space-y-2.5 pt-1">
                      {product.plans.map((plan) => {
                        const isSelected = selectedPlan?.id === plan.id
                        return (
                          <button
                            key={plan.id}
                            type="button"
                            onClick={() => setSelectedPlan(plan)}
                            className={`w-full p-3.5 rounded-control border text-right duration-motion ease-motion transition-all flex items-center justify-between gap-3 cursor-pointer ${
                              isSelected
                                ? 'border-brand bg-brand/5 shadow-control'
                                : 'border-border/60 bg-card hover:bg-muted/40 hover:border-border/80'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`h-4.5 w-4.5 rounded-full border flex items-center justify-center transition-colors ${
                                  isSelected
                                    ? 'border-brand bg-brand text-white shadow-xs'
                                    : 'border-muted-foreground/40 bg-muted/20'
                                }`}
                              >
                                {isSelected && (
                                  <Check className="h-2.5 w-2.5" />
                                )}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-xs sm:text-sm text-foreground">
                                    {plan.title}
                                  </span>
                                  {plan.badge && (
                                    <span
                                      className={`px-2 py-0.5 rounded-control text-[10px] font-black transition-colors ${
                                        isSelected
                                          ? 'bg-brand text-white shadow-xs'
                                          : 'bg-muted text-muted-foreground border border-border/40'
                                      }`}
                                    >
                                      {plan.badge}
                                    </span>
                                  )}
                                </div>
                                <span className="text-[11px] text-muted-foreground block mt-0.5">
                                  مدت اعتبار: {plan.duration_text}
                                </span>
                              </div>
                            </div>

                            <div className="text-left shrink-0">
                              {plan.original_price_toman &&
                                plan.original_price_toman >
                                  plan.price_toman && (
                                  <div className="text-[11px] text-muted-foreground/50 line-through font-sans font-medium">
                                    {formatToman(plan.original_price_toman)}
                                  </div>
                                )}
                              <div className="font-black text-sm text-foreground font-sans tracking-tight">
                                {formatToman(plan.price_toman)}{' '}
                                <span className="text-[10px] font-normal text-muted-foreground font-sans">
                                  تومان
                                </span>
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Selected Plan Details & Pricing Banner */}
                <div className="p-4 rounded-surface bg-muted/20 border border-border/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">
                      پلن انتخابی شما:
                    </span>
                    <span className="text-xs font-black text-brand font-mono font-latin">
                      {selectedPlan?.title || product.title_fa}
                    </span>
                  </div>

                  <div className="border-t border-border/40 pt-3 flex items-baseline justify-between">
                    <div>
                      <span className="text-[11px] text-muted-foreground block font-bold">
                        مبلغ قابل پرداخت:
                      </span>
                      {savingsToman > 0 && (
                        <span className="text-[11px] text-emerald-500 font-bold font-sans">
                          تخفیف ویژه ({toPersianDigits(savingsPercent)}٪):{' '}
                          {formatToman(savingsToman)} تومان
                        </span>
                      )}
                    </div>
                    <div className="text-left font-sans">
                      <span className="text-2xl font-black text-foreground tracking-tight font-sans">
                        {formatToman(effectivePrice)}
                      </span>
                      <span className="text-xs text-muted-foreground font-sans mr-1">
                        تومان
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions: In-Place Quantity Counter or Buy Buttons (Graphite System) */}
                <div className="space-y-2 pt-1">
                  {/* Inline Pre-Purchase Notice */}
                  {product.pre_purchase_notice &&
                    (product.pre_purchase_notice_mode === 'inline' ||
                      product.pre_purchase_notice_mode === 'both') && (
                      <div className="p-3.5 rounded-surface border border-amber-500/30 bg-amber-500/5 space-y-2 text-right mb-3">
                        <div className="flex items-center gap-1.5 text-amber-500 font-bold text-xs">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>نکات مهم قبل از خرید و شرایط فعال‌سازی:</span>
                        </div>
                        <div className="text-xs text-muted-foreground leading-relaxed">
                          <MarkdownRenderer
                            content={product.pre_purchase_notice}
                          />
                        </div>
                      </div>
                    )}

                  {(() => {
                    if (isOutOfStock) {
                      return (
                        <div className="p-4 rounded-surface border border-rose-500/30 bg-rose-500/5 text-center space-y-2.5">
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-control bg-rose-500/10 text-rose-500 font-bold text-xs">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>
                              {product?.out_of_stock_text &&
                              product.out_of_stock_text !==
                                'در حال تهیه و تامین مجدد'
                                ? product.out_of_stock_text
                                : 'ناموجود (موجودی صفر)'}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            متاسفانه موجودی این سرویس به اتمام رسیده است و در
                            حال حاضر امکان ثبت سفارش وجود ندارد.
                          </p>
                          <button
                            type="button"
                            onClick={() => setIsStockAlertOpen(true)}
                            className="w-full h-11 rounded-control bg-brand hover:bg-brand/90 text-white font-black text-xs shadow-control flex items-center justify-center gap-2 cursor-pointer duration-motion active:scale-[0.98]"
                          >
                            <Bell className="w-4 h-4" />
                            <span>موجود شد به من اطلاع بده</span>
                          </button>
                        </div>
                      )
                    }

                    const currentCartItem = cart.items.find(
                      (item) =>
                        String(item.product.id) === String(product.id) &&
                        (selectedPlan
                          ? item.plan?.id === selectedPlan.id
                          : !item.plan),
                    )
                    const currentQuantity = currentCartItem
                      ? currentCartItem.quantity
                      : 0

                    if (currentQuantity > 0) {
                      return (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between p-2.5 rounded-control bg-muted/40 border border-border/40 text-xs">
                            <span className="font-bold text-foreground">
                              تعداد در سبد خرید:
                            </span>
                            <QuantitySelector
                              value={currentQuantity}
                              onChange={handleQuantityChange}
                              size="md"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => setIsCartOpen(true)}
                            className="w-full h-11 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs sm:text-sm duration-motion ease-motion active:scale-[0.98] shadow-control flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <span>
                              تکمیل سفارش و تسویه‌حساب (
                              {toPersianDigits(currentQuantity)} عدد)
                            </span>
                            <ArrowLeft className="h-4 w-4" />
                          </button>
                        </div>
                      )
                    }

                    return (
                      <div className="space-y-2">
                        <button
                          type="button"
                          onClick={handleInstantBuy}
                          className="w-full h-11 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs sm:text-sm duration-motion ease-motion active:scale-[0.98] shadow-control flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Zap className="h-4 w-4" />
                          <span>خرید آنی و تسویه‌حساب</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleAddToCart}
                          className="w-full h-10 rounded-control border border-border/60 bg-card hover:bg-muted text-foreground font-bold text-xs duration-motion ease-motion active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors"
                        >
                          <ShoppingCart className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>افزودن به سبد خرید</span>
                        </button>
                      </div>
                    )
                  })()}

                  {addedToast && (
                    <div className="p-2.5 rounded-control bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-center text-xs font-bold flex items-center justify-center gap-1.5 animate-in fade-in">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>پلن مورد نظر به سبد خرید افزوده شد!</span>
                    </div>
                  )}
                </div>

                {/* Guarantee Mini Footer */}
                <div className="pt-3.5 flex items-center justify-around text-[11px] text-muted-foreground text-center border-t border-border/60">
                  <div className="flex flex-col items-center gap-1">
                    <ShieldCheck className="h-4 w-4 text-brand" />
                    <span>ضمانت بازگشت وجه</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <CreditCard className="h-4 w-4 text-brand" />
                    <span>پرداخت امن شاپرک</span>
                  </div>
                  <a
                    href={
                      themeSettings?.support_telegram
                        ? themeSettings.support_telegram.startsWith('http')
                          ? themeSettings.support_telegram
                          : `https://t.me/${themeSettings.support_telegram.replace('@', '')}`
                        : 'https://t.me/AnahixSupport'
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-1 hover:text-brand transition-colors cursor-pointer group"
                  >
                    <TelegramIcon className="h-4 w-4 text-brand group-hover:scale-110 transition-transform" />
                    <span className="font-medium">پشتیبانی در تلگرام</span>
                  </a>
                </div>
              </div>
            </div>
          </section>
        </ScrollReveal>

        {/* SECTION 2: COMPARISON MATRIX TABLE */}
        {((product.comparison_table?.columns &&
          product.comparison_table.columns.length > 0) ||
          Boolean(
            product.comparison_json &&
              !product.comparison_json.trim().startsWith('{'),
          )) && (
          <ScrollReveal>
            <section className="rounded-surface border border-border/80 bg-card p-6 sm:p-8 space-y-6 shadow-surface">
              <div className="text-right space-y-1">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-brand bg-brand/10 px-3 py-1 rounded-control border border-brand/20">
                  <Table className="h-3.5 w-3.5" />
                  <span>بررسی فنی و تفاوت پلن‌ها</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-foreground">
                  جدول مقایسه قابلیت‌ها و نسخه‌های مختلف
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  تفاوت دقیق امکانات نسخه رایگان با اشتراک‌های حرفه‌ای و تیمی
                </p>
              </div>

              {product.comparison_json &&
              !product.comparison_json.trim().startsWith('{') ? (
                <div className="p-4 rounded-surface border border-border/60 bg-muted/20">
                  <MarkdownRenderer content={product.comparison_json} />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="border-b border-border">
                      <tr>
                        <th className="p-4 font-bold text-muted-foreground w-1/3">
                          ویژگی / قابلیت
                        </th>
                        {product.comparison_table?.columns.map((col) => (
                          <th
                            key={col.key}
                            className={`p-4 text-center rounded-control transition ${
                              col.highlight
                                ? 'bg-secondary/90 text-foreground font-black'
                                : 'text-foreground'
                            }`}
                          >
                            <div className="space-y-1">
                              {col.badge && (
                                <span className="inline-block px-2.5 py-0.5 rounded-control text-[10px] font-black bg-primary text-primary-foreground shadow-xs">
                                  {col.badge}
                                </span>
                              )}
                              <div className="font-black text-sm">
                                {col.title}
                              </div>
                              {col.subtitle && (
                                <div className="text-[10px] text-muted-foreground font-normal">
                                  {col.subtitle}
                                </div>
                              )}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {product.comparison_table?.features.map((feat) => (
                        <tr
                          key={feat.name}
                          className="hover:bg-muted/30 transition"
                        >
                          <td className="p-4 font-bold text-foreground">
                            {feat.name}
                          </td>
                          {product.comparison_table?.columns.map((col) => {
                            const val = feat.values[col.key] || '-'
                            return (
                              <td
                                key={`${feat.name}-${col.key}`}
                                className={`p-4 text-center ${
                                  col.highlight
                                    ? 'bg-muted/30 font-bold text-foreground'
                                    : 'text-muted-foreground'
                                }`}
                              >
                                {val === 'فعال' || val === 'نامحدود' ? (
                                  <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                                    <Check className="h-4 w-4" />
                                    <span>{val}</span>
                                  </span>
                                ) : val === 'غیرفعال' || val === 'ندارد' ? (
                                  <span className="text-muted-foreground/60">
                                    {val}
                                  </span>
                                ) : (
                                  <span>{val}</span>
                                )}
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </ScrollReveal>
        )}

        {/* SECTION 3: STEP-BY-STEP ACTIVATION & ANTI-SANCTION / DNS GUIDE */}
        {((product.activation_guide && product.activation_guide.length > 0) ||
          Boolean(
            product.guide_json && !product.guide_json.trim().startsWith('['),
          )) && (
          <ScrollReveal>
            <section className="rounded-surface border border-border/80 bg-card p-6 sm:p-8 space-y-6 shadow-surface">
              <div className="text-right space-y-1">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-brand bg-brand/10 px-3 py-1 rounded-control border border-brand/20">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>راهنمای گام‌به‌گام تحویل</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-foreground">
                  مراحل فعال‌سازی و آموزش استفاده پس از خرید
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  از لحظه پرداخت ریالی تا شروع کار با دستیار هوش مصنوعی
                </p>
              </div>

              {product.guide_json &&
              !product.guide_json.trim().startsWith('[') ? (
                <div className="p-4 rounded-surface border border-border/60 bg-muted/20">
                  <MarkdownRenderer content={product.guide_json} />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {product.activation_guide?.map((step) => (
                    <div
                      key={step.step_number}
                      className="p-5 rounded-surface border border-border/60 bg-muted/20 space-y-3 relative overflow-hidden group hover:border-brand/40 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <span className="h-8 w-8 rounded-control bg-secondary text-brand border border-border/60 font-black text-xs flex items-center justify-center shadow-control">
                          {step.step_number}
                        </span>
                        <span className="text-[11px] font-bold text-muted-foreground font-mono">
                          مرحله {step.step_number}
                        </span>
                      </div>

                      <h4 className="font-bold text-sm text-foreground">
                        {step.title}
                      </h4>

                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {step.description}
                      </p>

                      {step.tip && (
                        <div className="p-2.5 rounded-control bg-card border border-border/60 text-[11px] text-muted-foreground flex items-start gap-1.5 leading-relaxed">
                          <HelpCircle className="h-3.5 w-3.5 text-brand shrink-0 mt-0.5" />
                          <span>{step.tip}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Anti-Sanction & Recommended DNS Helper Card (Shown only when relevant for AI chat/link services) */}
              {(product.category === 'ai_chat' ||
                product.category === 'ai_link') && (
                <div className="rounded-surface border border-brand/30 bg-brand/5 p-5 sm:p-6 space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <Globe className="h-5 w-5 text-brand" />
                      <h4 className="font-bold text-sm text-foreground">
                        راهنمای رفع تحریم و دی‌ان‌اس‌های پیشنهادی (Anti-Sanction
                        DNS)
                      </h4>
                    </div>
                    <span className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold">
                      بدون نیاز به افت سرعت
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    سرویس‌های بین‌المللی نظیر OpenAI و Google ممکن است دسترسی
                    آی‌پی‌های ایران را محدود کرده باشند. با تنظیم رایگان DNSهای
                    زیر روی سیستم، موبایل یا مودم، بدون ارور ۴۰۳ وارد شوید:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    {/* Shecan */}
                    <div className="p-3.5 rounded-xl border border-border bg-card flex items-center justify-between gap-3">
                      <div>
                        <span className="font-bold text-xs text-foreground block">
                          سامانه تحریم‌شکن شکن (Shecan)
                        </span>
                        <span className="font-mono text-xs text-blue-600 dark:text-blue-400 block mt-0.5">
                          178.22.122.100 | 185.51.200.2
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopyDNS(
                            '178.22.122.100, 185.51.200.2',
                            'shecan',
                          )
                        }
                        className="h-8 px-3 rounded-lg border border-border hover:bg-muted text-xs font-semibold flex items-center gap-1 transition"
                      >
                        {copiedDns === 'shecan' ? (
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                        <span>
                          {copiedDns === 'shecan' ? 'کپی شد' : 'کپی DNS'}
                        </span>
                      </button>
                    </div>

                    {/* Electro */}
                    <div className="p-3.5 rounded-xl border border-border bg-card flex items-center justify-between gap-3">
                      <div>
                        <span className="font-bold text-xs text-foreground block">
                          سامانه دی‌ان‌اس الکترو (Electro)
                        </span>
                        <span className="font-mono text-xs text-blue-600 dark:text-blue-400 block mt-0.5">
                          78.157.42.101 | 78.157.42.100
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopyDNS(
                            '78.157.42.101, 78.157.42.100',
                            'electro',
                          )
                        }
                        className="h-8 px-3 rounded-lg border border-border hover:bg-muted text-xs font-semibold flex items-center gap-1 transition"
                      >
                        {copiedDns === 'electro' ? (
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                        <span>
                          {copiedDns === 'electro' ? 'کپی شد' : 'کپی DNS'}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </section>
          </ScrollReveal>
        )}

        {/* SECTION 4: FREQUENTLY ASKED QUESTIONS (FAQ) */}
        {product.faqs && product.faqs.length > 0 && (
          <ScrollReveal>
            <section className="rounded-surface border border-border/80 bg-card p-6 sm:p-8 space-y-6 shadow-surface">
              <div className="text-right space-y-1">
                <h3 className="text-xl sm:text-2xl font-black text-foreground">
                  سوالات متداول خریداران {product.title_fa}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  شفاف‌سازی کامل در مورد اصالت لایسنس، گارانتی و نحوه پشتیبانی
                </p>
              </div>

              <Accordion
                items={product.faqs.map((faq, idx) => ({
                  id: `pdp-faq-${idx}`,
                  title: faq.question,
                  content: faq.answer,
                }))}
                defaultOpenId="pdp-faq-0"
              />
            </section>
          </ScrollReveal>
        )}

        {/* SECTION 4.5: BUYER REVIEWS & SOCIAL PROOF */}
        <ScrollReveal>
          <ProductReviewsSection product={product} customer={customer} />
        </ScrollReveal>

        {/* SECTION 5: 4-PILLAR REASSURANCE TRUST GRID (CUSTOMIZABLE) */}
        {product.instructions !== 'hide' && product.instructions !== 'none' && (
          <section className="rounded-surface border border-border/80 bg-card p-6 sm:p-8 shadow-surface">
            {product.instructions?.trim() &&
            product.instructions !== 'default' ? (
              <div className="space-y-4">
                <MarkdownRenderer content={product.instructions} />
              </div>
            ) : (
              <>
                <div className="text-center mb-6">
                  <h3 className="text-lg font-black text-foreground">
                    ضمانت‌های رسمی خرید از {getSiteBrandName()}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    ساختار امنیتی و استانداردهای پرداختی منطبق با بانکداری
                    بین‌المللی
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-right">
                  <div className="p-4 rounded-surface bg-muted/30 border border-border/60 space-y-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-control bg-primary/10 text-primary font-black">
                      <Zap className="h-5 w-5" />
                    </div>
                    <h4 className="font-bold text-xs sm:text-sm text-foreground">
                      تحویل آنی و مطمئن
                    </h4>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      صدور ۰ ثانیه‌ای لایسنس‌ها بلافاصله پس از پرداخت بدون
                      کوچکترین معطلی.
                    </p>
                  </div>

                  <div className="p-4 rounded-surface bg-muted/30 border border-border/60 space-y-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-control bg-primary/10 text-primary font-black">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <h4 className="font-bold text-xs sm:text-sm text-foreground">
                      ضمانت عدم قطعی
                    </h4>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      پرداخت با کارت‌های قانونی بین‌المللی و پوشش کامل گارانتی
                      تعویض ۳۰ روزه.
                    </p>
                  </div>

                  <div className="p-4 rounded-surface bg-muted/30 border border-border/60 space-y-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-control bg-primary/10 text-primary font-black">
                      <Lock className="h-5 w-5" />
                    </div>
                    <h4 className="font-bold text-xs sm:text-sm text-foreground">
                      پروتکل Zeroize پسورد
                    </h4>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      امحای کامل و برگشت‌ناپذیر اطلاعات پسورد پس از تکمیل
                      فعال‌سازی.
                    </p>
                  </div>

                  <div className="p-4 rounded-surface bg-muted/30 border border-border/60 space-y-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-control bg-primary/10 text-primary font-black">
                      <Headphones className="h-5 w-5" />
                    </div>
                    <h4 className="font-bold text-xs sm:text-sm text-foreground">
                      پشتیبانی ۲۴ ساعته
                    </h4>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      پاسخگویی سریع تیم پشتیبانی فنی و حل آنلاین مشکلات کاربران.
                    </p>
                  </div>
                </div>
              </>
            )}
          </section>
        )}
      </main>

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        customer={customer}
        payments={payments}
        onSubmit={handleCartCheckoutSubmit}
      />

      {/* Pre-Purchase Notice Modal */}
      {isNoticeModalOpen && product && (
        <PrePurchaseNoticeModal
          isOpen={isNoticeModalOpen}
          product={product}
          plan={selectedPlan}
          onConfirm={executeInstantBuy}
          onClose={() => setIsNoticeModalOpen(false)}
        />
      )}

      {/* Post-Purchase Order Success & Fulfillment Modal */}
      <OrderSuccessModal
        isOpen={Boolean(successOrderModal)}
        order={successOrderModal}
        onClose={() => setSuccessOrderModal(null)}
      />

      {/* Stock Alert Modal */}
      {product && (
        <StockAlertModal
          isOpen={isStockAlertOpen}
          onClose={() => setIsStockAlertOpen(false)}
          product={product}
          planTitle={selectedPlan?.title}
        />
      )}

      {/* Customer Auth Modal for Gated Instant Buy Action */}
      <AuthModal
        isOpen={isAuthOpen}
        initialMode="login"
        onClose={() => setIsAuthOpen(false)}
        onSuccess={() => {
          setIsAuthOpen(false)
          if (product) {
            cartStore.addItem(product, 1, selectedPlan || undefined)
            setIsCartOpen(true)
          }
        }}
      />
    </div>
  )
}
