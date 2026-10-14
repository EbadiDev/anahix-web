import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Copy,
  Flame,
  Globe,
  Info,
  Loader2,
  MessageSquare,
  Radio,
  Search,
  ShieldCheck,
  Smartphone,
  Sparkles,
  XCircle,
  Zap,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useMemo, useState } from 'react'
import { Header } from '../components/Header'
import { apiService } from '../services/api'
import type {
  VirtualNumberCountry,
  VirtualNumberOrder,
  VirtualNumberService,
} from '../types'

// Helper for Persian currency formatting
function formatToman(num: number): string {
  return new Intl.NumberFormat('fa-IR').format(num)
}

// Branded Icon for Services
const ServiceIcon: React.FC<{ slug: string; className?: string }> = ({
  slug,
  className = 'w-6 h-6',
}) => {
  switch (slug) {
    case 'telegram':
      return (
        <div
          className={`flex items-center justify-center rounded-xl bg-sky-500/10 text-sky-500 ${className}`}
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
          className={`flex items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 ${className}`}
        >
          <Sparkles className="w-5 h-5" />
        </div>
      )
    case 'whatsapp':
      return (
        <div
          className={`flex items-center justify-center rounded-xl bg-green-500/10 text-green-500 ${className}`}
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
          className={`flex items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 ${className}`}
        >
          <span className="text-base font-bold">G</span>
        </div>
      )
    case 'claude':
      return (
        <div
          className={`flex items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 ${className}`}
        >
          <Zap className="w-5 h-5" />
        </div>
      )
    case 'discord':
      return (
        <div
          className={`flex items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500 ${className}`}
        >
          <Radio className="w-5 h-5" />
        </div>
      )
    case 'apple':
      return (
        <div
          className={`flex items-center justify-center rounded-xl bg-slate-500/10 text-slate-700 dark:text-slate-300 ${className}`}
        >
          <span className="text-base font-bold"></span>
        </div>
      )
    default:
      return (
        <div
          className={`flex items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 ${className}`}
        >
          <MessageSquare className="w-5 h-5" />
        </div>
      )
  }
}

export const VirtualNumbersPage: React.FC = () => {
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
  const [countryFilter, setCountryFilter] = useState<
    'all' | 'in_stock' | 'cheapest'
  >('all')

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

  // Filtered Countries List for chosen Service
  const filteredCountries = useMemo(() => {
    const q = countrySearch.trim().toLowerCase()
    let list = [...countries]

    if (countryFilter === 'in_stock') {
      list = list.filter((c) => c.total_stock > 0)
    } else if (countryFilter === 'cheapest') {
      list = list.sort(
        (a, b) => a.cheapest_price_toman - b.cheapest_price_toman,
      )
    }

    if (!q) return list
    return list.filter(
      (c) =>
        c.country.toLowerCase().includes(q) ||
        c.country_name_fa.toLowerCase().includes(q),
    )
  }, [countries, countrySearch, countryFilter])

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
      // Scroll to active order
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err: any) {
      setBuyError(err?.message || 'خطا در خرید شماره مجازی')
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
    } finally {
      setFinishing(false)
    }
  }

  const handleCopyPhone = () => {
    if (!activeOrder?.phone) return
    navigator.clipboard.writeText(activeOrder.phone)
    setCopiedPhone(true)
    setTimeout(() => setCopiedPhone(false), 2000)
  }

  const handleCopyCode = () => {
    if (!activeOrder?.sms_code) return
    navigator.clipboard.writeText(activeOrder.sms_code)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-slate-50 dark:bg-[#020817] text-slate-900 dark:text-slate-100 transition-colors"
    >
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* ACTIVE ORDER WORKBENCH (if an order is currently active) */}
        {activeOrder && (
          <section className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border-2 border-blue-500/30 dark:border-blue-500/40 p-6 shadow-xl shadow-blue-500/5 transition-all">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <span className="flex h-3.5 w-3.5 relative">
                  <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      activeOrder.status === 'RECEIVED'
                        ? 'bg-emerald-400'
                        : activeOrder.status === 'PENDING'
                          ? 'bg-blue-400'
                          : 'bg-slate-400'
                    }`}
                  />
                  <span
                    className={`relative inline-flex rounded-full h-3.5 w-3.5 ${
                      activeOrder.status === 'RECEIVED'
                        ? 'bg-emerald-500'
                        : activeOrder.status === 'PENDING'
                          ? 'bg-blue-600'
                          : 'bg-slate-500'
                    }`}
                  />
                </span>
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                    میز کار شماره مجازی فعال
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                      {activeOrder.order_no}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    سرویس {activeOrder.service_name_fa} •{' '}
                    {activeOrder.country_name_fa} {activeOrder.country_flag}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  <Clock className="w-4 h-4 text-blue-500 animate-spin" />
                  <span>
                    زمان باقی‌مانده:{' '}
                    {Math.floor(activeOrder.seconds_remaining / 60)}:
                    {(activeOrder.seconds_remaining % 60)
                      .toString()
                      .padStart(2, '0')}
                  </span>
                </div>

                {activeOrder.status === 'PENDING' && (
                  <button
                    type="button"
                    onClick={handleCancelOrder}
                    disabled={cancelling}
                    className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/40 transition-colors disabled:opacity-50"
                  >
                    {cancelling ? 'در حال لغو...' : 'لغو سفارش و استرداد وجه'}
                  </button>
                )}

                {activeOrder.status === 'RECEIVED' && (
                  <button
                    type="button"
                    onClick={handleFinishOrder}
                    disabled={finishing}
                    className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-900/40 transition-colors"
                  >
                    {finishing ? 'در حال بستن...' : 'تکمیل و پایان'}
                  </button>
                )}
              </div>
            </div>

            {/* Main Phone & OTP Display */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
              {/* Phone box */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-5 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>شماره تلفن اختصاصی شما:</span>
                  <span className="font-mono text-slate-400">
                    {activeOrder.country_name_fa}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div
                    dir="ltr"
                    className="font-mono text-2xl font-bold tracking-wider text-blue-600 dark:text-blue-400"
                  >
                    {activeOrder.phone}
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyPhone}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-all active:scale-95"
                  >
                    {copiedPhone ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedPhone ? 'کپی شد' : 'کپی شماره'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  شماره را در فیلد ورود یا ثبت‌نام سرویس مورد نظر وارد کنید و
                  دکمه ارسال پیامک را بزنید.
                </p>
              </div>

              {/* SMS Code Box */}
              <div
                className={`rounded-xl border p-5 transition-all flex flex-col justify-center ${
                  activeOrder.sms_code
                    ? 'border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20 shadow-lg shadow-emerald-500/5'
                    : 'border-dashed border-slate-300 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50'
                }`}
              >
                {activeOrder.sms_code ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        پیامک دریافت شد!
                      </span>
                      <span className="text-[11px] text-slate-400">
                        کد تایید ورود
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <div
                        dir="ltr"
                        className="font-mono text-3xl font-black text-slate-900 dark:text-white tracking-widest"
                      >
                        {activeOrder.sms_code}
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyCode}
                        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-all active:scale-95"
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
                      <div className="text-xs text-slate-600 dark:text-slate-400 p-2 rounded bg-slate-100 dark:bg-slate-800/60 font-sans">
                        {activeOrder.sms_text}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-3 text-center space-y-2">
                    <div className="inline-flex items-center justify-center p-2 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 animate-pulse">
                      <Loader2 className="w-5 h-5 animate-spin" />
                    </div>
                    <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      در حال گوش دادن به پیامک‌های دریافتی...
                    </div>
                    <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                      به محض ارسال پیامک توسط اپلیکیشن یا سرویس، کد به‌طور
                      اتوماتیک در اینجا ظاهر می‌شود.
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
            <div className="text-center space-y-3 max-w-3xl mx-auto pt-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 text-xs font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>
                  اتصال زنده به زیرساخت بین‌المللی با موجودی بیش از ۱۸۰ کشور
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                خرید شماره مجازی دریافت پیامک (SMS)
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                ابتدا سرویس مورد نظر خود را برای دریافت پیامک انتخاب کنید، سپس
                کشور و اپراتور دلخواه را برگزینید.
              </p>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="relative w-full sm:w-96">
                <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="جستجوی سرویس (مثلاً تلگرام، OpenAI، واتساپ، گوگل...)"
                  value={serviceSearch}
                  onChange={(e) => setServiceSearch(e.target.value)}
                  className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              {/* Category chips */}
              <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                <button
                  type="button"
                  onClick={() => setServiceFilter('all')}
                  className={`text-xs px-3 py-2 rounded-xl font-medium transition-all ${
                    serviceFilter === 'all'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  همه سرویس‌ها ({services.length})
                </button>
                <button
                  type="button"
                  onClick={() => setServiceFilter('popular')}
                  className={`text-xs px-3 py-2 rounded-xl font-medium flex items-center gap-1.5 transition-all ${
                    serviceFilter === 'popular'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5 text-amber-500" />
                  محبوب‌ترین‌ها
                </button>
                <button
                  type="button"
                  onClick={() => setServiceFilter('ai')}
                  className={`text-xs px-3 py-2 rounded-xl font-medium flex items-center gap-1.5 transition-all ${
                    serviceFilter === 'ai'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                  هوش مصنوعی
                </button>
              </div>
            </div>

            {/* Services Grid */}
            {servicesLoading ? (
              <div className="py-24 text-center space-y-3">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
                <p className="text-sm font-medium text-slate-500">
                  در حال دریافت لیست زنده سرویس‌ها...
                </p>
              </div>
            ) : filteredServices.length === 0 ? (
              <div className="py-20 text-center space-y-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <Info className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-sm text-slate-600 dark:text-slate-400">
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
                    className="text-right p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/5 transition-all group flex flex-col justify-between space-y-4"
                  >
                    <div className="flex items-start justify-between w-full">
                      <div className="flex items-center gap-3">
                        <ServiceIcon
                          slug={service.slug}
                          className="w-10 h-10"
                        />
                        <div>
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {service.name_fa}
                          </h3>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {service.name}
                          </span>
                        </div>
                      </div>

                      {service.is_popular && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-500 flex items-center gap-1">
                          <Flame className="w-2.5 h-2.5" />
                          محبوب
                        </span>
                      )}
                    </div>

                    <div className="w-full pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-slate-400 text-[10px] block">
                          قیمت شروع از
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {formatToman(service.min_price_toman)} تومان
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-semibold group-hover:translate-x-[-4px] transition-transform">
                        <span>انتخاب کشور</span>
                        <ArrowRight className="w-3.5 h-3.5 rotate-180" />
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
            {/* Navigation & Active Service Header */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setSelectedService(null)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>تغییر سرویس</span>
                </button>

                <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

                <div className="flex items-center gap-3">
                  <ServiceIcon
                    slug={selectedService.slug}
                    className="w-10 h-10"
                  />
                  <div>
                    <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                      شماره مجازی {selectedService.name_fa}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      کشور و اپراتور دلخواه خود را برای دریافت پیامک تایید
                      انتخاب کنید
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-medium px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                  {countries.length} کشور فعال
                </span>
                <span className="text-xs font-medium px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                  دریافت آنی پیامک
                </span>
              </div>
            </div>

            {/* Country Filters & Search */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="relative w-full sm:w-96">
                <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="جستجوی نام کشور (مثلاً انگلستان، آمریکا، آلمان، اندونزی...)"
                  value={countrySearch}
                  onChange={(e) => setCountrySearch(e.target.value)}
                  className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setCountryFilter('all')}
                  className={`text-xs px-3 py-2 rounded-xl font-medium transition-all ${
                    countryFilter === 'all'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  همه کشورها ({countries.length})
                </button>
                <button
                  type="button"
                  onClick={() => setCountryFilter('in_stock')}
                  className={`text-xs px-3 py-2 rounded-xl font-medium transition-all ${
                    countryFilter === 'in_stock'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  فقط موجودی فعال
                </button>
                <button
                  type="button"
                  onClick={() => setCountryFilter('cheapest')}
                  className={`text-xs px-3 py-2 rounded-xl font-medium transition-all ${
                    countryFilter === 'cheapest'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  ارزان‌ترین‌ها
                </button>
              </div>
            </div>

            {/* Country Cards with Live Operator / Number Selector */}
            {countriesLoading ? (
              <div className="py-24 text-center space-y-3">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
                <p className="text-sm font-medium text-slate-500">
                  در حال استعلام قیمت و موجودی زنده اپراتورها...
                </p>
              </div>
            ) : filteredCountries.length === 0 ? (
              <div className="py-20 text-center space-y-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <Info className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  کشوری با این مشخصات یافت نشد.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredCountries.map((c) => {
                  const currentOpName =
                    selectedOperators[c.country] || c.default_operator
                  const activeOp =
                    c.operators.find((op) => op.operator === currentOpName) ||
                    c.operators[0]

                  const isAvailable = activeOp && activeOp.count > 0

                  return (
                    <div
                      key={c.country}
                      className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500/50 dark:hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/5 transition-all space-y-4 flex flex-col justify-between"
                    >
                      {/* Country Title & Flag */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">{c.country_flag}</span>
                          <div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                              {c.country_name_fa}
                            </h3>
                            <span className="text-xs text-slate-400 font-mono">
                              {c.country}
                            </span>
                          </div>
                        </div>

                        <div className="text-left space-y-0.5">
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 block">
                            {c.total_stock > 0
                              ? `${formatToman(c.total_stock)} شماره`
                              : 'ناموجود'}
                          </span>
                          {c.best_rate > 0 && (
                            <span className="text-[10px] text-emerald-500 font-semibold block">
                              موفقیت: {Math.round(c.best_rate)}٪
                            </span>
                          )}
                        </div>
                      </div>

                      {/* OPERATOR / NUMBER SELECTION DROPDOWN */}
                      <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                          انتخاب اپراتور / شماره این کشور:
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
                              className="w-full text-xs font-mono py-2 pr-3 pl-8 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                            >
                              {c.operators.map((op) => (
                                <option key={op.operator} value={op.operator}>
                                  {op.operator} | {formatToman(op.price_toman)}{' '}
                                  تومان (موجودی: {formatToman(op.count)})
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                          </div>
                        ) : (
                          <div className="text-xs font-mono text-slate-600 dark:text-slate-400 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                            {activeOp?.operator || 'اپراتور استاندارد'} (موجودی:{' '}
                            {formatToman(activeOp?.count || 0)})
                          </div>
                        )}
                      </div>

                      {/* Price and Instant Buy CTA */}
                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                        <div>
                          <span className="text-[10px] text-slate-400 block">
                            قیمت نهایی
                          </span>
                          <span className="text-sm font-black text-blue-600 dark:text-blue-400">
                            {formatToman(activeOp?.price_toman || 0)} تومان
                          </span>
                        </div>

                        <button
                          type="button"
                          disabled={!isAvailable}
                          onClick={() => setBuyingCountry(c)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                            isAvailable
                              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/20 active:scale-95 cursor-pointer'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          <Smartphone className="w-3.5 h-3.5" />
                          <span>{isAvailable ? 'خرید شماره' : 'ناموجود'}</span>
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* CHECKOUT MODAL CONFIRMATION */}
        {buyingCountry && selectedService && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{buyingCountry.country_flag}</span>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      تایید خرید شماره {selectedService.name_fa}
                    </h3>
                    <p className="text-xs text-slate-500">
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
                  className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              {/* Order Info */}
              <div className="space-y-2 text-xs bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">سرویس درخواستی:</span>
                  <span className="font-bold">{selectedService.name_fa}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">کشور:</span>
                  <span className="font-bold">
                    {buyingCountry.country_name_fa} {buyingCountry.country_flag}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">اپراتور انتخابی:</span>
                  <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                    {selectedOperators[buyingCountry.country] ||
                      buyingCountry.default_operator}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-t border-slate-200 dark:border-slate-700/60 pt-2 text-sm">
                  <span className="font-bold">مبلغ قابل پرداخت:</span>
                  <span className="font-black text-blue-600 dark:text-blue-400">
                    {formatToman(
                      buyingCountry.operators.find(
                        (op) =>
                          op.operator ===
                          (selectedOperators[buyingCountry.country] ||
                            buyingCountry.default_operator),
                      )?.price_toman || buyingCountry.cheapest_price_toman,
                    )}{' '}
                    تومان
                  </span>
                </div>
              </div>

              {/* Customer Phone for Receipt */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                  شماره موبایل جهت پیگیری پیامکی (اختیاری):
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {buyError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{buyError}</span>
                </div>
              )}

              {/* Refund policy notice */}
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 text-[11px] text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>
                  ضمانت بازگشت وجه: در صورتی که پیامکی دریافت نشود، وجه به صورت
                  آنی استرداد می‌گردد.
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  disabled={buyLoading}
                  onClick={() => handleConfirmPurchase(buyingCountry)}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {buyLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>در حال صدور و دریافت شماره مجازی...</span>
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
                  className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  انصراف
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Feature Highlights Footer */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12 border-t border-slate-200 dark:border-slate-800 text-center">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center mx-auto">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold">تحویل آنی ۰ ثانیه‌ای</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              شماره مجازی بلافاصله پس از سفارش تحویل داده شده و آماده دریافت
              پیامک است.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold">ضمانت ۱۰۰٪ بازگشت وجه</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              اگر به هر دلیلی کد تایید پیامک نشود، سفارش لغو شده و مبلغ بلافاصله
              استرداد می‌شود.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center mx-auto">
              <Globe className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold">بیش از ۱۸۰ کشور جهان</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              پشتیبانی از شماره‌های معتبر کشورهای اروپایی، آمریکایی و آسیایی بدون
              مسدودی.
            </p>
          </div>
        </section>
      </main>
    </div>
  )
}
