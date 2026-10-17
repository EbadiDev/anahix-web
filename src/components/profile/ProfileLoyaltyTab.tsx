import {
  AlertCircle,
  Award,
  Check,
  ChevronLeft,
  Crown,
  Diamond,
  Flame,
  Layers,
  Medal,
  RefreshCw,
  Sparkles,
  Star,
  Zap,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiService } from '../../services/api'
import type { CustomerLoyaltyProfile, CustomerProfile } from '../../types'
import { formatToman, toPersianDigits } from '../../utils/formatters'
import { FlipCard3D } from '../vibefarsi/FlipCard3D'

interface ProfileLoyaltyTabProps {
  customer: CustomerProfile
  onReloadCustomer?: () => void
}

export const ProfileLoyaltyTab: React.FC<ProfileLoyaltyTabProps> = ({
  customer,
  onReloadCustomer,
}) => {
  const [profile, setProfile] = useState<CustomerLoyaltyProfile | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const loadLoyaltyData = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiService.getCustomerLoyaltyProfile(customer.phone)
      setProfile(res)
    } catch (err: any) {
      setError(err?.message || 'خطا در بارگذاری اطلاعات باشگاه مشتریان')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLoyaltyData()
  }, [customer.phone])

  const renderTierIcon = (iconName: string, className = 'w-5 h-5') => {
    switch (iconName) {
      case 'crown':
        return <Crown className={className} />
      case 'star':
        return <Star className={className} />
      case 'diamond':
        return <Diamond className={className} />
      case 'zap':
        return <Zap className={className} />
      case 'medal':
        return <Medal className={className} />
      default:
        return <Award className={className} />
    }
  }

  // Get luxurious card styling based on tier
  const getCardTheme = (code: string) => {
    switch (code) {
      case 'gold':
        return {
          bg: 'from-amber-600 via-amber-700 to-amber-900',
          border: 'border-amber-400/50 shadow-amber-500/20',
          chip: 'bg-gradient-to-br from-amber-200 to-amber-400',
          text: 'text-amber-950',
          accent: 'text-amber-100',
        }
      case 'silver':
        return {
          bg: 'from-zinc-600 via-zinc-700 to-zinc-900',
          border: 'border-zinc-300/50 shadow-zinc-400/20',
          chip: 'bg-gradient-to-br from-zinc-100 to-zinc-300',
          text: 'text-zinc-950',
          accent: 'text-zinc-100',
        }
      case 'diamond':
        return {
          bg: 'from-sky-700 via-blue-800 to-zinc-950',
          border: 'border-sky-400/50 shadow-sky-500/25',
          chip: 'bg-gradient-to-br from-sky-100 to-blue-300',
          text: 'text-sky-950',
          accent: 'text-sky-100',
        }
      default: // bronze
        return {
          bg: 'from-amber-800 via-amber-900 to-stone-950',
          border: 'border-amber-600/50 shadow-amber-700/20',
          chip: 'bg-gradient-to-br from-amber-300 to-amber-600',
          text: 'text-amber-950',
          accent: 'text-amber-100',
        }
    }
  }

  if (loading && !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[360px] p-8 space-y-4">
        <div className="w-12 h-12 border-4 border-brand/20 border-t-brand rounded-full animate-spin" />
        <p className="text-xs text-muted-foreground font-medium animate-pulse">
          در حال بررسی سوابق خرید و سطح کاربری VIP شما...
        </p>
      </div>
    )
  }

  if (error && !profile) {
    return (
      <div className="bg-destructive/10 border border-destructive/30 rounded-surface p-6 text-center text-destructive space-y-3">
        <AlertCircle className="w-8 h-8 mx-auto text-destructive" />
        <p className="text-sm font-bold">{error}</p>
        <button
          type="button"
          onClick={loadLoyaltyData}
          className="px-4 py-2 bg-destructive text-destructive-foreground rounded-control text-xs font-semibold hover:opacity-90 transition cursor-pointer"
        >
          تلاش دوباره
        </button>
      </div>
    )
  }

  const currentTier = profile?.current_tier
  const nextTier = profile?.next_tier
  const cardTheme = getCardTheme(currentTier?.code || 'bronze')

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Banner - Graphite Minimal Technical */}
      <div className="rounded-surface border border-border/60 bg-card p-6 shadow-surface flex flex-col md:flex-row items-start md:items-center justify-between gap-4 duration-motion ease-motion">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-control bg-brand/10 border border-brand/30 text-brand text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>باشگاه مشتریان و وفاداری اختصاصی آناهیکس</span>
          </div>
          <h2 className="text-xl font-black text-foreground flex items-center gap-2">
            امتیازات VIP و تخفیف‌های خودکار
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-xl">
            با افزایش حجم خریدهای خود در آناهیکس، سطح کاربری شما به صورت خودکار
            ارتقا یافته و از تخفیف‌های دائمی روی تمام سفارش‌ها و اولویت در تحویل
            اپراتور بهره‌مند می‌شوید.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            loadLoyaltyData()
            onReloadCustomer?.()
          }}
          className="h-9 px-4 rounded-control border border-border/60 bg-card hover:bg-muted text-foreground text-xs font-bold duration-motion ease-motion active:scale-[0.98] flex items-center gap-1.5 shrink-0 cursor-pointer"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`}
          />
          <span>بروزرسانی وضعیت</span>
        </button>
      </div>

      {/* Main Section: Digital VIP Metal Card + Progression Engine */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Digital Luxury Membership Card with 3D Flip & Tilt Animation */}
        <div className="lg:col-span-5 flex flex-col justify-center">
          <FlipCard3D
            front={
              <div
                className={`relative w-full h-full p-6 bg-gradient-to-br ${cardTheme.bg} border ${cardTheme.border} shadow-2xl text-white flex flex-col justify-between`}
              >
                {/* Top Row: Brand & Chip */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-control bg-black/20 backdrop-blur-md flex items-center justify-center font-black text-sm border border-white/20">
                      AX
                    </div>
                    <div>
                      <span className="font-black text-xs tracking-wider block font-latin">
                        ANAHIX VIP
                      </span>
                      <span className="text-[9px] uppercase tracking-widest opacity-80 font-latin">
                        CLUB MEMBER
                      </span>
                    </div>
                  </div>

                  {/* Tier Badge on Card */}
                  <div className="px-3 py-1 rounded-control bg-black/30 backdrop-blur-md border border-white/30 text-xs font-bold flex items-center gap-1.5 shadow-sm">
                    {renderTierIcon(
                      currentTier?.icon || 'medal',
                      'w-3.5 h-3.5 text-brand',
                    )}
                    <span>{currentTier?.name}</span>
                  </div>
                </div>

                {/* Smart EMV Chip simulation */}
                <div className="my-2">
                  <div
                    className={`w-11 h-8 rounded-control ${cardTheme.chip} border border-amber-900/30 flex items-center justify-around px-1 shadow-inner opacity-90`}
                  >
                    <div className="w-1.5 h-full border-r border-amber-900/20" />
                    <div className="w-1.5 h-full border-r border-amber-900/20" />
                  </div>
                </div>

                {/* Card Middle: Discount Highlights */}
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase tracking-wider text-white/80 block font-latin">
                    ACTIVE PRIVILEGE
                  </span>
                  <p className="text-xl font-black tracking-tight flex items-baseline gap-1.5 font-latin">
                    {currentTier?.discount_percent &&
                    currentTier.discount_percent > 0 ? (
                      <>
                        <span>
                          {toPersianDigits(currentTier.discount_percent)}٪ تخفیف
                          نقدی دائم
                        </span>
                        <span className="text-xs font-normal text-white/80 font-sans">
                          (روی تمام سفارش‌ها)
                        </span>
                      </>
                    ) : (
                      <span>قیمت استاندارد پایه</span>
                    )}
                  </p>
                </div>

                {/* Card Bottom: Customer Info & Code */}
                <div className="flex items-end justify-between pt-2 border-t border-white/20 text-xs">
                  <div>
                    <span className="text-[9px] uppercase text-white/70 block font-latin">
                      MEMBER NAME
                    </span>
                    <span className="font-bold text-sm block">
                      {customer.full_name || customer.phone}
                    </span>
                  </div>

                  <div className="text-left font-mono">
                    <span className="text-[9px] uppercase text-white/70 block font-latin">
                      REFERRAL / ID
                    </span>
                    <span className="font-black tracking-widest text-sm font-latin">
                      {customer.referral_code || 'ANX-VIP'}
                    </span>
                  </div>
                </div>

                {/* Glow Decorative Elements */}
                <div className="absolute -right-12 -bottom-12 w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none" />
              </div>
            }
            back={
              <div
                className={`relative w-full h-full p-5 bg-gradient-to-br ${cardTheme.bg} border ${cardTheme.border} shadow-2xl text-white flex flex-col justify-between`}
              >
                {/* Magnetic Stripe */}
                <div className="-mx-5 h-9 bg-zinc-950/85 border-y border-white/10 shadow-inner" />

                {/* Signature Strip & CVV Security */}
                <div className="space-y-1.5 my-1">
                  <div className="flex items-center justify-between text-[9px] text-white/70 uppercase font-latin">
                    <span>SECURITY SEAL / VERIFIED BY ANAHIX</span>
                    <span>CVV / SEC</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-7 bg-white/90 rounded-control px-2 flex items-center justify-between text-zinc-900 font-mono text-xs font-bold">
                      <span className="truncate">
                        {customer.phone || '09835c3f7f0'}
                      </span>
                      <span className="text-zinc-600 font-latin text-[10px]">
                        AUTHORIZED
                      </span>
                    </div>
                    <div className="w-12 h-7 bg-zinc-900 rounded-control border border-white/20 flex items-center justify-center font-mono font-black text-xs text-amber-400">
                      ۷۸۶
                    </div>
                  </div>
                </div>

                {/* Perks Terms & Seal */}
                <div className="space-y-1 text-right">
                  <p className="text-[9px] text-white/80 leading-relaxed">
                    این کارت شناسایی دیجیتال اعضای ویژه آناهیکس است و تخفیف‌های
                    نقدی آن به صورت خودکار روی هر سفارش اعمال می‌گردد.
                  </p>
                  <div className="flex items-center justify-between text-[9px] text-white/60 pt-1 border-t border-white/20 font-latin">
                    <span>anahix.com</span>
                    <span>ALL RIGHTS RESERVED</span>
                  </div>
                </div>
              </div>
            }
          />
        </div>

        {/* Progression to Next Tier Card */}
        <div className="lg:col-span-7 rounded-surface border border-border/60 bg-card p-6 shadow-surface flex flex-col justify-between space-y-5 duration-motion ease-motion">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="text-xs text-muted-foreground font-semibold block mb-1">
                مسیر رشد و ارتقای سطح شما
              </span>
              <h3 className="text-lg font-black text-foreground flex items-center gap-2">
                {nextTier ? (
                  <>
                    <span>سطح بعدی: {nextTier.name}</span>
                    <span className="text-xs font-bold text-emerald-400 px-2 py-0.5 rounded-control bg-emerald-500/10 border border-emerald-500/20 font-latin">
                      {toPersianDigits(nextTier.discount_percent)}٪ تخفیف
                    </span>
                  </>
                ) : (
                  <span className="text-emerald-400 flex items-center gap-1.5">
                    <Crown className="w-5 h-5 text-brand" />
                    شما در بالاترین سطح باشگاه (VIP کلاب) قرار دارید!
                  </span>
                )}
              </h3>
            </div>

            <span className="text-xs text-muted-foreground font-mono">
              دوره:{' '}
              {profile?.period === 'monthly_30d' ? '۳۰ روز اخیر' : 'کل تاریخچه'}
            </span>
          </div>

          {/* Progress Bar Component */}
          {nextTier ? (
            <div className="space-y-2 bg-muted/20 p-4 rounded-control border border-border/60">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-foreground">
                  پیشرفت تا سطح {nextTier.name}
                </span>
                <span className="font-mono font-bold text-brand font-latin">
                  {toPersianDigits(profile?.progress_percent || 0)}%
                </span>
              </div>

              <div className="w-full bg-muted h-3 rounded-full overflow-hidden p-0.5 relative">
                <div
                  style={{
                    width: `${Math.min(profile?.progress_percent || 0, 100)}%`,
                  }}
                  className="bg-gradient-to-r from-brand to-amber-400 h-full rounded-full transition-all duration-700 shadow-md shadow-brand/40"
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                <span>
                  خرید این دوره:{' '}
                  <strong className="text-foreground font-latin">
                    {formatToman(profile?.active_spent_toman || 0)} تومان
                  </strong>
                </span>
                <span>
                  هدف سطح بعدی:{' '}
                  <strong className="text-brand font-mono font-latin">
                    {formatToman(nextTier.min_spend_toman)} تومان
                  </strong>
                </span>
              </div>

              {profile?.required_for_next && profile.required_for_next > 0 && (
                <div className="mt-2 p-2.5 rounded-control bg-brand/10 border border-brand/20 text-xs text-foreground flex items-center gap-2">
                  <Flame className="w-4 h-4 text-brand shrink-0" />
                  <span>
                    تنها با{' '}
                    <strong className="text-brand font-black font-latin">
                      {formatToman(profile.required_for_next)} تومان
                    </strong>{' '}
                    خرید دیگر، فوراً به سطح {nextTier.name} ارتقا یافته و از{' '}
                    {toPersianDigits(nextTier.discount_percent)}٪ تخفیف خودکار
                    روی تمامی لایسنس‌ها بهره‌مند شوید!
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-control text-xs text-emerald-400 space-y-1">
              <p className="font-bold">
                تبریک! تمام مزایا و تخفیف‌های ویژه VIP برای شما فعال است.
              </p>
              <p className="text-muted-foreground">
                سفارشات شما با بالاترین اولویت در صف اپراتور پردازش شده و حداکثر
                درصد تخفیف نقدی روی هر سبد خرید اعمال می‌شود.
              </p>
            </div>
          )}

          {/* Value Realized Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-muted/20 p-3 rounded-control border border-border/40 text-center">
              <span className="text-[11px] text-muted-foreground block">
                سود ذخیره‌شده از تخفیف‌ها
              </span>
              <span className="text-sm font-black text-emerald-400 mt-1 block font-latin">
                {formatToman(profile?.total_saved_toman || 0)} تومان
              </span>
            </div>

            <div className="bg-muted/20 p-3 rounded-control border border-border/40 text-center">
              <span className="text-[11px] text-muted-foreground block">
                کل خرید ۳۰ روز اخیر
              </span>
              <span className="text-sm font-bold text-foreground mt-1 block font-latin">
                {formatToman(profile?.monthly_spent_toman || 0)} تومان
              </span>
            </div>

            <div className="bg-muted/20 p-3 rounded-control border border-border/40 text-center">
              <span className="text-[11px] text-muted-foreground block">
                اولویت صف تحویل اپراتور
              </span>
              <span className="text-sm font-bold text-brand mt-1 block">
                {currentTier?.queue_priority && currentTier.queue_priority >= 50
                  ? 'VIP طلایی (فوق‌سریع)'
                  : currentTier?.queue_priority &&
                      currentTier.queue_priority >= 10
                    ? 'اولویت بالا'
                    : 'استاندارد'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Tiers & Perks Comparison Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Layers className="w-5 h-5 text-brand" />
              <span>جدول مقایسه سطوح و امکانات باشگاه مشتریان آناهیکس</span>
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              آشنایی با شرایط ارتقا و مزایای اختصاصی هر سطح
            </p>
          </div>
          <Link
            to="/category/all"
            className="text-xs text-brand hover:underline font-semibold flex items-center gap-1"
          >
            <span>مشاهده کاتالوگ و خرید لایسنس</span>
            <ChevronLeft className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(profile?.all_tiers || []).map((t) => {
            const isCurrent = currentTier?.code === t.code
            return (
              <div
                key={t.id}
                className={`rounded-surface border p-5 shadow-surface flex flex-col justify-between space-y-4 relative duration-motion ease-motion transition-all ${
                  isCurrent
                    ? 'border-brand bg-card shadow-control ring-1 ring-brand/30'
                    : 'border-border/60 bg-card hover:border-border'
                }`}
              >
                {isCurrent && (
                  <div className="absolute top-3 left-3 px-2 py-0.5 rounded-control bg-brand text-brand-foreground font-black text-[10px] flex items-center gap-1 shadow-control">
                    <Check className="w-3 h-3 stroke-[3]" />
                    سطح فعلی شما
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="p-2 rounded-control text-white inline-flex shadow-control"
                      style={{ backgroundColor: t.badge_color }}
                    >
                      {renderTierIcon(t.icon, 'w-4 h-4')}
                    </span>
                    <div>
                      <h4 className="font-bold text-sm text-foreground">
                        {t.name}
                      </h4>
                      <span className="text-[10px] text-muted-foreground font-mono font-latin">
                        {t.name_en || t.code}
                      </span>
                    </div>
                  </div>

                  <div className="bg-muted/20 p-3 rounded-control border border-border/40 space-y-1">
                    <div className="text-[11px] text-muted-foreground flex justify-between">
                      <span>حداقل خرید دوره:</span>
                      <strong className="text-foreground font-mono font-latin">
                        {t.min_spend_toman > 0
                          ? `${formatToman(t.min_spend_toman)} ت`
                          : 'بدون شرط خرید'}
                      </strong>
                    </div>
                    <div className="text-[11px] text-muted-foreground flex justify-between">
                      <span>تخفیف خودکار:</span>
                      <strong className="text-emerald-400 font-black font-latin">
                        {t.discount_percent > 0
                          ? `${toPersianDigits(t.discount_percent)}٪ تخفیف`
                          : 'استاندارد'}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Perks Checklist */}
                <div className="space-y-2 pt-2 border-t border-border/40 flex-1">
                  <span className="text-[11px] font-bold text-muted-foreground block">
                    مزایای این سطح:
                  </span>
                  <div className="space-y-1.5">
                    {(t.perks || []).map((perk) => (
                      <div
                        key={perk}
                        className="flex items-start gap-1.5 text-xs text-muted-foreground"
                      >
                        <Check className="w-3.5 h-3.5 text-brand shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{perk}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
