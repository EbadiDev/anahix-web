import {
  Layers,
  Package,
  ReceiptText,
  RefreshCw,
  Send,
  Smartphone,
  Tag,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { apiService } from '../../services/api'
import type {
  AdminOrderListResult,
  AdminUpdateOrderStatusRequest,
} from '../../types'
import { OfficialInvoiceModal } from '../invoice/OfficialInvoiceModal'
import { ModalCloseButton } from '../vibefarsi/ModalCloseButton'
import { useNotification } from '../vibefarsi/NotificationContext'
import { SearchInput } from '../vibefarsi/SearchInput'
import { ToggleSwitch } from '../vibefarsi/ToggleSwitch'
import { AdminHeaderBanner } from './AdminHeaderBanner'
import { TransactionsLogView } from './TransactionsLogView'

export const AdminOrdersTableView: React.FC = () => {
  const { success: notifySuccess, error: notifyError } = useNotification()
  // Subtab State: Orders vs Transactions
  const [orderSubTab, setOrderSubTab] = useState<'orders' | 'transactions'>(
    'orders',
  )

  // State
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<AdminOrderListResult | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [deliveryTypeFilter, setDeliveryTypeFilter] = useState<string>('all')
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('all')
  const [page, setPage] = useState(1)

  // Modals & Drawers
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null)
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false)
  const [newStatus, setNewStatus] = useState<string>('paid')
  const [operatorNotes, setOperatorNotes] = useState<string>('')
  const [refundToWallet, setRefundToWallet] = useState<boolean>(false)
  const [statusSubmitting, setStatusSubmitting] = useState(false)

  // 2FA Prompt Modal
  const [promptOrderId, setPromptOrderId] = useState<string | null>(null)
  const [promptMessage, setPromptMessage] = useState(
    'لطفاً کد تایید پیامک شده به گوشی خود را در بخش پیگیری وارد نمایید',
  )
  const [sendingPrompt, setSendingPrompt] = useState(false)

  // Invoice Modal
  const [invoiceOrderNo, setInvoiceOrderNo] = useState<string | null>(null)

  const showToast = (type: 'success' | 'error', text: string) => {
    if (type === 'success') {
      notifySuccess('عملیات موفق', text)
    } else {
      notifyError('خطا در پردازش', text)
    }
  }

  // Fetch orders
  const loadOrders = async () => {
    setLoading(true)
    try {
      const res = await apiService.getAdminAllOrders({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        delivery_type:
          deliveryTypeFilter !== 'all' ? deliveryTypeFilter : undefined,
        payment_method:
          paymentMethodFilter !== 'all' ? paymentMethodFilter : undefined,
        search: search.trim() || undefined,
        page,
        page_size: 20,
      })
      setData(res)
    } catch (err: any) {
      showToast('error', err.message || 'خطا در بارگذاری سفارشات')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()
  }, [page, statusFilter, deliveryTypeFilter, paymentMethodFilter, search])

  const handleSearchSubmit = (val?: string) => {
    setPage(1)
    if (val !== undefined) setSearch(val)
    loadOrders()
  }

  // Open Status Changer Modal
  const openStatusModal = (ord: any) => {
    setSelectedOrder(ord)
    setNewStatus(ord.status || 'paid')
    setOperatorNotes(ord.operator_notes || '')
    setRefundToWallet(false)
    setIsStatusModalOpen(true)
  }

  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedOrder) return

    setStatusSubmitting(true)
    try {
      const payload: AdminUpdateOrderStatusRequest = {
        status: newStatus,
        operator_notes: operatorNotes.trim(),
        refund_to_wallet: refundToWallet,
      }
      await apiService.updateAdminOrderStatus(
        selectedOrder.id ||
          selectedOrder.order_id ||
          selectedOrder.order_number,
        payload,
      )
      showToast('success', 'وضعیت سفارش با موفقیت به‌روزرسانی شد.')
      setIsStatusModalOpen(false)
      loadOrders()
    } catch (err: any) {
      showToast('error', err.message || 'خطا در تغییر وضعیت سفارش')
    } finally {
      setStatusSubmitting(false)
    }
  }

  // Send 2FA Prompt
  const handleSend2FAPrompt = async (orderId: string) => {
    setSendingPrompt(true)
    try {
      await apiService.requestAdmin2FA(orderId, promptMessage)
      showToast('success', 'درخواست کد ۲FA به خریدار ارسال گردید.')
      setPromptOrderId(null)
      loadOrders()
    } catch (err: any) {
      showToast('error', err.message || 'خطا در ارسال درخواست ۲FA')
    } finally {
      setSendingPrompt(false)
    }
  }

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'paid':
        return {
          label: 'پرداخت شده / تایید شده',
          classes: 'bg-brand/10 text-brand border-brand/30 font-bold',
        }
      case 'in_queue':
        return {
          label: 'در صف اپراتور',
          classes:
            'bg-amber-500/10 text-amber-500 border-amber-500/30 font-bold',
        }
      case 'processing':
        return {
          label: 'در حال پردازش',
          classes:
            'bg-purple-500/10 text-purple-500 border-purple-500/30 font-bold',
        }
      case 'awaiting_customer_action':
        return {
          label: 'منتظر کد ۲FA / اقدام خریدار',
          classes:
            'bg-amber-500/10 text-amber-500 border-amber-500/30 font-bold',
        }
      case 'completed':
        return {
          label: 'تکمیل شده',
          classes:
            'bg-emerald-500/10 text-emerald-500 border-emerald-500/30 font-bold',
        }
      case 'cancelled':
        return {
          label: 'لغو شده',
          classes: 'bg-rose-500/10 text-rose-500 border-rose-500/30 font-bold',
        }
      case 'refunded':
        return {
          label: 'مرجوعی / عودت وجه',
          classes: 'bg-rose-500/10 text-rose-500 border-rose-500/30 font-bold',
        }
      case 'pending_payment':
        return {
          label: 'در انتظار پرداخت',
          classes: 'bg-muted text-muted-foreground border-border/60',
        }
      default:
        return {
          label: st,
          classes: 'bg-muted text-muted-foreground border-border/60',
        }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <AdminHeaderBanner
        icon={Layers}
        title="مدیریت جامع سفارش‌ها و تراکنش‌های مالی"
        subtitle="پایش کلیه سفارشات اشتراک‌ها، وضعیت تحویل، صف اپراتور و لاگ برخط تراکنش‌های درگاه و کیف پول"
        badgeText="عملیات مالی و سفارشات"
        actions={
          orderSubTab === 'orders' ? (
            <button
              type="button"
              onClick={loadOrders}
              disabled={loading}
              className="h-9 px-4 rounded-control bg-secondary text-secondary-foreground border border-border/60 hover:bg-muted text-xs font-bold transition-all shadow-control flex items-center gap-2 cursor-pointer duration-motion active:scale-[0.98]"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`}
              />
              <span>به‌روزرسانی سفارشات</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() =>
                window.dispatchEvent(
                  new CustomEvent('anahix:transactions:refresh'),
                )
              }
              className="h-9 px-4 rounded-control bg-secondary text-secondary-foreground border border-border/60 hover:bg-muted text-xs font-bold transition-all shadow-control flex items-center gap-2 cursor-pointer duration-motion active:scale-[0.98]"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>به‌روزرسانی تراکنش‌ها</span>
            </button>
          )
        }
      />

      {/* Sub-Tabs Navigation for Orders vs Transactions */}
      <div className="bg-card rounded-surface border border-border/80 p-2 shadow-surface flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        <button
          type="button"
          onClick={() => setOrderSubTab('orders')}
          className={`flex items-center gap-2 px-4 py-2 rounded-control text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            orderSubTab === 'orders'
              ? 'bg-primary text-primary-foreground font-black shadow-control'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
          }`}
        >
          <ReceiptText className="w-4 h-4 shrink-0" />
          <span>جدول جامع و پیگیری سفارش‌ها</span>
        </button>

        <button
          type="button"
          onClick={() => setOrderSubTab('transactions')}
          className={`flex items-center gap-2 px-4 py-2 rounded-control text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            orderSubTab === 'transactions'
              ? 'bg-primary text-primary-foreground font-black shadow-control'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
          }`}
        >
          <Package className="w-4 h-4 shrink-0" />
          <span>لاگ تراکنش‌های مالی و درگاه‌ها</span>
        </button>
      </div>

      {orderSubTab === 'transactions' ? (
        <div className="animate-in fade-in duration-200">
          <TransactionsLogView hideHeader={true} />
        </div>
      ) : (
        <>
          {/* Search Bar & 3 Responsive Dropdowns (Status, Delivery, Gateway) */}
          <div className="bg-card rounded-surface border border-border/80 p-4 sm:p-5 shadow-surface">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
              {/* Compact Debounced Search Bar with Clickable Search & Clear Buttons */}
              <div className="flex-1 min-w-[200px] sm:min-w-[280px]">
                <SearchInput
                  value={search}
                  onChange={(val) => {
                    setSearch(val)
                    setPage(1)
                  }}
                  onSearch={handleSearchSubmit}
                  placeholder="جستجو: شماره سفارش، موبایل یا ایمیل..."
                  debounceMs={350}
                />
              </div>

              {/* 1. Status Filter Dropdown (Converted from bulky tabs to sleek dropdown per user request) */}
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[11px] text-muted-foreground shrink-0 font-bold whitespace-nowrap">
                  وضعیت:
                </span>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value)
                    setPage(1)
                  }}
                  className="h-9 px-3 rounded-control border border-border/60 bg-muted/20 text-xs text-foreground outline-none focus:border-brand font-bold"
                >
                  <option value="all">همه وضعیت‌ها</option>
                  <option value="paid">تایید شده / پرداخت شده</option>
                  <option value="in_queue">در صف اپراتور</option>
                  <option value="processing">در حال پردازش</option>
                  <option value="awaiting_customer_action">منتظر کد ۲FA</option>
                  <option value="completed">تکمیل شده</option>
                  <option value="cancelled">لغو شده</option>
                  <option value="refunded">مرجوعی / عودت وجه</option>
                  <option value="pending_payment">در انتظار پرداخت</option>
                </select>
              </div>

              {/* 2. Delivery Type Dropdown */}
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[11px] text-muted-foreground shrink-0 font-bold whitespace-nowrap">
                  روش تحویل:
                </span>
                <select
                  value={deliveryTypeFilter}
                  onChange={(e) => {
                    setDeliveryTypeFilter(e.target.value)
                    setPage(1)
                  }}
                  className="h-9 px-3 rounded-control border border-border/60 bg-muted/20 text-xs text-foreground outline-none focus:border-brand"
                >
                  <option value="all">همه روش‌ها</option>
                  <option value="instant">تحویل آنی و خودکار</option>
                  <option value="manual_operator">تحویل دستی اپراتور</option>
                  <option value="direct_transfer">ارتقای شخصی (Mode C)</option>
                  <option value="family_invite">دعوت‌نامه فمیلی</option>
                  <option value="activation_code">لایسنس و کد فعال‌سازی</option>
                </select>
              </div>

              {/* 3. Payment Method Dropdown */}
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[11px] text-muted-foreground shrink-0 font-bold whitespace-nowrap">
                  درگاه:
                </span>
                <select
                  value={paymentMethodFilter}
                  onChange={(e) => {
                    setPaymentMethodFilter(e.target.value)
                    setPage(1)
                  }}
                  className="h-9 px-3 rounded-control border border-border/60 bg-muted/20 text-xs text-foreground outline-none focus:border-brand"
                >
                  <option value="all">همه درگاه‌ها</option>
                  <option value="balance">کیف پول</option>
                  <option value="zarinpal">زرین‌پال</option>
                  <option value="card_to_card">کارت به کارت</option>
                  <option value="crypto">رمزارز (Crypto)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Orders Table - Centered with Graphite Tokens */}
          <div className="bg-card rounded-surface border border-border/80 shadow-surface overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-center text-xs">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/30 text-muted-foreground font-semibold select-none text-center">
                    <th className="py-4 px-4 text-center">
                      شماره سفارش و تاریخ
                    </th>
                    <th className="py-4 px-4 text-center">
                      عنوان محصول و آیتم
                    </th>
                    <th className="py-4 px-4 text-center">
                      مشتری و شماره تماس
                    </th>
                    <th className="py-4 px-4 text-center">
                      مبلغ و درگاه پرداخت
                    </th>
                    <th className="py-4 px-4 text-center">وضعیت سفارش</th>
                    <th className="py-4 px-4 text-center">عملیات مدیریت</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {loading && (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-16 text-center text-muted-foreground"
                      >
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-brand" />
                        <span>در حال فراخوانی سفارش‌ها...</span>
                      </td>
                    </tr>
                  )}

                  {!loading && (!data?.orders || data.orders.length === 0) && (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-16 text-center text-muted-foreground"
                      >
                        <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <span className="font-bold">
                          سفارشی با این مشخصات یافت نشد.
                        </span>
                      </td>
                    </tr>
                  )}

                  {!loading &&
                    data?.orders?.map((ord: any) => {
                      const oid = ord.order_id || ord.id || ord.order_number
                      const badge = getStatusBadge(ord.status)
                      return (
                        <tr
                          key={oid}
                          className="hover:bg-muted/40 transition-colors"
                        >
                          {/* Order Number & Date */}
                          <td className="py-3.5 px-4 text-center">
                            <div className="font-mono font-bold text-brand font-latin">
                              {ord.order_number}
                            </div>
                            <div className="text-[11px] text-muted-foreground font-mono mt-0.5 font-latin">
                              {new Date(ord.created_at).toLocaleDateString(
                                'fa-IR',
                              )}
                            </div>
                          </td>

                          {/* Product Title */}
                          <td className="py-3.5 px-4 text-center max-w-[200px]">
                            <div
                              className="font-bold text-foreground truncate"
                              title={ord.product_title || 'سفارش هوش مصنوعی'}
                            >
                              {ord.product_title || 'سفارش هوش مصنوعی'}
                            </div>
                            <div className="text-[10px] text-muted-foreground mt-0.5 truncate">
                              شیوه تحویل:{' '}
                              <span className="font-semibold text-foreground">
                                {ord.delivery_type}
                              </span>
                            </div>
                          </td>

                          {/* Customer Info */}
                          <td className="py-3.5 px-4 font-mono font-latin text-center">
                            <div className="font-bold text-foreground">
                              {ord.customer_phone}
                            </div>
                            {ord.customer_email && (
                              <div className="text-[10px] text-muted-foreground truncate max-w-[150px] mx-auto">
                                {ord.customer_email}
                              </div>
                            )}
                          </td>

                          {/* Total Amount & Gateway */}
                          <td className="py-3.5 px-4 font-mono font-latin text-center">
                            <div className="font-bold text-sm text-foreground">
                              {ord.total_amount_toman.toLocaleString('fa-IR')}{' '}
                              <span className="text-[10px] font-sans font-normal text-muted-foreground">
                                تومان
                              </span>
                            </div>
                            <div className="text-[10px] text-muted-foreground font-sans">
                              روش:{' '}
                              {ord.payment_method === 'balance'
                                ? 'کیف پول'
                                : ord.payment_method === 'zarinpal'
                                  ? 'زرین‌پال'
                                  : ord.payment_method === 'card_to_card'
                                    ? 'کارت به کارت'
                                    : ord.payment_method}
                            </div>
                          </td>

                          {/* Status Badge */}
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-control text-[10px] font-bold border ${badge.classes}`}
                            >
                              {badge.label}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Change Status Button */}
                              <button
                                type="button"
                                onClick={() => openStatusModal(ord)}
                                className="px-2.5 py-1 rounded-control bg-brand/10 text-brand hover:bg-brand/20 text-[11px] font-bold border border-brand/30 transition-colors cursor-pointer duration-motion active:scale-[0.98]"
                              >
                                تغییر وضعیت
                              </button>

                              {/* 2FA Prompt Button for Mode C */}
                              {ord.status === 'awaiting_customer_action' ||
                              ord.status === 'in_queue' ||
                              ord.status === 'paid' ? (
                                <button
                                  type="button"
                                  onClick={() => setPromptOrderId(oid)}
                                  className="p-1.5 rounded-control bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border border-amber-500/30 transition-colors cursor-pointer duration-motion active:scale-[0.98]"
                                  title="ارسال درخواست کد ۲FA"
                                >
                                  <Smartphone className="w-4 h-4" />
                                </button>
                              ) : null}

                              {/* View Official Tax Invoice Button */}
                              <button
                                type="button"
                                onClick={() =>
                                  setInvoiceOrderNo(ord.order_number)
                                }
                                className="p-1.5 rounded-control bg-muted text-muted-foreground hover:text-foreground border border-border/60 transition-colors cursor-pointer duration-motion active:scale-[0.98]"
                                title="مشاهده فاکتور رسمی"
                              >
                                <ReceiptText className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {data && data.total > 0 && (
              <div className="p-4 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                <div>
                  صفحه {data.page} از{' '}
                  {Math.ceil(data.total / data.page_size) || 1} (مجموع{' '}
                  {data.total.toLocaleString('fa-IR')} سفارش)
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1.5 rounded-control border border-border/60 disabled:opacity-40 hover:bg-muted transition-colors cursor-pointer duration-motion active:scale-[0.98]"
                  >
                    قبلی
                  </button>
                  <button
                    type="button"
                    disabled={page >= Math.ceil(data.total / data.page_size)}
                    onClick={() => setPage((p) => p + 1)}
                    className="px-3 py-1.5 rounded-control border border-border/60 disabled:opacity-40 hover:bg-muted transition-colors cursor-pointer duration-motion active:scale-[0.98]"
                  >
                    بعدی
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ==================================================================== */}
      {/* STATUS CHANGER MODAL                                                 */}
      {/* ==================================================================== */}
      {isStatusModalOpen &&
        selectedOrder &&
        createPortal(
          <div
            className="fixed inset-0 overflow-y-auto bg-black/80 backdrop-blur-md p-3 sm:p-6 animate-in fade-in"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100vw',
              height: '100vh',
              zIndex: 2147483600,
            }}
            dir="rtl"
          >
            <div className="min-h-full w-full flex items-start sm:items-center justify-center">
              <div className="w-full max-w-lg my-auto bg-card text-card-foreground rounded-surface shadow-overlay border border-border/80 p-6 space-y-5 animate-in zoom-in-95 duration-200">
                <div className="flex items-start justify-between border-b border-border/60 pb-4">
                  <div>
                    <h3 className="text-base font-black text-foreground flex items-center gap-2">
                      <Tag className="w-5 h-5 text-brand" />
                      به‌روزرسانی و تغییر وضعیت سفارش
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 font-mono font-latin">
                      سفارش شماره: {selectedOrder.order_number}
                    </p>
                  </div>

                  <ModalCloseButton
                    onClick={() => setIsStatusModalOpen(false)}
                    size="sm"
                  />
                </div>

                <form onSubmit={handleStatusSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5">
                      وضعیت جدید سفارش:
                    </label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="w-full h-10 px-3 rounded-field border border-border/60 bg-muted/30 text-xs font-bold text-foreground outline-none focus:border-brand"
                    >
                      <option value="paid">
                        پرداخت شده / تایید شده (Paid)
                      </option>
                      <option value="in_queue">
                        در صف پردازش اپراتور (In Queue)
                      </option>
                      <option value="processing">
                        در حال پردازش (Processing)
                      </option>
                      <option value="awaiting_customer_action">
                        منتظر اقدام مشتری / کد ۲FA (Awaiting Action)
                      </option>
                      <option value="completed">
                        تکمیل و تحویل داده شده (Completed)
                      </option>
                      <option value="cancelled">لغو سفارش (Cancelled)</option>
                      <option value="refunded">
                        مرجوعی و عودت وجه (Refunded)
                      </option>
                    </select>
                  </div>

                  {/* Automatic Refund to Customer Wallet Toggle */}
                  {(newStatus === 'cancelled' || newStatus === 'refunded') && (
                    <div className="p-4 rounded-surface bg-amber-500/10 border border-amber-500/30 space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-bold text-foreground">
                          استرداد خودکار وجه سفارش به کیف پول مشتری (
                          {selectedOrder.total_amount_toman.toLocaleString(
                            'fa-IR',
                          )}{' '}
                          تومان)
                        </span>
                        <ToggleSwitch
                          size="sm"
                          checked={refundToWallet}
                          onChange={setRefundToWallet}
                        />
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        با فعال‌بودن این گزینه، بلافاصله پس از ثبت وضعیت لغو یا
                        استرداد، مبلغ سفارش به مانده موجودی کیف پول خریدار شارژ
                        می‌گردد.
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5">
                      یادداشت و توضیحات اپراتور:
                    </label>
                    <textarea
                      rows={3}
                      value={operatorNotes}
                      onChange={(e) => setOperatorNotes(e.target.value)}
                      placeholder="توضیحات و علت تغییر وضعیت جهت ثبت در سیستم..."
                      className="w-full p-3 rounded-field border border-border/60 bg-muted/30 text-xs text-foreground outline-none focus:border-brand font-sans"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/60">
                    <button
                      type="button"
                      onClick={() => setIsStatusModalOpen(false)}
                      className="h-9 px-4 rounded-control border border-border/60 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer duration-motion active:scale-[0.98]"
                    >
                      انصراف
                    </button>

                    <button
                      type="submit"
                      disabled={statusSubmitting}
                      className="h-9 px-5 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-black shadow-control flex items-center gap-2 cursor-pointer duration-motion active:scale-[0.98]"
                    >
                      {statusSubmitting && (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      )}
                      <span>ذخیره وضعیت جدید</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* ==================================================================== */}
      {/* 2FA PROMPT REQUEST MODAL                                             */}
      {/* ==================================================================== */}
      {promptOrderId &&
        createPortal(
          <div
            className="fixed inset-0 overflow-y-auto bg-black/80 backdrop-blur-md p-3 sm:p-6 animate-in fade-in"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100vw',
              height: '100vh',
              zIndex: 2147483600,
            }}
            dir="rtl"
          >
            <div className="min-h-full w-full flex items-start sm:items-center justify-center">
              <div className="w-full max-w-md my-auto bg-card text-card-foreground rounded-surface shadow-overlay border border-border/80 p-6 space-y-4 animate-in zoom-in-95">
                <div className="flex items-start justify-between border-b border-border/60 pb-3">
                  <h3 className="text-base font-black text-foreground flex items-center gap-2">
                    <Smartphone className="w-5 h-5 text-amber-500" />
                    ارسال درخواست کد دو مرحله‌ای (2FA)
                  </h3>
                  <ModalCloseButton
                    onClick={() => setPromptOrderId(null)}
                    size="sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    پیام ارسالی به کاربر:
                  </label>
                  <textarea
                    rows={3}
                    value={promptMessage}
                    onChange={(e) => setPromptMessage(e.target.value)}
                    className="w-full p-3 rounded-field border border-border/60 bg-muted/30 text-xs text-foreground outline-none focus:border-brand font-sans"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
                  <button
                    type="button"
                    onClick={() => setPromptOrderId(null)}
                    className="h-9 px-4 rounded-control border border-border/60 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer duration-motion active:scale-[0.98]"
                  >
                    انصراف
                  </button>

                  <button
                    type="button"
                    disabled={sendingPrompt}
                    onClick={() => handleSend2FAPrompt(promptOrderId)}
                    className="h-9 px-5 rounded-control bg-amber-500 hover:bg-amber-600 text-white text-xs font-black shadow-control flex items-center gap-2 cursor-pointer duration-motion active:scale-[0.98]"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>
                      {sendingPrompt
                        ? 'در حال ارسال...'
                        : 'ارسال درخواست به مشتری'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Official Tax Invoice Modal */}
      {invoiceOrderNo && (
        <OfficialInvoiceModal
          orderIdOrNo={invoiceOrderNo}
          isOpen={Boolean(invoiceOrderNo)}
          onClose={() => setInvoiceOrderNo(null)}
        />
      )}
    </div>
  )
}
