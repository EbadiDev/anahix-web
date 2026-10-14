import {
  ArrowDownLeft,
  ArrowUpRight,
  Gift,
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
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'

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

  useEffect(() => {
    let isMounted = true
    async function fetchLedger() {
      setLoading(true)
      try {
        const items = await apiService.getWalletLedger(customer.phone)
        if (isMounted) setLedger(items)
      } catch {
        if (isMounted) setLedger([])
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    fetchLedger()
    return () => {
      isMounted = false
    }
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
      {/* 1. Hero Wallet Card */}
      <div className="p-6 rounded-2xl border border-blue-200/80 dark:border-blue-900/60 bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xl shadow-blue-500/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-blue-100 text-xs font-semibold">
            <Wallet className="w-4 h-4" />
            <span>موجودی در دسترس کیف پول آناهیکس</span>
          </div>

          <div className="mt-2 text-3xl sm:text-4xl font-black flex items-baseline gap-2">
            {balance.toLocaleString('fa-IR')}
            <span className="text-base font-normal text-blue-100">تومان</span>
          </div>

          <p className="mt-1 text-xs text-blue-100">
            امکان پرداخت آنی و خرید مستقیم شماره مجازی و اشتراک‌های هوش مصنوعی
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button
            onClick={onOpenTopupModal}
            className="flex-1 md:flex-initial h-11 px-6 rounded-xl bg-white hover:bg-blue-50 text-blue-700 font-bold text-xs shadow-md transition active:scale-95"
          >
            <Plus className="w-4 h-4 ml-1.5" />
            افزایش موجودی (شارژ آنلاین)
          </Button>
        </div>
      </div>

      {/* 2. Quick Benefits */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4" />
          </div>
          <div className="text-xs">
            <h5 className="font-bold text-slate-800 dark:text-slate-200">
              خرید آنی با یک کلیک
            </h5>
            <p className="text-[11px] text-slate-400">
              کسر مستقیم بدون نیاز به درگاه بانکی
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center shrink-0">
            <RefreshCw className="w-4 h-4" />
          </div>
          <div className="text-xs">
            <h5 className="font-bold text-slate-800 dark:text-slate-200">
              استرداد وجه خودکار
            </h5>
            <p className="text-[11px] text-slate-400">
              بازگشت آنی مبلغ شماره‌های لغو شده
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center shrink-0">
            <Gift className="w-4 h-4" />
          </div>
          <div className="text-xs">
            <h5 className="font-bold text-slate-800 dark:text-slate-200">
              واریز کمیسیون رفرال
            </h5>
            <p className="text-[11px] text-slate-400">
              پاداش معرفی مستقیم به این کیف پول
            </p>
          </div>
        </div>
      </div>

      {/* 3. Transaction Ledger Table */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <History className="w-4 h-4 text-blue-600" />
              دفتر کل تراکنش‌های مالی (Transaction Ledger)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              ریز گردش حساب، واریزی‌ها، خریدها و بونوس‌ها از دیتابیس آناهیکس
            </p>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
              className="h-7 text-xs rounded-lg px-2.5"
            >
              همه
            </Button>
            <Button
              variant={filter === 'deposit' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('deposit')}
              className="h-7 text-xs rounded-lg px-2.5"
            >
              واریزها
            </Button>
            <Button
              variant={filter === 'expense' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('expense')}
              className="h-7 text-xs rounded-lg px-2.5"
            >
              خریدها
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span className="text-xs">در حال بارگذاری تراکنش‌ها...</span>
          </div>
        ) : filteredLedger.length === 0 ? (
          <div className="py-12 text-center space-y-2 text-slate-400">
            <History className="w-8 h-8 mx-auto opacity-35 text-slate-400" />
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              هنوز تراکنشی در تاریخچه کیف پول شما ثبت نشده است
            </p>
            <p className="text-[11px] text-slate-400">
              تراکنش‌های شارژ آنلاین و پرداخت‌های شما پس از ثبت سفارش در این جدول
              نمایش داده می‌شوند.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredLedger.map((item) => {
              const isPositive =
                item.type === 'DEPOSIT' ||
                item.type === 'REFUND' ||
                item.type === 'REFERRAL_COMMISSION'

              return (
                <div
                  key={item.id}
                  className="py-3.5 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isPositive
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {isPositive ? (
                        <ArrowDownLeft className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                    </div>

                    <div>
                      <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {item.title}
                      </h5>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5 font-mono">
                        <span>
                          {item.created_at
                            ? new Date(item.created_at).toLocaleDateString(
                                'fa-IR',
                              )
                            : '—'}
                        </span>
                        <span>•</span>
                        <span>
                          کد پیگیری:{' '}
                          {item.payment_ref_id || item.transaction_number}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-left">
                    <div
                      dir="ltr"
                      className={`text-xs font-bold ${
                        isPositive
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {isPositive ? '+' : '-'}
                      {item.amount_toman.toLocaleString('fa-IR')}{' '}
                      <span className="text-[10px] font-sans">تومان</span>
                    </div>

                    <Badge
                      className={`border-0 text-[9px] px-1.5 py-0 mt-0.5 ${
                        item.status === 'SUCCESS' || item.status === 'PAID'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-400'
                          : item.status === 'PENDING'
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/80 dark:text-amber-400'
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-950/80 dark:text-rose-400'
                      }`}
                    >
                      {item.status === 'SUCCESS' || item.status === 'PAID'
                        ? 'موفق ✓'
                        : item.status === 'PENDING'
                          ? 'در انتظار'
                          : 'ناموفق'}
                    </Badge>
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
