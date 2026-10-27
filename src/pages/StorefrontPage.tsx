import {
  ArrowLeft,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Clock,
  CreditCard,
  Eye,
  Flame,
  Headphones,
  Lock,
  Package,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Star,
  Zap,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { BrandIcons } from '../components/BrandIcons'
import { CartDrawer } from '../components/CartDrawer'
import { Header } from '../components/Header'
import { OrderSuccessModal } from '../components/OrderSuccessModal'
import { ProductCard } from '../components/ProductCard'
import { Accordion } from '../components/vibefarsi/Accordion'
import { Alert } from '../components/vibefarsi/Alert'
import { ArrowLink } from '../components/vibefarsi/ArrowLink'
import {
  BannerCarousel,
  type BannerData,
} from '../components/vibefarsi/BannerCarousel'
import { GridPattern } from '../components/vibefarsi/GridPattern'
import { LikeButton } from '../components/vibefarsi/LikeButton'
import { ScrollReveal } from '../components/vibefarsi/ScrollReveal'
import { TypewriterText } from '../components/vibefarsi/TypewriterText'
import { useCart } from '../lib/cartStore'
import { api, apiService } from '../services/api'
import type {
  ArticleListItem,
  CustomerProfile,
  Order,
  PaymentGateway,
  Product,
  ThemeSettings,
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
  const cart = useCart()
  const [successOrderModal, setSuccessOrderModal] = useState<Order | null>(null)
  const [customer, setCustomer] = useState<CustomerProfile | null>(null)
  const [themeSettings, setThemeSettings] = useState<ThemeSettings | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [banners, setBanners] = useState<BannerData[]>([])
  const [middleBanners, setMiddleBanners] = useState<BannerData[]>([])
  const [heroSideBanners, setHeroSideBanners] = useState<BannerData[]>([])
  const [flashSaleBanners, setFlashSaleBanners] = useState<BannerData[]>([])
  const [articles, setArticles] = useState<ArticleListItem[]>([])
  const [payments, setPayments] = useState<PaymentGateway[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  const catalogScrollRef = useRef<HTMLDivElement>(null)
  const blogScrollRef = useRef<HTMLDivElement>(null)
  const middleBannersScrollRef = useRef<HTMLDivElement>(null)
  const flashSaleScrollRef = useRef<HTMLDivElement>(null)
  const bestSellersScrollRef = useRef<HTMLDivElement>(null)

  const scrollCatalog = (direction: 'left' | 'right') => {
    if (catalogScrollRef.current) {
      const offset = direction === 'left' ? -350 : 350
      catalogScrollRef.current.scrollBy({ left: offset, behavior: 'smooth' })
    }
  }

  const scrollBlog = (direction: 'left' | 'right') => {
    if (blogScrollRef.current) {
      const offset = direction === 'left' ? -350 : 350
      blogScrollRef.current.scrollBy({ left: offset, behavior: 'smooth' })
    }
  }

  const scrollMiddleBanners = (direction: 'left' | 'right') => {
    if (middleBannersScrollRef.current) {
      const offset = direction === 'left' ? -420 : 420
      middleBannersScrollRef.current.scrollBy({
        left: offset,
        behavior: 'smooth',
      })
    }
  }

  const scrollFlashSale = (direction: 'left' | 'right') => {
    if (flashSaleScrollRef.current) {
      const offset = direction === 'left' ? -350 : 350
      flashSaleScrollRef.current.scrollBy({
        left: offset,
        behavior: 'smooth',
      })
    }
  }

  const scrollBestSellers = (direction: 'left' | 'right') => {
    if (bestSellersScrollRef.current) {
      const offset = direction === 'left' ? -350 : 350
      bestSellersScrollRef.current.scrollBy({
        left: offset,
        behavior: 'smooth',
      })
    }
  }

  useEffect(() => {
    async function init() {
      setLoading(true)
      try {
        const [prods, pays, cust, bns, midBns, sideBns, flashBns, arts, theme] =
          await Promise.all([
            apiService.getProducts(),
            apiService.getPayments(),
            apiService.getCustomerProfile(),
            api.getBanners('main_slider').catch(() => []),
            api.getBanners('middle_strip').catch(() => []),
            api.getBanners('hero_side').catch(() => []),
            api.getBanners('flash_sale').catch(() => []),
            api
              .getArticles({ page: 1, page_size: 3 })
              .then((r: any) => r?.items || [])
              .catch(() => []),
            api.getThemeSettings().catch(() => null),
          ])
        setProducts(prods)
        setPayments(pays)
        if (cust) setCustomer(cust)
        if (theme) setThemeSettings(theme)
        if (bns && bns.length > 0) {
          setBanners(bns)
        }
        if (midBns && midBns.length > 0) {
          setMiddleBanners(midBns)
        }
        if (sideBns && sideBns.length > 0) {
          setHeroSideBanners(sideBns)
        }
        if (flashBns && flashBns.length > 0) {
          setFlashSaleBanners(flashBns)
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

    const handleThemeSync = (e: any) => {
      if (e.detail) {
        setThemeSettings((prev) => ({ ...prev, ...e.detail }))
      }
    }
    window.addEventListener('anahix:theme:updated', handleThemeSync)
    return () =>
      window.removeEventListener('anahix:theme:updated', handleThemeSync)
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
    setSuccessOrderModal(newOrder)
  }

  const filteredProducts = products

  // Flash Sale Products (only active and non-expired)
  const flashSaleProducts = products.filter((p) => {
    if (!p.is_flash_sale || !p.flash_sale_price_toman) return false
    if (p.flash_sale_end_at) {
      const expiry = new Date(p.flash_sale_end_at).getTime()
      if (!Number.isNaN(expiry) && expiry <= Date.now()) {
        return false
      }
    }
    return true
  })

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
        <ScrollReveal>
          <Alert
            variant="graphite"
            title="زیرساخت امنیتی اختصاصی و تحویل رسمی لایسنس‌ها"
          >
            تمامی اکانت‌ها و اشتراک‌های آناهیکس به صورت ۱۰۰٪ قانونی با مسترکارت‌های
            بین‌المللی پرداخت شده و تحت پروتکل امنیتی Zeroize پس از فعال‌سازی
            هیچ‌گونه رمز عبوری در سرور باقی نخواهد ماند.
          </Alert>
        </ScrollReveal>

        {/* HERO SECTION WITH TYPEWRITER & VIBE FARSI GRID */}
        <ScrollReveal>
          <section className="relative overflow-hidden rounded-surface border-line bg-card p-6 sm:p-10 shadow-surface duration-motion ease-motion">
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
                <div className="inline-flex items-center gap-2 rounded-control border border-brand/30 bg-brand/10 px-3 py-1 text-xs font-bold text-brand">
                  <Zap className="h-3.5 w-3.5" />
                  <span>تحویل آنی لایسنس و اکانت‌های هوش مصنوعی</span>
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
                    className="text-foreground font-latin underline decoration-brand/60 underline-offset-8"
                  />
                </h1>

                <p className="text-xs sm:text-base text-muted-foreground leading-relaxed max-w-xl">
                  دسترسی مستقیم و پایدار به قدرتمندترین ابزارهای هوش مصنوعی روز
                  جهان با پرداخت ریالی عضو شتاب، تضمین بدون مسدودی و پروتکل
                  امنیتی Zeroize.
                </p>

                <div className="pt-2 flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-brand" />
                    <span>ضمانت کامل بازگشت وجه</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Lock className="h-4 w-4 text-brand" />
                    <span>پروتکل امنیت کلمه عبور (Zeroize)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CreditCard className="h-4 w-4 text-brand" />
                    <span>پرداخت عضو شتاب و تتر</span>
                  </div>
                </div>

                {/* Graphite buttons: Primary is white with black text */}
                <div className="pt-3 flex items-center gap-3">
                  <a href="#products-catalog">
                    <button
                      type="button"
                      className="h-10 px-5 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs sm:text-sm duration-motion ease-motion active:scale-[0.98] flex items-center gap-1.5 shadow-control cursor-pointer"
                    >
                      <span>مشاهده کاتالوگ اشتراک‌ها</span>
                      <span>←</span>
                    </button>
                  </a>
                  <Link
                    to="/virtual-numbers"
                    className="h-10 px-5 rounded-control border-line bg-card hover:bg-muted text-xs sm:text-sm font-bold text-foreground duration-motion ease-motion active:scale-[0.98] flex items-center"
                  >
                    شماره مجازی (SMS)
                  </Link>
                </div>
              </div>

              {/* Hero Slider/Banner Column */}
              <div className="lg:col-span-5 space-y-3">
                {banners.length > 0 ? (
                  <BannerCarousel banners={banners} />
                ) : (
                  <div className="relative overflow-hidden rounded-surface border-line bg-card p-6 text-right space-y-3 shadow-surface">
                    <div className="inline-flex items-center gap-1.5 rounded-control border border-brand/30 bg-brand/10 text-brand px-3 py-1 text-xs font-bold">
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>پیشنهاد برگزیده ماه</span>
                    </div>
                    <h3 className="text-xl font-black text-foreground">
                      Google Gemini Advanced ۱۸ ماهه قانونی
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      با ۲ ترابایت فضای ابری گوگل وان و دسترسی کامل به Gemini
                      1.5 Pro با نازل‌ترین هزینه ریالی
                    </p>
                    <ArrowLink to="/products/gemini-advanced-18m">
                      سفارش آنی سرویس
                    </ArrowLink>
                  </div>
                )}

                {/* Hero Side / Sub-Hero Promotional Cards (Scrollable or Stacked) */}
                {heroSideBanners.length > 0 && (
                  <div className="space-y-2.5 max-h-[180px] overflow-y-auto scrollbar-thin">
                    {heroSideBanners.map((sb) => (
                      <Link
                        key={sb.id}
                        to={sb.link_url || '#'}
                        className="group relative overflow-hidden rounded-surface border border-border/80 bg-card p-3 shadow-surface hover:border-brand/40 duration-motion transition-all flex items-center justify-between gap-3 select-none"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {sb.image_url && (
                            <img
                              src={sb.image_url}
                              alt={sb.title}
                              className="w-12 h-12 rounded-control object-cover shrink-0 border border-border/60 group-hover:scale-105 transition-transform"
                            />
                          )}
                          <div className="min-w-0 text-right">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-black text-xs text-foreground truncate">
                                {sb.title}
                              </span>
                              {sb.badge_text && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded-control bg-brand/10 text-brand font-bold shrink-0">
                                  {sb.badge_text}
                                </span>
                              )}
                            </div>
                            {sb.subtitle && (
                              <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                                {sb.subtitle}
                              </p>
                            )}
                          </div>
                        </div>
                        <ArrowLink to={sb.link_url || '#'}>
                          {sb.button_text || 'مشاهده'}
                        </ArrowLink>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Supported Brand Logos Strip */}
            <div className="mt-6 pt-2">
              <div className="text-[11px] font-bold text-muted-foreground mb-3">
                پشتیبانی از برترین سرویس‌ها و پلتفرم‌های جهان:
              </div>
              <BrandIcons />
            </div>
          </section>
        </ScrollReveal>

        {/* FLASH SALE / TIMED DISCOUNTS SECTION */}
        {(flashSaleProducts.length > 0 || flashSaleBanners.length > 0) && (
          <ScrollReveal>
            <section id="flash-sale" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-foreground flex items-center gap-2">
                    <Flame className="h-5 w-5 text-rose-500 animate-pulse" />
                    <span>جشنواره تخفیف‌های شگفت‌انگیز و زمان‌دار</span>
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    فرصت محدود خرید لایسنس‌ها با بالاترین درصد تخفیف نقدی
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {/* Desktop Left/Right Scroll Chevrons if > 2 */}
                  {(flashSaleProducts.length > 2 ||
                    flashSaleBanners.length > 2) && (
                    <div className="hidden sm:flex items-center gap-1.5 bg-muted/40 p-1 rounded-control border border-border/40">
                      <button
                        type="button"
                        onClick={() => scrollFlashSale('right')}
                        className="w-7 h-7 flex items-center justify-center rounded-control hover:bg-card text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        title="اسکرول به راست"
                        aria-label="اسکرول به راست"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => scrollFlashSale('left')}
                        className="w-7 h-7 flex items-center justify-center rounded-control hover:bg-card text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        title="اسکرول به چپ"
                        aria-label="اسکرول به چپ"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  <ArrowLink to="/offers">مشاهده تخفیف‌ها</ArrowLink>
                </div>
              </div>

              {/* Optional Promotional Flash Banners */}
              {flashSaleBanners.length > 0 && (
                <div
                  className={`grid gap-4 sm:gap-6 ${
                    flashSaleBanners.length === 1
                      ? 'grid-cols-1'
                      : 'grid-cols-1 md:grid-cols-2'
                  }`}
                >
                  {flashSaleBanners.map((fb, idx) => {
                    const isLastOdd =
                      flashSaleBanners.length % 2 !== 0 &&
                      idx === flashSaleBanners.length - 1
                    return (
                      <Link
                        key={fb.id}
                        to={fb.link_url || '#flash-sale'}
                        className={`group relative overflow-hidden rounded-surface border border-rose-500/30 bg-card shadow-surface hover:border-rose-500/60 duration-motion transition-all block ${
                          isLastOdd ? 'md:col-span-2' : ''
                        }`}
                      >
                        <div
                          className={`relative w-full overflow-hidden ${
                            isLastOdd ? 'h-40 sm:h-52' : 'h-36 sm:h-44'
                          }`}
                        >
                          <img
                            src={fb.image_url}
                            alt={fb.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent flex flex-col justify-end p-4 text-right text-white space-y-1 select-none">
                            <div className="flex items-center gap-2">
                              <span className="self-start px-2 py-0.5 rounded-control bg-rose-600 text-white font-black text-[10px] shadow-control flex items-center gap-1">
                                <Flame className="w-3 h-3" />
                                <span>
                                  {fb.badge_text || 'جشنواره شگفت‌انگیز'}
                                </span>
                              </span>
                            </div>
                            <h4 className="font-black text-sm sm:text-base text-white">
                              {fb.title}
                            </h4>
                            {fb.subtitle && (
                              <p className="text-xs text-white/80 line-clamp-1">
                                {fb.subtitle}
                              </p>
                            )}
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}

              {/* Products in Flash Sale (Scrollable if > 2) */}
              <div
                ref={flashSaleScrollRef}
                className={
                  flashSaleProducts.length > 2
                    ? 'flex items-stretch gap-5 overflow-x-auto pb-4 scrollbar-none snap-x snap-mandatory scroll-smooth -mx-4 px-4 sm:mx-0 sm:px-0'
                    : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5'
                }
              >
                {flashSaleProducts.map((product) => (
                  <div
                    key={`flash-${product.id}`}
                    className={
                      flashSaleProducts.length > 2
                        ? 'w-[285px] sm:w-[320px] md:w-[340px] shrink-0 snap-start flex flex-col'
                        : 'flex flex-col'
                    }
                  >
                    <ProductCard product={product} onSelect={() => {}} />
                  </div>
                ))}
              </div>
            </section>
          </ScrollReveal>
        )}

        {/* BEST SELLERS / POPULAR PRODUCTS */}
        {bestSellerProducts.length > 0 && (
          <ScrollReveal>
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

                <div className="flex items-center gap-3">
                  {/* Desktop Left/Right Scroll Chevrons (Screenshot 1 Request) */}
                  {bestSellerProducts.length > 2 && (
                    <div className="hidden sm:flex items-center gap-1.5 bg-muted/40 p-1 rounded-control border border-border/40">
                      <button
                        type="button"
                        onClick={() => scrollBestSellers('right')}
                        className="w-7 h-7 flex items-center justify-center rounded-control hover:bg-card text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        title="اسکرول به راست"
                        aria-label="اسکرول به راست"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => scrollBestSellers('left')}
                        className="w-7 h-7 flex items-center justify-center rounded-control hover:bg-card text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        title="اسکرول به چپ"
                        aria-label="اسکرول به چپ"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  <ArrowLink to="/best-sellers">مشاهده پرفروش‌ترین‌ها</ArrowLink>
                </div>
              </div>

              <div
                ref={bestSellersScrollRef}
                className={
                  bestSellerProducts.length > 2
                    ? 'flex items-stretch gap-5 overflow-x-auto pb-4 scrollbar-none snap-x snap-mandatory scroll-smooth -mx-4 px-4 sm:mx-0 sm:px-0'
                    : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                }
              >
                {bestSellerProducts.map((product) => (
                  <div
                    key={`bestseller-${product.id}`}
                    className={
                      bestSellerProducts.length > 2
                        ? 'w-[285px] sm:w-[320px] md:w-[340px] shrink-0 snap-start flex flex-col'
                        : 'flex flex-col'
                    }
                  >
                    <ProductCard product={product} onSelect={() => {}} />
                  </div>
                ))}
              </div>
            </section>
          </ScrollReveal>
        )}

        {/* MAIN PRODUCTS CATALOG (Horizontal Scroll with hidden scrollbar) */}
        <ScrollReveal>
          <section id="products-catalog" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-black text-foreground flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-brand" />
                  <span>کاتالوگ اشتراک‌ها و سرویس‌های هوش مصنوعی</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  دسترسی به کلیه ابزارهای پریمیوم با تحویل آنی و تضمین اصالت
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* Desktop Left/Right Scroll Chevrons */}
                <div className="hidden sm:flex items-center gap-1.5 bg-muted/40 p-1 rounded-control border border-border/40">
                  <button
                    type="button"
                    onClick={() => scrollCatalog('right')}
                    className="w-7 h-7 flex items-center justify-center rounded-control hover:bg-card text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    title="اسکرول به راست"
                    aria-label="اسکرول به راست"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollCatalog('left')}
                    className="w-7 h-7 flex items-center justify-center rounded-control hover:bg-card text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    title="اسکرول به چپ"
                    aria-label="اسکرول به چپ"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>

                <ArrowLink to="/category/all">مشاهده اشتراک‌ها</ArrowLink>
              </div>
            </div>

            {/* Horizontal Scroller (Hidden Scrollbar) */}
            <div>
              {loading ? (
                <div className="py-20 text-center space-y-3">
                  <RefreshCw className="h-8 w-8 text-foreground animate-spin mx-auto" />
                  <p className="text-xs text-muted-foreground">
                    در حال بارگذاری اشتراک‌ها و موجودی لایسنس‌ها...
                  </p>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="rounded-surface border border-border/80 bg-card p-8 sm:p-10 text-center space-y-3 shadow-surface max-w-md mx-auto">
                  <div className="w-12 h-12 rounded-control bg-secondary text-brand border border-border/60 flex items-center justify-center mx-auto shadow-xs">
                    <Package className="h-6 w-6 text-brand" />
                  </div>
                  <div className="font-bold text-sm text-foreground">
                    محصولی در این کاتالوگ یافت نشد
                  </div>
                  <p className="text-xs text-muted-foreground">
                    در حال حاضر محصول یا اشتراک فعالی در این دسته‌بندی موجود
                    نیست.
                  </p>
                </div>
              ) : (
                <div
                  ref={catalogScrollRef}
                  className="flex items-stretch gap-5 overflow-x-auto pb-4 scrollbar-none snap-x snap-mandatory scroll-smooth -mx-4 px-4 sm:mx-0 sm:px-0"
                >
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      className="w-[285px] sm:w-[320px] md:w-[340px] shrink-0 snap-start flex flex-col"
                    >
                      <ProductCard product={product} onSelect={() => {}} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </ScrollReveal>

        {/* PROMOTIONAL MIDDLE BANNERS (HORIZONTAL SCROLLER IF > 2 WITH VIBE FARSI HEADER) */}
        {middleBanners.length > 0 && (
          <ScrollReveal>
            <section className="my-6 sm:my-8 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-foreground flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-brand" />
                    <span>پیشنهادهای شگفت‌انگیز و پروموشن‌های منتخب</span>
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    فرصت‌های استثنایی خرید اکانت‌ها و شماره‌های مجازی با قیمت‌های
                    ویژه
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {/* Desktop Left/Right Scroll Chevrons if > 2 */}
                  {middleBanners.length > 2 && (
                    <div className="hidden sm:flex items-center gap-1.5 bg-muted/40 p-1 rounded-control border border-border/40">
                      <button
                        type="button"
                        onClick={() => scrollMiddleBanners('right')}
                        className="w-7 h-7 flex items-center justify-center rounded-control hover:bg-card text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        title="اسکرول به راست"
                        aria-label="اسکرول به راست"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => scrollMiddleBanners('left')}
                        className="w-7 h-7 flex items-center justify-center rounded-control hover:bg-card text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        title="اسکرول به چپ"
                        aria-label="اسکرول به چپ"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  <ArrowLink to="/offers">مشاهده آفرها</ArrowLink>
                </div>
              </div>

              {/* Scroller or Grid */}
              <div
                ref={middleBannersScrollRef}
                className={
                  middleBanners.length > 2
                    ? 'flex items-stretch gap-5 overflow-x-auto pb-4 scrollbar-none snap-x snap-mandatory scroll-smooth -mx-4 px-4 sm:mx-0 sm:px-0'
                    : 'grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6'
                }
              >
                {middleBanners.map((mb) => (
                  <div
                    key={mb.id}
                    className={
                      middleBanners.length > 2
                        ? 'w-[300px] sm:w-[420px] md:w-[480px] shrink-0 snap-start flex flex-col'
                        : 'flex flex-col'
                    }
                  >
                    <Link
                      to={mb.link_url || '/'}
                      className="group relative overflow-hidden rounded-surface border border-border/80 bg-card shadow-surface hover:border-brand/40 duration-motion ease-motion transition-all block h-full select-none"
                    >
                      <div className="relative h-44 sm:h-52 w-full overflow-hidden">
                        <img
                          src={mb.image_url}
                          alt={mb.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        {/* High contrast gradient scrim */}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/40 to-transparent flex flex-col justify-end p-5 text-right text-white space-y-2 select-none">
                          {/* Single Clear Promo Badge (No clutter / no redundant badges - Image 1 fix) */}
                          {mb.badge_text && (
                            <div className="flex items-center gap-1.5">
                              <span className="self-start px-3 py-1 rounded-control bg-slate-950/85 backdrop-blur-md text-amber-300 border border-amber-400/30 font-black text-xs shadow-control flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                                <span>{mb.badge_text}</span>
                              </span>
                            </div>
                          )}

                          <h4 className="font-black text-base sm:text-lg text-white drop-shadow-xs">
                            {mb.title}
                          </h4>
                          {mb.subtitle && (
                            <p className="text-xs text-white/85 line-clamp-2 leading-relaxed font-normal">
                              {mb.subtitle}
                            </p>
                          )}
                          <div className="pt-2 flex items-center justify-start">
                            <span className="inline-flex items-center gap-2 h-8 px-4 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs shadow-control duration-motion active:scale-[0.98] transition-all">
                              <span>{mb.button_text || 'مشاهده و خرید'}</span>
                              <span>←</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            </section>
          </ScrollReveal>
        )}

        {/* LATEST BLOG ARTICLES & TUTORIALS (WITH LIKE BUTTON & ARROW LINK) */}
        {articles.length > 0 && (
          <ScrollReveal>
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-foreground flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-brand" />
                    <span>آموزش‌ها و آخرین اخبار هوش مصنوعی</span>
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    راهنمای جامع کار با مدل‌های هوش مصنوعی و ترفندهای حرفه‌ای
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {/* Desktop Left/Right Scroll Chevrons */}
                  <div className="hidden sm:flex items-center gap-1.5 bg-muted/40 p-1 rounded-control border border-border/40">
                    <button
                      type="button"
                      onClick={() => scrollBlog('right')}
                      className="w-7 h-7 flex items-center justify-center rounded-control hover:bg-card text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      title="اسکرول به راست"
                      aria-label="اسکرول به راست"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => scrollBlog('left')}
                      className="w-7 h-7 flex items-center justify-center rounded-control hover:bg-card text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      title="اسکرول به چپ"
                      aria-label="اسکرول به چپ"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  </div>

                  <ArrowLink to="/blog">مشاهده وبلاگ‌ها</ArrowLink>
                </div>
              </div>

              <div
                ref={blogScrollRef}
                className="flex items-stretch gap-5 overflow-x-auto pb-4 scrollbar-none snap-x snap-mandatory scroll-smooth -mx-4 px-4 sm:mx-0 sm:px-0"
              >
                {articles.map((art) => (
                  <div
                    key={art.id}
                    className="w-[285px] sm:w-[320px] md:w-[340px] shrink-0 snap-start flex flex-col"
                  >
                    <div className="group rounded-surface border border-border/50 bg-card overflow-hidden hover:border-border duration-motion ease-motion transition-all flex flex-col justify-between shadow-surface hover:-translate-y-1">
                      <Link to={`/blog/${art.slug}`} className="block">
                        {art.cover_image && (
                          <div className="relative h-44 w-full overflow-hidden bg-muted">
                            <img
                              src={art.cover_image}
                              alt={art.title}
                              className="h-full w-full object-cover group-hover:scale-105 duration-motion ease-motion transition-transform"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                            {art.category_name && (
                              <div className="absolute top-3 right-3">
                                <span className="px-2.5 py-1 rounded-control bg-slate-950/85 backdrop-blur-md text-white border border-white/20 text-[11px] font-black shadow-control flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-brand" />
                                  <span>{art.category_name}</span>
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                        <div className="p-4 sm:p-5 space-y-2 text-right">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-control bg-muted/40 border border-border/60 text-[11px] font-bold text-muted-foreground">
                              <Clock className="h-3.5 w-3.5 text-brand" />
                              <span>
                                {toPersianDigits(art.reading_time_minutes || 5)}{' '}
                                دقیقه مطالعه
                              </span>
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-control bg-muted/40 border border-border/60 text-[11px] font-bold text-muted-foreground">
                              <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="font-latin">
                                {Number(art.view_count || 0).toLocaleString(
                                  'fa-IR',
                                )}{' '}
                                بازدید
                              </span>
                            </span>
                          </div>
                          <h4 className="text-sm sm:text-base font-black text-foreground group-hover:text-primary-foreground/90 transition-colors line-clamp-2 leading-snug">
                            {art.title}
                          </h4>
                          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                            {art.excerpt}
                          </p>
                        </div>
                      </Link>

                      {/* Footer: Action Button & Interactive Like Button */}
                      <div className="p-4 sm:p-5 pt-0 flex items-center gap-2 mt-1">
                        <Link
                          to={`/blog/${art.slug}`}
                          className="flex-1 h-9 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs duration-motion ease-motion active:scale-[0.98] shadow-control flex items-center justify-center gap-2 transition-all"
                        >
                          <span>مطالعه مقاله</span>
                          <ArrowLeft className="h-3.5 w-3.5" />
                        </Link>
                        <LikeButton
                          slug={art.slug}
                          initialCount={art.like_count || 0}
                          className="h-9 shrink-0"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </ScrollReveal>
        )}

        {/* 4-PILLAR REASSURANCE TRUST GRID */}
        <ScrollReveal>
          <section className="rounded-surface border-line bg-card p-6 sm:p-8 shadow-surface">
            <div className="text-center mb-8">
              <h3 className="text-lg font-black text-foreground">
                چرا آناهیکس را برای خرید اکانت‌های هوش مصنوعی انتخاب می‌کنند؟
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                استانداردهای شفاف امنیتی و فنی منطبق با ساختار پرداختی بین‌المللی
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 text-right">
              <div className="p-4 rounded-control bg-muted/60 border-line space-y-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-control bg-card text-brand font-black border-line">
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

              <div className="p-4 rounded-control bg-muted/60 border-line space-y-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-control bg-card text-brand font-black border-line">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <h4 className="font-bold text-xs sm:text-sm text-foreground">
                  تضمین عدم مسدودی و اصالت
                </h4>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  پرداخت‌ها با مسترکارت معتبر انجام شده و در طول دوره به هیچ
                  عنوان مسدود نمی‌شوند.
                </p>
              </div>

              <div className="p-4 rounded-control bg-muted/60 border-line space-y-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-control bg-card text-brand font-black border-line">
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

              <div className="p-4 rounded-control bg-muted/60 border-line space-y-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-control bg-card text-brand font-black border-line">
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
        </ScrollReveal>

        {/* FAQ ACCORDION SECTION (VIBE FARSI ACCORDION) */}
        <ScrollReveal>
          <section className="rounded-surface border-line bg-card p-6 sm:p-8 space-y-5 shadow-surface">
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
        </ScrollReveal>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-line bg-card mt-12 py-10 text-muted-foreground duration-motion ease-motion transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-right text-xs">
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                {themeSettings?.site_logo_url ? (
                  <img
                    src={themeSettings.site_logo_url}
                    alt={themeSettings?.site_name_fa || 'آناهیکس'}
                    className="h-8 w-auto max-w-[120px] object-contain"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-xl bg-blue-600 text-white font-black flex items-center justify-center text-sm shadow-sm font-latin">
                    {(themeSettings?.site_name_en || 'A')
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                )}
                <span className="font-black text-foreground text-sm">
                  {themeSettings?.site_name_fa || 'آناهیکس'}{' '}
                  <span className="font-latin">
                    ({themeSettings?.site_name_en || 'ANAHIX'})
                  </span>
                </span>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {themeSettings?.site_subtitle ||
                  'سامانه هوشمند ارائه قانونی اشتراک‌های بین‌المللی، لایسنس‌های هوش مصنوعی و شماره‌های مجازی بین‌المللی در ایران با زیرساخت پرداخت امن عضو شتاب و تتر.'}
              </p>
            </div>

            <div>
              <h5 className="font-bold text-foreground mb-3 text-xs">
                دسترسی سریع
              </h5>
              <ul className="space-y-2.5 text-xs">
                {themeSettings?.footer_menu_json ? (
                  (() => {
                    try {
                      const parsed = JSON.parse(themeSettings.footer_menu_json)
                      if (Array.isArray(parsed) && parsed.length > 0) {
                        return parsed.map((item: any) => (
                          <li key={item.id || item.link}>
                            {item.link.startsWith('#') ? (
                              <a
                                href={item.link}
                                className="hover:text-blue-500"
                              >
                                {item.title}
                              </a>
                            ) : (
                              <Link
                                to={item.link}
                                className="hover:text-blue-500"
                              >
                                {item.title}
                              </Link>
                            )}
                          </li>
                        ))
                      }
                    } catch {}
                    return null
                  })()
                ) : (
                  <>
                    <li>
                      <a
                        href="#products-catalog"
                        className="hover:text-blue-500"
                      >
                        کاتالوگ اشتراک‌ها
                      </a>
                    </li>
                    <li>
                      <Link
                        to="/virtual-numbers"
                        className="hover:text-blue-500"
                      >
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
                  </>
                )}
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
                تیم پشتیبانی {themeSettings?.site_name_fa || 'آناهیکس'} در کلیه
                روزهای هفته آماده پاسخگویی به سوالات و راهنمایی فعال‌سازی شماست.
              </p>
              <div className="mt-3 space-y-2">
                <a
                  href={`https://t.me/${(
                    themeSettings?.support_telegram || '@AnahixSupport'
                  ).replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-500/10 border border-blue-500/20 px-3.5 py-2 text-xs text-blue-400 font-bold hover:bg-blue-600 hover:text-white transition-colors"
                >
                  <Headphones className="h-4 w-4" />
                  <span className="font-latin dir-ltr">
                    پشتیبانی تلگرام:{' '}
                    {themeSettings?.support_telegram || '@AnahixSupport'}
                  </span>
                </a>
                {themeSettings?.support_phone && (
                  <div className="text-muted-foreground text-[11px] font-mono font-latin">
                    تلفن پشتیبانی: {themeSettings.support_phone}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-6 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div>
              © ۱۴۰۵ تمامی حقوق متعلق به سامانه{' '}
              {themeSettings?.site_name_fa || 'آناهیکس'} (
              {themeSettings?.site_name_en || 'Anahix'}) می‌باشد.
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

      {/* Post-Purchase Order Success & Fulfillment Modal */}
      <OrderSuccessModal
        isOpen={Boolean(successOrderModal)}
        order={successOrderModal}
        onClose={() => setSuccessOrderModal(null)}
      />
    </div>
  )
}
