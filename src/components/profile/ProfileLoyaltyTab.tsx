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
          bg: 'from-amber-600 via-yellow-500 to-amber-700',
          border: 'border-yellow-400/60 shadow-yellow-500/20',
          chip: 'bg-gradient-to-br from-yellow-200 to-amber-400',
          text: 'text-amber-950',
          accent: 'text-amber-100',
          glow: 'bg-yellow-400/20',
        }
      case 'silver':
        return {
          bg: 'from-slate-600 via-zinc-400 to-slate-700',
          border: 'border-slate-300/60 shadow-slate-400/20',
          chip: 'bg-gradient-to-br from-slate-100 to-zinc-300',
          text: 'text-slate-950',
          accent: 'text-slate-100',
          glow: 'bg-slate-300/20',
        }
      case 'diamond':
        return {
          bg: 'from-sky-700 via-cyan-500 to-blue-800',
          border: 'border-cyan-300/60 shadow-cyan-500/25',
          chip: 'bg-gradient-to-br from-cyan-100 to-sky-300',
          text: 'text-cyan-950',
          accent: 'text-cyan-100',
          glow: 'bg-cyan-400/20',
        }
      default: // bronze
        return {
          bg: 'from-amber-800 via-amber-700 to-stone-800',
          border: 'border-amber-600/50 shadow-amber-700/20',
          chip: 'bg-gradient-to-br from-amber-300 to-amber-600',
          text: 'text-amber-950',
          accent: 'text-amber-100',
          glow: 'bg-amber-600/20',
        }
    }
  }

  if (loading && !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[360px] p-8 space-y-4">
        <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
        <p className="text-xs text-slate-400 font-medium animate-pulse">
          در حال بررسی سوابق خرید و سطح کاربری VIP شما...
        </p>
      </div>
    )
  }

  if (error && !profile) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 text-center text-red-400 space-y-3">
        <AlertCircle className="w-8 h-8 mx-auto text-red-500" />
        <p className="text-sm font-bold">{error}</p>
        <button
          onClick={loadLoyaltyData}
          className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-semibold hover:bg-red-500 transition"
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
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/30 p-6 rounded-2xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>باشگاه مشتریان و وفاداری اختصاصی آناهیکس</span>
          </div>
          <h2 className="text-xl font-black text-slate-100 flex items-center gap-2">
            امتیازات VIP و تخفیف‌های خودکار
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed max-w-xl">
            با افزایش حجم خریدهای خود در آناهیکس، سطح کاربری شما به صورت خودکار
            ارتقا یافته و از تخفیف‌های دائمی روی تمام سفارش‌ها و اولویت در تحویل
            اپراتور بهره‌مند می‌شوید.
          </p>
        </div>

        <button
          onClick={() => {
            loadLoyaltyData()
            onReloadCustomer?.()
          }}
          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition flex items-center gap-1.5 shrink-0"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`}
          />
          بروزرسانی وضعیت
        </button>
      </div>

      {/* Main Section: Digital VIP Metal Card + Progression Engine */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Digital Luxury Membership Card */}
        <div className="lg:col-span-5 flex flex-col justify-center">
          <div
            className={`relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br ${cardTheme.bg} border ${cardTheme.border} shadow-2xl text-white aspect-[1.586/1] flex flex-col justify-between select-none group transition-all duration-300 hover:scale-[1.01]`}
          >
            {/* Top Row: Brand & Chip */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-black/20 backdrop-blur-md flex items-center justify-center font-black text-sm border border-white/20">
                  AX
                </div>
                <div>
                  <span className="font-black text-xs tracking-wider block">
                    ANAHIX VIP
                  </span>
                  <span className="text-[9px] uppercase tracking-widest opacity-80">
                    CLUB MEMBER
                  </span>
                </div>
              </div>

              {/* Tier Badge on Card */}
              <div className="px-3 py-1 rounded-full bg-black/30 backdrop-blur-md border border-white/30 text-xs font-bold flex items-center gap-1.5 shadow-sm">
                {renderTierIcon(currentTier?.icon || 'medal', 'w-3.5 h-3.5')}
                <span>{currentTier?.name}</span>
              </div>
            </div>

            {/* Smart EMV Chip simulation */}
            <div className="my-2">
              <div
                className={`w-11 h-8 rounded-md ${cardTheme.chip} border border-amber-900/30 flex items-center justify-around px-1 shadow-inner opacity-90`}
              >
                <div className="w-1.5 h-full border-r border-amber-900/20" />
                <div className="w-1.5 h-full border-r border-amber-900/20" />
              </div>
            </div>

            {/* Card Middle: Discount Highlights */}
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase tracking-wider text-white/80 block">
                ACTIVE PRIVILEGE
              </span>
              <p className="text-xl font-black tracking-tight flex items-baseline gap-1.5">
                {currentTier?.discount_percent &&
                currentTier.discount_percent > 0 ? (
                  <>
                    <span>{currentTier.discount_percent}٪ تخفیف نقدی دائم</span>
                    <span className="text-xs font-normal text-white/80">
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
                <span className="text-[9px] uppercase text-white/70 block">
                  MEMBER NAME
                </span>
                <span className="font-bold text-sm block">
                  {customer.full_name || customer.phone}
                </span>
              </div>

              <div className="text-left font-mono">
                <span className="text-[9px] uppercase text-white/70 block">
                  REFERRAL / ID
                </span>
                <span className="font-black tracking-widest text-sm">
                  {customer.referral_code || 'ANX-VIP'}
                </span>
              </div>
            </div>

            {/* Glow Decorative Elements */}
            <div className="absolute -right-12 -bottom-12 w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          </div>
        </div>

        {/* Progression to Next Tier Card */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col justify-between space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="text-xs text-slate-400 font-semibold block mb-1">
                مسیر رشد و ارتقای سطح شما
              </span>
              <h3 className="text-lg font-black text-slate-100 flex items-center gap-2">
                {nextTier ? (
                  <>
                    <span>سطح بعدی: {nextTier.name}</span>
                    <span className="text-xs font-bold text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                      {nextTier.discount_percent}٪ تخفیف
                    </span>
                  </>
                ) : (
                  <span className="text-emerald-400 flex items-center gap-1.5">
                    <Crown className="w-5 h-5 text-amber-400" />
                    شما در بالاترین سطح باشگاه (VIP کلاب) قرار دارید!
                  </span>
                )}
              </h3>
            </div>

            <span className="text-xs text-slate-400 font-mono">
              دوره:{' '}
              {profile?.period === 'monthly_30d' ? '۳۰ روز اخیر' : 'کل تاریخچه'}
            </span>
          </div>

          {/* Progress Bar Component */}
          {nextTier ? (
            <div className="space-y-2 bg-slate-950/70 p-4 rounded-xl border border-slate-800/80">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-300">
                  پیشرفت تا سطح {nextTier.name}
                </span>
                <span className="font-mono font-bold text-amber-400">
                  {profile?.progress_percent}%
                </span>
              </div>

              <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden p-0.5 relative">
                <div
                  style={{
                    width: `${Math.min(profile?.progress_percent || 0, 100)}%`,
                  }}
                  className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full rounded-full transition-all duration-700 shadow-md shadow-amber-500/40"
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <span>
                  خرید این دوره:{' '}
                  <strong className="text-slate-200">
                    {(profile?.active_spent_toman || 0).toLocaleString('fa-IR')}{' '}
                    ت
                  </strong>
                </span>
                <span>
                  هدف سطح بعدی:{' '}
                  <strong className="text-amber-400 font-mono">
                    {nextTier.min_spend_toman.toLocaleString('fa-IR')} ت
                  </strong>
                </span>
              </div>

              {profile?.required_for_next && profile.required_for_next > 0 && (
                <div className="mt-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300/90 flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    تنها با{' '}
                    <strong className="text-amber-200 font-black">
                      {profile.required_for_next.toLocaleString('fa-IR')} تومان
                    </strong>{' '}
                    خرید دیگر، فوراً به سطح {nextTier.name} ارتقا یافته و از{' '}
                    {nextTier.discount_percent}٪ تخفیف خودکار روی تمامی لایسنس‌ها
                    بهره‌مند شوید!
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl text-xs text-emerald-300 space-y-1">
              <p className="font-bold">
                تبریک! تمام مزایا و تخفیف‌های ویژه VIP برای شما فعال است.
              </p>
              <p className="text-emerald-400/80">
                سفارشات شما با بالاترین اولویت در صف اپراتور پردازش شده و حداکثر
                درصد تخفیف نقدی روی هر سبد خرید اعمال می‌شود.
              </p>
            </div>
          )}

          {/* Value Realized Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800 text-center">
              <span className="text-[11px] text-slate-400 block">
                سود ذخیره‌شده از تخفیف‌ها
              </span>
              <span className="text-sm font-black text-emerald-400 mt-1 block">
                {(profile?.total_saved_toman || 0).toLocaleString('fa-IR')}{' '}
                تومان
              </span>
            </div>

            <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800 text-center">
              <span className="text-[11px] text-slate-400 block">
                کل خرید ۳۰ روز اخیر
              </span>
              <span className="text-sm font-bold text-slate-200 mt-1 block">
                {(profile?.monthly_spent_toman || 0).toLocaleString('fa-IR')}{' '}
                تومان
              </span>
            </div>

            <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800 text-center">
              <span className="text-[11px] text-slate-400 block">
                اولویت صف تحویل اپراتور
              </span>
              <span className="text-sm font-bold text-blue-400 mt-1 block">
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
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-400" />
              جدول مقایسه سطوح و امکانات باشگاه مشتریان آناهیکس
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              آشنایی با شرایط ارتقا و مزایای اختصاصی هر سطح
            </p>
          </div>
          <Link
            to="/#products"
            className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
          >
            مشاهده کاتالوگ و خرید لایسنس
            <ChevronLeft className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(profile?.all_tiers || []).map((t) => {
            const isCurrent = currentTier?.code === t.code
            return (
              <div
                key={t.id}
                className={`bg-slate-900 rounded-2xl border p-5 shadow-lg flex flex-col justify-between space-y-4 relative transition ${
                  isCurrent
                    ? 'border-amber-500 shadow-amber-500/10 ring-2 ring-amber-500/30'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {isCurrent && (
                  <div className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] flex items-center gap-1 shadow-md">
                    <Check className="w-3 h-3 stroke-[3]" />
                    سطح فعلی شما
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="p-2 rounded-xl text-white inline-flex"
                      style={{ backgroundColor: t.badge_color }}
                    >
                      {renderTierIcon(t.icon, 'w-4 h-4')}
                    </span>
                    <div>
                      <h4 className="font-bold text-sm text-slate-100">
                        {t.name}
                      </h4>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {t.name_en || t.code}
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 space-y-1">
                    <div className="text-[11px] text-slate-400 flex justify-between">
                      <span>حداقل خرید دوره:</span>
                      <strong className="text-slate-200 font-mono">
                        {t.min_spend_toman > 0
                          ? `${t.min_spend_toman.toLocaleString('fa-IR')} ت`
                          : 'بدون شرط خرید'}
                      </strong>
                    </div>
                    <div className="text-[11px] text-slate-400 flex justify-between">
                      <span>تخفیف خودکار:</span>
                      <strong className="text-emerald-400 font-black">
                        {t.discount_percent > 0
                          ? `${t.discount_percent}٪ تخفیف`
                          : 'استاندارد'}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Perks Checklist */}
                <div className="space-y-2 pt-2 border-t border-slate-800 flex-1">
                  <span className="text-[11px] font-bold text-slate-400 block">
                    مزایای این سطح:
                  </span>
                  <div className="space-y-1.5">
                    {(t.perks || []).map((perk) => (
                      <div
                        key={perk}
                        className="text-[11px] text-slate-300 flex items-start gap-1.5 leading-snug"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{perk}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action CTA */}
                <div className="pt-2">
                  {isCurrent ? (
                    <div className="w-full py-2 bg-amber-500/15 border border-amber-500/30 text-amber-300 rounded-xl text-xs font-bold text-center">
                      دسترسی به کلیه مزایا فعال است
                    </div>
                  ) : (
                    <Link
                      to="/#products"
                      className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold text-center block transition"
                    >
                      افزایش خرید و ارتقا
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
