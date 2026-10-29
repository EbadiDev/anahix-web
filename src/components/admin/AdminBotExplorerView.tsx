import {
  AlertCircle,
  Bot,
  ChevronDown,
  ChevronUp,
  Link2,
  Plus,
  RefreshCw,
  Sparkles,
} from 'lucide-react'
import React, { useEffect, useMemo, useState } from 'react'
import { apiService } from '../../services/api'
import type {
  AdminProduct,
  BotCatalogProduct,
  BotProviderSetting,
} from '../../types'
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
  const [liveUSDTRate, setLiveUSDTRate] = useState(98500)

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

      const catalogPromises = targetProviders.map((p) =>
        apiService.getBotCatalog(p.key, forceRefresh).catch(() => []),
      )
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

  // Background Auto-Fetch Timer
  useEffect(() => {
    if (!autoSyncEnabled || autoSyncInterval <= 0) return
    const timer = setInterval(() => {
      loadData(true)
    }, autoSyncInterval * 1000)
    return () => clearInterval(timer)
  }, [autoSyncEnabled, autoSyncInterval, selectedBotFilter])

  // Filter items
  const filteredItems = useMemo(() => {
    return catalogItems.filter((item) => {
      if (
        selectedBotFilter !== 'all' &&
        item.provider_key !== selectedBotFilter
      )
        return false
      if (inStockOnly && !item.in_stock && item.stock <= 0) return false
      if (!search.trim()) return true
      const q = search.toLowerCase().trim()
      return (
        item.name.toLowerCase().includes(q) ||
        (item.description || '').toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q)
      )
    })
  }, [catalogItems, selectedBotFilter, inStockOnly, search])

  // Group items when "all" bots are selected to identify shared products
  const groupedCatalogRows = useMemo(() => {
    if (selectedBotFilter !== 'all') {
      return filteredItems.map((item) => ({
        isGroup: false,
        key: `${item.provider_key}-${item.id}`,
        title: item.name,
        item,
        providers: [item],
      }))
    }

    const map = new Map<string, BotCatalogProduct[]>()
    filteredItems.forEach((item) => {
      const norm = item.name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .slice(0, 16)
      if (!map.has(norm)) {
        map.set(norm, [])
      }
      map.get(norm)?.push(item)
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
        // Shared multi-bot product
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
  }, [filteredItems, selectedBotFilter])

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

  const handleOpenDirectImport = (prod: BotCatalogProduct) => {
    setSelectedProductForModal(prod)
    setIsFetchModalOpen(true)
  }

  return (
    <div className="space-y-6 text-foreground text-right" dir="rtl">
      {/* Top Controls & Bot Filter Selector */}
      <div className="bg-card p-4 sm:p-5 rounded-surface border border-border/80 shadow-surface space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
          <div>
            <h4 className="text-sm sm:text-base font-black text-foreground flex items-center gap-2">
              <Bot className="w-4 h-4 text-brand" />
              کاوشگر کاتالوگ زنده ۵ ربات و مقایسه چندرباته (Multi-Bot Catalog
              Explorer)
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              مشاهده محصولات همه ربات‌ها، مقایسه قیمت دلاری و تومانی زنده و
              افزودن مستقیم به عنوان پیش‌نویس به فروشگاه
            </p>
          </div>
        </div>

        {/* Bot Provider Filter Selector & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-muted-foreground whitespace-nowrap">
              فیلتر ربات مبدا:
            </label>
            <select
              value={selectedBotFilter}
              onChange={(e) => setSelectedBotFilter(e.target.value)}
              className="h-9 px-3 text-xs font-bold rounded-control border border-border/60 bg-card text-foreground cursor-pointer outline-none focus:border-brand shadow-xs min-w-[220px]"
            >
              <option value="all">🌐 همه ۵ ربات (مقایسه چندگانه قیمت)</option>
              {providers.map((p) => (
                <option key={p.key} value={p.key}>
                  🤖 {getProviderOfficialName(p.key)} ($
                  {p.balance_usd?.toFixed(2) || '0.00'} USD)
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Background Auto-Sync Control */}
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
                  className="bg-card text-foreground rounded-control border border-border/40 text-[10px] font-bold px-1.5 py-0.5 outline-none cursor-pointer font-latin"
                >
                  <option value={60}>هر ۱ دقیقه</option>
                  <option value={180}>هر ۳ دقیقه</option>
                  <option value={300}>هر ۵ دقیقه</option>
                  <option value={600}>هر ۱۰ دقیقه</option>
                </select>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/20 px-2.5 py-1.5 rounded-control border border-border/60">
              <ToggleSwitch
                checked={inStockOnly}
                onChange={setInStockOnly}
                size="sm"
                variant="brand"
              />
              <span>فقط موجودی‌ها</span>
            </div>

            <div className="w-52">
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
              className="h-9 px-3 rounded-control border border-border/60 bg-secondary text-secondary-foreground text-xs font-bold hover:bg-muted flex items-center gap-1.5 cursor-pointer shadow-control"
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

      {/* Catalog Table: 100% Centered thead and tbody with Expandable Shared Accordion */}
      {loading ? (
        <div className="bg-card rounded-surface border border-border/80 shadow-surface">
          <LoadingState
            message="در حال استعلام کاتالوگ و موجودی زنده از ربات‌ها..."
            subMessage="دریافت تغییرات محصولات و ارزیابی تومانی با نرخ لحظه‌ای SwapWallet"
          />
        </div>
      ) : groupedCatalogRows.length === 0 ? (
        <div className="p-10 text-center text-muted-foreground bg-card rounded-surface border border-border/60 space-y-2">
          <AlertCircle className="w-6 h-6 text-amber-500 mx-auto" />
          <p className="text-xs font-bold text-foreground">
            محصولی در کاتالوگ ربات‌ها یافت نشد.
          </p>
          <p className="text-[11px] text-muted-foreground">
            بررسی فرمایید کلیدهای API ربات‌ها در تب «کلیدهای API» ذخیره شده
            باشند.
          </p>
        </div>
      ) : (
        <div className="bg-card rounded-surface border border-border/80 shadow-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-center text-xs">
              <thead>
                <tr className="border-b border-border/60 bg-muted/30 text-muted-foreground font-bold">
                  <th className="py-3 px-4 text-center">ربات مبدا</th>
                  <th className="py-3 px-4 text-center">عنوان و شناسه محصول</th>
                  <th className="py-3 px-4 text-center">
                    قیمت پایه خرید و موجودی ربات
                  </th>
                  <th className="py-3 px-4 text-center">وضعیت در فروشگاه</th>
                  <th className="py-3 px-4 text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {groupedCatalogRows.map((row) => {
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
                            <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-control text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 font-latin">
                              {row.providers.length} تامین‌کننده
                            </span>
                          ) : (
                            <span
                              className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-control text-[10px] font-bold border font-latin ${getProviderBadgeColor(bestItem.provider_key)}`}
                            >
                              {getProviderOfficialName(bestItem.provider_key)}
                            </span>
                          )}
                        </td>

                        {/* Product Title */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="font-bold text-foreground flex items-center justify-center gap-1.5 mx-auto">
                            {bestItem.emoji && <span>{bestItem.emoji}</span>}
                            <span>{row.title}</span>
                          </div>
                          <div className="text-[10px] text-muted-foreground font-mono font-latin mt-0.5 text-center">
                            {row.isGroup
                              ? 'شناسه‌های چندگانه'
                              : `شناسه ربات: #${bestItem.id}`}
                          </div>
                          {row.isGroup && (
                            <div className="mt-1 flex justify-center">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-control text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                <Sparkles className="w-3 h-3" />
                                <span>
                                  مشترک بین {row.providers.length} ربات
                                </span>
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Unified Stacked Column: Toman, USD & Stock */}
                        <td className="py-3.5 px-4 text-center font-latin">
                          <div className="font-bold text-xs text-foreground">
                            {row.isGroup ? 'از ' : ''}
                            {costToman.toLocaleString('fa-IR')}{' '}
                            <span className="font-sans font-normal text-[10px] text-muted-foreground">
                              تومان
                            </span>
                          </div>
                          <div className="font-mono text-[11px] font-bold text-brand mt-0.5">
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
                              <span>
                                {bestItem.unlimited
                                  ? 'نامحدود (∞)'
                                  : isAvailable
                                    ? `${bestItem.stock} عدد موجود`
                                    : 'ناموجود'}
                              </span>
                            </span>
                          </div>
                        </td>

                        {/* Linked Status */}
                        <td className="py-3.5 px-4 text-center">
                          {bestItem.is_linked ? (
                            <span className="inline-flex items-center justify-center gap-1 px-2.5 py-0.5 rounded-control text-[11px] font-bold bg-primary/10 text-primary border border-primary/20">
                              <Link2 className="w-3 h-3" />
                              <span>موجود در سایت</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center gap-1 px-2.5 py-0.5 rounded-control text-[11px] text-muted-foreground bg-muted/40">
                              جدید
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-center">
                          {row.isGroup ? (
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedSharedKey(
                                  isExpanded ? null : row.key,
                                )
                              }
                              className="h-8 px-3 rounded-control border border-border/80 bg-secondary hover:bg-muted text-foreground font-black text-xs shadow-xs flex items-center justify-center gap-1.5 cursor-pointer duration-motion active:scale-[0.98] transition-all mx-auto"
                            >
                              <span>تامین‌کنندگان ({row.providers.length})</span>
                              {isExpanded ? (
                                <ChevronUp className="w-3.5 h-3.5 text-brand" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5" />
                              )}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenDirectImport(bestItem)}
                              className="h-8 px-3 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs shadow-control flex items-center justify-center gap-1.5 cursor-pointer duration-motion active:scale-[0.98] transition-all mx-auto"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>اد کردن (پیش‌نویس)</span>
                            </button>
                          )}
                        </td>
                      </tr>

                      {/* Expandable Sub-table for Shared Multi-Bot Products */}
                      {row.isGroup && isExpanded && (
                        <tr className="bg-muted/15 border-b border-border/60">
                          <td colSpan={8} className="p-3 sm:p-4 text-center">
                            <div className="bg-card rounded-surface border border-border/80 p-3 sm:p-4 space-y-2 text-right shadow-xs">
                              <div className="flex items-center justify-between pb-2 border-b border-border/40 text-xs font-bold text-foreground">
                                <span>
                                  مقایسه و انتخاب تامین‌کننده برای «{row.title}»:
                                </span>
                                <span className="text-[11px] text-muted-foreground">
                                  برای اد کردن، روی تامین‌کننده با بهترین قیمت یا
                                  موجودی کلیک فرمایید
                                </span>
                              </div>

                              <div className="overflow-x-auto">
                                <table className="w-full text-center text-xs">
                                  <thead>
                                    <tr className="bg-muted/40 text-muted-foreground text-[10px] font-bold">
                                      <th className="py-2 px-3 text-center">
                                        ربات تامین‌کننده
                                      </th>
                                      <th className="py-2 px-3 text-center">
                                        قیمت خرید و موجودی زنده
                                      </th>
                                      <th className="py-2 px-3 text-center">
                                        اقدام
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
                                            className={`inline-flex items-center px-2 py-0.5 rounded-control text-[10px] font-bold border font-latin ${getProviderBadgeColor(pSub.provider_key)}`}
                                          >
                                            {getProviderOfficialName(
                                              pSub.provider_key,
                                            )}{' '}
                                            (#{pSub.id})
                                          </span>
                                        </td>
                                        <td className="py-2.5 px-3 text-center font-latin">
                                          <div className="font-bold text-xs text-foreground">
                                            {Math.round(
                                              (pSub.price_usd || 0) *
                                                liveUSDTRate,
                                            ).toLocaleString('fa-IR')}{' '}
                                            تومان
                                          </div>
                                          <div className="font-mono text-[10px] font-bold text-brand">
                                            ${pSub.price_usd?.toFixed(2)} USD •{' '}
                                            <span
                                              className={
                                                pSub.in_stock ||
                                                pSub.stock > 0 ||
                                                pSub.unlimited
                                                  ? 'text-emerald-400 font-bold'
                                                  : 'text-rose-500'
                                              }
                                            >
                                              {pSub.unlimited
                                                ? 'نامحدود (∞)'
                                                : `${pSub.stock} عدد موجود`}
                                            </span>
                                          </div>
                                        </td>
                                        <td className="py-2.5 px-3 text-center">
                                          <button
                                            type="button"
                                            onClick={() =>
                                              handleOpenDirectImport(pSub)
                                            }
                                            className="h-7 px-2.5 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-bold text-[11px] shadow-xs flex items-center justify-center gap-1 mx-auto cursor-pointer"
                                          >
                                            <Plus className="w-3 h-3" />
                                            <span>
                                              اد کردن با{' '}
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
