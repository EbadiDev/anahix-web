import {
  AlertCircle,
  Bot,
  Boxes,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Plus,
  RefreshCw,
} from 'lucide-react'
import React, { useEffect, useMemo, useState } from 'react'
import { apiService } from '../../services/api'
import type {
  AdminProduct,
  BotCatalogProduct,
  BotProviderSetting,
} from '../../types'
import {
  formatNumber,
  formatToman,
  toPersianDigits,
} from '../../utils/formatters'
import { LoadingState } from '../vibefarsi/LoadingState'
import { useNotification } from '../vibefarsi/NotificationContext'
import { SearchInput } from '../vibefarsi/SearchInput'
import { ToggleSwitch } from '../vibefarsi/ToggleSwitch'
import { FetchBotModal } from './FetchBotModal'

interface AdminBotExplorerViewProps {
  onProductImported?: (product: AdminProduct) => void
}

export const AdminBotExplorerView: React.FC<AdminBotExplorerViewProps> = ({
  onProductImported,
}) => {
  const { error: notifyError } = useNotification()
  const [providers, setProviders] = useState<BotProviderSetting[]>([])
  const [selectedBotFilter, setSelectedBotFilter] = useState<string>('all')
  const [catalogItems, setCatalogItems] = useState<BotCatalogProduct[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [inStockOnly, setInStockOnly] = useState(false)
  const [groupByShared, setGroupByShared] = useState(false)
  const [liveUSDTRate, setLiveUSDTRate] = useState(98500)

  // Pagination State
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  // Auto-Sync / Background Polling State
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(false)
  const [autoSyncInterval, setAutoSyncInterval] = useState<number>(300) // 5 minutes default

  // Expandable shared multi-bot items state
  const [expandedSharedKey, setExpandedSharedKey] = useState<string | null>(
    null,
  )

  // Fetch Modal State & Targeted Direct Import Product
  const [isFetchModalOpen, setIsFetchModalOpen] = useState(false)
  const [selectedProductForModal, setSelectedProductForModal] =
    useState<BotCatalogProduct | null>(null)

  const loadData = async (forceRefresh = false) => {
    setLoading(true)
    try {
      const [provList, deliverySettings] = await Promise.all([
        apiService.getBotProviderSettings().catch(() => []),
        apiService.getInstantDeliverySettings().catch(() => null),
      ])
      setProviders(provList)
      if (deliverySettings?.effective_usd_rate) {
        setLiveUSDTRate(deliverySettings.effective_usd_rate)
      }

      // Fetch catalogs from enabled providers
      const activeProviders = provList.filter((p) => p.has_api_key || p.enabled)
      const targetProviders =
        selectedBotFilter === 'all'
          ? activeProviders.length > 0
            ? activeProviders
            : provList
          : provList.filter((p) => p.key === selectedBotFilter)

      const catalogPromises = targetProviders.map(async (p) => {
        try {
          return await apiService.getBotCatalog(p.key, forceRefresh)
        } catch {
          return []
        }
      })
      const results = await Promise.all(catalogPromises)
      const flattened = results.flat()
      setCatalogItems(flattened)
    } catch (err: any) {
      notifyError('خطا در دریافت کاتالوگ ربات‌ها', err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [selectedBotFilter])

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [search, inStockOnly, selectedBotFilter, groupByShared, pageSize])

  // Background Auto-Fetch Timer
  useEffect(() => {
    if (!autoSyncEnabled || autoSyncInterval <= 0) return
    const timer = setInterval(() => {
      loadData(true)
    }, autoSyncInterval * 1000)
    return () => clearInterval(timer)
  }, [autoSyncEnabled, autoSyncInterval, selectedBotFilter])

  const getProviderOfficialName = (key: string) => {
    switch (key) {
      case 'insightx':
        return 'InsightX Store'
      case 'stackvault':
        return 'StackVault Digital'
      case 'paglu':
        return 'Loot Paglu'
      case 'jero':
        return 'Jero Accounts'
      case 'supreme':
        return 'Supreme Leader Shop'
      default:
        return key
    }
  }

  const getProviderBadgeColor = (key: string) => {
    switch (key) {
      case 'insightx':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
      case 'stackvault':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20'
      case 'paglu':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20'
      case 'jero':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
      case 'supreme':
        return 'bg-rose-500/10 text-rose-500 border-rose-500/20'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  // Summary statistics per bot
  const botStats = useMemo(() => {
    return providers.map((prov) => {
      const count = catalogItems.filter(
        (it) => it.provider_key === prov.key,
      ).length
      return {
        key: prov.key,
        name: getProviderOfficialName(prov.key),
        count,
        balance_usd: prov.balance_usd || 0,
        balance_toman: prov.balance_toman || 0,
        is_connected: prov.is_connected,
        has_api_key: prov.has_api_key,
      }
    })
  }, [providers, catalogItems])

  // Filter items
  const filteredItems = useMemo(() => {
    return catalogItems.filter((item) => {
      if (
        selectedBotFilter !== 'all' &&
        item.provider_key !== selectedBotFilter
      ) {
        return false
      }
      if (inStockOnly && !item.in_stock && item.stock <= 0) {
        return false
      }
      if (!search.trim()) return true
      const q = search.toLowerCase().trim()
      return (
        item.name.toLowerCase().includes(q) ||
        (item.description || '').toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q)
      )
    })
  }, [catalogItems, selectedBotFilter, inStockOnly, search])

  // Process rows: either flat (every product visible directly) or grouped by shared titles
  const processedRows = useMemo(() => {
    if (!groupByShared || selectedBotFilter !== 'all') {
      return filteredItems.map((item) => ({
        isGroup: false,
        key: `${item.provider_key}-${item.id}`,
        title: item.name,
        item,
        providers: [item],
      }))
    }

    // Normalized grouping: clean spaces and punctuation without stripping unicode/persian letters
    const map = new Map<string, BotCatalogProduct[]>()
    filteredItems.forEach((item) => {
      const cleanKey = item.name
        .trim()
        .toLowerCase()
        .replace(/[\s\-_.:,;/|\\+()]+/g, '')
      const finalKey = cleanKey || item.name
      if (!map.has(finalKey)) {
        map.set(finalKey, [])
      }
      map.get(finalKey)?.push(item)
    })

    const rows: Array<{
      isGroup: boolean
      key: string
      title: string
      item: BotCatalogProduct
      providers: BotCatalogProduct[]
    }> = []

    map.forEach((items, normKey) => {
      const distinctProv = new Set(items.map((i) => i.provider_key))
      if (distinctProv.size > 1 && items.length > 1) {
        const sorted = [...items].sort(
          (a, b) => (a.price_usd || 0) - (b.price_usd || 0),
        )
        rows.push({
          isGroup: true,
          key: normKey,
          title: sorted[0].name,
          item: sorted[0],
          providers: sorted,
        })
      } else {
        items.forEach((it) => {
          rows.push({
            isGroup: false,
            key: `${it.provider_key}-${it.id}`,
            title: it.name,
            item: it,
            providers: [it],
          })
        })
      }
    })

    return rows
  }, [filteredItems, selectedBotFilter, groupByShared])

  // Pagination calculation
  const totalItems = processedRows.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize
    return processedRows.slice(start, start + pageSize)
  }, [processedRows, page, pageSize])

  const handleOpenDirectImport = (prod: BotCatalogProduct) => {
    setSelectedProductForModal(prod)
    setIsFetchModalOpen(true)
  }

  return (
    <div
      className="space-y-6 text-foreground text-right select-none animate-in fade-in duration-200"
      dir="rtl"
    >
      {/* 1. Header Overview & KPI Breakdown Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Metric Card */}
        <div className="col-span-2 sm:col-span-1 p-4 rounded-surface border border-border/80 bg-card shadow-surface space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-bold">
            <span>کل محصولات دریافتی</span>
            <Boxes className="w-4 h-4 text-brand" />
          </div>
          <div className="text-2xl font-black text-foreground font-sans pt-1">
            {formatNumber(catalogItems.length)}
          </div>
          <p className="text-[10px] text-muted-foreground">
            از ۵ ربات تامین‌کننده
          </p>
        </div>

        {/* Per-Bot Metric Badges */}
        {botStats.map((bot) => (
          <div
            key={bot.key}
            onClick={() => setSelectedBotFilter(bot.key)}
            className={`p-3.5 rounded-surface border transition-all cursor-pointer shadow-surface space-y-1 ${
              selectedBotFilter === bot.key
                ? 'border-brand bg-brand/5 ring-1 ring-brand/30'
                : 'border-border/60 bg-card hover:bg-muted/40'
            }`}
          >
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold truncate text-foreground">
                {bot.name}
              </span>
              <span
                className={`w-2 h-2 rounded-full ${
                  bot.is_connected
                    ? 'bg-emerald-400 animate-pulse'
                    : bot.has_api_key
                      ? 'bg-amber-400'
                      : 'bg-muted-foreground/40'
                }`}
              />
            </div>
            <div className="text-lg font-black text-foreground font-sans">
              {formatNumber(bot.count)}{' '}
              <span className="text-[10px] font-normal text-muted-foreground font-sans">
                محصول
              </span>
            </div>
            <div className="text-[10px] text-muted-foreground font-sans flex items-center justify-between">
              <span>مانده:</span>
              <span className="font-bold text-brand">
                ${bot.balance_usd.toFixed(2)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* 2. Control Toolbar (Filters, Search, Auto-Sync & Grouping) */}
      <div className="bg-card p-4 sm:p-5 rounded-surface border border-border/80 shadow-surface space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
          <div>
            <h4 className="text-sm sm:text-base font-black text-foreground flex items-center gap-2">
              <Bot className="w-4 h-4 text-brand" />
              <span>
                کاوشگر کاتالوگ زنده ۵ ربات و مقایسه چندرباته (Multi-Bot Catalog
                Explorer)
              </span>
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              مشاهده محصولات همه ربات‌ها، مقایسه قیمت دلاری و تومانی زنده و
              افزودن مستقیم به عنوان پیش‌نویس به فروشگاه
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-muted-foreground font-sans">
              نمایش {toPersianDigits(paginatedRows.length)} از{' '}
              {formatNumber(totalItems)} محصول
            </span>
          </div>
        </div>

        {/* Bot Provider Filter Selector & Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <label className="text-xs font-bold text-muted-foreground whitespace-nowrap">
              فیلتر ربات مبدا:
            </label>
            <select
              value={selectedBotFilter}
              onChange={(e) => setSelectedBotFilter(e.target.value)}
              className="h-9 px-3 text-xs font-bold rounded-control border border-border/60 bg-card text-foreground cursor-pointer outline-none focus:border-brand shadow-xs min-w-[220px]"
            >
              <option value="all">
                🌐 همه ربات‌ها ({formatNumber(catalogItems.length)} کالا)
              </option>
              {providers.map((p) => {
                const count = catalogItems.filter(
                  (it) => it.provider_key === p.key,
                ).length
                return (
                  <option key={p.key} value={p.key}>
                    🤖 {getProviderOfficialName(p.key)} (
                    {toPersianDigits(count)} کالا - $
                    {p.balance_usd?.toFixed(2) || '0.00'})
                  </option>
                )
              })}
            </select>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Grouping Toggle */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/20 px-2.5 py-1.5 rounded-control border border-border/60">
              <ToggleSwitch
                checked={groupByShared}
                onChange={setGroupByShared}
                size="sm"
                variant="brand"
              />
              <span className="font-bold">گروه‌بندی اقلام مشترک</span>
            </div>

            {/* In-Stock Toggle */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/20 px-2.5 py-1.5 rounded-control border border-border/60">
              <ToggleSwitch
                checked={inStockOnly}
                onChange={setInStockOnly}
                size="sm"
                variant="brand"
              />
              <span>فقط موجودی‌ها</span>
            </div>

            {/* Auto-sync background */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/20 px-2.5 py-1.5 rounded-control border border-border/60">
              <ToggleSwitch
                checked={autoSyncEnabled}
                onChange={setAutoSyncEnabled}
                size="sm"
                variant="brand"
              />
              <span className="font-bold">استعلام خودکار</span>
              {autoSyncEnabled && (
                <select
                  value={autoSyncInterval}
                  onChange={(e) => setAutoSyncInterval(Number(e.target.value))}
                  className="bg-card text-foreground rounded-control border border-border/40 text-[10px] font-bold px-1.5 py-0.5 outline-none cursor-pointer font-sans"
                >
                  <option value={60}>هر ۱ دقیقه</option>
                  <option value={180}>هر ۳ دقیقه</option>
                  <option value={300}>هر ۵ دقیقه</option>
                  <option value={600}>هر ۱۰ دقیقه</option>
                </select>
              )}
            </div>

            <div className="w-48 sm:w-56">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="جستجو در محصولات ربات..."
                debounceMs={250}
              />
            </div>

            <button
              type="button"
              onClick={() => loadData(true)}
              disabled={loading}
              className="h-9 px-3 rounded-control border border-border/60 bg-secondary text-secondary-foreground text-xs font-bold hover:bg-muted flex items-center gap-1.5 cursor-pointer shadow-control transition-all duration-motion active:scale-95"
              title="استعلام تازه از ربات‌ها"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-brand' : ''}`}
              />
              <span className="hidden sm:inline">بروزرسانی</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Catalog Table */}
      {loading ? (
        <div className="bg-card rounded-surface border border-border/80 shadow-surface overflow-hidden">
          <LoadingState
            message="در حال استعلام کاتالوگ و موجودی زنده از ۵ ربات..."
            subMessage="دریافت لحظه‌ای قیمت‌های دلاری، وضعیت انبار و ارزیابی تومانی با نرخ SwapWallet"
            minHeight="35vh"
          />
        </div>
      ) : paginatedRows.length === 0 ? (
        <div className="p-12 text-center text-muted-foreground bg-card rounded-surface border border-border/80 shadow-surface space-y-3">
          <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
          <h4 className="text-sm font-bold text-foreground">
            محصولی در کاتالوگ ربات‌ها یافت نشد
          </h4>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
            بررسی فرمایید کلیدهای وب‌سرویس ربات‌ها در تب «کلیدهای API» ذخیره شده
            باشند یا فیلترهای جستجو را پاک کنید.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearch('')
              setSelectedBotFilter('all')
              setInStockOnly(false)
            }}
            className="h-9 px-4 rounded-control border border-border/60 bg-secondary hover:bg-muted text-xs font-bold transition shadow-xs cursor-pointer inline-flex items-center gap-1.5"
          >
            <span>پاکسازی فیلترها</span>
          </button>
        </div>
      ) : (
        <div className="bg-card rounded-surface border border-border/80 shadow-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-center text-xs">
              <thead>
                <tr className="border-b border-border/60 bg-muted/30 text-muted-foreground font-bold">
                  <th className="py-3.5 px-4 text-center">ربات مبدا</th>
                  <th className="py-3.5 px-4 text-center">
                    عنوان و شناسه محصول
                  </th>
                  <th className="py-3.5 px-4 text-center">
                    قیمت پایه خرید و موجودی ربات
                  </th>
                  <th className="py-3.5 px-4 text-center">وضعیت در فروشگاه</th>
                  <th className="py-3.5 px-4 text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {paginatedRows.map((row) => {
                  const bestItem = row.item
                  const isAvailable =
                    bestItem.in_stock ||
                    bestItem.stock > 0 ||
                    bestItem.unlimited
                  const costToman = Math.round(
                    (bestItem.price_usd || 0) * liveUSDTRate,
                  )
                  const isExpanded = expandedSharedKey === row.key

                  return (
                    <React.Fragment key={row.key}>
                      <tr className="hover:bg-muted/20 transition-colors">
                        {/* Provider Badge */}
                        <td className="py-3.5 px-4 text-center">
                          {row.isGroup ? (
                            <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-control text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 font-sans">
                              {toPersianDigits(row.providers.length)} تامین‌کننده
                            </span>
                          ) : (
                            <span
                              className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-control text-[10px] font-bold border font-sans ${getProviderBadgeColor(bestItem.provider_key)}`}
                            >
                              {getProviderOfficialName(bestItem.provider_key)}
                            </span>
                          )}
                        </td>

                        {/* Title & Numeric ID */}
                        <td className="py-3.5 px-4 text-center font-bold text-foreground">
                          <div className="flex items-center justify-center gap-2">
                            {bestItem.emoji && (
                              <span className="text-sm shrink-0">
                                {bestItem.emoji}
                              </span>
                            )}
                            <span className="line-clamp-1">{row.title}</span>
                          </div>
                          <div className="text-[10px] text-muted-foreground font-mono font-sans mt-0.5 text-center">
                            شناسه: #
                            {toPersianDigits(
                              bestItem.numeric_id || bestItem.id,
                            )}
                          </div>
                          {row.isGroup && (
                            <div className="mt-1 flex items-center justify-center">
                              <span
                                onClick={() =>
                                  setExpandedSharedKey(
                                    isExpanded ? null : row.key,
                                  )
                                }
                                className="inline-flex items-center gap-1 text-[10px] font-bold text-brand hover:underline cursor-pointer"
                              >
                                {isExpanded ? (
                                  <>
                                    <ChevronUp className="w-3 h-3" />
                                    <span>بستن مقایسه قیمت‌ها</span>
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="w-3 h-3" />
                                    <span>
                                      مقایسه قیمت{' '}
                                      {toPersianDigits(row.providers.length)}{' '}
                                      ربات
                                    </span>
                                  </>
                                )}
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Unified Stacked Column: Toman, USD & Stock */}
                        <td className="py-3.5 px-4 text-center font-sans">
                          <div className="font-bold text-xs text-foreground font-sans">
                            خرید: {row.isGroup ? 'از ' : ''}
                            {formatToman(costToman)} تومان
                          </div>
                          <div className="font-mono text-[10px] font-bold text-muted-foreground mt-0.5">
                            {row.isGroup ? 'از ' : ''}$
                            {bestItem.price_usd?.toFixed(2) || '0.00'} USD
                          </div>
                          <div className="mt-1 flex justify-center">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-control text-[10px] font-bold ${
                                isAvailable
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                              }`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${isAvailable ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`}
                              />
                              <span className="font-sans">
                                {bestItem.unlimited
                                  ? 'نامحدود (∞)'
                                  : isAvailable
                                    ? `${formatNumber(bestItem.stock)} عدد موجود`
                                    : 'ناموجود'}
                              </span>
                            </span>
                          </div>
                        </td>

                        {/* Store Connection Status */}
                        <td className="py-3.5 px-4 text-center">
                          {bestItem.is_linked ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-control text-[11px] font-bold bg-primary/10 text-primary border border-primary/20">
                              <Check className="w-3 h-3 text-brand" />
                              <span>متصل به کاتالوگ</span>
                            </span>
                          ) : (
                            <span className="text-[11px] text-muted-foreground/70">
                              آزاد (بدون اتصال)
                            </span>
                          )}
                        </td>

                        {/* Action Buttons */}
                        <td className="py-3.5 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleOpenDirectImport(bestItem)}
                            className="h-8 px-3.5 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs duration-motion active:scale-[0.98] shadow-control inline-flex items-center gap-1.5 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>افزودن به فروشگاه</span>
                          </button>
                        </td>
                      </tr>

                      {/* Expandable Sub-table for Shared Multi-Bot Products */}
                      {row.isGroup && isExpanded && (
                        <tr className="bg-muted/15 border-b border-border/60">
                          <td colSpan={5} className="p-3 sm:p-4 text-center">
                            <div className="bg-card rounded-surface border border-border/80 p-3 sm:p-4 space-y-2 text-right shadow-xs">
                              <div className="flex items-center justify-between pb-2 border-b border-border/40 text-xs font-bold text-foreground">
                                <span>
                                  مقایسه قیمت و موجودی این محصول بین ربات‌های
                                  تامین‌کننده:
                                </span>
                                <span className="text-[11px] text-muted-foreground">
                                  مرتب‌شده بر اساس ارزان‌ترین به گران‌ترین
                                </span>
                              </div>

                              <div className="overflow-x-auto">
                                <table className="w-full text-center text-xs">
                                  <thead>
                                    <tr className="bg-muted/40 text-muted-foreground text-[10px] font-bold">
                                      <th className="py-2 px-3 text-center">
                                        ربات
                                      </th>
                                      <th className="py-2 px-3 text-center">
                                        قیمت و موجودی
                                      </th>
                                      <th className="py-2 px-3 text-center">
                                        عملیات
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-border/40">
                                    {row.providers.map((pSub) => (
                                      <tr
                                        key={`${pSub.provider_key}-${pSub.id}`}
                                        className="hover:bg-muted/30"
                                      >
                                        <td className="py-2.5 px-3 text-center">
                                          <span
                                            className={`inline-flex items-center px-2 py-0.5 rounded-control text-[10px] font-bold border font-sans ${getProviderBadgeColor(pSub.provider_key)}`}
                                          >
                                            {getProviderOfficialName(
                                              pSub.provider_key,
                                            )}{' '}
                                            (#{pSub.id})
                                          </span>
                                        </td>
                                        <td className="py-2.5 px-3 text-center font-sans">
                                          <div className="font-bold text-xs text-foreground font-sans">
                                            خرید:{' '}
                                            {formatToman(
                                              Math.round(
                                                (pSub.price_usd || 0) *
                                                  liveUSDTRate,
                                              ),
                                            )}{' '}
                                            تومان
                                          </div>
                                          <div className="font-mono text-[10px] font-bold text-muted-foreground mt-0.5">
                                            ${pSub.price_usd?.toFixed(2)} USD
                                          </div>
                                          <div className="mt-1">
                                            <span
                                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-control text-[9px] font-bold ${
                                                pSub.in_stock ||
                                                pSub.stock > 0 ||
                                                pSub.unlimited
                                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                  : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                                              }`}
                                            >
                                              <span className="font-sans">
                                                {pSub.unlimited
                                                  ? 'نامحدود (∞)'
                                                  : `${formatNumber(pSub.stock)} عدد موجود`}
                                              </span>
                                            </span>
                                          </div>
                                        </td>
                                        <td className="py-2.5 px-3 text-center">
                                          <button
                                            type="button"
                                            onClick={() =>
                                              handleOpenDirectImport(pSub)
                                            }
                                            className="h-7 px-2.5 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-bold text-[11px] shadow-xs flex items-center justify-center gap-1 mx-auto cursor-pointer duration-motion active:scale-95"
                                          >
                                            <Plus className="w-3 h-3" />
                                            <span>
                                              افزودن با{' '}
                                              {getProviderOfficialName(
                                                pSub.provider_key,
                                              )}
                                            </span>
                                          </button>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-border/60 bg-muted/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-muted-foreground font-sans">
              <div className="flex items-center gap-3">
                <span>
                  نمایش صفحه {toPersianDigits(page)} از{' '}
                  {toPersianDigits(totalPages)} (مجموع{' '}
                  {formatNumber(totalItems)} محصول)
                </span>

                <div className="flex items-center gap-1">
                  <span className="text-[11px] font-bold">تعداد در صفحه:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className="h-7 px-2 rounded-control border border-border/60 bg-card text-foreground font-sans text-xs outline-none cursor-pointer"
                  >
                    <option value={10}>۱۰</option>
                    <option value={25}>۲۵</option>
                    <option value={50}>۵۰</option>
                    <option value={100}>۱۰۰</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-1.5 self-center sm:self-auto">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded-control border border-border/60 bg-card hover:bg-muted text-foreground disabled:opacity-40 cursor-pointer transition-colors"
                  title="صفحه قبل"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = i + 1
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => setPage(pageNum)}
                        className={`w-7 h-7 rounded-control text-xs font-bold transition-all cursor-pointer ${
                          page === pageNum
                            ? 'bg-primary text-primary-foreground shadow-control font-black'
                            : 'border border-border/60 bg-card hover:bg-muted text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {toPersianDigits(pageNum)}
                      </button>
                    )
                  })}
                </div>

                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="p-1.5 rounded-control border border-border/60 bg-card hover:bg-muted text-foreground disabled:opacity-40 cursor-pointer transition-colors"
                  title="صفحه بعد"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Fetch & Pricing Calculator Modal with Direct Pre-selection */}
      <FetchBotModal
        isOpen={isFetchModalOpen}
        initialProduct={selectedProductForModal}
        onClose={() => {
          setIsFetchModalOpen(false)
          setSelectedProductForModal(null)
        }}
        onProductImported={(prod) => {
          loadData(true)
          if (onProductImported) onProductImported(prod)
        }}
      />
    </div>
  )
}
