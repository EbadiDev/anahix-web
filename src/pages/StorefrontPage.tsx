import {
  BookOpen,
  CreditCard,
  Headphones,
  Heart,
  HelpCircle,
  Lock,
  RefreshCw,
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
import { Accordion } from '../components/vibefarsi/Accordion'
import { Alert } from '../components/vibefarsi/Alert'
import { ArrowLink } from '../components/vibefarsi/ArrowLink'
import {
  BannerCarousel,
  type BannerData,
} from '../components/vibefarsi/BannerCarousel'
import { FlashSaleCountdown } from '../components/vibefarsi/FlashSaleCountdown'
import { GridPattern } from '../components/vibefarsi/GridPattern'
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

  const filteredProducts = products

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
                جهان با پرداخت ریالی عضو شتاب، تضمین بدون مسدودی و پروتکل امنیتی
                Zeroize.
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
            <div className="lg:col-span-5">
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
          <div className="mt-6 pt-2">
            <div className="text-[11px] font-bold text-muted-foreground mb-3">
              پشتیبانی از برترین سرویس‌ها و پلتفرم‌های جهان:
            </div>
            <BrandIcons />
          </div>
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
                  onSelect={() => {}}
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
                  onSelect={() => {}}
                />
              ))}
            </div>
          </section>
        )}

        {/* MAIN PRODUCTS CATALOG */}
        <section id="products-catalog" className="space-y-6">
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
          </div>

          {/* Product Grid */}
          <div>
            {loading ? (
              <div className="py-20 text-center space-y-3">
                <RefreshCw className="h-8 w-8 text-foreground animate-spin mx-auto" />
                <p className="text-xs text-muted-foreground">
                  در حال بارگذاری اشتراک‌ها و موجودی لایسنس‌ها...
                </p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="rounded-surface border border-border/60 bg-card p-12 text-center text-muted-foreground space-y-2 shadow-surface">
                <HelpCircle className="h-8 w-8 mx-auto text-muted-foreground/60" />
                <div className="font-bold text-sm text-foreground">
                  محصولی یافت نشد
                </div>
                <p className="text-xs">
                  در حال حاضر محصول فعالی در این بخش موجود نیست.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onSelect={() => {}}
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
                  <BookOpen className="h-5 w-5 text-brand" />
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
                  className="group rounded-surface border border-border/50 bg-card overflow-hidden hover:border-border duration-motion ease-motion transition-all flex flex-col justify-between shadow-surface hover:-translate-y-1"
                >
                  <Link to={`/blog/${art.slug}`} className="block">
                    {art.cover_image && (
                      <div className="relative h-44 w-full overflow-hidden bg-zinc-950">
                        <img
                          src={art.cover_image}
                          alt={art.title}
                          className="h-full w-full object-cover group-hover:scale-105 duration-motion ease-motion transition-transform"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                        {art.category_name && (
                          <div className="absolute top-3 right-3">
                            <span className="px-2.5 py-1 rounded-control bg-zinc-900/90 backdrop-blur-md border border-zinc-800 text-[10px] font-bold text-zinc-200">
                              {art.category_name}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="p-4 sm:p-5 space-y-2 text-right">
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span>
                          {toPersianDigits(art.reading_time_minutes || 5)} دقیقه
                          مطالعه
                        </span>
                        <span>•</span>
                        <span>
                          {toPersianDigits(art.view_count || 120)} بازدید
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

                  {/* Clean Footer: Arrow Link & Like Count indicator without harsh dividing lines */}
                  <div className="p-4 sm:p-5 pt-0 flex items-center justify-between text-xs font-bold mt-1">
                    <ArrowLink to={`/blog/${art.slug}`}>مطالعه مقاله</ArrowLink>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/30 px-2 py-1 rounded-control border border-border/30">
                      <Heart className="h-3.5 w-3.5 text-rose-500 fill-rose-500/20" />
                      <span className="font-latin">
                        {toPersianDigits(art.like_count || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 4-PILLAR REASSURANCE TRUST GRID */}
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
                پرداخت‌ها با مسترکارت معتبر انجام شده و در طول دوره به هیچ عنوان
                مسدود نمی‌شوند.
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

        {/* FAQ ACCORDION SECTION (VIBE FARSI ACCORDION) */}
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
      </main>

      {/* FOOTER */}
      <footer className="border-t border-line bg-card mt-12 py-10 text-muted-foreground duration-motion ease-motion transition-colors">
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
