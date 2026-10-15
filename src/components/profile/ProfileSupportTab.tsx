import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileText,
  Image as ImageIcon,
  LifeBuoy,
  MessageSquare,
  Paperclip,
  Phone,
  Plus,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  X,
} from 'lucide-react'
import type React from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { apiService } from '../../services/api'
import type {
  Order,
  TicketAttachment,
  TicketDetailResponse,
  TicketItem,
  TicketPriorityType,
  TicketStatusType,
  VirtualNumberOrder,
} from '../../types'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Input } from '../ui/input'

interface ProfileSupportTabProps {
  orders: Order[]
  virtualOrders: VirtualNumberOrder[]
}

const DEPARTMENTS = [
  { id: 'ai_accounts', label: 'اکانت‌های هوش مصنوعی (ChatGPT, Claude, Gemini)' },
  {
    id: 'license_support',
    label: 'لایسنس و خطای فعال‌سازی اکانت شخصی (Mode C)',
  },
  { id: 'virtual_numbers', label: 'شماره‌های مجازی و دریافت پیامک (5SIM)' },
  { id: 'billing', label: 'امور مالی، شارژ کیف پول و تراکنش‌ها' },
  { id: 'general', label: 'مشاوره خرید، سوالات عمومی و پیگیری' },
]

const PRIORITIES: { id: TicketPriorityType; label: string; color: string }[] = [
  { id: 'low', label: 'کم', color: 'bg-slate-400' },
  { id: 'medium', label: 'متوسط', color: 'bg-blue-500' },
  { id: 'high', label: 'زیاد', color: 'bg-amber-500' },
  { id: 'urgent', label: 'بحرانی / فوری', color: 'bg-rose-500' },
]

export const ProfileSupportTab: React.FC<ProfileSupportTabProps> = ({
  orders,
  virtualOrders,
}) => {
  const [tickets, setTickets] = useState<TicketItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [refreshing, setRefreshing] = useState<boolean>(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Filtering & search state
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'open' | 'resolved' | 'closed'
  >('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Active detail modal state
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null)
  const [ticketDetail, setTicketDetail] = useState<TicketDetailResponse | null>(
    null,
  )
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false)
  const [replyText, setReplyText] = useState('')
  const [replyAttachments, setReplyAttachments] = useState<TicketAttachment[]>(
    [],
  )
  const [isUploadingReplyAtt, setIsUploadingReplyAtt] = useState(false)
  const [sendingReply, setSendingReply] = useState(false)
  const [replyNotifySMS, setReplyNotifySMS] = useState(true)

  // Create new ticket modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newSubject, setNewSubject] = useState('')
  const [newDepartment, setNewDepartment] = useState('license_support')
  const [newPriority, setNewPriority] = useState<TicketPriorityType>('medium')
  const [newRelatedOrder, setNewRelatedOrder] = useState('')
  const [newMessage, setNewMessage] = useState('')
  const [newNotifySMS, setNewNotifySMS] = useState(true)
  const [newNotifyEmail, setNewNotifyEmail] = useState(true)
  const [newAttachments, setNewAttachments] = useState<TicketAttachment[]>([])
  const [isUploadingNewAtt, setIsUploadingNewAtt] = useState(false)
  const [submittingTicket, setSubmittingTicket] = useState(false)

  // Lightbox zoom modal
  const [zoomImage, setZoomImage] = useState<string | null>(null)

  // Satisfaction rating modal / state
  const [ratingVal, setRatingVal] = useState(5)
  const [ratingComment, setRatingComment] = useState('')
  const [submittingRating, setSubmittingRating] = useState(false)
  const [ratedSuccess, setRatedSuccess] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const replyFileInputRef = useRef<HTMLInputElement | null>(null)
  const newFileInputRef = useRef<HTMLInputElement | null>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // 1. Fetch tickets from backend
  const loadTickets = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true)
    else setRefreshing(true)
    setErrorMsg(null)

    try {
      const data = await apiService.getMyTickets()
      setTickets(data)
    } catch (err: any) {
      setErrorMsg(err.message || 'خطا در ارتباط با سرور تیکتینگ')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadTickets()
  }, [loadTickets])

  // 2. Fetch ticket detail when active
  const loadTicketDetail = useCallback(
    async (ticketId: string, quiet = false) => {
      if (!quiet) setLoadingDetail(true)
      try {
        const detail = await apiService.getTicketDetail(ticketId)
        setTicketDetail(detail)
        if (detail.ticket.satisfaction_rating) {
          setRatingVal(detail.ticket.satisfaction_rating)
          setRatingComment(detail.ticket.satisfaction_comment || '')
          setRatedSuccess(true)
        } else {
          setRatedSuccess(false)
        }
      } catch (err: any) {
        console.error('Error fetching ticket detail:', err)
      } finally {
        if (!quiet) setLoadingDetail(false)
      }
    },
    [],
  )

  useEffect(() => {
    if (activeTicketId) {
      loadTicketDetail(activeTicketId)
      const interval = setInterval(() => {
        loadTicketDetail(activeTicketId, true)
      }, 12000)
      return () => clearInterval(interval)
    }
    setTicketDetail(null)
  }, [activeTicketId, loadTicketDetail])

  useEffect(() => {
    if (ticketDetail) {
      scrollToBottom()
    }
  }, [ticketDetail?.messages.length])

  // File Upload Helper
  const handleUploadFile = async (
    file: File,
    onSuccess: (att: TicketAttachment) => void,
    setLoadingState: (l: boolean) => void,
  ) => {
    if (!file) return
    setLoadingState(true)
    try {
      const att = await apiService.uploadTicketAttachment(file)
      onSuccess(att)
    } catch (err: any) {
      alert(err.message || 'خطا در آپلود فایل')
    } finally {
      setLoadingState(false)
    }
  }

  // Handle Clipboard Paste for Images
  const handlePasteImage = (
    e: React.ClipboardEvent,
    onSuccess: (att: TicketAttachment) => void,
    setLoadingState: (l: boolean) => void,
  ) => {
    const items = e.clipboardData?.items
    if (!items) return

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile()
        if (file) {
          e.preventDefault()
          handleUploadFile(file, onSuccess, setLoadingState)
          break
        }
      }
    }
  }

  // Submit New Ticket
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSubject.trim() || !newMessage.trim()) return

    setSubmittingTicket(true)
    try {
      const res = await apiService.createTicket({
        subject: newSubject.trim(),
        department: newDepartment,
        priority: newPriority,
        related_order_no: newRelatedOrder || undefined,
        notify_via_sms: newNotifySMS,
        notify_via_email: newNotifyEmail,
        message: newMessage.trim(),
        attachments: newAttachments,
      })

      setIsCreateOpen(false)
      setNewSubject('')
      setNewMessage('')
      setNewRelatedOrder('')
      setNewAttachments([])

      // Refresh list and open newly created ticket
      await loadTickets(true)
      setActiveTicketId(res.ticket.id)
    } catch (err: any) {
      alert(err.message || 'خطا در ثبت تیکت')
    } finally {
      setSubmittingTicket(false)
    }
  }

  // Submit Reply
  const handleSendReply = async () => {
    if ((!replyText.trim() && replyAttachments.length === 0) || !activeTicketId)
      return

    setSendingReply(true)
    try {
      await apiService.replyTicket(activeTicketId, {
        message: replyText.trim() || 'ارسال فایل پیوست',
        attachments: replyAttachments,
        notify_via_sms: replyNotifySMS,
      })

      setReplyText('')
      setReplyAttachments([])
      await loadTicketDetail(activeTicketId, true)
      await loadTickets(true)
    } catch (err: any) {
      alert(err.message || 'خطا در ارسال پاسخ')
    } finally {
      setSendingReply(false)
    }
  }

  // Close Ticket
  const handleCloseTicket = async () => {
    if (!activeTicketId) return
    if (!confirm('آیا از بستن این تیکت اطمینان دارید؟')) return

    try {
      await apiService.closeTicket(activeTicketId)
      await loadTicketDetail(activeTicketId, true)
      await loadTickets(true)
    } catch (err: any) {
      alert(err.message || 'خطا در بستن تیکت')
    }
  }

  // Rate Ticket
  const handleSubmitRating = async () => {
    if (!activeTicketId) return
    setSubmittingRating(true)
    try {
      await apiService.rateTicket(activeTicketId, ratingVal, ratingComment)
      setRatedSuccess(true)
      await loadTicketDetail(activeTicketId, true)
      await loadTickets(true)
    } catch (err: any) {
      alert(err.message || 'خطا در ثبت امتیاز')
    } finally {
      setSubmittingRating(false)
    }
  }

  // Filtered Tickets
  const filteredTickets = tickets.filter((t) => {
    if (
      statusFilter === 'open' &&
      t.status !== 'awaiting_admin' &&
      t.status !== 'in_progress'
    )
      return false
    if (
      statusFilter === 'resolved' &&
      t.status !== 'awaiting_user' &&
      t.status !== 'resolved'
    )
      return false
    if (statusFilter === 'closed' && t.status !== 'closed') return false

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      const inSubject = t.subject.toLowerCase().includes(q)
      const inNum = t.ticket_number.toLowerCase().includes(q)
      const inOrder = t.related_order_no?.toLowerCase().includes(q)
      if (!inSubject && !inNum && !inOrder) return false
    }

    return true
  })

  // Format Persian Date
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

  const getDepartmentLabel = (deptKey: string) => {
    const found = DEPARTMENTS.find((d) => d.id === deptKey)
    return found ? found.label.split('(')[0].trim() : deptKey
  }

  const getStatusBadge = (status: TicketStatusType) => {
    switch (status) {
      case 'awaiting_admin':
        return (
          <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[11px] font-medium">
            در انتظار پاسخ کارشناس
          </Badge>
        )
      case 'awaiting_user':
        return (
          <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-[11px] font-medium animate-pulse">
            پاسخ کارشناس دریافت شد
          </Badge>
        )
      case 'in_progress':
        return (
          <Badge className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 text-[11px] font-medium">
            در حال بررسی فنی
          </Badge>
        )
      case 'resolved':
        return (
          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[11px] font-medium">
            حل شده / پاسخ داده شده
          </Badge>
        )
      case 'closed':
        return (
          <Badge className="bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20 text-[11px] font-medium">
            بسته شده
          </Badge>
        )
    }
  }

  return (
    <div
      className="space-y-6 animate-in fade-in duration-300 max-w-5xl"
      dir="rtl"
    >
      {/* 1. Header Banner */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-linear-to-r from-blue-50/60 via-white to-purple-50/40 dark:from-slate-900 dark:via-slate-900/90 dark:to-blue-950/20 p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <LifeBuoy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                مرکز تیکتینگ و پشتیبانی هوشمند آناهیکس
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  متصل به دیتابیس زنده
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                پاسخگویی سریع توسط اپراتورهای ارشد • امکان پیوست فایل و
                اسکرین‌شات • اطلاع‌رسانی خودکار پیامکی
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <Button
            onClick={() => loadTickets(true)}
            variant="outline"
            size="sm"
            disabled={refreshing}
            className="h-10 px-3 rounded-xl border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-blue-600 text-xs font-semibold"
            title="به‌روزرسانی لیست تیکت‌ها"
          >
            <RefreshCw
              className={`w-4 h-4 ${refreshing ? 'animate-spin text-blue-600' : ''}`}
            />
          </Button>

          <Button
            onClick={() => setIsCreateOpen(true)}
            className="h-10 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex-1 sm:flex-none flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 active:scale-98 transition-all"
          >
            <Plus className="w-4 h-4" />
            ارسال تیکت پشتیبانی جدید
          </Button>
        </div>
      </div>

      {/* 2. Filter & Search Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl w-full sm:w-auto overflow-x-auto">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              statusFilter === 'all'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            همه تیکت‌ها ({tickets.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('open')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              statusFilter === 'open'
                ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            در انتظار پاسخ (
            {
              tickets.filter(
                (t) =>
                  t.status === 'awaiting_admin' || t.status === 'in_progress',
              ).length
            }
            )
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('resolved')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              statusFilter === 'resolved'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            پاسخ دریافت شده (
            {
              tickets.filter(
                (t) => t.status === 'awaiting_user' || t.status === 'resolved',
              ).length
            }
            )
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('closed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              statusFilter === 'closed'
                ? 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            بسته‌شده ({tickets.filter((t) => t.status === 'closed').length})
          </button>
        </div>

        <div className="w-full sm:w-64">
          <Input
            type="text"
            placeholder="جستجو در شناسه یا موضوع تیکت..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 text-xs rounded-xl border-slate-200 dark:border-slate-800"
          />
        </div>
      </div>

      {/* 3. Tickets List View */}
      {loading ? (
        <div className="p-16 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">
            در حال دریافت تیکت‌های پشتیبانی شما...
          </p>
        </div>
      ) : errorMsg ? (
        <div className="p-8 rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
          <p className="text-xs text-rose-600 dark:text-rose-400 font-bold">
            {errorMsg}
          </p>
          <Button
            onClick={() => loadTickets()}
            size="sm"
            variant="outline"
            className="text-xs rounded-xl"
          >
            تلاش مجدد
          </Button>
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="p-16 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center bg-white dark:bg-slate-900/40">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-3">
            <MessageSquare className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            {searchQuery || statusFilter !== 'all'
              ? 'تیکتی با این فیلترها یافت نشد'
              : 'هنوز هیچ تیکت پشتیبانی ثبت نکرده‌اید'}
          </h4>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            در صورت بروز هرگونه سوال پیرامون فعال‌سازی لایسنس، تحویل آنی اکانت‌ها،
            یا تاخیر پیامک شماره مجازی، پشتیبانان ما پاسخگوی شما هستند.
          </p>
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="mt-4 h-9 px-5 rounded-xl bg-blue-600 text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm shadow-blue-500/20"
          >
            <Plus className="w-4 h-4" />
            ارسال تیکت جدید
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTickets.map((ticket) => (
            <div
              key={ticket.id}
              onClick={() => setActiveTicketId(ticket.id)}
              className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <MessageSquare className="w-5 h-5" />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {ticket.subject}
                    </h4>
                    <span className="text-[11px] font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/80 px-2 py-0.5 rounded-md">
                      #{ticket.ticket_number}
                    </span>
                    {ticket.notify_via_sms && (
                      <span
                        className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded-md"
                        title="اطلاع‌رسانی پیامکی فعال است"
                      >
                        <Phone className="w-2.5 h-2.5" />
                        پیامک
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      دپارتمان: {getDepartmentLabel(ticket.department)}
                    </span>
                    {ticket.related_order_no && (
                      <>
                        <span>•</span>
                        <span className="text-purple-600 dark:text-purple-400 font-mono font-bold">
                          سفارش #{ticket.related_order_no}
                        </span>
                      </>
                    )}
                    <span>•</span>
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3" />
                      آخرین پاسخ:{' '}
                      {formatPersianDate(
                        ticket.last_reply_at || ticket.created_at,
                      )}
                    </span>
                    {ticket.satisfaction_rating ? (
                      <>
                        <span>•</span>
                        <span className="inline-flex items-center gap-0.5 text-amber-500 font-bold">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          {ticket.satisfaction_rating}/۵
                        </span>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-3 pt-3 sm:pt-0 border-t sm:border-0 border-slate-100 dark:border-slate-800">
                {getStatusBadge(ticket.status)}

                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs rounded-xl px-3 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-colors"
                >
                  مشاهده گفتگو ({ticket.messages_count})
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 4. Ticket Conversation Thread Modal */}
      {activeTicketId && ticketDetail && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in"
          dir="rtl"
        >
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col h-[90vh] max-h-[800px] animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                    {ticketDetail.ticket.subject}
                  </h3>
                  <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded-md">
                    #{ticketDetail.ticket.ticket_number}
                  </span>
                  {getStatusBadge(ticketDetail.ticket.status)}
                </div>

                <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
                  <span>
                    دپارتمان:{' '}
                    {getDepartmentLabel(ticketDetail.ticket.department)}
                  </span>
                  {ticketDetail.ticket.related_order_no && (
                    <>
                      <span>•</span>
                      <span className="text-purple-600 dark:text-purple-400 font-mono font-bold">
                        سفارش #{ticketDetail.ticket.related_order_no}
                      </span>
                    </>
                  )}
                  {ticketDetail.ticket.notify_via_sms && (
                    <>
                      <span>•</span>
                      <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                        <Phone className="w-3 h-3" />
                        اطلاع‌رسانی پیامک فعال
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => loadTicketDetail(activeTicketId, true)}
                  className="w-8 h-8 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-blue-600 flex items-center justify-center text-xs transition-colors"
                  title="تازه‌سازی گفتگو"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>

                {ticketDetail.ticket.status !== 'closed' && (
                  <button
                    type="button"
                    onClick={handleCloseTicket}
                    className="h-8 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium transition-colors"
                    title="بستن تیکت"
                  >
                    بستن تیکت
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setActiveTicketId(null)}
                  className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Conversation Messages Container */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-50/70 dark:bg-slate-950/70">
              {loadingDetail ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  <RefreshCw className="w-6 h-6 text-blue-600 animate-spin mx-auto mb-2" />
                  در حال بارگذاری سابقه پیام‌ها...
                </div>
              ) : (
                ticketDetail.messages.map((msg) => {
                  const isUser = msg.sender_type === 'customer'

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isUser ? 'items-start' : 'items-end'}`}
                    >
                      <div
                        className={`max-w-[88%] sm:max-w-[80%] p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                          isUser
                            ? 'bg-blue-600 text-white rounded-br-xs shadow-md shadow-blue-500/10'
                            : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-bl-xs shadow-xs'
                        }`}
                      >
                        {/* Message Header */}
                        <div
                          className={`flex items-center justify-between gap-4 mb-2 pb-1.5 border-b text-[11px] font-mono ${
                            isUser
                              ? 'border-blue-500/40 text-blue-100'
                              : 'border-slate-100 dark:border-slate-800 text-slate-400'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            {!isUser && (
                              <ShieldCheck className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                            )}
                            <span className="font-bold font-sans">
                              {isUser
                                ? 'شما (کاربر)'
                                : msg.sender_name || 'کارشناس رسمی آناهیکس'}
                            </span>
                          </div>
                          <span className="text-[10px]">
                            {formatPersianDate(msg.created_at)}
                          </span>
                        </div>

                        {/* Message Text */}
                        <p className="whitespace-pre-wrap font-sans">
                          {msg.message}
                        </p>

                        {/* Attachments Section */}
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="mt-3 pt-2.5 border-t border-slate-200/40 dark:border-slate-700/40 space-y-2">
                            <span
                              className={`text-[10px] font-bold block ${isUser ? 'text-blue-100' : 'text-slate-400'}`}
                            >
                              پیوست‌ها ({msg.attachments.length}):
                            </span>

                            <div className="flex flex-wrap gap-2">
                              {msg.attachments.map((att) => (
                                <div key={att.id} className="relative group">
                                  {att.is_image ? (
                                    <div
                                      onClick={() => setZoomImage(att.file_url)}
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
                                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-mono transition-colors ${
                                        isUser
                                          ? 'border-blue-400 bg-blue-700/50 hover:bg-blue-700 text-white'
                                          : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                                      }`}
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
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Satisfaction Rating Box (if resolved/closed) */}
            {(ticketDetail.ticket.status === 'resolved' ||
              ticketDetail.ticket.status === 'closed') && (
              <div className="p-3.5 bg-amber-50/60 dark:bg-amber-950/20 border-t border-amber-200/50 dark:border-amber-900/30">
                {ratedSuccess ? (
                  <div className="flex items-center justify-between text-xs text-amber-800 dark:text-amber-300 font-bold">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      نظر شما برای این تیکت ثبت شده است ({ratingVal} از ۵ ستاره)
                    </span>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${
                            s <= ratingVal
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        نحوه پاسخگویی و رفع مشکل خود را ارزیابی فرمایید:
                      </span>

                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setRatingVal(s)}
                            className="p-1 hover:scale-110 transition-transform"
                          >
                            <Star
                              className={`w-4 h-4 ${
                                s <= ratingVal
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-slate-300 dark:text-slate-600'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Input
                        type="text"
                        placeholder="نظر یا پیشنهاد شما درباره پاسخگویی (اختیاری)..."
                        value={ratingComment}
                        onChange={(e) => setRatingComment(e.target.value)}
                        className="h-8 text-xs rounded-xl bg-white dark:bg-slate-900"
                      />
                      <Button
                        size="sm"
                        onClick={handleSubmitRating}
                        disabled={submittingRating}
                        className="h-8 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shrink-0"
                      >
                        ثبت امتیاز
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Reply Input Box */}
            <div className="p-3 sm:p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
              {/* Attachment Preview Chips */}
              {replyAttachments.length > 0 && (
                <div className="flex flex-wrap gap-2 pb-1">
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

              <div className="flex items-center gap-2">
                <input
                  ref={replyFileInputRef}
                  type="file"
                  className="hidden"
                  accept="image/*,.pdf,.zip,.log,.txt"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) {
                      handleUploadFile(
                        f,
                        (att) =>
                          setReplyAttachments([...replyAttachments, att]),
                        setIsUploadingReplyAtt,
                      )
                    }
                  }}
                />

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isUploadingReplyAtt}
                  onClick={() => replyFileInputRef.current?.click()}
                  className="h-10 px-3 rounded-xl border-slate-200 dark:border-slate-800 text-slate-500 hover:text-blue-600 text-xs shrink-0"
                  title="پیوست تصویر، اسکرین‌شات یا فایل"
                >
                  <Paperclip
                    className={`w-4 h-4 ${isUploadingReplyAtt ? 'animate-pulse text-blue-600' : ''}`}
                  />
                </Button>

                <Input
                  type="text"
                  placeholder="پاسخ خود را بنویسید (اسکرین‌شات را می‌توانید مستقیم Paste کنید)..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === 'Enter' && !e.shiftKey && handleSendReply()
                  }
                  onPaste={(e) =>
                    handlePasteImage(
                      e,
                      (att) => setReplyAttachments([...replyAttachments, att]),
                      setIsUploadingReplyAtt,
                    )
                  }
                  className="h-10 text-xs sm:text-sm rounded-xl flex-1 border-slate-200 dark:border-slate-800"
                />

                <Button
                  onClick={handleSendReply}
                  disabled={
                    sendingReply ||
                    (!replyText.trim() && replyAttachments.length === 0)
                  }
                  className="h-10 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shrink-0 active:scale-98 transition-all"
                >
                  <Send className="w-4 h-4 ml-1.5" />
                  ارسال
                </Button>
              </div>

              {/* Preferences footer in reply box */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 pt-1">
                <label className="flex items-center gap-1.5 cursor-pointer hover:text-slate-600 dark:hover:text-slate-300">
                  <input
                    type="checkbox"
                    checked={replyNotifySMS}
                    onChange={(e) => setReplyNotifySMS(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                  />
                  <span>ارسال پیامک با دریافت پاسخ جدید از پشتیبانی</span>
                </label>
                <span className="hidden sm:inline">
                  کلید Enter جهت ارسال سریع
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Create New Ticket Modal with Order Linking & File Upload */}
      {isCreateOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in"
          dir="rtl"
        >
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-5 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center">
                  <LifeBuoy className="w-4 h-4" />
                </div>
                ثبت تیکت پشتیبانی جدید
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  موضوع تیکت <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="مثال: مشکل در تایید شماره تلگرام یا خطای لایسنس"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  className="h-10 rounded-xl"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    دپارتمان پشتیبانی
                  </label>
                  <select
                    value={newDepartment}
                    onChange={(e) => setNewDepartment(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs"
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    اولویت تیکت
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) =>
                      setNewPriority(e.target.value as TicketPriorityType)
                    }
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs"
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Order Linking Selector */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  اتصال به سفارش مرتبط (اختیاری)
                </label>
                <select
                  value={newRelatedOrder}
                  onChange={(e) => setNewRelatedOrder(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-mono"
                >
                  <option value="">بدون اتصال به سفارش مشخص</option>
                  {orders && orders.length > 0 && (
                    <optgroup label="سفارش‌های اشتراک و اکانت هوش مصنوعی">
                      {orders.map((o) => (
                        <option key={o.order_no} value={o.order_no}>
                          #{o.order_no} — {o.product_title} (
                          {o.amount_toman?.toLocaleString()} تومان)
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {virtualOrders && virtualOrders.length > 0 && (
                    <optgroup label="سفارش‌های شماره مجازی (5SIM)">
                      {virtualOrders.map((v) => (
                        <option key={v.order_no} value={v.order_no}>
                          #{v.order_no} — {v.service_name_fa} (
                          {v.country_name_fa})
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  اتصال تیکت به شماره سفارش، سرعت پردازش درخواست را تا ۳ برابر
                  افزایش می‌دهد.
                </p>
              </div>

              {/* Message Box with Paste Support */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  شرح مشکل یا سوال با جزئیات{' '}
                  <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  placeholder="لطفاً شرح کامل مشکل را بنویسید. همچنین می‌توانید اسکرین‌شات از خطای لایسنس را مستقیماً با Ctrl+V پیوست نمایید..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onPaste={(e) =>
                    handlePasteImage(
                      e,
                      (att) => setNewAttachments([...newAttachments, att]),
                      setIsUploadingNewAtt,
                    )
                  }
                  className="w-full p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
                  required
                />
              </div>

              {/* File / Screenshot Attachment Uploader */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    پیوست اسکرین‌شات از خطا یا فاکتور
                  </label>
                  <span className="text-[11px] text-slate-400">
                    حداکثر ۱۰ مگابایت
                  </span>
                </div>

                <input
                  ref={newFileInputRef}
                  type="file"
                  className="hidden"
                  accept="image/*,.pdf,.zip,.log,.txt"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) {
                      handleUploadFile(
                        f,
                        (att) => setNewAttachments([...newAttachments, att]),
                        setIsUploadingNewAtt,
                      )
                    }
                  }}
                />

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isUploadingNewAtt}
                    onClick={() => newFileInputRef.current?.click()}
                    className="h-9 px-3.5 rounded-xl border-dashed border-slate-300 dark:border-slate-700 text-xs font-semibold hover:border-blue-500 hover:text-blue-600 flex items-center gap-1.5"
                  >
                    <Paperclip className="w-3.5 h-3.5" />
                    {isUploadingNewAtt
                      ? 'در حال آپلود...'
                      : 'افزودن فایل پیوست'}
                  </Button>

                  {newAttachments.map((att, idx) => (
                    <div
                      key={att.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-[11px] text-blue-700 dark:text-blue-300 font-mono"
                    >
                      {att.is_image ? (
                        <ImageIcon className="w-3.5 h-3.5 text-blue-500" />
                      ) : (
                        <FileText className="w-3.5 h-3.5" />
                      )}
                      <span className="truncate max-w-[120px]">
                        {att.file_name}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setNewAttachments(
                            newAttachments.filter((_, i) => i !== idx),
                          )
                        }
                        className="text-slate-400 hover:text-rose-500 mr-1"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notification Toggles */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800 space-y-2">
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                  تنظیمات اطلاع‌رسانی خودکار:
                </span>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newNotifySMS}
                      onChange={(e) => setNewNotifySMS(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-emerald-500" />
                      ارسال پیامک به محض پاسخ کارشناس پشتیبانی
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newNotifyEmail}
                      onChange={(e) => setNewNotifyEmail(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <span className="text-slate-700 dark:text-slate-300">
                      ارسال ایمیل
                    </span>
                  </label>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
                  className="h-10 text-xs rounded-xl px-4"
                >
                  انصراف
                </Button>
                <Button
                  type="submit"
                  disabled={submittingTicket || isUploadingNewAtt}
                  className="h-10 px-6 text-xs rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-600/20 active:scale-98 transition-all"
                >
                  {submittingTicket ? 'در حال ثبت...' : 'ثبت و ارسال تیکت'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Lightbox Zoom Modal for Images */}
      {zoomImage && (
        <div
          onClick={() => setZoomImage(null)}
          className="fixed inset-0 z-60 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
        >
          <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl">
            <button
              type="button"
              onClick={() => setZoomImage(null)}
              className="absolute top-3 right-3 w-9 h-9 rounded-full bg-slate-900/80 text-white flex items-center justify-center hover:bg-slate-900 transition-colors z-10"
            >
              ✕
            </button>
            <img
              src={zoomImage}
              alt="پیوست تصویر بزرگنمایی"
              className="max-w-full max-h-[85vh] object-contain rounded-2xl"
            />
          </div>
        </div>
      )}
    </div>
  )
}
