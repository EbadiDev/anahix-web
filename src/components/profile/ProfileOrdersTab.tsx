import {
  Check,
  Clock,
  Eye,
  FileText,
  Package,
  Radio,
  Sparkles,
  Star,
  X,
} from 'lucide-react'
import type React from 'react'
import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import type { CustomerProfile, Order, VirtualNumberOrder } from '../../types'
import { formatToman, toPersianDigits } from '../../utils/formatters'
import { OfficialInvoiceModal } from '../invoice/OfficialInvoiceModal'
import { SubmitReviewModal } from '../reviews/SubmitReviewModal'
import { useNotification } from '../vibefarsi/NotificationContext'
import { SearchInput } from '../vibefarsi/SearchInput'

interface ProfileOrdersTabProps {
  orders: Order[]
  virtualOrders: VirtualNumberOrder[]
  customer?: CustomerProfile | null
}

type OrderFilterType =
  | 'all'
  | 'digital_products'
  | 'virtual_numbers'
  | 'completed'
  | 'processing'

export const ProfileOrdersTab: React.FC<ProfileOrdersTabProps> = ({
  orders,
  virtualOrders,
  customer,
}) => {
  const { success } = useNotification()
  const [activeFilter, setActiveFilter] = useState<OrderFilterType>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [copiedKey, setCopiedKey] = useState('')
  const [reviewOrder, setReviewOrder] = useState<Order | null>(null)
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null)
  const [visibleOrdersCount, setVisibleOrdersCount] = useState<number>(6)

  // Map unified list
  const unifiedItems = useMemo(() => {
    const list: Array<{
      id: string
      orderNo: string
      type: 'digital_product' | 'virtual_number'
      title: string
      subtitle: string
      amount: number
      status: string
      statusLabel: string
      date: string
      rawProductOrder?: Order
      rawVirtualOrder?: VirtualNumberOrder
    }> = []

    // 1. Digital product orders
    orders.forEach((o) => {
      let label = 'در حال پردازش'
      if (o.status === 'COMPLETED') label = 'تحویل داده شده'
      if (o.status === 'FAILED') label = 'ناموفق'
      if (o.status === 'REFUNDED') label = 'استرداد وجه'

      list.push({
        id: String(o.id || o.order_no),
        orderNo: o.order_no,
        type: 'digital_product',
        title: o.product_title,
        subtitle: `روش تحویل: ${o.delivery_mode}`,
        amount: o.amount_toman,
        status: o.status,
        statusLabel: label,
        date: o.created_at,
        rawProductOrder: o,
      })
    })

    // 2. Virtual number orders
    virtualOrders.forEach((v) => {
      let label = 'در انتظار پیامک'
      if (v.status === 'RECEIVED') label = 'پیامک دریافت شد'
      if (v.status === 'FINISHED') label = 'تکمیل شده'
      if (v.status === 'CANCELED') label = 'لغو و استرداد'

      list.push({
        id: String(v.id || v.order_no),
        orderNo: v.order_no,
        type: 'virtual_number',
        title: `شماره مجازی ${v.service_name_fa || 'سرویس'} (${v.country_name_fa || 'کشور'})`,
        subtitle: `شماره: ${v.phone || 'در حال تخصیص'}`,
        amount: 25000,
        status: v.status,
        statusLabel: label,
        date: new Date().toISOString(),
        rawVirtualOrder: v,
      })
    })

    return list.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    )
  }, [orders, virtualOrders])

  // Filter and search
  const filteredItems = useMemo(() => {
    return unifiedItems.filter((item) => {
      // Type and status filtering
      if (
        activeFilter === 'digital_products' &&
        item.type !== 'digital_product'
      )
        return false
      if (activeFilter === 'virtual_numbers' && item.type !== 'virtual_number')
        return false
      if (
        activeFilter === 'completed' &&
        item.status !== 'COMPLETED' &&
        item.status !== 'FINISHED' &&
        item.status !== 'RECEIVED'
      )
        return false
      if (
        activeFilter === 'processing' &&
        item.status !== 'PENDING' &&
        item.status !== 'OPERATOR_QUEUE' &&
        item.status !== 'ALLOCATING_INVENTORY'
      )
        return false

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        return (
          item.orderNo.toLowerCase().includes(q) ||
          item.title.toLowerCase().includes(q)
        )
      }

      return true
    })
  }, [unifiedItems, activeFilter, searchQuery])

  const copyToClipboard = (text: string, key: string, label?: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    success(`${label || 'اطلاعات'} کپی شد`, text)
    setTimeout(() => setCopiedKey(''), 2000)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Header and Filters - Graphite Tokens */}
      <div className="rounded-surface border border-border/60 bg-card p-5 shadow-surface space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Package className="w-4 h-4 text-brand" />
              تاریخچه و پیگیری سفارش‌ها
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              مجموع {toPersianDigits(unifiedItems.length)} سفارش در حساب کاربری
              شما ثبت شده است
            </p>
          </div>

          <div className="w-full sm:w-64">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="جستجو با شماره سفارش یا عنوان..."
              debounceMs={250}
            />
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-border/40">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`text-xs px-3 py-1.5 rounded-control font-bold duration-motion ease-motion transition-all cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-primary text-primary-foreground font-black shadow-control'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            همه سفارش‌ها ({toPersianDigits(unifiedItems.length)})
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('digital_products')}
            className={`text-xs px-3 py-1.5 rounded-control font-bold duration-motion ease-motion transition-all cursor-pointer ${
              activeFilter === 'digital_products'
                ? 'bg-primary text-primary-foreground font-black shadow-control'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            اشتراک‌های هوش مصنوعی
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('virtual_numbers')}
            className={`text-xs px-3 py-1.5 rounded-control font-bold duration-motion ease-motion transition-all cursor-pointer ${
              activeFilter === 'virtual_numbers'
                ? 'bg-primary text-primary-foreground font-black shadow-control'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            شماره‌های مجازی (SMS)
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('completed')}
            className={`text-xs px-3 py-1.5 rounded-control font-bold duration-motion ease-motion transition-all cursor-pointer ${
              activeFilter === 'completed'
                ? 'bg-primary text-primary-foreground font-black shadow-control'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            تکمیل شده
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('processing')}
            className={`text-xs px-3 py-1.5 rounded-control font-bold duration-motion ease-motion transition-all cursor-pointer ${
              activeFilter === 'processing'
                ? 'bg-primary text-primary-foreground font-black shadow-control'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            در حال پردازش
          </button>
        </div>
      </div>

      {/* 2. Order Items List */}
      <div className="space-y-3">
        {filteredItems.length === 0 ? (
          <div className="p-12 rounded-surface border border-dashed border-border/60 bg-card/40 text-center">
            <Package className="w-10 h-10 text-muted-foreground/60 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-foreground">
              سفارشی در این دسته‌بندی یافت نشد
            </h4>
            <p className="text-xs text-muted-foreground mt-1">
              جهت ثبت سفارش جدید می‌توانید به فروشگاه یا بخش شماره‌های مجازی
              مراجعه فرمایید.
            </p>
            <div className="mt-4 flex items-center justify-center gap-3">
              <Link to="/">
                <button
                  type="button"
                  className="h-9 px-4 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-black duration-motion ease-motion active:scale-[0.98] shadow-control cursor-pointer"
                >
                  خرید اشتراک
                </button>
              </Link>
              <Link to="/virtual-numbers">
                <button
                  type="button"
                  className="h-9 px-4 rounded-control border border-border/60 bg-card hover:bg-muted text-xs font-bold text-foreground duration-motion ease-motion active:scale-[0.98] cursor-pointer"
                >
                  دریافت شماره
                </button>
              </Link>
            </div>
          </div>
        ) : (
          filteredItems.slice(0, visibleOrdersCount).map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-surface border border-border/60 bg-card text-card-foreground shadow-surface hover:border-border duration-motion ease-motion transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-control bg-secondary text-secondary-foreground border border-border/60 flex items-center justify-center shrink-0 shadow-control">
                  {item.type === 'virtual_number' ? (
                    <Radio className="w-5 h-5 text-brand" />
                  ) : (
                    <Sparkles className="w-5 h-5 text-brand" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs sm:text-sm font-bold text-foreground">
                      {item.title}
                    </h4>
                    <span className="font-mono text-[11px] text-muted-foreground">
                      #{item.orderNo}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-[11px] text-muted-foreground mt-1">
                    <span>{item.subtitle}</span>
                    <span>•</span>
                    <span className="font-bold text-foreground font-latin">
                      {formatToman(item.amount)} تومان
                    </span>
                    <span>•</span>
                    <span className="font-mono">
                      {new Date(item.date).toLocaleDateString('fa-IR')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status and Action: Standalone Invoice removed as requested, put inside details modal */}
              <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-3 pt-3 sm:pt-0 border-t sm:border-0 border-border/40">
                <span
                  className={`text-xs px-2.5 py-1 rounded-control font-bold border ${
                    item.status === 'COMPLETED' ||
                    item.status === 'FINISHED' ||
                    item.status === 'RECEIVED'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-brand/10 text-brand border-brand/30'
                  }`}
                >
                  {item.statusLabel}
                </span>

                {item.rawProductOrder && (
                  <div className="flex items-center gap-1.5">
                    {item.rawProductOrder.status === 'COMPLETED' && (
                      <button
                        type="button"
                        onClick={() =>
                          setReviewOrder(item.rawProductOrder || null)
                        }
                        className="h-8 text-xs rounded-control bg-brand/10 hover:bg-brand/20 text-brand border border-brand/30 px-2.5 gap-1 font-bold flex items-center duration-motion ease-motion active:scale-[0.98] cursor-pointer"
                      >
                        <Star className="w-3.5 h-3.5 fill-brand text-brand" />
                        <span>ثبت نظر</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedOrder(item.rawProductOrder || null)
                      }
                      className="h-8 text-xs rounded-control border border-border/60 bg-muted/30 hover:bg-muted text-foreground px-3 gap-1.5 font-bold flex items-center duration-motion ease-motion active:scale-[0.98] cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>جزئیات کامل</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {/* Load More Orders Button */}
        {visibleOrdersCount < filteredItems.length && (
          <div className="pt-3 text-center">
            <button
              type="button"
              onClick={() => setVisibleOrdersCount((prev) => prev + 6)}
              className="h-10 px-5 rounded-control border border-border/60 bg-card hover:bg-muted text-foreground font-black text-xs duration-motion ease-motion active:scale-[0.98] shadow-control cursor-pointer inline-flex items-center gap-2"
            >
              <span>بارگذاری سفارش‌های بیشتر</span>
              <span className="text-[11px] text-muted-foreground font-latin">
                (نمایش{' '}
                {toPersianDigits(
                  Math.min(visibleOrdersCount, filteredItems.length),
                )}{' '}
                از {toPersianDigits(filteredItems.length)})
              </span>
            </button>
          </div>
        )}
      </div>

      {/* 3. Comprehensive Order Detail Modal - Graphite Minimal Technical */}
      {selectedOrder &&
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
              zIndex: 2147483647,
            }}
            dir="rtl"
          >
            <div className="min-h-full w-full flex items-start sm:items-center justify-center">
              <div className="w-full max-w-lg my-auto bg-card text-card-foreground rounded-surface border border-border/80 shadow-overlay p-5 sm:p-6 space-y-5 animate-in zoom-in-95">
                {/* Modal Header */}
                <div className="flex items-center justify-between pb-3 border-b border-border/60">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-control bg-secondary text-secondary-foreground border border-border/60 flex items-center justify-center shrink-0 shadow-control">
                      <Package className="w-4 h-4 text-brand" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-foreground">
                        جزئیات سفارش #{selectedOrder.order_no}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {selectedOrder.product_title}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedOrder(null)}
                    className="p-1 rounded-control text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                    aria-label="بستن"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Order Status Stepper */}
                <div className="p-3.5 rounded-control bg-muted/20 border border-border/60 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">وضعیت سفارش:</span>
                    <span
                      className={`font-black text-xs px-2.5 py-0.5 rounded-control ${
                        selectedOrder.status === 'COMPLETED'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-brand/10 text-brand border border-brand/30'
                      }`}
                    >
                      {selectedOrder.status === 'COMPLETED'
                        ? 'تحویل داده شده'
                        : 'در صف اپراتور / در حال پردازش'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-bold pt-1 border-t border-border/40">
                    <div className="text-emerald-400 space-y-0.5">
                      <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center">
                        <Check className="w-3 h-3" />
                      </div>
                      <span>ثبت سفارش</span>
                    </div>
                    <div className="text-emerald-400 space-y-0.5">
                      <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center">
                        <Check className="w-3 h-3" />
                      </div>
                      <span>پرداخت موفق</span>
                    </div>
                    <div
                      className={`space-y-0.5 ${
                        selectedOrder.status === 'COMPLETED'
                          ? 'text-emerald-400'
                          : 'text-brand'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full mx-auto flex items-center justify-center ${
                          selectedOrder.status === 'COMPLETED'
                            ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
                            : 'bg-brand/20 border border-brand/40 text-brand animate-pulse'
                        }`}
                      >
                        {selectedOrder.status === 'COMPLETED' ? (
                          <Check className="w-3 h-3" />
                        ) : (
                          <Clock className="w-3 h-3" />
                        )}
                      </div>
                      <span>تحویل لایسنس</span>
                    </div>
                  </div>
                </div>

                {/* Delivered Credentials or Link */}
                {selectedOrder.delivered_link && (
                  <div className="p-3.5 rounded-control bg-muted/30 border border-border/60 space-y-2">
                    <span className="text-xs font-bold text-foreground block">
                      لینک دعوت اختصاصی اشتراک:
                    </span>
                    <div className="flex items-center justify-between gap-2 bg-card p-2.5 rounded-control border border-border/60">
                      <span className="text-xs font-mono truncate text-brand font-latin">
                        {selectedOrder.delivered_link}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          copyToClipboard(
                            selectedOrder.delivered_link || '',
                            'link',
                            'لینک اشتراک',
                          )
                        }
                        className="h-7 text-xs px-3 rounded-control bg-primary text-primary-foreground font-black shrink-0 duration-motion ease-motion active:scale-[0.98] cursor-pointer shadow-control"
                      >
                        {copiedKey === 'link' ? 'کپی شد!' : 'کپی لینک'}
                      </button>
                    </div>
                  </div>
                )}

                {selectedOrder.delivered_credentials && (
                  <div className="p-3.5 rounded-control bg-muted/30 border border-border/60 space-y-2.5 text-xs">
                    <span className="font-bold text-foreground block">
                      اطلاعات اکانت تحویل‌شده:
                    </span>
                    <div className="space-y-2 font-mono">
                      <div className="flex justify-between items-center bg-card p-2 rounded-control border border-border/40">
                        <span className="text-muted-foreground font-sans">
                          نام کاربری / ایمیل:
                        </span>
                        <span className="text-foreground font-bold font-latin">
                          {selectedOrder.delivered_credentials.email}
                        </span>
                      </div>
                      <div className="flex justify-between items-center bg-card p-2 rounded-control border border-border/40">
                        <span className="text-muted-foreground font-sans">
                          کلمه عبور:
                        </span>
                        <span className="text-foreground font-bold font-latin">
                          {selectedOrder.delivered_credentials.password}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Order Payment & Financial Summary */}
                <div className="p-3.5 rounded-control bg-muted/20 border border-border/40 space-y-2 text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span>شیوه تحویل:</span>
                    <span className="font-bold text-foreground">
                      {selectedOrder.delivery_mode === 'INSTANT_LINK'
                        ? 'لینک دعوت اختصاصی'
                        : selectedOrder.delivery_mode === 'UPGRADE_EXISTING'
                          ? 'ارتقای اکانت شخصی'
                          : 'اکانت آماده اختصاصی'}
                    </span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>تاریخ و زمان ثبت:</span>
                    <span className="font-mono text-foreground font-latin">
                      {new Date(selectedOrder.created_at).toLocaleString(
                        'fa-IR',
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-muted-foreground border-t border-border/40 pt-2 text-sm">
                    <span className="font-bold text-foreground">
                      مبلغ پرداخت‌شده:
                    </span>
                    <span className="font-black text-foreground font-latin">
                      {formatToman(selectedOrder.amount_toman)} تومان
                    </span>
                  </div>
                </div>

                {/* Action Buttons: Invoice moved INSIDE Details modal as requested! */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-2.5 border-t border-border/60">
                  <button
                    type="button"
                    onClick={() => {
                      const ord = selectedOrder
                      setSelectedOrder(null)
                      setInvoiceOrder(ord)
                    }}
                    className="h-10 px-4 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs duration-motion ease-motion active:scale-[0.98] shadow-control flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileText className="w-4 h-4" />
                    <span>مشاهده و چاپ فاکتور رسمی</span>
                  </button>

                  <div className="flex items-center gap-2">
                    {selectedOrder.status === 'COMPLETED' && (
                      <button
                        type="button"
                        onClick={() => {
                          const ord = selectedOrder
                          setSelectedOrder(null)
                          setReviewOrder(ord)
                        }}
                        className="h-10 px-3.5 rounded-control bg-brand/10 hover:bg-brand/20 text-brand border border-brand/30 text-xs font-bold duration-motion ease-motion active:scale-[0.98] flex items-center gap-1.5 cursor-pointer"
                      >
                        <Star className="w-3.5 h-3.5 fill-brand text-brand" />
                        <span>ثبت نظر</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setSelectedOrder(null)}
                      className="h-10 px-4 rounded-control border border-border/60 bg-card hover:bg-muted text-xs font-bold text-muted-foreground hover:text-foreground duration-motion ease-motion active:scale-[0.98] cursor-pointer"
                    >
                      بستن
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Review Submission Modal for Orders */}
      {reviewOrder && (
        <SubmitReviewModal
          isOpen={!!reviewOrder}
          onClose={() => setReviewOrder(null)}
          productSlug={reviewOrder.product_slug || ''}
          productTitle={reviewOrder.product_title || 'محصول خریداری شده'}
          productId={
            reviewOrder.product_id ? String(reviewOrder.product_id) : undefined
          }
          orderId={String(reviewOrder.id || '')}
          orderNumber={reviewOrder.order_no}
          customer={customer}
        />
      )}

      {/* Official Tax Invoice & Proforma Modal */}
      {invoiceOrder && (
        <OfficialInvoiceModal
          isOpen={!!invoiceOrder}
          onClose={() => setInvoiceOrder(null)}
          orderIdOrNo={invoiceOrder.order_no || String(invoiceOrder.id || '')}
          accessToken={invoiceOrder.token}
        />
      )}
    </div>
  )
}
