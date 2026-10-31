import {
  ArrowDownLeft,
  Check,
  CheckCircle2,
  Copy,
  Cpu,
  Edit2,
  Key,
  Loader2,
  Radio,
  ReceiptText,
  RefreshCw,
  Wallet,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { apiService } from '../../services/api'
import type {
  TransactionRecord,
  TransactionStatus,
  TransactionType,
} from '../../types'
import {
  formatNumber,
  formatToman,
  toPersianDigits,
} from '../../utils/formatters'
import { getGatewayDisplay } from '../../utils/paymentIcons'
import { LoadingState } from '../vibefarsi/LoadingState'
import { ModalCloseButton } from '../vibefarsi/ModalCloseButton'
import { useNotification } from '../vibefarsi/NotificationContext'
import { SearchInput } from '../vibefarsi/SearchInput'

interface TransactionsLogViewProps {
  hideHeader?: boolean
}

export const TransactionsLogView: React.FC<TransactionsLogViewProps> = ({
  hideHeader = false,
}) => {
  const { success: notifySuccess, error: notifyError } = useNotification()

  const [transactions, setTransactions] = useState<TransactionRecord[]>([])
  const [total, setTotal] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(true)
  const [page, setPage] = useState<number>(1)
  const [pageSize] = useState<number>(15)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const getBotDisplayName = (provider?: string) => {
    const key = (provider || '').toLowerCase().trim()
    switch (key) {
      case 'insightx':
      case 'third_party_api':
        return 'InsightX'
      case 'stackvault':
        return 'StackVault'
      case 'paglu':
      case 'lootpaglu':
        return 'LootPaglu'
      case 'jero':
      case 'jeroaccounts':
        return 'JeroAccounts'
      case 'supreme':
      case 'supremeleader':
        return 'SupremeLeader'
      default:
        return provider || ''
    }
  }

  // Transaction Status Changer Modal
  const [selectedTx, setSelectedTx] = useState<TransactionRecord | null>(null)
  const [newStatus, setNewStatus] = useState<string>('SUCCESS')
  const [updatingStatus, setUpdatingStatus] = useState<boolean>(false)

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
    } catch (err: any) {
      notifyError('خطا در بارگذاری تراکنش‌ها', err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTransactions()
  }, [page, statusFilter, typeFilter, searchQuery])

  useEffect(() => {
    const handleRefresh = () => fetchTransactions()
    window.addEventListener('anahix:transactions:refresh', handleRefresh)
    return () =>
      window.removeEventListener('anahix:transactions:refresh', handleRefresh)
  }, [page, statusFilter, typeFilter, searchQuery])

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    notifySuccess('کپی شد', text)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleUpdateStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTx) return

    setUpdatingStatus(true)
    try {
      await apiService.updateTransactionStatus(selectedTx.id, newStatus)
      notifySuccess(
        'تغییر وضعیت تراکنش',
        `وضعیت تراکنش به «${newStatus}» تغییر یافت.`,
      )
      setSelectedTx(null)
      fetchTransactions()
    } catch (err: any) {
      notifyError('خطا در به‌روزرسانی تراکنش', err.message)
    } finally {
      setUpdatingStatus(false)
    }
  }

  const getStatusBadge = (status: TransactionStatus) => {
    switch (status) {
      case 'SUCCESS':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-control text-[11px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            موفق
          </span>
        )
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-control text-[11px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            در انتظار
          </span>
        )
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-control text-[11px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            ناموفق
          </span>
        )
      case 'REFUNDED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-control text-[11px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
            مرجوع شده
          </span>
        )
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-control text-[11px] font-bold bg-muted text-muted-foreground border border-border/60">
            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
            لغو شده
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-control text-[11px] font-medium bg-muted text-muted-foreground">
            {status}
          </span>
        )
    }
  }

  const getTypeBadge = (type: TransactionType) => {
    switch (type) {
      case 'store_order':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-control text-xs font-bold bg-primary/10 text-primary border border-primary/20">
            <Cpu className="w-3.5 h-3.5 text-primary" />
            <span>سفارش اشتراک هوش مصنوعی</span>
          </span>
        )
      case 'virtual_number':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-control text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Radio className="w-3.5 h-3.5 text-emerald-400" />
            <span>خرید شماره مجازی (5SIM)</span>
          </span>
        )
      case 'deposit':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-control text-xs font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <Wallet className="w-3.5 h-3.5 text-amber-500" />
            <span>شارژ کیف پول کاربری</span>
          </span>
        )
      case 'refund':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-control text-xs font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <ArrowDownLeft className="w-3.5 h-3.5 text-purple-400" />
            <span>استرداد وجه به کیف پول</span>
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-control text-xs font-bold bg-secondary text-secondary-foreground border border-border/40">
            <Key className="w-3.5 h-3.5" />
            <span>سفارش خدمات دیجیتال</span>
          </span>
        )
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className="space-y-4" dir="rtl">
      {/* Header & Stats Banner (Omitted if embedded in parent tab) */}
      {!hideHeader && (
        <div className="p-5 rounded-surface bg-card border border-border/80 shadow-surface flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-control bg-secondary text-brand flex items-center justify-center font-bold text-lg border border-border/60 shrink-0">
              <ReceiptText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-foreground">
                  دفتر کل و لاگ تراکنش‌های مالی
                </h2>
                <span className="text-xs px-2.5 py-0.5 rounded-control bg-muted text-muted-foreground font-mono font-latin border border-border/60">
                  {toPersianDigits(total)} تراکنش
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                ثبت دائمی و تفکیک‌شده کلیه پرداخت‌ها، سفارش‌های آنی، کسر اعتبار و
                مرجوعی‌ها
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => fetchTransactions()}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-control text-xs font-bold bg-secondary hover:bg-muted text-foreground border border-border/60 transition shadow-control cursor-pointer"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`}
            />
            <span>به‌روزرسانی</span>
          </button>
        </div>
      )}

      {/* Filters & Search Toolbar - 100% Graphite */}
      <div className="bg-card rounded-surface border border-border/80 p-3.5 shadow-surface flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between text-xs">
        {/* Debounced Search */}
        <div className="w-full md:w-80">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="جستجو با شناسه تراکنش، موبایل، پیگیری..."
            debounceMs={300}
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Type Filter */}
          <div className="flex items-center gap-1 p-1 rounded-control bg-muted/30 border border-border/60 text-xs">
            <button
              type="button"
              onClick={() => {
                setTypeFilter('')
                setPage(1)
              }}
              className={`px-2.5 py-1 rounded-control font-bold transition-all cursor-pointer ${
                typeFilter === ''
                  ? 'bg-primary text-primary-foreground font-black shadow-control'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              همه اقلام
            </button>
            <button
              type="button"
              onClick={() => {
                setTypeFilter('store_order')
                setPage(1)
              }}
              className={`px-2.5 py-1 rounded-control font-bold transition-all cursor-pointer ${
                typeFilter === 'store_order'
                  ? 'bg-primary text-primary-foreground font-black shadow-control'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              سفارش اکانت
            </button>
            <button
              type="button"
              onClick={() => {
                setTypeFilter('virtual_number')
                setPage(1)
              }}
              className={`px-2.5 py-1 rounded-control font-bold transition-all cursor-pointer ${
                typeFilter === 'virtual_number'
                  ? 'bg-primary text-primary-foreground font-black shadow-control'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              شماره مجازی
            </button>
            <button
              type="button"
              onClick={() => {
                setTypeFilter('deposit')
                setPage(1)
              }}
              className={`px-2.5 py-1 rounded-control font-bold transition-all cursor-pointer ${
                typeFilter === 'deposit'
                  ? 'bg-primary text-primary-foreground font-black shadow-control'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              شارژ کیف پول
            </button>
            <button
              type="button"
              onClick={() => {
                setTypeFilter('refund')
                setPage(1)
              }}
              className={`px-2.5 py-1 rounded-control font-bold transition-all cursor-pointer ${
                typeFilter === 'refund'
                  ? 'bg-primary text-primary-foreground font-black shadow-control'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              مرجوعی
            </button>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 p-1 rounded-control bg-muted/30 border border-border/60 text-xs">
            <button
              type="button"
              onClick={() => {
                setStatusFilter('')
                setPage(1)
              }}
              className={`px-2.5 py-1 rounded-control font-bold transition-all cursor-pointer ${
                statusFilter === ''
                  ? 'bg-primary text-primary-foreground font-black shadow-control'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              همه
            </button>
            <button
              type="button"
              onClick={() => {
                setStatusFilter('SUCCESS')
                setPage(1)
              }}
              className={`px-2.5 py-1 rounded-control font-bold transition-all cursor-pointer ${
                statusFilter === 'SUCCESS'
                  ? 'bg-emerald-500 text-white font-black shadow-control'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              موفق
            </button>
            <button
              type="button"
              onClick={() => {
                setStatusFilter('PENDING')
                setPage(1)
              }}
              className={`px-2.5 py-1 rounded-control font-bold transition-all cursor-pointer ${
                statusFilter === 'PENDING'
                  ? 'bg-amber-500 text-white font-black shadow-control'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              در انتظار
            </button>
            <button
              type="button"
              onClick={() => {
                setStatusFilter('CANCELLED')
                setPage(1)
              }}
              className={`px-2.5 py-1 rounded-control font-bold transition-all cursor-pointer ${
                statusFilter === 'CANCELLED'
                  ? 'bg-muted text-foreground font-black shadow-control border border-border/60'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              لغو شده
            </button>
            <button
              type="button"
              onClick={() => {
                setStatusFilter('REFUNDED')
                setPage(1)
              }}
              className={`px-2.5 py-1 rounded-control font-bold transition-all cursor-pointer ${
                statusFilter === 'REFUNDED'
                  ? 'bg-purple-600 text-white font-black shadow-control'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              مرجوع
            </button>
            <button
              type="button"
              onClick={() => {
                setStatusFilter('FAILED')
                setPage(1)
              }}
              className={`px-2.5 py-1 rounded-control font-bold transition-all cursor-pointer ${
                statusFilter === 'FAILED'
                  ? 'bg-rose-600 text-white font-black shadow-control'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              ناموفق
            </button>
          </div>
        </div>
      </div>

      {/* Transactions Table: 100% Centered */}
      <div className="rounded-surface bg-card border border-border/80 shadow-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-center text-xs">
            <thead>
              <tr className="border-b border-border/60 bg-muted/40 text-muted-foreground font-bold select-none text-center">
                <th className="py-3.5 px-4 text-center whitespace-nowrap">
                  شناسه تراکنش
                </th>
                <th className="py-3.5 px-4 text-center whitespace-nowrap">
                  نوع عملیات و تامین‌کننده
                </th>
                <th className="py-3.5 px-4 text-center whitespace-nowrap">
                  مشتری
                </th>
                <th className="py-3.5 px-4 text-center whitespace-nowrap">
                  اطلاعات مالی و سود (تومان)
                </th>
                <th className="py-3.5 px-4 text-center whitespace-nowrap">
                  درگاه پرداخت
                </th>
                <th className="py-3.5 px-4 text-center whitespace-nowrap">
                  کد پیگیری بانکی
                </th>
                <th className="py-3.5 px-4 text-center whitespace-nowrap">
                  وضعیت
                </th>
                <th className="py-3.5 px-4 text-center whitespace-nowrap">
                  تاریخ و زمان
                </th>
                <th className="py-3.5 px-4 text-center whitespace-nowrap">
                  عملیات
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {loading ? (
                <tr>
                  <td
                    colSpan={9}
                    className="py-12 text-center text-muted-foreground"
                  >
                    <LoadingState message="در حال فراخوانی دفتر کل تراکنش‌ها..." />
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="py-12 text-center text-muted-foreground"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <ReceiptText className="w-8 h-8 opacity-40 text-muted-foreground" />
                      <span className="font-bold text-foreground">
                        هیچ تراکنشی با فیلترهای انتخابی یافت نشد
                      </span>
                      <p className="text-[11px] text-muted-foreground">
                        تراکنش‌های حاصل از ثبت سفارش‌ها یا شارژ کیف پول در این بخش
                        نمایش داده می‌شوند.
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
                    <td className="py-3.5 px-4 font-mono font-medium text-foreground text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5 font-latin">
                        <span
                          className="truncate max-w-[130px] text-xs font-bold font-latin"
                          title={tx.transaction_number}
                        >
                          {tx.transaction_number.length > 18
                            ? `${tx.transaction_number.slice(0, 16)}...`
                            : tx.transaction_number}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            handleCopy(tx.transaction_number, tx.id)
                          }
                          className="p-1 rounded text-muted-foreground hover:text-brand hover:bg-muted transition-colors cursor-pointer"
                          title="کپی شناسه کامل تراکنش"
                        >
                          {copiedId === tx.id ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                      {tx.description && (
                        <div
                          className="text-[10px] text-muted-foreground font-sans truncate max-w-[180px] mx-auto mt-0.5 cursor-help"
                          title={tx.description}
                        >
                          {tx.description}
                        </div>
                      )}
                    </td>

                    {/* Order Type & Fulfillment Provider */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <div className="flex flex-col items-center justify-center gap-1">
                        {getTypeBadge(tx.order_type)}
                        {tx.external_provider && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-control bg-primary/10 text-primary border border-primary/20 text-[9px] font-black font-latin">
                            🤖 {getBotDisplayName(tx.external_provider)}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Customer Info */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
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

                    {/* Financial Stacked Column: Sale, Cost & Profit/Loss */}
                    <td className="py-3.5 px-4 text-center font-latin whitespace-nowrap">
                      <div className="font-bold text-xs text-foreground">
                        فروش: {formatToman(tx.amount_toman)} تومان
                      </div>
                      {tx.order_type === 'deposit' ||
                      tx.order_type === 'refund' ? (
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          گردش داخلی کیف پول
                        </div>
                      ) : (
                        (() => {
                          const costToman = Math.round(tx.amount_toman * 0.75)
                          const profitToman = tx.amount_toman - costToman
                          return (
                            <>
                              <div className="text-[10px] text-muted-foreground mt-0.5">
                                خرید: {formatToman(costToman)} تومان
                              </div>
                              <div className="text-[10px] font-bold mt-0.5">
                                {profitToman >= 0 ? (
                                  <span className="text-emerald-400">
                                    سود: +{formatToman(profitToman)} تومان
                                  </span>
                                ) : (
                                  <span className="text-rose-500">
                                    ضرر: -{formatToman(Math.abs(profitToman))}{' '}
                                    تومان
                                  </span>
                                )}
                              </div>
                            </>
                          )
                        })()
                      )}
                    </td>

                    {/* Payment Platform with Gateway Icon & Badge */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {(() => {
                        const plat = tx.payment_platform || tx.payment_method
                        const gw = getGatewayDisplay(plat)
                        return (
                          <div
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-control text-xs font-bold border shadow-xs ${gw.badgeClass}`}
                          >
                            {gw.icon}
                            <span>{gw.label}</span>
                          </div>
                        )
                      })()}
                    </td>

                    {/* Payment Ref ID */}
                    <td className="py-3.5 px-4 font-mono font-latin text-[11px] text-center text-muted-foreground whitespace-nowrap">
                      {tx.payment_ref_id ? (
                        <div className="flex items-center justify-center gap-1 font-latin">
                          <span
                            className="truncate max-w-[120px] font-bold"
                            title={tx.payment_ref_id}
                          >
                            {tx.payment_ref_id.length > 16
                              ? `${tx.payment_ref_id.slice(0, 14)}...`
                              : tx.payment_ref_id}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              handleCopy(tx.payment_ref_id, `ref-${tx.id}`)
                            }
                            className="p-1 rounded text-muted-foreground hover:text-brand hover:bg-muted transition-colors cursor-pointer"
                            title="کپی کد پیگیری بانکی"
                          >
                            {copiedId === `ref-${tx.id}` ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <div className="flex justify-center">
                        {getStatusBadge(tx.status)}
                      </div>
                    </td>

                    {/* Date & Time Vertically Stacked (Date on top, Time below) */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap font-latin">
                      <div className="text-xs font-bold text-foreground">
                        {new Date(tx.created_at).toLocaleDateString('fa-IR')}
                      </div>
                      <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                        {new Date(tx.created_at).toLocaleTimeString('fa-IR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </td>

                    {/* Actions: Status Changer */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTx(tx)
                          setNewStatus(tx.status)
                        }}
                        className="p-1.5 rounded-control border border-border/60 bg-secondary hover:bg-muted text-foreground transition cursor-pointer shadow-control"
                        title="تغییر وضعیت تراکنش"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-brand" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-border/60 bg-muted/20 flex items-center justify-between text-xs text-muted-foreground">
          <div className="font-sans">
            نمایش{' '}
            {toPersianDigits(
              transactions.length > 0 ? (page - 1) * pageSize + 1 : 0,
            )}{' '}
            تا {toPersianDigits(Math.min(page * pageSize, total))} از{' '}
            {formatNumber(total)} تراکنش
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="px-3 py-1.5 rounded-control border border-border/60 bg-card disabled:opacity-40 disabled:cursor-not-allowed hover:bg-muted transition-colors cursor-pointer duration-motion active:scale-[0.98] font-bold"
            >
              صفحه قبل
            </button>
            <span className="px-2.5 py-1 font-semibold text-foreground font-latin">
              {toPersianDigits(page)} از {toPersianDigits(totalPages)}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="px-3 py-1.5 rounded-control border border-border/60 bg-card disabled:opacity-40 disabled:cursor-not-allowed hover:bg-muted transition-colors cursor-pointer duration-motion active:scale-[0.98] font-bold"
            >
              صفحه بعد
            </button>
          </div>
        </div>
      </div>

      {/* Transaction Status Changer Modal */}
      {selectedTx &&
        createPortal(
          <div
            className="fixed inset-0 overflow-y-auto bg-black/80 backdrop-blur-md p-3 sm:p-6 animate-in fade-in z-[99999]"
            dir="rtl"
          >
            <div className="min-h-full w-full flex items-center justify-center">
              <div className="relative w-full max-w-md my-auto overflow-hidden rounded-surface border border-border/80 bg-card p-6 shadow-overlay text-foreground animate-in zoom-in-95 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-border/60">
                  <h3 className="text-sm font-black text-foreground flex items-center gap-2">
                    <ReceiptText className="w-4 h-4 text-brand" />
                    <span>تغییر وضعیت تراکنش مالی</span>
                  </h3>
                  <ModalCloseButton
                    onClick={() => setSelectedTx(null)}
                    size="sm"
                  />
                </div>

                <form
                  onSubmit={handleUpdateStatusSubmit}
                  className="space-y-4 text-xs"
                >
                  <div className="p-3 rounded-control bg-muted/20 border border-border/40 space-y-1 text-right">
                    <div className="text-muted-foreground text-[11px]">
                      شناسه تراکنش:
                    </div>
                    <div className="font-mono font-bold text-foreground text-xs font-latin">
                      {selectedTx.transaction_number}
                    </div>
                    <div className="text-muted-foreground text-[11px] pt-1">
                      مبلغ:{' '}
                      <span className="font-bold text-brand">
                        {formatToman(selectedTx.amount_toman)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-right">
                    <label className="font-bold text-foreground block">
                      وضعیت جدید تراکنش:
                    </label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="w-full h-10 px-3 rounded-field border border-border/60 bg-muted/20 text-foreground font-bold outline-none focus:border-brand cursor-pointer text-xs"
                    >
                      <option value="SUCCESS">🟢 موفق (SUCCESS)</option>
                      <option value="PENDING">
                        🟡 در انتظار پرداخت (PENDING)
                      </option>
                      <option value="CANCELLED">⚪ لغو شده (CANCELLED)</option>
                      <option value="REFUNDED">🟣 مرجوع شده (REFUNDED)</option>
                      <option value="FAILED">🔴 ناموفق (FAILED)</option>
                    </select>
                    <p className="text-[10px] text-muted-foreground">
                      در صورت اتصال این تراکنش به یک سفارش فروشگاهی، وضعیت سفارش
                      نیز به صورت هماهنگ همگام‌سازی خواهد شد.
                    </p>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={updatingStatus}
                      className="w-full h-10 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs shadow-control flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 duration-motion active:scale-[0.98]"
                    >
                      {updatingStatus ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                      <span>ثبت و همگام‌سازی وضعیت</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  )
}
