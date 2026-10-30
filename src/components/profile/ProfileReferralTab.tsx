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
import { formatToman, toPersianDigits } from '../../utils/formatters'
import { useNotification } from '../vibefarsi/NotificationContext'

interface ProfileReferralTabProps {
  customer: CustomerProfile
  onBalanceUpdated?: (newBalance: number) => void
}

export const ProfileReferralTab: React.FC<ProfileReferralTabProps> = ({
  customer,
  onBalanceUpdated,
}) => {
  const { success, error } = useNotification()
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
      // Fallback
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStats()
    const handleUpdate = () => {
      loadStats()
    }
    window.addEventListener('anahix:referral:updated', handleUpdate)
    return () => {
      window.removeEventListener('anahix:referral:updated', handleUpdate)
    }
  }, [])

  const copyLink = () => {
    navigator.clipboard.writeText(referralUrl)
    setCopied(true)
    success('لینک معرفی کپی شد', referralUrl)
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
      success('انتقال موفق', res.message)
      await loadStats()
      setTimeout(() => setTransferSuccess(''), 4000)
    } catch (err: any) {
      const msg = err.message || 'خطا در انتقال کمیسیون'
      setTransferError(msg)
      error('خطا در انتقال', msg)
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
      {/* 1. Hero Referral Program Card - Graphite Minimal Technical */}
      <div className="p-6 rounded-surface border border-border/60 bg-card text-card-foreground shadow-surface space-y-5 duration-motion ease-motion">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-brand text-xs font-bold">
              <Gift className="w-4 h-4" />
              <span>
                باشگاه همکاران و سیستم دعوت از دوستان (Referral Program)
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-foreground">
              {toPersianDigits(stats?.commission_rate_percent ?? 10)}٪ کمیسیون
              دائمی از تمامی خریدهای دوستان شما
            </h2>
            <p className="text-xs text-muted-foreground mt-1 max-w-xl leading-relaxed">
              با اشتراک‌گذاری لینک اختصاصی خود، به ازای هر خرید اشتراک هوش مصنوعی
              یا شماره مجازی توسط دوستانتان،{' '}
              {toPersianDigits(stats?.commission_rate_percent ?? 10)}٪ از مبلغ
              سفارش مستقیماً به عنوان پورسانت برای شما محاسبه شده و قابل انتقال
              به کیف پول است.
            </p>
          </div>

          <div className="p-3.5 rounded-control bg-secondary text-secondary-foreground border border-border/60 text-center shrink-0 shadow-control">
            <span className="text-[10px] text-muted-foreground block font-bold">
              نرخ کمیسیون شما:
            </span>
            <span className="text-2xl font-black text-brand font-sans">
              {toPersianDigits(stats?.commission_rate_percent ?? 10)}٪
            </span>
            <span className="text-[10px] text-muted-foreground block">
              بدون سقف درآمد
            </span>
          </div>
        </div>

        {/* Link Box */}
        <div className="p-3 rounded-control bg-muted/20 border border-border/60 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <LinkIcon className="w-4 h-4 text-brand shrink-0" />
            <span
              className="text-xs font-mono select-all text-foreground truncate font-latin"
              dir="ltr"
            >
              {referralUrl}
            </span>
          </div>

          <button
            type="button"
            onClick={copyLink}
            className="w-full sm:w-auto h-9 px-4 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs duration-motion ease-motion active:scale-[0.98] shadow-control flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>لینک کپی شد!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>کپی لینک اختصاصی</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Feedback Alerts */}
      {transferSuccess && (
        <div className="p-3.5 rounded-control bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{transferSuccess}</span>
        </div>
      )}

      {transferError && (
        <div className="p-3.5 rounded-control bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{transferError}</span>
        </div>
      )}

      {/* 2. Referral Statistics Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Referrals */}
        <div className="p-4 rounded-surface border border-border/60 bg-card text-card-foreground shadow-surface">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground">
              کل معرفی‌ها
            </span>
            <div className="w-8 h-8 rounded-control bg-secondary text-secondary-foreground border border-border/60 flex items-center justify-center shadow-control">
              <Users className="w-4 h-4 text-brand" />
            </div>
          </div>
          <div className="text-2xl font-black text-foreground font-sans">
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            ) : (
              <>
                {toPersianDigits(totalReferrals)}
                <span className="text-xs font-normal text-muted-foreground mr-1.5 font-sans">
                  کاربر
                </span>
              </>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1 font-sans">
            کد: {referralCode}
          </p>
        </div>

        {/* KPI 2: Successful Orders */}
        <div className="p-4 rounded-surface border border-border/60 bg-card text-card-foreground shadow-surface">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground">
              خریدهای موفق
            </span>
            <div className="w-8 h-8 rounded-control bg-secondary text-secondary-foreground border border-border/60 flex items-center justify-center shadow-control">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <div className="text-2xl font-black text-foreground font-sans">
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            ) : (
              <>
                {toPersianDigits(successfulOrders)}
                <span className="text-xs font-normal text-muted-foreground mr-1.5 font-sans">
                  سفارش
                </span>
              </>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            سفارش‌های نهایی دوستان
          </p>
        </div>

        {/* KPI 3: Total Commission Earned */}
        <div className="p-4 rounded-surface border border-border/60 bg-card text-card-foreground shadow-surface">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground">
              کل پورسانت کسب‌شده
            </span>
            <div className="w-8 h-8 rounded-control bg-secondary text-secondary-foreground border border-border/60 flex items-center justify-center shadow-control">
              <Award className="w-4 h-4 text-brand" />
            </div>
          </div>
          <div className="text-2xl font-black text-foreground font-sans">
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            ) : (
              <>
                {formatToman(totalCommission)}
                <span className="text-xs font-normal text-muted-foreground mr-1.5 font-sans">
                  تومان
                </span>
              </>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            مجموع درآمدهای حاصله
          </p>
        </div>

        {/* KPI 4: Available to withdraw/transfer */}
        <div className="p-4 rounded-surface border border-border/60 bg-card text-card-foreground shadow-surface flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground">
                موجودی قابل انتقال
              </span>
              <div className="w-8 h-8 rounded-control bg-secondary text-secondary-foreground border border-border/60 flex items-center justify-center shadow-control">
                <Wallet className="w-4 h-4 text-brand" />
              </div>
            </div>
            <div className="text-2xl font-black text-foreground font-sans">
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              ) : (
                <>
                  {formatToman(withdrawableCommission)}
                  <span className="text-xs font-normal text-muted-foreground mr-1.5 font-sans">
                    تومان
                  </span>
                </>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleTransferToWallet}
            disabled={transferring || withdrawableCommission <= 0}
            className="mt-3 w-full h-8 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-black duration-motion ease-motion active:scale-[0.98] shadow-control flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {transferring && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>انتقال به کیف پول</span>
          </button>
        </div>
      </div>

      {/* 3. Referral Information */}
      <div className="rounded-surface border border-border/60 bg-card text-card-foreground p-5 sm:p-6 shadow-surface space-y-3">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2 pb-3 border-b border-border/40">
          <History className="w-4 h-4 text-brand" />
          <span>نحوه تسویه و قوانین باشگاه معرفین آناهیکس</span>
        </h3>

        <div className="p-4 rounded-control border border-border/40 bg-muted/20 text-right space-y-2 text-xs text-muted-foreground leading-relaxed">
          <p>
            • کمیسیون معرفی بلافاصله پس از پرداخت موفق سفارش توسط دوست شما به
            حساب منظور می‌شود.
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
