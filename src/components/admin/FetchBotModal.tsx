import {
  AlertCircle,
  Bot,
  Check,
  Coins,
  Cpu,
  Eye,
  EyeOff,
  HelpCircle,
  Key,
  Link2,
  Loader2,
  Plus,
  RefreshCw,
  Settings,
  Sparkles,
  Tag,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
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
import { RichContentEditor } from '../content/RichContentEditor'
import { LoadingState } from '../vibefarsi/LoadingState'
import { ModalCloseButton } from '../vibefarsi/ModalCloseButton'
import { useNotification } from '../vibefarsi/NotificationContext'
import { SearchInput } from '../vibefarsi/SearchInput'
import { ToggleSwitch } from '../vibefarsi/ToggleSwitch'

interface FetchBotModalProps {
  isOpen: boolean
  onClose: () => void
  onProductImported: (product: AdminProduct) => void
  initialProduct?: BotCatalogProduct | null
}

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
      'در ربات تلگرام @insightXpro_bot دستور /api را ارسال کرده و کلید تولید شده را وارد نمایید.',
    docsUrl: 'https://api.insightxpro.store/docs',
  },
  stackvault: {
    botHandle: '@stackvault_bot',
    keyPrefix: 'با پیشوند svr_ شروع می‌شود (مثال: svr_...)',
    defaultUrl: 'https://decohomz.com/reseller-api/v1',
    helpText:
      'در بات تلگرام @stackvault_bot وارد بخش Reseller API شوید و توکن را کپی کنید.',
    docsUrl: 'https://stackvault.shop/docs',
  },
  paglu: {
    botHandle: '@Paglu_Shopp_Bot',
    keyPrefix: 'با پیشوند LootPaglu_ شروع می‌شود (مثال: LootPaglu_...)',
    defaultUrl: 'https://lootpaglu.in',
    helpText:
      'کلید اختصاصی ریسلر را از پنل lootpaglu.in یا بات @Paglu_Shopp_Bot دریافت فرمایید.',
    docsUrl: 'https://lootpaglu.in',
  },
  jero: {
    botHandle: '@JeroAccountsBot',
    keyPrefix: 'کلید Bearer اختصاصی ریسلر',
    defaultUrl: 'https://api.jeroaccounts.com/api/reseller',
    helpText:
      'از بات تلگرام @JeroAccountsBot درخواست دسترسی Reseller فرمایید. مجهز به المنتور و رنک‌مث.',
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

export const FetchBotModal: React.FC<FetchBotModalProps> = ({
  isOpen,
  onClose,
  onProductImported,
  initialProduct,
}) => {
  const { success: notifySuccess, error: notifyError } = useNotification()

  // Providers list
  const [providers, setProviders] = useState<BotProviderSetting[]>([])
  const [_loadingProviders, setLoadingProviders] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<string>('insightx')

  // Catalog items
  const [catalogItems, setCatalogItems] = useState<BotCatalogProduct[]>([])
  const [loadingCatalog, setLoadingCatalog] = useState(false)
  const [catalogSearch, setCatalogSearch] = useState('')
  const [inStockOnly, setInStockOnly] = useState(false)

  // Live Exchange Rate
  const [liveUSDTRate, setLiveUSDTRate] = useState<number>(98500)
  const [loadingRate, setLoadingRate] = useState(false)

  // Selected item for Pricing Drawer / Form
  const [selectedBotProduct, setSelectedBotProduct] =
    useState<BotCatalogProduct | null>(null)
  const [isConfigureOpen, setIsConfigureOpen] = useState(false)

  // 5-way Pricing Calculator state
  const [costUSD, setCostUSD] = useState<number>(1.0)
  const [marginPercent, setMarginPercent] = useState<number>(25.0)
  const [sellUSD, setSellUSD] = useState<number>(1.25)
  const [costToman, setCostToman] = useState<number>(98500)
  const [sellToman, setSellToman] = useState<number>(123500)

  // Product Merchandising Form fields
  const [titleFA, setTitleFA] = useState('')
  const [titleEN, setTitleEN] = useState('')
  const [slug, setSlug] = useState('')
  const [category, setCategory] = useState('ai_chat')
  const [groupTag, setGroupTag] = useState('ai')
  const [groupTitleFA, setGroupTitleFA] = useState('هوش مصنوعی')
  const [imageURL, _setImageURL] = useState('')
  const [iconURL, _setIconURL] = useState('')
  const [description, setDescription] = useState('')
  const [deliveryStrategy, setDeliveryStrategy] = useState(
    'third_party_instant',
  )
  const [requiredInput, setRequiredInput] = useState('none')
  const [payloadType, setPayloadType] = useState('license_code')
  const [stockDisplayMode, setStockDisplayMode] = useState<
    'show_exact' | 'show_status_only' | 'hide'
  >('show_exact')

  // Pre-Purchase Notice fields
  const [prePurchaseNotice, setPrePurchaseNotice] = useState('')
  const [prePurchaseNoticeMode, setPrePurchaseNoticeMode] = useState<
    'none' | 'inline' | 'modal_confirm' | 'both'
  >('modal_confirm')
  const [prePurchaseSnoozeDays, _setPrePurchaseSnoozeDays] = useState(7)

  const [savingProduct, setSavingProduct] = useState(false)

  // Provider Settings Sub-Modal (API Key entry)
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)
  const [editingProviderKey, setEditingProviderKey] = useState('')
  const [providerKeyInput, setProviderKeyInput] = useState('')
  const [providerBaseURLInput, setProviderBaseURLInput] = useState('')
  const [providerMarginInput, setProviderMarginInput] = useState(25)
  const [providerEnabledToggle, setProviderEnabledToggle] = useState(true)
  const [showKeyPassword, setShowKeyPassword] = useState(false)
  const [savingSettings, setSavingSettings] = useState(false)

  // Load providers & exchange rate on open
  const loadInitialData = async () => {
    setLoadingProviders(true)
    setLoadingRate(true)
    try {
      const [provList, deliverySettings] = await Promise.all([
        apiService.getBotProviderSettings().catch(() => []),
        apiService.getInstantDeliverySettings().catch(() => null),
      ])
      const activeBots = provList.length > 0 ? provList : DEFAULT_FALLBACK_BOTS
      setProviders(activeBots)
      if (deliverySettings?.effective_usd_rate) {
        setLiveUSDTRate(deliverySettings.effective_usd_rate)
      }
      if (activeBots.length > 0 && !selectedProvider) {
        setSelectedProvider(activeBots[0].key)
      }
    } finally {
      setLoadingProviders(false)
      setLoadingRate(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadInitialData()
      if (initialProduct) {
        if (initialProduct.provider_key) {
          setSelectedProvider(initialProduct.provider_key)
        }
        handleSelectBotProduct(initialProduct)
      }
    }
  }, [isOpen, initialProduct])

  // Load catalog when selectedProvider changes
  const loadCatalog = async (forceRefresh = false) => {
    if (!selectedProvider) return
    setLoadingCatalog(true)
    try {
      const items = await apiService.getBotCatalog(
        selectedProvider,
        forceRefresh,
      )
      setCatalogItems(items)
    } catch (err: any) {
      notifyError(
        'خطا در دریافت کاتالوگ ربات',
        err.message || 'عدم اتصال به ربات',
      )
      setCatalogItems([])
    } finally {
      setLoadingCatalog(false)
    }
  }

  useEffect(() => {
    if (isOpen && selectedProvider) {
      loadCatalog()
    }
  }, [isOpen, selectedProvider])

  // Update calculator when costUSD, marginPercent, or liveUSDTRate changes
  const recalculateFromMargin = (
    cost: number,
    margin: number,
    rate: number,
  ) => {
    const sUSD = cost * (1.0 + margin / 100.0)
    const cToman = Math.round(cost * rate)
    const sToman = Math.ceil((sUSD * rate) / 500) * 500
    setCostUSD(cost)
    setMarginPercent(margin)
    setSellUSD(Number(sUSD.toFixed(2)))
    setCostToman(cToman)
    setSellToman(sToman)
  }

  const recalculateFromCostToman = (
    cToman: number,
    margin: number,
    rate: number,
  ) => {
    const cUSD = rate > 0 ? cToman / rate : 0
    const sUSD = cUSD * (1.0 + margin / 100.0)
    const sToman = Math.ceil((cToman * (1.0 + margin / 100.0)) / 500) * 500
    setCostToman(cToman)
    setCostUSD(Number(cUSD.toFixed(2)))
    setSellUSD(Number(sUSD.toFixed(2)))
    setSellToman(sToman)
  }

  const recalculateFromSellToman = (
    sToman: number,
    cost: number,
    rate: number,
  ) => {
    const sUSD = sToman / rate
    const margin = cost > 0 ? ((sUSD - cost) / cost) * 100.0 : 0
    const cToman = Math.round(cost * rate)
    setSellToman(sToman)
    setSellUSD(Number(sUSD.toFixed(2)))
    setMarginPercent(Number(margin.toFixed(1)))
    setCostToman(cToman)
  }

  // Handle clicking "انتخاب و محاسبه قیمت" on a bot product
  const handleSelectBotProduct = (botProd: BotCatalogProduct) => {
    setSelectedBotProduct(botProd)

    const rawCost = botProd.price_usd || 1.0
    const currentProv = providers.find((p) => p.key === selectedProvider)
    const defaultMargin = currentProv?.margin_percent || 25.0

    recalculateFromMargin(rawCost, defaultMargin, liveUSDTRate)

    // Sanitize title
    let cleanName = botProd.name
    cleanName = cleanName
      .replace(/@\w+/g, '')
      .replace(/\[.*?\]/g, '')
      .replace(/Telegram|Discord|Hotmail|Google|ChatGPT/gi, (m) => m)
      .trim()

    setTitleFA(cleanName)
    setTitleEN(cleanName)
    setSlug(
      cleanName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || `bot-${botProd.id}`,
    )
    setDescription(botProd.description || 'اشتراک قانونی با تحویل آنی')
    setRequiredInput(botProd.required_input || 'none')
    setPayloadType(botProd.delivered_payload_type || 'license_code')
    setDeliveryStrategy('third_party_instant')
    setStockDisplayMode('show_exact')

    // Pre-Purchase Notice default
    if (botProd.required_input === 'telegram_username') {
      setPrePurchaseNotice(
        `### نکات مهم فعال‌سازی تلگرام
- لطفاً در توضیحات سفارش، **آیدی عمومی تلگرام خود را بدون @** وارد نمایید.
- اکانت تلگرام شما نباید در حالت خصوصی کامل باشد تا ربات بتواند فعال‌سازی را انجام دهد.
- زمان تحویل بین ۱ الی ۳ دقیقه می‌باشد.`,
      )
    } else if (botProd.required_input === 'wordpress_admin') {
      setPrePurchaseNotice(
        `### راهنمای نصب خودکار پلاگین
- آدرس وب‌سایت وردپرسی و دسترسی موقت ادمین را در توضیحات سفارش وارد فرمایید.
- نباید کپچا یا احراز هویت دومرحله‌ای روی صفحه ورود ادمین فعال باشد.
- کلمه عبور به هیچ عنوان ذخیره نخواهد شد.`,
      )
    } else {
      setPrePurchaseNotice(
        `### نکات مهم و شرایط تحویل
- این سرویس دارای **ضمانت ۱۰۰٪ سلامت و عدم قطعی** در طول دوره اشتراک می‌باشد.
- کد فعال‌سازی یا لایسنس بلافاصله پس از پرداخت به شما نمایش داده می‌شود و از طریق پیامک نیز ارسال می‌گردد.
- در صورت هرگونه سوال، پشتیبانی ۲۴ ساعته پاسخگوی شماست.`,
      )
    }

    setIsConfigureOpen(true)
  }

  // Submit product import
  const handleSaveImport = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedBotProduct) return

    setSavingProduct(true)
    try {
      const payload = {
        provider_key: selectedProvider,
        external_product_id: selectedBotProduct.id,
        external_product_name: selectedBotProduct.name,
        title_fa: titleFA.trim(),
        title_en: titleEN.trim(),
        slug: slug.trim(),
        category,
        group_tag: groupTag,
        group_title_fa: groupTitleFA,
        price_toman: sellToman,
        base_cost_usd: costUSD,
        delivery_strategy: deliveryStrategy,
        required_customer_input: requiredInput,
        delivered_payload_type: payloadType,
        pre_purchase_notice: prePurchaseNotice,
        pre_purchase_notice_mode: prePurchaseNoticeMode,
        pre_purchase_snooze_days: prePurchaseSnoozeDays,
        stock_display_mode: stockDisplayMode,
        image_url: imageURL,
        icon_url: iconURL,
        description,
      }

      const imported = await apiService.importBotProduct(payload)
      notifySuccess(
        'محصول به عنوان پیش‌نویس ثبت شد',
        `محصول «${titleFA}» با موفقیت ذخیره شد (وضعیت: پیش‌نویس غیرفعال جهت تکمیل عکس و مشخصات).`,
      )
      onProductImported(imported)
      setIsConfigureOpen(false)
      loadCatalog(true)
    } catch (err: any) {
      notifyError('خطا در ثبت محصول', err.message || 'خطای غیرمنتظره')
    } finally {
      setSavingProduct(false)
    }
  }

  // Open provider settings editor
  const handleOpenProviderSettings = (prov: BotProviderSetting) => {
    setEditingProviderKey(prov.key)
    setProviderKeyInput('')
    setProviderBaseURLInput(prov.base_url || '')
    setProviderMarginInput(prov.margin_percent || 25)
    setProviderEnabledToggle(prov.enabled)
    setShowKeyPassword(false)
    setIsSettingsModalOpen(true)
  }

  const handleSaveProviderSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingSettings(true)
    try {
      const payload: any = {
        key: editingProviderKey,
        enabled: providerEnabledToggle,
        base_url: providerBaseURLInput.trim(),
        margin_percent: Number(providerMarginInput),
      }
      if (providerKeyInput.trim()) {
        payload.api_key = providerKeyInput.trim()
      }

      await apiService.updateBotProviderSettings(payload)
      notifySuccess(
        'تنظیمات ربات ذخیره شد',
        'تنظیمات اتصال با موفقیت ثبت گردید.',
      )
      setIsSettingsModalOpen(false)
      loadInitialData()
      if (selectedProvider === editingProviderKey) {
        loadCatalog(true)
      }
    } catch (err: any) {
      notifyError('خطا در ذخیره تنظیمات', err.message)
    } finally {
      setSavingSettings(false)
    }
  }

  if (!isOpen) return null

  // Filter catalog items
  const filteredCatalog = catalogItems.filter((item) => {
    if (inStockOnly && !item.in_stock && item.stock <= 0) return false
    if (!catalogSearch.trim()) return true
    const q = catalogSearch.toLowerCase()
    return (
      item.name.toLowerCase().includes(q) ||
      (item.description || '').toLowerCase().includes(q) ||
      item.id.toLowerCase().includes(q)
    )
  })

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 overflow-y-auto bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        dir="rtl"
        className="relative w-full max-w-6xl bg-card rounded-surface border border-border/80 shadow-surface overflow-hidden flex flex-col max-h-[92vh] my-auto text-foreground"
      >
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-border/60 flex items-center justify-between bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-control bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shadow-control">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-foreground">
                  استخراج هوشمند محصولات و اتصال به ربات‌های تامین‌کننده
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-control bg-brand/10 text-brand font-bold border border-brand/20">
                  ۵ ربات فعال
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                استعلام کاتالوگ زنده، محاسبه قیمت دوطرفه دلاری/تومانی با
                SwapWallet و ایمپورت مستقیم به فروشگاه
              </p>
            </div>
          </div>

          <ModalCloseButton onClick={onClose} />
        </div>

        {/* Live SwapWallet Exchange Rate Ticker */}
        <div className="px-4 sm:px-6 py-2.5 bg-brand/5 border-b border-border/60 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold text-foreground">
              نرخ زنده تبدیل تتر (SwapWallet Engine):
            </span>
            <span className="font-bold text-brand font-sans">
              {formatToman(liveUSDTRate)} تومان
            </span>
            <span className="text-[11px] text-muted-foreground">
              (مبنای قیمت‌گذاری و تسویه ریالی خودکار)
            </span>
          </div>

          <button
            type="button"
            onClick={() => loadInitialData()}
            disabled={loadingRate}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-bold cursor-pointer"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${loadingRate ? 'animate-spin text-brand' : ''}`}
            />
            <span>به‌روزرسانی نرخ</span>
          </button>
        </div>

        {/* Main Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
          {/* Step 1: Select Upstream Bot Provider Cards */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-foreground flex items-center gap-2">
                <Cpu className="w-4 h-4 text-brand" />
                <span>۱. انتخاب ربات تامین‌کننده مبدا جهت استخراج محصولات:</span>
              </label>
              <span className="text-[11px] text-muted-foreground">
                روی هر ربات کلیک کنید تا کاتالوگ و موجودی زنده آن بارگذاری شود
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {providers.map((prov) => {
                const isSelected = selectedProvider === prov.key
                return (
                  <div
                    key={prov.key}
                    onClick={() => setSelectedProvider(prov.key)}
                    className={`relative p-3.5 rounded-surface border transition-all cursor-pointer flex flex-col justify-between group active:scale-[0.98] ${
                      isSelected
                        ? 'bg-primary/5 border-primary shadow-control ring-1 ring-primary/30'
                        : 'bg-muted/20 border-border/60 hover:border-border hover:bg-muted/40'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-1 mb-2">
                        <span className="text-xs font-black text-foreground line-clamp-1">
                          {prov.name_fa}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleOpenProviderSettings(prov)
                          }}
                          className="p-1 rounded-control text-muted-foreground hover:text-foreground hover:bg-card transition-colors cursor-pointer"
                          title="تنظیمات کلید API این ربات"
                        >
                          <Settings className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="text-[11px] font-mono font-latin text-muted-foreground truncate mb-2">
                        @{prov.key}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-muted-foreground">موجودی:</span>
                          <span className="font-mono font-latin font-bold text-foreground">
                            ${prov.balance_usd?.toFixed(2) || '0.00'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground font-sans">
                          <span>معادل:</span>
                          <span className="font-sans font-bold">
                            {formatToman(prov.balance_toman || 0)} تومان
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-border/40 flex items-center justify-between">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-control ${
                          prov.is_connected
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : prov.has_api_key
                              ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                              : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {prov.is_connected
                          ? '🟢 متصل'
                          : prov.has_api_key
                            ? '🟡 بررسی کلید'
                            : '⚪ نیاز به کلید'}
                      </span>

                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-xs">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Step 2: Live Catalog Explorer & Search */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/20 p-3.5 rounded-surface border border-border/60">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-brand" />
                <h4 className="text-xs sm:text-sm font-bold text-foreground">
                  کاتالوگ زنده محصولات ربات ({catalogItems.length} آیتم دریافت
                  شد):
                </h4>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-card px-2.5 py-1.5 rounded-control border border-border/60">
                  <ToggleSwitch
                    checked={inStockOnly}
                    onChange={setInStockOnly}
                    size="sm"
                  />
                  <span>فقط محصولات موجود</span>
                </div>

                <div className="w-48 sm:w-56">
                  <SearchInput
                    value={catalogSearch}
                    onChange={setCatalogSearch}
                    placeholder="جستجو در نام محصول..."
                    debounceMs={250}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => loadCatalog(true)}
                  disabled={loadingCatalog}
                  className="h-9 px-3 rounded-control border border-border/60 bg-secondary text-secondary-foreground text-xs font-bold hover:bg-muted flex items-center gap-1.5 cursor-pointer shadow-control"
                  title="استعلام تازه کاتالوگ"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${loadingCatalog ? 'animate-spin text-brand' : ''}`}
                  />
                  <span className="hidden sm:inline">بروزرسانی</span>
                </button>
              </div>
            </div>

            {/* Catalog Table */}
            {loadingCatalog ? (
              <div className="bg-muted/10 rounded-surface border border-border/60">
                <LoadingState
                  message="در حال استعلام کاتالوگ و موجودی زنده از ربات..."
                  subMessage="دریافت لحظه‌ای قیمت‌های دلاری و ارزیابی تومانی"
                />
              </div>
            ) : filteredCatalog.length === 0 ? (
              <div className="p-10 text-center text-muted-foreground bg-muted/10 rounded-surface border border-border/60 space-y-2">
                <AlertCircle className="w-6 h-6 text-amber-500 mx-auto" />
                <p className="text-xs font-bold text-foreground">
                  محصولی با این مشخصات در ربات یافت نشد.
                </p>
                <p className="text-[11px] text-muted-foreground">
                  بررسی کنید کلید API ربات به درستی تنظیم شده باشد یا فیلتر
                  جستجو را پاک کنید.
                </p>
              </div>
            ) : (
              <div className="rounded-surface border border-border/80 overflow-hidden shadow-surface">
                <div className="overflow-x-auto">
                  <table className="w-full text-center text-xs">
                    <thead>
                      <tr className="border-b border-border/60 bg-muted/30 text-muted-foreground font-bold">
                        <th className="py-3 px-4 text-center w-20">شناسه</th>
                        <th className="py-3 px-4 text-center">
                          عنوان محصول تامین‌کننده
                        </th>
                        <th className="py-3 px-4 text-center">
                          قیمت پایه خرید و موجودی ربات
                        </th>
                        <th className="py-3 px-4 text-center">
                          وضعیت در فروشگاه
                        </th>
                        <th className="py-3 px-4 text-center">عملیات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {filteredCatalog.map((prod) => {
                        const isAvailable =
                          prod.in_stock || prod.stock > 0 || prod.unlimited
                        return (
                          <tr
                            key={prod.id}
                            className="hover:bg-muted/20 transition-colors"
                          >
                            <td className="py-3.5 px-4 text-center font-mono font-latin text-muted-foreground font-bold">
                              #{prod.id}
                            </td>

                            <td className="py-3.5 px-4 text-center">
                              <div className="font-bold text-foreground flex items-center justify-center gap-2 mx-auto">
                                {prod.emoji && <span>{prod.emoji}</span>}
                                <span>{prod.name}</span>
                              </div>
                              {prod.description && (
                                <p
                                  className="text-[11px] text-muted-foreground mt-1 max-w-md mx-auto line-clamp-2 leading-relaxed"
                                  dir="auto"
                                >
                                  {prod.description}
                                </p>
                              )}
                            </td>

                            {/* Unified Vertical Stacked Financial & Stock Column */}
                            <td className="py-3.5 px-4 text-center font-sans">
                              <div className="font-bold text-xs text-foreground font-sans">
                                {formatToman(
                                  Math.round(
                                    (prod.price_usd || 0) * liveUSDTRate,
                                  ),
                                )}{' '}
                                <span className="font-sans font-normal text-[10px] text-muted-foreground">
                                  تومان
                                </span>
                              </div>
                              <div className="font-mono text-[11px] font-bold text-brand mt-0.5">
                                ${prod.price_usd?.toFixed(2) || '0.00'} USD
                              </div>
                              <div className="mt-1 flex justify-center">
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-control text-[10px] font-bold ${
                                    isAvailable
                                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                      : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                                  }`}
                                >
                                  {prod.unlimited
                                    ? 'نامحدود (∞)'
                                    : isAvailable
                                      ? `${formatNumber(prod.stock)} عدد موجود`
                                      : 'ناموجود'}
                                </span>
                              </div>
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
                                onClick={() => handleSelectBotProduct(prod)}
                                className="h-8 px-3 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs transition-all shadow-control cursor-pointer duration-motion active:scale-[0.98] inline-flex items-center justify-center gap-1.5 mx-auto"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>محاسبه و اد کردن</span>
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
          </div>
        </div>
      </div>

      {/* Pricing & Merchandising Drawer Modal */}
      {isConfigureOpen && selectedBotProduct && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-5 overflow-y-auto bg-background/85 backdrop-blur-md animate-in fade-in duration-200">
          <div
            dir="rtl"
            className="relative w-full max-w-4xl bg-card rounded-surface border border-border/80 shadow-surface overflow-hidden flex flex-col max-h-[92vh] my-auto text-foreground"
          >
            <div className="p-4 sm:p-6 border-b border-border/60 flex items-center justify-between bg-muted/20">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-control bg-primary text-primary-foreground flex items-center justify-center font-bold shadow-control">
                  <Coins className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-black text-foreground">
                    ماشین‌حساب قیمت‌گذاری زنده و تنظیمات انتشار محصول
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    اتصال به ربات #{selectedBotProduct.id} (
                    {selectedBotProduct.name})
                  </p>
                </div>
              </div>

              <ModalCloseButton onClick={() => setIsConfigureOpen(false)} />
            </div>

            <form
              onSubmit={handleSaveImport}
              className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin"
            >
              {/* 5-way Two-way Reactive Pricing Calculator */}
              <div className="p-4 sm:p-5 rounded-surface border border-brand/30 bg-brand/5 space-y-4">
                <div className="flex items-center justify-between border-b border-brand/20 pb-2.5">
                  <span className="text-xs font-black text-brand flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    ماشین‌حساب هوشمند و دوطرفه قیمت‌گذاری (Dual-Priority Pricing
                    Engine)
                  </span>
                  <span className="text-[11px] font-sans font-bold text-muted-foreground">
                    نرخ تتر: {formatToman(liveUSDTRate)} تومان
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-right">
                  {/* 1. Cost USD */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-muted-foreground">
                      خرید دلاری ($):
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={costUSD}
                      onChange={(e) => {
                        const val = Number(e.target.value) || 0
                        recalculateFromMargin(val, marginPercent, liveUSDTRate)
                      }}
                      className="w-full h-10 px-3 text-xs rounded-field border border-border/60 bg-card text-foreground font-mono font-latin outline-none focus:border-brand"
                    />
                  </div>

                  {/* 2. Margin % */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-muted-foreground">
                      درصد سود (%):
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={marginPercent}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0
                        recalculateFromMargin(costUSD, val, liveUSDTRate)
                      }}
                      className="w-full h-10 px-3 text-xs rounded-field border border-border/60 bg-card text-foreground font-mono font-latin outline-none focus:border-brand"
                    />
                  </div>

                  {/* 3. Sell USD */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-muted-foreground">
                      فروش دلاری ($):
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={sellUSD}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0
                        const margin =
                          costUSD > 0 ? ((val - costUSD) / costUSD) * 100 : 0
                        setSellUSD(val)
                        setMarginPercent(parseFloat(margin.toFixed(2)))
                        setSellToman(
                          Math.ceil((val * liveUSDTRate) / 500) * 500,
                        )
                      }}
                      className="w-full h-10 px-3 text-xs rounded-field border border-border/60 bg-card text-foreground font-mono font-latin outline-none focus:border-brand"
                    />
                  </div>

                  {/* 4. Cost Toman */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-muted-foreground">
                      تمام‌شده تومانی:
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={costToman}
                      onChange={(e) => {
                        const val = Number(e.target.value) || 0
                        recalculateFromCostToman(
                          val,
                          marginPercent,
                          liveUSDTRate,
                        )
                      }}
                      className="w-full h-10 px-3 text-xs rounded-field border border-border/60 bg-card text-foreground font-mono font-latin outline-none focus:border-brand"
                    />
                  </div>

                  {/* 5. Sell Toman (Final Storefront Price) */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-brand">
                      قیمت فروش تومانی:
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={sellToman}
                      onChange={(e) => {
                        const val = Number(e.target.value) || 0
                        recalculateFromSellToman(val, costUSD, liveUSDTRate)
                      }}
                      className="w-full h-10 px-3 text-xs font-bold rounded-field border-2 border-brand bg-card text-foreground font-mono font-latin outline-none focus:ring-2 focus:ring-brand/30"
                    />
                  </div>
                </div>

                <div className="text-[11px] text-muted-foreground flex items-center justify-between pt-1">
                  <span>سود ناخالص هر فروش:</span>
                  <span className="font-sans font-bold text-emerald-400">
                    +{formatToman(sellToman - costToman)} تومان (
                    {toPersianDigits(marginPercent)}٪)
                  </span>
                </div>
              </div>

              {/* Basic Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-right">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-foreground">
                    عنوان فارسی محصول در فروشگاه{' '}
                    <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={titleFA}
                    onChange={(e) => setTitleFA(e.target.value)}
                    placeholder="مثال: اشتراک قانونی گوگل جمینای پرو ۱۸ ماهه"
                    className="w-full h-10 px-3.5 text-xs rounded-field border border-border/60 bg-muted/20 text-foreground outline-none focus:border-brand"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">
                    اسلاگ انگلیسی (URL Slug){' '}
                    <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="gemini-pro-18m"
                    className="w-full h-10 px-3.5 text-xs rounded-field border border-border/60 bg-muted/20 text-foreground font-mono font-latin outline-none focus:border-brand"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">
                    دسته‌بندی فروشگاه:
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full h-10 px-3.5 text-xs rounded-field border border-border/60 bg-card text-foreground outline-none focus:border-brand cursor-pointer"
                  >
                    <option value="ai_chat">
                      چت‌بات‌ها و مدل‌های زبانی (AI Chat)
                    </option>
                    <option value="ai_link">لینک‌های فعال‌سازی (AI Link)</option>
                    <option value="ai_account">
                      اکانت‌های آماده (AI Account)
                    </option>
                    <option value="personal_upgrade">
                      ارتقای اکانت شخصی (Personal Upgrade)
                    </option>
                    <option value="digital_code">
                      کد و لایسنس دیجیتال (Digital Code)
                    </option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">
                    تگ گروه محصول (Group Tag):
                  </label>
                  <input
                    type="text"
                    value={groupTag}
                    onChange={(e) => setGroupTag(e.target.value)}
                    placeholder="gemini, chatgpt, vpn, ..."
                    className="w-full h-10 px-3.5 text-xs rounded-field border border-border/60 bg-muted/20 text-foreground font-mono font-latin outline-none focus:border-brand"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">
                    عنوان گروه محصول:
                  </label>
                  <input
                    type="text"
                    value={groupTitleFA}
                    onChange={(e) => setGroupTitleFA(e.target.value)}
                    placeholder="گوگل جمینای"
                    className="w-full h-10 px-3.5 text-xs rounded-field border border-border/60 bg-muted/20 text-foreground outline-none focus:border-brand"
                  />
                </div>
              </div>

              {/* Delivery and Input Requirements */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-right pt-2 border-t border-border/60">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">
                    استراتژی تحویل:
                  </label>
                  <select
                    value={deliveryStrategy}
                    onChange={(e) => setDeliveryStrategy(e.target.value)}
                    className="w-full h-10 px-3 text-xs rounded-field border border-border/60 bg-card text-foreground outline-none focus:border-brand cursor-pointer"
                  >
                    <option value="third_party_instant">
                      ⚡ تحویل آنی خودکار از ربات (Instant)
                    </option>
                    <option value="manual_operator">
                      🔷 تحویل دستی در صف اپراتور (دستی اپراتور)
                    </option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">
                    اطلاعات مورد نیاز از خریدار:
                  </label>
                  <select
                    value={requiredInput}
                    onChange={(e) => setRequiredInput(e.target.value)}
                    className="w-full h-10 px-3 text-xs rounded-field border border-border/60 bg-card text-foreground outline-none focus:border-brand cursor-pointer"
                  >
                    <option value="none">
                      بدون نیاز به ورودی (خرید مستقیم)
                    </option>
                    <option value="account_creds">
                      ایمیل و رمز عبور کاربر (دستی اپراتور)
                    </option>
                    <option value="telegram_username">
                      آیدی تلگرام (@username)
                    </option>
                    <option value="wordpress_admin">
                      اطلاعات لاگین وردپرس (المنتور/رنک‌مث)
                    </option>
                    <option value="custom_links">
                      لینک فایل‌های درخواستی (UI8)
                    </option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">
                    نحوه نمایش موجودی به خریدار:
                  </label>
                  <select
                    value={stockDisplayMode}
                    onChange={(e: any) => setStockDisplayMode(e.target.value)}
                    className="w-full h-10 px-3 text-xs rounded-field border border-border/60 bg-card text-foreground outline-none focus:border-brand cursor-pointer"
                  >
                    <option value="show_exact">
                      نمایش عدد دقیق موجودی ربات
                    </option>
                    <option value="show_status_only">
                      فقط نمایش وضعیت (موجود/نامحدود)
                    </option>
                    <option value="hide">عدم نمایش موجودی</option>
                  </select>
                </div>
              </div>

              {/* Pre-Purchase Notice with RichContentEditor */}
              <div className="space-y-3 pt-3 border-t border-border/60 text-right">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="text-xs font-black text-foreground flex items-center gap-1.5">
                      <HelpCircle className="w-4 h-4 text-brand" />
                      نکات مهم و شرایط فعال‌سازی قبل از خرید (Pre-Purchase
                      Notice):
                    </label>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      اطلاعات یا هشدارهایی که خریدار باید قبل از پرداخت یا
                      افزودن به سبد مطالعه و تایید نماید
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-muted-foreground font-bold">
                      شیوه نمایش:
                    </span>
                    <select
                      value={prePurchaseNoticeMode}
                      onChange={(e: any) =>
                        setPrePurchaseNoticeMode(e.target.value)
                      }
                      className="h-8 px-2.5 text-xs rounded-control border border-border/60 bg-card text-foreground outline-none cursor-pointer"
                    >
                      <option value="none">بدون اعلان</option>
                      <option value="inline">نمایش کادر درون‌صفحه‌ای</option>
                      <option value="modal_confirm">
                        مدال پاپ‌آپ قبل از افزودن به سبد
                      </option>
                      <option value="both">هر دو حالت</option>
                    </select>
                  </div>
                </div>

                <div className="border border-border/60 rounded-surface overflow-hidden bg-card">
                  <RichContentEditor
                    value={prePurchaseNotice}
                    onChange={setPrePurchaseNotice}
                    minHeight="220px"
                    placeholder="نکات مهم قبل از خرید، شرایط گارانتی و مراحل فعال‌سازی را در این کادر بنویسید..."
                  />
                </div>
              </div>

              {/* Submit Action */}
              <div className="pt-2 space-y-2.5">
                <div className="p-3 rounded-control bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>
                    توجه: محصول به صورت پیش‌نویس (غیرفعال) در کاتالوگ ذخیره می‌شود
                    تا بتوانید تصویر، آیکون و جزئیات را قبل از انتشار نهایی در
                    فروشگاه بررسی و تکمیل نمایید.
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={savingProduct}
                  className="w-full h-11 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs shadow-control flex items-center justify-center gap-2 cursor-pointer duration-motion active:scale-[0.98] disabled:opacity-50"
                >
                  {savingProduct ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>در حال ثبت محصول در کاتالوگ...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>
                        ثبت محصول در کاتالوگ (پیش‌نویس غیرفعال جهت ویرایش)
                      </span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Provider API Key / BaseURL Settings Modal */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-5 overflow-y-auto bg-background/85 backdrop-blur-md animate-in fade-in duration-200">
          <div
            dir="rtl"
            className="relative w-full max-w-lg bg-card rounded-surface border border-border/80 shadow-surface overflow-hidden flex flex-col my-auto text-foreground"
          >
            <div className="p-4 sm:p-5 border-b border-border/60 flex items-center justify-between bg-muted/20">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-control bg-secondary text-brand border border-border/60 flex items-center justify-center">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-foreground">
                    تنظیمات کلید اتصال ربات: @{editingProviderKey}
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    وارد کردن کلید API و آدرس سرور تامین‌کننده
                  </p>
                </div>
              </div>

              <ModalCloseButton onClick={() => setIsSettingsModalOpen(false)} />
            </div>

            <form
              onSubmit={handleSaveProviderSettings}
              className="p-4 sm:p-6 space-y-4 text-right"
            >
              {/* Bot Guidance */}
              {BOT_DOCS_GUIDE[editingProviderKey] && (
                <div className="p-3 rounded-control bg-brand/5 border border-brand/20 space-y-1.5 text-xs text-right">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-brand text-[11px]">
                      راهنمای دریافت کلید{' '}
                      {BOT_DOCS_GUIDE[editingProviderKey].botHandle}:
                    </span>
                    <a
                      href={BOT_DOCS_GUIDE[editingProviderKey].docsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] text-muted-foreground hover:text-brand font-mono font-latin underline"
                    >
                      مشاهده مستندات
                    </a>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {BOT_DOCS_GUIDE[editingProviderKey].helpText}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-mono font-latin">
                    فرمت کلید: {BOT_DOCS_GUIDE[editingProviderKey].keyPrefix}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between bg-muted/20 p-3 rounded-control border border-border/60">
                <span className="text-xs font-bold text-foreground">
                  وضعیت فعال‌سازی ربات:
                </span>
                <ToggleSwitch
                  checked={providerEnabledToggle}
                  onChange={setProviderEnabledToggle}
                  size="md"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  کلید API اختصاصی (API Key / Token):
                </label>
                <div className="relative">
                  <input
                    type={showKeyPassword ? 'text' : 'password'}
                    value={providerKeyInput}
                    onChange={(e) => setProviderKeyInput(e.target.value)}
                    placeholder="کلید اختصاصی را در این کادر پیست نمایید"
                    className="w-full h-10 pr-3.5 pl-10 text-xs rounded-field border border-border/60 bg-muted/20 text-foreground font-mono font-latin outline-none focus:border-brand"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKeyPassword(!showKeyPassword)}
                    className="absolute left-3 top-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    {showKeyPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  آدرس سرور API (Base URL):
                </label>
                <input
                  type="text"
                  value={providerBaseURLInput}
                  onChange={(e) => setProviderBaseURLInput(e.target.value)}
                  placeholder="https://..."
                  className="w-full h-10 px-3.5 text-xs rounded-field border border-border/60 bg-muted/20 text-foreground font-mono font-latin outline-none focus:border-brand"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  درصد پیش‌فرض مارجین سود (%):
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={providerMarginInput}
                  onChange={(e) =>
                    setProviderMarginInput(Number(e.target.value))
                  }
                  className="w-full h-10 px-3.5 text-xs rounded-field border border-border/60 bg-muted/20 text-foreground font-mono font-latin outline-none focus:border-brand"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="w-full h-11 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs shadow-control flex items-center justify-center gap-2 cursor-pointer duration-motion active:scale-[0.98] disabled:opacity-50"
                >
                  {savingSettings ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>در حال ذخیره...</span>
                    </>
                  ) : (
                    <span>ذخیره تنظیمات ربات</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>,
    document.body,
  )
}
