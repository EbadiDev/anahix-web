import {
  AlertCircle,
  ArrowLeft,
  Bell,
  Boxes,
  Check,
  Clock,
  Flame,
  KeyRound,
  ShoppingCart,
  Sparkles,
  Star,
  Tag,
  UserCheck,
  Zap,
} from 'lucide-react'
import type React from 'react'
import { memo, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { cartStore, useCartItemQuantity } from '../lib/cartStore'
import type { Product, ProductPlan } from '../types'
import { getSiteBrandName } from '../utils/brand'
import { formatToman, toPersianDigits } from '../utils/formatters'
import { ClaudeIcon, CursorIcon, GeminiIcon, OpenAIIcon } from './BrandIcons'
import { PrePurchaseNoticeModal } from './PrePurchaseNoticeModal'
import { StockAlertModal } from './StockAlertModal'
import { useNotification } from './vibefarsi/NotificationContext'
import { QuantitySelector } from './vibefarsi/QuantitySelector'

interface ProductCardProps {
  product: Product
  onSelect: (product: Product) => void
}

export const ProductCard: React.FC<ProductCardProps> = memo(
  ({ product, onSelect }) => {
    const { cartAdded } = useNotification()

    // Selected plan state
    const plans = product.plans || []
    const [selectedPlan, setSelectedPlan] = useState<ProductPlan | null>(() => {
      return plans.find((p) => p.is_default) || plans[0] || null
    })
    const [isNoticeOpen, setIsNoticeOpen] = useState(false)
    const [isStockAlertOpen, setIsStockAlertOpen] = useState(false)

    // Out of Stock detection
    const isOutOfStock =
      product.stock_mode === 'out_of_stock' ||
      product.is_out_of_stock ||
      (product.stock_mode !== 'always_in_stock' &&
        product.available_stock !== undefined &&
        product.available_stock <= 0)

    // Granular cart quantity subscription (does NOT re-render card when other items change)
    const currentQuantity = useCartItemQuantity(product.id, selectedPlan?.id)

    // Determine Brand Details & Default Graphic Cover
    const getBrandDetails = () => {
      // If product has custom icon_url from backend/database
      if (product.icon_url) {
        return {
          icon: (
            <img
              src={product.icon_url}
              alt={product.title_fa}
              className="h-7 w-7 object-contain group-hover:scale-110 transition-transform duration-200"
              onError={(e) => {
                ;(e.target as HTMLElement).style.display = 'none'
              }}
            />
          ),
          bg: 'from-zinc-900 via-zinc-900/90 to-zinc-950',
          glow: 'bg-brand/10',
          brandName: product.group_title_fa || product.title_fa,
        }
      }

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
          <Sparkles className="h-7 w-7 text-brand group-hover:scale-110 transition-transform duration-200" />
        ),
        bg: 'from-zinc-900 via-zinc-900/90 to-zinc-950',
        glow: 'bg-brand/10',
        brandName:
          product.group_title_fa || `سرویس ${getSiteBrandName('پلی شاپ')}`,
      }
    }

    const brand = getBrandDetails()

    // Check if timed discount has expired
    const isFlashSaleExpired = Boolean(
      product.flash_sale_end_at &&
        new Date(product.flash_sale_end_at).getTime() <= Date.now(),
    )
    const isFlashSaleActive = Boolean(
      product.is_flash_sale &&
        product.flash_sale_price_toman &&
        !isFlashSaleExpired,
    )

    // Effective price & discount logic (dynamically responsive to selected plan)
    const effectivePrice = selectedPlan
      ? selectedPlan.price_toman
      : isFlashSaleActive
        ? (product.flash_sale_price_toman as number)
        : product.price_toman

    // Original price ONLY if explicitly set by admin or active flash sale (never fabricate discounts!)
    const rawOriginalPrice = selectedPlan
      ? selectedPlan.original_price_toman
      : isFlashSaleActive
        ? product.price_toman
        : product.original_price_toman

    const originalPrice =
      rawOriginalPrice && rawOriginalPrice > effectivePrice
        ? rawOriginalPrice
        : undefined

    const discountPercent =
      originalPrice && originalPrice > effectivePrice
        ? Math.round(((originalPrice - effectivePrice) / originalPrice) * 100)
        : 0

    // Live Timer for Timed Discount
    const hasTimedDiscount = Boolean(
      isFlashSaleActive && product.flash_sale_end_at,
    )
    const targetExpiry = hasTimedDiscount
      ? new Date(product.flash_sale_end_at as string).getTime()
      : 0

    const [liveCountdown, setLiveCountdown] = useState('')

    useEffect(() => {
      if (!hasTimedDiscount || !targetExpiry) return

      const tick = () => {
        const diff = targetExpiry - Date.now()
        if (diff <= 0) {
          setLiveCountdown('پایان یافت')
          return
        }
        const h = Math.floor(diff / (1000 * 60 * 60))
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        const s = Math.floor((diff % (1000 * 60)) / 1000)
        setLiveCountdown(
          `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`,
        )
      }

      tick()
      const timer = setInterval(tick, 1000)
      return () => clearInterval(timer)
    }, [hasTimedDiscount, targetExpiry])

    const handleAddToCart = () => {
      if (isOutOfStock) return

      // Pre-Purchase Notice interceptor check
      if (
        product.pre_purchase_notice &&
        (product.pre_purchase_notice_mode === 'modal_confirm' ||
          product.pre_purchase_notice_mode === 'both')
      ) {
        let isSnoozed = false
        try {
          const snoozeExpiry = localStorage.getItem(
            `anahix_notice_snooze_${product.id}`,
          )
          if (snoozeExpiry && Number(snoozeExpiry) > Date.now()) {
            isSnoozed = true
          } else if (
            sessionStorage.getItem(`anahix_notice_snooze_${product.id}`)
          ) {
            isSnoozed = true
          }
        } catch {}

        if (!isSnoozed) {
          setIsNoticeOpen(true)
          return
        }
      }

      executeAddToCart()
    }

    const executeAddToCart = () => {
      cartStore.addItem(
        {
          ...product,
          price_toman: effectivePrice,
        },
        1,
        selectedPlan || undefined,
      )
      cartAdded(
        selectedPlan
          ? `${product.title_fa} (${selectedPlan.title})`
          : product.title_fa,
        `سرویس به ارزش ${toPersianDigits(effectivePrice.toLocaleString())} تومان به سبد خرید اضافه شد.`,
        product.image_url,
      )
      setIsNoticeOpen(false)
      onSelect(product)
    }

    const handleQuantityChange = (newQty: number) => {
      if (newQty <= 0) {
        cartStore.removeItem(product.id, selectedPlan?.id)
      } else {
        cartStore.updateQuantity(product.id, newQty, selectedPlan?.id)
      }
    }

    return (
      <div
        dir="rtl"
        className="group relative flex flex-col justify-between overflow-hidden rounded-surface border border-border/80 bg-card text-card-foreground shadow-surface duration-motion ease-motion transition-all hover:-translate-y-1 select-none"
      >
        <div>
          {/* Product Cover Artwork Header */}
          <div className="relative h-44 sm:h-48 w-full overflow-hidden bg-zinc-950">
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
                  <div className="p-3.5 rounded-control bg-zinc-900/90 border border-zinc-800 shadow-inner">
                    {brand.icon}
                  </div>
                  <span className="text-[11px] font-bold text-zinc-300 font-latin">
                    {brand.brandName}
                  </span>
                </div>
              </div>
            )}

            {/* Floating Top Badges (Never wrap or collide) */}
            <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-none">
              {/* Delivery Mode Badge */}
              <div className="flex items-center gap-1.5">
                {product.delivery_mode === 'UPGRADE_EXISTING' ? (
                  <span className="inline-flex items-center gap-1 rounded-control bg-amber-500/90 text-zinc-950 text-[10px] font-black px-2.5 py-1 shadow-xs backdrop-blur-md">
                    <UserCheck className="h-3 w-3" />
                    <span>ارتقای اکانت</span>
                  </span>
                ) : product.delivery_mode === 'INSTANT_ACCOUNT' ? (
                  <span className="inline-flex items-center gap-1 rounded-control bg-indigo-600/90 text-white text-[10px] font-black px-2.5 py-1 shadow-xs backdrop-blur-md">
                    <KeyRound className="h-3 w-3" />
                    <span>اکانت اختصاصی</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-control bg-primary text-primary-foreground text-[10px] font-black px-2.5 py-1 shadow-xs backdrop-blur-md">
                    <Zap className="h-3 w-3" />
                    <span>تحویل آنی</span>
                  </span>
                )}
              </div>

              {/* Two Distinct Badge Types */}
              <div className="flex items-center gap-1.5">
                {hasTimedDiscount && discountPercent > 0 ? (
                  <span className="inline-flex items-center gap-1 rounded-control bg-rose-600 text-white text-[10px] sm:text-[11px] font-black px-2.5 py-1 shadow-control border border-rose-400/40 animate-pulse">
                    <Flame className="h-3.5 w-3.5" />
                    <span>
                      {toPersianDigits(discountPercent)}٪ تخفیف زمان‌دار
                    </span>
                  </span>
                ) : discountPercent > 0 ? (
                  <span className="inline-flex items-center gap-1 rounded-control bg-emerald-600 text-white text-[10px] sm:text-[11px] font-black px-2.5 py-1 shadow-control border border-emerald-400/30">
                    <Tag className="h-3 w-3" />
                    <span>{toPersianDigits(discountPercent)}٪ تخفیف</span>
                  </span>
                ) : null}
              </div>
            </div>

            {/* Timed Countdown Bar at Bottom of Artwork (100% Responsive, Sleek Vibe Farsi Style, No Wrap) */}
            {hasTimedDiscount && discountPercent > 0 && (
              <div className="absolute bottom-2.5 inset-x-2.5 flex items-center justify-between p-1.5 px-2.5 rounded-control bg-slate-950/85 backdrop-blur-md border border-white/15 text-white shadow-xs">
                <div className="flex items-center gap-1 text-[11px] font-bold text-amber-300">
                  <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>مهلت تخفیف:</span>
                </div>
                <span
                  className="font-mono font-latin text-xs font-black text-rose-300 tracking-wider"
                  dir="ltr"
                >
                  {liveCountdown || '۰۰:۰۰:۰۰'}
                </span>
              </div>
            )}
          </div>

          {/* Content Section (Clean, without internal border-t dividing lines) */}
          <div className="p-4 sm:p-5 pt-3 space-y-3">
            {/* Title & Ratings */}
            <div>
              <div className="flex items-center justify-between gap-2 mb-1">
                <Link
                  to={`/products/${product.slug || product.id}`}
                  className="block hover:text-foreground/80 transition-colors"
                >
                  <h3 className="text-base font-black tracking-tight text-foreground leading-snug line-clamp-1">
                    {product.title_fa}
                  </h3>
                </Link>

                {/* Star Rating Badge (Controlled from Admin, hides when <= 0 - Screenshot Request) */}
                {product.rating_average !== undefined &&
                Number(product.rating_average) > 0 ? (
                  <div className="flex items-center gap-1 text-[11px] font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-control shrink-0">
                    <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                    <span className="font-latin">
                      {(() => {
                        const r = Number(product.rating_average)
                        return r % 1 === 0
                          ? r.toLocaleString('fa-IR')
                          : r.toLocaleString('fa-IR', {
                              minimumFractionDigits: 1,
                              maximumFractionDigits: 2,
                            })
                      })()}
                    </span>
                  </div>
                ) : null}
              </div>

              <p
                className="text-xs text-muted-foreground font-latin text-left line-clamp-1"
                dir="ltr"
              >
                {product.title_en}
              </p>
            </div>

            {product.description_fa && (
              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                {product.description_fa}
              </p>
            )}

            {/* Delivery SLA line if explicitly defined by admin */}
            {product.sla_display_text && (
              <div className="text-[11px] text-muted-foreground font-medium flex items-center gap-1 pt-0.5 font-sans">
                <span>{product.sla_display_text}</span>
              </div>
            )}

            {/* Custom Badges entered by Admin (in each line) */}
            {(() => {
              if (!product.badges_json) return null
              try {
                const badges = JSON.parse(product.badges_json)
                if (Array.isArray(badges) && badges.length > 0) {
                  return (
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      {badges.map((b: string) => (
                        <span
                          key={b}
                          className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-control bg-secondary/80 text-foreground border border-border/60"
                        >
                          <Sparkles className="h-2.5 w-2.5 text-brand" />
                          <span>{b}</span>
                        </span>
                      ))}
                    </div>
                  )
                }
              } catch {}
              return null
            })()}

            {/* Equal Height Guaranteed Container: Inventory Progress, Stock Mode or SLA text */}
            <div className="h-7 flex items-center">
              {product.is_flash_sale && product.flash_sale_stock ? (
                <div className="w-full space-y-1">
                  <div className="flex justify-between text-[10px] font-bold text-muted-foreground">
                    <span className="text-brand flex items-center gap-1">
                      <Boxes className="h-3 w-3" />
                      <span>موجودی جشنواره:</span>
                    </span>
                    <span className="font-latin">
                      {Number(product.flash_sale_sold || 0).toLocaleString(
                        'fa-IR',
                      )}{' '}
                      از{' '}
                      {Number(product.flash_sale_stock || 50).toLocaleString(
                        'fa-IR',
                      )}{' '}
                      فروخته شده
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
              ) : isOutOfStock ? (
                <div className="text-[11px] font-bold text-rose-500 flex items-center gap-1.5">
                  <Boxes className="h-3.5 w-3.5" />
                  <span>
                    {product.out_of_stock_text &&
                    product.out_of_stock_text !== 'در حال تهیه و تامین مجدد'
                      ? product.out_of_stock_text
                      : 'ناموجود'}
                  </span>
                </div>
              ) : product.stock_display_mode === 'show_exact' &&
                product.available_stock !== undefined &&
                product.available_stock > 0 ? (
                <div className="text-[11px] font-bold flex items-center gap-1.5">
                  {product.available_stock <= 5 ? (
                    <span className="text-amber-500 flex items-center gap-1">
                      <Flame className="h-3.5 w-3.5" />
                      <span>
                        تنها {toPersianDigits(product.available_stock)} عدد در
                        انبار باقی‌مانده
                      </span>
                    </span>
                  ) : (
                    <span className="text-emerald-500 flex items-center gap-1">
                      <Boxes className="h-3.5 w-3.5" />
                      <span>
                        {toPersianDigits(product.available_stock)} عدد موجود در
                        انبار
                      </span>
                    </span>
                  )}
                </div>
              ) : product.stock_display_mode === 'show_status_only' ? (
                <div className="text-[11px] text-emerald-500 font-bold flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5" />
                  <span>موجود در انبار (آماده تحویل)</span>
                </div>
              ) : (
                <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  <span>تحویل آنی و اصالت ۱۰۰٪ تضمین‌شده</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Card Footer: Pricing and Actions (Unified Graphite Standard) */}
        <div className="p-4 sm:p-5 pt-0 space-y-3">
          {/* Plans & Durations Fast Selector */}
          {plans.length > 1 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pt-1">
              {plans.map((pl) => {
                const isSelected = selectedPlan?.id === pl.id
                return (
                  <button
                    key={pl.id}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setSelectedPlan(pl)
                    }}
                    className={`px-2.5 py-1 rounded-control text-[11px] font-bold transition-all whitespace-nowrap cursor-pointer duration-motion active:scale-[0.98] ${
                      isSelected
                        ? 'bg-primary text-primary-foreground font-black shadow-control'
                        : 'bg-muted/30 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/60'
                    }`}
                  >
                    {pl.title}
                  </button>
                )
              })}
            </div>
          )}

          {/* Pricing Row (Unified Graphite Typography & Contrast - Image 2 Fix) */}
          <div className="flex items-baseline justify-between pt-2.5 border-t border-border/60">
            <span className="text-xs text-muted-foreground font-bold">
              قیمت سرویس:
            </span>
            <div className="flex items-baseline gap-2">
              {discountPercent > 0 && originalPrice && (
                <span className="text-xs text-muted-foreground/50 line-through font-sans font-medium">
                  {formatToman(originalPrice)}
                </span>
              )}
              <div className="flex items-baseline gap-1">
                <span className="text-lg sm:text-xl font-black font-sans text-foreground tracking-tight">
                  {formatToman(effectivePrice)}
                </span>
                <span className="text-xs text-muted-foreground font-sans">
                  تومان
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons Stacked Vertically */}
          <div className="space-y-2">
            {/* Primary Action Button: Add to Cart or Quantity Selector */}
            {isOutOfStock ? (
              <div className="space-y-1.5">
                <div className="w-full py-1.5 px-3 rounded-control bg-rose-500/10 text-rose-500 border border-rose-500/30 text-[11px] font-black text-center flex items-center justify-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    {product.out_of_stock_text &&
                    product.out_of_stock_text !== 'در حال تهیه و تامین مجدد'
                      ? product.out_of_stock_text
                      : 'ناموجود (موجودی صفر)'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setIsStockAlertOpen(true)
                  }}
                  className="w-full h-9 rounded-control border border-brand/40 bg-brand/10 hover:bg-brand/20 text-brand text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer duration-motion active:scale-[0.98]"
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>موجود شد به من اطلاع بده</span>
                </button>
              </div>
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
                title="افزودن به سبد خرید"
              >
                <ShoppingCart className="h-4 w-4" />
                <span>افزودن به سبد خرید</span>
              </button>
            )}

            {/* Secondary Action: Plans & Details Button */}
            <Link
              to={`/products/${product.slug || product.id}`}
              className="w-full h-9 rounded-control border border-border/60 bg-card hover:bg-muted text-xs font-bold text-foreground duration-motion ease-motion active:scale-[0.98] flex items-center justify-center gap-1.5 transition-colors"
              title="مشاهده پلن‌ها و جزئیات"
            >
              <span>مشاهده پلن‌ها و جزئیات</span>
              <ArrowLeft className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Pre-Purchase Notice Modal */}
        {isNoticeOpen && (
          <PrePurchaseNoticeModal
            isOpen={isNoticeOpen}
            product={product}
            plan={selectedPlan}
            onConfirm={executeAddToCart}
            onClose={() => setIsNoticeOpen(false)}
          />
        )}

        {/* Stock Alert Modal */}
        <StockAlertModal
          isOpen={isStockAlertOpen}
          onClose={() => setIsStockAlertOpen(false)}
          product={product}
          planTitle={selectedPlan?.title}
        />
      </div>
    )
  },
)

ProductCard.displayName = 'ProductCard'
