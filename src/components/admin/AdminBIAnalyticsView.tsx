import {
  AlertCircle,
  BarChart3,
  Coins,
  DollarSign,
  Download,
  Globe2,
  LineChart as LineChartIcon,
  Medal,
  Package,
  Percent,
  RefreshCw,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Zap,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useMemo, useState } from 'react'
import { apiService } from '../../services/api'
import type {
  AdminBIKPIs,
  AdminBIOverviewResponse,
  AdminBITimeSeriesPoint,
} from '../../types'

export const AdminBIAnalyticsView: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true)
  const [refreshing, setRefreshing] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<AdminBIOverviewResponse | null>(null)

  // Filters
  const [timeRange, setTimeRange] = useState<
    '7d' | '30d' | '90d' | '1y' | 'all'
  >('30d')
  const [groupBy, setGroupBy] = useState<'daily' | 'weekly' | 'monthly'>(
    'daily',
  )
  const [currencyUnit, setCurrencyUnit] = useState<'toman' | 'usdt'>('toman')
  const [hoveredPoint, setHoveredPoint] =
    useState<AdminBITimeSeriesPoint | null>(null)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const loadData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true)
    else setLoading(true)
    setError(null)
    try {
      const res = await apiService.getBIOverview({
        range: timeRange,
        group_by: groupBy,
      })
      setData(res)
    } catch (err: any) {
      setError(err?.message || 'خطا در بارگذاری اطلاعات هوش تجاری')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [timeRange, groupBy])

  // Currency Formatter Helpers
  const formatMoney = (toman: number, usdt: number) => {
    if (currencyUnit === 'usdt') {
      return `$${usdt.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`
    }
    return `${Math.round(toman).toLocaleString('fa-IR')} تومان`
  }

  const formatRawMoney = (toman: number) => {
    if (currencyUnit === 'usdt' && data?.effective_usd_rate) {
      const usdt = toman / data.effective_usd_rate
      return `$${usdt.toLocaleString('en-US', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      })}`
    }
    return `${Math.round(toman).toLocaleString('fa-IR')} ت`
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
      <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 text-center text-red-400 space-y-4 my-6">
        <AlertCircle className="w-10 h-10 mx-auto text-red-500" />
        <h3 className="font-bold text-lg">خطا در بارگذاری داده‌های تحلیلی</h3>
        <p className="text-sm text-red-300/80">{error}</p>
        <button
          onClick={() => loadData()}
          className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-medium text-sm rounded-xl transition"
        >
          تلاش مجدد
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
    <div className="space-y-8 animate-in fade-in duration-300 pb-12">
      {/* Top Bar Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900/60 backdrop-blur-md border border-slate-800/80 p-5 rounded-2xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-blue-600/15 border border-blue-500/30 text-blue-400 rounded-xl">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-100 flex items-center gap-2">
                داشبورد آمار تحلیلی و هوش تجاری (BI & Analytics)
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Live Engine
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                محاسبه خودکار درآمد، بهای تمام‌شده (COGS)، سود ناخالص ارزی و نرخ
                تبدیل فروشگاه
              </p>
            </div>
          </div>
        </div>

        {/* Global Filter Bar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Currency Toggle */}
          <div className="flex items-center bg-slate-950/80 p-1 border border-slate-800 rounded-xl text-xs">
            <button
              onClick={() => setCurrencyUnit('toman')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                currencyUnit === 'toman'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Coins className="w-3.5 h-3.5" />
              تومان (IRT)
            </button>
            <button
              onClick={() => setCurrencyUnit('usdt')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                currencyUnit === 'usdt'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              تتر (USDT)
            </button>
          </div>

          {/* Time Range Selector */}
          <div className="flex items-center bg-slate-950/80 p-1 border border-slate-800 rounded-xl text-xs">
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
                onClick={() => setTimeRange(item.id)}
                className={`px-2.5 py-1.5 rounded-lg font-medium transition ${
                  timeRange === item.id
                    ? 'bg-slate-800 text-blue-400 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Group By Filter */}
          <div className="flex items-center bg-slate-950/80 p-1 border border-slate-800 rounded-xl text-xs">
            {(
              [
                { id: 'daily', label: 'روزانه' },
                { id: 'weekly', label: 'هفتگی' },
                { id: 'monthly', label: 'ماهانه' },
              ] as const
            ).map((g) => (
              <button
                key={g.id}
                onClick={() => setGroupBy(g.id)}
                className={`px-2.5 py-1.5 rounded-lg font-medium transition ${
                  groupBy === g.id
                    ? 'bg-blue-500/20 text-blue-400 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>

          {/* Refresh & Export */}
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            title="بروزرسانی زنده داده‌ها"
            className="p-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700/60 transition disabled:opacity-50"
          >
            <RefreshCw
              className={`w-4 h-4 ${refreshing ? 'animate-spin text-blue-400' : ''}`}
            />
          </button>

          <button
            onClick={handleExportCSV}
            title="خروجی فایل CSV"
            className="p-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700/60 transition flex items-center gap-1.5 text-xs font-semibold"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">خروجی CSV</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Gross Revenue */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-950/40 via-slate-900/80 to-slate-900 border border-blue-500/20 rounded-2xl p-5 shadow-lg group hover:border-blue-500/40 transition">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold flex items-center gap-1.5">
              <ShoppingBag className="w-4 h-4 text-blue-400" />
              فروش کل ناخالص (Revenue)
            </span>
            <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 font-mono text-[11px]">
              {timeRange}
            </span>
          </div>
          <div className="text-2xl font-black text-white tracking-tight mt-1">
            {formatMoney(kpis.total_revenue_toman, kpis.total_revenue_usdt)}
          </div>
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-800/80 text-xs">
            <span className="text-slate-400">تعداد سفارشات موفق:</span>
            <span className="font-bold text-slate-200">
              {kpis.paid_orders.toLocaleString('fa-IR')} سفارش
            </span>
          </div>
          <div className="absolute -left-6 -bottom-6 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/15 transition" />
        </div>

        {/* Card 2: Gross Profit & Margin */}
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-950/40 via-slate-900/80 to-slate-900 border border-emerald-500/20 rounded-2xl p-5 shadow-lg group hover:border-emerald-500/40 transition">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              سود ناخالص خالص (Gross Profit)
            </span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 font-bold text-[11px] flex items-center gap-1">
              <Percent className="w-3 h-3" />
              مارجین: {kpis.gross_margin_percent}%
            </span>
          </div>
          <div className="text-2xl font-black text-emerald-400 tracking-tight mt-1">
            {formatMoney(kpis.gross_profit_toman, kpis.gross_profit_usdt)}
          </div>
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-800/80 text-xs">
            <span className="text-slate-400">بهای تمام‌شده (COGS):</span>
            <span className="font-bold text-rose-400/90 font-mono">
              {formatMoney(kpis.total_cogs_toman, kpis.total_cogs_usdt)}
            </span>
          </div>
          <div className="absolute -left-6 -bottom-6 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/15 transition" />
        </div>

        {/* Card 3: Conversion Rate */}
        <div className="relative overflow-hidden bg-gradient-to-br from-purple-950/40 via-slate-900/80 to-slate-900 border border-purple-500/20 rounded-2xl p-5 shadow-lg group hover:border-purple-500/40 transition">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-purple-400" />
              نرخ تبدیل (Conversion Rate)
            </span>
            <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-300 font-mono text-[11px]">
              Checkout Flow
            </span>
          </div>
          <div className="text-2xl font-black text-purple-300 tracking-tight mt-1 flex items-baseline gap-1.5">
            <span>{kpis.conversion_rate_percent}%</span>
            <span className="text-xs font-normal text-slate-400">
              (از کل سبدها)
            </span>
          </div>
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-800/80 text-xs">
            <span className="text-slate-400">کل سفارشات ثبت‌شده:</span>
            <span className="font-bold text-slate-300">
              {kpis.total_orders.toLocaleString('fa-IR')} مورد
            </span>
          </div>
          <div className="absolute -left-6 -bottom-6 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/15 transition" />
        </div>

        {/* Card 4: Average Order Value (AOV) */}
        <div className="relative overflow-hidden bg-gradient-to-br from-amber-950/40 via-slate-900/80 to-slate-900 border border-amber-500/20 rounded-2xl p-5 shadow-lg group hover:border-amber-500/40 transition">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-amber-400" />
              میانگین سبد خرید (AOV)
            </span>
            <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 font-mono text-[11px]">
              Per Basket
            </span>
          </div>
          <div className="text-2xl font-black text-amber-300 tracking-tight mt-1">
            {formatMoney(
              kpis.average_order_value_toman,
              kpis.average_order_value_usdt,
            )}
          </div>
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-800/80 text-xs">
            <span className="text-slate-400">مشتریان یکتای خریدار:</span>
            <span className="font-bold text-slate-200">
              {kpis.total_customers.toLocaleString('fa-IR')} کاربر
            </span>
          </div>
          <div className="absolute -left-6 -bottom-6 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/15 transition" />
        </div>
      </div>

      {/* Revenue Stream Division: Store Products vs 5SIM Virtual Numbers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400">
                فروش لایسنس و اکانت‌های هوش مصنوعی
              </p>
              <p className="text-base font-bold text-slate-100">
                {formatMoney(
                  kpis.store_products_revenue,
                  data?.effective_usd_rate
                    ? kpis.store_products_revenue / data.effective_usd_rate
                    : 0,
                )}
              </p>
            </div>
          </div>
          <div className="text-left text-xs text-slate-400 font-medium">
            <span className="font-bold text-blue-400">
              {kpis.store_products_count}
            </span>{' '}
            آیتم تحویل شده
          </div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-600/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Globe2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400">
                فروش شماره‌های مجازی بین‌المللی (5SIM)
              </p>
              <p className="text-base font-bold text-slate-100">
                {formatMoney(
                  kpis.virtual_numbers_revenue,
                  data?.effective_usd_rate
                    ? kpis.virtual_numbers_revenue / data.effective_usd_rate
                    : 0,
                )}
              </p>
            </div>
          </div>
          <div className="text-left text-xs text-slate-400 font-medium">
            <span className="font-bold text-cyan-400">
              {kpis.virtual_numbers_count}
            </span>{' '}
            شماره موفق
          </div>
        </div>
      </div>

      {/* Main Interactive Chart: Revenue & Gross Profit Trends */}
      <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <LineChartIcon className="w-5 h-5 text-blue-400" />
              نمودار تحلیلی درآمد، سود ناخالص و روند سفارشات
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
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
            <div className="flex items-center gap-1.5 text-blue-400 font-semibold">
              <span className="w-3 h-3 rounded-full bg-blue-500 inline-block shadow-sm shadow-blue-500/50" />
              درآمد فروش (Revenue)
            </div>
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block shadow-sm shadow-emerald-500/50" />
              سود ناخالص (Gross Profit)
            </div>
            <div className="flex items-center gap-1.5 text-purple-400 font-semibold">
              <span className="w-3 h-3 rounded-full bg-purple-500 inline-block shadow-sm shadow-purple-500/50" />
              تعداد سفارشات
            </div>
          </div>
        </div>

        {/* SVG Curve Chart */}
        {chartPoints.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-slate-500 text-sm border border-dashed border-slate-800 rounded-xl">
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
              <div className="absolute z-20 top-2 left-1/2 -translate-x-1/2 bg-slate-950/95 border border-slate-700/80 p-4 rounded-xl shadow-2xl backdrop-blur-md pointer-events-none flex flex-wrap gap-4 text-xs animate-in fade-in duration-150">
                <div>
                  <span className="text-slate-400 block font-normal">
                    بازه زمانی:
                  </span>
                  <span className="font-bold text-slate-100">
                    {hoveredPoint.period_label} ({hoveredPoint.date})
                  </span>
                </div>
                <div className="border-r border-slate-800 pr-3">
                  <span className="text-blue-400 block font-normal">
                    درآمد فروش:
                  </span>
                  <span className="font-bold text-blue-300">
                    {formatMoney(
                      hoveredPoint.revenue_toman,
                      hoveredPoint.revenue_usdt,
                    )}
                  </span>
                </div>
                <div className="border-r border-slate-800 pr-3">
                  <span className="text-emerald-400 block font-normal">
                    سود ناخالص:
                  </span>
                  <span className="font-bold text-emerald-300">
                    {formatMoney(
                      hoveredPoint.gross_profit_toman,
                      hoveredPoint.gross_profit_usdt,
                    )}
                  </span>
                </div>
                <div className="border-r border-slate-800 pr-3">
                  <span className="text-purple-400 block font-normal">
                    تعداد سفارش:
                  </span>
                  <span className="font-bold text-purple-200">
                    {hoveredPoint.paid_orders} پرداخت از{' '}
                    {hoveredPoint.total_orders}
                  </span>
                </div>
                <div className="border-r border-slate-800 pr-3">
                  <span className="text-amber-400 block font-normal">
                    نرخ تبدیل:
                  </span>
                  <span className="font-bold text-amber-300">
                    {hoveredPoint.conversion_rate}%
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Comparative Bar Chart: Sales vs COGS vs Gross Profit */}
      <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-400" />
              نمودار میله‌ای مقایسه‌ای: فروش در برابر بهای تمام‌شده و سود ناخالص
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              مقایسه بصری ترکیب درآمد ناخالص و هزینه تأمین برای ارزیابی سلامت
              مالی
            </p>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          {chartPoints.slice(-10).map((pt, idx) => {
            const revVal =
              currencyUnit === 'usdt' ? pt.revenue_usdt : pt.revenue_toman
            const profitVal =
              currencyUnit === 'usdt'
                ? pt.gross_profit_usdt
                : pt.gross_profit_toman
            const pctRev =
              maxRevenueVal > 0 ? (revVal / maxRevenueVal) * 100 : 0
            const pctProfit =
              maxRevenueVal > 0 ? (profitVal / maxRevenueVal) * 100 : 0

            return (
              <div
                key={pt.date ? `bar-${pt.date}` : `bar-idx-${idx}`}
                className="space-y-1 bg-slate-950/40 p-3 rounded-xl border border-slate-800/60"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-300">
                    {pt.period_label}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-blue-400 font-mono">
                      فروش: {formatMoney(pt.revenue_toman, pt.revenue_usdt)}
                    </span>
                    <span className="text-emerald-400 font-mono">
                      سود:{' '}
                      {formatMoney(pt.gross_profit_toman, pt.gross_profit_usdt)}
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      مارجین: {pt.gross_margin}%
                    </span>
                  </div>
                </div>

                <div className="w-full bg-slate-800/80 h-3.5 rounded-full overflow-hidden flex relative">
                  {/* Revenue Bar */}
                  <div
                    style={{ width: `${Math.min(pctRev, 100)}%` }}
                    className="bg-blue-600/70 h-full rounded-r-full transition-all duration-500"
                    title={`فروش: ${formatMoney(pt.revenue_toman, pt.revenue_usdt)}`}
                  />
                  {/* Overlay Profit Bar */}
                  <div
                    style={{ width: `${Math.min(pctProfit, 100)}%` }}
                    className="bg-emerald-500 h-full -ml-[100%] rounded-r-full opacity-90 transition-all duration-500"
                    title={`سود خالص: ${formatMoney(pt.gross_profit_toman, pt.gross_profit_usdt)}`}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Two Column Grid: Top Products vs Top Virtual Numbers Countries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Products */}
        <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-400" />
              پرفروش‌ترین لایسنس‌ها و محصولات
            </h3>
            <span className="text-xs text-slate-400">۱۰ محصول برتر</span>
          </div>

          {!data?.top_products || data.top_products.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              محصولی در بازه زمانی تعیین‌شده به فروش نرسیده است.
            </div>
          ) : (
            <div className="space-y-3">
              {data.top_products.map((prod, idx) => (
                <div
                  key={prod.product_id || idx}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-blue-500/30 transition"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                        idx === 0
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                          : idx === 1
                            ? 'bg-slate-400/20 text-slate-300 border border-slate-400/40'
                            : idx === 2
                              ? 'bg-amber-700/20 text-amber-600 border border-amber-700/40'
                              : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-200 line-clamp-1">
                        {prod.title_fa}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {prod.units_sold.toLocaleString('fa-IR')} فروش موفق •
                        مارجین سود: {prod.margin_percent}%
                      </p>
                    </div>
                  </div>

                  <div className="text-left font-mono text-xs">
                    <span className="font-bold text-blue-400 block">
                      {formatMoney(
                        prod.revenue_toman,
                        data.effective_usd_rate
                          ? prod.revenue_toman / data.effective_usd_rate
                          : 0,
                      )}
                    </span>
                    <span className="text-[11px] text-emerald-400/90">
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
        <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Globe2 className="w-5 h-5 text-cyan-400" />
              پراستفاده‌ترین شماره‌های مجازی بر اساس کشور (5SIM)
            </h3>
            <span className="text-xs text-slate-400">کشورهای برتر</span>
          </div>

          {!data?.top_countries || data.top_countries.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              سفارش شماره مجازی در این بازه ثبت نشده است.
            </div>
          ) : (
            <div className="space-y-3">
              {data.top_countries.map((c, idx) => (
                <div
                  key={c.country || idx}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-cyan-500/30 transition"
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
                      <h4 className="text-xs font-bold text-slate-200">
                        {c.country_name_fa || c.country}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        سرویس پرطرفدار:{' '}
                        <span className="text-cyan-400">
                          {c.top_service || 'عمومی'}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="text-left font-mono text-xs">
                    <span className="font-bold text-slate-200 block">
                      {c.orders_count.toLocaleString('fa-IR')} شماره
                    </span>
                    <span className="text-[11px] text-cyan-400">
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
      <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Medal className="w-5 h-5 text-amber-400" />
              توزیع مشتریان در سطوح باشگاه وفاداری (VIP Club Distribution)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              ترکیب کاربران و سهم فروش مشتریان در سطوح برنزی، نقره‌ای، طلایی و
              سازمانی
            </p>
          </div>
          <span className="text-xs text-slate-400">
            کل مشتریان:{' '}
            <strong className="text-slate-200">
              {kpis.total_customers.toLocaleString('fa-IR')}
            </strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(data?.loyalty_stats || []).map((t) => (
            <div
              key={t.tier_code}
              className="bg-slate-950/70 border border-slate-800/80 p-4 rounded-xl space-y-3 relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <span
                  className="px-2.5 py-1 rounded-lg text-xs font-black flex items-center gap-1.5"
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
                <span className="text-xs font-bold text-slate-400">
                  {t.discount_percent > 0
                    ? `${t.discount_percent}٪ تخفیف`
                    : 'استاندارد'}
                </span>
              </div>

              <div>
                <p className="text-xl font-black text-slate-100">
                  {t.customer_count.toLocaleString('fa-IR')}{' '}
                  <span className="text-xs font-normal text-slate-400">
                    کاربر
                  </span>
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  سهم از کاربران:{' '}
                  <strong className="text-slate-200">
                    {t.percentage_of_users}%
                  </strong>
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs">
                <span className="text-slate-400">حجم خرید سطح:</span>
                <span className="font-bold text-amber-400 font-mono">
                  {formatRawMoney(t.total_spent_toman)}
                </span>
              </div>

              {/* Progress Line */}
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
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
    </div>
  )
}
