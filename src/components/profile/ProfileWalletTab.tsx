import {
  ArrowDownLeft,
  ArrowUpRight,
  History,
  Loader2,
  Plus,
  RefreshCw,
  Wallet,
  Zap,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useState } from 'react'
import { apiService } from '../../services/api'
import type { CustomerProfile, WalletLedgerItem } from '../../types'
import { formatToman, toPersianDigits } from '../../utils/formatters'

interface ProfileWalletTabProps {
  customer: CustomerProfile
  onOpenTopupModal: () => void
}

export const ProfileWalletTab: React.FC<ProfileWalletTabProps> = ({
  customer,
  onOpenTopupModal,
}) => {
  const [filter, setFilter] = useState<'all' | 'deposit' | 'expense'>('all')
  const [ledger, setLedger] = useState<WalletLedgerItem[]>([])
  const [loading, setLoading] = useState(true)
  const balance = customer.balance_toman || 0

  const fetchLedger = async () => {
    setLoading(true)
    try {
      const items = await apiService.getWalletLedger(customer.phone)
      setLedger(items)
    } catch {
      setLedger([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLedger()
  }, [customer.phone])

  const filteredLedger = ledger.filter((item) => {
    const isDeposit =
      item.type === 'DEPOSIT' ||
      item.type === 'REFUND' ||
      item.type === 'REFERRAL_COMMISSION'
    const isExpense =
      item.type === 'PURCHASE_PRODUCT' ||
      item.type === 'PURCHASE_NUMBER' ||
      item.type === 'WITHDRAWAL'

    if (filter === 'deposit') return isDeposit
    if (filter === 'expense') return isExpense
    return true
  })

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-4xl">
      {/* 1. Hero Wallet Card - Graphite Minimal Technical */}
      <div className="p-6 rounded-surface border border-border/60 bg-card text-card-foreground shadow-surface flex flex-col md:flex-row items-start md:items-center justify-between gap-6 duration-motion ease-motion">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-brand text-xs font-bold">
            <Wallet className="w-4 h-4" />
            <span>موجودی در دسترس کیف پول آناهیکس</span>
          </div>

          <div className="mt-2 text-3xl sm:text-4xl font-black text-foreground flex items-baseline gap-2 font-latin">
            {formatToman(balance)}
            <span className="text-base font-normal text-muted-foreground font-sans">
              تومان
            </span>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            امکان پرداخت آنی و خرید مستقیم شماره مجازی و اشتراک‌های هوش مصنوعی
            بدون معطلی
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            type="button"
            onClick={onOpenTopupModal}
            className="w-full md:w-auto h-11 px-6 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs duration-motion ease-motion active:scale-[0.98] shadow-control flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>افزایش موجودی (شارژ آنلاین)</span>
          </button>
        </div>
      </div>

      {/* 2. Quick Benefits */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-control border border-border/60 bg-muted/20 flex items-center gap-3">
          <div className="w-9 h-9 rounded-control bg-secondary text-secondary-foreground border border-border/60 flex items-center justify-center shrink-0 shadow-control">
            <Zap className="w-4 h-4 text-brand" />
          </div>
          <div className="text-xs">
            <h5 className="font-bold text-foreground">خرید آنی با یک کلیک</h5>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              کسر مستقیم از کیف پول بدون نیاز به درگاه
            </p>
          </div>
        </div>

        <div className="p-4 rounded-control border border-border/60 bg-muted/20 flex items-center gap-3">
          <div className="w-9 h-9 rounded-control bg-secondary text-secondary-foreground border border-border/60 flex items-center justify-center shrink-0 shadow-control">
            <RefreshCw className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xs">
            <h5 className="font-bold text-foreground">استرداد وجه خودکار</h5>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              بازگشت فوری هزینه در صورت لغو سفارش
            </p>
          </div>
        </div>

        <div className="p-4 rounded-control border border-border/60 bg-muted/20 flex items-center gap-3">
          <div className="w-9 h-9 rounded-control bg-secondary text-secondary-foreground border border-border/60 flex items-center justify-center shrink-0 shadow-control">
            <Wallet className="w-4 h-4 text-brand" />
          </div>
          <div className="text-xs">
            <h5 className="font-bold text-foreground">تسویه ریالی و شتاب</h5>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              پشتیبانی از کارت‌های بانکی عضو شتاب
            </p>
          </div>
        </div>
      </div>

      {/* 3. Transaction Ledger History */}
      <div className="rounded-surface border border-border/60 bg-card p-5 sm:p-6 shadow-surface space-y-4 duration-motion ease-motion">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/40">
          <div>
            <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
              <History className="w-4 h-4 text-brand" />
              <span>گردش حساب و تراکنش‌های کیف پول</span>
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              سوابق شارژ آنلاین، پرداختی‌های خرید و استردادهای مالی
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 bg-muted/40 p-1 rounded-control border border-border/40">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`text-xs px-3 py-1.5 rounded-control font-bold duration-motion ease-motion transition-all cursor-pointer ${
                filter === 'all'
                  ? 'bg-primary text-primary-foreground font-black shadow-control'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              همه ({toPersianDigits(ledger.length)})
            </button>
            <button
              type="button"
              onClick={() => setFilter('deposit')}
              className={`text-xs px-3 py-1.5 rounded-control font-bold duration-motion ease-motion transition-all cursor-pointer ${
                filter === 'deposit'
                  ? 'bg-primary text-primary-foreground font-black shadow-control'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              واریز و شارژ
            </button>
            <button
              type="button"
              onClick={() => setFilter('expense')}
              className={`text-xs px-3 py-1.5 rounded-control font-bold duration-motion ease-motion transition-all cursor-pointer ${
                filter === 'expense'
                  ? 'bg-primary text-primary-foreground font-black shadow-control'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              خرید و کسر
            </button>
          </div>
        </div>

        {/* Ledger Items */}
        {loading ? (
          <div className="py-12 text-center text-xs text-muted-foreground space-y-2">
            <Loader2 className="w-6 h-6 animate-spin text-brand mx-auto" />
            <p>در حال دریافت تراکنش‌های کیف پول...</p>
          </div>
        ) : filteredLedger.length === 0 ? (
          <div className="py-12 text-center bg-muted/10 border border-dashed border-border/60 rounded-control p-8 space-y-2">
            <Wallet className="w-8 h-8 text-muted-foreground/60 mx-auto" />
            <p className="text-xs font-bold text-foreground">
              تراکنشی در این دسته‌بندی ثبت نشده است
            </p>
            <p className="text-[11px] text-muted-foreground">
              با شارژ کیف پول یا ثبت سفارش، تراکنش‌های شما در این بخش نمایش داده
              می‌شوند.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredLedger.map((item) => {
              const isPlus = item.amount_toman > 0
              return (
                <div
                  key={item.id}
                  className="p-3.5 rounded-control border border-border/40 bg-muted/20 flex items-center justify-between text-xs duration-motion ease-motion"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-control flex items-center justify-center shrink-0 border ${
                        isPlus
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                          : 'bg-muted border-border/60 text-muted-foreground'
                      }`}
                    >
                      {isPlus ? (
                        <ArrowDownLeft className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <span className="font-bold text-foreground block">
                        {item.title ||
                          (isPlus ? 'شارژ / استرداد کیف پول' : 'خرید سرویس')}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {new Date(item.created_at).toLocaleString('fa-IR')}
                      </span>
                    </div>
                  </div>

                  <div className="text-left font-latin">
                    <span
                      className={`font-black text-sm block ${
                        isPlus ? 'text-emerald-400' : 'text-foreground'
                      }`}
                    >
                      {isPlus ? '+' : '-'}
                      {formatToman(Math.abs(item.amount_toman))} تومان
                    </span>
                    <span className="text-[10px] text-muted-foreground block font-mono">
                      پیگیری: #{item.transaction_number}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
