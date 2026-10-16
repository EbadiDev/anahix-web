import {
  ArrowLeft,
  Check,
  Clock,
  Flame,
  KeyRound,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Star,
  UserCheck,
  Zap,
} from 'lucide-react'
import type React from 'react'
import { Link } from 'react-router-dom'
import { cartStore } from '../lib/cartStore'
import type { Product } from '../types'
import { ClaudeIcon, CursorIcon, GeminiIcon, OpenAIIcon } from './BrandIcons'
import { BorderBeam } from './vibefarsi/BorderBeam'
import { useNotification } from './vibefarsi/NotificationContext'

interface ProductCardProps {
  product: Product
  onSelect: (product: Product) => void
}

function toPersianDigits(n: number | string): string {
  const f = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']
  return String(n).replace(/\d/g, (d) => f[Number(d)])
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onSelect,
}) => {
  const { cartAdded } = useNotification()

  // Determine Brand Details & Default Graphic Cover
  const getBrandDetails = () => {
    const slug = (product.title_en || product.slug || '').toLowerCase()
    if (slug.includes('chatgpt') || slug.includes('openai')) {
      return {
        icon: (
          <OpenAIIcon className="h-7 w-7 text-emerald-400 group-hover:scale-110 transition-transform duration-200" />
        ),
        bg: 'from-emerald-950/40 via-zinc-900 to-zinc-950',
        glow: 'bg-emerald-500/10',
        brandName: 'OpenAI',
      }
    }
    if (slug.includes('claude') || slug.includes('anthropic')) {
      return {
        icon: (
          <ClaudeIcon className="h-7 w-7 text-amber-400 group-hover:scale-110 transition-transform duration-200" />
        ),
        bg: 'from-amber-950/40 via-zinc-900 to-zinc-950',
        glow: 'bg-amber-500/10',
        brandName: 'Anthropic',
      }
    }
    if (slug.includes('gemini') || slug.includes('google')) {
      return {
        icon: (
          <GeminiIcon className="h-7 w-7 text-blue-400 group-hover:scale-110 transition-transform duration-200" />
        ),
        bg: 'from-blue-950/40 via-zinc-900 to-zinc-950',
        glow: 'bg-blue-500/10',
        brandName: 'Google One',
      }
    }
    if (slug.includes('cursor')) {
      return {
        icon: (
          <CursorIcon className="h-7 w-7 text-sky-400 group-hover:scale-110 transition-transform duration-200" />
        ),
        bg: 'from-sky-950/40 via-zinc-900 to-zinc-950',
        glow: 'bg-sky-500/10',
        brandName: 'Cursor AI',
      }
    }
    return {
      icon: (
        <Sparkles className="h-7 w-7 text-blue-400 group-hover:scale-110 transition-transform duration-200" />
      ),
      bg: 'from-zinc-900 via-zinc-900/90 to-zinc-950',
      glow: 'bg-blue-500/10',
      brandName: product.group_title_fa || 'سرویس آناهیکس',
    }
  }

  const brand = getBrandDetails()

  // Effective price & discount logic
  const effectivePrice =
    product.is_flash_sale && product.flash_sale_price_toman
      ? product.flash_sale_price_toman
      : product.price_toman

  const originalPrice =
    product.is_flash_sale && product.flash_sale_price_toman
      ? product.price_toman
      : Math.round((product.price_toman * 1.18) / 10000) * 10000

  const discountPercent =
    originalPrice > effectivePrice
      ? Math.round(((originalPrice - effectivePrice) / originalPrice) * 100)
      : 0

  // Parse Badges
  let badges: string[] = []
  if (product.badges_json) {
    try {
      badges = JSON.parse(product.badges_json)
    } catch {
      badges = []
    }
  }

  const handleAddToCart = () => {
    cartStore.addItem({
      ...product,
      price_toman: effectivePrice,
    })
    cartAdded(
      product.title_fa,
      `سرویس به ارزش ${toPersianDigits(effectivePrice.toLocaleString())} تومان به سبد خرید اضافه شد.`,
      product.image_url,
    )
    onSelect(product)
  }

  const isSpecial = product.is_flash_sale || product.is_featured

  return (
    <div
      dir="rtl"
      className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-card text-card-foreground transition-all duration-200 hover:-translate-y-1 hover:border-zinc-700/90 ${
        isSpecial ? 'ring-1 ring-zinc-700/80' : ''
      }`}
      style={{
        boxShadow: 'var(--depth-surface)',
      }}
    >
      {/* Vibe Farsi Animated Border Beam for Special/Flash items */}
      {isSpecial && (
        <BorderBeam
          size={160}
          duration={12}
          colorFrom={product.is_flash_sale ? '#f43f5e' : 'oklch(0.975 0 0)'}
          colorTo={product.is_flash_sale ? '#f59e0b' : 'oklch(0.63 0.004 285)'}
        />
      )}

      <div>
        {/* Product Cover Artwork Header */}
        <div className="relative h-44 sm:h-48 w-full overflow-hidden bg-zinc-950 border-b border-border/80">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.title_fa}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            /* Elegant Technical Graphite Artwork when no image uploaded */
            <div
              className={`relative h-full w-full bg-gradient-to-br ${brand.bg} flex flex-col items-center justify-center p-4 overflow-hidden`}
            >
              <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none" />
              <div
                className={`absolute w-28 h-28 rounded-full ${brand.glow} blur-2xl pointer-events-none`}
              />
              <div className="relative z-10 flex flex-col items-center gap-2">
                <div className="p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-700/80 shadow-inner">
                  {brand.icon}
                </div>
                <span className="text-[11px] font-bold text-zinc-300 font-latin">
                  {brand.brandName}
                </span>
              </div>
            </div>
          )}

          {/* Floating Top Badges */}
          <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-none">
            <div className="flex items-center gap-1.5">
              {product.delivery_mode === 'UPGRADE_EXISTING' ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/95 text-zinc-950 text-[10px] font-black px-2.5 py-1 shadow-sm backdrop-blur-md">
                  <UserCheck className="h-3 w-3" />
                  <span>ارتقای اکانت شخصی</span>
                </span>
              ) : product.delivery_mode === 'INSTANT_ACCOUNT' ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-indigo-600/95 text-white text-[10px] font-black px-2.5 py-1 shadow-sm backdrop-blur-md">
                  <KeyRound className="h-3 w-3" />
                  <span>اکانت آماده اختصاصی</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-600/95 text-white text-[10px] font-black px-2.5 py-1 shadow-sm backdrop-blur-md">
                  <Zap className="h-3 w-3" />
                  <span>تحویل ۰ ثانیه‌ای</span>
                </span>
              )}
            </div>

            {/* Flash Sale Badge */}
            {product.is_flash_sale && (
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-600 text-white text-[10px] font-black px-2.5 py-1 shadow-md shadow-rose-600/30 animate-pulse">
                <Flame className="h-3.5 w-3.5" />
                <span>{toPersianDigits(discountPercent)}٪ تخفیف</span>
              </span>
            )}
          </div>
        </div>

        {/* Content Section */}
        <div className="p-4 sm:p-5 pt-3 space-y-3">
          {/* Title & Ratings */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-1">
              <Link
                to={`/products/${product.slug || product.id}`}
                className="block hover:text-blue-400 transition-colors"
              >
                <h3 className="text-base font-black tracking-tight text-zinc-100 leading-snug line-clamp-1">
                  {product.title_fa}
                </h3>
              </Link>

              {/* Star Rating & Buyer count */}
              <div className="flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg shrink-0">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                <span>{toPersianDigits(product.rating_average || 4.9)}</span>
              </div>
            </div>

            <p
              className="text-xs text-zinc-400 font-latin text-left line-clamp-1"
              dir="ltr"
            >
              {product.title_en}
            </p>
          </div>

          <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">
            {product.description_fa}
          </p>

          {/* Badges / Features pill row */}
          {badges.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {badges.slice(0, 3).map((b) => (
                <span
                  key={`badge-${product.id}-${b}`}
                  className="rounded-lg bg-zinc-900 border border-zinc-800 px-2 py-0.5 text-[10px] font-bold text-zinc-300"
                >
                  {b}
                </span>
              ))}
            </div>
          ) : (
            <div className="space-y-1.5 bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-2.5 text-xs">
              {(product.features || []).slice(0, 2).map((feat) => (
                <div
                  key={`feat-${product.id}-${feat}`}
                  className="flex items-center gap-2"
                >
                  <div className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-blue-500/15 text-blue-400">
                    <Check className="h-2 w-2" />
                  </div>
                  <span className="text-[11px] text-zinc-300 truncate">
                    {feat}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Flash Sale Inventory Progress Bar */}
          {product.is_flash_sale && product.flash_sale_stock ? (
            <div className="space-y-1 pt-1">
              <div className="flex justify-between text-[10px] text-zinc-400">
                <span className="text-rose-400 font-bold flex items-center gap-1">
                  <Sparkles className="h-2.5 w-2.5" />
                  موجودی جشنواره
                </span>
                <span>
                  {toPersianDigits(product.flash_sale_sold || 25)} /{' '}
                  {toPersianDigits(product.flash_sale_stock || 50)} فروخته شده
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-rose-500 to-amber-500 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.round(
                        ((product.flash_sale_sold || 25) /
                          (product.flash_sale_stock || 50)) *
                          100,
                      ),
                    )}%`,
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1 border-t border-zinc-800/80">
              <div className="flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
                <span>ضمانت کامل قانونی</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-zinc-500" />
                <span>تحویل لحظه‌ای</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Card Footer: Pricing and Actions */}
      <div className="p-4 sm:p-5 pt-0 mt-2 border-t border-border flex items-center justify-between gap-3">
        {/* Pricing */}
        <div>
          {discountPercent > 0 && (
            <div className="text-[11px] text-zinc-500 line-through font-latin">
              {toPersianDigits(originalPrice.toLocaleString())} تومان
            </div>
          )}
          <div className="flex items-baseline gap-1">
            <span
              className={`text-lg sm:text-xl font-black tracking-tight font-latin ${
                product.is_flash_sale ? 'text-rose-400' : 'text-zinc-100'
              }`}
            >
              {toPersianDigits(effectivePrice.toLocaleString())}
            </span>
            <span className="text-xs text-zinc-400 font-sans">تومان</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-1.5">
          <Link
            to={`/products/${product.slug || product.id}`}
            className="h-10 px-3 rounded-xl border border-zinc-800 hover:bg-zinc-800 text-xs font-bold text-zinc-200 transition-colors flex items-center gap-1"
            title="مشاهده پلن‌ها و جزئیات"
          >
            <span>پلن‌ها</span>
            <ArrowLeft className="h-3.5 w-3.5" />
          </Link>

          <button
            type="button"
            onClick={handleAddToCart}
            className="h-10 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/25 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-1.5 cursor-pointer"
            title="افزودن به سبد خرید"
          >
            <ShoppingCart className="h-4 w-4" />
            <span className="hidden sm:inline">سبد خرید</span>
          </button>
        </div>
      </div>
    </div>
  )
}
