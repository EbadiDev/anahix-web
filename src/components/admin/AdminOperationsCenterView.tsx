import {
  Bot,
  Boxes,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Eye,
  EyeOff,
  FolderTree,
  Key,
  Layers,
  Package,
  Printer,
  Radio,
  RefreshCw,
  Send,
  Zap,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { apiService } from '../../services/api'
import { toPersianDigits } from '../../utils/formatters'
import { OfficialInvoiceModal } from '../invoice/OfficialInvoiceModal'
import { ConfirmModal } from '../vibefarsi/ConfirmModal'
import { LoadingState } from '../vibefarsi/LoadingState'
import { ModalCloseButton } from '../vibefarsi/ModalCloseButton'
import { useNotification } from '../vibefarsi/NotificationContext'
import { SearchInput } from '../vibefarsi/SearchInput'
import { AdminBotSettingsView } from './AdminBotSettingsView'
import { AdminCategoriesView } from './AdminCategoriesView'
import { AdminHeaderBanner } from './AdminHeaderBanner'
import { AdminInventoryView } from './AdminInventoryView'
import { AdminVirtualNumbersView } from './AdminVirtualNumbersView'
import { FetchBotModal } from './FetchBotModal'

export type OperationsSubTab =
  | 'products'
  | 'inventory'
  | 'bot-settings'
  | 'categories'
  | 'queue'
  | 'virtual-numbers'

interface AdminOperationsCenterViewProps {
  initialTab?: OperationsSubTab
  onQueueCountUpdated?: (count: number) => void
}

export const AdminOperationsCenterView: React.FC<
  AdminOperationsCenterViewProps
> = ({ initialTab = 'products', onQueueCountUpdated }) => {
  const { success: notifySuccess, error: notifyError } = useNotification()
  const [activeTab, setActiveTab] = useState<OperationsSubTab>(initialTab)

  // Fetch Bot Modal
  const [isFetchBotModalOpen, setIsFetchBotModalOpen] = useState(false)

  // Operator Queue State
  const [queueOrders, setQueueOrders] = useState<any[]>([])
  const [queueFilter, setQueueFilter] = useState<string>('all')
  const [queueSearch, setQueueSearch] = useState<string>('')
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
  const [copiedQueueId, setCopiedQueueId] = useState<string | null>(null)

  const handleCopyQueueText = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedQueueId(id)
    notifySuccess('کپی شد', 'در کلیپ‌بورد کپی شد.')
    setTimeout(() => setCopiedQueueId(null), 2000)
  }
  const [adminInvoiceOrderNo, setAdminInvoiceOrderNo] = useState<string | null>(
    null,
  )
  const [retryingOrder, setRetryingOrder] = useState<Record<string, boolean>>(
    {},
  )

  // Sync initial tab when changed from props
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab)
    }
  }, [initialTab])

  // Load Operator Queue Orders
  const loadQueueOrders = async () => {
    setLoadingQueue(true)
    try {
      const orders = await apiService.getAdminQueueOrders().catch(() => [])
      setQueueOrders(orders)
      if (onQueueCountUpdated) {
        onQueueCountUpdated(orders.length)
      }
    } finally {
      setLoadingQueue(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'queue') {
      loadQueueOrders()
    }
  }, [activeTab])

  // Send 2FA prompt to customer
  const handleSend2FAPrompt = async (orderId: string) => {
    setSendingPrompt(true)
    try {
      await apiService.requestAdmin2FA(orderId, promptMessage)
      setPromptOrderId(null)
      notifySuccess(
        'اعلان ۲FA ارسال شد',
        'پیام درخواست کد تایید دو مرحله‌ای به خریدار ارسال گردید.',
      )
      loadQueueOrders()
    } catch (err: any) {
      notifyError('خطا در ارسال اعلان', err.message)
    } finally {
      setSendingPrompt(false)
    }
  }

  // Complete order & execute zeroize
  const confirmCompleteOrder = async () => {
    if (!completeConfirm.orderId) return
    setCompleteConfirm((prev) => ({ ...prev, loading: true }))
    try {
      await apiService.completeAdminOrder(
        completeConfirm.orderId,
        'اکانت با موفقیت فعال و لایسنس تحویل داده شد',
      )
      setCompleteConfirm({ isOpen: false, orderId: null, loading: false })
      notifySuccess(
        'سفارش تکمیل و Zeroize شد',
        'سفارش با موفقیت به پایان رسید و کلمه عبور خریدار به صورت قطعی سوزانده شد.',
      )
      loadQueueOrders()
    } catch (err: any) {
      setCompleteConfirm((prev) => ({ ...prev, loading: false }))
      notifyError('خطا در تکمیل سفارش', err.message)
    }
  }

  // Auto-Fulfill Retry when bot wallet/stock is charged
  const handleRetryBotFulfillment = async (orderNumber: string) => {
    setRetryingOrder((prev) => ({ ...prev, [orderNumber]: true }))
    try {
      const res = await apiService.retryOrderBotFulfillment(orderNumber)
      notifySuccess(
        'صدور آنی از ربات انجام شد',
        res.message || 'سفارش با موفقیت از ربات تامین و تکمیل گردید.',
      )
      loadQueueOrders()
    } catch (err: any) {
      notifyError('تلاش مجدد ناموفق', err.message || 'خطا در صدور از ربات')
    } finally {
      setRetryingOrder((prev) => ({ ...prev, [orderNumber]: false }))
    }
  }

  return (
    <div className="space-y-6">
      {/* Unified Master Header Banner */}
      <AdminHeaderBanner
        icon={Boxes}
        title="مرکز جامع عملیات، کاتالوگ محصولات و انبار تحویل"
        subtitle="مدیریت متمرکز کاتالوگ، ۵ ربات تامین‌کننده، دسته‌بندی‌های تو در تو، لایسنس‌ها، صف اپراتور و شماره‌های مجازی"
        badgeText="میز کار یکپارچه عملیات"
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsFetchBotModalOpen(true)}
              className="h-9 sm:h-10 px-3.5 sm:px-4 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs shadow-control flex items-center gap-2 cursor-pointer duration-motion active:scale-[0.98]"
            >
              <Bot className="w-4 h-4" />
              <span>استخراج هوشمند از ربات‌ها</span>
            </button>
          </div>
        }
      />

      {/* Vibe Farsi Segmented Subtab Navigation Bar */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-surface border border-border/80 bg-card overflow-x-auto shadow-surface scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab('products')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-control text-xs font-bold transition-all whitespace-nowrap cursor-pointer duration-motion active:scale-[0.98] ${
            activeTab === 'products'
              ? 'bg-primary text-primary-foreground font-black shadow-control'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>محصولات و کاتالوگ ربات‌ها</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('inventory')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-control text-xs font-bold transition-all whitespace-nowrap cursor-pointer duration-motion active:scale-[0.98] ${
            activeTab === 'inventory'
              ? 'bg-primary text-primary-foreground font-black shadow-control'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <Key className="w-4 h-4" />
          <span>انبار لایسنس و کلیدها</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('bot-settings')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-control text-xs font-bold transition-all whitespace-nowrap cursor-pointer duration-motion active:scale-[0.98] ${
            activeTab === 'bot-settings'
              ? 'bg-primary text-primary-foreground font-black shadow-control'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <Key className="w-4 h-4" />
          <span>کلیدهای API</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('categories')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-control text-xs font-bold transition-all whitespace-nowrap cursor-pointer duration-motion active:scale-[0.98] ${
            activeTab === 'categories'
              ? 'bg-primary text-primary-foreground font-black shadow-control'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <FolderTree className="w-4 h-4" />
          <span>دسته‌بندی‌ها و زیرگروه‌ها</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('queue')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-control text-xs font-bold transition-all whitespace-nowrap cursor-pointer duration-motion active:scale-[0.98] ${
            activeTab === 'queue'
              ? 'bg-primary text-primary-foreground font-black shadow-control'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>صف سفارشات دستی اپراتور</span>
          {queueOrders.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black animate-pulse">
              {queueOrders.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('virtual-numbers')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-control text-xs font-bold transition-all whitespace-nowrap cursor-pointer duration-motion active:scale-[0.98] ${
            activeTab === 'virtual-numbers'
              ? 'bg-primary text-primary-foreground font-black shadow-control'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <Radio className="w-4 h-4" />
          <span>شماره‌های مجازی (5SIM)</span>
        </button>
      </div>

      {/* TAB 1 & 2: Products & Bots Catalog / Inventory License Keys */}
      {(activeTab === 'products' || activeTab === 'inventory') && (
        <AdminInventoryView
          defaultSubTab={activeTab === 'inventory' ? 'inventory' : 'catalog'}
          hideHeaderTabs={true}
          onOpenFetchBotModal={() => setIsFetchBotModalOpen(true)}
        />
      )}

      {/* TAB 3: BOT API KEYS */}
      {activeTab === 'bot-settings' && <AdminBotSettingsView />}

      {/* TAB 5: HIERARCHICAL STORE CATEGORIES & GROUPS */}
      {activeTab === 'categories' && <AdminCategoriesView />}

      {/* TAB 6: Operator Queue Desk */}
      {activeTab === 'queue' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Top 4 KPI Cards for Operator Queue */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-surface border border-border/80 bg-card space-y-1 text-right shadow-surface">
              <div className="flex items-center justify-between text-muted-foreground text-xs font-bold">
                <span>کل سفارشات در صف</span>
                <Layers className="w-4 h-4 text-brand" />
              </div>
              <div className="text-xl sm:text-2xl font-black font-mono font-latin text-foreground">
                {toPersianDigits(queueOrders.length)}
              </div>
            </div>

            <div className="p-4 rounded-surface border border-amber-500/30 bg-amber-500/5 space-y-1 text-right shadow-xs">
              <div className="flex items-center justify-between text-amber-500 text-xs font-bold">
                <span>در انتظار اقدام مشتری (۲FA)</span>
                <Clock className="w-4 h-4" />
              </div>
              <div className="text-xl sm:text-2xl font-black font-mono font-latin text-amber-500">
                {toPersianDigits(
                  queueOrders.filter(
                    (o) => o.status === 'awaiting_customer_action',
                  ).length,
                )}
              </div>
            </div>

            <div className="p-4 rounded-surface border border-blue-500/30 bg-blue-500/5 space-y-1 text-right shadow-xs">
              <div className="flex items-center justify-between text-blue-500 text-xs font-bold">
                <span>در انتظار ورود اپراتور</span>
                <Send className="w-4 h-4" />
              </div>
              <div className="text-xl sm:text-2xl font-black font-mono font-latin text-blue-500">
                {toPersianDigits(
                  queueOrders.filter(
                    (o) =>
                      o.status === 'pending_operator' || o.status === 'pending',
                  ).length,
                )}
              </div>
            </div>

            <div className="p-4 rounded-surface border border-purple-500/30 bg-purple-500/5 space-y-1 text-right shadow-xs">
              <div className="flex items-center justify-between text-purple-400 text-xs font-bold">
                <span>در حال پردازش</span>
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="text-xl sm:text-2xl font-black font-mono font-latin text-purple-400">
                {toPersianDigits(
                  queueOrders.filter((o) => o.status === 'processing').length,
                )}
              </div>
            </div>
          </div>

          {/* Action & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card rounded-surface border border-border/80 p-4 shadow-surface">
            <div>
              <h4 className="text-sm font-black text-foreground flex items-center gap-2">
                <Layers className="w-4 h-4 text-brand" />
                صف سفارشات دستی اپراتور (هندشیک تعاملی ۲FA)
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                پردازش دستی، درخواست کد ۲FA، اجرای Zeroize و تلاش مجدد صدور آنی
                پس از شارژ موجودی ربات
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="w-52">
                <SearchInput
                  value={queueSearch}
                  onChange={setQueueSearch}
                  placeholder="جستجو در سفارشات صف..."
                  debounceMs={250}
                />
              </div>

              <select
                value={queueFilter}
                onChange={(e) => setQueueFilter(e.target.value)}
                className="h-9 px-3 rounded-control border border-border/60 bg-secondary text-xs font-bold text-foreground outline-none cursor-pointer"
              >
                <option value="all">همه سفارشات صف</option>
                <option value="awaiting_customer_action">
                  در انتظار اقدام مشتری (۲FA)
                </option>
                <option value="pending_operator">در انتظار ورود اپراتور</option>
                <option value="processing">در حال پردازش</option>
              </select>

              <button
                type="button"
                onClick={loadQueueOrders}
                disabled={loadingQueue}
                className="h-9 px-4 rounded-control bg-secondary text-secondary-foreground border border-border/60 hover:bg-muted text-xs font-bold transition-all shadow-control flex items-center gap-2 cursor-pointer"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${loadingQueue ? 'animate-spin text-brand' : ''}`}
                />
                <span>بروزرسانی صف</span>
              </button>
            </div>
          </div>

          {loadingQueue ? (
            <div className="bg-card rounded-surface border border-border/80 shadow-surface">
              <LoadingState
                message="در حال فراخوانی صف سفارشات اپراتور..."
                subMessage="بررسی وضعیت کدهای ۲FA و سفارشات دستی اپراتور"
              />
            </div>
          ) : queueOrders.length === 0 ? (
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5">
              {queueOrders
                .filter((ord: any) => {
                  if (queueFilter !== 'all' && ord.status !== queueFilter)
                    return false
                  if (!queueSearch.trim()) return true
                  const q = queueSearch.toLowerCase().trim()
                  return (
                    (ord.order_number || '').toLowerCase().includes(q) ||
                    (ord.customer_phone || '').includes(q) ||
                    (ord.account_email || '').toLowerCase().includes(q) ||
                    (ord.product_title || '').toLowerCase().includes(q)
                  )
                })
                .map((ord: any) => {
                  const oid = ord.order_id || ord.id || ord.order_number
                  const statusBadge = (() => {
                    switch (ord.status) {
                      case 'awaiting_customer_action':
                        return {
                          label: 'در انتظار اقدام مشتری (کد ۲FA)',
                          classes:
                            'bg-amber-500/10 text-amber-500 border-amber-500/30 animate-pulse',
                        }
                      case 'pending_operator':
                      case 'pending':
                        return {
                          label: 'در انتظار ورود اپراتور',
                          classes:
                            'bg-blue-500/10 text-blue-400 border-blue-500/30',
                        }
                      case 'processing':
                        return {
                          label: 'در حال پردازش',
                          classes:
                            'bg-purple-500/10 text-purple-400 border-purple-500/30',
                        }
                      case 'completed':
                        return {
                          label: 'تکمیل شده',
                          classes:
                            'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
                        }
                      default:
                        return {
                          label: ord.status,
                          classes:
                            'bg-muted text-muted-foreground border-border/60',
                        }
                    }
                  })()

                  return (
                    <div
                      key={oid}
                      className="bg-card rounded-surface border border-border/80 p-4 sm:p-5 shadow-surface space-y-3.5 relative flex flex-col justify-between hover:border-brand/40 transition-colors"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between border-b border-border/60 pb-3 gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-brand">
                              <span>#{ord.order_number}</span>
                              <button
                                type="button"
                                onClick={() =>
                                  handleCopyQueueText(
                                    ord.order_number,
                                    `ord-${ord.order_number}`,
                                  )
                                }
                                className="p-0.5 text-muted-foreground hover:text-brand cursor-pointer"
                                title="کپی شماره سفارش"
                              >
                                {copiedQueueId === `ord-${ord.order_number}` ? (
                                  <Check className="w-3 h-3 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                            <h4
                              className="font-bold text-xs sm:text-sm text-foreground mt-0.5 truncate"
                              title={
                                ord.product_title ||
                                ord.items?.[0]?.product_title
                              }
                            >
                              {ord.product_title ||
                                ord.items?.[0]?.product_title ||
                                'سفارش هوش مصنوعی'}
                            </h4>
                          </div>
                          <span
                            className={`px-2.5 py-0.5 rounded-control text-[10px] font-bold border shrink-0 ${statusBadge.classes}`}
                          >
                            {statusBadge.label}
                          </span>
                        </div>

                        <div className="text-xs space-y-2 bg-muted/20 p-3 rounded-control border border-border/60 text-right">
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground text-[11px]">
                              مشتری:
                            </span>
                            <span className="font-mono font-latin text-foreground font-bold">
                              {ord.customer_phone || '-'}
                            </span>
                          </div>
                          {ord.account_email && (
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground text-[11px]">
                                ایمیل اکانت:
                              </span>
                              <div className="flex items-center gap-1.5 font-mono font-latin text-foreground truncate max-w-[170px]">
                                <span className="truncate">
                                  {ord.account_email}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleCopyQueueText(
                                      ord.account_email,
                                      `email-${oid}`,
                                    )
                                  }
                                  className="p-0.5 text-muted-foreground hover:text-brand cursor-pointer shrink-0"
                                  title="کپی ایمیل"
                                >
                                  {copiedQueueId === `email-${oid}` ? (
                                    <Check className="w-3 h-3 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                            </div>
                          )}
                          {ord.account_password && (
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground text-[11px]">
                                رمز عبور:
                              </span>
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono font-latin text-foreground font-bold">
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
                                  className="p-0.5 text-muted-foreground hover:text-foreground cursor-pointer"
                                  title="نمایش/مخفی‌سازی رمز"
                                >
                                  {revealedCreds[oid] ? (
                                    <EyeOff className="w-3.5 h-3.5" />
                                  ) : (
                                    <Eye className="w-3.5 h-3.5" />
                                  )}
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleCopyQueueText(
                                      ord.account_password,
                                      `pass-${oid}`,
                                    )
                                  }
                                  className="p-0.5 text-muted-foreground hover:text-brand cursor-pointer"
                                  title="کپی رمز عبور"
                                >
                                  {copiedQueueId === `pass-${oid}` ? (
                                    <Check className="w-3 h-3 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                            </div>
                          )}
                          {ord.two_factor_code && (
                            <div className="flex justify-between items-center bg-emerald-500/10 p-2 rounded-control border border-emerald-500/20 text-emerald-400">
                              <span className="font-bold text-[11px]">
                                کد ۲FA کاربر:
                              </span>
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono font-latin text-base font-black tracking-widest">
                                  {ord.two_factor_code}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleCopyQueueText(
                                      ord.two_factor_code,
                                      `2fa-${oid}`,
                                    )
                                  }
                                  className="p-0.5 text-emerald-400 hover:text-emerald-300 cursor-pointer"
                                  title="کپی کد ۲FA"
                                >
                                  {copiedQueueId === `2fa-${oid}` ? (
                                    <Check className="w-3 h-3 text-emerald-300" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-border/40 flex-wrap">
                        <button
                          type="button"
                          onClick={() =>
                            setAdminInvoiceOrderNo(ord.order_number)
                          }
                          className="h-8 px-2.5 rounded-control border border-border/60 bg-secondary hover:bg-muted text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                          title="مشاهده فاکتور رسمی"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>فاکتور</span>
                        </button>

                        {ord.can_retry_fulfillment && (
                          <button
                            type="button"
                            disabled={retryingOrder[ord.order_number]}
                            onClick={() =>
                              handleRetryBotFulfillment(ord.order_number)
                            }
                            className="h-8 px-2.5 rounded-control border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-black transition-all flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                            title="تلاش مجدد برای صدور خودکار لایسنس از ربات پس از شارژ کیف پول"
                          >
                            <Zap
                              className={`w-3.5 h-3.5 ${retryingOrder[ord.order_number] ? 'animate-spin' : ''}`}
                            />
                            <span>
                              {retryingOrder[ord.order_number]
                                ? 'در حال صدور...'
                                : 'تلاش مجدد'}
                            </span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setPromptOrderId(oid)}
                          className="flex-1 h-8 px-2 rounded-control border border-brand/40 text-brand hover:bg-brand/10 text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>درخواست ۲FA</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setCompleteConfirm({
                              isOpen: true,
                              orderId: oid,
                              loading: false,
                            })
                          }
                          className="flex-1 h-8 px-2 rounded-control bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-all flex items-center justify-center gap-1 shadow-control cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>تکمیل و Zeroize</span>
                        </button>
                      </div>
                    </div>
                  )
                })}
            </div>
          )}

          {/* Clean 2FA Prompt Modal via createPortal */}
          {promptOrderId &&
            createPortal(
              <div className="fixed inset-0 z-[250] w-screen h-screen flex items-center justify-center p-4 bg-background/85 backdrop-blur-md animate-in fade-in duration-200">
                <div
                  dir="rtl"
                  className="w-full max-w-md bg-card rounded-surface border border-border/80 shadow-surface p-5 space-y-4 text-right animate-in zoom-in-95 duration-200 text-foreground"
                >
                  <div className="flex items-center justify-between border-b border-border/60 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-control bg-brand/10 text-brand flex items-center justify-center font-bold">
                        <Send className="w-4 h-4" />
                      </div>
                      <h4 className="font-bold text-sm text-foreground">
                        ارسال درخواست کد ۲FA به مشتری
                      </h4>
                    </div>
                    <ModalCloseButton
                      onClick={() => setPromptOrderId(null)}
                      size="sm"
                    />
                  </div>

                  <p className="text-xs text-muted-foreground">
                    این پیام به صورت نوتیفیکیشن لایو در صفحه پیگیری سفارش خریدار
                    نمایش داده می‌شود تا کد پیامک‌شده را وارد نماید.
                  </p>

                  <textarea
                    rows={3}
                    value={promptMessage}
                    onChange={(e) => setPromptMessage(e.target.value)}
                    className="w-full p-3 text-xs rounded-field border border-border/60 bg-muted/20 text-foreground outline-none focus:border-brand resize-none"
                  />

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
                    <button
                      type="button"
                      onClick={() => setPromptOrderId(null)}
                      className="h-9 px-4 rounded-control border border-border/60 bg-secondary hover:bg-muted text-xs font-bold transition shadow-xs cursor-pointer"
                    >
                      انصراف
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSend2FAPrompt(promptOrderId)}
                      disabled={sendingPrompt}
                      className="h-9 px-5 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs shadow-control flex items-center gap-1.5 cursor-pointer duration-motion active:scale-[0.98] disabled:opacity-50"
                    >
                      {sendingPrompt ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                      <span>ارسال درخواست لایو</span>
                    </button>
                  </div>
                </div>
              </div>,
              document.body,
            )}
        </div>
      )}

      {/* TAB 7: Virtual Numbers Desk */}
      {activeTab === 'virtual-numbers' && <AdminVirtualNumbersView />}

      {/* Fetch from Bot Modal */}
      <FetchBotModal
        isOpen={isFetchBotModalOpen}
        onClose={() => setIsFetchBotModalOpen(false)}
        onProductImported={() => {
          loadQueueOrders()
        }}
      />

      {/* Official Invoice Modal */}
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
