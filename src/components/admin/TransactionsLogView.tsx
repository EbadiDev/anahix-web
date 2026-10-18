import {
  ArrowDownLeft,
  Check,
  Copy,
  PackageCheck,
  Radio,
  ReceiptText,
  RefreshCw,
  Search,
  Wallet,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useState } from 'react'
import { apiService } from '../../services/api'
import type {
  TransactionRecord,
  TransactionStatus,
  TransactionType,
} from '../../types'

export const TransactionsLogView: React.FC = () => {
  const [transactions, setTransactions] = useState<TransactionRecord[]>([])
  const [total, setTotal] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(true)
  const [page, setPage] = useState<number>(1)
  const [pageSize] = useState<number>(15)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const fetchTransactions = async () => {
    setLoading(true)
    try {
      const res = await apiService.getTransactionLogs({
        page,
        page_size: pageSize,
        query: searchQuery.trim() || undefined,
        status: statusFilter || undefined,
        order_type: typeFilter || undefined,
      })
      setTransactions(res.items || [])
      setTotal(res.total || 0)
    } catch (err) {
      console.error('Failed to fetch transaction logs', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTransactions()
  }, [page, statusFilter, typeFilter])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchTransactions()
  }

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const getStatusBadge = (status: TransactionStatus) => {
    switch (status) {
      case 'SUCCESS':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            موفق
          </span>
        )
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            در انتظار
          </span>
        )
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            ناموفق
          </span>
        )
      case 'REFUNDED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
            مرجوع شده
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {status}
          </span>
        )
    }
  }

  const getTypeBadge = (type: TransactionType) => {
    switch (type) {
      case 'store_order':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400">
            <PackageCheck className="w-3.5 h-3.5" />
            سفارش اکانت
          </span>
        )
      case 'virtual_number':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <Radio className="w-3.5 h-3.5" />
            شماره مجازی
          </span>
        )
      case 'deposit':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400">
            <Wallet className="w-3.5 h-3.5" />
            شارژ کیف پول
          </span>
        )
      case 'refund':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-purple-600 dark:text-purple-400">
            <ArrowDownLeft className="w-3.5 h-3.5" />
            استرداد وجه
          </span>
        )
      default:
        return <span className="text-xs">{type}</span>
    }
  }

  const getPlatformLabel = (platform: string) => {
    switch (platform) {
      case 'balance':
        return 'کیف پول کاربر'
      case 'zarinpal':
        return 'زرین‌پال'
      case 'card_to_card':
        return 'کارت به کارت'
      case 'crypto':
        return 'ارز دیجیتال'
      default:
        return platform || 'پیش‌فرض'
    }
  }

  const formatDate = (isoString: string) => {
    if (!isoString) return '-'
    try {
      const d = new Date(isoString)
      return d.toLocaleDateString('fa-IR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return isoString
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className="space-y-6">
      {/* Header & Stats Banner */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <ReceiptText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>دفتر کل و لاگ تراکنش‌های مالی</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-normal">
                  {total.toLocaleString('fa-IR')} تراکنش
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                ثبت دائمی و تفکیک‌شده کلیه پرداخت‌ها، سفارش‌های آنی، کسر اعتبار و
                مرجوعی‌ها
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto">
          <button
            onClick={() => fetchTransactions()}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`}
            />
            <span>به‌روزرسانی</span>
          </button>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Form */}
          <form
            onSubmit={handleSearchSubmit}
            className="relative flex-1 max-w-md"
          >
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجو با شناسه تراکنش، موبایل، ایمیل، کد پیگیری..."
              className="w-full pr-9 pl-4 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </form>

          {/* Status & Type Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Type Filter */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
              <button
                onClick={() => {
                  setTypeFilter('')
                  setPage(1)
                }}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  typeFilter === ''
                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                همه اقلام
              </button>
              <button
                onClick={() => {
                  setTypeFilter('store_order')
                  setPage(1)
                }}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  typeFilter === 'store_order'
                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                اکانت
              </button>
              <button
                onClick={() => {
                  setTypeFilter('virtual_number')
                  setPage(1)
                }}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  typeFilter === 'virtual_number'
                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                شماره مجازی
              </button>
              <button
                onClick={() => {
                  setTypeFilter('refund')
                  setPage(1)
                }}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  typeFilter === 'refund'
                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                مرجوعی
              </button>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
              <button
                onClick={() => {
                  setStatusFilter('')
                  setPage(1)
                }}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  statusFilter === ''
                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                همه وضعیت‌ها
              </button>
              <button
                onClick={() => {
                  setStatusFilter('SUCCESS')
                  setPage(1)
                }}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  statusFilter === 'SUCCESS'
                    ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                موفق
              </button>
              <button
                onClick={() => {
                  setStatusFilter('REFUNDED')
                  setPage(1)
                }}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  statusFilter === 'REFUNDED'
                    ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                مرجوع
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="rounded-surface bg-card border border-border/80 shadow-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-center text-xs">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30 text-muted-foreground font-semibold select-none text-center">
                <th className="py-3 px-4 text-center">شناسه تراکنش</th>
                <th className="py-3 px-4 text-center">نوع عملیات</th>
                <th className="py-3 px-4 text-center">مشتری</th>
                <th className="py-3 px-4 text-center">مبلغ پرداختی</th>
                <th className="py-3 px-4 text-center">درگاه / شیوه</th>
                <th className="py-3 px-4 text-center">کد پیگیری</th>
                <th className="py-3 px-4 text-center">وضعیت</th>
                <th className="py-3 px-4 text-center">تاریخ و زمان</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {loading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="py-12 text-center text-muted-foreground"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin text-brand" />
                      <span>در حال فراخوانی دفتر کل تراکنش‌ها...</span>
                    </div>
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="py-12 text-center text-muted-foreground"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <ReceiptText className="w-8 h-8 opacity-40 text-muted-foreground" />
                      <span className="font-medium text-foreground">
                        هیچ تراکنشی با فیلترهای انتخابی یافت نشد
                      </span>
                      <p className="text-[11px] text-muted-foreground">
                        تراکنش‌های حاصل از ثبت سفارش‌ها یا شماره‌های مجازی در این
                        بخش نمایش داده می‌شوند.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="hover:bg-muted/40 transition-colors"
                  >
                    {/* Transaction Number */}
                    <td className="py-3.5 px-4 font-mono font-medium text-foreground text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <span className="truncate max-w-[140px] text-xs font-latin">
                          {tx.transaction_number}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            handleCopy(tx.transaction_number, tx.id)
                          }
                          className="p-1 rounded text-muted-foreground hover:text-brand hover:bg-muted transition-colors cursor-pointer"
                          title="کپی شناسه"
                        >
                          {copiedId === tx.id ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                      {tx.description && (
                        <div className="text-[10px] text-muted-foreground font-sans truncate max-w-[180px] mx-auto mt-0.5">
                          {tx.description}
                        </div>
                      )}
                    </td>

                    {/* Order Type */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex justify-center">
                        {getTypeBadge(tx.order_type)}
                      </div>
                    </td>

                    {/* Customer Info */}
                    <td className="py-3.5 px-4 text-center">
                      <div
                        className="font-mono text-xs text-foreground font-latin"
                        dir="ltr"
                      >
                        {tx.customer_phone || '-'}
                      </div>
                      {tx.customer_email && (
                        <div
                          className="text-[10px] text-muted-foreground truncate max-w-[140px] mx-auto font-latin"
                          dir="ltr"
                        >
                          {tx.customer_email}
                        </div>
                      )}
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 px-4 font-bold text-foreground text-center">
                      <div className="flex items-baseline justify-center gap-1 font-latin">
                        <span className="text-sm">
                          {tx.amount_toman.toLocaleString('fa-IR')}
                        </span>
                        <span className="text-[10px] font-normal text-muted-foreground font-sans">
                          تومان
                        </span>
                      </div>
                      {tx.amount_usd > 0 && (
                        <div className="text-[10px] font-mono text-muted-foreground font-latin">
                          ${tx.amount_usd.toFixed(2)}
                        </div>
                      )}
                    </td>

                    {/* Payment Platform */}
                    <td className="py-3.5 px-4 text-center text-muted-foreground">
                      <span className="px-2 py-0.5 rounded-control bg-secondary text-secondary-foreground border border-border/40 text-[11px] font-medium">
                        {getPlatformLabel(tx.payment_method)}
                      </span>
                    </td>

                    {/* Payment Ref ID */}
                    <td className="py-3.5 px-4 font-mono font-latin text-[11px] text-center text-muted-foreground">
                      {tx.payment_ref_id ? (
                        <span
                          className="truncate max-w-[120px] inline-block font-latin"
                          title={tx.payment_ref_id}
                        >
                          {tx.payment_ref_id}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex justify-center">
                        {getStatusBadge(tx.status)}
                      </div>
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 text-muted-foreground text-center text-[11px] whitespace-nowrap font-latin">
                      {formatDate(tx.created_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-border/60 bg-muted/20 flex items-center justify-between text-xs text-muted-foreground">
          <div>
            نمایش {transactions.length > 0 ? (page - 1) * pageSize + 1 : 0} تا{' '}
            {Math.min(page * pageSize, total)} از{' '}
            {total.toLocaleString('fa-IR')} تراکنش
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="px-3 py-1.5 rounded-control border border-border/60 bg-card disabled:opacity-40 disabled:cursor-not-allowed hover:bg-muted transition-colors cursor-pointer duration-motion active:scale-[0.98]"
            >
              صفحه قبل
            </button>
            <span className="px-2.5 py-1 font-semibold text-foreground">
              {page} از {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="px-3 py-1.5 rounded-control border border-border/60 bg-card disabled:opacity-40 disabled:cursor-not-allowed hover:bg-muted transition-colors cursor-pointer duration-motion active:scale-[0.98]"
            >
              صفحه بعد
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
