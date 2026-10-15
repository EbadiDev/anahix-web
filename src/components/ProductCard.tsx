import {
  ArrowLeft,
  Check,
  Clock,
  KeyRound,
  ShieldCheck,
  ShoppingCart,
  UserCheck,
  Zap,
} from 'lucide-react'
import type React from 'react'
import { Link } from 'react-router-dom'
import { cartStore } from '../lib/cartStore'
import type { Product } from '../types'
import { ClaudeIcon, CursorIcon, GeminiIcon, OpenAIIcon } from './BrandIcons'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Card, CardContent, CardFooter, CardHeader } from './ui/card'

interface ProductCardProps {
  product: Product
  onSelect: (product: Product) => void
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onSelect,
}) => {
  // Determine Brand Icon & Accent
  const getBrandDetails = () => {
    const slug = (product.title_en || '').toLowerCase()
    if (slug.includes('chatgpt') || slug.includes('openai')) {
      return {
        icon: (
          <OpenAIIcon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
        ),
        bg: 'bg-emerald-500/10 border-emerald-500/20',
        brandName: 'OpenAI',
      }
    }
    if (slug.includes('claude') || slug.includes('anthropic')) {
      return {
        icon: (
          <ClaudeIcon className="h-6 w-6 text-amber-600 dark:text-amber-400" />
        ),
        bg: 'bg-amber-500/10 border-amber-500/20',
        brandName: 'Anthropic',
      }
    }
    if (slug.includes('gemini') || slug.includes('google')) {
      return {
        icon: (
          <GeminiIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        ),
        bg: 'bg-blue-500/10 border-blue-500/20',
        brandName: 'Google One',
      }
    }
    return {
      icon: <CursorIcon className="h-6 w-6 text-sky-600 dark:text-sky-400" />,
      bg: 'bg-sky-500/10 border-sky-500/20',
      brandName: 'Anahix Service',
    }
  }

  const brand = getBrandDetails()

  // Calculate a realistic strike-through original price (15% higher)
  const originalPrice = Math.round((product.price_toman * 1.18) / 10000) * 10000

  return (
    <Card className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border-border/80 bg-card transition-all duration-200 hover:-translate-y-1 hover:border-blue-500/60 hover:shadow-xl hover:shadow-blue-600/5">
      <div>
        <CardHeader className="p-5 pb-3">
          {/* Top row: Brand Icon + Delivery Type Badge */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2.5">
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl border ${brand.bg}`}
              >
                {brand.icon}
              </div>
              <div>
                <span className="text-[11px] font-semibold text-muted-foreground font-latin">
                  {brand.brandName}
                </span>
                <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
                  <span>لایسنس ۱۰۰٪ قانونی</span>
                </div>
              </div>
            </div>

            {product.delivery_mode === 'UPGRADE_EXISTING' ? (
              <Badge
                variant="amber"
                className="gap-1 text-[11px] font-medium py-1 px-2.5"
              >
                <UserCheck className="h-3 w-3" />
                روی اکانت شخصی
              </Badge>
            ) : product.delivery_mode === 'INSTANT_ACCOUNT' ? (
              <Badge
                variant="blue"
                className="gap-1 text-[11px] font-medium py-1 px-2.5"
              >
                <KeyRound className="h-3 w-3" />
                اکانت آماده
              </Badge>
            ) : (
              <Badge
                variant="blue"
                className="gap-1 text-[11px] font-medium py-1 px-2.5 bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
              >
                <Zap className="h-3 w-3 text-blue-600" />
                تحویل آنی
              </Badge>
            )}
          </div>

          {/* Product Title */}
          <Link
            to={`/products/${product.slug || product.id}`}
            className="block group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
          >
            <h3 className="text-base font-black tracking-tight text-foreground leading-snug">
              {product.title_fa}
            </h3>
            <p
              className="text-xs text-muted-foreground font-latin text-left mt-1"
              dir="ltr"
            >
              {product.title_en}
            </p>
          </Link>
        </CardHeader>

        <CardContent className="p-5 pt-0 space-y-4">
          <p className="text-xs text-muted-foreground/90 leading-relaxed border-t border-border/50 pt-3">
            {product.description_fa}
          </p>

          {/* Practical Features Checklist */}
          <div className="space-y-2 bg-muted/30 rounded-xl p-3 text-xs">
            {(product.features || []).map((feat) => (
              <div
                key={`${product.id}-f-${feat}`}
                className="flex items-start gap-2"
              >
                <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 mt-0.5">
                  <Check className="h-2.5 w-2.5" />
                </div>
                <span className="text-foreground/90 leading-tight">{feat}</span>
              </div>
            ))}
          </div>

          {/* SLA / Delivery Note */}
          <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-blue-600" />
              <span>
                {product.delivery_mode === 'UPGRADE_EXISTING'
                  ? `زمان فعال‌سازی: کمتر از ${product.sla_minutes} دقیقه`
                  : 'تحویل: خودکار در لحظه خرید'}
              </span>
            </div>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              گارانتی ۳۰ روزه
            </span>
          </div>
        </CardContent>
      </div>

      <CardFooter className="p-5 pt-0 border-t border-border/60 mt-2 flex items-center justify-between gap-2">
        {/* Price display with discount strike-through */}
        <div>
          <div className="text-[11px] text-muted-foreground line-through">
            {originalPrice.toLocaleString('fa-IR')} تومان
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-black text-foreground tracking-tight">
              {product.price_toman.toLocaleString('fa-IR')}
            </span>
            <span className="text-xs text-muted-foreground font-sans">
              تومان
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <Link
            to={`/products/${product.slug || product.id}`}
            className="h-10 px-3 rounded-xl border border-border/80 hover:bg-muted text-xs font-bold text-foreground transition-all flex items-center gap-1"
            title="مشاهده مشخصات و پلن‌های زمانی"
          >
            <span>انتخاب پلن</span>
            <ArrowLeft className="h-3.5 w-3.5" />
          </Link>
          <Button
            onClick={() => {
              cartStore.addItem(product)
              onSelect(product)
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-10 px-3.5 rounded-xl shadow-md shadow-blue-600/20 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-1.5"
            title="افزودن سریع به سبد خرید"
          >
            <ShoppingCart className="h-4 w-4" />
            <span className="hidden sm:inline">سبد</span>
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
