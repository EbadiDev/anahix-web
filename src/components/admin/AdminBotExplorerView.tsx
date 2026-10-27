import {
  AlertCircle,
  Bot,
  Link2,
  Plus,
  RefreshCw,
  Sparkles,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useMemo, useState } from 'react'
import { apiService } from '../../services/api'
import type {
  AdminProduct,
  BotCatalogProduct,
  BotProviderSetting,
} from '../../types'
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

  // Fetch Modal State
  const [isFetchModalOpen, setIsFetchModalOpen] = useState(false)

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

  // Multi-bot matching analysis (detect products with similar names across bots)
  const multiBotDuplicates = useMemo(() => {
    const map = new Map<string, BotCatalogProduct[]>()
    for (const item of catalogItems) {
      // Normalize name: lowercase and strip punctuation
      const norm = item.name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .slice(0, 15)
      if (norm.length >= 4) {
        if (!map.has(norm)) map.set(norm, [])
        map.get(norm)?.push(item)
      }
    }
    const duplicates: { name: string; items: BotCatalogProduct[] }[] = []
    map.forEach((items) => {
      // Check if items come from at least 2 distinct providers
      const distinctProv = new Set(items.map((i) => i.provider_key))
      if (distinctProv.size > 1) {
        duplicates.push({ name: items[0].name, items })
      }
    })
    return duplicates
  }, [catalogItems])

  // Filter items
  const filteredItems = catalogItems.filter((item) => {
    if (selectedBotFilter !== 'all' && item.provider_key !== selectedBotFilter)
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

  return (
    <div className="space-y-6 text-foreground text-right" dir="rtl">
      {/* Top Controls & Bot Filter Pills */}
      <div className="bg-card p-4 sm:p-5 rounded-surface border border-border/80 shadow-surface space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
          <div>
            <h4 className="text-sm sm:text-base font-black text-foreground flex items-center gap-2">
              <Bot className="w-4 h-4 text-brand" />
              کاوشگر کاتالوگ زنده ۵ ربات و مقایسه چندرباته (Multi-Bot Catalog
              Explorer)
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              مشاهده محصولات همه ربات‌ها، مقایسه قیمت دلاری و تومانی (با نرخ زنده
              SwapWallet) و افزودن مستقیم به فروشگاه (پیش‌نویس غیرفعال)
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setIsFetchModalOpen(true)}
              className="h-9 px-4 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-black shadow-control flex items-center gap-1.5 cursor-pointer duration-motion active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span>استخراج هوشمند و ماشین‌حساب</span>
            </button>

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

        {/* Bot Provider Filter Selector */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedBotFilter('all')}
              className={`px-3 py-1.5 rounded-control text-xs font-bold transition-all whitespace-nowrap cursor-pointer duration-motion active:scale-[0.98] ${
                selectedBotFilter === 'all'
                  ? 'bg-primary text-primary-foreground font-black shadow-control'
                  : 'bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/60'
              }`}
            >
              همه ربات‌ها (مقایسه چندگانه)
            </button>

            {providers.map((p) => {
              const isSelected = selectedBotFilter === p.key
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setSelectedBotFilter(p.key)}
                  className={`px-3 py-1.5 rounded-control text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 duration-motion active:scale-[0.98] ${
                    isSelected
                      ? 'bg-primary text-primary-foreground font-black shadow-control'
                      : 'bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/60'
                  }`}
                >
                  <span>{p.name_fa}</span>
                  <span className="font-mono font-latin text-[10px] opacity-75">
                    (${p.balance_usd?.toFixed(1) || '0'})
                  </span>
                </button>
              )
            })}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/20 px-2.5 py-1.5 rounded-control border border-border/60">
              <ToggleSwitch
                checked={inStockOnly}
                onChange={setInStockOnly}
                size="sm"
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
          </div>
        </div>
      </div>

      {/* Multi-Bot Comparative Insights Banner (if duplicate services found) */}
      {selectedBotFilter === 'all' && multiBotDuplicates.length > 0 && (
        <div className="bg-brand/5 border border-brand/30 rounded-surface p-4 shadow-surface space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-brand flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              محصولات مشترک بین چند ربات (مقایسه بهترین قیمت خرید):
            </span>
            <span className="text-[11px] text-muted-foreground">
              {multiBotDuplicates.length} محصول مشترک شناسایی شد
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {multiBotDuplicates.slice(0, 6).map((group) => {
              // Sort by price ascending
              const sorted = [...group.items].sort(
                (a, b) => (a.price_usd || 0) - (b.price_usd || 0),
              )
              const cheapest = sorted[0]
              return (
                <div
                  key={`dup-${group.name}`}
                  className="p-2.5 rounded-control bg-card border border-border/60 space-y-1.5 text-xs"
                >
                  <div className="font-bold text-foreground truncate">
                    {group.name}
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground">
                      ارزان‌ترین قیمت:
                    </span>
                    <span className="font-mono font-latin font-bold text-emerald-400">
                      ${cheapest.price_usd?.toFixed(2)} (
                      {cheapest.provider_name_fa})
                    </span>
                  </div>
                  <div className="flex items-center gap-1 flex-wrap text-[10px] text-muted-foreground">
                    {sorted.map((item) => (
                      <span
                        key={`${item.provider_key}-${item.id}`}
                        className={`px-1.5 py-0.2 rounded-control border ${getProviderBadgeColor(item.provider_key)}`}
                      >
                        {item.provider_name_fa}: ${item.price_usd?.toFixed(2)}
                      </span>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Catalog Table */}
      {loading ? (
        <div className="p-12 text-center text-muted-foreground bg-card rounded-surface border border-border/60 space-y-3">
          <RefreshCw className="w-6 h-6 animate-spin text-brand mx-auto" />
          <p className="text-xs font-bold">
            در حال دریافت کاتالوگ زنده از ربات‌ها...
          </p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="p-10 text-center text-muted-foreground bg-card rounded-surface border border-border/60 space-y-2">
          <AlertCircle className="w-6 h-6 text-amber-500 mx-auto" />
          <p className="text-xs font-bold text-foreground">
            محصولی در کاتالوگ ربات‌ها یافت نشد.
          </p>
          <p className="text-[11px] text-muted-foreground">
            بررسی فرمایید کلیدهای API ربات‌ها در تب «کلیدهای API ۵ ربات» ذخیره
            شده باشند.
          </p>
        </div>
      ) : (
        <div className="bg-card rounded-surface border border-border/80 shadow-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-border/60 bg-muted/30 text-muted-foreground font-bold">
                  <th className="py-3 px-4 text-center">ربات مبدا</th>
                  <th className="py-3 px-4">عنوان و شناسه محصول</th>
                  <th className="py-3 px-4 text-center">خرید دلاری</th>
                  <th className="py-3 px-4 text-center">خرید تومانی (پایه)</th>
                  <th className="py-3 px-4 text-center">
                    فروش تومانی پیشنهادی
                  </th>
                  <th className="py-3 px-4 text-center">موجودی ربات</th>
                  <th className="py-3 px-4 text-center">وضعیت در آناهیکس</th>
                  <th className="py-3 px-4 text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredItems.map((prod) => {
                  const isAvailable =
                    prod.in_stock || prod.stock > 0 || prod.unlimited
                  const costToman = Math.round(
                    (prod.price_usd || 0) * liveUSDTRate,
                  )
                  const suggestedSellToman =
                    Math.ceil(
                      ((prod.price_usd || 0) * 1.25 * liveUSDTRate) / 500,
                    ) * 500

                  return (
                    <tr
                      key={`${prod.provider_key}-${prod.id}`}
                      className="hover:bg-muted/20 transition-colors"
                    >
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-control text-[10px] font-bold border ${getProviderBadgeColor(prod.provider_key)}`}
                        >
                          {prod.provider_name_fa}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-foreground flex items-center gap-1.5">
                          {prod.emoji && <span>{prod.emoji}</span>}
                          <span>{prod.name}</span>
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono font-latin mt-0.5">
                          شناسه ربات: #{prod.id}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono font-latin font-bold text-brand">
                        ${prod.price_usd?.toFixed(2) || '0.00'}
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono font-latin font-bold text-foreground">
                        {costToman.toLocaleString('fa-IR')} ت
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono font-latin font-bold text-emerald-400">
                        {suggestedSellToman.toLocaleString('fa-IR')} ت
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-control text-[11px] font-bold ${
                            isAvailable
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                          }`}
                        >
                          {prod.unlimited
                            ? 'نامحدود (∞)'
                            : isAvailable
                              ? `${prod.stock} عدد`
                              : 'ناموجود'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {prod.is_linked ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-control text-[11px] font-bold bg-primary/10 text-primary border border-primary/20">
                            <Link2 className="w-3 h-3" />
                            <span>موجود در سایت</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-control text-[11px] text-muted-foreground bg-muted/40">
                            جدید
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => setIsFetchModalOpen(true)}
                          className="h-8 px-3 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs shadow-control flex items-center justify-center gap-1.5 cursor-pointer duration-motion active:scale-[0.98] transition-all mx-auto"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>اد کردن (پیش‌نویس)</span>
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Fetch & Pricing Calculator Modal */}
      <FetchBotModal
        isOpen={isFetchModalOpen}
        onClose={() => setIsFetchModalOpen(false)}
        onProductImported={(prod) => {
          loadData(true)
          if (onProductImported) onProductImported(prod)
        }}
      />
    </div>
  )
}
