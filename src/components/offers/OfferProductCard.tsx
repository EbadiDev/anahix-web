import {
  ArrowLeft,
  Clock,
  Flame,
  ShoppingCart,
  Sparkles,
  Star,
  UserCheck,
  Zap,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { cartStore, useCart } from '../../lib/cartStore'
import type { Product } from '../../types'
import { formatToman, toPersianDigits } from '../../utils/formatters'
import { ClaudeIcon, CursorIcon, GeminiIcon, OpenAIIcon } from '../BrandIcons'
import { useNotification } from '../vibefarsi/NotificationContext'
import { QuantitySelector } from '../vibefarsi/QuantitySelector'

interface OfferProductCardProps {
  product: Product
}

export const OfferProductCard: React.FC<OfferProductCardProps> = ({
  product,
}) => {
  const { cartAdded } = useNotification()
  const { items } = useCart()

  // Cart quantity check
  const cartItem = items.find(
    (item) => String(item.product.id) === String(product.id) && !item.plan,
  )
  const currentQuantity = cartItem ? cartItem.quantity : 0

  // Pricing calculations
  const effectivePrice =
    product.is_flash_sale && product.flash_sale_price_toman
      ? product.flash_sale_price_toman
      : product.price_toman

  const originalPrice =
    product.original_price_toman &&
    product.original_price_toman > effectivePrice
      ? product.original_price_toman
      : product.is_flash_sale && product.flash_sale_price_toman
        ? product.price_toman
        : Math.round((product.price_toman * 1.25) / 10000) * 10000

  const discountPercent =
    product.discount_percent && product.discount_percent > 0
      ? product.discount_percent
      : originalPrice > effectivePrice
        ? Math.round(((originalPrice - effectivePrice) / originalPrice) * 100)
        : 20

  // Target expiry time for countdown (if timed discount)
  const hasExpiryTimer = Boolean(
    product.is_flash_sale && product.flash_sale_end_at,
  )
  const targetTime = hasExpiryTimer
    ? new Date(product.flash_sale_end_at as string).getTime()
    : 0

  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
  })

  useEffect(() => {
    if (!hasExpiryTimer || !targetTime) return

    const calculate = () => {
      const now = Date.now()
      const diff = targetTime - now

      if (diff <= 0) {
        setTimeLeft({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          isExpired: true,
        })
        return
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor(
        (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
      )
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      setTimeLeft({ days, hours, minutes, seconds, isExpired: false })
    }

    calculate()
    const timer = setInterval(calculate, 1000)
    return () => clearInterval(timer)
  }, [hasExpiryTimer, targetTime])

  // Determine Brand Details
  const getBrandDetails = () => {
    if (product.icon_url) {
      return {
        icon: (
          <img
            src={product.icon_url}
            alt={product.title_fa}
            className="h-7 w-7 object-contain"
          />
        ),
        brandName: product.group_title_fa || product.title_fa,
      }
    }

    const slug = (product.title_en || product.slug || '').toLowerCase()
    if (slug.includes('chatgpt') || slug.includes('openai')) {
      return {
        icon: <OpenAIIcon className="h-7 w-7 text-emerald-400" />,
        brandName: 'OpenAI',
      }
    }
    if (slug.includes('claude') || slug.includes('anthropic')) {
      return {
        icon: <ClaudeIcon className="h-7 w-7 text-amber-500" />,
        brandName: 'Anthropic Claude',
      }
    }
    if (slug.includes('gemini') || slug.includes('google')) {
      return {
        icon: <GeminiIcon className="h-7 w-7 text-blue-400" />,
        brandName: 'Google Gemini',
      }
    }
    if (slug.includes('cursor')) {
      return {
        icon: <CursorIcon className="h-7 w-7 text-sky-400" />,
        brandName: 'Cursor AI',
      }
    }
    return {
      icon: <Sparkles className="h-7 w-7 text-brand" />,
      brandName: product.group_title_fa || 'سرویس ویژه',
    }
  }

  const brand = getBrandDetails()

  const handleAddToCart = () => {
    cartStore.addItem(product)
    cartAdded(product.title_fa)
  }

  const handleQuantityChange = (q: number) => {
    if (q <= 0) {
      cartStore.removeItem(product.id)
    } else {
      cartStore.updateQuantity(product.id, q)
    }
  }

  return (
    <div
      dir="rtl"
      className="group relative flex flex-col justify-between rounded-surface border border-border/80 bg-card overflow-hidden shadow-surface hover:border-brand/40 duration-motion ease-motion transition-all hover:-translate-y-1 select-none"
    >
      <div>
        {/* Cover Graphic Container */}
        <div className="relative h-44 sm:h-48 w-full overflow-hidden bg-muted">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.title_fa}
              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-gradient-to-tr from-slate-900 to-zinc-950 p-6">
              <div className="p-3.5 rounded-control bg-zinc-900/90 border border-zinc-800 shadow-inner">
                {brand.icon}
              </div>
            </div>
          )}

          {/* Scrim Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/40" />

          {/* Floating Top Badges */}
          <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-none">
            {/* Delivery mode */}
            <div className="flex items-center gap-1.5">
              {product.delivery_mode === 'UPGRADE_EXISTING' ? (
                <span className="inline-flex items-center gap-1 rounded-control bg-amber-500/95 text-zinc-950 text-[10px] font-black px-2 py-0.5 shadow-xs backdrop-blur-md">
                  <UserCheck className="h-3 w-3" />
                  <span>ارتقای اکانت شخصی</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-control bg-primary text-primary-foreground text-[10px] font-black px-2 py-0.5 shadow-xs backdrop-blur-md">
                  <Zap className="h-3 w-3" />
                  <span>تحویل آنی</span>
                </span>
              )}
            </div>

            {/* Discount Percentage Badge (Required by User) */}
            <span className="inline-flex items-center gap-1 rounded-control bg-rose-600 text-white text-[11px] font-black px-2.5 py-0.5 shadow-control animate-pulse">
              <Flame className="h-3.5 w-3.5" />
              <span>{toPersianDigits(discountPercent)}٪ تخفیف ویژه</span>
            </span>
          </div>

          {/* Conditional: If timed discount, render countdown clock bar; if standard discount, render sleek badge */}
          {hasExpiryTimer ? (
            <div className="absolute bottom-2.5 inset-x-3 flex items-center justify-between p-2 rounded-control bg-slate-950/85 backdrop-blur-md border border-white/15 text-white shadow-xs">
              <div className="flex items-center gap-1 text-[11px] font-bold text-amber-300">
                <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>
                  {timeLeft.isExpired
                    ? 'مهلت پایان یافت'
                    : 'زمان تا پایان تخفیف:'}
                </span>
              </div>

              {timeLeft.isExpired ? (
                <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-control border border-rose-500/20">
                  منقضی شده
                </span>
              ) : (
                <div
                  className="flex items-center gap-1 text-xs font-mono font-latin text-white font-black"
                  dir="ltr"
                >
                  {timeLeft.days > 0 && (
                    <>
                      <span className="px-1.5 py-0.2 rounded-control bg-white/15 border border-white/20">
                        {toPersianDigits(
                          String(timeLeft.days).padStart(2, '0'),
                        )}
                        d
                      </span>
                      <span>:</span>
                    </>
                  )}
                  <span className="px-1.5 py-0.2 rounded-control bg-white/15 border border-white/20">
                    {toPersianDigits(String(timeLeft.hours).padStart(2, '0'))}h
                  </span>
                  <span>:</span>
                  <span className="px-1.5 py-0.2 rounded-control bg-white/15 border border-white/20">
                    {toPersianDigits(String(timeLeft.minutes).padStart(2, '0'))}
                    m
                  </span>
                  <span>:</span>
                  <span className="px-1.5 py-0.2 rounded-control bg-rose-500/30 text-rose-300 border border-rose-500/40">
                    {toPersianDigits(String(timeLeft.seconds).padStart(2, '0'))}
                    s
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="absolute bottom-2.5 inset-x-3 flex items-center justify-between p-2 rounded-control bg-slate-950/80 backdrop-blur-md border border-white/15 text-white shadow-xs">
              <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>تخفیف ویژه اختصاصی</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-control bg-white/10 text-white font-latin border border-white/20">
                قیمت ویژه
              </span>
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="p-4 sm:p-5 pt-3 space-y-3 text-right">
          <div>
            <div className="flex items-center justify-between gap-2 mb-1">
              <Link
                to={`/products/${product.slug || product.id}`}
                className="block hover:text-brand transition-colors"
              >
                <h3 className="text-sm sm:text-base font-black text-foreground line-clamp-1">
                  {product.title_fa}
                </h3>
              </Link>

              <div className="flex items-center gap-1 text-[11px] font-bold text-brand bg-brand/10 border border-brand/20 px-2 py-0.5 rounded-control shrink-0">
                <Star className="h-3 w-3 fill-brand text-brand" />
                <span>{toPersianDigits(product.rating_average || 4.9)}</span>
              </div>
            </div>

            <p
              className="text-xs text-muted-foreground font-latin text-left line-clamp-1"
              dir="ltr"
            >
              {product.title_en}
            </p>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
            {product.description_fa}
          </p>

          {/* Equal Height Guaranteed Container */}
          <div className="h-7 flex items-center">
            {product.flash_sale_stock ? (
              <div className="w-full space-y-1">
                <div className="flex justify-between text-[10px] font-bold text-muted-foreground">
                  <span className="text-brand flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    <span>موجودی جشنواره:</span>
                  </span>
                  <span className="font-latin">
                    {toPersianDigits(product.flash_sale_sold || 0)} از{' '}
                    {toPersianDigits(product.flash_sale_stock || 50)} فروخته شده
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden border border-border/40">
                  <div
                    className="h-full bg-brand rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round(
                          ((product.flash_sale_sold || 0) /
                            Math.max(product.flash_sale_stock || 1, 1)) *
                            100,
                        ),
                      )}%`,
                    }}
                  />
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Pricing & Footer Actions */}
      <div className="p-4 sm:p-5 pt-0 space-y-3">
        {/* Pricing Row (Unified Graphite Typography & Contrast - Image 2 Fix) */}
        <div className="flex items-baseline justify-between pt-2 border-t border-border/60">
          <span className="text-xs text-muted-foreground font-medium">
            قیمت سرویس:
          </span>
          <div className="flex items-baseline gap-2">
            {originalPrice > effectivePrice && (
              <span className="text-xs text-muted-foreground/60 line-through font-sans font-medium">
                {formatToman(originalPrice)}
              </span>
            )}
            <div className="flex items-baseline gap-1">
              <span className="text-lg sm:text-xl font-black font-sans tracking-tight text-foreground">
                {formatToman(effectivePrice)}
              </span>
              <span className="text-xs text-muted-foreground font-sans">
                تومان
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          {timeLeft.isExpired ? (
            <button
              type="button"
              disabled
              className="w-full h-10 rounded-control bg-muted text-muted-foreground font-bold text-xs cursor-not-allowed opacity-60 flex items-center justify-center gap-1.5"
            >
              <span>مهلت تخفیف ویژه به پایان رسید</span>
            </button>
          ) : currentQuantity > 0 ? (
            <QuantitySelector
              value={currentQuantity}
              onChange={handleQuantityChange}
              size="md"
              className="w-full justify-between"
            />
          ) : (
            <button
              type="button"
              onClick={handleAddToCart}
              className="w-full h-10 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs duration-motion ease-motion active:scale-[0.98] shadow-control flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShoppingCart className="h-4 w-4" />
              <span>افزودن به سبد خرید با تخفیف</span>
            </button>
          )}

          <Link
            to={`/products/${product.slug || product.id}`}
            className="w-full h-9 rounded-control border border-border/60 bg-secondary hover:bg-muted text-xs font-bold text-foreground duration-motion active:scale-[0.98] flex items-center justify-center gap-1.5 transition-colors"
          >
            <span>مشاهده پلن‌ها و جزئیات</span>
            <ArrowLeft className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  )
}
