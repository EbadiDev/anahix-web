import {
  AlertCircle,
  Check,
  CheckCircle2,
  Copy,
  Download,
  Eye,
  FileText,
  Image as ImageIcon,
  Lock,
  Mail,
  MessageSquare,
  Paperclip,
  Phone,
  RefreshCw,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  Trash2,
  User,
} from 'lucide-react'
import type React from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { apiService } from '../../services/api'
import {
  type CannedReply,
  cannedRepliesService,
} from '../../services/cannedRepliesService'
import type {
  AdminTicketStats,
  TicketAttachment,
  TicketDetailResponse,
  TicketItem,
  TicketPriorityType,
  TicketStatusType,
} from '../../types'
import { toPersianDigits } from '../../utils/formatters'
import { Button } from '../ui/button'
import { ConfirmModal } from '../vibefarsi/ConfirmModal'
import { ModalCloseButton } from '../vibefarsi/ModalCloseButton'
import { useNotification } from '../vibefarsi/NotificationContext'
import { SearchInput } from '../vibefarsi/SearchInput'
import { ToggleSwitch } from '../vibefarsi/ToggleSwitch'
import { AdminCannedRepliesView } from './AdminCannedRepliesView'

interface AdminTicketsViewProps {
  adminUser?: any
  onUpdatePendingCount?: (count: number) => void
  refreshTrigger?: number
}

const DEPARTMENTS = [
  { id: 'all', label: 'همه دپارتمان‌ها' },
  { id: 'ai_accounts', label: 'اکانت‌های هوش مصنوعی (ChatGPT, Claude, Gemini)' },
  {
    id: 'license_support',
    label: 'لایسنس و خطای فعال‌سازی اکانت شخصی دستی اپراتور',
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

export const AdminTicketsView: React.FC<AdminTicketsViewProps> = ({
  adminUser: _adminUser,
  onUpdatePendingCount,
  refreshTrigger,
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

  const [cannedList, setCannedList] = useState<CannedReply[]>([])
  const [isCannedModalOpen, setIsCannedModalOpen] = useState(false)

  useEffect(() => {
    setCannedList(cannedRepliesService.getAll())
    const handler = () => setCannedList(cannedRepliesService.getAll())
    window.addEventListener('anahix:canned-replies-updated', handler)
    return () =>
      window.removeEventListener('anahix:canned-replies-updated', handler)
  }, [])
  const [loading, setLoading] = useState<boolean>(true)
  const [_refreshing, setRefreshing] = useState<boolean>(false)
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
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean
    ticketId: string | null
    ticketNum: string | null
    loading: boolean
  }>({
    isOpen: false,
    ticketId: null,
    ticketNum: null,
    loading: false,
  })

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

  useEffect(() => {
    if (refreshTrigger) {
      fetchTickets(true)
    }
  }, [refreshTrigger, fetchTickets])

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
        status: isInternalNote
          ? undefined
          : ticketDetail?.ticket.status === 'awaiting_admin'
            ? 'awaiting_user'
            : undefined,
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
  const handleDeleteTicket = (ticketId: string, tNum: string) => {
    setDeleteConfirm({
      isOpen: true,
      ticketId,
      ticketNum: tNum,
      loading: false,
    })
  }

  const confirmDeleteTicket = async () => {
    if (!deleteConfirm.ticketId) return
    setDeleteConfirm((prev) => ({ ...prev, loading: true }))

    try {
      await apiService.adminDeleteTicket(deleteConfirm.ticketId)
      notifySuccess(
        'حذف تیکت',
        `تیکت #${deleteConfirm.ticketNum} با موفقیت حذف شد.`,
      )
      if (activeTicketId === deleteConfirm.ticketId) {
        setActiveTicketId(null)
      }
      setDeleteConfirm({
        isOpen: false,
        ticketId: null,
        ticketNum: null,
        loading: false,
      })
      await fetchTickets(true)
    } catch (err: any) {
      notifyError('خطا در حذف تیکت', err.message)
      setDeleteConfirm((prev) => ({ ...prev, loading: false }))
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
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-control bg-rose-500/15 text-rose-500 border border-rose-500/30 text-[11px] font-bold animate-pulse whitespace-nowrap shrink-0">
            در انتظار پاسخ ادمین
          </span>
        )
      case 'awaiting_user':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-control bg-blue-500/15 text-blue-500 border border-blue-500/30 text-[11px] font-bold whitespace-nowrap shrink-0">
            در انتظار پاسخ کاربر
          </span>
        )
      case 'in_progress':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-control bg-purple-500/15 text-purple-500 border border-purple-500/30 text-[11px] font-bold whitespace-nowrap shrink-0">
            در حال بررسی فنی
          </span>
        )
      case 'resolved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-control bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 text-[11px] font-bold whitespace-nowrap shrink-0">
            حل شده / پاسخ داده شده
          </span>
        )
      case 'closed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-control bg-muted text-muted-foreground border border-border/40 text-[11px] font-bold whitespace-nowrap shrink-0">
            بسته شده
          </span>
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
    <div className="space-y-6">
      {/* 2. Statistical KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div
          onClick={() => setStatusFilter('all')}
          className={`p-4 rounded-surface border transition-all cursor-pointer shadow-surface select-none ${
            statusFilter === 'all'
              ? 'border-brand bg-brand/10 shadow-control'
              : 'border-border/80 bg-card hover:border-border'
          }`}
        >
          <div className="text-[11px] font-bold text-muted-foreground">
            کل تیکت‌ها
          </div>
          <div className="text-xl font-black text-foreground mt-1 font-mono font-latin">
            {stats.total}
          </div>
        </div>

        <div
          onClick={() => setStatusFilter('awaiting_admin')}
          className={`p-4 rounded-surface border transition-all cursor-pointer shadow-surface select-none ${
            statusFilter === 'awaiting_admin'
              ? 'border-rose-500 bg-rose-500/10 shadow-control'
              : 'border-border/80 bg-card hover:border-border'
          }`}
        >
          <div className="text-[11px] font-bold text-rose-500 flex items-center justify-between">
            <span>در انتظار ادمین</span>
            {stats.awaiting_admin > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            )}
          </div>
          <div className="text-xl font-black text-rose-500 mt-1 font-mono font-latin">
            {stats.awaiting_admin}
          </div>
        </div>

        <div
          onClick={() => setStatusFilter('awaiting_user')}
          className={`p-4 rounded-surface border transition-all cursor-pointer shadow-surface select-none ${
            statusFilter === 'awaiting_user'
              ? 'border-brand bg-brand/10 shadow-control'
              : 'border-border/80 bg-card hover:border-border'
          }`}
        >
          <div className="text-[11px] font-bold text-brand">
            در انتظار کاربر
          </div>
          <div className="text-xl font-black text-brand mt-1 font-mono font-latin">
            {stats.awaiting_user}
          </div>
        </div>

        <div
          onClick={() => setStatusFilter('in_progress')}
          className={`p-4 rounded-surface border transition-all cursor-pointer shadow-surface select-none ${
            statusFilter === 'in_progress'
              ? 'border-purple-500 bg-purple-500/10 shadow-control'
              : 'border-border/80 bg-card hover:border-border'
          }`}
        >
          <div className="text-[11px] font-bold text-purple-500">
            در حال بررسی
          </div>
          <div className="text-xl font-black text-purple-500 mt-1 font-mono font-latin">
            {stats.in_progress}
          </div>
        </div>

        <div
          onClick={() => setStatusFilter('resolved')}
          className={`p-4 rounded-surface border transition-all cursor-pointer shadow-surface select-none ${
            statusFilter === 'resolved'
              ? 'border-emerald-500 bg-emerald-500/10 shadow-control'
              : 'border-border/80 bg-card hover:border-border'
          }`}
        >
          <div className="text-[11px] font-bold text-emerald-500">حل شده</div>
          <div className="text-xl font-black text-emerald-500 mt-1 font-mono font-latin">
            {stats.resolved}
          </div>
        </div>

        <div
          onClick={() => setStatusFilter('closed')}
          className={`p-4 rounded-surface border transition-all cursor-pointer shadow-surface select-none ${
            statusFilter === 'closed'
              ? 'border-border bg-muted shadow-control'
              : 'border-border/80 bg-card hover:border-border'
          }`}
        >
          <div className="text-[11px] font-bold text-muted-foreground">
            بسته شده
          </div>
          <div className="text-xl font-black text-muted-foreground mt-1 font-mono font-latin">
            {stats.closed}
          </div>
        </div>
      </div>

      {/* 3. Filters & Search Bar */}
      <div className="p-4 rounded-surface border border-border/80 bg-card flex flex-col md:flex-row items-center justify-between gap-3 shadow-surface">
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
            className="h-10 px-3 rounded-field border border-border/60 bg-muted/20 text-foreground text-xs flex-1 sm:flex-none outline-none focus:border-brand font-medium cursor-pointer"
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
            className="h-10 px-3 rounded-field border border-border/60 bg-muted/20 text-foreground text-xs flex-1 sm:flex-none outline-none focus:border-brand font-medium cursor-pointer"
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
        <div className="p-16 rounded-surface border border-border/80 bg-card text-center space-y-3 shadow-surface">
          <RefreshCw className="w-8 h-8 text-brand animate-spin mx-auto" />
          <p className="text-xs text-muted-foreground font-bold">
            در حال واکشی اطلاعات تیکت‌ها از سرور...
          </p>
        </div>
      ) : errorMsg ? (
        <div className="p-8 rounded-surface border border-destructive/30 bg-destructive/10 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-destructive mx-auto" />
          <p className="text-xs text-destructive font-bold">{errorMsg}</p>
          <button
            type="button"
            onClick={() => fetchTickets()}
            className="h-9 px-4 rounded-control border border-border/60 bg-card hover:bg-muted text-foreground text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            تلاش مجدد
          </button>
        </div>
      ) : tickets.length === 0 ? (
        <div className="p-16 rounded-surface border border-border/80 bg-card text-center space-y-3 shadow-surface">
          <div className="w-12 h-12 rounded-control bg-secondary text-brand border border-border/60 flex items-center justify-center mx-auto shadow-xs">
            <MessageSquare className="w-6 h-6 text-brand" />
          </div>
          <h4 className="text-sm font-black text-foreground">
            تیکتی با فیلترهای انتخابی یافت نشد
          </h4>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            تمامی تیکت‌های این بخش پاسخ داده شده‌اند یا موردی ثبت نشده است.
          </p>
          {(statusFilter !== 'all' ||
            departmentFilter !== 'all' ||
            priorityFilter !== 'all' ||
            searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setStatusFilter('all')
                setDepartmentFilter('all')
                setPriorityFilter('all')
                setSearchQuery('')
              }}
              className="h-8 px-3.5 rounded-control border border-border/60 bg-secondary hover:bg-muted text-foreground text-xs font-bold transition-all shadow-xs cursor-pointer mt-2"
            >
              پاکسازی فیلترها
            </button>
          )}
        </div>
      ) : (
        <div className="rounded-surface border border-border/80 bg-card shadow-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-center text-xs">
              <thead className="bg-muted/40 text-muted-foreground font-semibold border-b border-border/60 select-none">
                <tr>
                  <th className="py-3.5 px-4 text-center">شناسه و اولویت</th>
                  <th className="py-3.5 px-4 text-center">موضوع و دپارتمان</th>
                  <th className="py-3.5 px-4 text-center">کاربر / مشتری</th>
                  <th className="py-3.5 px-4 text-center">سفارش مرتبط</th>
                  <th className="py-3.5 px-4 text-center">وضعیت</th>
                  <th className="py-3.5 px-4 text-center">آخرین پاسخ</th>
                  <th className="py-3.5 px-4 text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 font-sans">
                {tickets.map((t) => (
                  <tr
                    key={t.id}
                    className="hover:bg-muted/30 transition-colors cursor-pointer group"
                    onClick={() => setActiveTicketId(t.id)}
                  >
                    <td className="py-3.5 px-4 font-mono font-latin font-bold text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-brand">#{t.ticket_number}</span>
                        {getPriorityBadge(t.priority)}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center max-w-[200px] sm:max-w-xs">
                      <div
                        className="font-bold text-foreground truncate group-hover:text-brand transition-colors text-center"
                        title={t.subject}
                      >
                        {t.subject}
                      </div>
                      <div
                        className="text-[11px] text-muted-foreground mt-0.5 truncate text-center"
                        title={
                          DEPARTMENTS.find((d) => d.id === t.department)?.label
                        }
                      >
                        دپارتمان:{' '}
                        {DEPARTMENTS.find(
                          (d) => d.id === t.department,
                        )?.label.split('(')[0] || t.department}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center max-w-[140px]">
                      <div className="relative inline-block group/user">
                        <div className="font-bold text-foreground truncate cursor-pointer hover:text-brand transition-colors text-xs flex items-center justify-center gap-1.5 py-1">
                          <span>{t.customer_name || 'کاربر بدون نام'}</span>
                        </div>
                        {/* VibeFarsi Interactive Tooltip on Hover */}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 pt-1 hidden group-hover/user:block z-50 animate-in fade-in zoom-in-95 duration-150">
                          <div className="w-64 p-3 rounded-surface bg-card border border-border/80 shadow-overlay text-right space-y-2 select-text pointer-events-auto">
                            <div className="font-bold text-foreground border-b border-border/40 pb-1.5 flex items-center justify-between text-xs">
                              <span>اطلاعات تماس کاربر</span>
                              <User className="w-3.5 h-3.5 text-brand" />
                            </div>
                            <div className="flex items-center justify-between gap-2 p-1.5 rounded-control bg-secondary/50 border border-border/40 text-xs">
                              <div className="flex items-center gap-1.5 font-mono font-latin font-bold text-foreground">
                                <Phone className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                <span>{t.customer_phone || '—'}</span>
                              </div>
                              {t.customer_phone && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    navigator.clipboard.writeText(
                                      t.customer_phone,
                                    )
                                    notifySuccess(
                                      'کپی شد',
                                      'شماره موبایل در کلیپ‌بورد کپی شد',
                                    )
                                  }}
                                  className="p-1 rounded-control hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition shrink-0"
                                  title="کپی شماره موبایل"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                            <div className="flex items-center justify-between gap-2 p-1.5 rounded-control bg-secondary/50 border border-border/40 text-xs">
                              <div className="flex items-center gap-1.5 font-mono font-latin text-foreground truncate min-w-0 flex-1">
                                <Mail className="w-3.5 h-3.5 text-brand shrink-0" />
                                <span
                                  className="truncate"
                                  title={t.customer_email || 'ایمیل ثبت نشده'}
                                >
                                  {t.customer_email || 'ایمیل ثبت نشده'}
                                </span>
                              </div>
                              {t.customer_email && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    navigator.clipboard.writeText(
                                      t.customer_email,
                                    )
                                    notifySuccess(
                                      'کپی شد',
                                      'ایمیل در کلیپ‌بورد کپی شد',
                                    )
                                  }}
                                  className="p-1 rounded-control hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition shrink-0"
                                  title="کپی ایمیل"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-card" />
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center max-w-[130px]">
                      {t.related_order_no ? (
                        <div
                          onClick={(e) => {
                            e.stopPropagation()
                            if (t.related_order_no) {
                              handleCopy(t.related_order_no, t.id)
                            }
                          }}
                          className="inline-flex items-center gap-1 font-mono font-latin text-[11px] font-bold text-brand bg-brand/10 border border-brand/20 px-2 py-0.5 rounded-control hover:bg-brand/20 transition-colors cursor-pointer max-w-[125px] whitespace-nowrap shadow-xs"
                          title={`شماره سفارش: #${t.related_order_no} (کلیک جهت کپی)`}
                        >
                          <span className="truncate">
                            #{t.related_order_no}
                          </span>
                          {copiedOrderId === t.id ? (
                            <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                          ) : (
                            <Copy className="w-3 h-3 opacity-60 shrink-0" />
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-[11px]">
                          —
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-center whitespace-nowrap min-w-[140px]">
                      {getStatusBadge(t.status)}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <div className="font-mono font-latin text-[11px] text-muted-foreground">
                        {formatPersianDate(t.last_reply_at || t.created_at)}
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
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
                          className="h-8 px-3 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-black shadow-control transition-all duration-motion active:scale-[0.98]"
                        >
                          مشاهده و پاسخ
                        </Button>

                        <button
                          type="button"
                          onClick={() =>
                            handleDeleteTicket(t.id, t.ticket_number)
                          }
                          className="h-8 w-8 rounded-control border border-destructive/20 hover:bg-destructive/10 text-destructive flex items-center justify-center transition-colors cursor-pointer shadow-xs"
                          title="حذف تیکت"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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
              <div className="w-full max-w-4xl my-auto bg-card text-card-foreground rounded-surface border border-border/80 shadow-overlay overflow-hidden flex flex-col h-[92vh] max-h-[850px] animate-in zoom-in-95 duration-200">
                {/* Modal Header */}
                <div className="p-4 sm:p-5 border-b border-border/60 bg-muted/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-black text-foreground truncate">
                        {ticketDetail.ticket.subject}
                      </h3>
                      <span className="text-xs font-mono font-latin font-bold text-brand bg-brand/10 border border-brand/20 px-2 py-0.5 rounded-control">
                        #{ticketDetail.ticket.ticket_number}
                      </span>
                      {getStatusBadge(ticketDetail.ticket.status)}
                      {getPriorityBadge(ticketDetail.ticket.priority)}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                      <span className="font-bold text-foreground flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-brand" />
                        {ticketDetail.ticket.customer_name} (
                        {ticketDetail.ticket.customer_phone})
                      </span>
                      {ticketDetail.ticket.customer_email && (
                        <span className="flex items-center gap-1 font-mono font-latin">
                          <Mail className="w-3.5 h-3.5 text-brand" />
                          {ticketDetail.ticket.customer_email}
                        </span>
                      )}
                      {ticketDetail.ticket.related_order_no && (
                        <span className="text-brand font-mono font-latin font-bold bg-brand/10 border border-brand/20 px-2 py-0.2 rounded-control">
                          سفارش مرتبط: #{ticketDetail.ticket.related_order_no}
                        </span>
                      )}
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
                      className="h-8 px-2.5 rounded-field border border-border/60 bg-muted/20 text-foreground text-xs font-bold outline-none focus:border-brand cursor-pointer"
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
                      className="h-8 px-2.5 rounded-field border border-border/60 bg-muted/20 text-foreground text-xs font-bold outline-none focus:border-brand cursor-pointer"
                    >
                      <option value="low">کم</option>
                      <option value="medium">متوسط</option>
                      <option value="high">زیاد</option>
                      <option value="urgent">فوری</option>
                    </select>

                    <ModalCloseButton
                      onClick={() => setActiveTicketId(null)}
                      size="sm"
                    />
                  </div>
                </div>

                {/* Customer Satisfaction Rating & Feedback Banner */}
                {Boolean(
                  ticketDetail.ticket.satisfaction_rating &&
                    ticketDetail.ticket.satisfaction_rating > 0,
                ) && (
                  <div className="p-3.5 sm:p-4 bg-amber-500/10 border-b border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shrink-0 shadow-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span className="font-bold text-foreground text-sm">
                          نظر و امتیاز ثبت‌شده برای این تیکت (
                          {toPersianDigits(
                            ticketDetail.ticket.satisfaction_rating ?? 0,
                          )}{' '}
                          از ۵ ستاره)
                        </span>
                      </div>
                      {ticketDetail.ticket.satisfaction_comment && (
                        <p className="text-foreground/90 text-xs font-sans pr-6">
                          <span className="font-bold text-amber-500 ml-1">
                            توضیحات و بازخورد کاربر:
                          </span>
                          «{ticketDetail.ticket.satisfaction_comment}»
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-amber-400 bg-card px-2.5 py-1 rounded-control border border-border/40 shrink-0">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${
                            s <= (ticketDetail.ticket.satisfaction_rating ?? 0)
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-muted-foreground/30'
                          }`}
                        />
                      ))}
                      <span className="font-mono font-latin font-bold text-xs text-foreground mr-1">
                        {ticketDetail.ticket.satisfaction_rating}/5
                      </span>
                    </div>
                  </div>
                )}

                {/* Conversation History */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-muted/20">
                  {loadingDetail ? (
                    <div className="py-16 text-center text-xs text-muted-foreground">
                      <RefreshCw className="w-6 h-6 text-brand animate-spin mx-auto mb-2" />
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
                            <div className="w-full max-w-xl p-3.5 rounded-surface bg-amber-500/10 border border-amber-500/30 shadow-surface text-xs space-y-1">
                              <div className="flex items-center justify-between text-amber-500 font-bold text-[11px]">
                                <span className="flex items-center gap-1.5">
                                  <Lock className="w-3.5 h-3.5" />
                                  <span>
                                    یادداشت محرمانه پرسنل پشتیبانی (غیرقابل
                                    مشاهده توسط خریدار)
                                  </span>
                                </span>
                                <span className="font-mono font-latin text-[10px]">
                                  {formatPersianDate(msg.created_at)}
                                </span>
                              </div>
                              <p className="text-foreground leading-relaxed font-sans">
                                {msg.message}
                              </p>
                            </div>
                          ) : (
                            /* Standard Chat Bubble */
                            <div
                              className={`max-w-[85%] sm:max-w-[75%] p-4 rounded-surface text-xs sm:text-sm leading-relaxed border ${
                                isUser
                                  ? 'bg-card text-foreground border-border/80 rounded-bl-xs shadow-surface'
                                  : 'bg-primary text-primary-foreground border-black/10 dark:border-white/15 rounded-br-xs shadow-control'
                              }`}
                            >
                              <div
                                className={`flex items-center justify-between gap-4 mb-2 pb-1.5 border-b text-[11px] font-mono font-latin ${
                                  isUser
                                    ? 'border-border/60 text-muted-foreground'
                                    : 'border-black/15 dark:border-white/15 text-primary-foreground/90'
                                }`}
                              >
                                <div className="flex items-center gap-1.5">
                                  {!isUser && (
                                    <ShieldCheck className="w-3.5 h-3.5 text-primary-foreground shrink-0" />
                                  )}
                                  <span className="font-bold font-sans">
                                    {isUser
                                      ? `کاربر (${ticketDetail.ticket.customer_name})`
                                      : 'پشتیبانی آناهیکس'}
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
                                  <div className="mt-3 pt-2.5 border-t border-border/40 space-y-2">
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
                                              className="cursor-pointer overflow-hidden rounded-control border border-border/60 bg-muted/40 relative w-24 h-24 sm:w-28 sm:h-28 shadow-xs"
                                            >
                                              <img
                                                src={att.file_url}
                                                alt={att.file_name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                              />
                                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                                <Eye className="w-4 h-4" />
                                              </div>
                                            </div>
                                          ) : (
                                            <a
                                              href={att.file_url}
                                              target="_blank"
                                              rel="noreferrer"
                                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-control border border-border/60 bg-secondary text-foreground text-[11px] font-mono hover:bg-muted transition-colors shadow-xs"
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
                <div className="px-4 py-2 border-t border-border/60 bg-muted/30 flex items-center justify-between gap-2 overflow-x-auto text-[11px] scrollbar-none">
                  <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-0.5">
                    <span className="font-bold text-muted-foreground whitespace-nowrap flex items-center gap-1 shrink-0">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>پاسخ‌های آماده:</span>
                    </span>
                    {cannedList.map((canned) => (
                      <button
                        key={canned.id}
                        type="button"
                        onClick={() => setReplyText(canned.text)}
                        className="px-2.5 py-1 rounded-control bg-secondary hover:bg-muted text-foreground border border-border/60 text-xs font-medium whitespace-nowrap transition-colors cursor-pointer shadow-xs shrink-0"
                        title={canned.text}
                      >
                        {canned.title || canned.text.substring(0, 32)}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsCannedModalOpen(true)}
                    className="px-2.5 py-1 rounded-control bg-brand/10 hover:bg-brand/20 text-brand border border-brand/20 text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0"
                    title="مدیریت و افزودن پاسخ‌های آماده"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>مدیریت پاسخ‌ها</span>
                  </button>
                </div>

                {/* Operator Reply & Action Box */}
                <div className="p-4 border-t border-border/60 bg-card space-y-3 shrink-0">
                  {/* Mode Switch & Settings */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsInternalNote(false)}
                        className={`h-8 px-3.5 rounded-control font-black text-xs transition-all flex items-center gap-1.5 shadow-control cursor-pointer duration-motion active:scale-[0.98] ${
                          !isInternalNote
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary text-muted-foreground border border-border/60 hover:text-foreground'
                        }`}
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>پاسخ رسمی به کاربر</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsInternalNote(true)}
                        className={`h-8 px-3.5 rounded-control font-black text-xs transition-all flex items-center gap-1.5 shadow-control cursor-pointer duration-motion active:scale-[0.98] ${
                          isInternalNote
                            ? 'bg-amber-500 text-white'
                            : 'bg-secondary text-muted-foreground border border-border/60 hover:text-foreground'
                        }`}
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>یادداشت محرمانه اپراتور</span>
                      </button>
                    </div>

                    {!isInternalNote && (
                      <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
                        <div className="flex items-center gap-2 select-none">
                          <ToggleSwitch
                            size="sm"
                            checked={notifySMS}
                            onChange={setNotifySMS}
                          />
                          <span className="flex items-center gap-1 font-semibold text-foreground">
                            <Phone className="w-3 h-3 text-emerald-500" />
                            پیامک خودکار SMS.ir
                          </span>
                        </div>

                        <div className="flex items-center gap-2 select-none">
                          <ToggleSwitch
                            size="sm"
                            checked={notifyEmail}
                            onChange={setNotifyEmail}
                          />
                          <span className="font-semibold text-foreground">
                            ارسال ایمیل
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Attachments Chips */}
                  {replyAttachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {replyAttachments.map((att, idx) => (
                        <div
                          key={att.id}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-control bg-secondary text-foreground border border-border/60 text-[11px] font-mono font-latin shadow-xs"
                        >
                          {att.is_image ? (
                            <ImageIcon className="w-3 h-3 text-brand" />
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
                            className="text-muted-foreground hover:text-rose-500 mr-1 cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Multiline Textarea Input Area */}
                  <div className="space-y-2">
                    <textarea
                      rows={2}
                      placeholder={
                        isInternalNote
                          ? 'یادداشت داخلی اپراتورها را بنویسید (Shift+Enter سطر بعد، Enter ثبت یادداشت)...'
                          : 'پاسخ رسمی به خریدار را بنویسید (Shift+Enter سطر بعد، Enter ارسال پیام)...'
                      }
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleSendReply()
                        }
                      }}
                      onPaste={handlePasteImage}
                      className="w-full p-2.5 rounded-field border border-border/60 bg-muted/20 text-xs text-foreground focus:outline-none focus:border-brand font-sans leading-relaxed resize-none"
                    />

                    <div className="flex items-center justify-between gap-2 pt-1">
                      <div>
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

                        <button
                          type="button"
                          disabled={isUploadingAtt}
                          onClick={() => fileInputRef.current?.click()}
                          className="h-9 px-3 rounded-control border border-border/60 bg-secondary hover:bg-muted text-foreground text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                          title="پیوست تصویر، راهنما یا لایسنس"
                        >
                          <Paperclip
                            className={`w-3.5 h-3.5 ${isUploadingAtt ? 'animate-pulse text-brand' : ''}`}
                          />
                          <span>پیوست فایل</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={handleSendReply}
                        disabled={
                          sendingReply ||
                          (!replyText.trim() && replyAttachments.length === 0)
                        }
                        className={`h-9 px-5 rounded-control font-black text-xs shrink-0 duration-motion active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer shadow-control disabled:opacity-50 ${
                          isInternalNote
                            ? 'bg-amber-500 hover:bg-amber-600 text-white'
                            : 'bg-primary hover:bg-primary-hover text-primary-foreground'
                        }`}
                      >
                        {sendingReply ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Send className="w-3.5 h-3.5" />
                        )}
                        <span>
                          {isInternalNote ? 'ثبت یادداشت' : 'ارسال پاسخ رسمی'}
                        </span>
                      </button>
                    </div>
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

      {/* DELETE CONFIRMATION MODAL */}
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        title="حذف تیکت پشتیبانی"
        message={`آیا از حذف کامل تیکت #${deleteConfirm.ticketNum} و کلیه پیام‌های آن اطمینان دارید؟ این عملیات غیرقابل بازگشت است.`}
        confirmText="بله، تیکت حذف شود"
        cancelText="انصراف"
        loading={deleteConfirm.loading}
        onConfirm={confirmDeleteTicket}
        onClose={() =>
          setDeleteConfirm({
            isOpen: false,
            ticketId: null,
            ticketNum: null,
            loading: false,
          })
        }
      />
      {/* Canned Replies Modal inside Ticket Workbench */}
      {isCannedModalOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[2147483645] overflow-y-auto bg-black/80 backdrop-blur-md p-3 sm:p-6 animate-in fade-in"
            dir="rtl"
          >
            <div className="min-h-full w-full flex items-center justify-center">
              <div className="w-full max-w-3xl bg-card rounded-surface border border-border/80 shadow-overlay p-6 space-y-4 animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-brand" />
                    <h3 className="text-base font-black text-foreground">
                      مدیریت و انتخاب پاسخ‌های آماده (Canned Responses)
                    </h3>
                  </div>
                  <ModalCloseButton
                    onClick={() => setIsCannedModalOpen(false)}
                    size="sm"
                  />
                </div>

                <AdminCannedRepliesView
                  isModalMode={true}
                  onSelectReply={(text) => {
                    setReplyText(text)
                    setIsCannedModalOpen(false)
                  }}
                />
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  )
}
