import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  CreditCard,
  Globe,
  Headphones,
  HelpCircle,
  Lock,
  RefreshCw,
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
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AuthModal } from '../components/AuthModal'
import {
  ClaudeIcon,
  CursorIcon,
  GeminiIcon,
  OpenAIIcon,
} from '../components/BrandIcons'
import { CartDrawer } from '../components/CartDrawer'
import { Header } from '../components/Header'
import { ProductReviewsSection } from '../components/reviews/ProductReviewsSection'
import { TelegramIcon } from '../components/SocialIcons'
import { Badge } from '../components/ui/badge'
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

function toPersianDigits(n: number | string): string {
  const f = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']
  return String(n).replace(/\d/g, (d) => f[Number(d)])
}

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
  const navigate = useNavigate()
  const cart = useCart()

  const [product, setProduct] = useState<ProductDetail | null>(null)
  const [payments, setPayments] = useState<PaymentGateway[]>([])
  const [customer, setCustomer] = useState<CustomerProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Plan selection state
  const [selectedPlan, setSelectedPlan] = useState<ProductPlan | null>(null)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [addedToast, setAddedToast] = useState(false)
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const { warning } = useNotification()

  // FAQ accordion state
  const [openFaqs, setOpenFaqs] = useState<Record<number, boolean>>({
    0: true,
  })

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
        const [prodData, paysData, custData] = await Promise.all([
          apiService.getProductBySlug(slug),
          apiService.getPayments(),
          apiService.getCustomerProfile(),
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

        // Select default plan or first plan
        const plans = prodData.plans || []
        const def =
          plans.find((p: ProductPlan) => p.is_default) || plans[0] || null
        setSelectedPlan(def)

        // Dynamic SEO Head injection
        const seoTitle =
          prodData.seo?.meta_title ||
          prodData.meta_title ||
          `خرید ${prodData.title_fa} (${prodData.title_en}) | تحویل قانونی و آنی - آناهیکس`
        const seoDesc =
          prodData.seo?.meta_description ||
          prodData.meta_description ||
          prodData.description_fa ||
          `خرید اشتراک قانونی ${prodData.title_fa} با بهترین قیمت، فعال‌سازی فوری، ضمانت عدم قطعی و پشتیبانی شبانه‌روزی در آناهیکس.`

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
      document.title =
        'آناهیکس (Anahix) | مرجع رسمی اشتراک‌های قانونی هوش مصنوعی و شماره مجازی'
    }
  }, [])

  // Brand Icon helper
  const getBrandDetails = () => {
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
      icon: <CursorIcon className="h-8 w-8 text-sky-600 dark:text-sky-400" />,
      bg: 'bg-sky-500/10 border-sky-500/20 text-sky-600',
      brandName: 'Anahix Service',
    }
  }

  // Handle Add to Cart
  const handleAddToCart = () => {
    if (!product) return
    cartStore.addItem(product, 1, selectedPlan || undefined)
    setAddedToast(true)
    setTimeout(() => setAddedToast(false), 3000)
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
    if (!product) return
    if (!apiService.isCustomerLoggedIn()) {
      warning(
        'نیاز به ورود به حساب کاربری',
        'برای خرید آنی و نهایی‌سازی سفارش، لطفاً ابتدا وارد حساب کاربری خود شوید یا ثبت‌نام کنید.',
      )
      setIsAuthOpen(true)
      return
    }
    cartStore.addItem(product, 1, selectedPlan || undefined)
    setIsCartOpen(true)
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
    navigate(`/track?order_no=${encodeURIComponent(newOrder.order_no)}`)
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
        <main className="flex-1 max-w-7xl mx-auto px-4 py-24 w-full flex flex-col items-center justify-center space-y-3">
          <RefreshCw className="h-10 w-10 text-blue-600 animate-spin" />
          <h2 className="font-bold text-sm text-foreground">
            در حال بارگذاری صفحه اختصاصی محصول...
          </h2>
          <p className="text-xs text-muted-foreground">
            دریافت اطلاعات پلن‌ها، قیمت‌های زنده و جدول مقایسه
          </p>
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
        <main className="flex-1 max-w-3xl mx-auto px-4 py-20 w-full text-center space-y-4">
          <div className="h-16 w-16 rounded-3xl bg-rose-500/10 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-black text-foreground">محصول یافت نشد</h2>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
            {error || 'آدرس محصول نامعتبر است یا محصول از کاتالوگ حذف شده است.'}
          </p>
          <div className="pt-2">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition"
            >
              <ArrowRight className="h-4 w-4" />
              <span>بازگشت به ویترین اصلی فروشگاه</span>
            </Link>
          </div>
        </main>
      </div>
    )
  }

  const brand = getBrandDetails()
  const effectivePrice = selectedPlan?.price_toman ?? product.price_toman
  const originalPrice =
    selectedPlan?.original_price_toman ||
    Math.round((effectivePrice * 1.18) / 10000) * 10000
  const savingsToman = Math.max(0, originalPrice - effectivePrice)
  const savingsPercent = Math.round((savingsToman / originalPrice) * 100)

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans transition-colors duration-200">
      <Header
        activeOrdersCount={
          orders.filter((o) => o.status !== 'COMPLETED').length
        }
        onOpenCart={() => setIsCartOpen(true)}
      />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full space-y-12">
        {/* Breadcrumb Navigation */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 text-xs text-muted-foreground"
        >
          <Link
            to="/"
            className="hover:text-blue-600 transition flex items-center gap-1"
          >
            <span>صفحه اصلی</span>
          </Link>
          <span>/</span>
          <Link to="/#catalog" className="hover:text-blue-600 transition">
            {product.category === 'ai_chat'
              ? 'هوش مصنوعی و چت‌بات'
              : product.category === 'coding_ai'
                ? 'دستیار کدنویسی'
                : 'کاتالوگ سرویس‌ها'}
          </Link>
          <span>/</span>
          <span className="text-foreground font-semibold truncate max-w-[200px] sm:max-w-none">
            {product.title_fa}
          </span>
        </nav>

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
                    <span>لایسنس ۱۰۰٪ قانونی و دائمی</span>
                  </div>
                </div>

                {product.delivery_mode === 'UPGRADE_EXISTING' ? (
                  <Badge
                    variant="amber"
                    className="gap-1.5 text-xs font-bold py-1 px-3"
                  >
                    <UserCheck className="h-3.5 w-3.5" />
                    ارتقا روی اکانت شخصی (Mode C)
                  </Badge>
                ) : (
                  <Badge
                    variant="blue"
                    className="gap-1.5 text-xs font-bold py-1 px-3 bg-muted text-foreground border border-border/60"
                  >
                    <Zap className="h-3.5 w-3.5 text-brand" />
                    تحویل آنی
                  </Badge>
                )}

                <a
                  href="#product-reviews"
                  className="inline-flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1 rounded-full border border-amber-500/20 font-bold transition mr-auto"
                >
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  <span>نظرات خریداران قطعی</span>
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
              <p className="text-sm text-muted-foreground/90 leading-relaxed">
                {product.description || product.description_fa}
              </p>

              {/* Features Checklist */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-card border border-border/80 rounded-2xl p-4">
                {(product.features || []).map((feat) => (
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
                    <span>امنیت پسورد:</span>
                  </span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 block">
                    پروتکل Zeroize
                  </span>
                </div>

                <div className="p-3 rounded-xl border border-border bg-card/60 space-y-1 col-span-2 sm:col-span-1">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
                    <span>ضمانت اصالت:</span>
                  </span>
                  <span className="font-bold text-foreground block">
                    گارانتی کامل ۳۰ روزه
                  </span>
                </div>
              </div>
            </div>

            {/* Left Column: Interactive Plan Switcher & Checkout Card (5 cols) */}
            <div className="lg:col-span-5">
              <div className="rounded-surface border border-border/60 bg-card p-5 sm:p-6 shadow-surface space-y-6 sticky top-24 relative overflow-hidden">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black text-foreground flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-blue-600" />
                      <span>انتخاب پلن و دوره زمانی:</span>
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {(product.plans || []).length} دوره قابل انتخاب
                    </span>
                  </div>

                  {/* Plan Options Selector Grid */}
                  <div className="space-y-2.5 pt-1">
                    {(product.plans || []).map((plan) => {
                      const isSelected = selectedPlan?.id === plan.id
                      return (
                        <button
                          key={plan.id}
                          type="button"
                          onClick={() => setSelectedPlan(plan)}
                          className={`w-full p-3.5 rounded-control border text-right duration-motion ease-motion transition-all flex items-center justify-between gap-3 cursor-pointer ${
                            isSelected
                              ? 'border-foreground/40 bg-muted/70 ring-1 ring-foreground/20'
                              : 'border-border/30 bg-muted/20 hover:bg-muted/50 hover:border-border/60'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`h-4.5 w-4.5 rounded-full border flex items-center justify-center transition-colors ${
                                isSelected
                                  ? 'border-primary bg-primary text-primary-foreground'
                                  : 'border-muted-foreground/40'
                              }`}
                            >
                              {isSelected && <Check className="h-2.5 w-2.5" />}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs sm:text-sm text-foreground">
                                  {plan.title}
                                </span>
                                {plan.badge && (
                                  <span className="px-2 py-0.5 rounded-control text-[10px] font-black bg-brand/15 text-brand border border-brand/20">
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
                              plan.original_price_toman > plan.price_toman && (
                                <div className="text-[10px] text-muted-foreground line-through font-latin">
                                  {plan.original_price_toman.toLocaleString(
                                    'fa-IR',
                                  )}
                                </div>
                              )}
                            <div className="font-black text-sm text-foreground font-latin">
                              {plan.price_toman.toLocaleString('fa-IR')}{' '}
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

                {/* Selected Plan Details & Pricing Banner */}
                <div className="p-4 rounded-surface bg-muted/30 border border-border/60 space-y-3">
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
                      <span className="text-[11px] text-muted-foreground block">
                        مبلغ قابل پرداخت:
                      </span>
                      {savingsToman > 0 && (
                        <span className="text-[11px] text-emerald-400 font-bold font-latin">
                          تخفیف ویژه ({toPersianDigits(savingsPercent)}٪):{' '}
                          {savingsToman.toLocaleString('fa-IR')} تومان
                        </span>
                      )}
                    </div>
                    <div className="text-left font-latin">
                      <span className="text-2xl font-black text-foreground tracking-tight font-mono">
                        {effectivePrice.toLocaleString('fa-IR')}
                      </span>
                      <span className="text-xs text-muted-foreground font-sans mr-1">
                        تومان
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions: In-Place Quantity Counter or Buy Buttons (Graphite System) */}
                <div className="space-y-2 pt-1">
                  {(() => {
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
                          className="w-full h-10 rounded-control border border-border/40 bg-card hover:bg-muted text-foreground font-bold text-xs duration-motion ease-motion active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
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
                <div className="pt-3 flex items-center justify-around text-[11px] text-muted-foreground text-center border-t border-border/40">
                  <div className="flex flex-col items-center gap-1">
                    <ShieldCheck className="h-4 w-4 text-brand" />
                    <span>ضمانت بازگشت وجه</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <CreditCard className="h-4 w-4 text-brand" />
                    <span>پرداخت امن شاپرک</span>
                  </div>
                  <a
                    href="https://t.me/AnahixSupport"
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
        {product.comparison_table?.columns &&
          product.comparison_table.columns.length > 0 && (
            <ScrollReveal>
              <section className="rounded-3xl border border-border bg-card p-6 sm:p-8 space-y-6">
                <div className="text-right space-y-1">
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
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

                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="border-b border-border">
                      <tr>
                        <th className="p-4 font-bold text-muted-foreground w-1/3">
                          ویژگی / قابلیت
                        </th>
                        {product.comparison_table.columns.map((col) => (
                          <th
                            key={col.key}
                            className={`p-4 text-center rounded-2xl transition ${
                              col.highlight
                                ? 'bg-blue-600/10 border-2 border-blue-500/30 text-blue-600 dark:text-blue-400'
                                : 'text-foreground'
                            }`}
                          >
                            <div className="space-y-1">
                              {col.badge && (
                                <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-600 text-white">
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
                      {product.comparison_table.features.map((feat) => (
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
                                    ? 'bg-blue-500/5 font-bold text-foreground'
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
              </section>
            </ScrollReveal>
          )}

        {/* SECTION 3: STEP-BY-STEP ACTIVATION & ANTI-SANCTION / DNS GUIDE */}
        {product.activation_guide && product.activation_guide.length > 0 && (
          <ScrollReveal>
            <section className="rounded-3xl border border-border bg-card p-6 sm:p-8 space-y-8">
              <div className="text-right space-y-1">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
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

              {/* 4 Steps Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {product.activation_guide.map((step) => (
                  <div
                    key={step.step_number}
                    className="p-5 rounded-2xl border border-border bg-background space-y-3 relative overflow-hidden group hover:border-blue-500/40 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="h-8 w-8 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center shadow-sm">
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
                      <div className="p-2.5 rounded-xl bg-muted/50 border border-border/60 text-[11px] text-muted-foreground flex items-start gap-1.5 leading-relaxed">
                        <HelpCircle className="h-3.5 w-3.5 text-blue-600 shrink-0 mt-0.5" />
                        <span>{step.tip}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Anti-Sanction & Recommended DNS Helper Card */}
              <div className="rounded-2xl border border-blue-500/30 bg-blue-500/5 p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-blue-600" />
                    <h4 className="font-bold text-sm text-foreground">
                      راهنمای رفع تحریم و دی‌ان‌اس‌های پیشنهادی (Anti-Sanction DNS)
                    </h4>
                  </div>
                  <span className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold">
                    بدون نیاز به افت سرعت
                  </span>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  سرویس‌های بین‌المللی نظیر OpenAI و Google ممکن است دسترسی
                  آی‌پی‌های ایران را محدود کرده باشند. با تنظیم رایگان DNSهای زیر
                  روی سیستم، موبایل یا مودم، بدون ارور ۴۰۳ وارد شوید:
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
                        handleCopyDNS('178.22.122.100, 185.51.200.2', 'shecan')
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
                        handleCopyDNS('78.157.42.101, 78.157.42.100', 'electro')
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
            </section>
          </ScrollReveal>
        )}

        {/* SECTION 4: FREQUENTLY ASKED QUESTIONS (FAQ) */}
        {product.faqs && product.faqs.length > 0 && (
          <ScrollReveal>
            <section className="rounded-3xl border border-border bg-card p-6 sm:p-8 space-y-6">
              <div className="text-right space-y-1">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                  <HelpCircle className="h-3.5 w-3.5" />
                  <span>پاسخ به سوالات پرتکرار</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-foreground">
                  سوالات متداول خریداران {product.title_fa}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  شفاف‌سازی کامل در مورد اصالت لایسنس، گارانتی و نحوه پشتیبانی
                </p>
              </div>

              <div className="space-y-3">
                {product.faqs.map((faq, idx) => {
                  const isOpen = openFaqs[idx]
                  return (
                    <div
                      key={faq.question}
                      className="rounded-2xl border border-border bg-background overflow-hidden transition-all"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setOpenFaqs((prev) => ({
                            ...prev,
                            [idx]: !prev[idx],
                          }))
                        }
                        className="w-full p-4 sm:p-5 text-right font-bold text-xs sm:text-sm text-foreground flex items-center justify-between gap-3 hover:bg-muted/40 transition"
                      >
                        <span>{faq.question}</span>
                        {isOpen ? (
                          <ChevronUp className="h-4 w-4 text-blue-600 shrink-0" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                        )}
                      </button>
                      {isOpen && (
                        <div className="px-5 pb-5 pt-1 text-xs text-muted-foreground leading-relaxed border-t border-border/50 animate-in fade-in">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>
          </ScrollReveal>
        )}

        {/* SECTION 4.5: BUYER REVIEWS & SOCIAL PROOF */}
        <ScrollReveal>
          <ProductReviewsSection product={product} customer={customer} />
        </ScrollReveal>

        {/* SECTION 5: 4-PILLAR REASSURANCE TRUST GRID */}
        <section className="rounded-3xl border border-border bg-card p-6 sm:p-8">
          <div className="text-center mb-6">
            <h3 className="text-lg font-black text-foreground">
              ضمانت‌های رسمی خرید از آناهیکس (Anahix)
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              ساختار امنیتی و استانداردهای پرداختی منطبق با بانکداری بین‌المللی
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-right">
            <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 space-y-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 font-black">
                <Zap className="h-5 w-5" />
              </div>
              <h4 className="font-bold text-xs sm:text-sm text-foreground">
                تحویل آنی و مطمئن
              </h4>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                صدور ۰ ثانیه‌ای لایسنس‌ها بلافاصله پس از پرداخت بدون کوچکترین
                معطلی.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 space-y-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 font-black">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h4 className="font-bold text-xs sm:text-sm text-foreground">
                ضمانت عدم قطعی
              </h4>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                پرداخت با مسترکارت قانونی و پوشش کامل گارانتی تعویض ۳۰ روزه.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 space-y-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 font-black">
                <Lock className="h-5 w-5" />
              </div>
              <h4 className="font-bold text-xs sm:text-sm text-foreground">
                پروتکل Zeroize پسورد
              </h4>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                امحای کامل و برگشت‌ناپذیر اطلاعات پسورد پس از تکمیل فعال‌سازی.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 space-y-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 font-black">
                <Headphones className="h-5 w-5" />
              </div>
              <h4 className="font-bold text-xs sm:text-sm text-foreground">
                پشتیبانی ۲۴ ساعته
              </h4>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                پاسخگویی سریع تیم پشتیبانی فنی در تلگرام (@AnahixSupport).
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        customer={customer}
        payments={payments}
        onSubmit={handleCartCheckoutSubmit}
      />

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
