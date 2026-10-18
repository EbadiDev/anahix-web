import {
  Activity,
  CheckCircle,
  Eye,
  FileCode,
  Globe,
  History,
  Key,
  Layers,
  Package,
  Radio,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  X,
  Zap,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { apiService } from '../../services/api'
import type { AdminActionLogRecord } from '../../types'

export const AdminActionLogView: React.FC = () => {
  const [logs, setLogs] = useState<AdminActionLogRecord[]>([])
  const [total, setTotal] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(true)
  const [page, setPage] = useState<number>(1)
  const [pageSize] = useState<number>(15)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [resourceFilter, setResourceFilter] = useState<string>('')
  const [selectedLog, setSelectedLog] = useState<AdminActionLogRecord | null>(
    null,
  )

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const res = await apiService.getAdminActionLogs({
        page,
        page_size: pageSize,
        query: searchQuery.trim() || undefined,
        resource: resourceFilter || undefined,
      })
      setLogs(res.items || [])
      setTotal(res.total || 0)
    } catch (err) {
      console.error('Failed to fetch admin action logs', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [page, resourceFilter])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchLogs()
  }

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'AUTH_LOGIN':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <ShieldCheck className="w-3 h-3" />
            ورود موفق
          </span>
        )
      case 'AUTH_LOGIN_FAILED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
            <ShieldAlert className="w-3 h-3" />
            ورود ناموفق
          </span>
        )
      case 'UPDATE_DELIVERY_SETTINGS':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <Zap className="w-3 h-3" />
            تنظیم تحویل آنی
          </span>
        )
      case 'UPDATE_GROUP_STRATEGY':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
            <Activity className="w-3 h-3" />
            استراتژی گروه
          </span>
        )
      case 'LINK_PRODUCT_PROVIDER':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            <Zap className="w-3 h-3" />
            اتصال به انبار آنی
          </span>
        )
      case 'UPDATE_VN_SETTINGS':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
            <Radio className="w-3 h-3" />
            تنظیم شماره مجازی
          </span>
        )
      case 'OPERATOR_COMPLETE_ORDER':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle className="w-3 h-3" />
            تکمیل سفارش Mode C
          </span>
        )
      case 'OPERATOR_2FA_REQUEST':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Key className="w-3 h-3" />
            درخواست کد ۲FA
          </span>
        )
      case 'CREATE_PRODUCT':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
            <Package className="w-3 h-3" />
            تعریف محصول
          </span>
        )
      case 'BULK_IMPORT':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
            <Layers className="w-3 h-3" />
            ورود انبوه اکانت
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {action}
          </span>
        )
    }
  }

  const getResourceLabel = (res: string) => {
    switch (res) {
      case 'auth':
        return 'امنیت و نشست'
      case 'delivery_engine':
        return 'موتور تحویل آنی'
      case 'virtual_numbers':
        return 'شماره مجازی'
      case 'order':
        return 'صف سفارشات'
      case 'product':
        return 'کاتالوگ و انبار'
      case 'system':
        return 'پیکربندی سیستم'
      default:
        return res
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
        second: '2-digit',
      })
    } catch {
      return isoString
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>لاگ حسابرسی و فعالیت مدیران (Audit Log)</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-normal">
                  {total.toLocaleString('fa-IR')} رویداد ثبت شده
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                ثبت تاریخچه کامل و غیرقابل تغییر ورودها، تغییرات نرخ، سوئیچ
                استراتژی‌های تحویل و اقدامات اپراتورها
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto">
          <button
            onClick={() => fetchLogs()}
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

      {/* Filters Toolbar */}
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
              placeholder="جستجو در نام مدیر، شرح عملیات، IP..."
              className="w-full pr-9 pl-4 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </form>

          {/* Resource Filter Pills */}
          <div className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
            <button
              onClick={() => {
                setResourceFilter('')
                setPage(1)
              }}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                resourceFilter === ''
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              همه بخش‌ها
            </button>
            <button
              onClick={() => {
                setResourceFilter('auth')
                setPage(1)
              }}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                resourceFilter === 'auth'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              نشست و ورود
            </button>
            <button
              onClick={() => {
                setResourceFilter('delivery_engine')
                setPage(1)
              }}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                resourceFilter === 'delivery_engine'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              تحویل آنی
            </button>
            <button
              onClick={() => {
                setResourceFilter('virtual_numbers')
                setPage(1)
              }}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                resourceFilter === 'virtual_numbers'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              شماره مجازی
            </button>
            <button
              onClick={() => {
                setResourceFilter('order')
                setPage(1)
              }}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                resourceFilter === 'order'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              سفارشات
            </button>
            <button
              onClick={() => {
                setResourceFilter('product')
                setPage(1)
              }}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                resourceFilter === 'product'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              محصولات
            </button>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 text-slate-500 dark:text-slate-400 font-semibold">
                <th className="py-3 px-4">کاربر مجری</th>
                <th className="py-3 px-4">نوع عملیات</th>
                <th className="py-3 px-4">بخش مربوطه</th>
                <th className="py-3 px-4">شرح دقیق اقدام</th>
                <th className="py-3 px-4">آدرس IP</th>
                <th className="py-3 px-4">زمان ثبت</th>
                <th className="py-3 px-4 text-center">جزئیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-12 text-center text-slate-400 dark:text-slate-500"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
                      <span>در حال دریافت رویدادهای سیستمی...</span>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-12 text-center text-slate-400 dark:text-slate-500"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Shield className="w-8 h-8 opacity-40 text-slate-400" />
                      <span className="font-medium text-slate-600 dark:text-slate-400">
                        هیچ رویدادی با فیلترهای انتخابی یافت نشد
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {/* Admin User */}
                    <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">
                          <UserCheck className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="font-bold text-xs">
                            @{log.admin_username}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4">
                      {getActionBadge(log.action)}
                    </td>

                    {/* Resource */}
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-medium">
                        {getResourceLabel(log.resource)}
                      </span>
                    </td>

                    {/* Description */}
                    <td className="py-3.5 px-4 text-slate-800 dark:text-slate-200 max-w-xs">
                      <div className="line-clamp-2 leading-relaxed font-medium">
                        {log.description}
                      </div>
                      {log.resource_id && (
                        <div className="text-[10px] font-mono text-slate-400 mt-0.5 truncate">
                          شناسه: {log.resource_id}
                        </div>
                      )}
                    </td>

                    {/* IP Address */}
                    <td
                      className="py-3.5 px-4 font-mono text-[11px] text-slate-500"
                      dir="ltr"
                    >
                      <div className="flex items-center gap-1 justify-end">
                        <Globe className="w-3 h-3 text-slate-400" />
                        <span>{log.ip_address || '::1'}</span>
                      </div>
                    </td>

                    {/* Timestamp */}
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 text-[11px] whitespace-nowrap">
                      {formatDate(log.created_at)}
                    </td>

                    {/* Details Button */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="مشاهده جزئیات داده‌ها"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-between text-xs text-slate-500">
          <div>
            نمایش {logs.length > 0 ? (page - 1) * pageSize + 1 : 0} تا{' '}
            {Math.min(page * pageSize, total)} از{' '}
            {total.toLocaleString('fa-IR')} لاگ
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              صفحه قبل
            </button>
            <span className="px-2.5 py-1 font-semibold text-slate-700 dark:text-slate-300">
              {page} از {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              صفحه بعد
            </button>
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {selectedLog &&
        createPortal(
          <div
            className="fixed inset-0 overflow-y-auto bg-black/80 backdrop-blur-md p-3 sm:p-6 animate-in fade-in duration-150"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100vw',
              height: '100vh',
              zIndex: 2147483600,
            }}
            dir="rtl"
          >
            <div className="min-h-full w-full flex items-start sm:items-center justify-center">
              <div className="w-full max-w-xl my-auto rounded-surface bg-card border border-border/80 shadow-overlay overflow-hidden animate-in zoom-in-95 duration-150 text-foreground">
                <div className="p-5 border-b border-border/60 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileCode className="w-5 h-5 text-brand" />
                    <h3 className="font-black text-sm text-foreground">
                      جزئیات رویداد سیستمی
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedLog(null)}
                    className="p-1 rounded-control text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-5 space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-3 p-3 rounded-control bg-muted/20 border border-border/60">
                    <div>
                      <span className="text-muted-foreground">
                        مدیر اقدام‌کننده:
                      </span>
                      <div className="font-bold mt-0.5 text-foreground font-latin">
                        @{selectedLog.admin_username}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">رویداد:</span>
                      <div className="mt-0.5">
                        {getActionBadge(selectedLog.action)}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">آدرس IP:</span>
                      <div
                        className="font-mono mt-0.5 text-foreground font-latin"
                        dir="ltr"
                      >
                        {selectedLog.ip_address}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">زمان ثبت:</span>
                      <div className="mt-0.5 text-foreground">
                        {formatDate(selectedLog.created_at)}
                      </div>
                    </div>
                  </div>

                  <div>
                    <span className="text-muted-foreground block mb-1">
                      شرح عملیات:
                    </span>
                    <p className="p-3 rounded-control bg-muted/20 border border-border/60 leading-relaxed font-medium text-foreground">
                      {selectedLog.description}
                    </p>
                  </div>

                  {selectedLog.user_agent && (
                    <div>
                      <span className="text-muted-foreground block mb-1">
                        دستگاه / مرورگر:
                      </span>
                      <p
                        className="p-2.5 rounded-control bg-muted/20 border border-border/60 font-mono text-[10px] text-muted-foreground break-all"
                        dir="ltr"
                      >
                        {selectedLog.user_agent}
                      </p>
                    </div>
                  )}

                  <div>
                    <span className="text-muted-foreground block mb-1">
                      داده‌های ساختاریافته (Payload Details):
                    </span>
                    <pre
                      className="p-3 rounded-control bg-muted/30 border border-border/60 text-foreground font-mono text-[11px] overflow-x-auto max-h-48 scrollbar-thin font-latin"
                      dir="ltr"
                    >
                      {(() => {
                        try {
                          return JSON.stringify(
                            JSON.parse(selectedLog.details || '{}'),
                            null,
                            2,
                          )
                        } catch {
                          return selectedLog.details || '{}'
                        }
                      })()}
                    </pre>
                  </div>
                </div>

                <div className="p-4 border-t border-border/60 bg-muted/10 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setSelectedLog(null)}
                    className="h-9 px-5 rounded-control text-xs font-black bg-primary hover:bg-primary-hover text-primary-foreground transition-all duration-motion active:scale-[0.98] shadow-control cursor-pointer"
                  >
                    بستن پنجره
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  )
}
