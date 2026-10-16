import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Copy,
  Flame,
  Globe,
  HelpCircle,
  Loader2,
  Radio,
  RefreshCw,
  Search,
  ShieldCheck,
  Smartphone,
  Sparkles,
  TrendingDown,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useMemo, useState } from 'react'
import {
  ClaudeIcon,
  CursorIcon,
  GeminiIcon,
  OpenAIIcon,
} from '../components/BrandIcons'
import { Header } from '../components/Header'
import { useNotification } from '../components/vibefarsi/NotificationContext'
import { apiService } from '../services/api'
import type {
  VirtualNumberCountry,
  VirtualNumberOrder,
  VirtualNumberService,
} from '../types'

function toPersianDigits(n: number | string): string {
  const f = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']
  return String(n).replace(/\d/g, (d) => f[Number(d)])
}

// Brand Service Icons
const ServiceIcon: React.FC<{ slug: string; className?: string }> = ({
  slug,
  className = 'w-6 h-6',
}) => {
  switch (slug) {
    case 'telegram':
      return (
        <div
          className={`flex items-center justify-center rounded-control bg-sky-500/10 text-sky-400 ${className}`}
        >
          <svg
            className="w-5 h-5 fill-current"
            viewBox="0 0 24 24"
            role="img"
            aria-label="Telegram"
          >
            <title>Telegram</title>
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .26z" />
          </svg>
        </div>
      )
    case 'openai':
      return (
        <div
          className={`flex items-center justify-center rounded-control bg-emerald-500/10 text-emerald-400 ${className}`}
        >
          <OpenAIIcon className="w-5 h-5" />
        </div>
      )
    case 'whatsapp':
      return (
        <div
          className={`flex items-center justify-center rounded-control bg-emerald-500/10 text-emerald-400 ${className}`}
        >
          <svg
            className="w-5 h-5 fill-current"
            viewBox="0 0 24 24"
            role="img"
            aria-label="WhatsApp"
          >
            <title>WhatsApp</title>
            <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0012.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 012.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.196 8.196 0 01-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24m4.52 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.03-1.25-.75-.67-1.26-1.5-1.41-1.75-.15-.25-.02-.39.11-.51.11-.11.25-.29.37-.44.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.35-.77-1.85-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.13.17 1.78 2.71 4.3 3.8.6.26 1.07.41 1.44.53.6.19 1.15.16 1.58.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.07-.12-.22-.19-.47-.32z" />
          </svg>
        </div>
      )
    case 'google':
      return (
        <div
          className={`flex items-center justify-center rounded-control bg-blue-500/10 text-blue-400 ${className}`}
        >
          <GeminiIcon className="w-5 h-5" />
        </div>
      )
    case 'claude':
      return (
        <div
          className={`flex items-center justify-center rounded-control bg-amber-500/10 text-amber-400 ${className}`}
        >
          <ClaudeIcon className="w-5 h-5" />
        </div>
      )
    case 'cursor':
      return (
        <div
          className={`flex items-center justify-center rounded-control bg-sky-500/10 text-sky-400 ${className}`}
        >
          <CursorIcon className="w-5 h-5" />
        </div>
      )
    case 'discord':
      return (
        <div
          className={`flex items-center justify-center rounded-control bg-indigo-500/10 text-indigo-400 ${className}`}
        >
          <Radio className="w-5 h-5" />
        </div>
      )
    case 'apple':
      return (
        <div
          className={`flex items-center justify-center rounded-control bg-zinc-800 text-zinc-100 ${className}`}
        >
          <span className="text-base font-bold"></span>
        </div>
      )
    default:
      return (
        <div
          className={`flex items-center justify-center rounded-control bg-brand/10 text-brand ${className}`}
        >
          <Smartphone className="w-5 h-5" />
        </div>
      )
  }
}

export const VirtualNumbersPage: React.FC = () => {
  const { success, error } = useNotification()

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
  const [serviceFilter, setServiceFilter] = useState<'all' | 'popular' | 'ai'>(
    'all',
  )
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

  // Filtered Services List
  const filteredServices = useMemo(() => {
    const q = serviceSearch.trim().toLowerCase()
    return services.filter((s) => {
      if (serviceFilter === 'popular' && !s.is_popular) return false
      if (
        serviceFilter === 'ai' &&
        s.slug !== 'openai' &&
        s.slug !== 'claude' &&
        s.slug !== 'google'
      )
        return false

      if (!q) return true
      return (
        s.slug.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s.name_fa.toLowerCase().includes(q)
      )
    })
  }, [services, serviceSearch, serviceFilter])

  // Filtered & Sorted Countries List
  const filteredCountries = useMemo(() => {
    const q = countrySearch.trim().toLowerCase()
    let list = [...countries]

    if (countryStockFilter === 'in_stock') {
      list = list.filter((c) => c.total_stock > 0)
    }

    if (q) {
      list = list.filter(
        (c) =>
          c.country.toLowerCase().includes(q) ||
          c.country_name_fa.toLowerCase().includes(q) ||
          c.country_code?.toLowerCase().includes(q),
      )
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
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* ACTIVE ORDER WORKBENCH (Graphite Technical Minimal) */}
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
                <div className="flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-control bg-muted/60 border border-border/60 text-foreground">
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
          <div className="space-y-8">
            {/* Header banner */}
            <div className="text-center space-y-3 max-w-3xl mx-auto pt-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-control bg-brand/10 border border-brand/30 text-brand text-xs font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>
                  ارائه زنده شماره‌های مجازی با موجودی بیش از ۱۸۰ کشور جهان
                </span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black text-foreground tracking-tight">
                خرید شماره مجازی دریافت پیامک (SMS OTP)
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                سرویس مورد نظر خود را برای دریافت پیامک انتخاب کنید تا لیست
                کشورها، اپراتورها و کمترین قیمت‌های زنده نمایش داده شوند.
              </p>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-surface border border-border/60 bg-card shadow-surface duration-motion ease-motion">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-muted-foreground absolute right-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="جستجوی سرویس (تلگرام، OpenAI، واتساپ، گوگل...)"
                  value={serviceSearch}
                  onChange={(e) => setServiceSearch(e.target.value)}
                  className="w-full pr-10 pl-4 h-10 rounded-field border border-border/60 bg-muted/30 text-xs text-foreground outline-none focus:border-foreground/40 transition-colors"
                />
              </div>

              {/* Category chips */}
              <div className="flex items-center gap-1.5 self-start sm:self-auto bg-muted/40 p-1 rounded-control border border-border/40 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setServiceFilter('all')}
                  className={`text-xs px-3 py-1.5 rounded-control font-bold duration-motion ease-motion transition-all cursor-pointer ${
                    serviceFilter === 'all'
                      ? 'bg-primary text-primary-foreground font-black shadow-control'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  همه سرویس‌ها ({toPersianDigits(services.length)})
                </button>
                <button
                  type="button"
                  onClick={() => setServiceFilter('popular')}
                  className={`text-xs px-3 py-1.5 rounded-control font-bold duration-motion ease-motion flex items-center gap-1.5 transition-all cursor-pointer ${
                    serviceFilter === 'popular'
                      ? 'bg-primary text-primary-foreground font-black shadow-control'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Flame className="w-3 h-3 text-brand" />
                  <span>محبوب‌ترین‌ها</span>
                </button>
                <button
                  type="button"
                  onClick={() => setServiceFilter('ai')}
                  className={`text-xs px-3 py-1.5 rounded-control font-bold duration-motion ease-motion flex items-center gap-1.5 transition-all cursor-pointer ${
                    serviceFilter === 'ai'
                      ? 'bg-primary text-primary-foreground font-black shadow-control'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Sparkles className="w-3 h-3 text-brand" />
                  <span>هوش مصنوعی</span>
                </button>
              </div>
            </div>

            {/* Services Grid */}
            {servicesLoading ? (
              <div className="py-24 text-center space-y-3">
                <RefreshCw className="w-8 h-8 text-foreground animate-spin mx-auto" />
                <p className="text-xs text-muted-foreground">
                  در حال دریافت لیست زنده سرویس‌های فعال...
                </p>
              </div>
            ) : filteredServices.length === 0 ? (
              <div className="py-16 text-center space-y-2 rounded-surface border border-border/60 bg-card p-8">
                <HelpCircle className="w-8 h-8 text-muted-foreground mx-auto" />
                <p className="text-sm font-bold text-foreground">
                  سرویسی با این عنوان یافت نشد.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredServices.map((service) => (
                  <button
                    key={service.slug}
                    type="button"
                    onClick={() => setSelectedService(service)}
                    className="text-right p-4 rounded-surface border border-border/60 bg-card hover:border-border duration-motion ease-motion transition-all hover:-translate-y-1 group flex flex-col justify-between space-y-4 shadow-surface cursor-pointer"
                  >
                    <div className="flex items-start justify-between w-full">
                      <div className="flex items-center gap-3">
                        <ServiceIcon
                          slug={service.slug}
                          className="w-10 h-10"
                        />
                        <div>
                          <h3 className="text-sm font-bold text-foreground group-hover:text-primary-foreground/90 transition-colors">
                            {service.name_fa}
                          </h3>
                          <span className="text-[11px] text-muted-foreground font-latin">
                            {service.name}
                          </span>
                        </div>
                      </div>

                      {service.is_popular && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-control bg-brand/10 text-brand border border-brand/20 flex items-center gap-1">
                          <Flame className="w-2.5 h-2.5" />
                          محبوب
                        </span>
                      )}
                    </div>

                    <div className="w-full pt-2 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-muted-foreground text-[10px] block">
                          شروع قیمت از
                        </span>
                        <span className="font-bold text-foreground font-latin">
                          {toPersianDigits(
                            service.min_price_toman.toLocaleString(),
                          )}{' '}
                          تومان
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-xs font-bold text-brand group-hover:translate-x-[-3px] transition-transform">
                        <span>انتخاب کشور</span>
                        <ArrowLeft className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </button>
                ))}
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
                  className="h-9 px-3 rounded-control border border-border/60 bg-muted/30 hover:bg-muted text-xs font-bold text-foreground duration-motion ease-motion active:scale-[0.98] flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>تغییر سرویس</span>
                </button>

                <div className="h-5 w-px bg-border/60 hidden sm:block" />

                <div className="flex items-center gap-3">
                  <ServiceIcon
                    slug={selectedService.slug}
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
                <span className="text-xs font-bold px-3 py-1 rounded-control bg-muted/60 text-foreground border border-border/60">
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
                  placeholder="جستجوی نام کشور (انگلستان، آمریکا، آلمان، اندونزی...)"
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
                            {c.flag_url ? (
                              <img
                                src={c.flag_url}
                                alt={c.country_name_fa}
                                className="w-7 h-5 object-cover rounded-sm border border-border/50 shrink-0 shadow-xs"
                                onError={(e) => {
                                  ;(e.target as HTMLElement).style.display =
                                    'none'
                                }}
                              />
                            ) : (
                              <span className="text-2xl shrink-0">
                                {c.country_flag || '🌐'}
                              </span>
                            )}
                            <div className="min-w-0">
                              <h3 className="text-sm font-bold text-foreground truncate">
                                {c.country_name_fa}
                              </h3>
                              <span className="text-[11px] text-muted-foreground font-latin block">
                                {c.country}
                              </span>
                            </div>
                          </div>

                          <div className="text-left shrink-0">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-control bg-muted text-muted-foreground border border-border/40 block">
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

                        {/* Price & Buy Button */}
                        <div className="pt-2 flex items-center justify-between gap-3">
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

                          <button
                            type="button"
                            disabled={!isAvailable}
                            onClick={() => setBuyingCountry(c)}
                            className={`h-9 px-4 rounded-control text-xs font-black duration-motion ease-motion active:scale-[0.98] transition-all flex items-center gap-1.5 shadow-control ${
                              isAvailable
                                ? 'bg-primary hover:bg-primary-hover text-primary-foreground cursor-pointer'
                                : 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'
                            }`}
                          >
                            <Smartphone className="w-3.5 h-3.5" />
                            <span>
                              {isAvailable ? 'خرید شماره' : 'ناموجود'}
                            </span>
                          </button>
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
                      className="h-10 px-6 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs duration-motion ease-motion active:scale-[0.98] shadow-control flex items-center gap-2 cursor-pointer"
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
                      className="h-10 px-5 rounded-control border border-border/60 bg-card hover:bg-muted text-xs font-bold text-foreground duration-motion ease-motion active:scale-[0.98] cursor-pointer"
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

        {/* CHECKOUT CONFIRMATION MODAL (Graphite Overlay) */}
        {buyingCountry && selectedService && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="w-full max-w-md rounded-surface bg-zinc-950 border border-zinc-800 p-6 shadow-overlay space-y-5 text-zinc-100">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div className="flex items-center gap-2.5">
                  {buyingCountry.flag_url ? (
                    <img
                      src={buyingCountry.flag_url}
                      alt={buyingCountry.country_name_fa}
                      className="w-7 h-5 object-cover rounded-sm border border-zinc-800"
                    />
                  ) : (
                    <span className="text-2xl">
                      {buyingCountry.country_flag}
                    </span>
                  )}
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      تایید خرید شماره {selectedService.name_fa}
                    </h3>
                    <p className="text-xs text-zinc-400">
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
                  className="p-1 rounded-control text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Order Info Summary */}
              <div className="space-y-2 text-xs bg-zinc-900/60 p-4 rounded-control border border-zinc-800">
                <div className="flex justify-between py-1">
                  <span className="text-zinc-400">سرویس درخواستی:</span>
                  <span className="font-bold text-white">
                    {selectedService.name_fa}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-zinc-400">کشور:</span>
                  <span className="font-bold text-white">
                    {buyingCountry.country_name_fa}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-zinc-400">اپراتور انتخابی:</span>
                  <span className="font-mono font-bold text-brand">
                    {selectedOperators[buyingCountry.country] ||
                      buyingCountry.default_operator}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-t border-zinc-800 pt-2 text-sm">
                  <span className="font-bold text-white">
                    مبلغ قابل پرداخت:
                  </span>
                  <span className="font-black text-white font-latin">
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
                <label className="text-xs font-bold text-zinc-300 block">
                  شماره موبایل جهت پیگیری پیامکی (اختیاری):
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full h-10 px-3 text-xs font-mono rounded-field border border-zinc-800 bg-zinc-900 text-white outline-none focus:border-foreground/40 transition-colors"
                />
              </div>

              {buyError && (
                <div className="p-3 rounded-control bg-destructive/10 border border-destructive/30 text-xs text-destructive flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{buyError}</span>
                </div>
              )}

              {/* Refund policy notice */}
              <div className="p-3 rounded-control bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-400 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>
                  ضمانت کامل بازگشت وجه: در صورتی که پیامکی دریافت نشود، وجه به
                  طور خودکار به کیف پول استرداد می‌گردد.
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  disabled={buyLoading}
                  onClick={() => handleConfirmPurchase(buyingCountry)}
                  className="flex-1 h-10 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-black duration-motion ease-motion active:scale-[0.98] shadow-control disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
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
                <button
                  type="button"
                  onClick={() => setBuyingCountry(null)}
                  className="h-10 px-4 rounded-control border border-zinc-800 hover:bg-zinc-900 text-xs font-bold text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  انصراف
                </button>
              </div>
            </div>
          </div>
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
    </div>
  )
}
