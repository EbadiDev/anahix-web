import {
  BookOpen,
  CreditCard,
  Headphones,
  HelpCircle,
  Lock,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Zap,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BrandIcons } from '../components/BrandIcons'
import { CartDrawer } from '../components/CartDrawer'
import { Header } from '../components/Header'
import { ProductCard } from '../components/ProductCard'
import { Input } from '../components/ui/input'
import { Accordion } from '../components/vibefarsi/Accordion'
import { Alert } from '../components/vibefarsi/Alert'
import { ArrowLink } from '../components/vibefarsi/ArrowLink'
import {
  BannerCarousel,
  type BannerData,
} from '../components/vibefarsi/BannerCarousel'
import { FlashSaleCountdown } from '../components/vibefarsi/FlashSaleCountdown'
import { GridPattern } from '../components/vibefarsi/GridPattern'
import { LikeButton } from '../components/vibefarsi/LikeButton'
import { QuickServicesGrid } from '../components/vibefarsi/QuickServicesGrid'
import { RangeSlider } from '../components/vibefarsi/RangeSlider'
import { ShimmerButton } from '../components/vibefarsi/ShimmerButton'
import { Stepper } from '../components/vibefarsi/Stepper'
import { TypewriterText } from '../components/vibefarsi/TypewriterText'
import { useCart } from '../lib/cartStore'
import { api, apiService } from '../services/api'
import type {
  ArticleListItem,
  CustomerProfile,
  Order,
  PaymentGateway,
  Product,
} from '../types'

interface StorefrontPageProps {
  orders: Order[]
  onOrderCreated: (order: Order) => void
  setBalance?: React.Dispatch<React.SetStateAction<number>>
}

function toPersianDigits(n: number | string): string {
  const f = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']
  return String(n).replace(/\d/g, (d) => f[Number(d)])
}

export const StorefrontPage: React.FC<StorefrontPageProps> = ({
  orders,
  onOrderCreated,
  setBalance,
}) => {
  const navigate = useNavigate()
  const cart = useCart()
  const [customer, setCustomer] = useState<CustomerProfile | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [banners, setBanners] = useState<BannerData[]>([])
  const [articles, setArticles] = useState<ArticleListItem[]>([])
  const [payments, setPayments] = useState<PaymentGateway[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [maxPriceFilter, setMaxPriceFilter] = useState<number>(10000000)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function init() {
      setLoading(true)
      try {
        const [prods, pays, cust, bns, arts] = await Promise.all([
          apiService.getProducts(),
          apiService.getPayments(),
          apiService.getCustomerProfile(),
          api.getBanners('main_slider').catch(() => []),
          api
            .getArticles({ page: 1, page_size: 3 })
            .then((r: any) => r?.items || [])
            .catch(() => []),
        ])
        setProducts(prods)
        setPayments(pays)
        if (cust) setCustomer(cust)
        if (bns && bns.length > 0) {
          setBanners(bns)
        }
        if (arts && arts.length > 0) {
          setArticles(arts)
        }
      } catch (e) {
        console.error('Failed to load initial storefront data', e)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

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

  const categories = [
    { id: 'all', label: 'همه سرویس‌ها' },
    { id: 'ai_chat', label: 'هوش مصنوعی و چت‌بات' },
    { id: 'coding_ai', label: 'دستیار کدنویسی' },
    { id: 'personal_upgrade', label: 'ارتقای اکانت شخصی' },
    { id: 'cloud_storage', label: 'فضای ابری و گوگل وان' },
  ]

  const filteredProducts = products.filter((p) => {
    const matchesCategory =
      selectedCategory === 'all' || p.category === selectedCategory
    const query = searchQuery.trim().toLowerCase()
    const matchesSearch =
      !query ||
      p.title_fa.toLowerCase().includes(query) ||
      p.title_en.toLowerCase().includes(query) ||
      p.description_fa.toLowerCase().includes(query)
    const matchesPrice = p.price_toman <= maxPriceFilter
    return matchesCategory && matchesSearch && matchesPrice
  })

  // Flash Sale Products
  const flashSaleProducts = products.filter(
    (p) => p.is_flash_sale && p.flash_sale_price_toman,
  )

  // Best Sellers Products
  const bestSellerProducts = products
    .filter((p) => p.is_best_seller || p.is_featured)
    .slice(0, 3)

  const faqItems = [
    {
      id: 'faq-1',
      title: 'آیا اشتراک‌ها قانونی پرداخت می‌شوند و قطعی نخواهند داشت؟',
      content:
        'بله، تمامی اشتراک‌های آناهیکس به صورت ۱۰۰٪ قانونی توسط کارت‌های اعتباری بین‌المللی اختصاصی و بدون استفاده از روش‌های پرخطر یا اشتراکی هکی پرداخت می‌شوند. در طول دوره اشتراک ضمانت کامل و عدم قطعی ارائه می‌گردد.',
    },
    {
      id: 'faq-2',
      title: 'تفاوت تحویل لینک فوری و ارتقای اکانت شخصی چیست؟',
      content:
        'در حالت «لینک فوری»، بلافاصله پس از پرداخت لینک دعوت فمیلی اختصاصی برای شما صادر شده و درجا روی جیمیل شما فعال می‌شود. در حالت «ارتقای اکانت شخصی»، اپراتور متخصص آناهیکس با ورود امن و تبادل لایو کد ۲FA اشتراک را مستقیم روی اکانت خودتان تمدید می‌کند.',
    },
    {
      id: 'faq-3',
      title: 'سیاست امنیتی Zeroize رمزهای عبور چگونه کار می‌کند؟',
      content:
        'در سیستم آناهیکس، اطلاعات حساس و کلمه عبور وارد شده توسط الگوریتم رمزنگاری نامتقارن محافظت شده و بلافاصله پس از تکمیل فرآیند فعال‌سازی توسط اپراتور، رمز عبور به طور برگشت‌ناپذیر از پایگاه داده سرور پاکسازی (Zeroize) می‌شود.',
    },
    {
      id: 'faq-4',
      title: 'در صورت بروز مشکل در فرآیند فعال‌سازی چه باید کرد؟',
      content:
        'پشتیبانی ۲۴ ساعته تلگرام آناهیکس (@AnahixSupport) آماده پاسخگویی سریع است. همچنین می‌توانید با شماره سفارش خود وضعیت را در تب «پیگیری سفارش» لحظه‌ای رصد نمایید.',
    },
  ]

  const workflowSteps = [
    {
      number: 1,
      title: 'انتخاب پلن و مدت زمان',
      description: 'انتخاب هوش مصنوعی، ظرفیت یا شماره مجازی دلخواه',
      status: 'completed' as const,
    },
    {
      number: 2,
      title: 'پرداخت امن عضو شتاب و تتر',
      description: 'تسویه حساب فوری با کلیه کارت‌های بانکی یا رمز ارز',
      status: 'current' as const,
    },
    {
      number: 3,
      title: 'تحویل ۰ ثانیه‌ای لایسنس',
      description: 'صدور آنی اکانت و فعال‌سازی قانونی بدون معطلی',
      status: 'upcoming' as const,
    },
  ]

  // End time for Flash Sale countdown (48 hours from now)
  const flashSaleTargetDate = new Date(Date.now() + 48 * 3600 * 1000)

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans transition-colors duration-200">
      {/* Navigation Header */}
      <Header
        activeOrdersCount={
          orders.filter((o) => o.status !== 'COMPLETED').length
        }
        onOpenCart={() => setIsCartOpen(true)}
      />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full space-y-10 sm:space-y-12">
        {/* GRAPHITE SECURITY ALERT BANNER */}
        <Alert
          variant="graphite"
          title="زیرساخت امنیتی اختصاصی و تحویل رسمی لایسنس‌ها"
        >
          تمامی اکانت‌ها و اشتراک‌های آناهیکس به صورت ۱۰۰٪ قانونی با مسترکارت‌های
          بین‌المللی پرداخت شده و تحت پروتکل امنیتی Zeroize پس از فعال‌سازی
          هیچ‌گونه رمز عبوری در سرور باقی نخواهد ماند.
        </Alert>

        {/* HERO SECTION WITH TYPEWRITER & VIBE FARSI GRID */}
        <section
          className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 sm:p-10"
          style={{ boxShadow: 'var(--depth-surface)' }}
        >
          <GridPattern
            squares={[
              [2, 1],
              [5, 2],
              [8, 3],
              [14, 2],
            ]}
          />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Hero Left/Right Content */}
            <div className="lg:col-span-7 space-y-4 text-right">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-500">
                <Zap className="h-3.5 w-3.5" />
                <span>تحویل ۰ ثانیه‌ای لایسنس و اکانت‌های هوش مصنوعی</span>
              </div>

              <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight text-foreground leading-tight">
                خرید قانونی اشتراک‌های{' '}
                <TypewriterText
                  words={[
                    'ChatGPT Plus',
                    'Claude 3.7 Sonnet',
                    'Gemini Advanced',
                    'Cursor AI Pro',
                    'Google One 2TB',
                  ]}
                  className="text-blue-500 font-latin"
                />
              </h1>

              <p className="text-xs sm:text-base text-muted-foreground leading-relaxed max-w-xl">
                دسترسی مستقیم و پایدار به قدرتمندترین ابزارهای هوش مصنوعی روز
                جهان با پرداخت ریالی عضو شتاب، تضمین بدون مسدودی و پروتکل امنیتی
                Zeroize.
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-blue-500" />
                  <span>ضمانت کامل بازگشت وجه</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Lock className="h-4 w-4 text-blue-500" />
                  <span>پروتکل امنیت کلمه عبور (Zeroize)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CreditCard className="h-4 w-4 text-blue-500" />
                  <span>پرداخت عضو شتاب و تتر</span>
                </div>
              </div>

              <div className="pt-3 flex items-center gap-3">
                <a href="#products-catalog">
                  <ShimmerButton className="text-xs sm:text-sm font-bold px-6 py-3">
                    <span>مشاهده کاتالوگ اشتراک‌ها</span>
                    <span>←</span>
                  </ShimmerButton>
                </a>
                <Link
                  to="/virtual-numbers"
                  className="px-5 py-3 rounded-2xl border border-border bg-card hover:bg-muted text-xs sm:text-sm font-bold text-foreground transition-all hover:scale-[1.01]"
                >
                  شماره مجازی (SMS)
                </Link>
              </div>
            </div>

            {/* Hero Slider/Banner Column */}
            <div className="lg:col-span-5">
              {banners.length > 0 ? (
                <BannerCarousel banners={banners} />
              ) : (
                <div
                  className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-blue-600/10 via-indigo-600/10 to-zinc-900/40 p-6 text-right space-y-3"
                  style={{ boxShadow: 'var(--depth-surface)' }}
                >
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/20 text-blue-400 px-3 py-1 text-xs font-bold">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>پیشنهاد برگزیده ماه</span>
                  </div>
                  <h3 className="text-xl font-black text-foreground">
                    Google Gemini Advanced ۱۸ ماهه قانونی
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    با ۲ ترابایت فضای ابری گوگل وان و دسترسی کامل به Gemini 1.5
                    Pro با نازل‌ترین هزینه ریالی
                  </p>
                  <ArrowLink to="/products/gemini-advanced-18m">
                    سفارش آنی سرویس
                  </ArrowLink>
                </div>
              )}
            </div>
          </div>

          {/* Supported Brand Logos Strip */}
          <div className="mt-8 pt-6 border-t border-border/60">
            <div className="text-[11px] font-bold text-muted-foreground mb-3">
              پشتیبانی از برترین سرویس‌ها و پلتفرم‌های جهان:
            </div>
            <BrandIcons />
          </div>
        </section>

        {/* WORKFLOW STEPS STEPPER */}
        <section
          className="rounded-2xl border border-border bg-card p-5 sm:p-6"
          style={{ boxShadow: 'var(--depth-surface)' }}
        >
          <Stepper steps={workflowSteps} />
        </section>

        {/* QUICK SERVICES ACCESS GRID */}
        <section>
          <QuickServicesGrid
            onSelectCategory={(cat) => setSelectedCategory(cat)}
          />
        </section>

        {/* FLASH SALE / TIMED DISCOUNTS SECTION */}
        {flashSaleProducts.length > 0 && (
          <section id="flash-sale" className="space-y-4">
            <FlashSaleCountdown endTime={flashSaleTargetDate} />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {flashSaleProducts.map((product) => (
                <ProductCard
                  key={`flash-${product.id}`}
                  product={product}
                  onSelect={() => setIsCartOpen(true)}
                />
              ))}
            </div>
          </section>
        )}

        {/* BEST SELLERS / POPULAR PRODUCTS */}
        {bestSellerProducts.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-black text-foreground flex items-center gap-2">
                  <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                  <span>پرفروش‌ترین و محبوب‌ترین اشتراک‌ها</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  انتخاب اول متخصصان، برنامه‌نویسان و تولیدکنندگان محتوا
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bestSellerProducts.map((product) => (
                <ProductCard
                  key={`bestseller-${product.id}`}
                  product={product}
                  onSelect={() => setIsCartOpen(true)}
                />
              ))}
            </div>
          </section>
        )}

        {/* MAIN PRODUCTS CATALOG & FILTER BAR (WITH CATEGORIES + RANGE SLIDER) */}
        <section id="products-catalog" className="space-y-6">
          <div
            className="rounded-2xl border border-border bg-card p-5 space-y-4"
            style={{ boxShadow: 'var(--depth-surface)' }}
          >
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              {/* Category tabs */}
              <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      selectedCategory === cat.id
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-zinc-900 border border-zinc-800 text-muted-foreground hover:text-foreground hover:bg-zinc-800'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Search Input */}
              <div className="relative w-full md:w-80">
                <Input
                  type="text"
                  placeholder="جستجوی سرویس (مثلاً Gemini، ChatGPT)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10 text-xs rounded-xl bg-zinc-900 border-zinc-800 h-10"
                />
                <Search className="h-4 w-4 text-muted-foreground absolute right-3.5 top-3 pointer-events-none" />
              </div>
            </div>

            {/* Range Slider for Price Filtering */}
            <div className="pt-3 border-t border-border/60 max-w-sm">
              <RangeSlider
                min={200000}
                max={10000000}
                step={100000}
                value={maxPriceFilter}
                onChange={(val) => setMaxPriceFilter(val)}
                label="فیلتر بر اساس سقف قیمت:"
              />
            </div>
          </div>

          {/* Product Grid */}
          <div>
            {loading ? (
              <div className="py-20 text-center space-y-3">
                <RefreshCw className="h-8 w-8 text-blue-500 animate-spin mx-auto" />
                <p className="text-xs text-muted-foreground">
                  در حال بارگذاری اشتراک‌ها و موجودی لایسنس‌ها...
                </p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div
                className="rounded-2xl border border-border bg-card p-12 text-center text-muted-foreground space-y-2"
                style={{ boxShadow: 'var(--depth-surface)' }}
              >
                <HelpCircle className="h-8 w-8 mx-auto text-muted-foreground/60" />
                <div className="font-bold text-sm text-foreground">
                  محصولی با این مشخصات یافت نشد
                </div>
                <p className="text-xs">
                  لطفاً کلمه کلیدی دیگری را جستجو کنید یا فیلتر قیمت را افزایش
                  دهید.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onSelect={() => setIsCartOpen(true)}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* LATEST BLOG ARTICLES & TUTORIALS (WITH LIKE BUTTON & ARROW LINK) */}
        {articles.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-black text-foreground flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-blue-500" />
                  <span>آموزش‌ها و آخرین اخبار هوش مصنوعی</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  راهنمای جامع کار با مدل‌های هوش مصنوعی و ترفندهای حرفه‌ای
                </p>
              </div>
              <ArrowLink to="/blog">مشاهده وبلاگ</ArrowLink>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {articles.map((art) => (
                <div
                  key={art.id}
                  className="group rounded-2xl border border-border bg-card overflow-hidden hover:border-zinc-700 transition-all flex flex-col justify-between"
                  style={{ boxShadow: 'var(--depth-surface)' }}
                >
                  <Link to={`/blog/${art.slug}`}>
                    {art.cover_image && (
                      <div className="h-40 w-full overflow-hidden bg-zinc-950">
                        <img
                          src={art.cover_image}
                          alt={art.title}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      </div>
                    )}
                    <div className="p-4 sm:p-5 space-y-2 text-right">
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        {art.category_name && (
                          <span className="font-bold text-blue-400">
                            {art.category_name}
                          </span>
                        )}
                        <span>•</span>
                        <span>
                          {toPersianDigits(art.reading_time_minutes || 5)} دقیقه
                          مطالعه
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-foreground group-hover:text-blue-400 transition-colors line-clamp-1">
                        {art.title}
                      </h4>
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {art.excerpt}
                      </p>
                    </div>
                  </Link>

                  {/* Footer with LikeButton and Arrow Link */}
                  <div className="p-4 pt-0 flex items-center justify-between text-xs font-bold border-t border-border/80 mt-2">
                    <ArrowLink to={`/blog/${art.slug}`}>مطالعه مقاله</ArrowLink>
                    <LikeButton
                      slug={art.slug}
                      initialCount={art.like_count || 0}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 4-PILLAR REASSURANCE TRUST GRID */}
        <section
          className="rounded-2xl border border-border bg-card p-6 sm:p-8"
          style={{ boxShadow: 'var(--depth-surface)' }}
        >
          <div className="text-center mb-8">
            <h3 className="text-lg font-black text-foreground">
              چرا آناهیکس را برای خرید اکانت‌های هوش مصنوعی انتخاب می‌کنند؟
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              استانداردهای شفاف امنیتی و فنی منطبق با ساختار پرداختی بین‌المللی
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 text-right">
            <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 font-black">
                <Zap className="h-4 w-4" />
              </div>
              <h4 className="font-bold text-xs sm:text-sm text-foreground">
                تحویل آنی و بدون معطلی
              </h4>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                لینک‌های اختصاصی و اکانت‌های پیش‌ساخته بلافاصله پس از پرداخت صادر
                می‌گردند.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 font-black">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <h4 className="font-bold text-xs sm:text-sm text-foreground">
                تضمین عدم مسدودی و اصالت
              </h4>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                پرداخت‌ها با مسترکارت معتبر انجام شده و در طول دوره به هیچ عنوان
                مسدود نمی‌شوند.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 font-black">
                <Lock className="h-4 w-4" />
              </div>
              <h4 className="font-bold text-xs sm:text-sm text-foreground">
                سیاست نابودسازی رمز (Zeroize)
              </h4>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                کلمه عبور ارائه شده در ارتقای شخصی پس از اتمام سفارش فوراً از
                دیتابیس امحا می‌شود.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 font-black">
                <Headphones className="h-4 w-4" />
              </div>
              <h4 className="font-bold text-xs sm:text-sm text-foreground">
                پشتیبانی ۲۴ ساعته متخصص
              </h4>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                کارشناسان فنی مسلط به پلتفرم‌های هوش مصنوعی در کلیه روزهای هفته
                پاسخگوی شما هستند.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ ACCORDION SECTION (VIBE FARSI ACCORDION) */}
        <section
          className="rounded-2xl border border-border bg-card p-6 sm:p-8 space-y-5"
          style={{ boxShadow: 'var(--depth-surface)' }}
        >
          <div className="text-center space-y-1">
            <h3 className="text-lg font-black text-foreground">
              پرسش‌های متداول خریداران
            </h3>
            <p className="text-xs text-muted-foreground">
              پاسخ به سوالات متداول درباره نحوه پرداخت، فعال‌سازی و پشتیبانی
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <Accordion items={faqItems} defaultOpenId="faq-1" />
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-border bg-card mt-12 py-10 text-muted-foreground transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-right text-xs">
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-blue-600 text-white font-black flex items-center justify-center text-sm shadow-sm">
                  A
                </div>
                <span className="font-black text-foreground text-sm">
                  آناهیکس (ANAHIX)
                </span>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                سامانه هوشمند ارائه قانونی اشتراک‌های بین‌المللی، لایسنس‌های هوش
                مصنوعی و شماره‌های مجازی بین‌المللی در ایران با زیرساخت پرداخت امن
                عضو شتاب و تتر.
              </p>
            </div>

            <div>
              <h5 className="font-bold text-foreground mb-3 text-xs">
                دسترسی سریع
              </h5>
              <ul className="space-y-2.5 text-xs">
                <li>
                  <a href="#products-catalog" className="hover:text-blue-500">
                    کاتالوگ اشتراک‌ها
                  </a>
                </li>
                <li>
                  <Link to="/virtual-numbers" className="hover:text-blue-500">
                    شماره مجازی (SMS Verification)
                  </Link>
                </li>
                <li>
                  <Link
                    to="/blog"
                    className="hover:text-blue-500 font-semibold"
                  >
                    وبلاگ و آموزش‌ها (SEO Engine)
                  </Link>
                </li>
                <li>
                  <Link
                    to="/help"
                    className="hover:text-blue-500 font-semibold"
                  >
                    پایگاه دانش و رفع ارورها (Help Center)
                  </Link>
                </li>
                <li>
                  <Link to="/track" className="hover:text-blue-500">
                    پیگیری سفارش و فاکتورها
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h5 className="font-bold text-foreground mb-3 text-xs">
                سرویس‌های محبوب
              </h5>
              <ul className="space-y-2.5 text-xs">
                <li>اشتراک قانونی ChatGPT Plus</li>
                <li>اکانت اختصاصی Claude Pro Sonnet</li>
                <li>لینک ۱۸ ماهه Google Gemini Advanced</li>
                <li>اکانت Cursor AI ویژه برنامه‌نویسان</li>
                <li>شماره مجازی تلگرام و اوپن‌ای‌آی</li>
              </ul>
            </div>

            <div>
              <h5 className="font-bold text-foreground mb-3 text-xs">
                پشتیبانی و ارتباط
              </h5>
              <p className="text-xs leading-relaxed text-muted-foreground">
                تیم پشتیبانی آناهیکس در کلیه روزهای هفته آماده پاسخگویی به
                سوالات و راهنمایی فعال‌سازی شماست.
              </p>
              <div className="mt-3">
                <a
                  href="https://t.me/AnahixSupport"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-500/10 border border-blue-500/20 px-3.5 py-2 text-xs text-blue-400 font-bold hover:bg-blue-600 hover:text-white transition-colors"
                >
                  <Headphones className="h-4 w-4" />
                  <span>پشتیبانی تلگرام: @AnahixSupport</span>
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-6 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div>
              © ۱۴۰۵ تمامی حقوق متعلق به سامانه آناهیکس (Anahix) می‌باشد.
            </div>
            <div className="text-muted-foreground/80 font-latin text-[11px]">
              Vibe Farsi Graphite System • AES-256-GCM Vault
            </div>
          </div>
        </div>
      </footer>

      {/* Unified Cart & Checkout Workbench */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        customer={customer}
        payments={payments}
        onSubmit={handleCartCheckoutSubmit}
      />
    </div>
  )
}
