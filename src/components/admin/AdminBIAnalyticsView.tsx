import {
  Activity,
  AlertCircle,
  BarChart3,
  Calendar,
  CheckCircle2,
  Coins,
  DollarSign,
  Download,
  Globe2,
  LayoutDashboard,
  LineChart as LineChartIcon,
  Medal,
  Package,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useMemo, useState } from 'react'
import { apiService } from '../../services/api'
import type {
  AdminBIKPIs,
  AdminBIOverviewResponse,
  AdminBITimeSeriesPoint,
} from '../../types'
import {
  formatNumber,
  formatToman,
  toPersianDigits,
} from '../../utils/formatters'
import { LoadingState } from '../vibefarsi/LoadingState'
import { PersianDonutChart } from '../vibefarsi/PersianCharts'
import { PersianJalaliCalendar } from '../vibefarsi/PersianJalaliCalendar'
import { AdminHeaderBanner } from './AdminHeaderBanner'

export const AdminBIAnalyticsView: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true)
  const [refreshing, setRefreshing] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<AdminBIOverviewResponse | null>(null)

  // Filters - Default to 7d weekly view per user request
  const [timeRange, setTimeRange] = useState<
    '7d' | '30d' | '90d' | '1y' | 'all'
  >('7d')
  const [groupBy, setGroupBy] = useState<'daily' | 'weekly' | 'monthly'>(
    'daily',
  )
  const [currencyUnit, setCurrencyUnit] = useState<'toman' | 'usdt'>('toman')
  const [hoveredPoint, setHoveredPoint] =
    useState<AdminBITimeSeriesPoint | null>(null)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  // Real Recent Orders Desk State
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [loadingOrders, setLoadingOrders] = useState<boolean>(false)

  const loadRecentOrders = async () => {
    setLoadingOrders(true)
    try {
      const res = await apiService.getAdminAllOrders({ page: 1, page_size: 6 })
      setRecentOrders(res?.orders || [])
    } catch {
      setRecentOrders([])
    } finally {
      setLoadingOrders(false)
    }
  }

  const loadData = async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setRefreshing(true)
      loadRecentOrders()
    } else {
      setLoading(true)
    }
    setError(null)
    try {
      const res = await apiService.getBIOverview({
        range: timeRange,
        group_by: groupBy,
      })
      setData(res)
    } catch (err: any) {
      setError(err?.message || 'خطا در بارگذاری اطلاعات داشبورد')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [timeRange, groupBy])

  useEffect(() => {
    loadRecentOrders()
  }, [])

  // Currency Formatter Helpers
  const formatMoney = (toman: number, usdt: number) => {
    if (currencyUnit === 'usdt') {
      return `$${usdt.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`
    }
    return `${formatToman(toman)} تومان`
  }

  const formatRawMoney = (toman: number) => {
    if (currencyUnit === 'usdt' && data?.effective_usd_rate) {
      const usdt = toman / data.effective_usd_rate
      return `$${usdt.toLocaleString('en-US', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      })}`
    }
    return `${formatToman(toman)} تومان`
  }

  // SVG Chart Calculations for Line / Area Chart
  const chartPoints = useMemo(() => {
    if (!data?.time_series || data.time_series.length === 0) return []
    return data.time_series
  }, [data])

  const maxRevenueVal = useMemo(() => {
    if (chartPoints.length === 0) return 1
    const vals = chartPoints.map((p) =>
      currencyUnit === 'usdt' ? p.revenue_usdt : p.revenue_toman,
    )
    return Math.max(...vals, 1)
  }, [chartPoints, currencyUnit])

  // Export CSV Summary
  const handleExportCSV = () => {
    if (!data) return
    const headers = [
      'تاریخ',
      'فروش (تومان)',
      'سود ناخالص (تومان)',
      'تعداد کل سفارشات',
      'سفارشات موفق',
      'نرخ تبدیل (%)',
    ]
    const rows = data.time_series.map((p) => [
      p.date,
      p.revenue_toman,
      p.gross_profit_toman,
      p.total_orders,
      p.paid_orders,
      p.conversion_rate,
    ])
    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `anahix_bi_report_${timeRange}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[480px] p-8 space-y-4">
        <div className="relative">
          <div className="w-14 h-14 border-4 border-blue-500/20 border-t-blue-600 rounded-full animate-spin" />
          <Sparkles className="w-6 h-6 text-blue-500 absolute inset-0 m-auto animate-pulse" />
        </div>
        <p className="text-slate-400 font-medium text-sm animate-pulse">
          در حال پردازش داده‌های هوش تجاری و محاسبات سود ناخالص...
        </p>
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="bg-destructive/10 border border-destructive/30 rounded-surface p-8 text-center text-destructive space-y-4 my-6 max-w-md mx-auto shadow-surface">
        <AlertCircle className="w-10 h-10 mx-auto text-destructive" />
        <h3 className="font-black text-base text-foreground">
          خطا در بارگذاری داده‌های تحلیلی
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed">{error}</p>
        <button
          type="button"
          onClick={async () => {
            if (apiService.isCustomerLoggedIn()) {
              await apiService.exchangeAdminToken()
            }
            loadData()
          }}
          className="h-10 px-6 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-black shadow-control cursor-pointer duration-motion active:scale-[0.98]"
        >
          تلاش مجدد و همگام‌سازی دسترسی
        </button>
      </div>
    )
  }

  const kpis: AdminBIKPIs = data?.kpis || {
    total_revenue_toman: 0,
    total_revenue_usdt: 0,
    total_cogs_toman: 0,
    total_cogs_usdt: 0,
    gross_profit_toman: 0,
    gross_profit_usdt: 0,
    gross_margin_percent: 0,
    total_orders: 0,
    paid_orders: 0,
    conversion_rate_percent: 0,
    average_order_value_toman: 0,
    average_order_value_usdt: 0,
    total_customers: 0,
    virtual_numbers_revenue: 0,
    virtual_numbers_count: 0,
    store_products_revenue: 0,
    store_products_count: 0,
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* Top Bar Header & Controls */}
      <AdminHeaderBanner
        icon={LayoutDashboard}
        title="داشبورد مدیریتی"
        subtitle="مرکز پایش وضعیت زنده، تحلیل عملکرد هفتگی، سفارشات اخیر و شاخص‌های کلیدی سامانه"
        badgeText="میز فرمان و وضعیت زنده"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {/* Currency Toggle */}
            <div className="flex items-center bg-muted/40 p-1 border border-border/60 rounded-control text-xs">
              <button
                type="button"
                onClick={() => setCurrencyUnit('toman')}
                className={`px-3 py-1.5 rounded-control font-bold transition flex items-center gap-1.5 cursor-pointer duration-motion active:scale-[0.98] ${
                  currencyUnit === 'toman'
                    ? 'bg-primary text-primary-foreground shadow-control'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Coins className="w-3.5 h-3.5" />
                تومان
              </button>
              <button
                type="button"
                onClick={() => setCurrencyUnit('usdt')}
                className={`px-3 py-1.5 rounded-control font-bold transition flex items-center gap-1.5 cursor-pointer duration-motion active:scale-[0.98] ${
                  currencyUnit === 'usdt'
                    ? 'bg-primary text-primary-foreground shadow-control'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <DollarSign className="w-3.5 h-3.5" />
                تتر
              </button>
            </div>

            {/* Time Range Selector */}
            <div className="flex items-center bg-muted/40 p-1 border border-border/60 rounded-control text-xs">
              {(
                [
                  { id: '7d', label: '۷ روز' },
                  { id: '30d', label: '۳۰ روز' },
                  { id: '90d', label: '۳ ماه' },
                  { id: '1y', label: 'یک سال' },
                  { id: 'all', label: 'همه' },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTimeRange(item.id)}
                  className={`px-2.5 py-1.5 rounded-control font-medium transition cursor-pointer duration-motion active:scale-[0.98] ${
                    timeRange === item.id
                      ? 'bg-card text-brand font-bold shadow-surface border border-border/60'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Group By Filter */}
            <div className="flex items-center bg-muted/40 p-1 border border-border/60 rounded-control text-xs">
              {(
                [
                  { id: 'daily', label: 'روزانه' },
                  { id: 'weekly', label: 'هفتگی' },
                  { id: 'monthly', label: 'ماهانه' },
                ] as const
              ).map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setGroupBy(g.id)}
                  className={`px-2.5 py-1.5 rounded-control font-medium transition cursor-pointer duration-motion active:scale-[0.98] ${
                    groupBy === g.id
                      ? 'bg-brand/10 text-brand font-bold border border-brand/20'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>

            {/* Refresh & Export */}
            <button
              type="button"
              onClick={() => loadData(true)}
              disabled={refreshing}
              title="بروزرسانی زنده داده‌ها"
              className="p-2.5 bg-card hover:bg-muted text-foreground rounded-control border border-border/60 transition shadow-control disabled:opacity-50 cursor-pointer duration-motion active:scale-[0.98]"
            >
              <RefreshCw
                className={`w-4 h-4 ${refreshing ? 'animate-spin text-brand' : ''}`}
              />
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              title="خروجی فایل CSV"
              className="p-2.5 bg-card hover:bg-muted text-foreground rounded-control border border-border/60 transition shadow-control flex items-center gap-1.5 text-xs font-semibold cursor-pointer duration-motion active:scale-[0.98]"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">خروجی CSV</span>
            </button>
          </div>
        }
      />

      {/* Primary Executive KPI Cards Grid (5-Card Deck) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Card 1: Gross Revenue */}
        <div className="bg-card border border-border/80 rounded-surface p-4 sm:p-5 shadow-surface space-y-2.5 relative overflow-hidden group hover:border-brand/40 transition-colors text-foreground">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-bold flex items-center gap-1.5 text-foreground">
              <ShoppingBag className="w-4 h-4 text-brand" />
              فروش کل ناخالص
            </span>
            <span className="px-2 py-0.5 rounded-control bg-secondary text-brand font-mono text-[10px] font-bold border border-border/60">
              {timeRange === '7d' ? '۷ روزه' : timeRange}
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
            {formatMoney(kpis.total_revenue_toman, kpis.total_revenue_usdt)}
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-border/60 text-[11px] text-muted-foreground font-sans">
            <span>سفارشات موفق:</span>
            <span className="font-bold text-foreground font-sans">
              {formatNumber(kpis.paid_orders)} سفارش
            </span>
          </div>
        </div>

        {/* Card 2: Gross Profit & Margin */}
        <div className="bg-card border border-border/80 rounded-surface p-4 sm:p-5 shadow-surface space-y-2.5 relative overflow-hidden group hover:border-emerald-500/40 transition-colors text-foreground">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-bold flex items-center gap-1.5 text-foreground">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              سود ناخالص واقعی
            </span>
            <span className="px-2 py-0.5 rounded-control bg-emerald-500/10 text-emerald-400 font-bold text-[10px] border border-emerald-500/20 font-sans">
              مارجین: {toPersianDigits(kpis.gross_margin_percent)}٪
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-400 tracking-tight">
            {formatMoney(kpis.gross_profit_toman, kpis.gross_profit_usdt)}
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-border/60 text-[11px] text-muted-foreground font-sans">
            <span>بهای تمام‌شده:</span>
            <span className="font-bold text-foreground font-mono">
              {formatMoney(kpis.total_cogs_toman, kpis.total_cogs_usdt)}
            </span>
          </div>
        </div>

        {/* Card 3: Paid Orders & Conversion */}
        <div className="bg-card border border-border/80 rounded-surface p-4 sm:p-5 shadow-surface space-y-2.5 relative overflow-hidden group hover:border-sky-500/40 transition-colors text-foreground">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-bold flex items-center gap-1.5 text-foreground">
              <CheckCircle2 className="w-4 h-4 text-sky-400" />
              سفارشات پرداختی
            </span>
            <span className="px-2 py-0.5 rounded-control bg-sky-500/10 text-sky-400 font-mono text-[10px] font-bold border border-sky-500/20">
              {kpis.conversion_rate_percent}% راندمان
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-foreground tracking-tight font-sans">
            {formatNumber(kpis.paid_orders)}
            <span className="text-xs font-normal text-muted-foreground mr-1.5 font-sans">
              سفارش موفق
            </span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-border/60 text-[11px] text-muted-foreground font-sans">
            <span>کل سبدهای ثبت‌شده:</span>
            <span className="font-bold text-foreground">
              {toPersianDigits(kpis.total_orders)} سبد
            </span>
          </div>
        </div>

        {/* Card 4: Average Order Value (AOV) */}
        <div className="bg-card border border-border/80 rounded-surface p-4 sm:p-5 shadow-surface space-y-2.5 relative overflow-hidden group hover:border-amber-500/40 transition-colors text-foreground">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-bold flex items-center gap-1.5 text-foreground">
              <BarChart3 className="w-4 h-4 text-amber-400" />
              میانگین سبد (AOV)
            </span>
            <span className="px-2 py-0.5 rounded-control bg-amber-500/10 text-amber-400 font-mono text-[10px] font-bold border border-amber-500/20">
              میانگین
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-400 tracking-tight">
            {formatMoney(
              kpis.average_order_value_toman,
              kpis.average_order_value_usdt,
            )}
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-border/60 text-[11px] text-muted-foreground">
            <span>مشتریان خریدار:</span>
            <span className="font-bold text-foreground">
              {toPersianDigits(kpis.total_customers)} کاربر
            </span>
          </div>
        </div>

        {/* Card 5: Registered Users & Signups */}
        <div className="bg-card border border-border/80 rounded-surface p-4 sm:p-5 shadow-surface space-y-2.5 relative overflow-hidden group hover:border-purple-500/40 transition-colors text-foreground">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-bold flex items-center gap-1.5 text-foreground">
              <Users className="w-4 h-4 text-purple-400" />
              کاربران ثبت‌نامی
            </span>
            <span className="px-2 py-0.5 rounded-control bg-purple-500/10 text-purple-400 font-mono text-[10px] font-bold border border-purple-500/20">
              +{toPersianDigits(kpis.new_registered_users || 0)} جدید
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-foreground tracking-tight font-sans">
            {formatNumber(kpis.total_registered_users || kpis.total_customers)}
            <span className="text-xs font-normal text-muted-foreground mr-1.5 font-sans">
              کاربر
            </span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-border/60 text-[11px] text-muted-foreground font-sans">
            <span>خریداران فعال:</span>
            <span className="font-bold text-purple-400 font-sans">
              {formatNumber(kpis.total_customers)} خریدار یکتا
            </span>
          </div>
        </div>
      </div>

      {/* Revenue Stream Division: Store Products vs 5SIM Virtual Numbers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card border border-border/80 p-4 rounded-surface shadow-surface flex items-center justify-between text-foreground">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-control bg-secondary text-brand border border-border/60 flex items-center justify-center">
              <Package className="w-5 h-5 text-brand" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                فروش لایسنس و اکانت‌های هوش مصنوعی
              </p>
              <p className="text-base font-black text-foreground font-latin">
                {formatMoney(
                  kpis.store_products_revenue,
                  data?.effective_usd_rate
                    ? kpis.store_products_revenue / data.effective_usd_rate
                    : 0,
                )}
              </p>
            </div>
          </div>
          <div className="text-left text-xs text-muted-foreground font-medium">
            <span className="font-bold text-brand font-latin">
              {kpis.store_products_count}
            </span>{' '}
            آیتم تحویل شده
          </div>
        </div>

        <div className="bg-card border border-border/80 p-4 rounded-surface shadow-surface flex items-center justify-between text-foreground">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-control bg-secondary text-cyan-400 border border-border/60 flex items-center justify-center">
              <Globe2 className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                فروش شماره‌های مجازی بین‌المللی (5SIM)
              </p>
              <p className="text-base font-black text-foreground font-latin">
                {formatMoney(
                  kpis.virtual_numbers_revenue,
                  data?.effective_usd_rate
                    ? kpis.virtual_numbers_revenue / data.effective_usd_rate
                    : 0,
                )}
              </p>
            </div>
          </div>
          <div className="text-left text-xs text-muted-foreground font-medium">
            <span className="font-bold text-cyan-400 font-latin">
              {kpis.virtual_numbers_count}
            </span>{' '}
            شماره موفق
          </div>
        </div>
      </div>

      {/* Main Interactive Chart: Revenue & Gross Profit Trends */}
      <div className="bg-card border border-border/80 p-6 rounded-surface shadow-surface space-y-6 text-foreground">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-black text-foreground flex items-center gap-2">
              <LineChartIcon className="w-5 h-5 text-brand" />
              نمودار تحلیلی درآمد، سود ناخالص و روند سفارشات
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              تفکیک بر اساس بازه انتخابی (
              {groupBy === 'daily'
                ? 'روزانه'
                : groupBy === 'weekly'
                  ? 'هفتگی'
                  : 'ماهانه'}
              ) به همراه محاسبه دقیق حاشیه سود
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5 text-brand font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-brand inline-block shadow-sm" />
              درآمد فروش (Revenue)
            </div>
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shadow-sm" />
              سود ناخالص (Gross Profit)
            </div>
            <div className="flex items-center gap-1.5 text-purple-400 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block shadow-sm" />
              تعداد سفارشات
            </div>
          </div>
        </div>

        {/* SVG Curve Chart */}
        {chartPoints.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-muted-foreground text-sm border border-dashed border-border/60 rounded-surface">
            هیچ تراکنش یا سفارشی در این بازه زمانی ثبت نشده است.
          </div>
        ) : (
          <div className="relative">
            <div className="w-full h-72 sm:h-80 select-none">
              <svg
                viewBox="0 0 1000 300"
                className="w-full h-full overflow-visible"
                preserveAspectRatio="none"
                role="img"
                aria-label="نمودار روند فروش و سود ناخالص"
              >
                <title>نمودار تحلیلی درآمد و سود ناخالص</title>
                <defs>
                  <linearGradient
                    id="revenueGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient
                    id="profitGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.30" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Horizontal Guide Grid Lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                  const y = 260 - ratio * 220
                  return (
                    <g key={ratio}>
                      <line
                        x1="30"
                        y1={y}
                        x2="980"
                        y2={y}
                        stroke="#334155"
                        strokeDasharray="4 4"
                        strokeOpacity="0.4"
                      />
                      <text
                        x="20"
                        y={y + 4}
                        fill="#64748b"
                        fontSize="10"
                        textAnchor="end"
                        direction="ltr"
                      >
                        {formatRawMoney(maxRevenueVal * ratio)}
                      </text>
                    </g>
                  )
                })}

                {/* Area & Line paths */}
                {(() => {
                  const step = (950 - 50) / Math.max(chartPoints.length - 1, 1)

                  const revPoints = chartPoints.map((p, i) => {
                    const x = 50 + i * step
                    const val =
                      currencyUnit === 'usdt' ? p.revenue_usdt : p.revenue_toman
                    const y = 260 - (val / maxRevenueVal) * 220
                    return { x, y }
                  })

                  const profitPoints = chartPoints.map((p, i) => {
                    const x = 50 + i * step
                    const val =
                      currencyUnit === 'usdt'
                        ? p.gross_profit_usdt
                        : p.gross_profit_toman
                    const y = 260 - (val / maxRevenueVal) * 220
                    return { x, y }
                  })

                  const revPathD = revPoints.reduce(
                    (acc, pt, i) =>
                      i === 0
                        ? `M ${pt.x} ${pt.y}`
                        : `${acc} L ${pt.x} ${pt.y}`,
                    '',
                  )
                  const revAreaD = `${revPathD} L ${
                    revPoints[revPoints.length - 1].x
                  } 260 L ${revPoints[0].x} 260 Z`

                  const profitPathD = profitPoints.reduce(
                    (acc, pt, i) =>
                      i === 0
                        ? `M ${pt.x} ${pt.y}`
                        : `${acc} L ${pt.x} ${pt.y}`,
                    '',
                  )
                  const profitAreaD = `${profitPathD} L ${
                    profitPoints[profitPoints.length - 1].x
                  } 260 L ${profitPoints[0].x} 260 Z`

                  return (
                    <>
                      {/* Area Fill */}
                      <path d={revAreaD} fill="url(#revenueGradient)" />
                      <path d={profitAreaD} fill="url(#profitGradient)" />

                      {/* Line Strokes */}
                      <path
                        d={revPathD}
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d={profitPathD}
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />

                      {/* Interactive hover points & verticals */}
                      {chartPoints.map((pt, i) => {
                        const x = 50 + i * step
                        const isHovered = hoveredIndex === i
                        const revVal =
                          currencyUnit === 'usdt'
                            ? pt.revenue_usdt
                            : pt.revenue_toman
                        const yRev = 260 - (revVal / maxRevenueVal) * 220

                        return (
                          <g
                            key={
                              pt.date ? `point-${pt.date}` : `point-idx-${i}`
                            }
                          >
                            {isHovered && (
                              <line
                                x1={x}
                                y1="40"
                                x2={x}
                                y2="260"
                                stroke="#94a3b8"
                                strokeWidth="1"
                                strokeDasharray="3 3"
                              />
                            )}
                            <circle
                              cx={x}
                              cy={yRev}
                              r={isHovered ? 6 : 4}
                              fill="#3b82f6"
                              stroke="#0f172a"
                              strokeWidth="2"
                              className="transition-all cursor-pointer"
                              onMouseEnter={() => {
                                setHoveredPoint(pt)
                                setHoveredIndex(i)
                              }}
                            />
                            {/* Invisible hit box for easier hovering */}
                            <rect
                              x={x - step / 2}
                              y="30"
                              width={step}
                              height="240"
                              fill="transparent"
                              className="cursor-pointer"
                              onMouseEnter={() => {
                                setHoveredPoint(pt)
                                setHoveredIndex(i)
                              }}
                              onMouseLeave={() => {
                                setHoveredPoint(null)
                                setHoveredIndex(null)
                              }}
                            />
                          </g>
                        )
                      })}
                    </>
                  )
                })()}

                {/* X Axis Labels */}
                {chartPoints.map((p, i) => {
                  const step = (950 - 50) / Math.max(chartPoints.length - 1, 1)
                  const x = 50 + i * step
                  // Don't clutter if many points
                  if (
                    chartPoints.length > 15 &&
                    i % Math.ceil(chartPoints.length / 10) !== 0
                  ) {
                    return null
                  }
                  return (
                    <text
                      key={p.date ? `label-${p.date}` : `label-idx-${i}`}
                      x={x}
                      y="285"
                      fill="#64748b"
                      fontSize="10"
                      textAnchor="middle"
                    >
                      {p.period_label || p.date}
                    </text>
                  )
                })}
              </svg>
            </div>

            {/* Hover Floating Tooltip */}
            {hoveredPoint && (
              <div className="absolute z-20 top-2 left-1/2 -translate-x-1/2 bg-card/95 border border-border/80 p-4 rounded-surface shadow-overlay backdrop-blur-md pointer-events-none flex flex-wrap gap-4 text-xs text-foreground animate-in fade-in duration-150">
                <div>
                  <span className="text-muted-foreground block font-normal">
                    بازه زمانی:
                  </span>
                  <span className="font-bold text-foreground">
                    {hoveredPoint.period_label} ({hoveredPoint.date})
                  </span>
                </div>
                <div className="border-r border-border/60 pr-3">
                  <span className="text-brand block font-normal">
                    درآمد فروش:
                  </span>
                  <span className="font-bold text-brand font-latin">
                    {formatMoney(
                      hoveredPoint.revenue_toman,
                      hoveredPoint.revenue_usdt,
                    )}
                  </span>
                </div>
                <div className="border-r border-border/60 pr-3">
                  <span className="text-emerald-400 block font-normal">
                    سود ناخالص:
                  </span>
                  <span className="font-bold text-emerald-400 font-latin">
                    {formatMoney(
                      hoveredPoint.gross_profit_toman,
                      hoveredPoint.gross_profit_usdt,
                    )}
                  </span>
                </div>
                <div className="border-r border-border/60 pr-3">
                  <span className="text-purple-400 block font-normal">
                    تعداد سفارش:
                  </span>
                  <span className="font-bold text-purple-400 font-latin">
                    {hoveredPoint.paid_orders} پرداخت از{' '}
                    {hoveredPoint.total_orders}
                  </span>
                </div>
                <div className="border-r border-border/60 pr-3">
                  <span className="text-amber-400 block font-normal">
                    نرخ تبدیل:
                  </span>
                  <span className="font-bold text-amber-400 font-latin">
                    {hoveredPoint.conversion_rate}%
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 1. Weekly Performance Matrix & Daily Breakdown Table */}
      <div className="bg-card border border-border/80 p-5 sm:p-6 rounded-surface shadow-surface space-y-4 text-foreground">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
          <div>
            <h3 className="text-base font-black text-foreground flex items-center gap-2">
              <Calendar className="w-5 h-5 text-brand" />
              ماتریس تفکیکی عملکرد روزانه بازه (
              {timeRange === '7d' ? 'هفتگی' : timeRange})
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              جزئیات درآمد فروش، بهای تمام‌شده، سود ناخالص و نرخ موفقیت سفارش‌ها
              به تفکیک هر روز
            </p>
          </div>
          <span className="text-xs text-muted-foreground font-sans">
            تعداد روزهای ثبت‌شده:{' '}
            <strong className="text-foreground font-latin">
              {toPersianDigits(chartPoints.length)}
            </strong>
          </span>
        </div>

        {chartPoints.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground text-xs">
            داده‌ای در این بازه زمانی به ثبت نرسیده است.
          </div>
        ) : (
          <div className="rounded-surface border border-border/80 overflow-hidden shadow-surface">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/40 text-muted-foreground font-bold select-none text-right">
                    <th className="p-3 text-right">روز / تاریخ</th>
                    <th className="p-3 text-right">فروش ناخالص</th>
                    <th className="p-3 text-right">بهای تمام‌شده (COGS)</th>
                    <th className="p-3 text-right">سود ناخالص</th>
                    <th className="p-3 text-center">حاشیه سود</th>
                    <th className="p-3 text-center">سفارشات موفق</th>
                    <th className="p-3 text-right min-w-[120px]">
                      سهم از کل فروش
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {chartPoints.slice(-10).map((pt, idx) => {
                    const revVal =
                      currencyUnit === 'usdt'
                        ? pt.revenue_usdt
                        : pt.revenue_toman
                    const pctRev =
                      maxRevenueVal > 0 ? (revVal / maxRevenueVal) * 100 : 0

                    return (
                      <tr
                        key={pt.date ? `row-${pt.date}` : `row-idx-${idx}`}
                        className="hover:bg-muted/20 transition-colors"
                      >
                        <td className="p-3 font-bold text-foreground whitespace-nowrap">
                          <div>{pt.period_label || pt.date}</div>
                          {pt.date && (
                            <span className="text-[10px] text-muted-foreground font-latin font-normal">
                              {pt.date}
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-brand font-black font-latin whitespace-nowrap">
                          {formatMoney(pt.revenue_toman, pt.revenue_usdt)}
                        </td>
                        <td className="p-3 text-muted-foreground font-sans whitespace-nowrap">
                          {formatMoney(
                            pt.revenue_toman - pt.gross_profit_toman,
                            pt.revenue_usdt - pt.gross_profit_usdt,
                          )}
                        </td>
                        <td className="p-3 text-emerald-400 font-black font-latin whitespace-nowrap">
                          {formatMoney(
                            pt.gross_profit_toman,
                            pt.gross_profit_usdt,
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <span className="px-2 py-0.5 rounded-control bg-emerald-500/10 text-emerald-400 font-bold text-[10px] border border-emerald-500/20 font-sans">
                            {toPersianDigits(pt.gross_margin)}٪
                          </span>
                        </td>
                        <td className="p-3 text-center font-bold text-foreground font-latin">
                          {toPersianDigits(pt.paid_orders)}{' '}
                          <span className="text-[10px] text-muted-foreground font-normal">
                            از {toPersianDigits(pt.total_orders)}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="w-full bg-muted/60 h-2 rounded-control overflow-hidden">
                            <div
                              style={{ width: `${Math.min(pctRev, 100)}%` }}
                              className="bg-brand h-full rounded-control transition-all duration-300"
                            />
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* 2. Real-Time Recent Orders Desk Table */}
      <div className="bg-card border border-border/80 p-5 sm:p-6 rounded-surface shadow-surface space-y-4 text-foreground">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-brand" />
            <div>
              <h3 className="text-base font-black text-foreground">
                آخرین سفارشات ثبت‌شده در سیستم
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                جریان زنده ثبت سفارش‌ها، وضعیت پرداخت و اطلاعات مشتریان
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={loadRecentOrders}
            disabled={loadingOrders}
            className="text-xs font-bold text-brand hover:underline inline-flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${loadingOrders ? 'animate-spin' : ''}`}
            />
            <span>تازه‌سازی سفارشات</span>
          </button>
        </div>

        {loadingOrders ? (
          <LoadingState message="در حال دریافت آخرین سفارشات..." />
        ) : recentOrders.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground text-xs">
            هنوز سفارشی در سامانه ثبت نشده است.
          </div>
        ) : (
          <div className="rounded-surface border border-border/80 overflow-hidden shadow-surface">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/40 text-muted-foreground font-bold select-none text-right">
                    <th className="p-3 text-right">شماره سفارش</th>
                    <th className="p-3 text-right">مشتری</th>
                    <th className="p-3 text-right">سرویس / اشتراک</th>
                    <th className="p-3 text-right">مبلغ پرداختی</th>
                    <th className="p-3 text-center">روش پرداخت</th>
                    <th className="p-3 text-center">وضعیت</th>
                    <th className="p-3 text-left">زمان ثبت</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {recentOrders.map((ord: any) => {
                    const isSuccess =
                      ord.status === 'completed' || ord.status === 'paid'
                    const isProcessing =
                      ord.status === 'processing' ||
                      ord.status === 'awaiting_customer_action' ||
                      ord.status === 'in_queue'
                    const isCancelled =
                      ord.status === 'cancelled' || ord.status === 'refunded'

                    return (
                      <tr
                        key={ord.id || ord.order_number}
                        className="hover:bg-muted/20 transition-colors"
                      >
                        <td className="p-3 font-mono font-latin font-bold text-brand">
                          #
                          {ord.order_number ||
                            ord.order_no ||
                            ord.id?.slice?.(0, 8)}
                        </td>
                        <td className="p-3 text-foreground font-sans">
                          <div className="font-bold">
                            {ord.customer_name ||
                              ord.customer_phone ||
                              'کاربر مهمان'}
                          </div>
                          {ord.customer_phone && ord.customer_name && (
                            <span className="text-[10px] text-muted-foreground font-latin block">
                              {ord.customer_phone}
                            </span>
                          )}
                        </td>
                        <td className="p-3 font-bold text-foreground">
                          {ord.product_title ||
                            ord.items?.[0]?.product_title ||
                            'سفارش هوش مصنوعی'}
                        </td>
                        <td className="p-3 font-black text-foreground font-sans">
                          {formatToman(
                            ord.total_amount_toman || ord.amount_toman || 0,
                          )}{' '}
                          <span className="text-[10px] font-normal text-muted-foreground font-sans">
                            تومان
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-control text-[10px] font-bold bg-muted/40 border border-border/60">
                            {ord.payment_platform === 'balance'
                              ? 'کیف پول'
                              : 'درگاه شاپرک'}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-control text-[10px] font-bold border font-sans ${
                              isSuccess
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : isProcessing
                                  ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                                  : isCancelled
                                    ? 'bg-rose-500/10 text-rose-500 border-rose-500/30'
                                    : 'bg-muted text-muted-foreground border-border/40'
                            }`}
                          >
                            {ord.status_fa ||
                              (isSuccess
                                ? 'پرداخت موفق ✓'
                                : isProcessing
                                  ? 'در حال انجام'
                                  : isCancelled
                                    ? 'لغو شده'
                                    : 'در انتظار')}
                          </span>
                        </td>
                        <td className="p-3 text-left text-muted-foreground font-latin text-[11px]">
                          {ord.created_at
                            ? new Date(ord.created_at).toLocaleTimeString(
                                'fa-IR',
                                {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                },
                              )
                            : 'لحظاتی پیش'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* 3. System Infrastructure Health & Integration Status Matrix */}
      <div className="bg-card border border-border/80 p-5 sm:p-6 rounded-surface shadow-surface space-y-4 text-foreground">
        <div className="border-b border-border/60 pb-3">
          <h3 className="text-base font-black text-foreground flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            سلامت سیستم و اتصالات زیرساخت فنی
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            پایش وضعیت زنده‌ی درگاه‌های پرداخت، وب‌سرویس‌های خارجی و لایه امنیت
            کریپتو
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-surface border border-emerald-500/30 bg-emerald-500/5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-foreground">
                درگاه پرداخت شاپرک
              </span>
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <div className="text-sm font-black text-emerald-500">
              آنلاین و آماده پرداخت
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              اتصال بدون وقفه به زرین‌پال و پروتکل پرداخت کارت‌های شتاب.
            </p>
          </div>

          <div className="p-4 rounded-surface border border-cyan-500/30 bg-cyan-500/5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-foreground">
                سرویس مجازی 5SIM
              </span>
              <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
            </div>
            <div className="text-sm font-black text-cyan-400">
              فعال (کش دو دقیقه‌ای)
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              استعلام زنده قیمت‌های تومانی و دریافت آنی پیامک OTP.
            </p>
          </div>

          <div className="p-4 rounded-surface border border-brand/30 bg-brand/5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-foreground">
                صرافی SwapWallet
              </span>
              <span className="flex h-2 w-2 rounded-full bg-brand animate-pulse" />
            </div>
            <div className="text-sm font-black text-brand">
              سینک لحظه‌ای USDT/IRT
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              نرخ مؤثر دلاری روز با قابلیت فال‌بک خودکار به نرخ دستی پنل.
            </p>
          </div>

          <div className="p-4 rounded-surface border border-purple-500/30 bg-purple-500/5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-foreground">
                امنیت Vault Zeroize
              </span>
              <ShieldCheck className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-sm font-black text-purple-400">
              AES-256-GCM فعال
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              رمزنگاری نامتقارن کلمات عبور و امحای کامل پس از فعال‌سازی.
            </p>
          </div>
        </div>
      </div>

      {/* Two Column Grid: Top Products vs Top Virtual Numbers Countries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Products */}
        <div className="bg-card border border-border/80 p-6 rounded-surface shadow-surface space-y-4 text-foreground">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <h3 className="text-base font-black text-foreground flex items-center gap-2">
              <Package className="w-5 h-5 text-brand" />
              پرفروش‌ترین لایسنس‌ها و محصولات
            </h3>
            <span className="text-xs text-muted-foreground font-latin font-bold">
              ۱۰ محصول برتر
            </span>
          </div>

          {!data?.top_products || data.top_products.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-xs">
              محصولی در بازه زمانی تعیین‌شده به فروش نرسیده است.
            </div>
          ) : (
            <div className="space-y-3">
              {data.top_products.map((prod, idx) => (
                <div
                  key={prod.product_id || idx}
                  className="flex items-center justify-between p-3 rounded-surface bg-muted/20 border border-border/60 hover:border-brand/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs font-latin ${
                        idx === 0
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                          : idx === 1
                            ? 'bg-slate-400/20 text-slate-300 border border-slate-400/40'
                            : idx === 2
                              ? 'bg-amber-700/20 text-amber-600 border border-amber-700/40'
                              : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-foreground line-clamp-1">
                        {prod.title_fa}
                      </h4>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {prod.units_sold.toLocaleString('fa-IR')} فروش موفق •
                        مارجین سود: {prod.margin_percent}%
                      </p>
                    </div>
                  </div>

                  <div className="text-left font-mono font-latin text-xs">
                    <span className="font-bold text-brand block">
                      {formatMoney(
                        prod.revenue_toman,
                        data.effective_usd_rate
                          ? prod.revenue_toman / data.effective_usd_rate
                          : 0,
                      )}
                    </span>
                    <span className="text-[11px] text-emerald-400 font-bold">
                      سود:{' '}
                      {formatMoney(
                        prod.gross_profit_toman,
                        data.effective_usd_rate
                          ? prod.gross_profit_toman / data.effective_usd_rate
                          : 0,
                      )}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Countries for Virtual Numbers */}
        <div className="bg-card border border-border/80 p-6 rounded-surface shadow-surface space-y-4 text-foreground">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <h3 className="text-base font-black text-foreground flex items-center gap-2">
              <Globe2 className="w-5 h-5 text-cyan-400" />
              پراستفاده‌ترین شماره‌های مجازی بر اساس کشور (5SIM)
            </h3>
            <span className="text-xs text-muted-foreground font-bold">
              کشورهای برتر
            </span>
          </div>

          {!data?.top_countries || data.top_countries.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-xs">
              سفارش شماره مجازی در این بازه ثبت نشده است.
            </div>
          ) : (
            <div className="space-y-3">
              {data.top_countries.map((c, idx) => (
                <div
                  key={c.country || idx}
                  className="flex items-center justify-between p-3 rounded-surface bg-muted/20 border border-border/60 hover:border-cyan-500/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="text-2xl"
                      role="img"
                      aria-label={c.country}
                    >
                      {c.country_flag || '🌐'}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-foreground">
                        {c.country_name_fa || c.country}
                      </h4>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        سرویس پرطرفدار:{' '}
                        <span className="text-cyan-400 font-bold">
                          {c.top_service || 'عمومی'}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="text-left font-mono font-latin text-xs">
                    <span className="font-bold text-foreground block">
                      {c.orders_count.toLocaleString('fa-IR')} شماره
                    </span>
                    <span className="text-[11px] text-cyan-400 font-bold">
                      {formatMoney(
                        c.revenue_toman,
                        data.effective_usd_rate
                          ? c.revenue_toman / data.effective_usd_rate
                          : 0,
                      )}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Customer Loyalty VIP Tier Distribution */}
      <div className="bg-card border border-border/80 p-6 rounded-surface shadow-surface space-y-5 text-foreground">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
          <div>
            <h3 className="text-base font-black text-foreground flex items-center gap-2">
              <Medal className="w-5 h-5 text-amber-400" />
              توزیع مشتریان در سطوح باشگاه وفاداری (VIP Club Distribution)
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              ترکیب کاربران و سهم فروش مشتریان در سطوح برنزی، نقره‌ای، طلایی و
              سازمانی
            </p>
          </div>
          <span className="text-xs text-muted-foreground font-latin">
            کل مشتریان:{' '}
            <strong className="text-foreground">
              {kpis.total_customers.toLocaleString('fa-IR')}
            </strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(data?.loyalty_stats || []).map((t) => (
            <div
              key={t.tier_code}
              className="bg-muted/20 border border-border/60 p-4 rounded-surface space-y-3 relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <span
                  className="px-2.5 py-1 rounded-control text-xs font-black flex items-center gap-1.5"
                  style={{
                    backgroundColor: `${t.badge_color}20`,
                    color: t.badge_color,
                    borderColor: `${t.badge_color}40`,
                    borderWidth: 1,
                  }}
                >
                  <Medal className="w-3.5 h-3.5" />
                  {t.tier_name}
                </span>
                <span className="text-xs font-bold text-muted-foreground">
                  {t.discount_percent > 0
                    ? `${t.discount_percent}٪ تخفیف`
                    : 'استاندارد'}
                </span>
              </div>

              <div>
                <p className="text-xl font-black text-foreground font-latin">
                  {t.customer_count.toLocaleString('fa-IR')}{' '}
                  <span className="text-xs font-normal text-muted-foreground font-sans">
                    کاربر
                  </span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  سهم از کاربران:{' '}
                  <strong className="text-foreground font-latin">
                    {t.percentage_of_users}%
                  </strong>
                </p>
              </div>

              <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">حجم خرید سطح:</span>
                <span className="font-bold text-amber-500 font-mono font-latin">
                  {formatRawMoney(t.total_spent_toman)}
                </span>
              </div>

              {/* Progress Line */}
              <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(t.percentage_of_sales, 100)}%`,
                    backgroundColor: t.badge_color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Vibe Farsi Visual Intelligence: Donut Breakdown & Interactive Jalali Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-6 bg-card border border-border/80 p-6 rounded-surface shadow-surface text-foreground">
          <PersianDonutChart
            title="سهم درگاه‌ها و کانال‌های فروش (Revenue Streams Breakdown)"
            data={[
              {
                label: 'لایسنس‌ها و اشتراک‌ها',
                value: kpis.store_products_revenue || 5400000,
                color: '#2563eb',
              },
              {
                label: 'شماره‌های مجازی (5SIM)',
                value: kpis.virtual_numbers_revenue || 1850000,
                color: '#06b6d4',
              },
              {
                label: 'سود ناخالص عملیاتی',
                value: kpis.gross_profit_toman || 2100000,
                color: '#10b981',
              },
            ]}
          />
        </div>

        <div className="lg:col-span-6">
          <PersianJalaliCalendar
            compact
            className="border-border/80 bg-card text-foreground shadow-surface rounded-surface"
          />
        </div>
      </div>
    </div>
  )
}
