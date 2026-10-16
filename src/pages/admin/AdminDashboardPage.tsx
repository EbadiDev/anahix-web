import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clock,
  Coins,
  Cpu,
  DollarSign,
  Eye,
  EyeOff,
  Key,
  Link2,
  PackageCheck,
  Percent,
  Printer,
  RefreshCw,
  Send,
  Sliders,
  Sparkles,
  Tag,
  TrendingUp,
  Wallet,
  Zap,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AdminActionLogView } from '../../components/admin/AdminActionLogView'
import { AdminBannersView } from '../../components/admin/AdminBannersView'
import { AdminBIAnalyticsView } from '../../components/admin/AdminBIAnalyticsView'
import { AdminBillingSettingsView } from '../../components/admin/AdminBillingSettingsView'
import { AdminCalendarView } from '../../components/admin/AdminCalendarView'
import { AdminContentView } from '../../components/admin/AdminContentView'
import { AdminInventoryView } from '../../components/admin/AdminInventoryView'
import { AdminLoyaltyTiersView } from '../../components/admin/AdminLoyaltyTiersView'
import { AdminOrdersTableView } from '../../components/admin/AdminOrdersTableView'
import { AdminReviewsView } from '../../components/admin/AdminReviewsView'
import {
  AdminSidebar,
  type AdminTabType,
} from '../../components/admin/AdminSidebar'
import { AdminThemeSettingsView } from '../../components/admin/AdminThemeSettingsView'
import { AdminTicketsView } from '../../components/admin/AdminTicketsView'
import { AdminUsersView } from '../../components/admin/AdminUsersView'
import { SMSGatewayView } from '../../components/admin/SMSGatewayView'
import { TransactionsLogView } from '../../components/admin/TransactionsLogView'
import { Header } from '../../components/Header'
import { OfficialInvoiceModal } from '../../components/invoice/OfficialInvoiceModal'
import { apiService } from '../../services/api'
import type {
  InstantDeliverySettings,
  ProductGroup,
  ProviderCatalogItem,
  VirtualNumberSettings,
} from '../../types'

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<AdminTabType>('bi-analytics')
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [adminUser, setAdminUser] = useState<any>(null)
  const [reviewsPendingCount, setReviewsPendingCount] = useState<number>(0)
  const [ticketsPendingCount, setTicketsPendingCount] = useState<number>(0)

  // Virtual Numbers Provider state
  const [vnSettings, setVnSettings] = useState<VirtualNumberSettings | null>(
    null,
  )
  const [vnLoading, setVnLoading] = useState(false)
  const [vnSaveLoading, setVnSaveLoading] = useState(false)
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)
  const [marginInput, setMarginInput] = useState(25)
  const [usdRateInput, setUsdRateInput] = useState(95000)
  const [rubRateInput, setRubRateInput] = useState(1050)
  const [enabledToggle, setEnabledToggle] = useState(true)
  const [defaultOpInput, setDefaultOpInput] = useState('any')
  const [ratePriorityInput, setRatePriorityInput] = useState<
    'manual' | 'swapwallet'
  >('manual')
  const [settingsMsg, setSettingsMsg] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  // Delivery Engine & Instant Fulfillment state
  const [deliverySettings, setDeliverySettings] =
    useState<InstantDeliverySettings | null>(null)
  const [deliveryLoading, setDeliveryLoading] = useState(false)
  const [deliverySaveLoading, setDeliverySaveLoading] = useState(false)
  const [providerKeyInput, setProviderKeyInput] = useState('')
  const [showProviderKey, setShowProviderKey] = useState(false)
  const [providerMarginInput, setProviderMarginInput] = useState(25)
  const [providerEnabledToggle, setProviderEnabledToggle] = useState(true)

  const [productGroups, setProductGroups] = useState<ProductGroup[]>([])
  const [loadingGroups, setLoadingGroups] = useState(false)
  const [providerCatalog, setProviderCatalog] = useState<ProviderCatalogItem[]>(
    [],
  )
  const [loadingCatalog, setLoadingCatalog] = useState(false)
  const [groupUpdateLoading, setGroupUpdateLoading] = useState<
    Record<string, boolean>
  >({})
  const [linkingLoading, setLinkingLoading] = useState<Record<string, boolean>>(
    {},
  )

  // Virtual orders log
  const [virtualOrders, setVirtualOrders] = useState<any[]>([])
  const [loadingOrders, setLoadingOrders] = useState(false)

  // Operator Queue state
  const [queueOrders, setQueueOrders] = useState<any[]>([])
  const [loadingQueue, setLoadingQueue] = useState(false)
  const [promptOrderId, setPromptOrderId] = useState<string | null>(null)
  const [promptMessage, setPromptMessage] = useState(
    'لطفاً کد تایید پیامک شده به گوشی خود را در بخش پیگیری وارد نمایید',
  )
  const [sendingPrompt, setSendingPrompt] = useState(false)
  const [revealedCreds, setRevealedCreds] = useState<Record<string, boolean>>(
    {},
  )
  const [adminInvoiceOrderNo, setAdminInvoiceOrderNo] = useState<string | null>(
    null,
  )

  // Auth Guard
  useEffect(() => {
    const token = apiService.getAdminToken()
    if (!token) {
      navigate('/admin/login')
      return
    }
    const user = apiService.getAdminUser()
    setAdminUser(user || { username: 'admin', full_name: 'مدیر کل آناهیکس' })
  }, [navigate])

  const handleLogout = () => {
    apiService.clearAdminToken()
    navigate('/admin/login')
  }

  // Load Virtual Number Provider Settings
  const loadVirtualNumberSettings = async () => {
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
      setSettingsMsg({
        type: 'error',
        text: err.message || 'خطا در دریافت تنظیمات سامانه شماره‌های مجازی',
      })
    } finally {
      setVnLoading(false)
    }
  }

  // Load Virtual Orders
  const loadVirtualOrders = async () => {
    setLoadingOrders(true)
    try {
      const orders = await apiService.getAdminVirtualOrders()
      setVirtualOrders(orders)
    } catch {
      // fallback
    } finally {
      setLoadingOrders(false)
    }
  }

  // Load Operator Queue Orders
  const loadQueueOrders = async () => {
    setLoadingQueue(true)
    try {
      const orders = await apiService.getAdminQueueOrders()
      setQueueOrders(orders)
    } catch {
      // fallback
    } finally {
      setLoadingQueue(false)
    }
  }

  // Load Delivery Engine Data
  const loadDeliveryEngineData = async () => {
    setDeliveryLoading(true)
    setLoadingGroups(true)
    setLoadingCatalog(true)
    try {
      const [settings, groups, catalogItems] = await Promise.all([
        apiService.getInstantDeliverySettings().catch(() => null),
        apiService.getProductGroups().catch(() => []),
        apiService.getProviderCatalog().catch(() => []),
      ])
      if (settings) {
        setDeliverySettings(settings)
        setProviderEnabledToggle(settings.enabled)
        setProviderMarginInput(settings.margin_percent)
      }
      setProductGroups(groups)
      setProviderCatalog(catalogItems)
    } finally {
      setDeliveryLoading(false)
      setLoadingGroups(false)
      setLoadingCatalog(false)
    }
  }

  const handleSaveDeliverySettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setDeliverySaveLoading(true)
    setSettingsMsg(null)
    try {
      const payload: any = {
        enabled: providerEnabledToggle,
        margin_percent: Number(providerMarginInput),
      }
      if (providerKeyInput.trim()) {
        payload.api_key = providerKeyInput.trim()
      }
      await apiService.updateInstantDeliverySettings(payload)
      setProviderKeyInput('')
      await loadDeliveryEngineData()
      setSettingsMsg({
        type: 'success',
        text: 'تنظیمات زیرساخت تحویل آنی با موفقیت ذخیره گردید',
      })
    } catch (err: any) {
      setSettingsMsg({
        type: 'error',
        text: err.message || 'خطا در ذخیره تنظیمات موتور تحویل آنی',
      })
    } finally {
      setDeliverySaveLoading(false)
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
      setSettingsMsg({
        type: 'success',
        text: `استراتژی تحویل گروه "${groupTag}" با موفقیت به‌روزرسانی شد`,
      })
    } catch (err: any) {
      setSettingsMsg({
        type: 'error',
        text: err.message || 'خطا در تغییر استراتژی تحویل گروه',
      })
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
      await loadDeliveryEngineData()
      setSettingsMsg({
        type: 'success',
        text: 'اتصال محصول به مخزن تحویل آنی با موفقیت انجام شد',
      })
    } catch (err: any) {
      setSettingsMsg({
        type: 'error',
        text: err.message || 'خطا در اتصال محصول به مخزن تحویل آنی',
      })
    } finally {
      setLinkingLoading((prev) => ({ ...prev, [productId]: false }))
    }
  }

  useEffect(() => {
    if (activeTab === 'virtual-numbers') {
      loadVirtualNumberSettings()
      loadVirtualOrders()
    } else if (activeTab === 'delivery') {
      loadDeliveryEngineData()
    } else if (activeTab === 'queue') {
      loadQueueOrders()
    }
  }, [activeTab])

  // Save Virtual Number Settings
  const handleSaveVirtualNumberSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setVnSaveLoading(true)
    setSettingsMsg(null)

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
      setSettingsMsg({
        type: 'success',
        text: 'تنظیمات سامانه شماره‌های مجازی با موفقیت ذخیره گردید',
      })
    } catch (err: any) {
      setSettingsMsg({
        type: 'error',
        text: err.message || 'خطا در ذخیره تنظیمات',
      })
    } finally {
      setVnSaveLoading(false)
    }
  }

  // Send 2FA Prompt from Operator Desk
  const handleSend2FAPrompt = async (orderId: string) => {
    setSendingPrompt(true)
    try {
      await apiService.requestAdmin2FA(orderId, promptMessage)
      setPromptOrderId(null)
      loadQueueOrders()
    } finally {
      setSendingPrompt(false)
    }
  }

  // Complete Order
  const handleCompleteOrder = async (orderId: string) => {
    if (
      !confirm(
        'آیا از اتمام و تکمیل این سفارش و سوزاندن (Zeroize) پسورد کاربر اطمینان دارید؟',
      )
    )
      return
    await apiService.completeAdminOrder(orderId, 'اکانت با موفقیت فعال شد')
    loadQueueOrders()
  }

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-slate-50 dark:bg-[#020817] text-slate-900 dark:text-slate-100 flex font-sans transition-colors duration-200"
    >
      {/* Responsive Admin Sidebar */}
      <AdminSidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        adminUser={adminUser}
        queueCount={queueOrders.length}
        ticketsPendingCount={ticketsPendingCount}
        reviewsPendingCount={reviewsPendingCount}
        vnEnabled={vnSettings?.enabled}
        deliveryEnabled={deliverySettings?.enabled}
        onLogout={handleLogout}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Unified Header with Profile, Wallet, and Mobile Menu Toggle */}
        <Header
          hideNavLinks
          hideAnnouncementBar
          onToggleMobileMenu={() => setIsMobileSidebarOpen(true)}
        />

        {/* View Content Container */}
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex-1">
          {/* TAB -1: BI & ANALYTICS DASHBOARD */}
          {activeTab === 'bi-analytics' && <AdminBIAnalyticsView />}

          {/* TAB: JALALI CALENDAR & HOLIDAYS */}
          {activeTab === 'calendar' && <AdminCalendarView />}

          {/* TAB: BANNERS & PROMOTIONS MANAGEMENT */}
          {activeTab === 'banners' && <AdminBannersView />}

          {/* TAB: VIBE FARSI THEME & MULTI-AUTH SETTINGS */}
          {activeTab === 'theme-settings' && <AdminThemeSettingsView />}

          {/* TAB -0.5: VIP CLUB & LOYALTY TIERS */}
          {activeTab === 'loyalty-tiers' && <AdminLoyaltyTiersView />}

          {/* TAB 0: 360-DEGREE USER MANAGEMENT */}
          {activeTab === 'users' && <AdminUsersView />}

          {/* TAB 0.5: ENHANCED ALL-ORDERS MANAGEMENT TABLE */}
          {activeTab === 'all-orders' && <AdminOrdersTableView />}

          {/* TAB 0.6: BLOG & KNOWLEDGE BASE SEO ENGINE */}
          {activeTab === 'content' && <AdminContentView />}

          {/* TAB 1: VIRTUAL NUMBERS SETTINGS & MANAGEMENT */}
          {activeTab === 'virtual-numbers' && (
            <div className="space-y-8">
              {/* Top Info Banner - Graphite Technical Minimal */}
              <div className="bg-card border-line text-card-foreground rounded-surface p-6 shadow-surface flex flex-col md:flex-row items-start md:items-center justify-between gap-6 duration-motion ease-motion">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 bg-brand/10 border border-brand/20 text-brand px-3 py-1 rounded-control text-xs font-bold">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>سامانه شماره‌های مجازی بین‌المللی آناهیکس</span>
                  </div>
                  <h2 className="text-xl font-black text-foreground">
                    مدیریت فروش شماره‌های دریافت پیامک (SMS OTP)
                  </h2>
                  <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
                    بیش از ۵۰۰٬۰۰۰ شماره آماده تحویل از ۱۸۰ کشور دنیا (انگلستان،
                    آلمان، فرانسه، سوئد، هلند، آمریکا و...). با فعال‌سازی زیرساخت
                    شماره‌های مجازی آناهیکس، شماره‌ها را با مارجین و سود دلخواه به
                    کاربران عرضه کنید.
                  </p>
                </div>

                {/* Account Live Balance Widget */}
                <div className="bg-muted border-line rounded-control p-4 shrink-0 min-w-[220px]">
                  <div className="text-xs text-muted-foreground mb-1 flex items-center justify-between">
                    <span>موجودی اعتبار سامانه شماره‌ها</span>
                    <button
                      onClick={loadVirtualNumberSettings}
                      disabled={vnLoading}
                      className="p-1 hover:bg-card rounded transition-colors text-foreground"
                      title="بروزرسانی موجودی"
                    >
                      <RefreshCw
                        className={`w-3.5 h-3.5 ${vnLoading ? 'animate-spin' : ''}`}
                      />
                    </button>
                  </div>
                  <div className="text-2xl font-black text-foreground font-mono tracking-tight">
                    $
                    {vnSettings?.balance
                      ? vnSettings.balance.toFixed(2)
                      : '0.00'}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-2 flex items-center justify-between">
                    <span>امتیاز کاربری:</span>
                    <span className="font-bold text-brand">
                      {vnSettings?.rating || 100}%
                    </span>
                  </div>
                  {vnSettings?.is_mock && (
                    <div className="mt-2 pt-2 border-t border-white/10 text-[10px] text-amber-300">
                      * در حال اجرای حالت شبیه‌ساز (Mock Demo)
                    </div>
                  )}
                </div>
              </div>

              {/* Notification alert */}
              {settingsMsg && (
                <div
                  className={`p-4 rounded-xl border text-sm flex items-center gap-3 ${
                    settingsMsg.type === 'success'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                      : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
                  }`}
                >
                  {settingsMsg.type === 'success' ? (
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 shrink-0" />
                  )}
                  <span>{settingsMsg.text}</span>
                </div>
              )}

              {/* Config Form Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: API & Core Controls */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
                  <div className="border-b border-slate-100 dark:border-slate-800 pb-4 flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-base">
                        تنظیمات زیرساخت شماره‌های مجازی آناهیکس
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        کلید فعال‌سازی، مارجین سود و ضرایب تبدیل تومان را به صورت
                        کاملاً داینامیک تنظیم نمایید
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-600 dark:text-slate-400">
                        وضعیت فروش:
                      </span>
                      <button
                        type="button"
                        onClick={() => setEnabledToggle(!enabledToggle)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          enabledToggle
                            ? 'bg-blue-600'
                            : 'bg-slate-300 dark:bg-slate-700'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            enabledToggle ? '-translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  <form
                    onSubmit={handleSaveVirtualNumberSettings}
                    className="space-y-6"
                  >
                    {/* API Key */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                        کلید فعال‌سازی زیرساخت شماره‌های مجازی (Bearer Token)
                      </label>
                      <div className="relative">
                        <input
                          type={showApiKey ? 'text' : 'password'}
                          value={apiKeyInput}
                          onChange={(e) => setApiKeyInput(e.target.value)}
                          placeholder={
                            vnSettings?.has_api_key
                              ? `کلید فعال در سرور: ${vnSettings.api_key_masked} (برای تغییر، مقدار جدید را وارد نمایید)`
                              : 'کلید اتصال زیرساخت شماره را اینجا الصاق کنید (اختیاری در حالت دمو)'
                          }
                          className="w-full px-3.5 py-2.5 pr-10 pl-10 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 font-mono focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                        />
                        <Key className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
                        <button
                          type="button"
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="absolute left-3.5 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                          {showApiKey ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5">
                        کلید اتصال اختصاصی را جهت ارتباط مستقیم با زیرساخت
                        شماره‌های بین‌المللی وارد نمایید.
                      </p>
                    </div>

                    {/* Toman Price Calculation Strategy (Priority Selection) */}
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 p-5 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 dark:border-slate-800 pb-3">
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Coins className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            اولویت محاسبه قیمت تومان (Toman Price Engine)
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            تعیین اولویت نرخ‌گذاری: اولویت ۱ نرخ دستی، اولویت ۲
                            مبدل زنده تتر SwapWallet
                          </p>
                        </div>

                        {/* Live SwapWallet Ticker Badge */}
                        {vnSettings?.live_usd_rate ? (
                          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 shadow-sm">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span>
                              تتر SwapWallet:{' '}
                              {vnSettings.live_usd_rate.toLocaleString('fa-IR')}{' '}
                              تومان
                            </span>
                          </div>
                        ) : null}
                      </div>

                      {/* Priority Option Selector Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        {/* Option 1: Manual Rate */}
                        <button
                          type="button"
                          onClick={() => setRatePriorityInput('manual')}
                          className={`p-4 rounded-xl border text-right transition-all flex flex-col justify-between ${
                            ratePriorityInput === 'manual'
                              ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 ring-2 ring-blue-500/20 shadow-sm'
                              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                  ratePriorityInput === 'manual'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                                }`}
                              >
                                <Sliders className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="text-sm font-bold text-slate-900 dark:text-white">
                                  اولویت ۱: نرخ دستی مدیر (Manual)
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                  نرخ ثابت و مصوب مدیر سیستم
                                </div>
                              </div>
                            </div>
                            <div
                              className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                                ratePriorityInput === 'manual'
                                  ? 'border-blue-600 bg-blue-600 text-white'
                                  : 'border-slate-300 dark:border-slate-600'
                              }`}
                            >
                              {ratePriorityInput === 'manual' && (
                                <Check className="w-3 h-3" />
                              )}
                            </div>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-3 leading-relaxed">
                            محاسبه قیمت‌ها تماماً بر اساس عدد دستی وارد شده در
                            کادر نرخ دلار انجام می‌شود و نوسانات بازار تا تغییر
                            دستی مدیر تاثیری نخواهد داشت.
                          </p>
                        </button>

                        {/* Option 2: SwapWallet Converter */}
                        <button
                          type="button"
                          onClick={() => setRatePriorityInput('swapwallet')}
                          className={`p-4 rounded-xl border text-right transition-all flex flex-col justify-between ${
                            ratePriorityInput === 'swapwallet'
                              ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 ring-2 ring-blue-500/20 shadow-sm'
                              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                  ratePriorityInput === 'swapwallet'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                                }`}
                              >
                                <Zap className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                  اولویت ۲: مبدل زنده تتر (SwapWallet)
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 font-normal">
                                    مشابه ArchNet
                                  </span>
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                  استعلام زنده و خودکار قیمت لحظه‌ای USDT
                                </div>
                              </div>
                            </div>
                            <div
                              className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                                ratePriorityInput === 'swapwallet'
                                  ? 'border-blue-600 bg-blue-600 text-white'
                                  : 'border-slate-300 dark:border-slate-600'
                              }`}
                            >
                              {ratePriorityInput === 'swapwallet' && (
                                <Check className="w-3 h-3" />
                              )}
                            </div>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-3 leading-relaxed">
                            استعلام لحظه‌ای از API صرافی غیرمتمرکز SwapWallet با
                            کش هوشمند ۳ دقیقه‌ای. در صورت قطعی اینترنت، بدون وقفه
                            به نرخ دستی بازمی‌گردد.
                          </p>
                        </button>
                      </div>

                      {/* Effective Rate Status Banner */}
                      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 dark:text-slate-400">
                            منبع فعال فعلی:
                          </span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {vnSettings?.active_rate_source === 'swapwallet'
                              ? '🟢 مبدل زنده تتر SwapWallet (لحظه‌ای)'
                              : '🔷 نرخ دستی تعیین شده در پنل مدیریت'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 dark:text-slate-400">
                            نرخ دلار موثر در فروشگاه:
                          </span>
                          <span className="font-bold text-blue-600 dark:text-blue-400 font-mono text-sm">
                            {(
                              vnSettings?.effective_usd_rate || usdRateInput
                            ).toLocaleString('fa-IR')}{' '}
                            تومان
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Pricing and Margins Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* Profit Margin */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                          درصد مارجین سود (%)
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            step="1"
                            min="0"
                            max="200"
                            value={marginInput}
                            onChange={(e) =>
                              setMarginInput(Number(e.target.value))
                            }
                            className="w-full px-3.5 py-2.5 pr-9 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-600"
                          />
                          <Percent className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                        </div>
                        <span className="text-[10px] text-slate-400">
                          سود اضافه شده به هر شماره
                        </span>
                      </div>

                      {/* USD Rate */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                          نرخ دستی دلار / رزرو (تومان)
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            step="500"
                            value={usdRateInput}
                            onChange={(e) =>
                              setUsdRateInput(Number(e.target.value))
                            }
                            className="w-full px-3.5 py-2.5 pr-9 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-600"
                          />
                          <DollarSign className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                        </div>
                        <span className="text-[10px] text-slate-400">
                          مبنای اولویت دستی یا پشتیبان قطعی SwapWallet
                        </span>
                      </div>

                      {/* RUB Rate */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                          نرخ روبل روسیه (تومان)
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            step="10"
                            value={rubRateInput}
                            onChange={(e) =>
                              setRubRateInput(Number(e.target.value))
                            }
                            className="w-full px-3.5 py-2.5 pr-9 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-600"
                          />
                          <TrendingUp className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                        </div>
                        <span className="text-[10px] text-slate-400">
                          نرخ پایه ارز سامانه
                        </span>
                      </div>
                    </div>

                    {/* Default Operator */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        انتخابگر اپراتور مخابراتی
                      </label>
                      <select
                        value={defaultOpInput}
                        onChange={(e) => setDefaultOpInput(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                      >
                        <option value="any">
                          any (خرید هوشمند بر اساس بیشترین درصد موفقیت تحویل
                          SMS)
                        </option>
                        <option value="smart">
                          smart (سیستم انتخاب بهینه اپراتور)
                        </option>
                      </select>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-2 flex justify-end">
                      <button
                        type="submit"
                        disabled={vnSaveLoading}
                        className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium text-sm transition-all shadow-md shadow-blue-500/20 disabled:opacity-50 flex items-center gap-2"
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

                {/* Right Column: Service Health & Reassurance */}
                <div className="space-y-6">
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-4">
                      وضعیت سیستم و هشدارهای امنیتی
                    </h3>
                    <div className="space-y-4">
                      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/60 dark:border-slate-800">
                        <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          پیام وضعیت اتصال:
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                          {vnSettings?.status_message || 'در حال بررسی...'}
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 text-xs text-blue-900 dark:text-blue-200 space-y-2 leading-relaxed">
                        <div className="font-bold flex items-center gap-1.5 text-blue-700 dark:text-blue-400">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>سیستم استرداد آنی (Instant Refund)</span>
                        </div>
                        <p>
                          در صورتی که ظرف ۱۵ دقیقه کدی دریافت نشود یا کاربر
                          سفارش را لغو کند، هزینه به کیف پول کاربر بازگردانده
                          شده و سفارش در سامانه بدون کسر هزینه کنسل می‌شود.
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/60 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-1">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          سرویس‌های پرفروش:
                        </div>
                        <div>• تلگرام (Telegram) - بیشترین تقاضا</div>
                        <div>• هوش مصنوعی ChatGPT / OpenAI</div>
                        <div>• واتساپ و گوگل (Google One)</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Virtual Orders Audit Table */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">
                      لاگ سفارشات اخیر شماره مجازی
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      رصد و لاگ لحظه‌ای پیامک‌های OTP دریافتی توسط مشتریان
                    </p>
                  </div>
                  <button
                    onClick={loadVirtualOrders}
                    disabled={loadingOrders}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 ${loadingOrders ? 'animate-spin' : ''}`}
                    />
                    <span>بروزرسانی لاگ</span>
                  </button>
                </div>

                {virtualOrders.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-sm">
                    هنوز سفارشی برای شماره‌های مجازی ثبت نشده است.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-right">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400">
                          <th className="pb-3 font-semibold">شماره سفارش</th>
                          <th className="pb-3 font-semibold">سرویس</th>
                          <th className="pb-3 font-semibold">کشور</th>
                          <th className="pb-3 font-semibold">شماره تماس</th>
                          <th className="pb-3 font-semibold">کد تایید (OTP)</th>
                          <th className="pb-3 font-semibold">مبلغ (تومان)</th>
                          <th className="pb-3 font-semibold">وضعیت</th>
                          <th className="pb-3 font-semibold">زمان</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                        {virtualOrders.map((ord: any) => (
                          <tr
                            key={ord.id}
                            className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                          >
                            <td className="py-3 font-mono font-medium text-slate-700 dark:text-slate-300">
                              {ord.order_no}
                            </td>
                            <td className="py-3 font-medium text-slate-900 dark:text-white">
                              {ord.service_name_fa || ord.service}
                            </td>
                            <td className="py-3 text-slate-600 dark:text-slate-400">
                              {ord.country_flag}{' '}
                              {ord.country_name_fa || ord.country}
                            </td>
                            <td className="py-3 font-mono dir-ltr text-left text-slate-800 dark:text-slate-200">
                              {ord.phone}
                            </td>
                            <td className="py-3">
                              {ord.sms_code ? (
                                <span className="px-2 py-1 rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-mono font-bold text-sm">
                                  {ord.sms_code}
                                </span>
                              ) : (
                                <span className="text-slate-400">
                                  در انتظار پیامک...
                                </span>
                              )}
                            </td>
                            <td className="py-3 font-mono text-slate-700 dark:text-slate-300">
                              {Number(ord.price_toman).toLocaleString('fa-IR')}
                            </td>
                            <td className="py-3">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                  ord.status === 'RECEIVED' ||
                                  ord.status === 'FINISHED'
                                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                                    : ord.status === 'PENDING'
                                      ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                }`}
                              >
                                {ord.status === 'RECEIVED'
                                  ? 'دریافت شد'
                                  : ord.status === 'FINISHED'
                                    ? 'تکمیل شد'
                                    : ord.status === 'PENDING'
                                      ? 'در انتظار'
                                      : ord.status}
                              </span>
                            </td>
                            <td className="py-3 text-slate-400">
                              {new Date(ord.created_at).toLocaleTimeString(
                                'fa-IR',
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: DELIVERY ENGINE & INSTANT FULFILLMENT INTEGRATION */}
          {activeTab === 'delivery' && (
            <div className="space-y-8">
              {/* Top Info & Strategy Banner */}
              <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-700 text-white rounded-2xl p-6 shadow-lg shadow-blue-600/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs bg-white/20 backdrop-blur-md font-mono">
                      Delivery Routing Engine v2.0
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs bg-emerald-400/20 text-emerald-100 backdrop-blur-md flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Instant API Active
                    </span>
                  </div>
                  <h3 className="text-xl font-bold">
                    موتور هوشمند نحوه تحویل سفارشات (Delivery Engine)
                  </h3>
                  <p className="text-xs text-blue-100 max-w-2xl leading-relaxed">
                    مشابه موتور محاسبه قیمت ارز، می‌توانید نحوه تحویل سفارش را
                    برای هر گروه محصول تعیین کنید: تحویل دستی اپراتور در صف
                    بررسی یا صدور و تحویل آنی و خودکار توسط زیرساخت آناهیکس.
                  </p>
                </div>

                {/* Wallet Live Balance Card */}
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 min-w-[240px] text-right space-y-1">
                  <div className="text-[11px] text-blue-100 flex items-center justify-between">
                    <span>موجودی مخزن تحویل آنی آناهیکس:</span>
                    <Wallet
                      className={`w-3.5 h-3.5 ${deliveryLoading ? 'animate-pulse' : ''}`}
                    />
                  </div>
                  <div className="text-2xl font-bold font-mono tracking-tight">
                    ${deliverySettings?.balance_usdt?.toFixed(2) || '0.00'}{' '}
                    <span className="text-xs font-normal text-blue-200">
                      USDT
                    </span>
                  </div>
                  <div className="text-[11px] text-blue-200 font-mono">
                    معادل:{' '}
                    {(deliverySettings?.balance_toman || 0).toLocaleString(
                      'fa-IR',
                    )}{' '}
                    تومان
                  </div>
                </div>
              </div>

              {/* Strategy Priority Architecture Cards */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 p-5 space-y-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    دو استراتژی اصلی تحویل محصولات دیجیتال
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    تعیین شیوه تحویل محصولات دیجیتال به مشتریان
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Strategy 1: Manual Operator */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2.5 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                          <Clock className="w-4 h-4" />
                        </div>
                        <div>
                          <h5 className="text-sm font-bold text-slate-900 dark:text-white">
                            روش ۱: تحویل دستی اپراتور (Manual Operator Queue)
                          </h5>
                          <p className="text-[11px] text-slate-500">
                            پردازش در میز کار اپراتور با تبادل رمز یا ۲FA
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        کاربر پس از پرداخت در صف انجام سفارش قرار می‌گیرد.
                        اپراتور سیستم به صورت دستی اکانت، دعوت‌نامه فمیلی یا کد
                        ۲FA را بررسی و کالا را تحویل می‌دهد.
                      </p>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                      <span>
                        مناسب برای: ارتقای اکانت‌های شخصی، اکانت‌های اختصاصی با
                        ۲FA
                      </span>
                    </div>
                  </div>

                  {/* Strategy 2: Instant API Fulfillment */}
                  <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/40 bg-blue-50/30 dark:bg-blue-950/20 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2.5 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
                          <Zap className="w-4 h-4" />
                        </div>
                        <div>
                          <h5 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            روش ۲: تحویل آنی و خودکار آناهیکس (Instant Delivery)
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-normal">
                              خودکار ۰ ثانیه
                            </span>
                          </h5>
                          <p className="text-[11px] text-slate-500">
                            تحویل آنی از انبار لایسنس‌ها و اشتراک‌های جهانی
                            آناهیکس
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        صدور و تحویل خودکار و آنی کد لایسنس یا لینک فعال‌سازی در
                        لحظه پرداخت به مشتری. در صورت نیاز به بررسی تکمیلی،
                        سفارش به صورت خودکار و هوشمند به میز کار اپراتور هدایت
                        می‌شود.
                      </p>
                    </div>
                    <div className="mt-3 pt-3 border-t border-blue-100 dark:border-blue-900/30 flex items-center justify-between text-[11px] text-blue-700 dark:text-blue-300">
                      <span>
                        مناسب برای: جمینای ۱۸ ماهه، مانوس، ریسند، سوپابیس، لینیر
                        و لایسنس‌ها
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Instant Delivery API Settings Form */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <Key className="w-5 h-5 text-blue-600" />
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        پیکربندی کلید اتصال مخزن تحویل آنی آناهیکس
                      </h4>
                      <p className="text-xs text-slate-500">
                        {deliverySettings?.status_message ||
                          'در حال بارگذاری وضعیت اتصال...'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">
                      وضعیت زیرساخت آنی:
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setProviderEnabledToggle(!providerEnabledToggle)
                      }
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                        providerEnabledToggle
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {providerEnabledToggle ? 'فعال' : 'غیرفعال'}
                    </button>
                  </div>
                </div>

                <form
                  onSubmit={handleSaveDeliverySettings}
                  className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end"
                >
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      کلید فعال‌سازی موتور تحویل آنی (Fulfillment API Key)
                    </label>
                    <div className="relative">
                      <input
                        type={showProviderKey ? 'text' : 'password'}
                        value={providerKeyInput}
                        onChange={(e) => setProviderKeyInput(e.target.value)}
                        placeholder={
                          deliverySettings?.has_api_key
                            ? `کلید فعال: ${deliverySettings.api_key_masked} (جهت تغییر مقدار جدید وارد کنید)`
                            : 'کلید اختصاصی اتصال مخزن آنی را وارد نمایید'
                        }
                        className="w-full px-3.5 py-2.5 pr-10 pl-10 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                      <Key className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
                      <button
                        type="button"
                        onClick={() => setShowProviderKey(!showProviderKey)}
                        className="absolute left-3.5 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        {showProviderKey ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      درصد سود فروش (%)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="1"
                        min="0"
                        max="200"
                        value={providerMarginInput}
                        onChange={(e) =>
                          setProviderMarginInput(Number(e.target.value))
                        }
                        className="w-full px-3.5 py-2.5 pr-9 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                      <Percent className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                    </div>
                  </div>

                  <div className="md:col-span-3 flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={deliverySaveLoading}
                      className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-all shadow-md shadow-blue-500/20 disabled:opacity-50"
                    >
                      {deliverySaveLoading
                        ? 'در حال ذخیره...'
                        : 'ذخیره تنظیمات تحویل آنی'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Product Groups & Delivery Strategy Router */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Tag className="w-5 h-5 text-blue-600" />
                      مدیریت گروه‌ها، نحوه تحویل و اتصال به مخزن لایسنس‌های
                      آناهیکس
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      تعیین شیوه تحویل برای هر گروه محصول و اتصال مستقیم به
                      انبار لایسنس‌ها و اشتراک‌های آناهیکس
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={loadDeliveryEngineData}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 ${loadingGroups || loadingCatalog ? 'animate-spin' : ''}`}
                    />
                    <span>به‌روزرسانی گروه‌ها</span>
                  </button>
                </div>

                {/* Group Cards List */}
                {productGroups.map((group) => {
                  const isGroupInstant =
                    group.delivery_strategy === 'third_party_instant'
                  return (
                    <div
                      key={group.group_tag}
                      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm transition-all"
                    >
                      {/* Group Header Bar */}
                      <div className="p-4 sm:p-5 bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                            <Tag className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h5 className="text-sm font-bold text-slate-900 dark:text-white">
                                {group.group_title_fa}
                              </h5>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">
                                #{group.group_tag}
                              </span>
                              <span className="text-[11px] text-slate-400">
                                ({group.products_count} محصول)
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                              استراتژی فعال گروه:{' '}
                              <span
                                className={
                                  isGroupInstant
                                    ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                                    : 'text-blue-600 dark:text-blue-400 font-semibold'
                                }
                              >
                                {isGroupInstant
                                  ? '🟢 تحویل آنی و خودکار آناهیکس (Instant Delivery)'
                                  : '🔷 تحویل دستی اپراتور (Manual Operator)'}
                              </span>
                            </p>
                          </div>
                        </div>

                        {/* Group Strategy Toggle Pill Buttons */}
                        <div className="flex items-center bg-slate-200/70 dark:bg-slate-800 p-1 rounded-xl gap-1 self-stretch sm:self-auto">
                          <button
                            type="button"
                            disabled={groupUpdateLoading[group.group_tag]}
                            onClick={() =>
                              handleToggleGroupStrategy(
                                group.group_tag,
                                'manual_operator',
                              )
                            }
                            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
                              !isGroupInstant
                                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-bold'
                                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
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
                            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
                              isGroupInstant
                                ? 'bg-blue-600 text-white shadow-sm font-bold'
                                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                            }`}
                          >
                            <Zap className="w-3.5 h-3.5 text-amber-300" />
                            <span>تحویل آنی و خودکار</span>
                          </button>
                        </div>
                      </div>

                      {/* Products Table in Group */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-right text-xs">
                          <thead>
                            <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30 text-slate-400 font-medium">
                              <th className="py-3 px-4">
                                عنوان محصول در آناهیکس
                              </th>
                              <th className="py-3 px-4">قیمت فروش</th>
                              <th className="py-3 px-4">روش تحویل فعلی</th>
                              <th className="py-3 px-4 min-w-[280px]">
                                اتصال به لایسنس مخزن آنی آناهیکس
                              </th>
                              <th className="py-3 px-4">وضعیت اتصال</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {group.products.map((prod) => {
                              const isProdInstant =
                                prod.delivery_strategy ===
                                  'third_party_instant' ||
                                (prod.delivery_strategy === 'auto' &&
                                  prod.external_product_id > 0)
                              const isLinked = prod.external_product_id > 0

                              return (
                                <tr
                                  key={prod.id}
                                  className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                                >
                                  <td className="py-3.5 px-4">
                                    <div className="font-bold text-slate-900 dark:text-white">
                                      {prod.title_fa}
                                    </div>
                                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                      {prod.slug}
                                    </div>
                                  </td>

                                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                                    {prod.price_toman.toLocaleString('fa-IR')}{' '}
                                    تومان
                                  </td>

                                  <td className="py-3.5 px-4">
                                    <span
                                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium ${
                                        isProdInstant
                                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                                          : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                                      }`}
                                    >
                                      {isProdInstant ? (
                                        <>
                                          <Zap className="w-3 h-3" />
                                          <span>تحویل آنی</span>
                                        </>
                                      ) : (
                                        <>
                                          <Clock className="w-3 h-3" />
                                          <span>دستی اپراتور</span>
                                        </>
                                      )}
                                    </span>
                                  </td>

                                  <td className="py-3.5 px-4">
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
                                        className="w-full text-xs py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all font-mono"
                                      >
                                        <option value={0}>
                                          -- بدون اتصال به مخزن آنی (تحویل دستی
                                          در صف اپراتور) --
                                        </option>
                                        {providerCatalog.map((ix) => (
                                          <option key={ix.id} value={ix.id}>
                                            [#{ix.id}] {ix.name} ($
                                            {ix.price_usdt.toFixed(2)} USDT ~{' '}
                                            {ix.price_toman.toLocaleString(
                                              'fa-IR',
                                            )}{' '}
                                            تومان){' '}
                                            {ix.stock > 0
                                              ? `[موجودی: ${ix.stock}]`
                                              : '[ناموجود]'}
                                          </option>
                                        ))}
                                      </select>
                                      {linkingLoading[prod.id] && (
                                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600 absolute left-3 top-2.5" />
                                      )}
                                    </div>
                                  </td>

                                  <td className="py-3.5 px-4">
                                    {isLinked ? (
                                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                        <Link2 className="w-3 h-3" />
                                        <span>
                                          متصل به #{prod.external_product_id}
                                        </span>
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] text-slate-400 bg-slate-50 dark:bg-slate-800/50">
                                        بدون اتصال
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Provider Live Catalog Reference Explorer */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <PackageCheck className="w-4 h-4 text-blue-600" />
                      انبار لایسنس‌ها و اشتراک‌های آماده تحویل آنی آناهیکس (مجموع{' '}
                      {providerCatalog.length} محصول)
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      استعلام لحظه‌ای لایسنس‌ها، قیمت‌های پایه ارزی و موجودی زنده
                      مخزن جهت تحویل فوری به خریداران
                    </p>
                  </div>
                  <div className="text-xs text-slate-400 font-mono">
                    {providerCatalog.length} محصول موجود
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {providerCatalog.map((p) => (
                    <div
                      key={p.id}
                      className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/50 flex flex-col justify-between hover:border-blue-300 dark:hover:border-blue-800 transition-colors"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-bold text-xs text-slate-900 dark:text-white line-clamp-1">
                            {p.name}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-slate-600 dark:text-slate-300">
                            #{p.id}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                          {p.description || 'تحویل آنی لینک یا کد فعال‌سازی'}
                        </p>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between text-xs">
                        <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                          ${p.price_usdt.toFixed(2)} USDT
                        </span>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                            p.stock > 0
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400'
                              : 'bg-red-100 text-red-600'
                          }`}
                        >
                          موجودی: {p.unlimited ? 'نامحدود' : p.stock}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: OPERATOR DESK WORKBENCH (MIGRATED FROM PUBLIC STOREFRONT) */}
          {activeTab === 'queue' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    میز کار اپراتور تحویل سفارشات (Mode C / 2FA)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    مدیریت و ورود به اکانت‌های ارتقای شخصی کاربران، درخواست کد
                    ۲FA و اجرای پروتکل امنیتی Zeroize
                  </p>
                </div>
                <button
                  onClick={loadQueueOrders}
                  disabled={loadingQueue}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-2"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${loadingQueue ? 'animate-spin' : ''}`}
                  />
                  <span>بروزرسانی صف</span>
                </button>
              </div>

              {queueOrders.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center text-slate-500">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                  <h4 className="font-bold text-base text-slate-900 dark:text-white">
                    صف خلوت است!
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    سفارش در حال انتظاری برای پردازش اپراتور وجود ندارد.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {queueOrders.map((ord: any) => {
                    const oid = ord.order_id || ord.id || ord.order_number
                    const tier = (ord.customer_tier || 'bronze').toLowerCase()
                    const isVIP =
                      tier === 'gold' ||
                      tier === 'diamond' ||
                      ord.priority_score >= 50
                    const isSilver =
                      tier === 'silver' || ord.priority_score >= 10

                    return (
                      <div
                        key={oid}
                        className={`bg-white dark:bg-slate-900 rounded-2xl border p-6 shadow-sm space-y-4 relative transition ${
                          isVIP
                            ? 'border-amber-500/50 shadow-amber-500/10 ring-1 ring-amber-500/20'
                            : isSilver
                              ? 'border-slate-400/50 dark:border-slate-600'
                              : 'border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        {/* VIP High Priority Flag */}
                        {(isVIP || isSilver) && (
                          <div className="flex items-center justify-between -mt-2 mb-1 text-[11px] font-bold">
                            <span
                              className={`px-2.5 py-0.5 rounded-full flex items-center gap-1.5 shadow-sm ${
                                isVIP
                                  ? 'bg-amber-500/15 text-amber-500 dark:text-amber-400 border border-amber-500/30'
                                  : 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border border-slate-400/30'
                              }`}
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              {isVIP
                                ? `👑 مشتری طلایی VIP (اولویت ${ord.priority_score || 50})`
                                : `⭐ مشتری نقره‌ای ویژه (اولویت ${ord.priority_score || 10})`}
                            </span>
                            {ord.loyalty_discount_toman > 0 && (
                              <span className="text-emerald-500 dark:text-emerald-400 font-mono text-[10px]">
                                تخفیف وفاداری:{' '}
                                {Math.round(
                                  ord.loyalty_discount_toman,
                                ).toLocaleString('fa-IR')}{' '}
                                ت
                              </span>
                            )}
                          </div>
                        )}

                        <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                          <div>
                            <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                              {ord.order_number}
                            </span>
                            <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-0.5">
                              {ord.product_title ||
                                ord.items?.[0]?.product_title ||
                                'سفارش هوش مصنوعی'}
                            </h4>
                          </div>
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                            {ord.status}
                          </span>
                        </div>

                        <div className="text-xs space-y-2 bg-slate-50 dark:bg-slate-950/60 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/60">
                          <div className="flex justify-between">
                            <span className="text-slate-500">مشتری:</span>
                            <span className="font-mono text-slate-800 dark:text-slate-200">
                              {ord.customer_phone}
                            </span>
                          </div>
                          {ord.account_email && (
                            <div className="flex justify-between">
                              <span className="text-slate-500">
                                ایمیل اکانت:
                              </span>
                              <span className="font-mono text-slate-800 dark:text-slate-200">
                                {ord.account_email}
                              </span>
                            </div>
                          )}
                          {ord.account_password && (
                            <div className="flex justify-between items-center">
                              <span className="text-slate-500">رمز عبور:</span>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-slate-800 dark:text-slate-200">
                                  {revealedCreds[oid]
                                    ? ord.account_password
                                    : '••••••••••••'}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setRevealedCreds({
                                      ...revealedCreds,
                                      [oid]: !revealedCreds[oid],
                                    })
                                  }
                                  className="text-slate-400 hover:text-slate-600"
                                >
                                  {revealedCreds[oid] ? (
                                    <EyeOff className="w-3.5 h-3.5" />
                                  ) : (
                                    <Eye className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                            </div>
                          )}
                          {ord.two_factor_code && (
                            <div className="flex justify-between items-center bg-emerald-50 dark:bg-emerald-950/60 p-2 rounded-lg border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300">
                              <span className="font-bold">
                                کد ۲FA ارسالی کاربر:
                              </span>
                              <span className="font-mono text-base font-bold tracking-widest">
                                {ord.two_factor_code}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                          <button
                            onClick={() =>
                              setAdminInvoiceOrderNo(ord.order_number)
                            }
                            className="py-2 px-3 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100/50 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                            title="چاپ صورتحساب رسمی"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>فاکتور رسمی</span>
                          </button>
                          <button
                            onClick={() => setPromptOrderId(oid)}
                            className="flex-1 py-2 px-3 rounded-xl border border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>درخواست ۲FA</span>
                          </button>
                          <button
                            onClick={() => handleCompleteOrder(oid)}
                            className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>تکمیل و Zeroize</span>
                          </button>
                        </div>

                        {/* 2FA Dialog Modal inline */}
                        {promptOrderId === oid && (
                          <div className="absolute inset-0 bg-white dark:bg-slate-900 p-6 rounded-2xl border-2 border-blue-600 z-10 flex flex-col justify-between">
                            <div className="space-y-3">
                              <h5 className="font-bold text-sm text-slate-900 dark:text-white">
                                ارسال اعلان درخواست کد ۲FA به مشتری
                              </h5>
                              <textarea
                                value={promptMessage}
                                onChange={(e) =>
                                  setPromptMessage(e.target.value)
                                }
                                rows={3}
                                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                              />
                            </div>
                            <div className="flex items-center gap-2 justify-end">
                              <button
                                onClick={() => setPromptOrderId(null)}
                                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                              >
                                انصراف
                              </button>
                              <button
                                onClick={() => handleSend2FAPrompt(oid)}
                                disabled={sendingPrompt}
                                className="px-4 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 flex items-center gap-1.5"
                              >
                                {sendingPrompt
                                  ? 'در حال ارسال...'
                                  : 'ارسال درخواست'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB: SUPPORT & REAL TICKETING ENGINE DESK */}
          {activeTab === 'tickets' && (
            <AdminTicketsView
              adminUser={adminUser}
              onUpdatePendingCount={setTicketsPendingCount}
            />
          )}

          {/* TAB: BUYER REVIEWS & SOCIAL PROOF MODERATION DESK */}
          {activeTab === 'reviews' && (
            <AdminReviewsView
              onStatsUpdated={(stats) =>
                setReviewsPendingCount(stats.pending_reviews)
              }
            />
          )}

          {/* TAB 3: PRODUCTS & INVENTORY */}
          {activeTab === 'products' && <AdminInventoryView />}

          {/* TAB 4: SYSTEM & PAYMENT GATEWAYS */}
          {activeTab === 'system' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm space-y-6">
              <h3 className="font-bold text-base text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-4">
                درگاه‌های پرداخت فعال سیستم (ذخیره شده در دیتابیس)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 bg-slate-50/50 dark:bg-slate-950/50">
                  <div className="font-bold text-slate-900 dark:text-white flex items-center justify-between">
                    <span>کیف پول آناهیکس (Balance)</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold">
                      پیش‌فرض
                    </span>
                  </div>
                  <p className="text-slate-500">
                    پرداخت درون‌برنامه‌ای با کارمزد ۰٪
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 bg-slate-50/50 dark:bg-slate-950/50">
                  <div className="font-bold text-slate-900 dark:text-white flex items-center justify-between">
                    <span>درگاه بانکی شاپرک / زرین‌پال</span>
                    <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-semibold">
                      فعال
                    </span>
                  </div>
                  <p className="text-slate-500">
                    پرداخت امن اینترنتی با کلیه کارت‌های شتاب
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 bg-slate-50/50 dark:bg-slate-950/50">
                  <div className="font-bold text-slate-900 dark:text-white flex items-center justify-between">
                    <span>کارت به کارت هوشمند</span>
                    <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-semibold">
                      فعال
                    </span>
                  </div>
                  <p className="text-slate-500">
                    انتقال مستقیم پایا/ساتنا و تایید رسید
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB: SMS GATEWAY SETTINGS & TESTING */}
          {activeTab === 'sms-gateway' && <SMSGatewayView />}

          {/* TAB: OFFICIAL TAX BILLING SETTINGS */}
          {activeTab === 'billing' && <AdminBillingSettingsView />}

          {/* TAB: TRANSACTIONS FINANCIAL LOG */}
          {activeTab === 'transactions' && <TransactionsLogView />}

          {/* TAB: ADMIN ACTION & AUDIT LOG */}
          {activeTab === 'audit-logs' && <AdminActionLogView />}
        </div>
      </div>

      {/* Admin Order Official Invoice Modal */}
      {adminInvoiceOrderNo && (
        <OfficialInvoiceModal
          isOpen={!!adminInvoiceOrderNo}
          onClose={() => setAdminInvoiceOrderNo(null)}
          orderIdOrNo={adminInvoiceOrderNo}
          isAdmin={true}
        />
      )}
    </div>
  )
}
