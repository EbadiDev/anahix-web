import {
  Bot,
  Check,
  ExternalLink,
  Eye,
  EyeOff,
  HelpCircle,
  Key,
  Loader2,
  Plus,
  RefreshCw,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { apiService } from '../../services/api'
import type { BotProviderSetting, InstantDeliverySettings } from '../../types'
import { formatToman } from '../../utils/formatters'
import { ModalCloseButton } from '../vibefarsi/ModalCloseButton'
import { useNotification } from '../vibefarsi/NotificationContext'
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
    keyPrefix: 'یک رشته متنی هش (مثال: isk_live_...)',
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
    name_fa: 'InsightX Store',
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
    name_fa: 'StackVault Digital',
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
    name_fa: 'Loot Paglu',
    enabled: false,
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
    name_fa: 'Jero Accounts',
    enabled: false,
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
    name_fa: 'Supreme Leader Shop',
    enabled: false,
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
  const [testingKey, setTestingKey] = useState<Record<string, boolean>>({})

  // Add Custom Bot Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [newBotKey, setNewBotKey] = useState('')
  const [newBotName, setNewBotName] = useState('')
  const [newBotBaseURL, setNewBotBaseURL] = useState('')
  const [newBotAPIKey, setNewBotAPIKey] = useState('')
  const [addingBot, setAddingBot] = useState(false)

  // Form states per bot
  const [formData, setFormData] = useState<
    Record<
      string,
      {
        api_key: string
        base_url: string
        enabled: boolean
        show_key: boolean
        saving: boolean
      }
    >
  >({})

  const loadData = async () => {
    setLoadingBots(true)
    try {
      const [botList, dSettings] = await Promise.all([
        apiService.getBotProviderSettings().catch(() => []),
        apiService.getInstantDeliverySettings().catch(() => null),
      ])
      const activeBots = botList.length > 0 ? botList : DEFAULT_FALLBACK_BOTS
      setBotProviders(activeBots)
      setDeliverySettings(dSettings)

      // Initialize form state
      const initialForm: Record<string, any> = {}
      for (const bot of activeBots) {
        initialForm[bot.key] = {
          api_key: '',
          base_url: bot.base_url || '',
          enabled: bot.enabled,
          show_key: false,
          saving: false,
        }
      }
      setFormData(initialForm)
    } finally {
      setLoadingBots(false)
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

  // Save Settings for a bot
  const handleSaveBot = async (botKey: string) => {
    const data = formData[botKey]
    if (!data) return

    handleFieldChange(botKey, 'saving', true)
    try {
      const payload: any = {
        key: botKey,
        enabled: data.enabled,
        base_url: data.base_url.trim(),
      }
      if (data.api_key.trim()) {
        payload.api_key = data.api_key.trim()
      }

      await apiService.updateBotProviderSettings(payload)
      notifySuccess(
        'تنظیمات ذخیره شد',
        `تنظیمات ربات @${botKey} با موفقیت در پایگاه داده ذخیره گردید.`,
      )
      loadData()
    } catch (err: any) {
      notifyError('خطا در ذخیره تنظیمات', err.message)
    } finally {
      handleFieldChange(botKey, 'saving', false)
    }
  }

  // Test Connection separately
  const handleTestBot = async (botKey: string) => {
    const data = formData[botKey]
    setTestingKey((prev) => ({ ...prev, [botKey]: true }))
    try {
      const res = await apiService.testBotProviderConnection({
        key: botKey,
        api_key: data?.api_key?.trim() ? data.api_key.trim() : undefined,
        base_url: data?.base_url?.trim() ? data.base_url.trim() : undefined,
      })
      if (res.is_connected) {
        notifySuccess('تست اتصال موفق', res.message)
        loadData()
      } else {
        notifyError('تست اتصال ناموفق', res.message)
      }
    } catch (err: any) {
      notifyError('خطا در تست اتصال', err.message || 'خطای غیرمنتظره شبکه')
    } finally {
      setTestingKey((prev) => ({ ...prev, [botKey]: false }))
    }
  }

  // Handle Add Custom Bot
  const handleAddCustomBot = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newBotKey.trim() || !newBotName.trim()) return

    setAddingBot(true)
    try {
      const cleanKey = newBotKey
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '')
      await apiService.updateBotProviderSettings({
        key: cleanKey,
        enabled: true,
        base_url: newBotBaseURL.trim(),
        api_key: newBotAPIKey.trim(),
      })
      notifySuccess(
        'ربات جدید اضافه شد',
        `پرووایدر ${newBotName} با موفقیت ثبت گردید.`,
      )
      setIsAddModalOpen(false)
      setNewBotKey('')
      setNewBotName('')
      setNewBotBaseURL('')
      setNewBotAPIKey('')
      loadData()
    } catch (err: any) {
      notifyError('خطا در افزودن ربات', err.message)
    } finally {
      setAddingBot(false)
    }
  }

  return (
    <div className="space-y-6 text-foreground text-right" dir="rtl">
      {/* Top Banner */}
      <div className="bg-card p-5 rounded-surface border border-border/80 shadow-surface flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h4 className="text-sm sm:text-base font-black text-foreground flex items-center gap-2">
            <Key className="w-4 h-4 text-brand" />
            مدیریت کلیدهای API ربات‌ها و تامین‌کنندگان (API Keys Desk)
          </h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            ثبت، ذخیره، تست اتصال و پایش اعتبار کیف پول ربات‌های تحویل آنی
          </p>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="h-9 px-3.5 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-black shadow-control flex items-center gap-1.5 cursor-pointer duration-motion active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>افزودن ربات جدید</span>
          </button>

          <button
            type="button"
            onClick={loadData}
            disabled={loadingBots}
            className="h-9 px-3.5 rounded-control border border-border/60 bg-secondary text-secondary-foreground text-xs font-bold hover:bg-muted flex items-center gap-1.5 cursor-pointer shadow-control"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${loadingBots ? 'animate-spin text-brand' : ''}`}
            />
            <span>استعلام زنده</span>
          </button>
        </div>
      </div>

      {/* Bot Configuration Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {botProviders.map((bot) => {
          const form = formData[bot.key] || {
            api_key: '',
            base_url: bot.base_url || '',
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
                    <h5 className="font-black text-sm text-foreground flex items-center gap-2 font-latin">
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
                  <div className="text-left font-sans text-xs text-muted-foreground">
                    معادل: {formatToman(bot.balance_toman || 0)} تومان
                  </div>
                </div>

                {/* Documentation Guidance Box */}
                {BOT_DOCS_GUIDE[bot.key] && (
                  <div className="p-3 rounded-control bg-brand/5 border border-brand/20 space-y-1.5 text-xs text-right">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-brand flex items-center gap-1 text-[11px]">
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>راهنمای دریافت کلید:</span>
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

                {/* Enabled Toggle Switch */}
                <div className="flex items-center justify-between p-2.5 rounded-control bg-muted/20 border border-border/40">
                  <span className="text-xs font-bold text-foreground">
                    وضعیت فعال‌سازی ربات:
                  </span>
                  <ToggleSwitch
                    checked={form.enabled}
                    onChange={(val) =>
                      handleFieldChange(bot.key, 'enabled', val)
                    }
                    size="sm"
                  />
                </div>
              </div>

              {/* Action Buttons: Separate Test Connection & Save */}
              <div className="pt-3 border-t border-border/60 flex items-center gap-2">
                <button
                  type="button"
                  disabled={testingKey[bot.key]}
                  onClick={() => handleTestBot(bot.key)}
                  className="flex-1 h-9 px-3 rounded-control border border-border/60 bg-secondary hover:bg-muted text-foreground font-bold text-xs shadow-xs flex items-center justify-center gap-1.5 cursor-pointer duration-motion active:scale-[0.98] disabled:opacity-50"
                  title="استعلام زنده مانده و تست اعتبار کلید وارد شده"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${testingKey[bot.key] ? 'animate-spin text-brand' : ''}`}
                  />
                  <span>
                    {testingKey[bot.key] ? 'در حال تست...' : 'تست اتصال'}
                  </span>
                </button>

                <button
                  type="button"
                  disabled={form.saving}
                  onClick={() => handleSaveBot(bot.key)}
                  className="flex-1 h-9 px-3 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs shadow-control flex items-center justify-center gap-1.5 cursor-pointer duration-motion active:scale-[0.98] disabled:opacity-50"
                >
                  {form.saving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>در حال ذخیره...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>ذخیره تنظیمات</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Add Custom Bot Modal */}
      {isAddModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-[250] w-screen h-screen min-h-screen flex items-center justify-center p-3 sm:p-5 overflow-y-auto bg-background/85 backdrop-blur-md animate-in fade-in duration-200">
            <div
              dir="rtl"
              className="relative w-full max-w-lg bg-card rounded-surface border border-border/80 shadow-surface overflow-hidden flex flex-col my-auto text-foreground animate-in zoom-in-95 duration-200"
            >
              <div className="p-4 sm:p-5 border-b border-border/60 flex items-center justify-between bg-muted/20">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-control bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    <Plus className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-foreground">
                      افزودن ربات یا تامین‌کننده جدید
                    </h4>
                    <p className="text-[11px] text-muted-foreground">
                      ثبت کلید اتصال و آدرس سرور جهت استفاده در تحویل خودکار
                    </p>
                  </div>
                </div>

                <ModalCloseButton onClick={() => setIsAddModalOpen(false)} />
              </div>

              <form
                onSubmit={handleAddCustomBot}
                className="p-4 sm:p-6 space-y-4 text-right text-xs"
              >
                <div className="space-y-1.5">
                  <label className="font-bold text-foreground block">
                    شناسه انگلیسی یکتا (Unique Key){' '}
                    <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newBotKey}
                    onChange={(e) => setNewBotKey(e.target.value)}
                    placeholder="مثال: my_bot یا telegram_reseller"
                    className="w-full h-10 px-3 rounded-field border border-border/60 bg-muted/20 text-foreground font-mono font-latin outline-none focus:border-brand"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-foreground block">
                    نام نمایشی ربات <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newBotName}
                    onChange={(e) => setNewBotName(e.target.value)}
                    placeholder="مثال: My Custom Bot"
                    className="w-full h-10 px-3 rounded-field border border-border/60 bg-muted/20 text-foreground outline-none focus:border-brand"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-foreground block">
                    آدرس سرور API (Base URL){' '}
                    <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newBotBaseURL}
                    onChange={(e) => setNewBotBaseURL(e.target.value)}
                    placeholder="https://api.example.com"
                    className="w-full h-10 px-3 rounded-field border border-border/60 bg-muted/20 text-foreground font-mono font-latin outline-none focus:border-brand"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-foreground block">
                    کلید اختصاصی API (API Key)
                  </label>
                  <input
                    type="text"
                    value={newBotAPIKey}
                    onChange={(e) => setNewBotAPIKey(e.target.value)}
                    placeholder="کلید API در صورت وجود"
                    className="w-full h-10 px-3 rounded-field border border-border/60 bg-muted/20 text-foreground font-mono font-latin outline-none focus:border-brand"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={addingBot}
                    className="w-full h-11 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs shadow-control flex items-center justify-center gap-2 cursor-pointer duration-motion active:scale-[0.98] disabled:opacity-50"
                  >
                    {addingBot ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>در حال ثبت...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>افزودن و فعال‌سازی ربات</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )}
    </div>
  )
}
