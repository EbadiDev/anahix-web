import { Eye, Package, Radio, Search, Sparkles, Star } from 'lucide-react'
import type React from 'react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { CustomerProfile, Order, VirtualNumberOrder } from '../../types'
import { SubmitReviewModal } from '../reviews/SubmitReviewModal'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Input } from '../ui/input'

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
  const [activeFilter, setActiveFilter] = useState<OrderFilterType>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [copiedKey, setCopiedKey] = useState('')
  const [reviewOrder, setReviewOrder] = useState<Order | null>(null)

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

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(''), 2000)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Header and Filters */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-600" />
              تاریخچه و پیگیری سفارش‌ها
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              مجموع {unifiedItems.length} سفارش در حساب کاربری شما ثبت شده است
            </p>
          </div>

          <div className="w-full sm:w-64 relative">
            <Input
              type="text"
              placeholder="جستجو با شماره سفارش یا عنوان..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 text-xs rounded-xl pr-9 pl-3"
            />
            <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-400" />
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          <Button
            variant={activeFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveFilter('all')}
            className="h-7 text-xs rounded-lg px-3"
          >
            همه سفارش‌ها ({unifiedItems.length})
          </Button>

          <Button
            variant={
              activeFilter === 'digital_products' ? 'default' : 'outline'
            }
            size="sm"
            onClick={() => setActiveFilter('digital_products')}
            className="h-7 text-xs rounded-lg px-3"
          >
            اشتراک‌های هوش مصنوعی
          </Button>

          <Button
            variant={activeFilter === 'virtual_numbers' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveFilter('virtual_numbers')}
            className="h-7 text-xs rounded-lg px-3"
          >
            شماره‌های مجازی (SMS)
          </Button>

          <Button
            variant={activeFilter === 'completed' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveFilter('completed')}
            className="h-7 text-xs rounded-lg px-3"
          >
            تکمیل شده
          </Button>

          <Button
            variant={activeFilter === 'processing' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveFilter('processing')}
            className="h-7 text-xs rounded-lg px-3"
          >
            در حال پردازش
          </Button>
        </div>
      </div>

      {/* 2. Order Items List */}
      <div className="space-y-3">
        {filteredItems.length === 0 ? (
          <div className="p-12 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center">
            <Package className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
              سفارشی در این دسته‌بندی یافت نشد
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              جهت ثبت سفارش جدید می‌توانید به فروشگاه یا بخش شماره‌های مجازی
              مراجعه فرمایید.
            </p>
            <div className="mt-4 flex items-center justify-center gap-3">
              <Link to="/">
                <Button size="sm" className="h-8 text-xs rounded-xl">
                  خرید اشتراک
                </Button>
              </Link>
              <Link to="/virtual-numbers">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs rounded-xl"
                >
                  دریافت شماره
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:border-blue-300 dark:hover:border-blue-700 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3.5">
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                    item.type === 'virtual_number'
                      ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400'
                      : 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400'
                  }`}
                >
                  {item.type === 'virtual_number' ? (
                    <Radio className="w-5 h-5" />
                  ) : (
                    <Sparkles className="w-5 h-5" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      {item.title}
                    </h4>
                    <span className="font-mono text-[11px] text-slate-400">
                      #{item.orderNo}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    <span>{item.subtitle}</span>
                    <span>•</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      {item.amount.toLocaleString('fa-IR')} تومان
                    </span>
                    <span>•</span>
                    <span className="font-mono">
                      {new Date(item.date).toLocaleDateString('fa-IR')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-3 pt-3 sm:pt-0 border-t sm:border-0 border-slate-100 dark:border-slate-800">
                <Badge
                  variant="outline"
                  className={`text-xs px-2.5 py-1 ${
                    item.status === 'COMPLETED' ||
                    item.status === 'FINISHED' ||
                    item.status === 'RECEIVED'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60'
                      : 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 border-blue-200 dark:border-blue-800/60'
                  }`}
                >
                  {item.statusLabel}
                </Badge>

                {item.rawProductOrder && (
                  <div className="flex items-center gap-1.5">
                    {item.rawProductOrder.status === 'COMPLETED' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setReviewOrder(item.rawProductOrder || null)
                        }
                        className="h-8 text-xs rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30 gap-1 font-bold"
                      >
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>ثبت نظر</span>
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setSelectedOrder(item.rawProductOrder || null)
                      }
                      className="h-8 text-xs rounded-xl"
                    >
                      <Eye className="w-3.5 h-3.5 ml-1.5" />
                      جزئیات
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
          dir="rtl"
        >
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  جزئیات سفارش #{selectedOrder.order_no}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {selectedOrder.product_title}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            {/* Delivered Credentials or Link */}
            {selectedOrder.delivered_link && (
              <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60">
                <span className="text-xs font-semibold text-blue-800 dark:text-blue-300 block mb-1.5">
                  لینک دعوت اشتراک:
                </span>
                <div className="flex items-center justify-between gap-2 bg-white dark:bg-slate-950 p-2 rounded-lg border border-blue-100 dark:border-blue-900/50">
                  <span className="text-xs font-mono truncate text-slate-700 dark:text-slate-300">
                    {selectedOrder.delivered_link}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      copyToClipboard(
                        selectedOrder.delivered_link || '',
                        'link',
                      )
                    }
                    className="h-7 text-xs px-2"
                  >
                    {copiedKey === 'link' ? 'کپی شد!' : 'کپی لینک'}
                  </Button>
                </div>
              </div>
            )}

            {selectedOrder.delivered_credentials && (
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                  اطلاعات اکانت تحویل‌شده:
                </span>
                <div className="text-xs space-y-1 font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Email:</span>
                    <span className="text-slate-800 dark:text-slate-200">
                      {selectedOrder.delivered_credentials.email}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Password:</span>
                    <span className="text-slate-800 dark:text-slate-200">
                      {selectedOrder.delivered_credentials.password}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-2 flex items-center justify-between">
              {selectedOrder.status === 'COMPLETED' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const ord = selectedOrder
                    setSelectedOrder(null)
                    setReviewOrder(ord)
                  }}
                  className="rounded-xl text-xs h-9 px-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30 gap-1.5 font-bold"
                >
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>ثبت نظر و امتیاز برای این محصول</span>
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedOrder(null)}
                className="rounded-xl text-xs h-9 px-4 mr-auto"
              >
                بستن
              </Button>
            </div>
          </div>
        </div>
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
    </div>
  )
}
