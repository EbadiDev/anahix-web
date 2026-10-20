import {
  ArrowDownLeft,
  ArrowUpRight,
  History,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Wallet,
  Zap,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useMemo, useState } from 'react'
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
  const [searchQuery, setSearchQuery] = useState('')
  const [visibleCount, setVisibleCount] = useState<number>(6)
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

  const filteredLedger = useMemo(() => {
    return ledger.filter((item) => {
      const isDeposit =
        item.type === 'DEPOSIT' ||
        item.type === 'REFUND' ||
        item.type === 'REFERRAL_COMMISSION'
      const isExpense =
        item.type === 'PURCHASE_PRODUCT' ||
        item.type === 'PURCHASE_NUMBER' ||
        item.type === 'WITHDRAWAL'

      if (filter === 'deposit' && !isDeposit) return false
      if (filter === 'expense' && !isExpense) return false

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchTitle = item.title?.toLowerCase().includes(q)
        const matchTx = item.transaction_number?.toLowerCase().includes(q)
        if (!matchTitle && !matchTx) return false
      }

      return true
    })
  }, [ledger, filter, searchQuery])

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

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <div className="relative w-full sm:w-44">
              <input
                type="text"
                placeholder="جستجو در تراکنش‌ها..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setVisibleCount(6)
                }}
                className="w-full h-8 pr-8 pl-3 text-xs rounded-field bg-muted/20 border border-border/60 text-foreground outline-none focus:border-brand transition-colors"
              />
              <Search className="w-3.5 h-3.5 absolute right-2.5 top-2.5 text-muted-foreground pointer-events-none" />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 bg-muted/40 p-1 rounded-control border border-border/40 text-xs shrink-0">
              <button
                type="button"
                onClick={() => {
                  setFilter('all')
                  setVisibleCount(6)
                }}
                className={`text-xs px-2.5 py-1 rounded-control font-bold duration-motion ease-motion transition-all cursor-pointer ${
                  filter === 'all'
                    ? 'bg-primary text-primary-foreground font-black shadow-control'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                همه ({toPersianDigits(ledger.length)})
              </button>
              <button
                type="button"
                onClick={() => {
                  setFilter('deposit')
                  setVisibleCount(6)
                }}
                className={`text-xs px-2.5 py-1 rounded-control font-bold duration-motion ease-motion transition-all cursor-pointer ${
                  filter === 'deposit'
                    ? 'bg-primary text-primary-foreground font-black shadow-control'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                واریز
              </button>
              <button
                type="button"
                onClick={() => {
                  setFilter('expense')
                  setVisibleCount(6)
                }}
                className={`text-xs px-2.5 py-1 rounded-control font-bold duration-motion ease-motion transition-all cursor-pointer ${
                  filter === 'expense'
                    ? 'bg-primary text-primary-foreground font-black shadow-control'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                خرید
              </button>
            </div>
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
          <div className="space-y-3">
            <div className="space-y-2">
              {filteredLedger.slice(0, visibleCount).map((item) => {
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

            {/* Load More Transactions Button */}
            {visibleCount < filteredLedger.length && (
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setVisibleCount((prev) => prev + 6)}
                  className="h-10 px-5 rounded-control border border-border/60 bg-card hover:bg-muted text-foreground font-black text-xs duration-motion ease-motion active:scale-[0.98] shadow-control cursor-pointer inline-flex items-center gap-2"
                >
                  <span>بارگذاری تراکنش‌های بیشتر</span>
                  <span className="text-[11px] text-muted-foreground font-latin">
                    (نمایش{' '}
                    {toPersianDigits(
                      Math.min(visibleCount, filteredLedger.length),
                    )}{' '}
                    از {toPersianDigits(filteredLedger.length)})
                  </span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
