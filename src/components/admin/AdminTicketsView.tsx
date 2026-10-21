import {
  AlertCircle,
  Check,
  Copy,
  Download,
  Eye,
  FileText,
  Image as ImageIcon,
  LifeBuoy,
  Lock,
  Mail,
  MessageSquare,
  Paperclip,
  Phone,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  Trash2,
  User,
  X,
} from 'lucide-react'
import type React from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { apiService } from '../../services/api'
import type {
  AdminTicketStats,
  TicketAttachment,
  TicketDetailResponse,
  TicketItem,
  TicketPriorityType,
  TicketStatusType,
} from '../../types'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { useNotification } from '../vibefarsi/NotificationContext'
import { SearchInput } from '../vibefarsi/SearchInput'

interface AdminTicketsViewProps {
  adminUser?: any
  onUpdatePendingCount?: (count: number) => void
}

const DEPARTMENTS = [
  { id: 'all', label: 'همه دپارتمان‌ها' },
  { id: 'ai_accounts', label: 'اکانت‌های هوش مصنوعی (ChatGPT, Claude, Gemini)' },
  {
    id: 'license_support',
    label: 'لایسنس و خطای فعال‌سازی اکانت شخصی (Mode C)',
  },
  { id: 'virtual_numbers', label: 'شماره‌های مجازی و دریافت پیامک (5SIM)' },
  { id: 'billing', label: 'امور مالی، شارژ کیف پول و تراکنش‌ها' },
  { id: 'general', label: 'مشاوره خرید، سوالات عمومی و پیگیری' },
]

const PRIORITIES: { id: string; label: string; color: string }[] = [
  { id: 'all', label: 'همه اولویت‌ها', color: 'bg-slate-400' },
  { id: 'low', label: 'کم', color: 'bg-slate-400' },
  { id: 'medium', label: 'متوسط', color: 'bg-blue-500' },
  { id: 'high', label: 'زیاد', color: 'bg-amber-500' },
  { id: 'urgent', label: 'بحرانی / فوری', color: 'bg-rose-500' },
]

const CANNED_REPLIES = [
  'کد لایسنس بررسی شد و مجددا فعال گردید. لطفاً مجدداً لاگین فرمایید.',
  'لطفاً کش مرورگر را پاک نموده یا در پنجره ناشناس (Incognito) اقدام به لاگین نمایید.',
  'زمان شماره مجازی به پایان رسیده بود و هزینه آن به طور کامل به موجودی کیف پول شما برگشت داده شد.',
  'لطفاً اسکرین‌شات از خطای ظاهر شده در صفحه را برای بررسی فنی ارسال فرمایید.',
  'درخواست شما به کارشناس فنی ارجاع شد و تا دقایقی دیگر فعال‌سازی نهایی خواهد شد.',
]

export const AdminTicketsView: React.FC<AdminTicketsViewProps> = ({
  adminUser: _adminUser,
  onUpdatePendingCount,
}) => {
  const { success: notifySuccess, error: notifyError } = useNotification()
  const [tickets, setTickets] = useState<TicketItem[]>([])
  const [stats, setStats] = useState<AdminTicketStats>({
    total: 0,
    awaiting_admin: 0,
    awaiting_user: 0,
    in_progress: 0,
    resolved: 0,
    closed: 0,
  })
  const [loading, setLoading] = useState<boolean>(true)
  const [refreshing, setRefreshing] = useState<boolean>(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState<string>('awaiting_admin')
  const [departmentFilter, setDepartmentFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Active Ticket Detail & Workbench
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null)
  const [ticketDetail, setTicketDetail] = useState<TicketDetailResponse | null>(
    null,
  )
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false)

  // Reply Form State
  const [replyText, setReplyText] = useState('')
  const [isInternalNote, setIsInternalNote] = useState(false)
  const [targetStatus, setTargetStatus] =
    useState<TicketStatusType>('awaiting_user')
  const [notifySMS, setNotifySMS] = useState(true)
  const [notifyEmail, setNotifyEmail] = useState(true)
  const [replyAttachments, setReplyAttachments] = useState<TicketAttachment[]>(
    [],
  )
  const [isUploadingAtt, setIsUploadingAtt] = useState(false)
  const [sendingReply, setSendingReply] = useState(false)

  // Quick Action Loading
  const [_actionLoading, setActionLoading] = useState<Record<string, boolean>>(
    {},
  )

  // Lightbox Zoom
  const [zoomImage, setZoomImage] = useState<string | null>(null)
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Load tickets list
  const fetchTickets = useCallback(
    async (quiet = false) => {
      if (!quiet) setLoading(true)
      else setRefreshing(true)
      setErrorMsg(null)

      try {
        const res = await apiService.getAdminTickets({
          status: statusFilter === 'all' ? undefined : statusFilter,
          department: departmentFilter === 'all' ? undefined : departmentFilter,
          priority: priorityFilter === 'all' ? undefined : priorityFilter,
          search: searchQuery.trim() || undefined,
          page: 1,
          page_size: 50,
        })

        setTickets(res.items || [])
        setStats(res.stats)
        if (onUpdatePendingCount) {
          onUpdatePendingCount(res.stats.awaiting_admin)
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'خطا در بارگذاری تیکت‌های پشتیبانی')
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [
      statusFilter,
      departmentFilter,
      priorityFilter,
      searchQuery,
      onUpdatePendingCount,
    ],
  )

  useEffect(() => {
    fetchTickets()
  }, [fetchTickets])

  // Polling every 15 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      fetchTickets(true)
    }, 15000)
    return () => clearInterval(timer)
  }, [fetchTickets])

  // Load active ticket detail
  const fetchTicketDetail = useCallback(
    async (ticketId: string, quiet = false) => {
      if (!quiet) setLoadingDetail(true)
      try {
        const detail = await apiService.getAdminTicketDetail(ticketId)
        setTicketDetail(detail)
        if (detail.ticket.status === 'awaiting_admin') {
          setTargetStatus('awaiting_user')
        } else {
          setTargetStatus(detail.ticket.status)
        }
      } catch (err: any) {
        console.error('Error fetching admin ticket detail:', err)
      } finally {
        if (!quiet) setLoadingDetail(false)
      }
    },
    [],
  )

  useEffect(() => {
    if (activeTicketId) {
      fetchTicketDetail(activeTicketId)
      const interval = setInterval(() => {
        fetchTicketDetail(activeTicketId, true)
      }, 10000)
      return () => clearInterval(interval)
    }
    setTicketDetail(null)
  }, [activeTicketId, fetchTicketDetail])

  useEffect(() => {
    if (ticketDetail) {
      scrollToBottom()
    }
  }, [ticketDetail?.messages.length])

  // File Upload Helper
  const handleUploadFile = async (file: File) => {
    if (!file) return
    setIsUploadingAtt(true)
    try {
      const att = await apiService.uploadAdminTicketAttachment(file)
      setReplyAttachments((prev) => [...prev, att])
      notifySuccess('آپلود موفق', 'فایل پیوست با موفقیت بارگذاری شد.')
    } catch (err: any) {
      notifyError('خطا در آپلود فایل', err.message)
    } finally {
      setIsUploadingAtt(false)
    }
  }

  // Handle Clipboard Paste for Screenshots
  const handlePasteImage = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items
    if (!items) return

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile()
        if (file) {
          e.preventDefault()
          handleUploadFile(file)
          break
        }
      }
    }
  }

  // Send Admin Reply
  const handleSendReply = async () => {
    if ((!replyText.trim() && replyAttachments.length === 0) || !activeTicketId)
      return

    setSendingReply(true)
    try {
      await apiService.adminReplyTicket(activeTicketId, {
        message: replyText.trim() || 'ارسال فایل پیوست',
        is_internal: isInternalNote,
        attachments: replyAttachments,
        status: isInternalNote ? undefined : targetStatus,
        notify_sms: isInternalNote ? false : notifySMS,
        notify_email: isInternalNote ? false : notifyEmail,
      })

      setReplyText('')
      setReplyAttachments([])
      notifySuccess('ارسال پاسخ', 'پاسخ شما با موفقیت ارسال شد.')
      await fetchTicketDetail(activeTicketId, true)
      await fetchTickets(true)
    } catch (err: any) {
      notifyError('خطا در ارسال پاسخ', err.message)
    } finally {
      setSendingReply(false)
    }
  }

  // Quick Status Update
  const handleUpdateStatus = async (
    ticketId: string,
    newStatus: TicketStatusType,
  ) => {
    setActionLoading((prev) => ({ ...prev, [ticketId]: true }))
    try {
      await apiService.adminUpdateTicket(ticketId, {
        status: newStatus,
        notify_sms: notifySMS,
      })
      notifySuccess('تغییر وضعیت تیکت', 'وضعیت تیکت با موفقیت به‌روزرسانی شد.')
      if (activeTicketId === ticketId) {
        await fetchTicketDetail(ticketId, true)
      }
      await fetchTickets(true)
    } catch (err: any) {
      notifyError('خطا در تغییر وضعیت تیکت', err.message)
    } finally {
      setActionLoading((prev) => ({ ...prev, [ticketId]: false }))
    }
  }

  // Quick Priority Update
  const handleUpdatePriority = async (
    ticketId: string,
    newPriority: TicketPriorityType,
  ) => {
    setActionLoading((prev) => ({ ...prev, [ticketId]: true }))
    try {
      await apiService.adminUpdateTicket(ticketId, {
        priority: newPriority,
      })
      notifySuccess('تغییر اولویت تیکت', 'اولویت تیکت با موفقیت به‌روزرسانی شد.')
      if (activeTicketId === ticketId) {
        await fetchTicketDetail(ticketId, true)
      }
      await fetchTickets(true)
    } catch (err: any) {
      notifyError('خطا در تغییر اولویت', err.message)
    } finally {
      setActionLoading((prev) => ({ ...prev, [ticketId]: false }))
    }
  }

  // Delete Ticket
  const handleDeleteTicket = async (ticketId: string, tNum: string) => {
    if (!confirm(`آیا از حذف تیکت #${tNum} اطمینان دارید؟`)) return

    try {
      await apiService.adminDeleteTicket(ticketId)
      notifySuccess('حذف تیکت', `تیکت #${tNum} با موفقیت حذف شد.`)
      if (activeTicketId === ticketId) {
        setActiveTicketId(null)
      }
      await fetchTickets(true)
    } catch (err: any) {
      notifyError('خطا در حذف تیکت', err.message)
    }
  }

  // Copy helper
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedOrderId(id)
    setTimeout(() => setCopiedOrderId(null), 2000)
  }

  const formatPersianDate = (dateStr?: string) => {
    if (!dateStr) return '—'
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString('fa-IR', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return dateStr
    }
  }

  const getStatusBadge = (status: TicketStatusType) => {
    switch (status) {
      case 'awaiting_admin':
        return (
          <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30 text-[11px] font-bold animate-pulse">
            در انتظار پاسخ ادمین
          </Badge>
        )
      case 'awaiting_user':
        return (
          <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/30 text-[11px] font-bold">
            در انتظار پاسخ کاربر
          </Badge>
        )
      case 'in_progress':
        return (
          <Badge className="bg-purple-500/15 text-purple-700 dark:text-purple-400 border border-purple-500/30 text-[11px] font-bold">
            در حال بررسی فنی
          </Badge>
        )
      case 'resolved':
        return (
          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-[11px] font-bold">
            حل شده / پاسخ داده شده
          </Badge>
        )
      case 'closed':
        return (
          <Badge className="bg-slate-500/15 text-slate-700 dark:text-slate-400 border border-slate-500/30 text-[11px] font-medium">
            بسته شده
          </Badge>
        )
    }
  }

  const getPriorityBadge = (p: TicketPriorityType) => {
    switch (p) {
      case 'urgent':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-black text-rose-600 bg-rose-50 dark:bg-rose-950 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-800">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping" />
            فوری / بحرانی
          </span>
        )
      case 'high':
        return (
          <span className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
            زیاد
          </span>
        )
      case 'medium':
        return (
          <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
            متوسط
          </span>
        )
      case 'low':
        return (
          <span className="text-[10px] font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
            کم
          </span>
        )
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300" dir="rtl">
      {/* 1. Header Banner */}
      <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
              <LifeBuoy className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                میزکار هوشمند تیکت‌ها و پشتیبانی (Operator Desk)
                {stats.awaiting_admin > 0 && (
                  <span className="px-2.5 py-0.5 text-xs font-black rounded-full bg-rose-500 text-white animate-pulse">
                    {stats.awaiting_admin} تیکت جدید
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                پاسخگویی بلادرنگ • ارسال خودکار پیامک SMS.ir به کاربر • یادداشت
                محرمانه اپراتور • اتصال به لایسنس و سفارش‌ها
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch lg:self-auto">
          <Button
            onClick={() => fetchTickets()}
            variant="outline"
            disabled={refreshing}
            className="h-10 px-4 rounded-xl border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-blue-600 text-xs font-bold flex items-center gap-2"
          >
            <RefreshCw
              className={`w-4 h-4 ${refreshing ? 'animate-spin text-blue-600' : ''}`}
            />
            تازه‌سازی لیست
          </Button>
        </div>
      </div>

      {/* 2. Statistical KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div
          onClick={() => setStatusFilter('all')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'all'
              ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 shadow-xs'
              : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
          }`}
        >
          <div className="text-[11px] font-bold text-slate-500">کل تیکت‌ها</div>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
            {stats.total}
          </div>
        </div>

        <div
          onClick={() => setStatusFilter('awaiting_admin')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'awaiting_admin'
              ? 'border-rose-500 bg-rose-50/60 dark:bg-rose-950/30 shadow-xs'
              : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
          }`}
        >
          <div className="text-[11px] font-bold text-rose-600 dark:text-rose-400 flex items-center justify-between">
            <span>در انتظار ادمین</span>
            {stats.awaiting_admin > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            )}
          </div>
          <div className="text-xl font-black text-rose-600 dark:text-rose-400 mt-1">
            {stats.awaiting_admin}
          </div>
        </div>

        <div
          onClick={() => setStatusFilter('awaiting_user')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'awaiting_user'
              ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 shadow-xs'
              : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
          }`}
        >
          <div className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
            در انتظار کاربر
          </div>
          <div className="text-xl font-black text-blue-600 dark:text-blue-400 mt-1">
            {stats.awaiting_user}
          </div>
        </div>

        <div
          onClick={() => setStatusFilter('in_progress')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'in_progress'
              ? 'border-purple-500 bg-purple-50/50 dark:bg-purple-950/20 shadow-xs'
              : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
          }`}
        >
          <div className="text-[11px] font-bold text-purple-600 dark:text-purple-400">
            در حال بررسی
          </div>
          <div className="text-xl font-black text-purple-600 dark:text-purple-400 mt-1">
            {stats.in_progress}
          </div>
        </div>

        <div
          onClick={() => setStatusFilter('resolved')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'resolved'
              ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-xs'
              : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
          }`}
        >
          <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
            حل شده
          </div>
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {stats.resolved}
          </div>
        </div>

        <div
          onClick={() => setStatusFilter('closed')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'closed'
              ? 'border-slate-400 bg-slate-100 dark:bg-slate-800 shadow-xs'
              : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
          }`}
        >
          <div className="text-[11px] font-bold text-slate-500">بسته شده</div>
          <div className="text-xl font-black text-slate-700 dark:text-slate-300 mt-1">
            {stats.closed}
          </div>
        </div>
      </div>

      {/* 3. Filters & Search Bar */}
      <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col md:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="flex-1 w-full md:w-auto">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="جستجو در شماره تیکت، شماره موبایل خریدار، موضوع، سفارش..."
            debounceMs={350}
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap sm:flex-nowrap">
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 text-xs flex-1 sm:flex-none"
          >
            {DEPARTMENTS.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label}
              </option>
            ))}
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 text-xs flex-1 sm:flex-none"
          >
            {PRIORITIES.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 4. Tickets Table & Listing */}
      {loading ? (
        <div className="p-16 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">
            در حال واکشی اطلاعات تیکت‌ها از سرور...
          </p>
        </div>
      ) : errorMsg ? (
        <div className="p-8 rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/20 text-center space-y-2">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
          <p className="text-xs text-rose-600 font-bold">{errorMsg}</p>
          <Button
            onClick={() => fetchTickets()}
            size="sm"
            variant="outline"
            className="text-xs rounded-xl"
          >
            تلاش مجدد
          </Button>
        </div>
      ) : tickets.length === 0 ? (
        <div className="p-16 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center space-y-2">
          <MessageSquare className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
            تیکتی با فیلترهای انتخابی یافت نشد
          </h4>
          <p className="text-xs text-slate-400">
            تمامی تیکت‌های این بخش پاسخ داده شده‌اند یا موردی ثبت نشده است.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">شناسه و اولویت</th>
                  <th className="py-3.5 px-4">موضوع و دپارتمان</th>
                  <th className="py-3.5 px-4">کاربر / مشتری</th>
                  <th className="py-3.5 px-4">سفارش مرتبط</th>
                  <th className="py-3.5 px-4">وضعیت</th>
                  <th className="py-3.5 px-4">آخرین پاسخ</th>
                  <th className="py-3.5 px-4 text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-sans">
                {tickets.map((t) => (
                  <tr
                    key={t.id}
                    className="hover:bg-blue-50/40 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                    onClick={() => setActiveTicketId(t.id)}
                  >
                    <td className="py-3.5 px-4 font-mono font-bold">
                      <div className="flex items-center gap-2">
                        <span className="text-blue-600 dark:text-blue-400">
                          #{t.ticket_number}
                        </span>
                        {getPriorityBadge(t.priority)}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white max-w-xs truncate group-hover:text-blue-600 transition-colors">
                        {t.subject}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        دپارتمان:{' '}
                        {DEPARTMENTS.find(
                          (d) => d.id === t.department,
                        )?.label.split('(')[0] || t.department}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800 dark:text-slate-200">
                        {t.customer_name || 'کاربر'}
                      </div>
                      <div className="font-mono text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-emerald-500" />
                        {t.customer_phone}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {t.related_order_no ? (
                        <div
                          onClick={(e) => {
                            e.stopPropagation()
                            if (t.related_order_no) {
                              handleCopy(t.related_order_no, t.id)
                            }
                          }}
                          className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950 px-2 py-0.5 rounded-md hover:bg-purple-100 transition-colors"
                          title="کلیک جهت کپی شماره سفارش"
                        >
                          <span>#{t.related_order_no}</span>
                          {copiedOrderId === t.id ? (
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Copy className="w-3 h-3 opacity-60" />
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">—</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">{getStatusBadge(t.status)}</td>

                    <td className="py-3.5 px-4">
                      <div className="font-mono text-[11px] text-slate-600 dark:text-slate-300">
                        {formatPersianDate(t.last_reply_at || t.created_at)}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        توسط:{' '}
                        {t.last_reply_by === 'customer' ? 'کاربر' : 'پشتیبانی'}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <div
                        className="flex items-center justify-center gap-1.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          size="sm"
                          onClick={() => setActiveTicketId(t.id)}
                          className="h-8 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs"
                        >
                          مشاهده و پاسخ
                        </Button>

                        <button
                          type="button"
                          onClick={() =>
                            handleDeleteTicket(t.id, t.ticket_number)
                          }
                          className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                          title="حذف تیکت"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Ticket Conversation & Reply Workbench Modal */}
      {activeTicketId &&
        ticketDetail &&
        createPortal(
          <div
            className="fixed inset-0 overflow-y-auto bg-black/80 backdrop-blur-md p-2 sm:p-4 animate-in fade-in"
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
              <div className="w-full max-w-4xl my-auto bg-card text-card-foreground rounded-surface border border-border/80 shadow-overlay overflow-hidden flex flex-col h-[92vh] max-h-[850px] animate-in zoom-in-95">
                {/* Modal Header */}
                <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                        {ticketDetail.ticket.subject}
                      </h3>
                      <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded-md">
                        #{ticketDetail.ticket.ticket_number}
                      </span>
                      {getStatusBadge(ticketDetail.ticket.status)}
                      {getPriorityBadge(ticketDetail.ticket.priority)}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                      <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-blue-500" />
                        {ticketDetail.ticket.customer_name} (
                        {ticketDetail.ticket.customer_phone})
                      </span>
                      {ticketDetail.ticket.customer_email && (
                        <span className="flex items-center gap-1 font-mono">
                          <Mail className="w-3.5 h-3.5" />
                          {ticketDetail.ticket.customer_email}
                        </span>
                      )}
                      {ticketDetail.ticket.related_order_no && (
                        <span className="text-purple-600 dark:text-purple-400 font-mono font-bold">
                          سفارش مرتبط: #{ticketDetail.ticket.related_order_no}
                        </span>
                      )}
                      {ticketDetail.ticket.satisfaction_rating ? (
                        <span className="inline-flex items-center gap-1 text-amber-500 font-bold bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          رضایت کاربر: {ticketDetail.ticket.satisfaction_rating}
                          /۵
                          {ticketDetail.ticket.satisfaction_comment &&
                            ` (${ticketDetail.ticket.satisfaction_comment})`}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {/* Status and Priority Controls */}
                  <div className="flex items-center gap-2 shrink-0 self-stretch sm:self-auto justify-between sm:justify-end">
                    <select
                      value={ticketDetail.ticket.status}
                      onChange={(e) =>
                        handleUpdateStatus(
                          activeTicketId,
                          e.target.value as TicketStatusType,
                        )
                      }
                      className="h-8 px-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs font-bold"
                    >
                      <option value="awaiting_admin">در انتظار ادمین</option>
                      <option value="awaiting_user">در انتظار کاربر</option>
                      <option value="in_progress">در حال بررسی فنی</option>
                      <option value="resolved">حل شده</option>
                      <option value="closed">بسته شده</option>
                    </select>

                    <select
                      value={ticketDetail.ticket.priority}
                      onChange={(e) =>
                        handleUpdatePriority(
                          activeTicketId,
                          e.target.value as TicketPriorityType,
                        )
                      }
                      className="h-8 px-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs"
                    >
                      <option value="low">کم</option>
                      <option value="medium">متوسط</option>
                      <option value="high">زیاد</option>
                      <option value="urgent">فوری</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => setActiveTicketId(null)}
                      className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-800 dark:hover:text-white flex items-center justify-center transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Conversation History */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-50/70 dark:bg-slate-950/70">
                  {loadingDetail ? (
                    <div className="py-16 text-center text-xs text-slate-400">
                      <RefreshCw className="w-6 h-6 text-blue-600 animate-spin mx-auto mb-2" />
                      در حال واکشی پیام‌ها...
                    </div>
                  ) : (
                    ticketDetail.messages.map((msg) => {
                      const isUser = msg.sender_type === 'customer'
                      const isInternal = msg.is_internal

                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${
                            isInternal
                              ? 'items-center my-3'
                              : isUser
                                ? 'items-end'
                                : 'items-start'
                          }`}
                        >
                          {isInternal ? (
                            /* Internal Operator Note Box */
                            <div className="w-full max-w-xl p-3.5 rounded-2xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/60 shadow-xs text-xs space-y-1">
                              <div className="flex items-center justify-between text-amber-800 dark:text-amber-300 font-bold text-[11px]">
                                <span className="flex items-center gap-1.5">
                                  <Lock className="w-3.5 h-3.5" />
                                  {msg.sender_name} (محرمانه / غیرقابل دیدن توسط
                                  کاربر)
                                </span>
                                <span className="font-mono text-[10px]">
                                  {formatPersianDate(msg.created_at)}
                                </span>
                              </div>
                              <p className="text-amber-950 dark:text-amber-100 leading-relaxed font-sans">
                                {msg.message}
                              </p>
                            </div>
                          ) : (
                            /* Standard Chat Bubble */
                            <div
                              className={`max-w-[85%] sm:max-w-[75%] p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                                isUser
                                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-bl-xs shadow-xs'
                                  : 'bg-blue-600 text-white rounded-br-xs shadow-md shadow-blue-500/10'
                              }`}
                            >
                              <div
                                className={`flex items-center justify-between gap-4 mb-2 pb-1.5 border-b text-[11px] font-mono ${
                                  isUser
                                    ? 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'
                                    : 'border-blue-500/40 text-blue-100'
                                }`}
                              >
                                <div className="flex items-center gap-1.5">
                                  {!isUser && (
                                    <ShieldCheck className="w-3.5 h-3.5 text-blue-200" />
                                  )}
                                  <span className="font-bold font-sans">
                                    {isUser
                                      ? `کاربر (${ticketDetail.ticket.customer_name})`
                                      : msg.sender_name}
                                  </span>
                                </div>
                                <span className="text-[10px]">
                                  {formatPersianDate(msg.created_at)}
                                </span>
                              </div>

                              <p className="whitespace-pre-wrap font-sans">
                                {msg.message}
                              </p>

                              {/* Attachments rendering */}
                              {msg.attachments &&
                                msg.attachments.length > 0 && (
                                  <div className="mt-3 pt-2.5 border-t border-slate-200/50 dark:border-slate-700/50 space-y-2">
                                    <span className="text-[10px] font-bold block opacity-75">
                                      پیوست‌ها ({msg.attachments.length}):
                                    </span>
                                    <div className="flex flex-wrap gap-2">
                                      {msg.attachments.map((att) => (
                                        <div
                                          key={att.id}
                                          className="relative group"
                                        >
                                          {att.is_image ? (
                                            <div
                                              onClick={() =>
                                                setZoomImage(att.file_url)
                                              }
                                              className="cursor-pointer overflow-hidden rounded-xl border border-slate-200/60 dark:border-slate-700 bg-slate-950/10 relative w-24 h-24 sm:w-28 sm:h-28"
                                            >
                                              <img
                                                src={att.file_url}
                                                alt={att.file_name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                              />
                                              <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                                <Eye className="w-4 h-4" />
                                              </div>
                                            </div>
                                          ) : (
                                            <a
                                              href={att.file_url}
                                              target="_blank"
                                              rel="noreferrer"
                                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white/10 text-[11px] font-mono hover:bg-white/20 transition-colors"
                                            >
                                              <Download className="w-3.5 h-3.5" />
                                              <span className="truncate max-w-[120px]">
                                                {att.file_name}
                                              </span>
                                            </a>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                            </div>
                          )}
                        </div>
                      )
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Canned Quick Replies Palette */}
                <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center gap-2 overflow-x-auto text-[11px]">
                  <span className="font-bold text-slate-500 whitespace-nowrap flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    پاسخ‌های آماده:
                  </span>
                  {CANNED_REPLIES.map((canned) => (
                    <button
                      key={canned}
                      type="button"
                      onClick={() => setReplyText(canned)}
                      className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:border-blue-300 dark:hover:border-blue-700 whitespace-nowrap transition-colors"
                    >
                      {canned.substring(0, 32)}...
                    </button>
                  ))}
                </div>

                {/* Operator Reply & Action Box */}
                <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                  {/* Mode Switch & Settings */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsInternalNote(false)}
                        className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                          !isInternalNote
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <Send className="w-3.5 h-3.5" />
                        پاسخ رسمی به کاربر
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsInternalNote(true)}
                        className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                          isInternalNote
                            ? 'bg-amber-500 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <Lock className="w-3.5 h-3.5" />
                        یادداشت محرمانه اپراتور
                      </button>
                    </div>

                    {!isInternalNote && (
                      <div className="flex items-center gap-4 text-[11px] text-slate-600 dark:text-slate-400">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notifySMS}
                            onChange={(e) => setNotifySMS(e.target.checked)}
                            className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                          />
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-emerald-500" />
                            پیامک خودکار SMS.ir به کاربر
                          </span>
                        </label>

                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notifyEmail}
                            onChange={(e) => setNotifyEmail(e.target.checked)}
                            className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                          />
                          <span>ارسال ایمیل</span>
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Attachments Chips */}
                  {replyAttachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {replyAttachments.map((att, idx) => (
                        <div
                          key={att.id}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-[11px] text-blue-700 dark:text-blue-300 font-mono"
                        >
                          {att.is_image ? (
                            <ImageIcon className="w-3 h-3 text-blue-500" />
                          ) : (
                            <FileText className="w-3 h-3" />
                          )}
                          <span className="truncate max-w-[130px]">
                            {att.file_name}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setReplyAttachments(
                                replyAttachments.filter((_, i) => i !== idx),
                              )
                            }
                            className="text-slate-400 hover:text-rose-500 mr-1"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Input Area */}
                  <div className="flex items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept="image/*,.pdf,.zip,.log,.txt"
                      onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (f) handleUploadFile(f)
                      }}
                    />

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isUploadingAtt}
                      onClick={() => fileInputRef.current?.click()}
                      className="h-10 px-3 rounded-xl border-slate-200 dark:border-slate-800 text-slate-500 hover:text-blue-600 text-xs shrink-0"
                      title="پیوست تصویر، راهنما یا لایسنس"
                    >
                      <Paperclip
                        className={`w-4 h-4 ${isUploadingAtt ? 'animate-pulse text-blue-600' : ''}`}
                      />
                    </Button>

                    <Input
                      type="text"
                      placeholder={
                        isInternalNote
                          ? 'یادداشت داخلی اپراتورها را بنویسید (فقط پرسنل پشتیبانی می‌بینند)...'
                          : 'پاسخ رسمی به خریدار را بنویسید (اسکرین‌شات را مستقیماً Paste کنید)...'
                      }
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === 'Enter' && !e.shiftKey && handleSendReply()
                      }
                      onPaste={handlePasteImage}
                      className="h-10 text-xs rounded-xl flex-1 border-slate-200 dark:border-slate-800"
                    />

                    {!isInternalNote && (
                      <select
                        value={targetStatus}
                        onChange={(e) =>
                          setTargetStatus(e.target.value as TicketStatusType)
                        }
                        className="h-10 px-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs shrink-0 font-medium"
                        title="وضعیت تیکت پس از ارسال این پاسخ"
                      >
                        <option value="awaiting_user">
                          در انتظار پاسخ کاربر
                        </option>
                        <option value="resolved">حل شده و خاتمه یافته</option>
                        <option value="in_progress">در حال بررسی فنی</option>
                        <option value="closed">بستن نهایی تیکت</option>
                      </select>
                    )}

                    <Button
                      onClick={handleSendReply}
                      disabled={
                        sendingReply ||
                        (!replyText.trim() && replyAttachments.length === 0)
                      }
                      className={`h-10 px-5 rounded-xl font-bold text-xs shrink-0 active:scale-98 transition-all ${
                        isInternalNote
                          ? 'bg-amber-500 hover:bg-amber-600 text-white'
                          : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20'
                      }`}
                    >
                      <Send className="w-4 h-4 ml-1.5" />
                      {isInternalNote ? 'ثبت یادداشت' : 'ارسال پاسخ'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* 6. Lightbox Zoom Modal for Images */}
      {zoomImage &&
        createPortal(
          <div
            onClick={() => setZoomImage(null)}
            className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100vw',
              height: '100vh',
              zIndex: 2147483647,
            }}
          >
            <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-surface shadow-overlay">
              <button
                type="button"
                onClick={() => setZoomImage(null)}
                className="absolute top-3 right-3 w-9 h-9 rounded-control bg-black/80 text-white flex items-center justify-center hover:bg-black transition-colors z-10 cursor-pointer"
              >
                ✕
              </button>
              <img
                src={zoomImage}
                alt="پیوست تصویر بزرگنمایی"
                className="max-w-full max-h-[85vh] object-contain rounded-surface"
              />
            </div>
          </div>,
          document.body,
        )}
    </div>
  )
}
