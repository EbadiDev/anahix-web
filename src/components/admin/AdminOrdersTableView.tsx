import {
  AlertCircle,
  CheckCircle2,
  Layers,
  Package,
  ReceiptText,
  RefreshCw,
  Search,
  Send,
  Smartphone,
  Tag,
  X,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useState } from 'react'
import { apiService } from '../../services/api'
import type {
  AdminOrderListResult,
  AdminUpdateOrderStatusRequest,
} from '../../types'
import { OfficialInvoiceModal } from '../invoice/OfficialInvoiceModal'

export const AdminOrdersTableView: React.FC = () => {
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
  const [toastMsg, setToastMsg] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMsg({ type, text })
    setTimeout(() => setToastMsg(null), 3500)
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
  }, [page, statusFilter, deliveryTypeFilter, paymentMethodFilter])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
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
          classes:
            'bg-blue-50 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border-blue-200 dark:border-blue-900',
        }
      case 'in_queue':
        return {
          label: 'در صف اپراتور',
          classes:
            'bg-amber-50 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 border-amber-200 dark:border-amber-900',
        }
      case 'processing':
        return {
          label: 'در حال پردازش',
          classes:
            'bg-purple-50 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300 border-purple-200 dark:border-purple-900',
        }
      case 'awaiting_customer_action':
        return {
          label: 'منتظر کد ۲FA / اقدام خریدار',
          classes:
            'bg-orange-50 text-orange-700 dark:bg-orange-950/80 dark:text-orange-300 border-orange-200 dark:border-orange-900',
        }
      case 'completed':
        return {
          label: 'تکمیل شده',
          classes:
            'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900',
        }
      case 'cancelled':
        return {
          label: 'لغو شده',
          classes:
            'bg-red-50 text-red-700 dark:bg-red-950/80 dark:text-red-400 border-red-200 dark:border-red-900',
        }
      case 'refunded':
        return {
          label: 'مرجوعی / عودت وجه',
          classes:
            'bg-rose-50 text-rose-700 dark:bg-rose-950/80 dark:text-rose-400 border-rose-200 dark:border-rose-900',
        }
      case 'pending_payment':
        return {
          label: 'در انتظار پرداخت',
          classes:
            'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
        }
      default:
        return {
          label: st,
          classes:
            'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200',
        }
    }
  }

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMsg && (
        <div
          className={`fixed top-6 left-6 z-50 px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 border transition-all animate-in fade-in slide-in-from-top-4 ${
            toastMsg.type === 'success'
              ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-500/20'
              : 'bg-red-600 text-white border-red-500 shadow-red-500/20'
          }`}
        >
          {toastMsg.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0" />
          )}
          <span className="text-xs font-semibold">{toastMsg.text}</span>
          <button
            onClick={() => setToastMsg(null)}
            className="p-1 hover:bg-white/20 rounded-lg transition-colors mr-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400 mb-1">
            <Layers className="w-4 h-4" />
            <span>مدیریت کلیه سفارشات فروشگاه</span>
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">
            میز کار و جدول جامع سفارشات و لایسنس‌ها
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            فیلتر و مدیریت تمام سفارش‌های پرداخت شده، تایید شده، در صف، تکمیل‌شده
            یا مرجوعی، همراه با قابلیت استرداد خودکار به کیف پول مشتری.
          </p>
        </div>

        <button
          onClick={loadOrders}
          disabled={loading}
          className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-2 self-stretch md:self-auto justify-center"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>به‌روزرسانی سفارشات</span>
        </button>
      </div>

      {/* Filter Tabs & Search Controls */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-sm space-y-4">
        {/* Status Horizontal Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs font-bold">
          {[
            { id: 'all', label: 'همه سفارشات' },
            { id: 'paid', label: 'تایید شده / پرداخت شده' },
            { id: 'in_queue', label: 'در صف اپراتور' },
            { id: 'processing', label: 'در حال پردازش' },
            { id: 'awaiting_customer_action', label: 'منتظر کد ۲FA' },
            { id: 'completed', label: 'تکمیل شده' },
            { id: 'cancelled', label: 'لغو شده' },
            { id: 'refunded', label: 'مرجوعی / عودت وجه' },
            { id: 'pending_payment', label: 'در انتظار پرداخت' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setStatusFilter(tab.id)
                setPage(1)
              }}
              className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap shrink-0 ${
                statusFilter === tab.id
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20 font-black'
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search bar & Secondary filters */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <form onSubmit={handleSearchSubmit} className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="جستجو بر اساس: شماره سفارش، شماره موبایل خریدار، یا ایمیل..."
              className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 font-sans"
            />
          </form>

          {/* Delivery Type Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 shrink-0">
              روش تحویل:
            </span>
            <select
              value={deliveryTypeFilter}
              onChange={(e) => {
                setDeliveryTypeFilter(e.target.value)
                setPage(1)
              }}
              className="py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="all">همه روش‌ها</option>
              <option value="instant">تحویل آنی و خودکار</option>
              <option value="manual_operator">تحویل دستی اپراتور</option>
              <option value="direct_transfer">ارتقای شخصی (Mode C)</option>
              <option value="family_invite">دعوت‌نامه فمیلی</option>
              <option value="activation_code">لایسنس و کد فعال‌سازی</option>
            </select>
          </div>

          {/* Payment Method Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 shrink-0">درگاه:</span>
            <select
              value={paymentMethodFilter}
              onChange={(e) => {
                setPaymentMethodFilter(e.target.value)
                setPage(1)
              }}
              className="py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
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

      {/* Orders Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 text-slate-500 dark:text-slate-400 font-semibold select-none">
                <th className="py-4 px-4">شماره سفارش و تاریخ</th>
                <th className="py-4 px-4">عنوان محصول و آیتم</th>
                <th className="py-4 px-4">مشتری و شماره تماس</th>
                <th className="py-4 px-4">مبلغ و درگاه پرداخت</th>
                <th className="py-4 px-4 text-center">وضعیت سفارش</th>
                <th className="py-4 px-4 text-left">عملیات مدیریت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {loading && (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                    <span>در حال فراخوانی سفارش‌ها...</span>
                  </td>
                </tr>
              )}

              {!loading && (!data?.orders || data.orders.length === 0) && (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-500">
                    <Package className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
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
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Order Number & Date */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-blue-600 dark:text-blue-400">
                          {ord.order_number}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {new Date(ord.created_at).toLocaleDateString('fa-IR')}
                        </div>
                      </td>

                      {/* Product Title */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-white line-clamp-1">
                          {ord.product_title || 'سفارش هوش مصنوعی'}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          شیوه تحویل:{' '}
                          <span className="font-semibold text-slate-600 dark:text-slate-300">
                            {ord.delivery_type}
                          </span>
                        </div>
                      </td>

                      {/* Customer Info */}
                      <td className="py-3.5 px-4 font-mono">
                        <div className="font-bold text-slate-800 dark:text-slate-200">
                          {ord.customer_phone}
                        </div>
                        {ord.customer_email && (
                          <div className="text-[10px] text-slate-400 truncate max-w-[150px]">
                            {ord.customer_email}
                          </div>
                        )}
                      </td>

                      {/* Total Amount & Gateway */}
                      <td className="py-3.5 px-4 font-mono">
                        <div className="font-bold text-sm text-slate-900 dark:text-white">
                          {ord.total_amount_toman.toLocaleString('fa-IR')}{' '}
                          <span className="text-[10px] font-sans font-normal text-slate-400">
                            تومان
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-sans">
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
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${badge.classes}`}
                        >
                          {badge.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-left">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Change Status Button */}
                          <button
                            type="button"
                            onClick={() => openStatusModal(ord)}
                            className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900 text-[11px] font-bold border border-blue-200 dark:border-blue-800 transition-colors"
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
                              className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 hover:bg-amber-100 border border-amber-200 dark:border-amber-800 transition-colors"
                              title="ارسال درخواست کد ۲FA"
                            >
                              <Smartphone className="w-4 h-4" />
                            </button>
                          ) : null}

                          {/* View Official Tax Invoice Button */}
                          <button
                            type="button"
                            onClick={() => setInvoiceOrderNo(ord.order_number)}
                            className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 border border-slate-200 dark:border-slate-700 transition-colors"
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
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <div>
              صفحه {data.page} از {Math.ceil(data.total / data.page_size) || 1}{' '}
              (مجموع {data.total.toLocaleString('fa-IR')} سفارش)
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                قبلی
              </button>
              <button
                type="button"
                disabled={page >= Math.ceil(data.total / data.page_size)}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                بعدی
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ==================================================================== */}
      {/* STATUS CHANGER MODAL                                                 */}
      {/* ==================================================================== */}
      {isStatusModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 animate-in zoom-in-95 duration-200"
            dir="rtl"
          >
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Tag className="w-5 h-5 text-blue-600" />
                  به‌روزرسانی و تغییر وضعیت سفارش
                </h3>
                <p className="text-xs text-slate-500 mt-1 font-mono">
                  سفارش شماره: {selectedOrder.order_number}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsStatusModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleStatusSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  وضعیت جدید سفارش:
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="paid">پرداخت شده / تایید شده (Paid)</option>
                  <option value="in_queue">
                    در صف پردازش اپراتور (In Queue)
                  </option>
                  <option value="processing">در حال پردازش (Processing)</option>
                  <option value="awaiting_customer_action">
                    منتظر اقدام مشتری / کد ۲FA (Awaiting Action)
                  </option>
                  <option value="completed">
                    تکمیل و تحویل داده شده (Completed)
                  </option>
                  <option value="cancelled">لغو سفارش (Cancelled)</option>
                  <option value="refunded">مرجوعی و عودت وجه (Refunded)</option>
                </select>
              </div>

              {/* Automatic Refund to Customer Wallet Toggle */}
              {(newStatus === 'cancelled' || newStatus === 'refunded') && (
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={refundToWallet}
                      onChange={(e) => setRefundToWallet(e.target.checked)}
                      className="rounded border-amber-300 text-amber-600 focus:ring-amber-500 w-4 h-4"
                    />
                    <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                      استرداد خودکار وجه سفارش به کیف پول مشتری (
                      {selectedOrder.total_amount_toman.toLocaleString('fa-IR')}{' '}
                      تومان)
                    </span>
                  </label>
                  <p className="text-[11px] text-amber-700 dark:text-amber-300 leading-relaxed pr-6">
                    در صورت فعال بودن این گزینه، مبلغ پرداختی سفارش فوراً به
                    موجودی کیف پول کاربر اضافه شده و سند تراکنش استردادی ثبت
                    می‌گردد.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  یادداشت و توضیحات اپراتور:
                </label>
                <textarea
                  rows={3}
                  value={operatorNotes}
                  onChange={(e) => setOperatorNotes(e.target.value)}
                  placeholder="توضیحات و علت تغییر وضعیت جهت ثبت در سیستم..."
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 font-sans"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsStatusModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  انصراف
                </button>

                <button
                  type="submit"
                  disabled={statusSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/20 flex items-center gap-2"
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
      )}

      {/* ==================================================================== */}
      {/* 2FA PROMPT REQUEST MODAL                                             */}
      {/* ==================================================================== */}
      {promptOrderId && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4"
            dir="rtl"
          >
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-amber-500" />
                ارسال درخواست کد دو مرحله‌ای (2FA)
              </h3>
              <button
                type="button"
                onClick={() => setPromptOrderId(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                پیام ارسالی به کاربر:
              </label>
              <textarea
                rows={3}
                value={promptMessage}
                onChange={(e) => setPromptMessage(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-sans"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPromptOrderId(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-600 dark:text-slate-400"
              >
                انصراف
              </button>

              <button
                type="button"
                disabled={sendingPrompt}
                onClick={() => handleSend2FAPrompt(promptOrderId)}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all shadow-md shadow-amber-500/20 flex items-center gap-2"
              >
                <Send className="w-3.5 h-3.5" />
                <span>
                  {sendingPrompt ? 'در حال ارسال...' : 'ارسال درخواست به مشتری'}
                </span>
              </button>
            </div>
          </div>
        </div>
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
