import {
  Check,
  CheckCircle2,
  Coins,
  Copy,
  DollarSign,
  Eye,
  EyeOff,
  Key,
  Loader2,
  Percent,
  Radio,
  RefreshCw,
  Sliders,
  TrendingUp,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useMemo, useState } from 'react'
import { apiService } from '../../services/api'
import type { VirtualNumberOrder, VirtualNumberSettings } from '../../types'
import { formatToman, toPersianDigits } from '../../utils/formatters'
import { useNotification } from '../vibefarsi/NotificationContext'
import { SearchInput } from '../vibefarsi/SearchInput'
import { ToggleSwitch } from '../vibefarsi/ToggleSwitch'
import { AdminHeaderBanner } from './AdminHeaderBanner'

export const AdminVirtualNumbersView: React.FC = () => {
  const { success: notifySuccess, error: notifyError } = useNotification()

  const [vnSettings, setVnSettings] = useState<VirtualNumberSettings | null>(
    null,
  )
  const [vnLoading, setVnLoading] = useState(true)
  const [vnSaveLoading, setVnSaveLoading] = useState(false)
  const [orders, setOrders] = useState<VirtualNumberOrder[]>([])
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [orderSearch, setOrderSearch] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 15

  // Form Fields
  const [enabledToggle, setEnabledToggle] = useState(true)
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)
  const [marginInput, setMarginInput] = useState<number>(20)
  const [usdRateInput, setUsdRateInput] = useState<number>(98000)
  const [rubRateInput, setRubRateInput] = useState<number>(1100)
  const [defaultOpInput, setDefaultOpInput] = useState('any')
  const [ratePriorityInput, setRatePriorityInput] = useState<
    'manual' | 'swapwallet'
  >('manual')

  const loadSettings = async () => {
    setVnLoading(true)
    try {
      const data = await apiService.getVirtualNumberSettings()
      setVnSettings(data)
      setEnabledToggle(data.enabled)
      setMarginInput(data.margin_percent)
      setUsdRateInput(data.usd_rate)
      setRubRateInput(data.rub_rate)
      setDefaultOpInput(data.default_operator || 'any')
      setRatePriorityInput(data.rate_priority || 'manual')
    } catch (err: any) {
      notifyError(
        'خطا در دریافت تنظیمات',
        err.message || 'خطا در بارگذاری تنظیمات سامانه',
      )
    } finally {
      setVnLoading(false)
    }
  }

  const loadOrders = async () => {
    setLoadingOrders(true)
    try {
      const data = await apiService.getAdminVirtualOrders()
      setOrders(Array.isArray(data) ? data : [])
    } catch {
      // fallback
    } finally {
      setLoadingOrders(false)
    }
  }

  useEffect(() => {
    loadSettings()
    loadOrders()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setVnSaveLoading(true)
    try {
      const payload: any = {
        enabled: enabledToggle,
        margin_percent: Number(marginInput),
        usd_rate: Number(usdRateInput),
        rub_rate: Number(rubRateInput),
        default_operator: defaultOpInput,
        rate_priority: ratePriorityInput,
      }
      if (apiKeyInput.trim()) {
        payload.api_key = apiKeyInput.trim()
      }

      const updated = await apiService.updateVirtualNumberSettings(payload)
      setVnSettings(updated)
      setApiKeyInput('')
      notifySuccess(
        'تنظیمات شماره مجازی',
        'تنظیمات سامانه با موفقیت در دیتابیس ذخیره شد.',
      )
    } catch (err: any) {
      notifyError(
        'خطا در ذخیره تنظیمات',
        err.message || 'خطا در برقراری ارتباط با سرور',
      )
    } finally {
      setVnSaveLoading(false)
    }
  }

  const filteredOrders = useMemo(() => {
    if (!orderSearch.trim()) return orders
    const q = orderSearch.toLowerCase().trim()
    return orders.filter(
      (o) =>
        (o.phone || '').toLowerCase().includes(q) ||
        (o.service_name_fa || o.service || '').toLowerCase().includes(q) ||
        (o.country_name_fa || o.country || '').toLowerCase().includes(q) ||
        (o.sms_code || '').toLowerCase().includes(q) ||
        (o.order_no || '').toLowerCase().includes(q),
    )
  }, [orders, orderSearch])

  const paginatedOrders = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredOrders.slice(start, start + pageSize)
  }, [filteredOrders, page])

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize))

  return (
    <div dir="rtl" className="space-y-6">
      {/* Unified Header Banner */}
      <AdminHeaderBanner
        icon={Radio}
        title="مدیریت فروش شماره‌های دریافت پیامک (SMS OTP)"
        subtitle="بیش از ۵۰۰٬۰۰۰ شماره آماده تحویل از ۱۸۰ کشور دنیا با نرخ ارز زنده و سود داینامیک"
        badgeText="سرویس شماره مجازی"
        actions={
          <div className="bg-card border border-border/80 rounded-surface p-3.5 shadow-surface shrink-0 min-w-[210px] flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[11px] text-muted-foreground font-bold block">
                موجودی اعتبار سامانه:
              </span>
              <div className="text-xl font-black text-foreground font-mono font-latin tracking-tight">
                ${vnSettings?.balance ? vnSettings.balance.toFixed(2) : '0.00'}
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                loadSettings()
                loadOrders()
              }}
              disabled={vnLoading}
              className="p-2 rounded-control bg-secondary hover:bg-muted text-foreground border border-border/60 transition shadow-control cursor-pointer"
              title="به‌روزرسانی داده‌ها"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${vnLoading ? 'animate-spin text-brand' : ''}`}
              />
            </button>
          </div>
        }
      />

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="rounded-surface border border-border/80 bg-card p-4 shadow-surface flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] text-muted-foreground font-bold">
              وضعیت فروش سرویس
            </span>
            <div className="text-sm font-black text-foreground pt-1 flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${enabledToggle ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground'}`}
              />
              <span>{enabledToggle ? 'فعال در کاتالوگ' : 'مسدود شده'}</span>
            </div>
          </div>
          <ToggleSwitch checked={enabledToggle} onChange={setEnabledToggle} />
        </div>

        <div className="rounded-surface border border-border/80 bg-card p-4 shadow-surface flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] text-muted-foreground font-bold">
              نرخ موثر دلار سامانه
            </span>
            <div className="text-lg font-black text-brand font-mono font-latin">
              {formatToman(vnSettings?.effective_usd_rate || usdRateInput)}
            </div>
          </div>
          <div className="w-10 h-10 rounded-control bg-secondary text-brand flex items-center justify-center border border-border/60">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="rounded-surface border border-border/80 bg-card p-4 shadow-surface flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] text-muted-foreground font-bold">
              مارجین سود خالص
            </span>
            <div className="text-lg font-black text-foreground font-mono font-latin">
              {toPersianDigits(marginInput)}٪
            </div>
          </div>
          <div className="w-10 h-10 rounded-control bg-secondary text-brand flex items-center justify-center border border-border/60">
            <Percent className="w-5 h-5 text-amber-500" />
          </div>
        </div>

        <div className="rounded-surface border border-border/80 bg-card p-4 shadow-surface flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] text-muted-foreground font-bold">
              کل سفارشات ثبت‌شده
            </span>
            <div className="text-lg font-black text-foreground font-mono font-latin">
              {toPersianDigits(orders.length)}
            </div>
          </div>
          <div className="w-10 h-10 rounded-control bg-secondary text-brand flex items-center justify-center border border-border/60">
            <Radio className="w-5 h-5 text-emerald-500" />
          </div>
        </div>
      </div>

      {/* Main Settings Form Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Form Controls */}
        <div className="lg:col-span-2 bg-card rounded-surface border border-border/80 p-6 shadow-surface space-y-6 text-foreground">
          <div className="border-b border-border/60 pb-4 flex items-center justify-between">
            <div>
              <h3 className="font-black text-foreground text-sm sm:text-base">
                تنظیمات زیرساخت شماره‌های مجازی آناهیکس
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                کلید فعال‌سازی، مارجین سود و ضرایب تبدیل تومان را به صورت کاملاً
                داینامیک تنظیم نمایید
              </p>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-5">
            {/* API Key */}
            <div className="space-y-1.5 text-right">
              <label className="block text-xs font-bold text-foreground">
                کلید فعال‌سازی زیرساخت شماره‌های مجازی (Bearer Token)
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder={
                    vnSettings?.has_api_key
                      ? `کلید فعال در سرور: ${vnSettings.api_key_masked} (جهت تغییر، کلید جدید وارد کنید)`
                      : 'کلید اتصال زیرساخت شماره را اینجا وارد کنید'
                  }
                  className="w-full h-10 px-3.5 pr-10 pl-10 text-xs rounded-field border border-border/60 bg-muted/20 text-foreground font-mono font-latin outline-none focus:border-brand transition-colors"
                />
                <Key className="w-4 h-4 text-muted-foreground absolute right-3.5 top-3 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute left-3.5 top-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  {showApiKey ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Price Engine Strategy Selection */}
            <div className="rounded-surface border border-border/80 bg-muted/20 p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-foreground flex items-center gap-2">
                    <Coins className="w-4 h-4 text-brand" />
                    <span>اولویت محاسبه قیمت تومان (Toman Price Engine)</span>
                  </h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    تعیین اولویت نرخ‌گذاری: اولویت ۱ نرخ دستی، اولویت ۲ مبدل زنده
                    تتر SwapWallet
                  </p>
                </div>

                {vnSettings?.live_usd_rate ? (
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-control text-xs font-mono font-latin bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>
                      تتر SwapWallet:{' '}
                      {toPersianDigits(
                        vnSettings.live_usd_rate.toLocaleString('fa-IR'),
                      )}{' '}
                      تومان
                    </span>
                  </div>
                ) : null}
              </div>

              {/* Priority Option Selector Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <button
                  type="button"
                  onClick={() => setRatePriorityInput('manual')}
                  className={`p-4 rounded-surface border text-right transition-all flex flex-col justify-between cursor-pointer ${
                    ratePriorityInput === 'manual'
                      ? 'border-brand bg-brand/10 ring-2 ring-brand/30 shadow-surface'
                      : 'border-border/60 hover:border-border bg-card'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-control flex items-center justify-center bg-primary text-primary-foreground shadow-control">
                        <Sliders className="w-4 h-4" />
                      </div>
                      <div>
                        <h5 className="font-bold text-xs text-foreground">
                          اولویت ۱: نرخ دستی ثابت
                        </h5>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          کنترل ۱۰۰٪ دستی بر مبنای نرخ اعلامی شما
                        </p>
                      </div>
                    </div>
                    {ratePriorityInput === 'manual' && (
                      <span className="text-[10px] font-black text-brand">
                        فعال ✓
                      </span>
                    )}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setRatePriorityInput('swapwallet')}
                  className={`p-4 rounded-surface border text-right transition-all flex flex-col justify-between cursor-pointer ${
                    ratePriorityInput === 'swapwallet'
                      ? 'border-brand bg-brand/10 ring-2 ring-brand/30 shadow-surface'
                      : 'border-border/60 hover:border-border bg-card'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-control flex items-center justify-center bg-primary text-primary-foreground shadow-control">
                        <TrendingUp className="w-4 h-4" />
                      </div>
                      <div>
                        <h5 className="font-bold text-xs text-foreground">
                          اولویت ۲: مبدل زنده تتر SwapWallet
                        </h5>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          استعلام آنلاین تتر با کش ۳ دقیقه‌ای
                        </p>
                      </div>
                    </div>
                    {ratePriorityInput === 'swapwallet' && (
                      <span className="text-[10px] font-black text-brand">
                        فعال ✓
                      </span>
                    )}
                  </div>
                </button>
              </div>
            </div>

            {/* Margins & Rates Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5 text-right">
                <label className="block text-xs font-bold text-foreground">
                  درصد مارجین سود (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="200"
                    value={marginInput}
                    onChange={(e) => setMarginInput(Number(e.target.value))}
                    className="w-full h-10 px-3.5 pr-9 text-xs rounded-field border border-border/60 bg-muted/20 text-foreground font-latin outline-none focus:border-brand"
                  />
                  <Percent className="w-4 h-4 text-muted-foreground absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1.5 text-right">
                <label className="block text-xs font-bold text-foreground">
                  نرخ دستی دلار (تومان)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    value={usdRateInput}
                    onChange={(e) => setUsdRateInput(Number(e.target.value))}
                    className="w-full h-10 px-3.5 pr-9 text-xs rounded-field border border-border/60 bg-muted/20 text-foreground font-latin outline-none focus:border-brand"
                  />
                  <DollarSign className="w-4 h-4 text-muted-foreground absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1.5 text-right">
                <label className="block text-xs font-bold text-foreground">
                  نرخ روبل روسیه (تومان)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="10"
                    value={rubRateInput}
                    onChange={(e) => setRubRateInput(Number(e.target.value))}
                    className="w-full h-10 px-3.5 pr-9 text-xs rounded-field border border-border/60 bg-muted/20 text-foreground font-latin outline-none focus:border-brand"
                  />
                  <Coins className="w-4 h-4 text-muted-foreground absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Default Operator Selection */}
            <div className="space-y-1.5 text-right">
              <label className="block text-xs font-bold text-foreground">
                انتخابگر پیش‌فرض اپراتور
              </label>
              <select
                value={defaultOpInput}
                onChange={(e) => setDefaultOpInput(e.target.value)}
                className="w-full h-10 px-3 rounded-field border border-border/60 bg-muted/20 text-foreground font-bold outline-none focus:border-brand cursor-pointer text-xs"
              >
                <option value="any">
                  any (خرید هوشمند بر اساس بیشترین درصد موفقیت تحویل SMS)
                </option>
                <option value="smart">smart (سیستم بهینه‌ساز تخصیص خط)</option>
              </select>
            </div>

            {/* Submit Button */}
            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={vnSaveLoading}
                className="h-10 px-6 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs duration-motion ease-motion active:scale-[0.98] shadow-control flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {vnSaveLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>در حال ذخیره‌سازی...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>ذخیره تنظیمات در دیتابیس</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Health & Reassurance */}
        <div className="bg-card rounded-surface border border-border/80 p-5 shadow-surface text-foreground space-y-4">
          <h3 className="font-black text-foreground text-sm border-b border-border/60 pb-3">
            وضعیت سیستم و هشدارهای عملیاتی
          </h3>
          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-surface bg-muted/20 border border-border/60">
              <div className="font-bold text-foreground">پیام وضعیت اتصال:</div>
              <div className="text-muted-foreground mt-1 leading-relaxed">
                {vnSettings?.status_message || 'در حال آماده‌باش...'}
              </div>
            </div>

            <div className="p-3.5 rounded-surface bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 space-y-1.5 leading-relaxed">
              <div className="font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>سیستم استرداد آنی وجه (Instant Refund)</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                در صورتی که ظرف ۱۵ دقیقه پیامی دریافت نشود، وجه به صورت آنی به
                کیف پول مشتری بازگردانده شده و خط بدون کسر هزینه لغو می‌گردد.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Virtual Orders Audit Table */}
      <div className="bg-card rounded-surface border border-border/80 p-5 sm:p-6 shadow-surface space-y-4 text-foreground">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
          <div>
            <h3 className="font-black text-foreground text-sm sm:text-base">
              لاگ و سوابق سفارشات شماره‌های مجازی
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              رصد و نظارت لحظه‌ای بر دریافت پیامک‌های OTP مشتریان و وضعیت نشست‌ها
            </p>
          </div>

          <div className="w-full sm:w-64">
            <SearchInput
              value={orderSearch}
              onChange={(val) => {
                setOrderSearch(val)
                setPage(1)
              }}
              placeholder="جستجوی شماره، سرویس یا کشور..."
              debounceMs={300}
            />
          </div>
        </div>

        {/* Table: 100% Centered */}
        <div className="rounded-surface border border-border/80 overflow-hidden shadow-surface">
          <div className="overflow-x-auto">
            <table className="w-full text-center text-xs">
              <thead className="bg-muted/40 text-muted-foreground border-b border-border/60 text-[11px] font-semibold">
                <tr>
                  <th className="p-3.5 text-center">شناسه سفارش</th>
                  <th className="p-3.5 text-center">شماره مجازی</th>
                  <th className="p-3.5 text-center">کشور و سرویس</th>
                  <th className="p-3.5 text-center">کد پیامک (OTP)</th>
                  <th className="p-3.5 text-center">مبلغ</th>
                  <th className="p-3.5 text-center">وضعیت</th>
                  <th className="p-3.5 text-center">زمان ثبت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {loadingOrders ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="p-12 text-center text-muted-foreground text-xs"
                    >
                      <Loader2 className="w-5 h-5 animate-spin text-brand mx-auto mb-2" />
                      <span>در حال دریافت سوابق سفارشات...</span>
                    </td>
                  </tr>
                ) : paginatedOrders.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="p-12 text-center text-muted-foreground text-xs space-y-1"
                    >
                      <p className="font-bold text-foreground">
                        سفارشی برای این جستجو یافت نشد
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginatedOrders.map((o) => (
                    <tr
                      key={o.id}
                      className="hover:bg-muted/20 transition-colors"
                    >
                      <td className="p-3.5 text-center font-mono font-latin text-[11px] text-muted-foreground">
                        {o.order_no || o.id}
                      </td>
                      <td className="p-3.5 text-center font-mono font-latin font-bold text-foreground">
                        <div
                          className="flex items-center justify-center gap-1.5"
                          dir="ltr"
                        >
                          <span>{o.phone || '-'}</span>
                          {o.phone && (
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(o.phone || '')
                                notifySuccess('کپی شد', o.phone || '')
                              }}
                              className="p-1 text-muted-foreground hover:text-foreground cursor-pointer"
                              title="کپی شماره"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="p-3.5 text-center font-bold text-foreground">
                        {o.country_name_fa || o.country} •{' '}
                        {o.service_name_fa || o.service}
                      </td>
                      <td className="p-3.5 text-center font-mono font-latin font-black text-sm text-brand">
                        {o.sms_code ? (
                          <span className="px-2.5 py-1 rounded-control bg-brand/10 border border-brand/20">
                            {o.sms_code}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-[10px] font-sans font-normal">
                            در انتظار پیامک...
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-center font-bold text-foreground font-latin">
                        {formatToman(o.price_toman)}
                      </td>
                      <td className="p-3.5 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-control text-[10px] font-bold border ${
                            o.status === 'FINISHED' || o.status === 'RECEIVED'
                              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                              : o.status === 'CANCELED' ||
                                  o.status === 'TIMEOUT'
                                ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                                : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                          }`}
                        >
                          {o.status === 'FINISHED' || o.status === 'RECEIVED'
                            ? 'دریافت شده'
                            : o.status === 'CANCELED' || o.status === 'TIMEOUT'
                              ? 'لغو شده'
                              : 'در حال انتظار'}
                        </span>
                      </td>
                      <td className="p-3.5 text-center text-[11px] text-muted-foreground font-latin">
                        {new Date(o.created_at).toLocaleDateString('fa-IR')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-border/60 bg-muted/20 flex items-center justify-between text-xs text-muted-foreground">
              <span>
                صفحه {toPersianDigits(page)} از {toPersianDigits(totalPages)}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-control border border-border/60 bg-card disabled:opacity-40 cursor-pointer font-bold"
                >
                  صفحه قبل
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1.5 rounded-control border border-border/60 bg-card disabled:opacity-40 cursor-pointer font-bold"
                >
                  صفحه بعد
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
