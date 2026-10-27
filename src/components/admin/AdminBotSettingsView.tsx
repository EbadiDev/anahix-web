import {
  Bot,
  Check,
  Clock,
  ExternalLink,
  Eye,
  EyeOff,
  HelpCircle,
  Key,
  Loader2,
  RefreshCw,
  Tag,
  Zap,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useState } from 'react'
import { apiService } from '../../services/api'
import type {
  BotProviderSetting,
  InstantDeliverySettings,
  ProductGroup,
  ProviderCatalogItem,
} from '../../types'
import { useNotification } from '../vibefarsi/NotificationContext'
import { SearchInput } from '../vibefarsi/SearchInput'
import { ToggleSwitch } from '../vibefarsi/ToggleSwitch'

const BOT_DOCS_GUIDE: Record<
  string,
  {
    botHandle: string
    keyPrefix: string
    defaultUrl: string
    helpText: string
    docsUrl: string
  }
> = {
  insightx: {
    botHandle: '@insightXpro_bot',
    keyPrefix: 'یک رشته متنی هش (مثال: ix_live_...)',
    defaultUrl: 'https://api.insightxpro.store',
    helpText:
      'در ربات تلگرام @insightXpro_bot دستور /api را ارسال کرده و کلید تولید شده را وارد نمایید. موجودی به تتر است.',
    docsUrl: 'https://api.insightxpro.store/docs',
  },
  stackvault: {
    botHandle: '@stackvault_bot',
    keyPrefix: 'با پیشوند svr_ شروع می‌شود (مثال: svr_...)',
    defaultUrl: 'https://decohomz.com/reseller-api/v1',
    helpText:
      'در بات تلگرام @stackvault_bot وارد بخش Reseller API شوید و توکن را کپی کنید. مجهز به پرمیوم و استارز تلگرام.',
    docsUrl: 'https://stackvault.shop/docs',
  },
  paglu: {
    botHandle: '@Paglu_Shopp_Bot',
    keyPrefix: 'با پیشوند LootPaglu_ شروع می‌شود (مثال: LootPaglu_...)',
    defaultUrl: 'https://lootpaglu.in',
    helpText:
      'کلید اختصاصی ریسلر را از پنل lootpaglu.in یا بات @Paglu_Shopp_Bot دریافت فرمایید (ارز کریپتو تتر).',
    docsUrl: 'https://lootpaglu.in',
  },
  jero: {
    botHandle: '@JeroAccountsBot',
    keyPrefix: 'کلید Bearer اختصاصی ریسلر',
    defaultUrl: 'https://api.jeroaccounts.com/api/reseller',
    helpText:
      'از بات تلگرام @JeroAccountsBot درخواست دسترسی Reseller فرمایید. مجهز به نصب خودکار المنتور/رنک‌مث و دانلود UI8.',
    docsUrl: 'https://api.jeroaccounts.com/api/reseller',
  },
  supreme: {
    botHandle: '@SupremeLeaderShopBot',
    keyPrefix: 'با پیشوند hash: شروع می‌شود (مثال: hash:d2c480e8...)',
    defaultUrl: 'https://telegram-shop-bot-production-48fa.up.railway.app',
    helpText:
      'در بات تلگرام @SupremeLeaderShopBot روی گزینه YOUR API KEY بزنید و کلید را کپی کنید.',
    docsUrl: 'https://telegram-shop-bot-production-48fa.up.railway.app',
  },
}

const DEFAULT_FALLBACK_BOTS: BotProviderSetting[] = [
  {
    key: 'insightx',
    name_fa: 'اینسایت استور (InsightX)',
    enabled: true,
    has_api_key: false,
    api_key_masked: '',
    base_url: 'https://api.insightxpro.store',
    margin_percent: 25,
    balance_usd: 0,
    balance_toman: 0,
    status_message: 'نیاز به کلید',
    is_connected: false,
  },
  {
    key: 'stackvault',
    name_fa: 'استک‌ولت (StackVault)',
    enabled: true,
    has_api_key: false,
    api_key_masked: '',
    base_url: 'https://decohomz.com/reseller-api/v1',
    margin_percent: 25,
    balance_usd: 0,
    balance_toman: 0,
    status_message: 'نیاز به کلید',
    is_connected: false,
  },
  {
    key: 'paglu',
    name_fa: 'لوت پاگلو (Loot Paglu)',
    enabled: true,
    has_api_key: false,
    api_key_masked: '',
    base_url: 'https://lootpaglu.in',
    margin_percent: 25,
    balance_usd: 0,
    balance_toman: 0,
    status_message: 'نیاز به کلید',
    is_connected: false,
  },
  {
    key: 'jero',
    name_fa: 'جرو اکانتس (Jero Accounts)',
    enabled: true,
    has_api_key: false,
    api_key_masked: '',
    base_url: 'https://api.jeroaccounts.com/api/reseller',
    margin_percent: 25,
    balance_usd: 0,
    balance_toman: 0,
    status_message: 'نیاز به کلید',
    is_connected: false,
  },
  {
    key: 'supreme',
    name_fa: 'سوپریم لیدر (Supreme Leader)',
    enabled: true,
    has_api_key: false,
    api_key_masked: '',
    base_url: 'https://telegram-shop-bot-production-48fa.up.railway.app',
    margin_percent: 25,
    balance_usd: 0,
    balance_toman: 0,
    status_message: 'نیاز به کلید',
    is_connected: false,
  },
]

export const AdminBotSettingsView: React.FC = () => {
  const { success: notifySuccess, error: notifyError } = useNotification()

  const [botProviders, setBotProviders] = useState<BotProviderSetting[]>([])
  const [_deliverySettings, setDeliverySettings] =
    useState<InstantDeliverySettings | null>(null)
  const [loadingBots, setLoadingBots] = useState(false)
  const [productGroups, setProductGroups] = useState<ProductGroup[]>([])
  const [_loadingGroups, setLoadingGroups] = useState(false)
  const [providerCatalog, setProviderCatalog] = useState<ProviderCatalogItem[]>(
    [],
  )
  const [groupSearch, setGroupSearch] = useState('')
  const [groupUpdateLoading, setGroupUpdateLoading] = useState<
    Record<string, boolean>
  >({})
  const [linkingLoading, setLinkingLoading] = useState<Record<string, boolean>>(
    {},
  )

  // Form states per bot
  const [formData, setFormData] = useState<
    Record<
      string,
      {
        api_key: string
        base_url: string
        margin_percent: number
        enabled: boolean
        show_key: boolean
        saving: boolean
      }
    >
  >({})

  const loadData = async () => {
    setLoadingBots(true)
    setLoadingGroups(true)
    try {
      const [botList, dSettings, groups, catalog] = await Promise.all([
        apiService.getBotProviderSettings().catch(() => []),
        apiService.getInstantDeliverySettings().catch(() => null),
        apiService.getProductGroups().catch(() => []),
        apiService.getProviderCatalog().catch(() => []),
      ])
      const activeBots = botList.length > 0 ? botList : DEFAULT_FALLBACK_BOTS
      setBotProviders(activeBots)
      setDeliverySettings(dSettings)
      setProductGroups(groups)
      setProviderCatalog(catalog)

      // Initialize form state
      const initialForm: Record<string, any> = {}
      for (const bot of activeBots) {
        initialForm[bot.key] = {
          api_key: '',
          base_url: bot.base_url || '',
          margin_percent: bot.margin_percent || 25,
          enabled: bot.enabled,
          show_key: false,
          saving: false,
        }
      }
      setFormData(initialForm)
    } finally {
      setLoadingBots(false)
      setLoadingGroups(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleFieldChange = (botKey: string, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [botKey]: {
        ...prev[botKey],
        [field]: value,
      },
    }))
  }

  const handleSaveBot = async (botKey: string) => {
    const data = formData[botKey]
    if (!data) return

    handleFieldChange(botKey, 'saving', true)
    try {
      const payload: any = {
        key: botKey,
        enabled: data.enabled,
        base_url: data.base_url.trim(),
        margin_percent: Number(data.margin_percent),
      }
      if (data.api_key.trim()) {
        payload.api_key = data.api_key.trim()
      }

      await apiService.updateBotProviderSettings(payload)
      notifySuccess(
        'تنظیمات ذخیره شد',
        `تنظیمات ربات @${botKey} با موفقیت ثبت گردید.`,
      )
      loadData()
    } catch (err: any) {
      notifyError('خطا در ذخیره تنظیمات', err.message)
    } finally {
      handleFieldChange(botKey, 'saving', false)
    }
  }

  const handleToggleGroupStrategy = async (
    groupTag: string,
    newStrategy: 'manual_operator' | 'third_party_instant',
  ) => {
    setGroupUpdateLoading((prev) => ({ ...prev, [groupTag]: true }))
    try {
      await apiService.updateGroupDeliveryStrategy(groupTag, newStrategy)
      setProductGroups((prev) =>
        prev.map((g) =>
          g.group_tag === groupTag
            ? {
                ...g,
                delivery_strategy: newStrategy,
                products: g.products.map((p) => ({
                  ...p,
                  delivery_strategy: newStrategy,
                })),
              }
            : g,
        ),
      )
      notifySuccess(
        'استراتژی گروه به‌روزرسانی شد',
        `استراتژی تحویل گروه «${groupTag}» تغییر یافت.`,
      )
    } catch (err: any) {
      notifyError('خطا در تغییر استراتژی', err.message)
    } finally {
      setGroupUpdateLoading((prev) => ({ ...prev, [groupTag]: false }))
    }
  }

  const handleLinkProduct = async (
    productId: string,
    externalProductId: number,
    strategy?: string,
  ) => {
    setLinkingLoading((prev) => ({ ...prev, [productId]: true }))
    try {
      await apiService.linkProductProvider(
        productId,
        externalProductId,
        strategy,
      )
      loadData()
      notifySuccess(
        'اتصال لایسنس انجام شد',
        'محصول به مخزن لایسنس‌های آنی متصل گردید.',
      )
    } catch (err: any) {
      notifyError('خطا در اتصال محصول', err.message)
    } finally {
      setLinkingLoading((prev) => ({ ...prev, [productId]: false }))
    }
  }

  const filteredGroups = productGroups.filter((g) => {
    if (!groupSearch.trim()) return true
    const q = groupSearch.toLowerCase().trim()
    return (
      (g.group_title_fa || '').toLowerCase().includes(q) ||
      (g.group_tag || '').toLowerCase().includes(q) ||
      g.products.some((p) => (p.title_fa || '').toLowerCase().includes(q))
    )
  })

  return (
    <div className="space-y-6 text-foreground text-right" dir="rtl">
      {/* Top Banner */}
      <div className="bg-card p-5 rounded-surface border border-border/80 shadow-surface flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h4 className="text-sm sm:text-base font-black text-foreground flex items-center gap-2">
            <Key className="w-4 h-4 text-brand" />
            پیکربندی کلیدهای API و اتصال ۵ ربات تامین‌کننده (Fulfillment
            Settings)
          </h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            ثبت و ذخیره کلیدهای API، آدرس سرورها و درصد مارجین سود جهت استعلام
            کاتالوگ و تحویل خودکار
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          disabled={loadingBots}
          className="h-9 px-4 rounded-control border border-border/60 bg-secondary text-secondary-foreground text-xs font-bold hover:bg-muted flex items-center gap-1.5 cursor-pointer shadow-control self-end sm:self-auto"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${loadingBots ? 'animate-spin text-brand' : ''}`}
          />
          <span>استعلام زنده مانده حساب‌ها</span>
        </button>
      </div>

      {/* 5 Bot Configuration Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {botProviders.map((bot) => {
          const form = formData[bot.key] || {
            api_key: '',
            base_url: bot.base_url || '',
            margin_percent: bot.margin_percent || 25,
            enabled: bot.enabled,
            show_key: false,
            saving: false,
          }

          return (
            <div
              key={bot.key}
              className="bg-card rounded-surface border border-border/80 shadow-surface p-5 space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3.5">
                {/* Card Header */}
                <div className="flex items-start justify-between border-b border-border/60 pb-3">
                  <div>
                    <h5 className="font-black text-sm text-foreground flex items-center gap-2">
                      <Bot className="w-4 h-4 text-brand" />
                      <span>{bot.name_fa}</span>
                    </h5>
                    <span className="font-mono font-latin text-[11px] text-muted-foreground">
                      @{bot.key}
                    </span>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-control ${
                      bot.is_connected
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : bot.has_api_key
                          ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                          : 'bg-muted text-muted-foreground border border-border/60'
                    }`}
                  >
                    {bot.is_connected
                      ? '🟢 متصل و فعال'
                      : bot.has_api_key
                        ? '🟡 نیاز به بررسی'
                        : '⚪ بدون کلید'}
                  </span>
                </div>

                {/* Balance Display */}
                <div className="p-3 rounded-control bg-muted/20 border border-border/60 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[11px] text-muted-foreground block">
                      مانده کیف پول:
                    </span>
                    <span className="font-mono font-latin font-bold text-sm text-foreground">
                      ${bot.balance_usd?.toFixed(2) || '0.00'} USD
                    </span>
                  </div>
                  <div className="text-left font-latin text-xs text-muted-foreground">
                    معادل: {(bot.balance_toman || 0).toLocaleString('fa-IR')} ت
                  </div>
                </div>

                {/* Documentation Guidance Box */}
                {BOT_DOCS_GUIDE[bot.key] && (
                  <div className="p-3 rounded-control bg-brand/5 border border-brand/20 space-y-1.5 text-xs text-right">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-brand flex items-center gap-1 text-[11px]">
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>
                          راهنمای اتصال {BOT_DOCS_GUIDE[bot.key].botHandle}:
                        </span>
                      </span>
                      <a
                        href={BOT_DOCS_GUIDE[bot.key].docsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-muted-foreground hover:text-brand flex items-center gap-1 font-mono font-latin"
                      >
                        <span>مستندات</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {BOT_DOCS_GUIDE[bot.key].helpText}
                    </p>
                    <div className="text-[10px] text-muted-foreground font-mono font-latin">
                      فرمت کلید: {BOT_DOCS_GUIDE[bot.key].keyPrefix}
                    </div>
                  </div>
                )}

                {/* API Key Input */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground block">
                    کلید اختصاصی API:
                  </label>
                  <div className="relative">
                    <input
                      type={form.show_key ? 'text' : 'password'}
                      value={form.api_key}
                      onChange={(e) =>
                        handleFieldChange(bot.key, 'api_key', e.target.value)
                      }
                      placeholder={
                        bot.has_api_key
                          ? `فعال: ${bot.api_key_masked}`
                          : 'کلید API را پیست نمایید'
                      }
                      className="w-full h-9 pr-3 pl-9 text-xs rounded-field border border-border/60 bg-muted/20 text-foreground font-mono font-latin outline-none focus:border-brand"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        handleFieldChange(bot.key, 'show_key', !form.show_key)
                      }
                      className="absolute left-2.5 top-2 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      {form.show_key ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Base URL Input */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground block">
                    آدرس سرور API:
                  </label>
                  <input
                    type="text"
                    value={form.base_url}
                    onChange={(e) =>
                      handleFieldChange(bot.key, 'base_url', e.target.value)
                    }
                    placeholder="https://..."
                    className="w-full h-9 px-3 text-xs rounded-field border border-border/60 bg-muted/20 text-foreground font-mono font-latin outline-none focus:border-brand"
                  />
                </div>

                {/* Margin % and Enabled Toggle */}
                <div className="flex items-center justify-between gap-3 pt-1">
                  <div className="space-y-1 flex-1">
                    <label className="text-[11px] font-bold text-muted-foreground block">
                      مارجین سود (%):
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={form.margin_percent}
                      onChange={(e) =>
                        handleFieldChange(
                          bot.key,
                          'margin_percent',
                          Number(e.target.value),
                        )
                      }
                      className="w-full h-9 px-3 text-xs rounded-field border border-border/60 bg-muted/20 text-foreground font-mono font-latin outline-none focus:border-brand"
                    />
                  </div>

                  <div className="space-y-1 flex flex-col items-center">
                    <label className="text-[11px] font-bold text-muted-foreground block">
                      فعال‌سازی:
                    </label>
                    <ToggleSwitch
                      checked={form.enabled}
                      onChange={(val) =>
                        handleFieldChange(bot.key, 'enabled', val)
                      }
                      size="sm"
                    />
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-3 border-t border-border/60">
                <button
                  type="button"
                  disabled={form.saving}
                  onClick={() => handleSaveBot(bot.key)}
                  className="w-full h-9 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs shadow-control flex items-center justify-center gap-1.5 cursor-pointer duration-motion active:scale-[0.98] disabled:opacity-50"
                >
                  {form.saving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>در حال ذخیره...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>ذخیره و تست اتصال</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Group Delivery Strategy Router Matrix */}
      <div className="bg-card rounded-surface border border-border/80 p-5 shadow-surface space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
          <div>
            <h4 className="text-sm font-black text-foreground flex items-center gap-2">
              <Tag className="w-4 h-4 text-brand" />
              ماتریس استراتژی تحویل گروه‌ها و اتصال به مخزن لایسنس‌ها (Group
              Routing Engine)
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              تعیین استراتژی تحویل (آنی خودکار یا دستی اپراتور) در سطح گروه و
              اتصال کالا به لایسنس
            </p>
          </div>

          <div className="w-56">
            <SearchInput
              value={groupSearch}
              onChange={setGroupSearch}
              placeholder="جستجوی گروه یا کالا..."
              debounceMs={250}
            />
          </div>
        </div>

        <div className="space-y-4">
          {filteredGroups.map((group) => {
            const isGroupInstant =
              group.delivery_strategy === 'third_party_instant'
            return (
              <div
                key={group.group_tag}
                className="rounded-surface border border-border/80 overflow-hidden bg-card shadow-xs"
              >
                <div className="p-4 bg-muted/20 border-b border-border/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-control bg-secondary text-brand border border-border/60 flex items-center justify-center font-bold">
                      <Tag className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm text-foreground">
                          {group.group_title_fa}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-control bg-secondary text-secondary-foreground font-mono font-latin">
                          #{group.group_tag}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          ({group.products_count} محصول)
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center bg-muted/40 border border-border/60 p-1 rounded-control gap-1">
                    <button
                      type="button"
                      disabled={groupUpdateLoading[group.group_tag]}
                      onClick={() =>
                        handleToggleGroupStrategy(
                          group.group_tag,
                          'manual_operator',
                        )
                      }
                      className={`px-3 py-1.5 rounded-control text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        !isGroupInstant
                          ? 'bg-primary text-primary-foreground font-black shadow-control'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      <span>تحویل دستی اپراتور</span>
                    </button>

                    <button
                      type="button"
                      disabled={groupUpdateLoading[group.group_tag]}
                      onClick={() =>
                        handleToggleGroupStrategy(
                          group.group_tag,
                          'third_party_instant',
                        )
                      }
                      className={`px-3 py-1.5 rounded-control text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        isGroupInstant
                          ? 'bg-brand text-white font-black shadow-control'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>تحویل آنی خودکار</span>
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead>
                      <tr className="border-b border-border/60 bg-muted/10 text-muted-foreground font-bold">
                        <th className="py-2.5 px-4">عنوان محصول</th>
                        <th className="py-2.5 px-4">قیمت فروش</th>
                        <th className="py-2.5 px-4">روش تحویل فعلی</th>
                        <th className="py-2.5 px-4 min-w-[280px]">
                          اتصال به لایسنس‌های آنی
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {group.products.map((prod) => (
                        <tr key={prod.id} className="hover:bg-muted/20">
                          <td className="py-3 px-4 font-bold text-foreground">
                            {prod.title_fa}
                          </td>
                          <td className="py-3 px-4 font-mono font-latin font-bold">
                            {prod.price_toman.toLocaleString('fa-IR')} ت
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-control text-[11px] font-bold ${
                                prod.delivery_strategy === 'third_party_instant'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                              }`}
                            >
                              {prod.delivery_strategy ===
                              'third_party_instant' ? (
                                <>
                                  <Zap className="w-3 h-3" />
                                  <span>آنی خودکار</span>
                                </>
                              ) : (
                                <>
                                  <Clock className="w-3 h-3" />
                                  <span>دستی اپراتور</span>
                                </>
                              )}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="relative">
                              <select
                                disabled={linkingLoading[prod.id]}
                                value={prod.external_product_id || 0}
                                onChange={(e) =>
                                  handleLinkProduct(
                                    prod.id,
                                    Number(e.target.value),
                                    Number(e.target.value) > 0
                                      ? 'third_party_instant'
                                      : 'manual_operator',
                                  )
                                }
                                className="w-full text-xs py-1.5 px-3 rounded-control border border-border/60 bg-card text-foreground font-mono font-latin outline-none focus:border-brand cursor-pointer"
                              >
                                <option value={0}>
                                  -- بدون اتصال (تحویل دستی در صف اپراتور) --
                                </option>
                                {providerCatalog.map((ix) => (
                                  <option key={ix.id} value={ix.id}>
                                    [#{ix.id}] {ix.name} ($
                                    {ix.price_usdt.toFixed(2)} USDT ~{' '}
                                    {ix.price_toman.toLocaleString('fa-IR')} ت){' '}
                                    {ix.stock > 0
                                      ? `[موجودی: ${ix.stock}]`
                                      : '[ناموجود]'}
                                  </option>
                                ))}
                              </select>
                              {linkingLoading[prod.id] && (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin text-brand absolute left-3 top-2" />
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
