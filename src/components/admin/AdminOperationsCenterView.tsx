import {
  Bot,
  Boxes,
  Check,
  CheckCircle2,
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
  Settings,
  Zap,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useState } from 'react'
import { apiService } from '../../services/api'
import { OfficialInvoiceModal } from '../invoice/OfficialInvoiceModal'
import { ConfirmModal } from '../vibefarsi/ConfirmModal'
import { useNotification } from '../vibefarsi/NotificationContext'
import { AdminBotExplorerView } from './AdminBotExplorerView'
import { AdminBotSettingsView } from './AdminBotSettingsView'
import { AdminCategoriesView } from './AdminCategoriesView'
import { AdminHeaderBanner } from './AdminHeaderBanner'
import { AdminInventoryView } from './AdminInventoryView'
import { AdminVirtualNumbersView } from './AdminVirtualNumbersView'
import { FetchBotModal } from './FetchBotModal'

export type OperationsSubTab =
  | 'products'
  | 'bot-explorer'
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
          <span>کاتالوگ محصولات</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('bot-explorer')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-control text-xs font-bold transition-all whitespace-nowrap cursor-pointer duration-motion active:scale-[0.98] ${
            activeTab === 'bot-explorer'
              ? 'bg-primary text-primary-foreground font-black shadow-control'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <Bot className="w-4 h-4 text-brand" />
          <span>کاوشگر و مقایسه زنده ربات‌ها</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-control bg-brand/10 text-brand font-mono font-latin">
            5 Bots
          </span>
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
          <Settings className="w-4 h-4" />
          <span>کلیدهای API و اتصال ۵ ربات</span>
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
          <span>صف سفارشات اپراتور (Mode C)</span>
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

      {/* TAB 1 & 3: Products Catalog & Inventory License Keys (Direct embed - no duplicate header/tabs) */}
      {(activeTab === 'products' || activeTab === 'inventory') && (
        <AdminInventoryView
          defaultSubTab={activeTab === 'inventory' ? 'inventory' : 'catalog'}
          hideHeaderTabs={true}
          onOpenFetchBotModal={() => setIsFetchBotModalOpen(true)}
        />
      )}

      {/* TAB 2: LIVE BOTS CATALOG & MULTI-BOT COMPARISON */}
      {activeTab === 'bot-explorer' && (
        <AdminBotExplorerView
          onProductImported={() => {
            loadQueueOrders()
          }}
        />
      )}

      {/* TAB 4: BOT API KEYS & FULFILLMENT SETTINGS */}
      {activeTab === 'bot-settings' && <AdminBotSettingsView />}

      {/* TAB 5: HIERARCHICAL STORE CATEGORIES & GROUPS */}
      {activeTab === 'categories' && <AdminCategoriesView />}

      {/* TAB 6: Operator Queue Desk */}
      {activeTab === 'queue' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between bg-card rounded-surface border border-border/80 p-4 shadow-surface">
            <div>
              <h4 className="text-sm font-black text-foreground flex items-center gap-2">
                <Layers className="w-4 h-4 text-brand" />
                صف سفارشات اپراتور (Mode C & 2FA Interactive Handshake)
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                پردازش دستی، درخواست کد ۲FA، اجرای Zeroize و تلاش مجدد صدور آنی
                پس از شارژ موجودی ربات
              </p>
            </div>

            <button
              type="button"
              onClick={loadQueueOrders}
              disabled={loadingQueue}
              className="h-9 px-4 rounded-control bg-secondary text-secondary-foreground border border-border/60 hover:bg-muted text-xs font-bold transition-all shadow-control flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${loadingQueue ? 'animate-spin' : ''}`}
              />
              <span>بروزرسانی صف</span>
            </button>
          </div>

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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {queueOrders.map((ord: any) => {
                const oid = ord.order_id || ord.id || ord.order_number
                return (
                  <div
                    key={oid}
                    className="bg-card rounded-surface border border-border/80 p-5 shadow-surface space-y-4 relative"
                  >
                    <div className="flex items-start justify-between border-b border-border/60 pb-3">
                      <div>
                        <span className="text-xs font-mono font-bold text-brand">
                          #{ord.order_number}
                        </span>
                        <h4 className="font-bold text-sm text-foreground mt-0.5">
                          {ord.product_title ||
                            ord.items?.[0]?.product_title ||
                            'سفارش هوش مصنوعی'}
                        </h4>
                      </div>
                      <span className="px-2.5 py-1 rounded-control text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                        {ord.status}
                      </span>
                    </div>

                    <div className="text-xs space-y-2 bg-muted/20 p-3 rounded-control border border-border/60">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">مشتری:</span>
                        <span className="font-mono font-latin text-foreground">
                          {ord.customer_phone}
                        </span>
                      </div>
                      {ord.account_email && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            ایمیل اکانت:
                          </span>
                          <span className="font-mono font-latin text-foreground">
                            {ord.account_email}
                          </span>
                        </div>
                      )}
                      {ord.account_password && (
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">
                            رمز عبور:
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-latin text-foreground">
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
                              className="text-muted-foreground hover:text-foreground cursor-pointer"
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
                        <div className="flex justify-between items-center bg-emerald-500/10 p-2 rounded-control border border-emerald-500/20 text-emerald-400">
                          <span className="font-bold">
                            کد ۲FA ارسالی کاربر:
                          </span>
                          <span className="font-mono font-latin text-base font-bold tracking-widest">
                            {ord.two_factor_code}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-1 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setAdminInvoiceOrderNo(ord.order_number)}
                        className="h-9 px-3 rounded-control border border-border/60 bg-secondary hover:bg-muted text-xs font-bold transition-all shadow-control flex items-center gap-1.5 cursor-pointer"
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
                          className="h-9 px-3 rounded-control border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-control"
                          title="تلاش مجدد برای صدور خودکار لایسنس از ربات پس از شارژ کیف پول"
                        >
                          <Zap
                            className={`w-3.5 h-3.5 ${retryingOrder[ord.order_number] ? 'animate-spin' : ''}`}
                          />
                          <span>
                            {retryingOrder[ord.order_number]
                              ? 'در حال صدور...'
                              : 'تلاش مجدد صدور آنی'}
                          </span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setPromptOrderId(oid)}
                        className="flex-1 h-9 px-3 rounded-control border border-brand/40 text-brand hover:bg-brand/10 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
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
                        className="flex-1 h-9 px-3 rounded-control bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-control cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>تکمیل و Zeroize</span>
                      </button>
                    </div>

                    {/* 2FA Prompt Modal Inline */}
                    {promptOrderId === oid && (
                      <div className="absolute inset-0 bg-card p-5 rounded-surface border-2 border-brand z-10 flex flex-col justify-between">
                        <div className="space-y-3 text-right">
                          <h5 className="font-bold text-sm text-foreground">
                            ارسال پیام درخواست کد ۲FA به مشتری
                          </h5>
                          <textarea
                            value={promptMessage}
                            onChange={(e) => setPromptMessage(e.target.value)}
                            rows={3}
                            className="w-full p-2.5 text-xs rounded-control border border-border/60 bg-muted/20 text-foreground outline-none focus:border-brand"
                          />
                        </div>
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            type="button"
                            onClick={() => setPromptOrderId(null)}
                            className="px-3 py-1.5 rounded-control text-xs font-medium text-muted-foreground hover:bg-muted cursor-pointer"
                          >
                            انصراف
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSend2FAPrompt(oid)}
                            disabled={sendingPrompt}
                            className="px-4 py-1.5 rounded-control bg-brand hover:bg-brand/90 text-white text-xs font-bold flex items-center gap-1.5 shadow-control cursor-pointer"
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
