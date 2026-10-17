import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Coins,
  Copy,
  Flame,
  Gamepad2,
  Globe,
  HelpCircle,
  Loader2,
  Mail,
  MessageCircle,
  RefreshCw,
  Search,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Smartphone,
  Sparkles,
  TrendingDown,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { CartDrawer } from '../components/CartDrawer'
import { Header } from '../components/Header'
import { useNotification } from '../components/vibefarsi/NotificationContext'
import { QuantitySelector } from '../components/vibefarsi/QuantitySelector'
import { CountryFlag } from '../components/virtual/CountryFlag'
import { ServiceBrandIcon } from '../components/virtual/ServiceBrandIcon'
import { cartStore, useCart } from '../lib/cartStore'
import { apiService } from '../services/api'
import type {
  CustomerProfile,
  Product,
  ProductPlan,
  VirtualNumberCountry,
  VirtualNumberOrder,
  VirtualNumberService,
} from '../types'

function toPersianDigits(n: number | string): string {
  const f = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']
  return String(n).replace(/\d/g, (d) => f[Number(d)])
}

// Country Aliases for flexible searching (e.g. آمریکا, امریکا, USA, usa, ایالات متحده)
const COUNTRY_SEARCH_ALIASES: Record<string, string[]> = {
  usa: [
    'آمریکا',
    'امریکا',
    'امريكا',
    'usa',
    'us',
    'united states',
    'ایالات متحده',
    'ایالات متحده آمریکا',
    'ایالات متحده امریکا',
    'یو اس ای',
  ],
  england: [
    'انگلستان',
    'انگلیس',
    'بریتانیا',
    'uk',
    'united kingdom',
    'england',
    'gb',
    'great britain',
  ],
  russia: ['روسیه', 'روسيه', 'russia', 'ru'],
  germany: ['آلمان', 'المان', 'germany', 'de'],
  france: ['فرانسه', 'france', 'fr'],
  canada: ['کانادا', 'كانادا', 'canada', 'ca'],
  turkey: ['ترکیه', 'تركيه', 'turkey', 'tr'],
  netherlands: ['هلند', 'netherlands', 'nl'],
  sweden: ['سوئد', 'sweden', 'se'],
  poland: ['لهستان', 'poland', 'pl'],
  uae: ['امارات', 'دبی', 'دوبی', 'uae', 'united arab emirates'],
  brazil: ['برزیل', 'brazil', 'br'],
  india: ['هند', 'هندوستان', 'india', 'in'],
  indonesia: ['اندونزی', 'indonesia', 'id'],
  malaysia: ['مالزی', 'malaysia', 'my'],
  philippines: ['فیلیپین', 'philippines', 'ph'],
  ukraine: ['اوکراین', 'اكراين', 'ukraine', 'ua'],
  kazakhstan: ['قزاقستان', 'kazakhstan', 'kz'],
  uzbekistan: ['ازبکستان', 'uzbekistan', 'uz'],
}

function matchCountrySearch(c: VirtualNumberCountry, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true

  const countryEn = c.country.toLowerCase()
  const countryFa = c.country_name_fa?.toLowerCase() || ''
  const code = c.country_code?.toLowerCase() || ''

  if (countryEn.includes(q) || countryFa.includes(q) || code.includes(q)) {
    return true
  }

  // Alias dictionary lookup
  for (const [key, aliases] of Object.entries(COUNTRY_SEARCH_ALIASES)) {
    const isThisCountry =
      countryEn === key ||
      countryEn.includes(key) ||
      aliases.some((a) => countryFa.includes(a))

    if (isThisCountry) {
      if (aliases.some((alias) => alias.includes(q) || q.includes(alias))) {
        return true
      }
    }
  }

  return false
}

// Category definitions inspired by Numberland
export type ServiceCategoryKey =
  | 'all'
  | 'popular'
  | 'ai'
  | 'social'
  | 'cloud'
  | 'crypto'
  | 'gaming'
  | 'shopping'

const SERVICE_CATEGORY_TABS: {
  id: ServiceCategoryKey
  label: string
  icon: React.ComponentType<{ className?: string }>
}[] = [
  { id: 'all', label: 'همه سرویس‌ها', icon: Globe },
  { id: 'popular', label: 'محبوب‌ترین‌ها', icon: Flame },
  { id: 'ai', label: 'هوش مصنوعی', icon: Sparkles },
  { id: 'social', label: 'پیام‌رسان و شبکه‌های اجتماعی', icon: MessageCircle },
  { id: 'cloud', label: 'ایمیل و اکانت‌های ابری', icon: Mail },
  { id: 'crypto', label: 'ارز دیجیتال و مالی', icon: Coins },
  { id: 'gaming', label: 'گیمینگ و استریم', icon: Gamepad2 },
  { id: 'shopping', label: 'تاکسی، خرید و سفر', icon: ShoppingBag },
]

const SERVICE_CATEGORY_MAP: Record<string, ServiceCategoryKey[]> = {
  // AI
  openai: ['ai', 'popular'],
  chatgpt: ['ai', 'popular'],
  claude: ['ai', 'popular'],
  anthropic: ['ai', 'popular'],
  google: ['cloud', 'ai', 'popular'],
  cursor: ['ai'],
  deepseek: ['ai', 'popular'],
  suno: ['ai'],
  midjourney: ['ai', 'popular'],
  dalle: ['ai'],
  kimi: ['ai'],

  // Social & Messaging
  telegram: ['social', 'popular'],
  whatsapp: ['social', 'popular'],
  instagram: ['social', 'popular'],
  twitter: ['social', 'popular'],
  x: ['social', 'popular'],
  discord: ['social', 'gaming', 'popular'],
  tiktok: ['social', 'popular'],
  snapchat: ['social', 'popular'],
  facebook: ['social', 'popular'],
  linkedin: ['social'],
  viber: ['social'],
  wechat: ['social'],
  signal: ['social'],
  vk: ['social'],
  kakaotalk: ['social'],
  line: ['social'],
  reddit: ['social'],
  tinder: ['social'],
  badoo: ['social'],
  clubhouse: ['social'],
  imo: ['social'],
  likee: ['social'],
  tantan: ['social'],
  happn: ['social'],
  hily: ['social'],
  skout: ['social'],
  okcupid: ['social'],
  weibo: ['social'],

  // Cloud & Email
  apple: ['cloud', 'popular'],
  microsoft: ['cloud', 'popular'],
  yahoo: ['cloud'],
  protonmail: ['cloud'],
  amazon: ['cloud', 'shopping', 'popular'],
  zoho: ['cloud'],
  aol: ['cloud'],
  mailru: ['cloud'],
  fastmail: ['cloud'],
  mega: ['cloud'],
  samsung: ['cloud'],
  xiaomi: ['cloud'],
  huawei: ['cloud'],

  // Crypto & Finance
  binance: ['crypto', 'popular'],
  paypal: ['crypto', 'popular'],
  coinbase: ['crypto'],
  cryptocom: ['crypto'],
  localbitcoins: ['crypto'],
  blockchain: ['crypto'],
  tradingview: ['crypto'],
  wise: ['crypto'],
  skrill: ['crypto'],
  okx: ['crypto', 'popular'],
  webmoney: ['crypto'],
  qiwi: ['crypto'],
  wallethub: ['crypto'],
  sugarwallet: ['crypto'],
  xworldwallet: ['crypto'],
  papara: ['crypto'],
  revolut: ['crypto'],

  // Gaming & Streaming
  steam: ['gaming', 'popular'],
  netflix: ['gaming', 'popular'],
  spotify: ['gaming', 'popular'],
  blizzard: ['gaming'],
  g2a: ['gaming'],
  gameflip: ['gaming'],
  roblox: ['gaming'],
  twitch: ['gaming'],
  xbox: ['gaming'],
  pubg: ['gaming'],
  garena: ['gaming'],

  // Shopping & Travel
  uber: ['shopping', 'popular'],
  airbnb: ['shopping'],
  bolt: ['shopping'],
  ebay: ['shopping'],
  shopee: ['shopping'],
  nike: ['shopping'],
  adidas: ['shopping'],
  temu: ['shopping'],
  trendyol: ['shopping'],
  alibaba: ['shopping'],
  aliexpress: ['shopping'],
  alipay: ['shopping'],
  deliveroo: ['shopping'],
  foodpanda: ['shopping'],
  doordash: ['shopping'],
  upwork: ['shopping'],
  fiverr: ['shopping'],
  freelancer: ['shopping'],
  ticketmaster: ['shopping'],
  wish: ['shopping'],
}

export const VirtualNumbersPage: React.FC = () => {
  const { success, error } = useNotification()
  const { items: cartItems, removeItem, updateQuantity } = useCart()

  // Cart state
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [customer, setCustomer] = useState<CustomerProfile | null>(null)

  // Services & Countries from live API
  const [services, setServices] = useState<VirtualNumberService[]>([])
  const [servicesLoading, setServicesLoading] = useState(true)

  // Step state: null means Step 1 (Browse Services), otherwise Step 2 (Countries for selectedService)
  const [selectedService, setSelectedService] =
    useState<VirtualNumberService | null>(null)
  const [countries, setCountries] = useState<VirtualNumberCountry[]>([])
  const [countriesLoading, setCountriesLoading] = useState(false)

  // Search & filter states
  const [serviceSearch, setServiceSearch] = useState('')
  const [selectedCategory, setSelectedCategory] =
    useState<ServiceCategoryKey>('all')

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<ServiceCategoryKey, number> = {
      all: services.length,
      popular: 0,
      ai: 0,
      social: 0,
      cloud: 0,
      crypto: 0,
      gaming: 0,
      shopping: 0,
    }

    for (const s of services) {
      const mapped = SERVICE_CATEGORY_MAP[s.slug.toLowerCase()] || []
      if (s.is_popular || mapped.includes('popular')) counts.popular++
      if (mapped.includes('ai')) counts.ai++
      if (mapped.includes('social')) counts.social++
      if (mapped.includes('cloud')) counts.cloud++
      if (mapped.includes('crypto')) counts.crypto++
      if (mapped.includes('gaming')) counts.gaming++
      if (mapped.includes('shopping')) counts.shopping++
    }

    return counts
  }, [services])

  // Category horizontal scroll controls & state
  const categoryScrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const checkCategoryScroll = () => {
    if (!categoryScrollRef.current) return
    const { scrollLeft, scrollWidth, clientWidth } = categoryScrollRef.current
    const maxScroll = scrollWidth - clientWidth
    const absScroll = Math.abs(scrollLeft)
    // In RTL, scrollLeft can be negative or positive depending on engine
    setCanScrollLeft(absScroll < maxScroll - 8)
    setCanScrollRight(absScroll > 8)
  }

  const scrollCategories = (direction: 'left' | 'right') => {
    if (!categoryScrollRef.current) return
    const delta = direction === 'left' ? -280 : 280
    categoryScrollRef.current.scrollBy({ left: delta, behavior: 'smooth' })
  }

  useEffect(() => {
    checkCategoryScroll()
    const el = categoryScrollRef.current
    if (el) {
      el.addEventListener('scroll', checkCategoryScroll)
      window.addEventListener('resize', checkCategoryScroll)
      return () => {
        el.removeEventListener('scroll', checkCategoryScroll)
        window.removeEventListener('resize', checkCategoryScroll)
      }
    }
  }, [categoryCounts])

  const [countrySearch, setCountrySearch] = useState('')
  const [countryStockFilter, setCountryStockFilter] = useState<
    'all' | 'in_stock'
  >('all')
  const [countrySort, setCountrySort] = useState<
    'default' | 'price_asc' | 'price_desc' | 'stock_desc'
  >('default')

  // Pagination / Chunked rendering state
  const [visibleCount, setVisibleCount] = useState<number>(18)

  // Selected operator state for each country (countryCode -> operatorName)
  const [selectedOperators, setSelectedOperators] = useState<
    Record<string, string>
  >({})

  // Active Order / Checkout
  const [buyingCountry, setBuyingCountry] =
    useState<VirtualNumberCountry | null>(null)
  const [customerPhone, setCustomerPhone] = useState('09123456789')
  const [buyLoading, setBuyLoading] = useState(false)
  const [buyError, setBuyError] = useState<string | null>(null)

  // Live order tracking
  const [activeOrder, setActiveOrder] = useState<VirtualNumberOrder | null>(
    () => {
      const list = apiService.getCustomerVirtualOrders()
      return (
        list.find((o) => o.status === 'PENDING' || o.status === 'RECEIVED') ||
        null
      )
    },
  )
  const [copiedPhone, setCopiedPhone] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [finishing, setFinishing] = useState(false)

  // Load Services from live backend
  const loadServices = async () => {
    setServicesLoading(true)
    try {
      const list = await apiService.getVirtualServices()
      setServices(list)
    } finally {
      setServicesLoading(false)
    }
  }

  useEffect(() => {
    loadServices()
    apiService.getCustomerProfile().then((p) => {
      if (p) setCustomer(p)
    })
  }, [])

  // When a service is selected, fetch countries & operator pricing from live provider
  useEffect(() => {
    if (!selectedService) {
      setCountries([])
      return
    }

    let isMounted = true
    setCountriesLoading(true)
    setCountrySearch('')
    setVisibleCount(18)

    apiService
      .getVirtualCountries(selectedService.slug)
      .then((countryList) => {
        if (!isMounted) return
        setCountries(countryList)

        // Initialize default operator selections
        const initialOps: Record<string, string> = {}
        for (const c of countryList) {
          initialOps[c.country] = c.default_operator || c.operators[0]?.operator
        }
        setSelectedOperators(initialOps)
      })
      .catch(() => {
        if (!isMounted) return
        setCountries([])
      })
      .finally(() => {
        if (isMounted) setCountriesLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [selectedService])

  // Poll active order for incoming SMS OTP
  useEffect(() => {
    if (
      !activeOrder ||
      activeOrder.status === 'FINISHED' ||
      activeOrder.status === 'CANCELED' ||
      activeOrder.status === 'TIMEOUT'
    ) {
      return
    }

    const interval = setInterval(async () => {
      try {
        const updated = await apiService.getVirtualOrderDetail(activeOrder.id)
        setActiveOrder(updated)
        apiService.updateCustomerVirtualOrder(updated)
      } catch {
        // network polling fallback
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [activeOrder])

  // Filtered Services List (Category + Search query)
  const filteredServices = useMemo(() => {
    const q = serviceSearch.trim().toLowerCase()
    return services.filter((s) => {
      // Category check
      if (selectedCategory !== 'all') {
        const mappedCategories =
          SERVICE_CATEGORY_MAP[s.slug.toLowerCase()] || []
        const isPop = s.is_popular
        if (
          selectedCategory === 'popular' &&
          !isPop &&
          !mappedCategories.includes('popular')
        ) {
          return false
        }
        if (
          selectedCategory !== 'popular' &&
          !mappedCategories.includes(selectedCategory)
        ) {
          return false
        }
      }

      if (!q) return true
      return (
        s.slug.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s.name_fa.toLowerCase().includes(q)
      )
    })
  }, [services, serviceSearch, selectedCategory])

  // Filtered & Sorted Countries List
  const filteredCountries = useMemo(() => {
    const q = countrySearch.trim().toLowerCase()
    let list = [...countries]

    if (countryStockFilter === 'in_stock') {
      list = list.filter((c) => c.total_stock > 0)
    }

    if (q) {
      list = list.filter((c) => matchCountrySearch(c, q))
    }

    // Apply Sorting: price_asc, price_desc, stock_desc, default
    if (countrySort === 'price_asc') {
      list.sort((a, b) => a.cheapest_price_toman - b.cheapest_price_toman)
    } else if (countrySort === 'price_desc') {
      list.sort((a, b) => b.cheapest_price_toman - a.cheapest_price_toman)
    } else if (countrySort === 'stock_desc') {
      list.sort((a, b) => b.total_stock - a.total_stock)
    }

    return list
  }, [countries, countrySearch, countryStockFilter, countrySort])

  // Chunked countries to render for high performance without DOM lag
  const displayedCountries = useMemo(() => {
    return filteredCountries.slice(0, visibleCount)
  }, [filteredCountries, visibleCount])

  // Helper to query quantity of a specific virtual number in cart
  const getCartItemQuantity = (
    serviceSlug: string,
    countryKey: string,
    operatorName: string,
  ) => {
    const pid = `vn-${serviceSlug}-${countryKey}-${operatorName}`
    const found = cartItems.find((it) => String(it.product.id) === pid)
    return found ? found.quantity : 0
  }

  // Handle increasing, decreasing, or deleting item from cart
  const handleQuantityChange = (
    country: VirtualNumberCountry,
    newQty: number,
    operatorOverride?: string,
  ) => {
    if (!selectedService) return
    const op =
      operatorOverride ||
      selectedOperators[country.country] ||
      country.default_operator
    const pid = `vn-${selectedService.slug}-${country.country}-${op}`
    if (newQty <= 0) {
      removeItem(pid)
    } else {
      const existing = cartItems.find((it) => String(it.product.id) === pid)
      if (existing) {
        updateQuantity(pid, newQty)
      } else {
        handleAddToCart(country, op)
      }
    }
  }

  // Add virtual number to cart
  const handleAddToCart = (
    country: VirtualNumberCountry,
    operatorOverride?: string,
  ) => {
    if (!selectedService) return

    const op =
      operatorOverride ||
      selectedOperators[country.country] ||
      country.default_operator
    const opObj =
      country.operators.find((o) => o.operator === op) || country.operators[0]
    const price = opObj?.price_toman || country.cheapest_price_toman

    const vnProduct: Product = {
      id: `vn-${selectedService.slug}-${country.country}-${op}`,
      title: `شماره مجازی ${selectedService.name_fa} (${country.country_name_fa})`,
      title_fa: `شماره مجازی ${selectedService.name_fa} (${country.country_name_fa})`,
      slug: `vn-${selectedService.slug}-${country.country}`,
      category: 'virtual_number',
      price_toman: price,
      base_cost_usd: opObj?.cost_usd || 0.1,
      delivery_mode: 'INSTANT_DELIVERY',
      delivery_type: 'instant',
      cover_image:
        country.flag_url ||
        `https://flagcdn.com/w40/${country.country_code || 'un'}.png`,
      stock: opObj?.count || 10,
      is_active: true,
      description: `شماره مجازی اختصاصی سرویس ${selectedService.name_fa} برای کشور ${country.country_name_fa} (اپراتور ${op})`,
      tags: [selectedService.slug, country.country, op, 'virtual_number'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as any

    const vnPlan: ProductPlan = {
      id: op,
      title: `اپراتور ${op}`,
      duration_days: 1,
      duration_text: 'دریافت پیامک یکبار مصرف (۱۵ دقیقه)',
      price_toman: price,
      is_default: true,
      features: [
        `دریافت آنی پیامک تایید برای ${selectedService.name_fa}`,
        'تضمین ۱۰۰٪ استرداد وجه در صورت عدم دریافت پیامک',
      ],
    }

    cartStore.addItem(vnProduct, 1, vnPlan)
    success(
      'به سبد خرید اضافه شد',
      `شماره مجازی ${selectedService.name_fa} (${country.country_name_fa} - ${op}) با موفقیت به سبد خرید افزوده شد.`,
    )
    setBuyingCountry(null)
  }

  // Handle instant buy
  const handleConfirmPurchase = async (
    country: VirtualNumberCountry,
    operatorOverride?: string,
  ) => {
    if (!selectedService) return

    setBuyLoading(true)
    setBuyError(null)

    const op =
      operatorOverride ||
      selectedOperators[country.country] ||
      country.default_operator

    try {
      const order = await apiService.buyVirtualNumber({
        country: country.country,
        service: selectedService.slug,
        operator: op,
        customer_phone: customerPhone,
      })
      setActiveOrder(order)
      apiService.saveCustomerVirtualOrder(order)
      setBuyingCountry(null)
      success(
        'شماره مجازی با موفقیت صادر شد',
        `شماره ${order.phone} آماده دریافت پیامک است.`,
      )
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err: any) {
      const msg = err?.message || 'خطا در صدور شماره مجازی'
      setBuyError(msg)
      error('خطا در خرید شماره', msg)
    } finally {
      setBuyLoading(false)
    }
  }

  const handleCancelOrder = async () => {
    if (!activeOrder) return
    setCancelling(true)
    try {
      await apiService.cancelVirtualOrder(activeOrder.id)
      const updated = await apiService.getVirtualOrderDetail(activeOrder.id)
      setActiveOrder(updated)
      apiService.updateCustomerVirtualOrder(updated)
      success(
        'سفارش لغو شد',
        'وجه پرداختی به طور آنی به کیف پول شما استرداد گردید.',
      )
    } catch (err: any) {
      error('خطا در لغو سفارش', err.message || 'عملیات لغو انجام نشد')
    } finally {
      setCancelling(false)
    }
  }

  const handleFinishOrder = async () => {
    if (!activeOrder) return
    setFinishing(true)
    try {
      await apiService.finishVirtualOrder(activeOrder.id)
      const updated = await apiService.getVirtualOrderDetail(activeOrder.id)
      setActiveOrder(updated)
      apiService.updateCustomerVirtualOrder(updated)
      success('سفارش تکمیل شد', 'از خرید شما سپاسگزاریم.')
    } finally {
      setFinishing(false)
    }
  }

  const handleCopyPhone = () => {
    if (!activeOrder?.phone) return
    navigator.clipboard.writeText(activeOrder.phone)
    setCopiedPhone(true)
    success('شماره تلفن کپی شد', activeOrder.phone)
    setTimeout(() => setCopiedPhone(false), 2000)
  }

  const handleCopyCode = () => {
    if (!activeOrder?.sms_code) return
    navigator.clipboard.writeText(activeOrder.sms_code)
    setCopiedCode(true)
    success('کد پیامک کپی شد', activeOrder.sms_code)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-background text-foreground transition-colors font-sans"
    >
      <Header onOpenCart={() => setIsCartOpen(true)} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* ACTIVE ORDER WORKBENCH (Pinned Live OTP Receiver) */}
        {activeOrder && (
          <section className="relative overflow-hidden rounded-surface bg-card border border-brand/50 p-5 sm:p-7 shadow-surface duration-motion ease-motion transition-all">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-border/60">
              <div className="flex items-center gap-3">
                <span className="flex h-3.5 w-3.5 relative">
                  <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      activeOrder.status === 'RECEIVED'
                        ? 'bg-emerald-400'
                        : activeOrder.status === 'PENDING'
                          ? 'bg-brand'
                          : 'bg-muted-foreground'
                    }`}
                  />
                  <span
                    className={`relative inline-flex rounded-full h-3.5 w-3.5 ${
                      activeOrder.status === 'RECEIVED'
                        ? 'bg-emerald-500'
                        : activeOrder.status === 'PENDING'
                          ? 'bg-brand'
                          : 'bg-muted-foreground'
                    }`}
                  />
                </span>
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-foreground flex items-center gap-2">
                    میز کار شماره مجازی فعال
                    <span className="text-xs font-mono px-2 py-0.5 rounded-control bg-muted text-foreground border border-border/60">
                      #{activeOrder.order_no}
                    </span>
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    سرویس {activeOrder.service_name_fa} •{' '}
                    {activeOrder.country_name_fa} {activeOrder.country_flag}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                <div className="flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-control bg-muted/60 border border-border/60 text-foreground font-latin">
                  <Clock className="w-3.5 h-3.5 text-brand animate-spin" />
                  <span>
                    زمان باقی‌مانده:{' '}
                    {toPersianDigits(
                      Math.floor(activeOrder.seconds_remaining / 60),
                    )}
                    :
                    {toPersianDigits(
                      (activeOrder.seconds_remaining % 60)
                        .toString()
                        .padStart(2, '0'),
                    )}
                  </span>
                </div>

                {activeOrder.status === 'PENDING' && (
                  <button
                    type="button"
                    onClick={handleCancelOrder}
                    disabled={cancelling}
                    className="h-8 px-3 rounded-control text-xs font-bold text-destructive hover:bg-destructive/10 border border-destructive/30 duration-motion ease-motion active:scale-[0.98] cursor-pointer disabled:opacity-50"
                  >
                    {cancelling ? 'در حال لغو...' : 'لغو سفارش و استرداد وجه'}
                  </button>
                )}

                {activeOrder.status === 'RECEIVED' && (
                  <button
                    type="button"
                    onClick={handleFinishOrder}
                    disabled={finishing}
                    className="h-8 px-3 rounded-control text-xs font-bold bg-primary hover:bg-primary-hover text-primary-foreground duration-motion ease-motion active:scale-[0.98] shadow-control cursor-pointer"
                  >
                    {finishing ? 'در حال ثبت...' : 'تکمیل و پایان'}
                  </button>
                )}
              </div>
            </div>

            {/* Phone & OTP Display */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-5">
              {/* Phone Display Box */}
              <div className="rounded-control border border-border/60 bg-muted/20 p-4 space-y-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>شماره تلفن اختصاصی شما:</span>
                  <span className="font-bold text-foreground">
                    {activeOrder.country_name_fa}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div
                    dir="ltr"
                    className="font-mono text-xl sm:text-2xl font-black tracking-wider text-foreground"
                  >
                    {activeOrder.phone}
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyPhone}
                    className="h-8 px-3 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs duration-motion ease-motion active:scale-[0.98] shadow-control flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedPhone ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedPhone ? 'کپی شد' : 'کپی شماره'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  شماره را در فیلد ورود یا ثبت‌نام سرویس وارد کرده و دکمه ارسال
                  پیامک را بزنید.
                </p>
              </div>

              {/* SMS Code Display Box */}
              <div
                className={`rounded-control border p-4 transition-all flex flex-col justify-center ${
                  activeOrder.sms_code
                    ? 'border-emerald-500/50 bg-emerald-500/10 shadow-control'
                    : 'border-dashed border-border/80 bg-muted/10'
                }`}
              >
                {activeOrder.sms_code ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        پیامک تایید دریافت شد!
                      </span>
                      <span className="text-[11px] text-muted-foreground font-mono">
                        SMS OTP
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <div
                        dir="ltr"
                        className="font-mono text-3xl font-black text-white tracking-widest"
                      >
                        {activeOrder.sms_code}
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyCode}
                        className="h-8 px-3 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs duration-motion ease-motion active:scale-[0.98] shadow-control flex items-center gap-1.5 cursor-pointer"
                      >
                        {copiedCode ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span>{copiedCode ? 'کپی شد' : 'کپی کد'}</span>
                      </button>
                    </div>
                    {activeOrder.sms_text && (
                      <div
                        className="text-xs text-muted-foreground p-2 rounded-control bg-muted/40 font-mono text-left"
                        dir="ltr"
                      >
                        {activeOrder.sms_text}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-2 text-center space-y-2">
                    <div className="inline-flex items-center justify-center p-2 rounded-control bg-brand/10 text-brand animate-pulse">
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </div>
                    <div className="text-xs font-bold text-foreground">
                      در حال گوش دادن به پیامک‌های دریافتی...
                    </div>
                    <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
                      به محض ارسال پیامک توسط اپلیکیشن، کد تایید به‌طور خودکار در
                      اینجا نمایش داده می‌شود.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* STEP 1: SERVICE SELECTION (When no service is selected) */}
        {!selectedService ? (
          <div className="space-y-6 sm:space-y-8">
            {/* Numberland-Inspired Hero & Trust Banner */}
            <div className="text-center space-y-3.5 max-w-3xl mx-auto pt-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-control bg-brand/10 border border-brand/30 text-brand text-xs font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>
                  سامانه هوشمند شماره‌های مجازی آناهیکس (انطباق با نامبرلند)
                </span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black text-foreground tracking-tight leading-tight">
                خرید شماره مجازی دریافت پیامک (SMS OTP)
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                شماره‌های اختصاصی بیش از ۱۸۰ کشور دنیا با تحویل لحظه‌ای و ضمانت
                ۱۰۰٪ استرداد وجه در صورت عدم دریافت پیامک.
              </p>
            </div>

            {/* Value Highlights Pill Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-control border border-border/60 bg-card flex items-center gap-2.5 shadow-xs">
                <div className="w-8 h-8 rounded-control bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                  <Zap className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-foreground truncate">
                    تحویل آنی و خودکار
                  </div>
                  <div className="text-[10px] text-muted-foreground truncate">
                    دریافت لحظه‌ای کد
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-control border border-border/60 bg-card flex items-center gap-2.5 shadow-xs">
                <div className="w-8 h-8 rounded-control bg-brand/10 text-brand flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-foreground truncate">
                    استرداد ۱۰۰٪ وجه
                  </div>
                  <div className="text-[10px] text-muted-foreground truncate">
                    عدم دریافت = بازگشت وجه
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-control border border-border/60 bg-card flex items-center gap-2.5 shadow-xs">
                <div className="w-8 h-8 rounded-control bg-sky-500/10 text-sky-400 flex items-center justify-center shrink-0">
                  <Globe className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-foreground truncate">
                    ۱۸۰+ کشور جهان
                  </div>
                  <div className="text-[10px] text-muted-foreground truncate">
                    آمریکا، انگلیس، اروپا...
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-control border border-border/60 bg-card flex items-center gap-2.5 shadow-xs">
                <div className="w-8 h-8 rounded-control bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-foreground truncate">
                    ۱۰۰٪ شماره اختصاصی
                  </div>
                  <div className="text-[10px] text-muted-foreground truncate">
                    بدون استفاده اشتراکی
                  </div>
                </div>
              </div>
            </div>

            {/* Category Filter Tabs with High-Contrast Badges & Scroll Controls (Numberland Standard) */}
            <div className="relative group/tabs">
              {/* Left Scroll Chevron Button & Fade Mask */}
              <div
                className={`absolute left-0 top-0 bottom-0 z-10 flex items-center pr-3 pl-1 bg-gradient-to-r from-background via-background/90 to-transparent transition-opacity duration-200 ${
                  canScrollLeft
                    ? 'opacity-100 pointer-events-auto'
                    : 'opacity-0 pointer-events-none'
                }`}
              >
                <button
                  type="button"
                  onClick={() => scrollCategories('left')}
                  className="w-7 h-7 rounded-full bg-card border border-border/80 text-foreground flex items-center justify-center shadow-control hover:bg-muted transition-all cursor-pointer hover:scale-105 active:scale-95"
                  aria-label="اسکرول به چپ"
                  title="مشاهده سایر دسته‌ها"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>

              {/* Right Scroll Chevron Button & Fade Mask */}
              <div
                className={`absolute right-0 top-0 bottom-0 z-10 flex items-center pl-3 pr-1 bg-gradient-to-l from-background via-background/90 to-transparent transition-opacity duration-200 ${
                  canScrollRight
                    ? 'opacity-100 pointer-events-auto'
                    : 'opacity-0 pointer-events-none'
                }`}
              >
                <button
                  type="button"
                  onClick={() => scrollCategories('right')}
                  className="w-7 h-7 rounded-full bg-card border border-border/80 text-foreground flex items-center justify-center shadow-control hover:bg-muted transition-all cursor-pointer hover:scale-105 active:scale-95"
                  aria-label="اسکرول به راست"
                  title="مشاهده دسته‌های قبل"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Category Pills Scroll Container */}
              <div
                ref={categoryScrollRef}
                onScroll={checkCategoryScroll}
                className="flex items-center gap-1.5 overflow-x-auto pb-1 px-1 scrollbar-none scroll-smooth"
              >
                {SERVICE_CATEGORY_TABS.map((tab) => {
                  const IconComponent = tab.icon
                  const isActive = selectedCategory === tab.id
                  const count = categoryCounts[tab.id]

                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setSelectedCategory(tab.id)}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-control text-xs font-bold whitespace-nowrap transition-all duration-motion ease-motion active:scale-[0.98] cursor-pointer shrink-0 ${
                        isActive
                          ? 'bg-primary text-primary-foreground shadow-control font-black ring-1 ring-primary/40'
                          : 'border border-border/60 bg-card hover:bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <IconComponent className="w-3.5 h-3.5 shrink-0" />
                      <span>{tab.label}</span>
                      {count > 0 && (
                        <span
                          className={`text-[11px] px-2 py-0.5 rounded-full font-bold font-latin transition-all shadow-xs shrink-0 ${
                            isActive
                              ? 'bg-primary-foreground text-primary font-black ring-1 ring-black/10'
                              : 'bg-muted text-foreground border border-border/80 font-bold'
                          }`}
                        >
                          {toPersianDigits(count)}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Visual hint indicator for scrollable container */}
              {canScrollLeft && (
                <div className="flex items-center justify-end gap-1 pt-1.5 text-[10px] text-muted-foreground/80 font-medium sm:hidden">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-brand animate-ping" />
                  <span>اسکرول به چپ برای مشاهده سایر دسته‌بندی‌ها ←</span>
                </div>
              )}
            </div>

            {/* Search Input Bar */}
            <div className="p-3 sm:p-4 rounded-surface border border-border/60 bg-card shadow-surface flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:max-w-md">
                <Search className="w-4 h-4 text-muted-foreground absolute right-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="جستجوی سرویس (تلگرام، OpenAI، واتساپ، اینستاگرام، گوگل...)"
                  value={serviceSearch}
                  onChange={(e) => setServiceSearch(e.target.value)}
                  className="w-full pr-10 pl-9 h-10 rounded-field border border-border/60 bg-muted/20 text-xs text-foreground outline-none focus:border-foreground/40 transition-colors"
                />
                {serviceSearch && (
                  <button
                    type="button"
                    onClick={() => setServiceSearch('')}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="text-xs text-muted-foreground self-end sm:self-auto font-latin">
                نمایش{' '}
                <span className="font-bold text-foreground">
                  {toPersianDigits(filteredServices.length)}
                </span>{' '}
                از {toPersianDigits(services.length)} سرویس
              </div>
            </div>

            {/* Services Grid with Numberland-Style Cards */}
            {servicesLoading ? (
              <div className="py-24 text-center space-y-3">
                <RefreshCw className="w-8 h-8 text-foreground animate-spin mx-auto" />
                <p className="text-xs text-muted-foreground">
                  در حال بارگذاری لیست زنده سرویس‌ها...
                </p>
              </div>
            ) : filteredServices.length === 0 ? (
              <div className="py-16 text-center space-y-2 rounded-surface border border-border/60 bg-card p-8">
                <HelpCircle className="w-8 h-8 text-muted-foreground mx-auto" />
                <p className="text-sm font-bold text-foreground">
                  سرویسی مطابق با فیلتر انتخابی یافت نشد.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('all')
                    setServiceSearch('')
                  }}
                  className="text-xs font-bold text-brand hover:underline pt-2 cursor-pointer"
                >
                  نمایش تمامی سرویس‌ها
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredServices.map((service) => {
                  return (
                    <button
                      key={service.slug}
                      type="button"
                      onClick={() => setSelectedService(service)}
                      className="text-right p-4 rounded-surface border border-border/60 bg-card hover:border-brand/50 duration-motion ease-motion transition-all hover:-translate-y-1 group flex flex-col justify-between space-y-4 shadow-surface cursor-pointer relative overflow-hidden"
                    >
                      <div className="flex items-start justify-between w-full">
                        <div className="flex items-center gap-3 min-w-0">
                          <ServiceBrandIcon
                            slug={service.slug}
                            iconUrl={
                              service.icon?.startsWith('http') ||
                              service.icon?.startsWith('/')
                                ? service.icon
                                : undefined
                            }
                            size={22}
                            className="w-10 h-10 group-hover:scale-105 transition-transform"
                          />
                          <div className="min-w-0">
                            <h3 className="text-sm font-black text-foreground group-hover:text-brand transition-colors truncate">
                              {service.name_fa}
                            </h3>
                            <span className="text-[11px] text-muted-foreground font-latin truncate block">
                              {service.name}
                            </span>
                          </div>
                        </div>

                        {service.is_popular && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-control bg-brand/10 text-brand border border-brand/20 flex items-center gap-1 shrink-0">
                            <Flame className="w-2.5 h-2.5" />
                            محبوب
                          </span>
                        )}
                      </div>

                      <div className="w-full pt-3 border-t border-border/40 flex items-center justify-between text-xs">
                        <div>
                          <span className="text-muted-foreground text-[10px] block">
                            شروع قیمت از
                          </span>
                          <span className="font-bold text-foreground font-latin">
                            {toPersianDigits(
                              service.min_price_toman.toLocaleString(),
                            )}{' '}
                            <span className="text-[10px] font-normal text-muted-foreground font-sans">
                              تومان
                            </span>
                          </span>
                        </div>

                        <div className="flex items-center gap-1 text-xs font-bold text-brand group-hover:translate-x-[-3px] transition-transform">
                          <span>انتخاب کشور</span>
                          <ArrowLeft className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        ) : (
          /* STEP 2: COUNTRY & OPERATOR SELECTION (For Chosen Service) */
          <div className="space-y-6">
            {/* Header & Back Button */}
            <div className="p-5 sm:p-6 rounded-surface border border-border/60 bg-card shadow-surface flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <button
                  type="button"
                  onClick={() => setSelectedService(null)}
                  className="h-9 px-3 rounded-control border border-border/60 bg-muted/30 hover:bg-muted text-xs font-bold text-foreground duration-motion ease-motion active:scale-[0.98] flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>تغییر سرویس</span>
                </button>

                <div className="h-5 w-px bg-border/60 hidden sm:block" />

                <div className="flex items-center gap-3">
                  <ServiceBrandIcon
                    slug={selectedService.slug}
                    iconUrl={
                      selectedService.icon?.startsWith('http') ||
                      selectedService.icon?.startsWith('/')
                        ? selectedService.icon
                        : undefined
                    }
                    size={22}
                    className="w-10 h-10"
                  />
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-foreground flex items-center gap-2">
                      شماره مجازی {selectedService.name_fa}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      کشور و اپراتور دلخواه خود را برای دریافت پیامک انتخاب کنید
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-3 py-1 rounded-control bg-muted/60 text-foreground border border-border/60 font-latin">
                  {toPersianDigits(countries.length)} کشور فعال
                </span>
                <span className="text-xs font-bold px-3 py-1 rounded-control bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  تحویل آنی
                </span>
              </div>
            </div>

            {/* Country Filters: Search, Stock, and Price Sorting */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-surface border border-border/60 bg-card shadow-surface duration-motion ease-motion">
              {/* Search within countries */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-muted-foreground absolute right-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="جستجوی کشور (آمریکا / USA، انگلیس، آلمان، اندونزی...)"
                  value={countrySearch}
                  onChange={(e) => {
                    setCountrySearch(e.target.value)
                    setVisibleCount(18)
                  }}
                  className="w-full pr-10 pl-4 h-10 rounded-field border border-border/60 bg-muted/30 text-xs text-foreground outline-none focus:border-foreground/40 transition-colors"
                />
              </div>

              {/* Filters & Sorting Toolbar */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Stock filter pill */}
                <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-control border border-border/40">
                  <button
                    type="button"
                    onClick={() => {
                      setCountryStockFilter('all')
                      setVisibleCount(18)
                    }}
                    className={`text-xs px-2.5 py-1.5 rounded-control font-bold duration-motion ease-motion transition-all cursor-pointer ${
                      countryStockFilter === 'all'
                        ? 'bg-primary text-primary-foreground font-black shadow-control'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    همه ({toPersianDigits(countries.length)})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCountryStockFilter('in_stock')
                      setVisibleCount(18)
                    }}
                    className={`text-xs px-2.5 py-1.5 rounded-control font-bold duration-motion ease-motion transition-all cursor-pointer ${
                      countryStockFilter === 'in_stock'
                        ? 'bg-primary text-primary-foreground font-black shadow-control'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    فقط موجود
                  </button>
                </div>

                {/* Price & Stock Sorting Pills */}
                <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-control border border-border/40">
                  <button
                    type="button"
                    onClick={() => {
                      setCountrySort('default')
                      setVisibleCount(18)
                    }}
                    className={`text-xs px-2.5 py-1.5 rounded-control font-bold duration-motion ease-motion transition-all cursor-pointer ${
                      countrySort === 'default'
                        ? 'bg-primary text-primary-foreground font-black shadow-control'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    title="مرتب‌سازی پیشنهادی"
                  >
                    پیشنهادی
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCountrySort('price_asc')
                      setVisibleCount(18)
                    }}
                    className={`text-xs px-2.5 py-1.5 rounded-control font-bold duration-motion ease-motion flex items-center gap-1 transition-all cursor-pointer ${
                      countrySort === 'price_asc'
                        ? 'bg-primary text-primary-foreground font-black shadow-control'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    title="مرتب‌سازی از ارزان‌ترین به گران‌ترین"
                  >
                    <TrendingDown className="w-3.5 h-3.5" />
                    <span>ارزان به گران</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCountrySort('price_desc')
                      setVisibleCount(18)
                    }}
                    className={`text-xs px-2.5 py-1.5 rounded-control font-bold duration-motion ease-motion flex items-center gap-1 transition-all cursor-pointer ${
                      countrySort === 'price_desc'
                        ? 'bg-primary text-primary-foreground font-black shadow-control'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    title="مرتب‌سازی از گران‌ترین به ارزان‌ترین"
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>گران به ارزان</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Country Cards Grid with Live Flags & Progressive Pagination */}
            {countriesLoading ? (
              <div className="py-24 text-center space-y-3">
                <RefreshCw className="w-8 h-8 text-foreground animate-spin mx-auto" />
                <p className="text-xs text-muted-foreground">
                  در حال استعلام قیمت و موجودی زنده اپراتورها...
                </p>
              </div>
            ) : filteredCountries.length === 0 ? (
              <div className="py-16 text-center space-y-2 rounded-surface border border-border/60 bg-card p-8">
                <HelpCircle className="w-8 h-8 text-muted-foreground mx-auto" />
                <p className="text-sm font-bold text-foreground">
                  کشوری با این مشخصات یافت نشد.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {displayedCountries.map((c) => {
                    const currentOpName =
                      selectedOperators[c.country] || c.default_operator
                    const activeOp =
                      c.operators.find((op) => op.operator === currentOpName) ||
                      c.operators[0]
                    const isAvailable = activeOp && activeOp.count > 0

                    return (
                      <div
                        key={c.country}
                        className="p-4 sm:p-5 rounded-surface border border-border/60 bg-card shadow-surface duration-motion ease-motion hover:border-border transition-all flex flex-col justify-between space-y-4"
                      >
                        {/* Country Flag & Title */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <CountryFlag
                              country={c.country}
                              countryCode={c.country_code}
                              flagUrl={c.flag_url}
                              countryFlag={c.country_flag}
                            />
                            <div className="min-w-0">
                              <h3 className="text-sm font-black text-foreground truncate">
                                {c.country_name_fa}
                              </h3>
                              <span className="text-[11px] text-muted-foreground font-latin block">
                                {c.country}
                              </span>
                            </div>
                          </div>

                          <div className="text-left shrink-0">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-control bg-muted text-muted-foreground border border-border/40 block font-latin">
                              {c.total_stock > 0
                                ? `${toPersianDigits(c.total_stock)} شماره`
                                : 'ناموجود'}
                            </span>
                            {c.best_rate > 0 && (
                              <span className="text-[10px] text-emerald-400 font-bold block mt-0.5 font-latin">
                                موفقیت:{' '}
                                {toPersianDigits(Math.round(c.best_rate))}٪
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Operator / Tier Selection */}
                        <div className="space-y-1.5 pt-1">
                          <label className="text-[10px] font-bold text-muted-foreground block">
                            اپراتور و رده شماره:
                          </label>

                          {c.operators.length > 1 ? (
                            <div className="relative">
                              <select
                                value={currentOpName}
                                onChange={(e) =>
                                  setSelectedOperators((prev) => ({
                                    ...prev,
                                    [c.country]: e.target.value,
                                  }))
                                }
                                className="w-full text-xs font-latin py-2 pr-3 pl-8 rounded-control border border-border/60 bg-muted/30 text-foreground appearance-none outline-none focus:border-foreground/40 cursor-pointer"
                              >
                                {c.operators.map((op) => (
                                  <option key={op.operator} value={op.operator}>
                                    {op.operator} |{' '}
                                    {toPersianDigits(
                                      op.price_toman.toLocaleString(),
                                    )}{' '}
                                    تومان (موجودی: {toPersianDigits(op.count)})
                                  </option>
                                ))}
                              </select>
                              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>
                          ) : (
                            <div className="text-xs font-latin text-muted-foreground px-3 py-1.5 rounded-control bg-muted/20 border border-border/40">
                              {activeOp?.operator || 'اپراتور استاندارد'}{' '}
                              (موجودی: {toPersianDigits(activeOp?.count || 0)})
                            </div>
                          )}
                        </div>

                        {/* Price & Action Buttons */}
                        <div className="pt-2 flex items-center justify-between gap-2">
                          <div>
                            <span className="text-[10px] text-muted-foreground block">
                              قیمت نهایی
                            </span>
                            <span className="text-sm font-black text-foreground font-latin">
                              {toPersianDigits(
                                (activeOp?.price_toman || 0).toLocaleString(),
                              )}{' '}
                              تومان
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {(() => {
                              const itemQty = getCartItemQuantity(
                                selectedService.slug,
                                c.country,
                                currentOpName,
                              )

                              if (itemQty > 0) {
                                return (
                                  <QuantitySelector
                                    value={itemQty}
                                    onChange={(newQty) =>
                                      handleQuantityChange(
                                        c,
                                        newQty,
                                        currentOpName,
                                      )
                                    }
                                    size="sm"
                                    className="h-9"
                                  />
                                )
                              }

                              return (
                                <button
                                  type="button"
                                  disabled={!isAvailable}
                                  onClick={() =>
                                    handleAddToCart(c, currentOpName)
                                  }
                                  className={`h-9 px-3 rounded-control text-xs font-bold duration-motion ease-motion active:scale-[0.98] transition-all flex items-center gap-1 border ${
                                    isAvailable
                                      ? 'border-border/80 bg-muted/40 hover:bg-muted text-foreground cursor-pointer shadow-xs'
                                      : 'border-border/40 bg-muted/20 text-muted-foreground cursor-not-allowed opacity-50'
                                  }`}
                                  title="افزودن به سبد خرید"
                                >
                                  <ShoppingCart className="w-3.5 h-3.5" />
                                  <span className="hidden sm:inline">
                                    افزودن
                                  </span>
                                </button>
                              )
                            })()}

                            <button
                              type="button"
                              disabled={!isAvailable}
                              onClick={() => setBuyingCountry(c)}
                              className={`h-9 px-3.5 rounded-control text-xs font-black duration-motion ease-motion active:scale-[0.98] transition-all flex items-center gap-1.5 shadow-control ${
                                isAvailable
                                  ? 'bg-primary hover:bg-primary-hover text-primary-foreground cursor-pointer'
                                  : 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'
                              }`}
                            >
                              <Smartphone className="w-3.5 h-3.5" />
                              <span>
                                {isAvailable ? 'خرید آنی' : 'ناموجود'}
                              </span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Progressive Loading ("بارگذاری بیشتر") to prevent DOM overload */}
                {filteredCountries.length > visibleCount && (
                  <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => setVisibleCount((prev) => prev + 18)}
                      className="h-10 px-6 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs duration-motion ease-motion active:scale-[0.98] shadow-control flex items-center gap-2 cursor-pointer font-latin"
                    >
                      <span>
                        بارگذاری شماره‌های بیشتر (نمایش{' '}
                        {toPersianDigits(displayedCountries.length)} از{' '}
                        {toPersianDigits(filteredCountries.length)} کشور)
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setVisibleCount(filteredCountries.length)}
                      className="h-10 px-5 rounded-control border border-border/60 bg-card hover:bg-muted text-xs font-bold text-foreground duration-motion ease-motion active:scale-[0.98] cursor-pointer font-latin"
                    >
                      نمایش تمامی {toPersianDigits(filteredCountries.length)}{' '}
                      کشور
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* CHECKOUT CONFIRMATION MODAL (Rendered with React Portal to document.body with z-[99999] so it 100% covers all banners & headers) */}
        {buyingCountry &&
          selectedService &&
          createPortal(
            <div
              className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in"
              style={{ top: 0, left: 0, right: 0, bottom: 0 }}
            >
              <div className="w-full max-w-md rounded-surface bg-card border border-border/80 p-6 shadow-overlay space-y-5 text-foreground animate-in zoom-in-95">
                <div className="flex items-center justify-between pb-3 border-b border-border/60">
                  <div className="flex items-center gap-2.5">
                    <CountryFlag
                      country={buyingCountry.country}
                      countryCode={buyingCountry.country_code}
                      flagUrl={buyingCountry.flag_url}
                      countryFlag={buyingCountry.country_flag}
                    />
                    <div>
                      <h3 className="text-sm font-black text-foreground">
                        تایید خرید شماره {selectedService.name_fa}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        کشور {buyingCountry.country_name_fa} (
                        {selectedOperators[buyingCountry.country] ||
                          buyingCountry.default_operator}
                        )
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setBuyingCountry(null)}
                    className="p-1 rounded-control text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Order Info Summary */}
                <div className="space-y-2 text-xs bg-muted/30 p-4 rounded-control border border-border/60">
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground">
                      سرویس درخواستی:
                    </span>
                    <span className="font-bold text-foreground">
                      {selectedService.name_fa}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground">کشور:</span>
                    <span className="font-bold text-foreground">
                      {buyingCountry.country_name_fa}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground">
                      اپراتور انتخابی:
                    </span>
                    <span className="font-mono font-bold text-brand">
                      {selectedOperators[buyingCountry.country] ||
                        buyingCountry.default_operator}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-t border-border/60 pt-2 text-sm">
                    <span className="font-black text-foreground">
                      مبلغ قابل پرداخت:
                    </span>
                    <span className="font-black text-foreground font-latin">
                      {toPersianDigits(
                        (
                          buyingCountry.operators.find(
                            (op) =>
                              op.operator ===
                              (selectedOperators[buyingCountry.country] ||
                                buyingCountry.default_operator),
                          )?.price_toman || buyingCountry.cheapest_price_toman
                        ).toLocaleString(),
                      )}{' '}
                      تومان
                    </span>
                  </div>
                </div>

                {/* Customer Phone for Receipt */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground block">
                    شماره موبایل جهت پیگیری پیامکی (اختیاری):
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full h-10 px-3 text-xs font-mono rounded-field border border-border/60 bg-background text-foreground outline-none focus:border-brand/50 transition-colors"
                  />
                </div>

                {buyError && (
                  <div className="p-3 rounded-control bg-destructive/10 border border-destructive/30 text-xs text-destructive flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{buyError}</span>
                  </div>
                )}

                {/* Refund policy notice */}
                <div className="p-3 rounded-control bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>
                    ضمانت کامل بازگشت وجه: در صورتی که پیامکی دریافت نشود، وجه
                    به طور خودکار به کیف پول استرداد می‌گردد.
                  </span>
                </div>

                {/* Action Buttons: Instant Buy + Quantity Stepper / Add to Cart + Cancel */}
                <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
                  <button
                    type="button"
                    disabled={buyLoading}
                    onClick={() => handleConfirmPurchase(buyingCountry)}
                    className="w-full sm:flex-1 h-10 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-black duration-motion ease-motion active:scale-[0.98] shadow-control disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {buyLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>در حال صدور و دریافت شماره...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4" />
                        <span>خرید و دریافت آنی شماره</span>
                      </>
                    )}
                  </button>

                  {(() => {
                    const modalOp =
                      selectedOperators[buyingCountry.country] ||
                      buyingCountry.default_operator
                    const modalQty = getCartItemQuantity(
                      selectedService.slug,
                      buyingCountry.country,
                      modalOp,
                    )

                    if (modalQty > 0) {
                      return (
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <QuantitySelector
                            value={modalQty}
                            onChange={(newQty) =>
                              handleQuantityChange(buyingCountry, newQty)
                            }
                            size="sm"
                            className="h-10 w-full sm:w-auto"
                          />
                        </div>
                      )
                    }

                    return (
                      <button
                        type="button"
                        onClick={() => handleAddToCart(buyingCountry)}
                        className="w-full sm:w-auto h-10 px-4 rounded-control border border-border/80 bg-muted/40 hover:bg-muted text-xs font-bold text-foreground flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <ShoppingCart className="w-4 h-4 text-brand" />
                        <span>افزودن به سبد</span>
                      </button>
                    )
                  })()}

                  <button
                    type="button"
                    onClick={() => setBuyingCountry(null)}
                    className="w-full sm:w-auto h-10 px-4 rounded-control border border-border/60 hover:bg-muted text-xs font-bold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    انصراف
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )}

        {/* Feature Highlights Footer */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-8 text-center">
          <div className="p-5 rounded-surface border border-border/60 bg-card shadow-surface space-y-2">
            <div className="w-9 h-9 rounded-control bg-brand/10 text-brand flex items-center justify-center mx-auto border border-brand/20">
              <Zap className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-foreground">تحویل آنی</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              شماره مجازی بلافاصله پس از سفارش تحویل داده شده و آماده دریافت
              پیامک است.
            </p>
          </div>

          <div className="p-5 rounded-surface border border-border/60 bg-card shadow-surface space-y-2">
            <div className="w-9 h-9 rounded-control bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-foreground">
              ضمانت ۱۰۰٪ بازگشت وجه
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              اگر به هر دلیلی کد تایید پیامک نشود، سفارش لغو شده و مبلغ بلافاصله
              استرداد می‌شود.
            </p>
          </div>

          <div className="p-5 rounded-surface border border-border/60 bg-card shadow-surface space-y-2">
            <div className="w-9 h-9 rounded-control bg-brand/10 text-brand flex items-center justify-center mx-auto border border-brand/20">
              <Globe className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-foreground">
              بیش از ۱۸۰ کشور جهان
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              پشتیبانی از شماره‌های معتبر کشورهای اروپایی، آمریکایی و آسیایی بدون
              مسدودی.
            </p>
          </div>
        </section>
      </main>

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        customer={customer}
      />
    </div>
  )
}
