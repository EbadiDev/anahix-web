import {
  Clock,
  Key,
  Package,
  Search,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react'
import type React from 'react'
import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import type { Order } from '../../types'
import { toPersianDigits } from '../../utils/formatters'

interface ProfileProductsTabProps {
  orders: Order[]
}

export const ProfileProductsTab: React.FC<ProfileProductsTabProps> = ({
  orders,
}) => {
  const [selectedProduct, setSelectedProduct] = useState<Order | null>(null)
  const [copiedKey, setCopiedKey] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [visibleCount, setVisibleCount] = useState<number>(6)

  // Filter completed and digital product orders
  const digitalProducts = useMemo(() => {
    return orders.filter(
      (o) => o.delivery_mode !== undefined && o.product_title,
    )
  }, [orders])

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return digitalProducts
    const q = searchQuery.toLowerCase().trim()
    return digitalProducts.filter(
      (o) =>
        o.product_title.toLowerCase().includes(q) ||
        o.order_no.toLowerCase().includes(q),
    )
  }, [digitalProducts, searchQuery])

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

        {/* Search & Action Bar */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-56">
            <input
              type="text"
              placeholder="جستجو در اشتراک‌ها..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setVisibleCount(6)
              }}
              className="w-full h-9 pr-8 pl-3 text-xs rounded-field bg-muted/20 border border-border/60 text-foreground outline-none focus:border-brand transition-colors"
            />
            <Search className="w-3.5 h-3.5 absolute right-2.5 top-3 text-muted-foreground pointer-events-none" />
          </div>

          <Link to="/">
            <button
              type="button"
              className="h-9 px-4 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs flex items-center gap-1.5 duration-motion ease-motion active:scale-[0.98] shadow-control cursor-pointer shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>خرید اشتراک جدید</span>
            </button>
          </Link>
        </div>
      </div>

      {/* 2. Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="p-12 rounded-surface border border-dashed border-border/60 bg-card/40 text-center">
          <Package className="w-10 h-10 text-muted-foreground/60 mx-auto mb-3" />
          <h4 className="text-sm font-bold text-foreground">
            {searchQuery
              ? 'اشتراکی با این عبارت یافت نشد'
              : 'هنوز اشتراک یا محصول دیجیتالی ثبت نکرده‌اید'}
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
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredProducts.slice(0, visibleCount).map((order) => {
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
                          {new Date(order.created_at).toLocaleDateString(
                            'fa-IR',
                          )}
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
                      <Key className="w-3.5 h-3.5 text-brand" />
                      <span>اطلاعات لایسنس</span>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Load More Products Button */}
          {visibleCount < filteredProducts.length && (
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => setVisibleCount((prev) => prev + 6)}
                className="h-10 px-5 rounded-control border border-border/60 bg-card hover:bg-muted text-foreground font-black text-xs duration-motion ease-motion active:scale-[0.98] shadow-control cursor-pointer inline-flex items-center gap-2"
              >
                <span>بارگذاری اشتراک‌های بیشتر</span>
                <span className="text-[11px] text-muted-foreground font-latin">
                  (نمایش{' '}
                  {toPersianDigits(
                    Math.min(visibleCount, filteredProducts.length),
                  )}{' '}
                  از {toPersianDigits(filteredProducts.length)})
                </span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Product Detail / License Modal - Graphite Overlay */}
      {selectedProduct &&
        createPortal(
          <div
            className="fixed inset-0 z-[99999] overflow-y-auto bg-black/75 backdrop-blur-md p-3 sm:p-6 animate-in fade-in"
            style={{ top: 0, left: 0, right: 0, bottom: 0 }}
            dir="rtl"
          >
            <div className="min-h-full w-full flex items-start sm:items-center justify-center">
              <div className="w-full max-w-md my-auto bg-card text-card-foreground rounded-surface border border-border/80 shadow-overlay p-6 space-y-4 animate-in zoom-in-95">
                <div className="flex items-center justify-between pb-3 border-b border-border/60">
                  <div>
                    <h3 className="text-sm font-black text-foreground">
                      {selectedProduct.product_title}
                    </h3>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5 font-latin">
                      #{selectedProduct.order_no}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedProduct(null)}
                    className="p-1 rounded-control text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {selectedProduct.delivered_link ? (
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-foreground">
                      لینک دعوت اشتراک فعال:
                    </span>
                    <div className="p-2.5 rounded-control bg-muted/30 border border-border/60 flex items-center justify-between gap-2">
                      <span className="text-xs font-mono truncate text-brand font-latin">
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
                  <div className="p-3.5 rounded-control bg-muted/30 border border-border/60 space-y-2.5 text-xs font-mono font-latin">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">
                        نام کاربری / ایمیل:
                      </span>
                      <span className="text-foreground font-bold">
                        {selectedProduct.delivered_credentials.email}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">رمز عبور:</span>
                      <span className="text-foreground font-bold">
                        {selectedProduct.delivered_credentials.password}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-control bg-amber-500/10 border border-amber-500/20 text-xs text-amber-500 flex items-center gap-2">
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
                    className="h-8 px-4 rounded-control border border-border/60 bg-card hover:bg-muted text-xs font-bold text-foreground duration-motion ease-motion active:scale-[0.98] cursor-pointer"
                  >
                    بستن
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  )
}
