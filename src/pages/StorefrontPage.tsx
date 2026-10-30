import {
  ArrowLeft,
  Bookmark,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Clock,
  CreditCard,
  Eye,
  Flame,
  Headphones,
  Lock,
  Megaphone,
  Package,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Tag,
  X,
  Zap,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CartDrawer } from '../components/CartDrawer'
import { Header } from '../components/Header'
import { OrderSuccessModal } from '../components/OrderSuccessModal'
import { ProductCard } from '../components/ProductCard'
import { Accordion } from '../components/vibefarsi/Accordion'
import { ArrowLink } from '../components/vibefarsi/ArrowLink'
import {
  BannerCarousel,
  type BannerData,
} from '../components/vibefarsi/BannerCarousel'
import { GridPattern } from '../components/vibefarsi/GridPattern'
import { LikeButton } from '../components/vibefarsi/LikeButton'
import { LoadingState } from '../components/vibefarsi/LoadingState'
import { ScrollingAnnouncement } from '../components/vibefarsi/ScrollingAnnouncement'
import { ScrollReveal } from '../components/vibefarsi/ScrollReveal'
import { TypewriterText } from '../components/vibefarsi/TypewriterText'
import { useCart } from '../lib/cartStore'
import { api, apiService } from '../services/api'
import type {
  ArticleListItem,
  CustomerProfile,
  FooterTrustBadge,
  Order,
  PaymentGateway,
  Product,
  ThemeSettings,
} from '../types'
import { cleanMediaUrl, getSiteBrandName } from '../utils/brand'
import { formatNumber, formatToman } from '../utils/formatters'
import { getLocalWishlist, toggleItemFavorite } from '../utils/wishlist'

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
  const [heroInputText, setHeroInputText] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [activeSearchQuery, setActiveSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Product[] | null>(null)

  useEffect(() => {
    if (!heroInputText.trim() && searchResults !== null) {
      setSearchResults(null)
      setActiveSearchQuery('')
    }
  }, [heroInputText, searchResults])
  const [successOrderModal, setSuccessOrderModal] = useState<Order | null>(null)
  const [customer, setCustomer] = useState<CustomerProfile | null>(null)
  const [themeSettings, setThemeSettings] = useState<ThemeSettings | null>(null)
  const brandName = themeSettings?.site_name_fa || getSiteBrandName('') || ''
  const brandNameEn = themeSettings?.site_name_en || ''
  const supportTelegram = themeSettings?.support_telegram || '@PlyShopSupport'
  const [products, setProducts] = useState<Product[]>([])
  const [banners, setBanners] = useState<BannerData[]>([])
  const [middleBanners, setMiddleBanners] = useState<BannerData[]>([])
  const [heroSideBanners, setHeroSideBanners] = useState<BannerData[]>([])
  const [flashSaleBanners, setFlashSaleBanners] = useState<BannerData[]>([])
  const [articles, setArticles] = useState<ArticleListItem[]>([])
  const [payments, setPayments] = useState<PaymentGateway[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [scrolledPastHeader, setScrolledPastHeader] = useState(false)
  const footerRef = useRef<HTMLElement>(null)
  const [floatingCartBottom, setFloatingCartBottom] = useState<number>(16)

  const footerTrustBadges = useMemo<FooterTrustBadge[]>(() => {
    if (themeSettings?.footer_badges_json) {
      try {
        const parsed = JSON.parse(themeSettings.footer_badges_json)
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.filter((b: FooterTrustBadge) => b.is_active !== false)
        }
      } catch {}
    }
    return [
      {
        id: 'enamad',
        title: 'نماد اعتماد الکترونیکی (اینماد)',
        image_url: '/images/enamad.png',
        link_url: 'https://enamad.ir',
        is_active: true,
      },
      {
        id: 'samandehi',
        title: 'نشان ساماندهی رسانه‌های دیجیتال',
        image_url: '/images/samandehi.png',
        link_url: 'https://samandehi.ir',
        is_active: true,
      },
      {
        id: 'union',
        title: 'عضو اتحادیه کسب‌وکارهای مجازی',
        image_url: '/images/union.png',
        link_url: 'https://ecunion.ir',
        is_active: true,
      },
      {
        id: 'security_vault',
        title: 'ضمانت امنیت داده‌ها و Zeroize',
        image_url: '/images/security-seal.png',
        link_url: '#',
        is_active: true,
      },
    ]
  }, [themeSettings?.footer_badges_json])
  const [loading, setLoading] = useState(true)

  const [favoritedBlogSlugs, setFavoritedBlogSlugs] = useState<Set<string>>(
    () => {
      const list = getLocalWishlist()
      return new Set(
        list
          .filter((it) => it.target_type === 'article')
          .map((it) => it.target_id),
      )
    },
  )

  useEffect(() => {
    const handleSync = () => {
      const list = getLocalWishlist()
      setFavoritedBlogSlugs(
        new Set(
          list
            .filter((it) => it.target_type === 'article')
            .map((it) => it.target_id),
        ),
      )
    }
    window.addEventListener('anahix:wishlist:updated', handleSync)
    return () =>
      window.removeEventListener('anahix:wishlist:updated', handleSync)
  }, [])

  const handleToggleBlogFavorite = async (art: ArticleListItem) => {
    const res = await toggleItemFavorite({
      target_type: 'article',
      target_id: art.slug,
      title: art.title,
      image_url: art.cover_image,
    })
    setFavoritedBlogSlugs((prev) => {
      const next = new Set(prev)
      if (res.is_favorite) next.add(art.slug)
      else next.delete(art.slug)
      return next
    })
  }

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

  useEffect(() => {
    const handleCartOpen = () => setIsCartOpen(true)
    window.addEventListener('anahix:cart:open', handleCartOpen)
    return () => window.removeEventListener('anahix:cart:open', handleCartOpen)
  }, [])

  // Floating Cart Scroll Listener (Only show when scrolled away from top header, and stay sticky right above the footer)
  useEffect(() => {
    const handleScroll = () => {
      setScrolledPastHeader(window.scrollY > 300)

      if (footerRef.current) {
        const footerRect = footerRef.current.getBoundingClientRect()
        const viewportHeight = window.innerHeight
        if (footerRect.top < viewportHeight) {
          const overlap = viewportHeight - footerRect.top
          setFloatingCartBottom(overlap + 16)
        } else {
          setFloatingCartBottom(16)
        }
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll, { passive: true })
    handleScroll()
    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
    }
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

  const handleExecuteSearch = async (customQuery?: string) => {
    const q = (customQuery !== undefined ? customQuery : heroInputText).trim()
    if (!q) {
      handleClearSearch()
      return
    }
    setIsSearching(true)
    try {
      const res = await apiService.getProducts(q)
      setSearchResults(res)
      setActiveSearchQuery(q)
      // Display results in-place without scrolling down to catalog
    } catch (err) {
      console.error('Search error:', err)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleClearSearch = () => {
    setHeroInputText('')
    setActiveSearchQuery('')
    setSearchResults(null)
  }

  const parsedTrustTicker = useMemo(() => {
    if (themeSettings?.trust_ticker_json) {
      try {
        const arr = JSON.parse(themeSettings.trust_ticker_json)
        if (Array.isArray(arr)) {
          return arr.filter((item: any) => item.active !== false)
        }
      } catch {}
    }
    return [
      {
        id: 't-1',
        icon: 'zap',
        title: 'تحویل آنی ۰ ثانیه‌ای',
        desc: 'صدور بلافاصله پس از پرداخت',
      },
      {
        id: 't-2',
        icon: 'credit-card',
        title: 'پرداخت امن ریالی و تتر',
        desc: 'شبکه شتاب و تتر TRC20',
      },
      {
        id: 't-3',
        icon: 'shield-check',
        title: 'ضمانت ۳۰ روزه تعویض',
        desc: 'گارانتی کامل و عدم مسدودی',
      },
      {
        id: 't-4',
        icon: 'headphones',
        title: 'پشتیبانی ۲۴ ساعته تلگرام',
        desc: 'پاسخگویی سریع کارشناسان',
      },
    ]
  }, [themeSettings?.trust_ticker_json])

  const getTrustIcon = (iconName: string) => {
    switch (iconName) {
      case 'zap':
        return <Zap className="h-4 w-4 text-emerald-500" />
      case 'credit-card':
        return <CreditCard className="h-4 w-4 text-brand" />
      case 'shield-check':
        return <ShieldCheck className="h-4 w-4 text-emerald-500" />
      case 'headphones':
        return <Headphones className="h-4 w-4 text-cyan-400" />
      case 'lock':
        return <Lock className="h-4 w-4 text-purple-400" />
      case 'star':
        return <Star className="h-4 w-4 text-amber-400" />
      default:
        return <Sparkles className="h-4 w-4 text-brand" />
    }
  }

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
      content: `بله، تمامی اشتراک‌های ${brandName} به صورت ۱۰۰٪ قانونی توسط کارت‌های اعتباری بین‌المللی اختصاصی و بدون استفاده از روش‌های پرخطر یا اشتراکی هکی پرداخت می‌شوند. در طول دوره اشتراک ضمانت کامل و عدم قطعی ارائه می‌گردد.`,
    },
    {
      id: 'faq-2',
      title: 'تفاوت تحویل لینک فوری و ارتقای اکانت شخصی چیست؟',
      content: `در حالت «لینک فوری»، بلافاصله پس از پرداخت لینک دعوت فمیلی اختصاصی برای شما صادر شده و درجا روی جیمیل شما فعال می‌شود. در حالت «ارتقای اکانت شخصی»، اپراتور متخصص ${brandName} با ورود امن و تبادل لایو کد ۲FA اشتراک را مستقیم روی اکانت خودتان تمدید می‌کند.`,
    },
    {
      id: 'faq-3',
      title: 'سیاست امنیتی Zeroize رمزهای عبور چگونه کار می‌کند؟',
      content: `در سیستم ${brandName}، اطلاعات حساس و کلمه عبور وارد شده توسط الگوریتم رمزنگاری نامتقارن محافظت شده و بلافاصله پس از تکمیل فرآیند فعال‌سازی توسط اپراتور، رمز عبور به طور برگشت‌ناپذیر از پایگاه داده سرور پاکسازی (Zeroize) می‌شود.`,
    },
    {
      id: 'faq-4',
      title: 'در صورت بروز مشکل در فرآیند فعال‌سازی چه باید کرد؟',
      content: `پشتیبانی ۲۴ ساعته تلگرام ${brandName} (${supportTelegram}) آماده پاسخگویی سریع است. همچنین می‌توانید با شماره سفارش خود وضعیت را در تب «پیگیری سفارش» لحظه‌ای رصد نمایید.`,
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

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full space-y-8 sm:space-y-10">
        {/* ========================================================================= */}
        {/* SECTION 1: DATABASE-BACKED HERO SEARCH WITH SEARCH BUTTON & QUICK CHIPS   */}
        {/* ========================================================================= */}
        <ScrollReveal>
          <div className="rounded-surface border border-border/80 bg-card p-4 sm:p-5 shadow-surface space-y-3 duration-motion ease-motion">
            {/* Search Input Bar with Dedicated Search Button */}
            <div className="relative flex items-center">
              <input
                type="text"
                value={heroInputText}
                onChange={(e) => setHeroInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleExecuteSearch()
                }}
                placeholder="جستجو در بیش از ۱۰۰ اکانت هوش مصنوعی، اشتراک‌های قانونی و شماره‌های مجازی..."
                className="w-full h-11 pr-4 pl-32 rounded-control bg-muted/20 border border-border/80 text-foreground text-xs sm:text-sm font-sans outline-none focus:border-brand focus:ring-1 focus:ring-brand/30 transition-all placeholder:text-muted-foreground"
              />

              {heroInputText && (
                <button
                  type="button"
                  onClick={() => setHeroInputText('')}
                  className="absolute left-28 p-1 text-muted-foreground hover:text-foreground cursor-pointer"
                  title="پاک کردن متن"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              <button
                type="button"
                onClick={() => handleExecuteSearch()}
                disabled={isSearching}
                className="absolute left-1 top-1 bottom-1 px-4 sm:px-5 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs duration-motion active:scale-95 shadow-control flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                <Search
                  className={`w-3.5 h-3.5 ${isSearching ? 'animate-spin' : ''}`}
                />
                <span>{isSearching ? 'در حال جستجو...' : 'جستجو کن'}</span>
              </button>
            </div>

            {/* Quick Filter Tag Chips */}
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pt-1">
              <span className="text-[11px] font-bold text-muted-foreground whitespace-nowrap flex items-center gap-1.5 shrink-0">
                <Sparkles className="w-3.5 h-3.5 text-brand" />
                <span>پیشنهادهای محبوب:</span>
              </span>
              {[
                { label: 'ChatGPT Plus', query: 'chatgpt' },
                { label: 'Claude 3.7 Sonnet', query: 'claude' },
                { label: 'Cursor Pro', query: 'cursor' },
                { label: 'Gemini Advanced', query: 'gemini' },
                { label: 'شماره مجازی 5SIM', link: '/virtual-numbers' },
                { label: 'اشتراک تیمی', query: 'team' },
              ].map((tag) => (
                <button
                  key={tag.label}
                  type="button"
                  onClick={() => {
                    if (tag.link) {
                      navigate(tag.link)
                    } else {
                      setHeroInputText(tag.label)
                      handleExecuteSearch(tag.query)
                    }
                  }}
                  className={`px-3 py-1 rounded-control border text-xs font-bold transition-all duration-motion active:scale-95 whitespace-nowrap cursor-pointer shrink-0 ${
                    activeSearchQuery.toLowerCase() ===
                    (tag.query || '').toLowerCase()
                      ? 'bg-primary text-primary-foreground border-primary shadow-control'
                      : 'bg-muted/30 hover:bg-muted text-foreground border-border/60 hover:border-brand/30'
                  }`}
                >
                  {tag.label}
                </button>
              ))}
              {activeSearchQuery && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="px-2.5 py-1 rounded-control bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 text-xs font-bold transition-colors whitespace-nowrap cursor-pointer shrink-0"
                >
                  بستن نتایج ✕
                </button>
              )}
            </div>
          </div>
        </ScrollReveal>

        {/* IN-PLACE SEARCH RESULTS EXPANDED VIEW (REQUESTED: DO NOT SCROLL TO BOTTOM) */}
        {searchResults !== null && (
          <ScrollReveal>
            <div className="rounded-surface border border-brand/40 bg-card p-5 sm:p-6 shadow-overlay space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-border/60 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-control bg-primary text-primary-foreground shadow-control">
                    <Search className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm sm:text-base text-foreground">
                      نتایج جستجو در دیتابیس برای «{activeSearchQuery}»
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {toPersianDigits(searchResults.length)} محصول و اشتراک
                      یافت شد
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="h-8 px-3 rounded-control border border-border/60 bg-secondary hover:bg-muted text-xs font-bold text-foreground inline-flex items-center gap-1.5 duration-motion active:scale-95 cursor-pointer shadow-xs"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>بستن نتایج جستجو</span>
                </button>
              </div>

              {searchResults.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground space-y-2">
                  <Package className="w-10 h-10 mx-auto text-muted-foreground/40" />
                  <p className="font-bold text-sm text-foreground">
                    محصولی با مشخصات «{activeSearchQuery}» در پایگاه‌داده یافت
                    نشد
                  </p>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    لطفاً املای کلمه را بررسی کرده یا نام سرویس دیگری نظیر
                    ChatGPT، Claude یا Gemini را جستجو فرمایید.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 pt-1">
                  {searchResults.map((product) => (
                    <ProductCard
                      key={`search-res-${product.id}`}
                      product={product}
                      onSelect={() => {}}
                    />
                  ))}
                </div>
              )}
            </div>
          </ScrollReveal>
        )}

        {/* ========================================================================= */}
        {/* SECTION 2: TRUST & ASSURANCE TICKER WITH LIVE STATUS PULSE                */}
        {/* ========================================================================= */}
        {Boolean(themeSettings?.trust_ticker_enabled) &&
          parsedTrustTicker.length > 0 && (
            <ScrollReveal>
              <div className="rounded-surface border border-border/70 bg-card/75 backdrop-blur-md p-3 sm:p-4 shadow-surface">
                <div
                  className={`grid gap-2.5 sm:gap-4 text-xs select-none ${
                    parsedTrustTicker.length === 1
                      ? 'grid-cols-1 max-w-xs mx-auto'
                      : parsedTrustTicker.length === 2
                        ? 'grid-cols-2'
                        : parsedTrustTicker.length === 3
                          ? 'grid-cols-1 sm:grid-cols-3'
                          : 'grid-cols-2 md:grid-cols-4'
                  }`}
                >
                  {parsedTrustTicker.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-2.5 p-2 rounded-control bg-muted/20 border border-border/40 hover:border-brand/30 transition-colors"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-control bg-secondary border border-border/60 shrink-0">
                        {getTrustIcon(item.icon)}
                      </div>
                      <div className="min-w-0">
                        <span className="font-black text-foreground block text-xs truncate">
                          {item.title}
                        </span>
                        <span className="text-[10px] text-muted-foreground block truncate">
                          {item.desc}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollReveal>
          )}

        {/* ========================================================================= */}
        {/* SECTION 3: SCROLLING FESTIVAL & LIVE SALES ANNOUNCEMENT TICKER            */}
        {/* ========================================================================= */}
        {Boolean(themeSettings?.scrolling_announcement_enabled) && (
          <ScrollReveal>
            <div className="rounded-surface border border-brand/30 bg-brand/5 p-2.5 shadow-xs">
              <ScrollingAnnouncement
                text={
                  themeSettings?.scrolling_announcement_text ||
                  '🔥 جشنواره تخفیف ویژه هوش مصنوعی: تا ۴۰٪ تخفیف روی اکانت‌های قانونی ChatGPT Plus و Claude با تحویل فوری ⚡ تمامی سرویس‌ها فعال و تحویل خودکار ۰ ثانیه‌ای برقرار است • بیش از ۱۲,۰۰۰ سفارش موفق در سامانه'
                }
                icon={
                  themeSettings?.scrolling_announcement_icon === 'zap' ? (
                    <Zap className="h-4 w-4 text-emerald-400 shrink-0" />
                  ) : themeSettings?.scrolling_announcement_icon ===
                    'sparkles' ? (
                    <Sparkles className="h-4 w-4 text-amber-400 shrink-0" />
                  ) : themeSettings?.scrolling_announcement_icon ===
                    'megaphone' ? (
                    <Megaphone className="h-4 w-4 text-brand shrink-0" />
                  ) : themeSettings?.scrolling_announcement_icon === 'tag' ? (
                    <Tag className="h-4 w-4 text-rose-400 shrink-0" />
                  ) : (
                    <Flame className="h-4 w-4 text-rose-500 shrink-0 animate-pulse" />
                  )
                }
                prefix={
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-control bg-brand text-brand-foreground shadow-xs shrink-0 font-sans">
                    {themeSettings?.scrolling_announcement_badge ||
                      'رویداد زنده'}
                  </span>
                }
                className="text-xs font-bold text-foreground"
              />
            </div>
          </ScrollReveal>
        )}

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
                  <span>
                    {themeSettings?.hero_badge_text ||
                      'تحویل آنی لایسنس و اکانت‌های هوش مصنوعی'}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight text-foreground leading-tight">
                  {themeSettings?.hero_title || 'خرید قانونی اشتراک‌های'}{' '}
                  <TypewriterText
                    words={
                      themeSettings?.hero_typewriter_words
                        ? themeSettings.hero_typewriter_words
                            .split(',')
                            .map((w) => w.trim())
                        : [
                            'ChatGPT Plus',
                            'Claude 3.7 Sonnet',
                            'Gemini Advanced',
                            'Cursor AI Pro',
                            'Google One 2TB',
                          ]
                    }
                    className="text-foreground font-latin underline decoration-brand/60 underline-offset-8"
                  />
                </h1>

                <p className="text-xs sm:text-base text-muted-foreground leading-relaxed max-w-xl">
                  {themeSettings?.hero_description ||
                    'دسترسی مستقیم و پایدار به قدرتمندترین ابزارهای هوش مصنوعی روز جهان با پرداخت ریالی عضو شتاب، تضمین بدون مسدودی و پروتکل امنیتی Zeroize.'}
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

                {/* Graphite buttons */}
                <div className="pt-3 flex items-center gap-3">
                  <a
                    href={themeSettings?.hero_btn1_link || '#products-catalog'}
                  >
                    <button
                      type="button"
                      className="h-10 px-5 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs sm:text-sm duration-motion ease-motion active:scale-[0.98] flex items-center gap-1.5 shadow-control cursor-pointer"
                    >
                      <span>
                        {themeSettings?.hero_btn1_text ||
                          'مشاهده کاتالوگ اشتراک‌ها'}
                      </span>
                      <span>←</span>
                    </button>
                  </a>
                  <Link
                    to={themeSettings?.hero_btn2_link || '/virtual-numbers'}
                    className="h-10 px-5 rounded-control border-line bg-card hover:bg-muted text-xs sm:text-sm font-bold text-foreground duration-motion ease-motion active:scale-[0.98] flex items-center"
                  >
                    {themeSettings?.hero_btn2_text || 'شماره مجازی (SMS)'}
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

                {/* Hero Side / Sub-Hero Promotional Cards (Matching Screenshot 1 Layout) */}
                {heroSideBanners.length > 0 && (
                  <div className="space-y-2.5">
                    {heroSideBanners.slice(0, 2).map((sb) => (
                      <div
                        key={sb.id}
                        className="group relative overflow-hidden rounded-surface border border-border/80 bg-card p-3 sm:p-3.5 shadow-surface hover:border-brand/40 duration-motion transition-all flex items-center justify-between gap-3 select-none"
                      >
                        {/* Action Link Button with Arrow on the left */}
                        <Link
                          to={sb.link_url || '#'}
                          className="h-8 px-3 rounded-control border border-border/60 bg-secondary/80 hover:bg-muted text-xs font-bold text-foreground inline-flex items-center gap-1.5 shadow-control duration-motion active:scale-95 cursor-pointer shrink-0"
                        >
                          <span>{sb.button_text || 'لذت ببر'}</span>
                          <ArrowLeft className="w-3.5 h-3.5" />
                        </Link>

                        {/* Title, Amber Badge & Thumbnail on the right */}
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="min-w-0 text-right">
                            <div className="flex items-center justify-end gap-1.5 flex-wrap">
                              {sb.badge_text && (
                                <span className="text-[10px] px-2 py-0.5 rounded-control bg-amber-500/10 text-amber-500 border border-amber-500/20 font-black shrink-0">
                                  {sb.badge_text}
                                </span>
                              )}
                              <span className="font-black text-xs sm:text-sm text-foreground truncate">
                                {sb.title}
                              </span>
                            </div>
                            {sb.subtitle && (
                              <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                                {sb.subtitle}
                              </p>
                            )}
                          </div>

                          {sb.image_url && (
                            <img
                              src={sb.image_url}
                              alt={sb.title}
                              className="w-12 h-12 rounded-control object-cover shrink-0 border border-border/60 group-hover:scale-105 transition-transform shadow-xs"
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
            {activeSearchQuery && (
              <div className="p-3.5 rounded-control bg-brand/10 border border-brand/30 flex items-center justify-between gap-3 text-xs animate-in fade-in duration-200">
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-brand" />
                  <span className="font-bold text-foreground">
                    نتایج جستجو در دیتابیس برای:{' '}
                    <strong className="text-brand">
                      «{activeSearchQuery}»
                    </strong>
                  </span>
                  <span className="text-[11px] text-muted-foreground font-latin">
                    ({toPersianDigits(products.length)} محصول یافت شد)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="px-3 py-1 rounded-control bg-card hover:bg-muted text-foreground border border-border/60 text-xs font-bold cursor-pointer transition-colors shadow-xs"
                >
                  نمایش همه محصولات ✕
                </button>
              </div>
            )}

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
                <LoadingState message="در حال بارگذاری اشتراک‌ها و موجودی لایسنس‌ها..." />
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
                              <span className="font-sans">
                                {formatNumber(art.view_count || 0)} بازدید
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

                      {/* Footer: Action Button & Interactive Bookmark + Like Buttons */}
                      <div className="p-4 sm:p-5 pt-0 flex items-center gap-2 mt-1">
                        <Link
                          to={`/blog/${art.slug}`}
                          className="flex-1 h-9 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs duration-motion ease-motion active:scale-[0.98] shadow-control flex items-center justify-center gap-2 transition-all cursor-pointer"
                        >
                          <span>مطالعه مقاله</span>
                          <ArrowLeft className="h-3.5 w-3.5" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleToggleBlogFavorite(art)}
                          title={
                            favoritedBlogSlugs.has(art.slug)
                              ? 'حذف از نشان‌شده‌ها'
                              : 'نشان کردن مقاله'
                          }
                          className={`h-9 px-2.5 rounded-control border flex items-center gap-1.5 shrink-0 duration-motion active:scale-95 cursor-pointer shadow-control transition-all ${
                            favoritedBlogSlugs.has(art.slug)
                              ? 'border-brand bg-brand/10 text-brand font-black'
                              : 'border-border/60 bg-secondary/80 hover:bg-muted text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          <Bookmark
                            className={`h-4 w-4 ${
                              favoritedBlogSlugs.has(art.slug)
                                ? 'fill-brand text-brand'
                                : ''
                            }`}
                          />
                          <span className="text-[11px] font-bold hidden sm:inline">
                            {favoritedBlogSlugs.has(art.slug)
                              ? 'نشان‌شده'
                              : 'نشان'}
                          </span>
                        </button>
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
                چرا {brandName} را برای خرید اکانت‌های هوش مصنوعی انتخاب می‌کنند؟
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

      {/* REDESIGNED RESPONSIVE FOOTER (Vibe Farsi Graphite Style with Trust Badges) */}
      <footer
        ref={footerRef}
        className="border-t border-border/80 bg-card mt-16 text-muted-foreground duration-motion ease-motion transition-colors relative overflow-hidden"
      >
        {/* Subtle Top Gradient Accent */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-brand/40 to-transparent" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-10">
          {/* Main 4-Column Responsive Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 text-right text-xs">
            {/* Column 1: Brand Info & About */}
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                {themeSettings?.site_logo_url ? (
                  <img
                    src={cleanMediaUrl(themeSettings.site_logo_url)}
                    alt={brandName || 'Logo'}
                    className="h-9 w-auto max-w-[130px] object-contain"
                  />
                ) : (
                  <div className="h-9 w-9 rounded-control bg-primary text-primary-foreground font-black flex items-center justify-center text-sm shadow-control font-latin">
                    {(brandNameEn || brandName || 'A').charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  {brandName && (
                    <span className="font-black text-foreground text-sm block">
                      {brandName}
                    </span>
                  )}
                  {brandNameEn && (
                    <span className="text-[11px] font-latin font-bold text-blue-500 block leading-none mt-0.5">
                      {brandNameEn}
                    </span>
                  )}
                </div>
              </div>

              <p className="text-xs leading-relaxed text-muted-foreground">
                {themeSettings?.footer_description ||
                  themeSettings?.site_subtitle ||
                  'سامانه هوشمند ارائه قانونی اشتراک‌های بین‌المللی، لایسنس‌های هوش مصنوعی و شماره‌های مجازی در ایران با زیرساخت پرداخت امن شتاب و تتر.'}
              </p>

              <div className="pt-1">
                <a
                  href={`https://t.me/${supportTelegram.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-control bg-secondary hover:bg-muted text-foreground border border-border/60 px-3.5 py-2 text-xs font-bold transition shadow-xs cursor-pointer group"
                >
                  <Headphones className="h-4 w-4 text-brand group-hover:scale-110 transition-transform" />
                  <span>پشتیبانی تلگرام:</span>
                  <span className="font-mono font-latin dir-ltr text-brand">
                    {supportTelegram}
                  </span>
                </a>
              </div>
            </div>

            {/* Column 2: Quick Links */}
            <div className="space-y-3">
              <h5 className="font-black text-foreground text-xs flex items-center gap-1.5 pb-1 border-b border-border/40">
                <span className="w-1.5 h-1.5 rounded-full bg-brand" />
                <span>دسترسی سریع و صفحات</span>
              </h5>
              <ul className="space-y-2 text-xs">
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
                                className="text-muted-foreground hover:text-brand transition-colors inline-flex items-center gap-1"
                              >
                                <span>←</span>
                                <span>{item.title}</span>
                              </a>
                            ) : (
                              <Link
                                to={item.link}
                                className="text-muted-foreground hover:text-brand transition-colors inline-flex items-center gap-1"
                              >
                                <span>←</span>
                                <span>{item.title}</span>
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
                        className="text-muted-foreground hover:text-brand transition-colors inline-flex items-center gap-1"
                      >
                        <span>←</span>
                        <span>کاتالوگ اشتراک‌ها</span>
                      </a>
                    </li>
                    <li>
                      <Link
                        to="/virtual-numbers"
                        className="text-muted-foreground hover:text-brand transition-colors inline-flex items-center gap-1"
                      >
                        <span>←</span>
                        <span>شماره مجازی (SMS Verification)</span>
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/blog"
                        className="text-muted-foreground hover:text-brand transition-colors inline-flex items-center gap-1"
                      >
                        <span>←</span>
                        <span>وبلاگ و آموزش‌ها (SEO Engine)</span>
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/help"
                        className="text-muted-foreground hover:text-brand transition-colors inline-flex items-center gap-1"
                      >
                        <span>←</span>
                        <span>پایگاه دانش و راهنما</span>
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/track"
                        className="text-muted-foreground hover:text-brand transition-colors inline-flex items-center gap-1"
                      >
                        <span>←</span>
                        <span>پیگیری سفارش و فاکتورها</span>
                      </Link>
                    </li>
                  </>
                )}
              </ul>
            </div>

            {/* Column 3: Top AI Services (Fully Dynamic & Admin Managed) */}
            <div className="space-y-3">
              <h5 className="font-black text-foreground text-xs flex items-center gap-1.5 pb-1 border-b border-border/40">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>سرویس‌های پرطرفدار</span>
              </h5>
              <ul className="space-y-2 text-xs">
                {themeSettings?.footer_services_json ? (
                  (() => {
                    try {
                      const parsed = JSON.parse(
                        themeSettings.footer_services_json,
                      )
                      if (Array.isArray(parsed) && parsed.length > 0) {
                        return parsed.map((item: any) => (
                          <li key={item.id || item.link}>
                            {item.link.startsWith('#') ? (
                              <a
                                href={item.link}
                                className="text-muted-foreground hover:text-brand transition-colors inline-flex items-center gap-1"
                              >
                                <span>⚡</span>
                                <span>{item.title}</span>
                              </a>
                            ) : (
                              <Link
                                to={item.link}
                                className="text-muted-foreground hover:text-brand transition-colors inline-flex items-center gap-1"
                              >
                                <span>⚡</span>
                                <span>{item.title}</span>
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
                      <Link
                        to="/products"
                        className="text-muted-foreground hover:text-brand transition-colors inline-flex items-center gap-1"
                      >
                        <span>⚡</span>
                        <span>اشتراک قانونی ChatGPT Plus</span>
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/products"
                        className="text-muted-foreground hover:text-brand transition-colors inline-flex items-center gap-1"
                      >
                        <span>⚡</span>
                        <span>اکانت اختصاصی Claude 3.7 Sonnet</span>
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/products"
                        className="text-muted-foreground hover:text-brand transition-colors inline-flex items-center gap-1"
                      >
                        <span>⚡</span>
                        <span>لایسنس Google Gemini Advanced</span>
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/products"
                        className="text-muted-foreground hover:text-brand transition-colors inline-flex items-center gap-1"
                      >
                        <span>⚡</span>
                        <span>اکانت Cursor AI ویژه برنامه‌نویسان</span>
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/virtual-numbers"
                        className="text-muted-foreground hover:text-brand transition-colors inline-flex items-center gap-1"
                      >
                        <span>⚡</span>
                        <span>شماره مجازی ۵SIM سرویس‌های خارجی</span>
                      </Link>
                    </li>
                  </>
                )}
              </ul>
            </div>

            {/* Column 4: Trust Badges, E-Namad, Torob & Certifications (Authentic Standard Dimensions) */}
            <div className="space-y-3">
              <h5 className="font-black text-foreground text-xs flex items-center gap-1.5 pb-1 border-b border-border/40">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span>نمادهای رسمی و مجوزها</span>
              </h5>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                دارای مجوزهای قانونی، گواهی اصالت خدمات و درگاه‌های پرداخت تحت
                نظارت شبکه شاپرک:
              </p>

              {/* Trust Badges Grid - Authentic Standard Proportions */}
              <div className="flex items-center gap-2.5 flex-wrap pt-1">
                {footerTrustBadges.map((badge) => {
                  const content = (
                    <div className="w-[88px] sm:w-[94px] h-[102px] sm:h-[108px] rounded-control bg-card border border-border/80 hover:border-brand/50 shadow-xs hover:shadow-md transition-all flex flex-col items-center justify-center p-2 text-center gap-1.5 group cursor-pointer">
                      {badge.image_url ? (
                        <img
                          src={cleanMediaUrl(badge.image_url)}
                          alt={badge.title}
                          className="w-14 h-14 object-contain group-hover:scale-105 transition-transform"
                          onError={(e) => {
                            ;(e.target as HTMLElement).style.display = 'none'
                          }}
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-control bg-secondary text-brand flex items-center justify-center border border-border/60">
                          <ShieldCheck className="w-6 h-6 text-emerald-500" />
                        </div>
                      )}
                      <span className="text-[10px] font-bold text-foreground line-clamp-2 leading-tight w-full px-0.5">
                        {badge.title}
                      </span>
                    </div>
                  )

                  if (badge.link_url && badge.link_url !== '#') {
                    return (
                      <a
                        key={badge.id}
                        href={badge.link_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                        title={badge.title}
                      >
                        {content}
                      </a>
                    )
                  }
                  return <div key={badge.id}>{content}</div>
                })}
              </div>
            </div>
          </div>

          {/* Bottom Copyright Strip */}
          <div className="border-t border-border/60 pt-6 text-center text-xs text-muted-foreground">
            <p>
              © ۱۴۰۵ تمامی حقوق محفوظ است {brandName ? `| ${brandName}` : ''}{' '}
              {brandNameEn ? `(${brandNameEn})` : ''}
            </p>
          </div>
        </div>
      </footer>

      {/* Floating Bottom Cart Bar (Stops cleanly right above the footer boundary) */}
      {cart.itemCount > 0 && !isCartOpen && scrolledPastHeader && (
        <div
          style={{ bottom: `${floatingCartBottom}px` }}
          className="fixed left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-40 animate-in slide-in-from-bottom duration-150 transition-[bottom] ease-out select-none"
        >
          <div className="p-3.5 rounded-surface bg-card/95 backdrop-blur-md border border-brand/40 shadow-overlay flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-control bg-primary text-primary-foreground font-black shadow-control">
                <ShoppingBag className="h-5 w-5" />
                <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-[20px] px-1 items-center justify-center rounded-full bg-rose-500 text-white text-[10px] font-black border-2 border-card font-latin">
                  {toPersianDigits(cart.itemCount)}
                </span>
              </div>
              <div>
                <span className="text-xs font-black text-foreground block">
                  سبد خرید شما ({toPersianDigits(cart.itemCount)} کالا)
                </span>
                <span className="text-[11px] text-muted-foreground font-sans">
                  مبلغ کل: {formatToman(cart.total)} تومان
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="h-9 px-4 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs flex items-center gap-1.5 duration-motion active:scale-95 shadow-control cursor-pointer"
            >
              <span>مشاهده سبد</span>
              <ArrowLeft className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

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
