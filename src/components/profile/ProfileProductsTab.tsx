import { Clock, Key, Package, ShieldCheck, Sparkles } from 'lucide-react'
import type React from 'react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Order } from '../../types'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'

interface ProfileProductsTabProps {
  orders: Order[]
}

export const ProfileProductsTab: React.FC<ProfileProductsTabProps> = ({
  orders,
}) => {
  const [selectedProduct, setSelectedProduct] = useState<Order | null>(null)
  const [copiedKey, setCopiedKey] = useState('')

  // Filter completed and digital product orders
  const digitalProducts = orders.filter(
    (o) => o.delivery_mode !== undefined && o.product_title,
  )

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(''), 2000)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Header Banner */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              اشتراک‌ها و لایسنس‌های هوش مصنوعی من (My Products)
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            دسترسی به کلیدهای اشتراک، اکانت‌های فعال، لینک‌های دعوت و تاریخ انقضا
          </p>
        </div>

        <Link to="/">
          <Button className="h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm shadow-blue-500/20">
            <Sparkles className="w-3.5 h-3.5" />+ خرید اشتراک جدید
          </Button>
        </Link>
      </div>

      {/* 2. Products Grid */}
      {digitalProducts.length === 0 ? (
        <div className="p-12 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-center">
          <Package className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
            هنوز اشتراک یا محصول دیجیتالی ثبت نکرده‌اید
          </h4>
          <p className="text-xs text-slate-400 mt-1">
            اکانت‌های پرمیوم هوش مصنوعی (ChatGPT Plus, Claude Pro, Midjourney) با
            تحویل آنی
          </p>
          <Link to="/" className="inline-block mt-4">
            <Button size="sm" className="h-9 text-xs rounded-xl">
              مشاهده کاتالوگ محصولات
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {digitalProducts.map((order) => {
            const isCompleted = order.status === 'COMPLETED'

            return (
              <div
                key={order.order_no}
                className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:border-blue-300 dark:hover:border-blue-700 transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-base shadow-xs">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {order.product_title}
                        </h4>
                        <span className="text-[11px] font-mono text-slate-400">
                          سفارش #{order.order_no}
                        </span>
                      </div>
                    </div>

                    <Badge
                      variant="outline"
                      className={`text-xs px-2.5 py-0.5 ${
                        isCompleted
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60'
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border-amber-200 dark:border-amber-800/60'
                      }`}
                    >
                      {isCompleted ? 'فعال و تحویل‌شده' : 'در حال پردازش'}
                    </Badge>
                  </div>

                  <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-500">
                      <span>روش تحویل:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {order.delivery_mode === 'INSTANT_LINK'
                          ? 'لینک دعوت اختصاصی'
                          : order.delivery_mode === 'UPGRADE_EXISTING'
                            ? 'ارتقای اکانت شخصی'
                            : 'اکانت اختصاصی آماده'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-500">
                      <span>تاریخ خرید:</span>
                      <span className="font-mono text-slate-700 dark:text-slate-300">
                        {new Date(order.created_at).toLocaleDateString('fa-IR')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-500">
                      <span>مبلغ پرداخت‌شده:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {order.amount_toman.toLocaleString('fa-IR')} تومان
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 gap-2">
                  <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    <ShieldCheck className="w-4 h-4" />
                    <span>ضمانت کامل کارکرد</span>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedProduct(order)}
                    className="h-8 text-xs rounded-xl px-3"
                  >
                    <Key className="w-3.5 h-3.5 ml-1.5" />
                    اطلاعات لایسنس
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Product Detail / License Modal */}
      {selectedProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
          dir="rtl"
        >
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {selectedProduct.product_title}
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  #{selectedProduct.order_no}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            {selectedProduct.delivered_link ? (
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  لینک دعوت اشتراک فعال:
                </span>
                <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 flex items-center justify-between gap-2">
                  <span className="text-xs font-mono truncate text-blue-700 dark:text-blue-300">
                    {selectedProduct.delivered_link}
                  </span>
                  <Button
                    size="sm"
                    onClick={() =>
                      copyToClipboard(
                        selectedProduct.delivered_link || '',
                        'modal_link',
                      )
                    }
                    className="h-7 text-xs px-2.5 bg-blue-600 text-white"
                  >
                    {copiedKey === 'modal_link' ? 'کپی شد' : 'کپی'}
                  </Button>
                </div>
              </div>
            ) : selectedProduct.delivered_credentials ? (
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5 text-xs font-mono">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">نام کاربری / ایمیل:</span>
                  <span className="text-slate-800 dark:text-slate-200 font-bold">
                    {selectedProduct.delivered_credentials.email}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">رمز عبور:</span>
                  <span className="text-slate-800 dark:text-slate-200 font-bold">
                    {selectedProduct.delivered_credentials.password}
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
                <Clock className="w-4 h-4 shrink-0" />
                <span>
                  سفارش در صف اپراتور قرار دارد و به زودی اطلاعات تحویل ثبت
                  خواهد شد.
                </span>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedProduct(null)}
                className="h-8 text-xs rounded-xl px-4"
              >
                بستن
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
