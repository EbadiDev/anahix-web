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

  // Determine Brand Details
  const getBrandDetails = () => {
    const slug = (product.title_en || '').toLowerCase()
    if (slug.includes('chatgpt') || slug.includes('openai')) {
      return {
        icon: (
          <OpenAIIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
        ),
        bg: 'bg-emerald-500/10 border-emerald-500/20',
        brandName: 'OpenAI',
      }
    }
    if (slug.includes('claude') || slug.includes('anthropic')) {
      return {
        icon: (
          <ClaudeIcon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
        ),
        bg: 'bg-amber-500/10 border-amber-500/20',
        brandName: 'Anthropic',
      }
    }
    if (slug.includes('gemini') || slug.includes('google')) {
      return {
        icon: (
          <GeminiIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        ),
        bg: 'bg-blue-500/10 border-blue-500/20',
        brandName: 'Google One',
      }
    }
    return {
      icon: <CursorIcon className="h-5 w-5 text-sky-600 dark:text-sky-400" />,
      bg: 'bg-sky-500/10 border-sky-500/20',
      brandName: 'Anahix Service',
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
      className={`group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-border/80 bg-card/90 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-blue-500/10 ${
        isSpecial ? 'ring-1 ring-blue-500/30' : ''
      }`}
    >
      {/* Vibe Farsi Animated Border Beam for Special/Flash items */}
      {isSpecial && (
        <BorderBeam
          size={160}
          duration={12}
          colorFrom={product.is_flash_sale ? '#f43f5e' : '#3b82f6'}
          colorTo={product.is_flash_sale ? '#f59e0b' : '#8b5cf6'}
        />
      )}

      <div>
        {/* Product Image Cover Header */}
        <div className="relative h-44 sm:h-48 w-full overflow-hidden bg-muted/40">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.title_fa}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-600/10 to-indigo-600/20 text-blue-600 font-bold">
              {product.title_fa}
            </div>
          )}

          {/* Gradient protection overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />

          {/* Floating Top Badges */}
          <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-none">
            <div className="flex items-center gap-1.5">
              {product.delivery_mode === 'UPGRADE_EXISTING' ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/90 text-white text-[10px] font-black px-2.5 py-1 backdrop-blur-md shadow-sm">
                  <UserCheck className="h-3 w-3" />
                  <span>ارتقای اکانت شخصی</span>
                </span>
              ) : product.delivery_mode === 'INSTANT_ACCOUNT' ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-indigo-600/90 text-white text-[10px] font-black px-2.5 py-1 backdrop-blur-md shadow-sm">
                  <KeyRound className="h-3 w-3" />
                  <span>اکانت آماده اختصاصی</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-600/90 text-white text-[10px] font-black px-2.5 py-1 backdrop-blur-md shadow-sm">
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

          {/* Brand Icon floating bottom-right of image */}
          <div className="absolute bottom-2 right-4 flex items-center gap-2">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-2xl border bg-card/90 shadow-md backdrop-blur-md ${brand.bg}`}
            >
              {brand.icon}
            </div>
            <div className="bg-card/80 backdrop-blur-md px-2 py-0.5 rounded-lg border border-border/60">
              <span className="text-[10px] font-bold text-muted-foreground font-latin">
                {brand.brandName}
              </span>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-5 pt-3 space-y-3">
          {/* Title & Ratings */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-1">
              <Link
                to={`/products/${product.slug || product.id}`}
                className="block group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
              >
                <h3 className="text-base font-black tracking-tight text-foreground leading-snug line-clamp-1">
                  {product.title_fa}
                </h3>
              </Link>

              {/* Star Rating & Buyer count */}
              <div className="flex items-center gap-1 text-[11px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-lg shrink-0">
                <Star className="h-3 w-3 fill-amber-500" />
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

          <p className="text-xs text-muted-foreground/90 leading-relaxed line-clamp-2">
            {product.description_fa}
          </p>

          {/* Distinctive Badges / Features pill row */}
          {badges.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {badges.slice(0, 3).map((b) => (
                <span
                  key={`badge-${product.id}-${b}`}
                  className="rounded-lg bg-muted/60 border border-border/80 px-2 py-0.5 text-[10px] font-bold text-muted-foreground"
                >
                  {b}
                </span>
              ))}
            </div>
          ) : (
            <div className="space-y-1.5 bg-muted/30 rounded-2xl p-2.5 text-xs">
              {(product.features || []).slice(0, 2).map((feat) => (
                <div
                  key={`feat-${product.id}-${feat}`}
                  className="flex items-center gap-2"
                >
                  <div className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-blue-600">
                    <Check className="h-2 w-2" />
                  </div>
                  <span className="text-[11px] text-foreground/90 truncate">
                    {feat}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Flash Sale Inventory Progress Bar */}
          {product.is_flash_sale && product.flash_sale_stock ? (
            <div className="space-y-1 pt-1">
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span className="text-rose-500 font-bold flex items-center gap-1">
                  <Sparkles className="h-2.5 w-2.5" />
                  موجودی جشنواره
                </span>
                <span>
                  {toPersianDigits(product.flash_sale_sold || 25)} /{' '}
                  {toPersianDigits(product.flash_sale_stock || 50)} فروخته شده
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
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
            <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/40">
              <div className="flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
                <span>ضمانت کامل قانونی</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                <span>تحویل لحظه‌ای</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Card Footer: Pricing and Actions */}
      <div className="p-5 pt-0 mt-2 border-t border-border/60 flex items-center justify-between gap-3">
        {/* Pricing */}
        <div>
          {discountPercent > 0 && (
            <div className="text-[11px] text-muted-foreground line-through">
              {toPersianDigits(originalPrice.toLocaleString())} تومان
            </div>
          )}
          <div className="flex items-baseline gap-1">
            <span
              className={`text-lg sm:text-xl font-black tracking-tight ${
                product.is_flash_sale
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-foreground'
              }`}
            >
              {toPersianDigits(effectivePrice.toLocaleString())}
            </span>
            <span className="text-xs text-muted-foreground font-sans">
              تومان
            </span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-1.5">
          <Link
            to={`/products/${product.slug || product.id}`}
            className="h-10 px-3 rounded-xl border border-border/80 hover:bg-muted text-xs font-bold text-foreground transition-all flex items-center gap-1"
            title="مشاهده پلن‌ها و جزئیات"
          >
            <span>پلن‌ها</span>
            <ArrowLeft className="h-3.5 w-3.5" />
          </Link>

          <button
            type="button"
            onClick={handleAddToCart}
            className="h-10 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all hover:scale-[1.03] active:scale-[0.98] flex items-center gap-1.5 cursor-pointer"
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
