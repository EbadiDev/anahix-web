import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Cpu,
  Eye,
  EyeOff,
  Key,
  Layers,
  Link2,
  PackageCheck,
  Percent,
  Printer,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  Tag,
  Zap,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AdminBannersView } from '../../components/admin/AdminBannersView'
import { AdminBIAnalyticsView } from '../../components/admin/AdminBIAnalyticsView'
import { AdminCalendarView } from '../../components/admin/AdminCalendarView'
import { AdminContentView } from '../../components/admin/AdminContentView'
import { AdminCoreSettingsView } from '../../components/admin/AdminCoreSettingsView'
import { AdminCouponsView } from '../../components/admin/AdminCouponsView'
import { AdminHeaderBanner } from '../../components/admin/AdminHeaderBanner'
import { AdminInventoryView } from '../../components/admin/AdminInventoryView'
import { AdminLoyaltyTiersView } from '../../components/admin/AdminLoyaltyTiersView'
import { AdminOrdersTableView } from '../../components/admin/AdminOrdersTableView'
import {
  AdminSidebar,
  type AdminTabType,
} from '../../components/admin/AdminSidebar'
import { AdminSupportAndReviewsView } from '../../components/admin/AdminSupportAndReviewsView'
import { AdminUsersView } from '../../components/admin/AdminUsersView'
import { AdminVirtualNumbersView } from '../../components/admin/AdminVirtualNumbersView'
import { Header } from '../../components/Header'
import { OfficialInvoiceModal } from '../../components/invoice/OfficialInvoiceModal'
import { ConfirmModal } from '../../components/vibefarsi/ConfirmModal'
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
  const [vnStatus, setVnStatus] = useState<'active' | 'error' | 'disabled'>(
    'active',
  )
  const [deliveryStatus, setDeliveryStatus] = useState<
    'active' | 'error' | 'disabled'
  >('active')
  const [_settingsMsg, setSettingsMsg] = useState<{
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

  // Delivery Engine search & pagination
  const [groupSearch, setGroupSearch] = useState('')
  const [groupsPage, setGroupsPage] = useState(1)

  // Operator Queue state
  const [queueOrders, setQueueOrders] = useState<any[]>([])
  const [loadingQueue, setLoadingQueue] = useState(false)
  const [promptOrderId, setPromptOrderId] = useState<string | null>(null)
  const [promptMessage, setPromptMessage] = useState(
    'لطفاً کد تایید پیامک شده به گوشی خود را در بخش پیگیری وارد نمایید',
  )
  const [sendingPrompt, setSendingPrompt] = useState(false)
  const [completeConfirm, setCompleteConfirm] = useState<{
    isOpen: boolean
    orderId: string | null
    loading: boolean
  }>({
    isOpen: false,
    orderId: null,
    loading: false,
  })
  const [revealedCreds, setRevealedCreds] = useState<Record<string, boolean>>(
    {},
  )
  const [adminInvoiceOrderNo, setAdminInvoiceOrderNo] = useState<string | null>(
    null,
  )

  // Auth Guard & Automatic Admin Session Handshake
  useEffect(() => {
    const initAdminSession = async () => {
      // 1. If user is logged in as an admin customer on storefront, exchange token for fresh Admin JWT
      if (apiService.isCustomerLoggedIn()) {
        const exchanged = await apiService.exchangeAdminToken()
        if (exchanged) {
          const admUser = apiService.getAdminUser()
          setAdminUser(
            admUser || {
              username: 'admin',
              full_name: 'مدیر کل آناهیکس',
              role: 'super_admin',
            },
          )
          return
        }
      }

      // 2. Check existing admin token
      const token = apiService.getAdminToken()
      if (!token) {
        navigate('/admin/login')
        return
      }

      const user = apiService.getAdminUser()
      if (user) {
        setAdminUser(user)
      } else {
        apiService
          .getCustomerProfile()
          .then((cust) => {
            if (cust?.is_admin) {
              const adm = {
                username: cust.email || cust.phone,
                full_name: cust.full_name || 'مدیر سیستم',
                role: 'super_admin',
              }
              apiService.setAdminUser(adm)
              setAdminUser(adm)
            } else {
              navigate('/admin/login')
            }
          })
          .catch(() => {
            navigate('/admin/login')
          })
      }
    }

    initAdminSession()
  }, [navigate])

  const handleLogout = () => {
    apiService.clearAdminToken()
    navigate('/admin/login')
  }

  // Load Virtual Number Provider Settings
  const loadVirtualNumberSettings = async () => {
    try {
      const data = await apiService.getVirtualNumberSettings()
      setVnSettings(data)
      setVnStatus(data.enabled ? 'active' : 'disabled')
    } catch {
      setVnStatus('error')
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
        setDeliveryStatus(settings.enabled ? 'active' : 'disabled')
      } else {
        setDeliveryStatus('error')
      }
      setProductGroups(groups)
      setProviderCatalog(catalogItems)
    } catch {
      setDeliveryStatus('error')
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
    } else if (activeTab === 'delivery') {
      loadDeliveryEngineData()
    } else if (activeTab === 'queue') {
      loadQueueOrders()
    }
  }, [activeTab])

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
  const handleCompleteOrder = (orderId: string) => {
    setCompleteConfirm({
      isOpen: true,
      orderId,
      loading: false,
    })
  }

  const confirmCompleteOrder = async () => {
    if (!completeConfirm.orderId) return
    setCompleteConfirm((prev) => ({ ...prev, loading: true }))
    try {
      await apiService.completeAdminOrder(
        completeConfirm.orderId,
        'اکانت با موفقیت فعال شد',
      )
      setCompleteConfirm({ isOpen: false, orderId: null, loading: false })
      loadQueueOrders()
    } catch {
      setCompleteConfirm((prev) => ({ ...prev, loading: false }))
    }
  }

  // Delivery Engine filtered & paginated groups
  const filteredProductGroups = productGroups.filter((g) => {
    if (!groupSearch.trim()) return true
    const q = groupSearch.toLowerCase().trim()
    return (
      (g.group_title_fa || '').toLowerCase().includes(q) ||
      (g.group_tag || '').toLowerCase().includes(q) ||
      g.products.some(
        (p) =>
          (p.title_fa || '').toLowerCase().includes(q) ||
          (p.slug || '').toLowerCase().includes(q),
      )
    )
  })
  const GROUPS_PER_PAGE = 3
  const totalGroupPages =
    Math.ceil(filteredProductGroups.length / GROUPS_PER_PAGE) || 1
  const paginatedGroups = filteredProductGroups.slice(
    (groupsPage - 1) * GROUPS_PER_PAGE,
    groupsPage * GROUPS_PER_PAGE,
  )

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-background text-foreground flex font-sans transition-colors duration-200"
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
        vnStatus={vnStatus}
        deliveryEnabled={deliverySettings?.enabled}
        deliveryStatus={deliveryStatus}
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

          {/* TAB: COUPONS & DISCOUNT ENGINE */}
          {activeTab === 'coupons' && <AdminCouponsView />}

          {/* TAB -0.5: VIP CLUB & LOYALTY TIERS */}
          {activeTab === 'loyalty-tiers' && <AdminLoyaltyTiersView />}

          {/* TAB 0: 360-DEGREE USER MANAGEMENT */}
          {activeTab === 'users' && <AdminUsersView />}

          {/* TAB 0.5: ENHANCED ALL-ORDERS MANAGEMENT TABLE */}
          {activeTab === 'all-orders' && <AdminOrdersTableView />}

          {/* TAB 0.6: BLOG & KNOWLEDGE BASE SEO ENGINE */}
          {activeTab === 'content' && <AdminContentView />}

          {/* TAB 1: VIRTUAL NUMBERS SETTINGS & MANAGEMENT */}
          {activeTab === 'virtual-numbers' && <AdminVirtualNumbersView />}

          {/* TAB: DELIVERY ENGINE & INSTANT FULFILLMENT INTEGRATION */}
          {activeTab === 'delivery' && (
            <div className="space-y-6">
              {/* Unified Header Banner */}
              <AdminHeaderBanner
                icon={Zap}
                title="موتور هوشمند نحوه تحویل سفارشات (Delivery Engine)"
                subtitle="تعیین استراتژی تحویل کالا: تحویل دستی اپراتور در صف بررسی یا صدور آنی و خودکار توسط زیرساخت آناهیکس"
                badgeText="موتور تحویل هوشمند"
                actions={
                  <div className="bg-muted/40 border border-border/60 rounded-control p-3 shrink-0 min-w-[200px] text-right">
                    <div className="text-xs text-muted-foreground mb-1 flex items-center justify-between">
                      <span>موجودی مخزن تحویل آنی:</span>
                      <button
                        type="button"
                        onClick={loadDeliveryEngineData}
                        disabled={deliveryLoading}
                        className="p-1 hover:bg-card rounded-control transition-colors text-foreground cursor-pointer"
                        title="بروزرسانی داده‌ها"
                      >
                        <RefreshCw
                          className={`w-3.5 h-3.5 ${deliveryLoading ? 'animate-spin text-brand' : ''}`}
                        />
                      </button>
                    </div>
                    <div className="text-xl font-black text-foreground font-mono font-latin tracking-tight">
                      ${deliverySettings?.balance_usdt?.toFixed(2) || '0.00'}{' '}
                      <span className="text-xs font-normal text-muted-foreground font-sans">
                        USDT
                      </span>
                    </div>
                    <div className="text-[11px] text-muted-foreground font-latin">
                      معادل:{' '}
                      {(deliverySettings?.balance_toman || 0).toLocaleString(
                        'fa-IR',
                      )}{' '}
                      تومان
                    </div>
                  </div>
                }
              />

              {/* Strategy Priority Architecture Cards */}
              <div className="rounded-surface border border-border/80 bg-card p-5 space-y-4 shadow-surface text-foreground">
                <div>
                  <h4 className="text-sm font-black text-foreground flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-brand" />
                    دو استراتژی اصلی تحویل محصولات دیجیتال
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    تعیین شیوه تحویل محصولات دیجیتال به مشتریان
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Strategy 1: Manual Operator */}
                  <div className="p-4 rounded-surface border border-border/60 bg-muted/20 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2.5 mb-2">
                        <div className="w-8 h-8 rounded-control bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center">
                          <Clock className="w-4 h-4" />
                        </div>
                        <div>
                          <h5 className="text-sm font-bold text-foreground">
                            روش ۱: تحویل دستی اپراتور (Manual Operator Queue)
                          </h5>
                          <p className="text-[11px] text-muted-foreground">
                            پردازش در میز کار اپراتور با تبادل رمز یا ۲FA
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        کاربر پس از پرداخت در صف انجام سفارش قرار می‌گیرد.
                        اپراتور سیستم به صورت دستی اکانت، دعوت‌نامه فمیلی یا کد
                        ۲FA را بررسی و کالا را تحویل می‌دهد.
                      </p>
                    </div>
                    <div className="mt-3 pt-3 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>
                        مناسب برای: ارتقای اکانت‌های شخصی، اکانت‌های اختصاصی با
                        ۲FA
                      </span>
                    </div>
                  </div>

                  {/* Strategy 2: Instant API Fulfillment */}
                  <div className="p-4 rounded-surface border border-brand/30 bg-brand/5 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2.5 mb-2">
                        <div className="w-8 h-8 rounded-control bg-brand text-white flex items-center justify-center shadow-control">
                          <Zap className="w-4 h-4" />
                        </div>
                        <div>
                          <h5 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                            روش ۲: تحویل آنی و خودکار آناهیکس (Instant Delivery)
                            <span className="text-[10px] px-1.5 py-0.5 rounded-control bg-brand/10 text-brand font-bold">
                              خودکار ۰ ثانیه
                            </span>
                          </h5>
                          <p className="text-[11px] text-muted-foreground">
                            تحویل آنی از انبار لایسنس‌ها و اشتراک‌های جهانی
                            آناهیکس
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        صدور و تحویل خودکار و آنی کد لایسنس یا لینک فعال‌سازی در
                        لحظه پرداخت به مشتری. در صورت نیاز به بررسی تکمیلی،
                        سفارش به صورت خودکار و هوشمند به میز کار اپراتور هدایت
                        می‌شود.
                      </p>
                    </div>
                    <div className="mt-3 pt-3 border-t border-border/60 flex items-center justify-between text-[11px] text-brand font-medium">
                      <span>
                        مناسب برای: جمینای ۱۸ ماهه، مانوس، ریسند، سوپابیس، لینیر
                        و لایسنس‌ها
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Instant Delivery API Settings Form */}
              <div className="bg-card rounded-surface border border-border/80 p-5 sm:p-6 shadow-surface space-y-4 text-foreground">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-control bg-secondary text-brand border border-border/60 flex items-center justify-center shrink-0">
                      <Key className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-foreground">
                        پیکربندی کلید اتصال مخزن تحویل آنی آناهیکس
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        تنظیم کلید دسترسی به انبار مرکزی تحویل آنی و مارجین سود
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground font-bold">
                      وضعیت زیرساخت آنی:
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setProviderEnabledToggle(!providerEnabledToggle)
                      }
                      className={`px-3 py-1 rounded-control text-xs font-bold transition-all cursor-pointer ${
                        providerEnabledToggle
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-muted text-muted-foreground border border-border/60'
                      }`}
                    >
                      {providerEnabledToggle ? 'فعال' : 'غیرفعال'}
                    </button>
                  </div>
                </div>

                {/* Formatted Status Message */}
                {deliverySettings?.status_message &&
                  (deliverySettings.status_message.includes('404') ||
                  deliverySettings.status_message.includes('error') ? (
                    <div className="p-3.5 rounded-surface border border-amber-500/30 bg-amber-500/10 text-amber-500 text-xs font-bold flex items-center gap-2.5 animate-in fade-in">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>
                        کلید اتصال مخزن آنی تنظیم نشده یا در دسترس نیست. جهت
                        فعال‌سازی تحویل خودکار، کلید معتبر را در فیلد زیر ثبت
                        نمایید.
                      </span>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-surface border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-bold flex items-center gap-2.5 animate-in fade-in">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{deliverySettings.status_message}</span>
                    </div>
                  ))}

                <form
                  onSubmit={handleSaveDeliverySettings}
                  className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end pt-1"
                >
                  <div className="md:col-span-2 space-y-1.5 text-right">
                    <label className="block text-xs font-bold text-foreground">
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
                        className="w-full h-10 px-3.5 pr-10 pl-10 text-xs rounded-field border border-border/60 bg-muted/20 text-foreground font-mono font-latin outline-none focus:border-brand"
                      />
                      <Key className="w-4 h-4 text-muted-foreground absolute right-3.5 top-3 pointer-events-none" />
                      <button
                        type="button"
                        onClick={() => setShowProviderKey(!showProviderKey)}
                        className="absolute left-3.5 top-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        {showProviderKey ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-right">
                    <label className="block text-xs font-bold text-foreground">
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
                        className="w-full h-10 px-3.5 pr-9 text-xs rounded-field border border-border/60 bg-muted/20 text-foreground font-mono font-latin outline-none focus:border-brand"
                      />
                      <Percent className="w-4 h-4 text-muted-foreground absolute right-3 top-3 pointer-events-none" />
                    </div>
                  </div>

                  <div className="md:col-span-3 flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={deliverySaveLoading}
                      className="h-10 px-6 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs transition-all shadow-control cursor-pointer duration-motion active:scale-[0.98] disabled:opacity-50"
                    >
                      {deliverySaveLoading
                        ? 'در حال ذخیره...'
                        : 'ذخیره تنظیمات تحویل آنی'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Product Groups & Delivery Strategy Router */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card rounded-surface border border-border/80 p-4 shadow-surface">
                  <div>
                    <h4 className="text-sm sm:text-base font-black text-foreground flex items-center gap-2">
                      <Tag className="w-4 h-4 text-brand" />
                      مدیریت گروه‌ها، نحوه تحویل و اتصال به مخزن لایسنس‌های
                      آناهیکس
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      تعیین شیوه تحویل برای هر گروه محصول و اتصال مستقیم به
                      انبار مرکزی
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5">
                    {/* Search Groups / Products */}
                    <div className="relative">
                      <Search className="w-4 h-4 text-muted-foreground absolute right-3 top-2.5 pointer-events-none" />
                      <input
                        type="text"
                        value={groupSearch}
                        onChange={(e) => {
                          setGroupSearch(e.target.value)
                          setGroupsPage(1)
                        }}
                        placeholder="جستجوی گروه یا محصول..."
                        className="h-9 pr-9 pl-3 w-48 sm:w-56 rounded-control border border-border/60 bg-muted/20 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-brand"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={loadDeliveryEngineData}
                      className="h-9 px-3 rounded-control border border-border/60 bg-secondary text-secondary-foreground text-xs font-bold hover:bg-muted transition-colors flex items-center gap-1.5 cursor-pointer shadow-control"
                      title="به‌روزرسانی گروه‌ها"
                    >
                      <RefreshCw
                        className={`w-3.5 h-3.5 ${loadingGroups || loadingCatalog ? 'animate-spin text-brand' : ''}`}
                      />
                      <span className="hidden sm:inline">به‌روزرسانی</span>
                    </button>
                  </div>
                </div>

                {/* Group Cards List */}
                {paginatedGroups.length === 0 ? (
                  <div className="bg-card rounded-surface border border-border/80 p-8 text-center text-muted-foreground text-xs shadow-surface">
                    گروهی با عبارت «{groupSearch}» یافت نشد.
                  </div>
                ) : (
                  paginatedGroups.map((group) => {
                    const isGroupInstant =
                      group.delivery_strategy === 'third_party_instant'
                    return (
                      <div
                        key={group.group_tag}
                        className="bg-card rounded-surface border border-border/80 overflow-hidden shadow-surface transition-all text-foreground space-y-0"
                      >
                        {/* Group Header Bar */}
                        <div className="p-4 sm:p-5 bg-muted/20 border-b border-border/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-control bg-secondary text-brand border border-border/60 flex items-center justify-center font-bold shrink-0 shadow-control">
                              <Tag className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h5 className="text-sm font-black text-foreground">
                                  {group.group_title_fa}
                                </h5>
                                <span className="text-[10px] px-2 py-0.5 rounded-control bg-secondary text-secondary-foreground font-mono font-latin border border-border/60">
                                  #{group.group_tag}
                                </span>
                                <span className="text-[11px] text-muted-foreground font-latin">
                                  ({group.products_count} محصول)
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                استراتژی فعال گروه:{' '}
                                <span
                                  className={
                                    isGroupInstant
                                      ? 'text-emerald-400 font-bold'
                                      : 'text-brand font-bold'
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
                          <div className="flex items-center bg-muted/40 border border-border/60 p-1 rounded-control gap-1 self-stretch sm:self-auto">
                            <button
                              type="button"
                              disabled={groupUpdateLoading[group.group_tag]}
                              onClick={() =>
                                handleToggleGroupStrategy(
                                  group.group_tag,
                                  'manual_operator',
                                )
                              }
                              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-control text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer duration-motion active:scale-[0.98] ${
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
                              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-control text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer duration-motion active:scale-[0.98] ${
                                isGroupInstant
                                  ? 'bg-brand text-white font-black shadow-control'
                                  : 'text-muted-foreground hover:text-foreground'
                              }`}
                            >
                              <Zap className="w-3.5 h-3.5" />
                              <span>تحویل آنی و خودکار</span>
                            </button>
                          </div>
                        </div>

                        {/* Products Table in Group */}
                        <div className="overflow-x-auto">
                          <table className="w-full text-right text-xs">
                            <thead>
                              <tr className="border-b border-border/60 bg-muted/10 text-muted-foreground font-bold">
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
                            <tbody className="divide-y divide-border/60">
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
                                    className="hover:bg-muted/20 transition-colors"
                                  >
                                    <td className="py-3.5 px-4">
                                      <div className="font-bold text-foreground">
                                        {prod.title_fa}
                                      </div>
                                      <div className="text-[10px] text-muted-foreground font-mono font-latin mt-0.5">
                                        {prod.slug}
                                      </div>
                                    </td>

                                    <td className="py-3.5 px-4 font-mono font-latin font-bold text-foreground">
                                      {prod.price_toman.toLocaleString('fa-IR')}{' '}
                                      <span className="font-sans font-normal text-muted-foreground text-[10px]">
                                        تومان
                                      </span>
                                    </td>

                                    <td className="py-3.5 px-4">
                                      <span
                                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-control text-[11px] font-bold ${
                                          isProdInstant
                                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                            : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
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
                                          className="w-full text-xs py-2 px-3 rounded-control border border-border/60 bg-card text-foreground focus:border-brand font-mono font-latin outline-none"
                                        >
                                          <option value={0}>
                                            -- بدون اتصال به مخزن آنی (تحویل
                                            دستی در صف اپراتور) --
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
                                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-brand absolute left-3 top-2.5" />
                                        )}
                                      </div>
                                    </td>

                                    <td className="py-3.5 px-4">
                                      {isLinked ? (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-control text-[11px] font-bold bg-brand/10 text-brand border border-brand/20 font-latin">
                                          <Link2 className="w-3 h-3" />
                                          <span>
                                            متصل به #{prod.external_product_id}
                                          </span>
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-control text-[11px] text-muted-foreground bg-muted/40">
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
                  })
                )}

                {/* Pagination for Groups */}
                {totalGroupPages > 1 && (
                  <div className="flex items-center justify-between p-3 bg-card rounded-surface border border-border/80 shadow-surface text-xs">
                    <span className="text-muted-foreground">
                      صفحه {groupsPage} از {totalGroupPages} (مجموع{' '}
                      {filteredProductGroups.length} گروه)
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={groupsPage <= 1}
                        onClick={() => setGroupsPage((p) => p - 1)}
                        className="p-1.5 rounded-control border border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-40 cursor-pointer"
                        title="صفحه قبلی"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      {Array.from(
                        { length: totalGroupPages },
                        (_, i) => i + 1,
                      ).map((pNum) => (
                        <button
                          key={`grp-page-btn-${pNum}`}
                          type="button"
                          onClick={() => setGroupsPage(pNum)}
                          className={`w-7 h-7 rounded-control font-bold font-latin cursor-pointer transition-colors ${
                            groupsPage === pNum
                              ? 'bg-primary text-primary-foreground font-black'
                              : 'hover:bg-muted text-muted-foreground'
                          }`}
                        >
                          {pNum}
                        </button>
                      ))}
                      <button
                        type="button"
                        disabled={groupsPage >= totalGroupPages}
                        onClick={() => setGroupsPage((p) => p + 1)}
                        className="p-1.5 rounded-control border border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-40 cursor-pointer"
                        title="صفحه بعدی"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Provider Live Catalog Reference Explorer */}
              <div className="bg-card rounded-surface border border-border/80 p-6 shadow-surface space-y-4 text-foreground">
                <div className="flex items-center justify-between border-b border-border/60 pb-4">
                  <div>
                    <h4 className="text-sm font-black text-foreground flex items-center gap-2">
                      <PackageCheck className="w-4 h-4 text-brand" />
                      انبار لایسنس‌ها و اشتراک‌های آماده تحویل آنی آناهیکس (مجموع{' '}
                      {providerCatalog.length} محصول)
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      استعلام لحظه‌ای لایسنس‌ها، قیمت‌های پایه ارزی و موجودی زنده
                      مخزن جهت تحویل فوری به خریداران
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground font-mono font-latin">
                    {providerCatalog.length} محصول موجود
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {providerCatalog.map((p) => (
                    <div
                      key={p.id}
                      className="p-3.5 rounded-control border border-border/60 bg-muted/20 flex flex-col justify-between hover:border-brand/40 transition-colors"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-bold text-xs text-foreground line-clamp-1">
                            {p.name}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-control bg-secondary text-secondary-foreground font-mono font-latin">
                            #{p.id}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
                          {p.description || 'تحویل آنی لینک یا کد فعال‌سازی'}
                        </p>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-border/60 flex items-center justify-between text-xs">
                        <span className="font-mono font-bold text-brand font-latin">
                          ${p.price_usdt.toFixed(2)} USDT
                        </span>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-control ${
                            p.stock > 0
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-muted text-muted-foreground'
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
              <AdminHeaderBanner
                icon={Layers}
                title="میز کار اپراتور تحویل سفارشات (Mode C / 2FA)"
                subtitle="مدیریت و ورود به اکانت‌های ارتقای شخصی کاربران، درخواست کد ۲FA و اجرای پروتکل امنیتی Zeroize"
                badgeText={
                  queueOrders.length > 0
                    ? `${queueOrders.length} سفارش در صف`
                    : 'صف خلوت است'
                }
                badgeVariant={queueOrders.length > 0 ? 'warning' : 'success'}
                actions={
                  <button
                    type="button"
                    onClick={loadQueueOrders}
                    disabled={loadingQueue}
                    className="h-9 px-4 rounded-control bg-secondary text-secondary-foreground border border-border/60 hover:bg-muted text-xs font-bold transition-all shadow-control flex items-center gap-2 cursor-pointer duration-motion active:scale-[0.98]"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 ${loadingQueue ? 'animate-spin' : ''}`}
                    />
                    <span>بروزرسانی صف</span>
                  </button>
                }
              />

              {queueOrders.length === 0 ? (
                <div className="bg-card rounded-surface border border-border/80 p-12 text-center text-muted-foreground shadow-surface space-y-3">
                  <div className="w-12 h-12 rounded-control bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto shadow-control">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="font-black text-base text-foreground">
                    صف خلوت است!
                  </h4>
                  <p className="text-xs text-muted-foreground">
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
                        className={`bg-card text-card-foreground rounded-surface border p-6 shadow-surface space-y-4 relative transition ${
                          isVIP
                            ? 'border-amber-500/50 shadow-amber-500/10 ring-1 ring-amber-500/20'
                            : isSilver
                              ? 'border-border/80'
                              : 'border-border/60'
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

          {/* TAB: SUPPORT, TICKETS & REVIEWS (UNIFIED CUSTOMER RELATIONS DESK) */}
          {(activeTab === 'support' ||
            activeTab === 'tickets' ||
            activeTab === 'reviews') && (
            <AdminSupportAndReviewsView
              adminUser={adminUser}
              initialTab={activeTab === 'reviews' ? 'reviews' : 'tickets'}
              onTicketsCountUpdated={setTicketsPendingCount}
              onReviewsStatsUpdated={(stats) =>
                setReviewsPendingCount(stats.pending_reviews)
              }
            />
          )}

          {/* TAB 3: PRODUCTS & INVENTORY */}
          {activeTab === 'products' && <AdminInventoryView />}

          {/* TAB: SYSTEM & CORE CONFIGURATION (UNIFIED SETTINGS DESK) */}
          {activeTab === 'settings' && <AdminCoreSettingsView />}
          {activeTab === ('billing' as any) && (
            <AdminCoreSettingsView initialSubTab="billing" />
          )}
          {activeTab === ('sms-gateway' as any) && (
            <AdminCoreSettingsView initialSubTab="sms" />
          )}
          {activeTab === ('system' as any) && (
            <AdminCoreSettingsView initialSubTab="gateways" />
          )}
          {activeTab === ('audit-logs' as any) && (
            <AdminCoreSettingsView initialSubTab="audit-logs" />
          )}
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

      {/* Complete Order Confirmation Modal */}
      <ConfirmModal
        isOpen={completeConfirm.isOpen}
        title="تکمیل سفارش و پاکسازی کلمه عبور (Zeroize)"
        message="آیا از اتمام و تحویل این سفارش و سوزاندن قطعی و غیرقابل بازگشت رمز عبور کاربر از دیتابیس اطمینان دارید؟"
        confirmText="بله، سفارش تکمیل و پسورد Zeroize شود"
        cancelText="انصراف"
        loading={completeConfirm.loading}
        onConfirm={confirmCompleteOrder}
        onClose={() =>
          setCompleteConfirm({ isOpen: false, orderId: null, loading: false })
        }
      />
    </div>
  )
}
