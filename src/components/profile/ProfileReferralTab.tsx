import {
  AlertCircle,
  Award,
  Check,
  CheckCircle2,
  Copy,
  Gift,
  History,
  Link as LinkIcon,
  Loader2,
  Users,
  Wallet,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useState } from 'react'
import { apiService } from '../../services/api'
import type { CustomerProfile, ReferralStats } from '../../types'
import { Button } from '../ui/button'

interface ProfileReferralTabProps {
  customer: CustomerProfile
  onBalanceUpdated?: (newBalance: number) => void
}

export const ProfileReferralTab: React.FC<ProfileReferralTabProps> = ({
  customer,
  onBalanceUpdated,
}) => {
  const [stats, setStats] = useState<ReferralStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [transferring, setTransferring] = useState(false)
  const [transferSuccess, setTransferSuccess] = useState('')
  const [transferError, setTransferError] = useState('')

  const referralCode =
    stats?.referral_code ||
    customer.referral_code ||
    (customer.phone ? `ANX-${customer.phone.slice(-4)}` : 'ANX-9821')

  const referralUrl =
    stats?.referral_url || `https://anahix.com/ref/${referralCode}`

  const loadStats = async () => {
    setLoading(true)
    try {
      const data = await apiService.getReferralStats()
      if (data) setStats(data)
    } catch {
      // Fallback to default empty stats if unauthenticated
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStats()
  }, [])

  const copyLink = () => {
    navigator.clipboard.writeText(referralUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleTransferToWallet = async () => {
    setTransferring(true)
    setTransferSuccess('')
    setTransferError('')
    try {
      const res = await apiService.transferReferralCommission()
      setTransferSuccess(res.message)
      if (res.new_balance !== undefined && onBalanceUpdated) {
        onBalanceUpdated(res.new_balance)
      }
      // Reload stats after transfer
      await loadStats()
      setTimeout(() => setTransferSuccess(''), 4000)
    } catch (err: any) {
      setTransferError(err.message || 'خطا در انتقال کمیسیون')
      setTimeout(() => setTransferError(''), 4000)
    } finally {
      setTransferring(false)
    }
  }

  const totalReferrals = stats?.total_referrals ?? 0
  const successfulOrders = stats?.successful_orders ?? 0
  const totalCommission = stats?.total_commission_toman ?? 0
  const withdrawableCommission =
    stats?.withdrawable_commission_toman ?? customer.referral_balance_toman ?? 0

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-4xl">
      {/* 1. Hero Referral Program Card */}
      <div className="p-6 rounded-2xl border border-indigo-200/80 dark:border-indigo-900/60 bg-gradient-to-br from-indigo-600 via-blue-600 to-indigo-800 text-white shadow-xl shadow-indigo-500/10 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-100 text-xs font-semibold">
              <Gift className="w-4 h-4" />
              <span>
                باشگاه همکاران و سیستم دعوت از دوستان (Referral Program)
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black mt-1">
              ۱۰٪ کمیسیون دائمی از تمامی خریدهای دوستان شما
            </h2>
            <p className="text-xs text-indigo-100 mt-1 max-w-xl leading-relaxed">
              با اشتراک‌گذاری لینک اختصاصی خود، به ازای هر خرید اشتراک هوش مصنوعی
              یا شماره مجازی توسط دوستانتان، ۱۰٪ از مبلغ سفارش مستقیماً به عنوان
              پورسانت برای شما محاسبه شده و قابل انتقال به کیف پول است.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-white/10 backdrop-blur-xs border border-white/20 text-center shrink-0">
            <span className="text-[10px] text-indigo-200 block">
              نرخ کمیسیون شما:
            </span>
            <span className="text-2xl font-black">
              {stats?.commission_rate_percent ?? 10}٪
            </span>
            <span className="text-[10px] text-indigo-200 block">
              بدون سقف درآمد
            </span>
          </div>
        </div>

        {/* Link Box */}
        <div className="p-3.5 rounded-xl bg-black/20 backdrop-blur-xs border border-white/15 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <LinkIcon className="w-4 h-4 text-indigo-300 shrink-0" />
            <span
              className="text-xs font-mono select-all text-white truncate"
              dir="ltr"
            >
              {referralUrl}
            </span>
          </div>

          <Button
            size="sm"
            onClick={copyLink}
            className="w-full sm:w-auto h-9 px-4 rounded-lg bg-white hover:bg-indigo-50 text-indigo-700 font-bold text-xs shadow-sm transition active:scale-95 flex items-center justify-center gap-1.5"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                لینک کپی شد!
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                کپی لینک اختصاصی
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Feedback Alerts */}
      {transferSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{transferSuccess}</span>
        </div>
      )}

      {transferError && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{transferError}</span>
        </div>
      )}

      {/* 2. Referral Statistics Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Referrals */}
        <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              کل معرفی‌ها
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            ) : (
              <>
                {totalReferrals.toLocaleString('fa-IR')}
                <span className="text-xs font-normal text-slate-400 mr-1.5">
                  کاربر
                </span>
              </>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            ثبت‌نام شده با کد {referralCode}
          </p>
        </div>

        {/* KPI 2: Successful Orders */}
        <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              خریدهای موفق
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            ) : (
              <>
                {successfulOrders.toLocaleString('fa-IR')}
                <span className="text-xs font-normal text-slate-400 mr-1.5">
                  سفارش
                </span>
              </>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            سفارش‌های نهایی دوستان
          </p>
        </div>

        {/* KPI 3: Total Commission Earned */}
        <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              کل پورسانت کسب‌شده
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            ) : (
              <>
                {totalCommission.toLocaleString('fa-IR')}
                <span className="text-xs font-normal text-slate-400 mr-1.5">
                  تومان
                </span>
              </>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            مجموع درآمدهای حاصله
          </p>
        </div>

        {/* KPI 4: Available to withdraw/transfer */}
        <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                موجودی قابل انتقال
              </span>
              <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 flex items-center justify-center">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              ) : (
                <>
                  {withdrawableCommission.toLocaleString('fa-IR')}
                  <span className="text-xs font-normal text-slate-400 mr-1.5">
                    تومان
                  </span>
                </>
              )}
            </div>
          </div>

          <Button
            size="sm"
            onClick={handleTransferToWallet}
            disabled={transferring || withdrawableCommission <= 0}
            className="mt-3 w-full h-8 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-1.5"
          >
            {transferring && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>انتقال به کیف پول</span>
          </Button>
        </div>
      </div>

      {/* 3. Referral Information */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <History className="w-4 h-4 text-indigo-600" />
          نحوه تسویه و قوانین باشگاه معرفین آناهیکس
        </h3>

        <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-right space-y-2 text-xs text-muted-foreground leading-relaxed">
          <p>
            • کمیسیون معرفی بلافاصله پس از پرداخت موفق سفارش توسط دوست شما با
            وضعیت CONFIRMED ثبت می‌شود.
          </p>
          <p>
            • شما در هر زمان می‌توانید با زدن دکمه «انتقال به کیف پول»، پورسانت
            خود را به موجودی اصلی حساب منتقل کرده و برای خرید اشتراک یا شماره
            مجازی استفاده کنید.
          </p>
          <p>
            • هیچ محدودیتی در تعداد کاربران معرفی شده و میزان درآمد وجود ندارد.
          </p>
        </div>
      </div>
    </div>
  )
}
