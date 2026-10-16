import { Clock, Key, Package, ShieldCheck, Sparkles, X } from 'lucide-react'
import type React from 'react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Order } from '../../types'

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
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header Banner - Graphite Technical Minimal */}
      <div className="rounded-surface border border-border/40 bg-card p-5 sm:p-6 shadow-surface flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-control bg-secondary text-secondary-foreground border border-border/60 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-brand" />
            </div>
            <h3 className="text-base font-bold text-foreground">
              اشتراک‌ها و لایسنس‌های هوش مصنوعی من (My Products)
            </h3>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            دسترسی به کلیدهای اشتراک، اکانت‌های فعال، لینک‌های دعوت و تاریخ انقضا
          </p>
        </div>

        {/* Primary button is white with black text */}
        <Link to="/">
          <button
            type="button"
            className="h-9 px-4 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs flex items-center gap-1.5 duration-motion ease-motion active:scale-[0.98] shadow-control cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>خرید اشتراک جدید</span>
          </button>
        </Link>
      </div>

      {/* 2. Products Grid */}
      {digitalProducts.length === 0 ? (
        <div className="p-12 rounded-surface border border-dashed border-border/60 bg-card/40 text-center">
          <Package className="w-10 h-10 text-muted-foreground/60 mx-auto mb-3" />
          <h4 className="text-sm font-bold text-foreground">
            هنوز اشتراک یا محصول دیجیتالی ثبت نکرده‌اید
          </h4>
          <p className="text-xs text-muted-foreground mt-1">
            اکانت‌های پرمیوم هوش مصنوعی (ChatGPT Plus, Claude Pro, Gemini) با
            تحویل آنی
          </p>
          <Link to="/" className="inline-block mt-4">
            <button
              type="button"
              className="h-9 px-4 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs duration-motion ease-motion active:scale-[0.98] shadow-control cursor-pointer"
            >
              مشاهده کاتالوگ محصولات
            </button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {digitalProducts.map((order) => {
            const isCompleted = order.status === 'COMPLETED'

            return (
              <div
                key={order.order_no}
                className="p-5 rounded-surface border border-border/40 bg-card shadow-surface duration-motion ease-motion hover:border-zinc-700/80 transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-control bg-secondary text-secondary-foreground border border-border/60 flex items-center justify-center font-bold text-base shadow-control shrink-0">
                        <Sparkles className="w-4 h-4 text-brand" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-foreground">
                          {order.product_title}
                        </h4>
                        <span className="text-[11px] font-mono text-muted-foreground">
                          سفارش #{order.order_no}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-control font-bold border ${
                        isCompleted
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-brand/10 text-brand border-brand/20'
                      }`}
                    >
                      {isCompleted ? 'فعال و تحویل‌شده' : 'در حال پردازش'}
                    </span>
                  </div>

                  <div className="mt-4 p-3 rounded-control bg-muted/30 border border-border/30 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>روش تحویل:</span>
                      <span className="font-semibold text-foreground">
                        {order.delivery_mode === 'INSTANT_LINK'
                          ? 'لینک دعوت اختصاصی'
                          : order.delivery_mode === 'UPGRADE_EXISTING'
                            ? 'ارتقای اکانت شخصی'
                            : 'اکانت اختصاصی آماده'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>تاریخ خرید:</span>
                      <span className="font-mono text-foreground font-latin">
                        {new Date(order.created_at).toLocaleDateString('fa-IR')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>مبلغ پرداخت‌شده:</span>
                      <span className="font-bold text-foreground font-latin">
                        {order.amount_toman.toLocaleString('fa-IR')} تومان
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border/60 gap-2">
                  <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                    <ShieldCheck className="w-4 h-4" />
                    <span>ضمانت کامل کارکرد</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedProduct(order)}
                    className="h-8 px-3 rounded-control border border-border/40 bg-card hover:bg-muted text-xs font-bold text-foreground duration-motion ease-motion active:scale-[0.98] flex items-center gap-1.5 cursor-pointer"
                  >
                    <Key className="w-3.5 h-3.5" />
                    <span>اطلاعات لایسنس</span>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Product Detail / License Modal - Graphite Overlay */}
      {selectedProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in"
          dir="rtl"
        >
          <div className="w-full max-w-md bg-zinc-950 rounded-surface border border-zinc-800 shadow-overlay p-6 space-y-4 text-zinc-100">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div>
                <h3 className="text-sm font-bold text-white">
                  {selectedProduct.product_title}
                </h3>
                <p className="text-xs text-zinc-400 font-mono mt-0.5">
                  #{selectedProduct.order_no}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="p-1 rounded-control text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {selectedProduct.delivered_link ? (
              <div className="space-y-2">
                <span className="text-xs font-semibold text-zinc-300">
                  لینک دعوت اشتراک فعال:
                </span>
                <div className="p-2.5 rounded-control bg-zinc-900 border border-zinc-800 flex items-center justify-between gap-2">
                  <span className="text-xs font-mono truncate text-blue-400">
                    {selectedProduct.delivered_link}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(
                        selectedProduct.delivered_link || '',
                        'modal_link',
                      )
                    }
                    className="h-7 px-3 rounded-control bg-primary text-primary-foreground font-black text-xs duration-motion ease-motion active:scale-[0.98] shadow-control cursor-pointer shrink-0"
                  >
                    {copiedKey === 'modal_link' ? 'کپی شد' : 'کپی'}
                  </button>
                </div>
              </div>
            ) : selectedProduct.delivered_credentials ? (
              <div className="p-3.5 rounded-control bg-zinc-900 border border-zinc-800 space-y-2.5 text-xs font-mono">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">نام کاربری / ایمیل:</span>
                  <span className="text-white font-bold">
                    {selectedProduct.delivered_credentials.email}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">رمز عبور:</span>
                  <span className="text-white font-bold">
                    {selectedProduct.delivered_credentials.password}
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-control bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center gap-2">
                <Clock className="w-4 h-4 shrink-0" />
                <span>
                  سفارش در صف اپراتور قرار دارد و به زودی اطلاعات تحویل ثبت
                  خواهد شد.
                </span>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="h-8 px-4 rounded-control border border-zinc-800 hover:bg-zinc-900 text-xs font-bold text-zinc-300 duration-motion ease-motion active:scale-[0.98] cursor-pointer"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
