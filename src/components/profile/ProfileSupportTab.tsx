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
import { createPortal } from 'react-dom'
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
import { toPersianDigits } from '../../utils/formatters'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { ConfirmModal } from '../vibefarsi/ConfirmModal'
import { ModalCloseButton } from '../vibefarsi/ModalCloseButton'
import { useNotification } from '../vibefarsi/NotificationContext'
import { ToggleSwitch } from '../vibefarsi/ToggleSwitch'

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
  const { success: notifySuccess, error: notifyError } = useNotification()
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
  const [closeTicketConfirm, setCloseTicketConfirm] = useState(false)
  const [closingTicketLoading, setClosingTicketLoading] = useState(false)
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

  // Chunked pagination / Load more state
  const [visibleTicketsCount, setVisibleTicketsCount] = useState<number>(5)

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
      notifyError('خطا در آپلود فایل', err.message || 'خطا در آپلود فایل')
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
      notifySuccess('ثبت تیکت', 'تیکت پشتیبانی شما با موفقیت ثبت شد.')
    } catch (err: any) {
      notifyError('خطا در ثبت تیکت', err.message || 'خطا در ثبت تیکت')
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
      notifySuccess('ارسال پاسخ', 'پاسخ شما با موفقیت ارسال شد.')
      await loadTicketDetail(activeTicketId, true)
      await loadTickets(true)
    } catch (err: any) {
      notifyError('خطا در ارسال پاسخ', err.message || 'خطا در ارسال پاسخ')
    } finally {
      setSendingReply(false)
    }
  }

  // Close Ticket
  const handleCloseTicket = () => {
    if (!activeTicketId) return
    setCloseTicketConfirm(true)
  }

  const confirmCloseTicket = async () => {
    if (!activeTicketId) return
    setClosingTicketLoading(true)

    try {
      await apiService.closeTicket(activeTicketId)
      notifySuccess('بستن تیکت', 'تیکت با موفقیت بسته شد.')
      setCloseTicketConfirm(false)
      await loadTicketDetail(activeTicketId, true)
      await loadTickets(true)
    } catch (err: any) {
      notifyError('خطا در بستن تیکت', err.message || 'خطا در بستن تیکت')
    } finally {
      setClosingTicketLoading(false)
    }
  }

  // Rate Ticket
  const handleSubmitRating = async () => {
    if (!activeTicketId) return
    setSubmittingRating(true)
    try {
      await apiService.rateTicket(activeTicketId, ratingVal, ratingComment)
      setRatedSuccess(true)
      notifySuccess('ثبت امتیاز', 'امتیاز شما با موفقیت ثبت شد.')
      await loadTicketDetail(activeTicketId, true)
      await loadTickets(true)
    } catch (err: any) {
      notifyError('خطا در ثبت امتیاز', err.message || 'خطا در ثبت امتیاز')
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
          <span className="bg-brand/10 text-brand border border-brand/30 rounded-control px-2.5 py-0.5 text-[11px] font-bold">
            در انتظار پاسخ کارشناس
          </span>
        )
      case 'awaiting_user':
        return (
          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-control px-2.5 py-0.5 text-[11px] font-bold animate-pulse">
            پاسخ کارشناس دریافت شد
          </span>
        )
      case 'in_progress':
        return (
          <span className="bg-secondary text-secondary-foreground border border-border/60 rounded-control px-2.5 py-0.5 text-[11px] font-bold">
            در حال بررسی فنی
          </span>
        )
      case 'resolved':
        return (
          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-control px-2.5 py-0.5 text-[11px] font-bold">
            حل شده / پاسخ داده شده
          </span>
        )
      case 'closed':
        return (
          <span className="bg-muted text-muted-foreground border border-border/40 rounded-control px-2.5 py-0.5 text-[11px] font-bold">
            بسته شده
          </span>
        )
    }
  }

  return (
    <div
      className="space-y-6 animate-in fade-in duration-300 max-w-5xl text-right"
      dir="rtl"
    >
      {/* 1. Filter, Search & Actions Controls */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Filters */}
        <div className="flex items-center gap-1.5 p-1 bg-muted/40 rounded-control border border-border/40 overflow-x-auto text-xs shrink-0">
          <button
            type="button"
            onClick={() => {
              setStatusFilter('all')
              setVisibleTicketsCount(5)
            }}
            className={`px-3 py-1.5 rounded-control font-bold duration-motion ease-motion transition-all whitespace-nowrap cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-primary text-primary-foreground font-black shadow-control'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            همه تیکت‌ها ({toPersianDigits(tickets.length)})
          </button>
          <button
            type="button"
            onClick={() => {
              setStatusFilter('open')
              setVisibleTicketsCount(5)
            }}
            className={`px-3 py-1.5 rounded-control font-bold duration-motion ease-motion transition-all whitespace-nowrap cursor-pointer ${
              statusFilter === 'open'
                ? 'bg-primary text-primary-foreground font-black shadow-control'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            در انتظار پاسخ (
            {toPersianDigits(
              tickets.filter(
                (t) =>
                  t.status === 'awaiting_admin' || t.status === 'in_progress',
              ).length,
            )}
            )
          </button>
          <button
            type="button"
            onClick={() => {
              setStatusFilter('resolved')
              setVisibleTicketsCount(5)
            }}
            className={`px-3 py-1.5 rounded-control font-bold duration-motion ease-motion transition-all whitespace-nowrap cursor-pointer ${
              statusFilter === 'resolved'
                ? 'bg-primary text-primary-foreground font-black shadow-control'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            پاسخ دریافت شده (
            {toPersianDigits(
              tickets.filter(
                (t) => t.status === 'awaiting_user' || t.status === 'resolved',
              ).length,
            )}
            )
          </button>
          <button
            type="button"
            onClick={() => {
              setStatusFilter('closed')
              setVisibleTicketsCount(5)
            }}
            className={`px-3 py-1.5 rounded-control font-bold duration-motion ease-motion transition-all whitespace-nowrap cursor-pointer ${
              statusFilter === 'closed'
                ? 'bg-primary text-primary-foreground font-black shadow-control'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            بسته‌شده (
            {toPersianDigits(
              tickets.filter((t) => t.status === 'closed').length,
            )}
            )
          </button>
        </div>

        {/* Search, Refresh and Create Button Group */}
        <div className="flex items-center gap-2 flex-1 sm:flex-initial justify-end">
          <div className="relative flex-1 sm:w-64">
            <input
              type="text"
              placeholder="جستجو در شناسه یا موضوع تیکت..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setVisibleTicketsCount(5)
              }}
              className="w-full h-10 px-3.5 text-xs rounded-field bg-muted/20 border border-border/60 text-foreground outline-none focus:border-brand transition-colors"
            />
          </div>

          <button
            type="button"
            onClick={() => loadTickets(true)}
            disabled={refreshing}
            className="h-10 w-10 shrink-0 rounded-control border border-border/60 bg-card hover:bg-muted text-foreground flex items-center justify-center duration-motion ease-motion active:scale-[0.98] cursor-pointer shadow-control"
            title="به‌روزرسانی لیست تیکت‌ها"
          >
            <RefreshCw
              className={`w-4 h-4 ${refreshing ? 'animate-spin text-brand' : 'text-muted-foreground'}`}
            />
          </button>

          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="h-10 px-4 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs duration-motion ease-motion active:scale-[0.98] shadow-control flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">ارسال تیکت جدید</span>
            <span className="sm:hidden">تیکت جدید</span>
          </button>
        </div>
      </div>

      {/* 3. Tickets List View */}
      {loading ? (
        <div className="p-16 rounded-surface border border-border/60 bg-card text-center space-y-3 shadow-surface">
          <RefreshCw className="w-8 h-8 text-brand animate-spin mx-auto" />
          <p className="text-xs text-muted-foreground font-medium">
            در حال دریافت تیکت‌های پشتیبانی شما...
          </p>
        </div>
      ) : errorMsg ? (
        <div className="p-8 rounded-surface border border-destructive/30 bg-destructive/10 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-destructive mx-auto" />
          <p className="text-xs text-destructive font-bold">{errorMsg}</p>
          <button
            type="button"
            onClick={() => loadTickets()}
            className="h-9 px-4 rounded-control border border-border/60 bg-card hover:bg-muted text-xs font-bold text-foreground"
          >
            تلاش مجدد
          </button>
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="p-16 rounded-surface border border-dashed border-border/60 text-center bg-card shadow-surface space-y-3">
          <div className="w-12 h-12 rounded-control bg-secondary text-secondary-foreground border border-border/60 flex items-center justify-center mx-auto shadow-control">
            <MessageSquare className="w-6 h-6 text-brand" />
          </div>
          <h4 className="text-sm font-bold text-foreground">
            {searchQuery || statusFilter !== 'all'
              ? 'تیکتی با این فیلترها یافت نشد'
              : 'هنوز هیچ تیکت پشتیبانی ثبت نکرده‌اید'}
          </h4>
          <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
            در صورت بروز هرگونه سوال پیرامون فعال‌سازی لایسنس، تحویل آنی اکانت‌ها،
            یا تاخیر پیامک شماره مجازی، پشتیبانان ما پاسخگوی شما هستند.
          </p>
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="mt-3 h-10 px-5 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs duration-motion ease-motion active:scale-[0.98] shadow-control inline-flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>ارسال تیکت جدید</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTickets.slice(0, visibleTicketsCount).map((ticket) => (
            <div
              key={ticket.id}
              onClick={() => setActiveTicketId(ticket.id)}
              className="p-5 rounded-surface border border-border/60 bg-card text-card-foreground shadow-surface hover:border-border duration-motion ease-motion transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-control bg-secondary text-secondary-foreground border border-border/60 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-control">
                  <MessageSquare className="w-5 h-5 text-brand" />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-xs sm:text-sm font-bold text-foreground group-hover:text-foreground/80 transition-colors">
                      {ticket.subject}
                    </h4>
                    <span className="text-[11px] font-mono font-bold text-brand bg-brand/10 border border-brand/20 px-2 py-0.5 rounded-control">
                      #{ticket.ticket_number}
                    </span>
                    {ticket.notify_via_sms && (
                      <span
                        className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-control"
                        title="اطلاع‌رسانی پیامکی فعال است"
                      >
                        <Phone className="w-2.5 h-2.5" />
                        پیامک
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                    <span className="font-medium text-foreground">
                      دپارتمان: {getDepartmentLabel(ticket.department)}
                    </span>
                    {ticket.related_order_no && (
                      <>
                        <span>•</span>
                        <span className="text-brand font-mono font-bold">
                          سفارش #{ticket.related_order_no}
                        </span>
                      </>
                    )}
                    <span>•</span>
                    <span className="flex items-center gap-1 font-mono font-latin">
                      <Clock className="w-3 h-3 text-brand" />
                      آخرین پاسخ:{' '}
                      {formatPersianDate(
                        ticket.last_reply_at || ticket.created_at,
                      )}
                    </span>
                    {ticket.satisfaction_rating ? (
                      <>
                        <span>•</span>
                        <span className="inline-flex items-center gap-0.5 text-brand font-bold font-latin">
                          <Star className="w-3 h-3 fill-brand text-brand" />
                          {toPersianDigits(ticket.satisfaction_rating)}/۵
                        </span>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-3 pt-3 sm:pt-0 border-t sm:border-0 border-border/40">
                {getStatusBadge(ticket.status)}

                <button
                  type="button"
                  className="h-8 text-xs rounded-control px-3.5 border border-border/60 bg-muted/30 hover:bg-muted text-foreground font-bold duration-motion ease-motion active:scale-[0.98] transition-colors"
                >
                  مشاهده گفتگو ({toPersianDigits(ticket.messages_count)})
                </button>
              </div>
            </div>
          ))}

          {/* Load More Tickets Button */}
          {visibleTicketsCount < filteredTickets.length && (
            <div className="pt-3 text-center">
              <button
                type="button"
                onClick={() => setVisibleTicketsCount((prev) => prev + 5)}
                className="h-10 px-5 rounded-control border border-border/60 bg-card hover:bg-muted text-foreground font-black text-xs duration-motion ease-motion active:scale-[0.98] shadow-control cursor-pointer inline-flex items-center gap-2"
              >
                <span>بارگذاری تیکت‌های بیشتر</span>
                <span className="text-[11px] text-muted-foreground font-latin">
                  (نمایش{' '}
                  {toPersianDigits(
                    Math.min(visibleTicketsCount, filteredTickets.length),
                  )}{' '}
                  از {toPersianDigits(filteredTickets.length)})
                </span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* 4. Ticket Conversation Thread Modal */}
      {activeTicketId &&
        ticketDetail &&
        createPortal(
          <div
            className="fixed inset-0 z-[99999] overflow-y-auto bg-black/75 backdrop-blur-md p-2 sm:p-4 animate-in fade-in"
            style={{ top: 0, left: 0, right: 0, bottom: 0 }}
            dir="rtl"
          >
            <div className="min-h-full w-full flex items-start sm:items-center justify-center">
              <div className="w-full max-w-2xl my-auto bg-card text-card-foreground rounded-surface border border-border/80 shadow-overlay overflow-hidden flex flex-col h-[90vh] max-h-[800px] animate-in zoom-in-95">
                {/* Modal Header */}
                <div className="p-4 sm:p-5 border-b border-border/60 bg-card flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm sm:text-base font-black text-foreground truncate">
                        {ticketDetail.ticket.subject}
                      </h3>
                      <span className="text-xs font-mono font-bold text-brand bg-brand/10 border border-brand/20 px-2 py-0.5 rounded-control font-latin">
                        #{ticketDetail.ticket.ticket_number}
                      </span>
                      {getStatusBadge(ticketDetail.ticket.status)}
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-1 flex-wrap">
                      <span>
                        دپارتمان:{' '}
                        {getDepartmentLabel(ticketDetail.ticket.department)}
                      </span>
                      {ticketDetail.ticket.related_order_no && (
                        <>
                          <span>•</span>
                          <span className="text-brand font-mono font-bold font-latin">
                            سفارش #{ticketDetail.ticket.related_order_no}
                          </span>
                        </>
                      )}
                      {ticketDetail.ticket.notify_via_sms && (
                        <>
                          <span>•</span>
                          <span className="text-emerald-400 flex items-center gap-1 font-medium">
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
                      className="w-8 h-8 rounded-control border border-border/60 bg-card hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center text-xs transition-colors cursor-pointer"
                      title="تازه‌سازی گفتگو"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>

                    {ticketDetail.ticket.status !== 'closed' && (
                      <button
                        type="button"
                        onClick={handleCloseTicket}
                        className="h-8 px-2.5 rounded-control border border-border/60 bg-card hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-medium transition-colors cursor-pointer"
                        title="بستن تیکت"
                      >
                        بستن تیکت
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setActiveTicketId(null)}
                      className="w-8 h-8 rounded-control bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Conversation Messages Container */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-muted/20">
                  {loadingDetail ? (
                    <div className="py-12 text-center text-xs text-muted-foreground">
                      <RefreshCw className="w-6 h-6 text-brand animate-spin mx-auto mb-2" />
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
                            className={`max-w-[88%] sm:max-w-[80%] p-4 rounded-surface text-xs sm:text-sm leading-relaxed ${
                              isUser
                                ? 'bg-primary text-primary-foreground rounded-br-xs shadow-control'
                                : 'bg-card text-foreground border border-border/60 rounded-bl-xs shadow-surface'
                            }`}
                          >
                            {/* Message Header */}
                            <div
                              className={`flex items-center justify-between gap-4 mb-2 pb-1.5 border-b text-[11px] font-mono font-latin ${
                                isUser
                                  ? 'border-primary-foreground/20 text-primary-foreground/80'
                                  : 'border-border/60 text-muted-foreground'
                              }`}
                            >
                              <div className="flex items-center gap-1.5">
                                {!isUser && (
                                  <ShieldCheck className="w-3.5 h-3.5 text-brand shrink-0" />
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
                          نظر شما برای این تیکت ثبت شده است ({ratingVal} از ۵
                          ستاره)
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
                <div className="p-3 sm:p-4 border-t border-border/60 bg-card space-y-2">
                  {/* Attachment Preview Chips */}
                  {replyAttachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 pb-1">
                      {replyAttachments.map((att, idx) => (
                        <div
                          key={att.id}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-control bg-secondary border border-border/80 text-[11px] text-foreground font-mono font-latin"
                        >
                          {att.is_image ? (
                            <ImageIcon className="w-3 h-3 text-brand" />
                          ) : (
                            <FileText className="w-3 h-3 text-muted-foreground" />
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
                            className="text-muted-foreground hover:text-destructive mr-1 cursor-pointer"
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

                    <button
                      type="button"
                      disabled={isUploadingReplyAtt}
                      onClick={() => replyFileInputRef.current?.click()}
                      className="h-10 px-3 rounded-control border border-border/60 bg-card hover:bg-muted text-muted-foreground hover:text-foreground text-xs shrink-0 cursor-pointer duration-motion active:scale-[0.98]"
                      title="پیوست تصویر، اسکرین‌شات یا فایل"
                    >
                      <Paperclip
                        className={`w-4 h-4 ${isUploadingReplyAtt ? 'animate-pulse text-brand' : ''}`}
                      />
                    </button>

                    <input
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
                          (att) =>
                            setReplyAttachments([...replyAttachments, att]),
                          setIsUploadingReplyAtt,
                        )
                      }
                      className="h-10 text-xs sm:text-sm rounded-field flex-1 border border-border/60 bg-muted/20 px-3 text-foreground outline-none focus:border-brand transition-colors"
                    />

                    <button
                      type="button"
                      onClick={handleSendReply}
                      disabled={
                        sendingReply ||
                        (!replyText.trim() && replyAttachments.length === 0)
                      }
                      className="h-10 px-4 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs shrink-0 active:scale-[0.98] duration-motion ease-motion shadow-control flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5 ml-1" />
                      <span>ارسال</span>
                    </button>
                  </div>

                  {/* Preferences footer in reply box */}
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1 pt-1">
                    <div className="flex items-center gap-2 select-none">
                      <ToggleSwitch
                        size="sm"
                        checked={replyNotifySMS}
                        onChange={setReplyNotifySMS}
                        ariaLabel="ارسال پیامک با دریافت پاسخ جدید"
                      />
                      <span>ارسال پیامک با دریافت پاسخ جدید از پشتیبانی</span>
                    </div>
                    <span className="hidden sm:inline">
                      کلید Enter جهت ارسال سریع
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* 5. Create New Ticket Modal with Order Linking & File Upload */}
      {isCreateOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[99999] overflow-y-auto bg-black/75 backdrop-blur-md p-3 sm:p-4 animate-in fade-in"
            style={{ top: 0, left: 0, right: 0, bottom: 0 }}
            dir="rtl"
          >
            <div className="min-h-full w-full flex items-start sm:items-center justify-center">
              <div className="w-full max-w-xl my-auto bg-card text-card-foreground rounded-surface border border-border/80 shadow-overlay p-5 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
                <div className="flex items-center justify-between pb-3 border-b border-border/60">
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <div className="w-7 h-7 rounded-control bg-secondary text-brand flex items-center justify-center">
                      <LifeBuoy className="w-4 h-4" />
                    </div>
                    <span>ثبت تیکت پشتیبانی جدید</span>
                  </h3>
                  <ModalCloseButton onClick={() => setIsCreateOpen(false)} />
                </div>

                <form
                  onSubmit={handleCreateTicket}
                  className="space-y-4 text-xs"
                >
                  <div>
                    <label className="block font-semibold text-foreground mb-1.5">
                      موضوع تیکت <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: مشکل در تایید شماره تلگرام یا خطای لایسنس"
                      value={newSubject}
                      onChange={(e) => setNewSubject(e.target.value)}
                      className="w-full h-10 px-3.5 rounded-field bg-muted/20 border border-border/60 text-foreground outline-none focus:border-brand transition-colors"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-foreground mb-1.5">
                        دپارتمان پشتیبانی
                      </label>
                      <select
                        value={newDepartment}
                        onChange={(e) => setNewDepartment(e.target.value)}
                        className="w-full h-10 px-3 rounded-field border border-border/60 bg-muted/20 text-foreground text-xs outline-none focus:border-brand transition-colors cursor-pointer"
                      >
                        {DEPARTMENTS.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-foreground mb-1.5">
                        اولویت تیکت
                      </label>
                      <select
                        value={newPriority}
                        onChange={(e) =>
                          setNewPriority(e.target.value as TicketPriorityType)
                        }
                        className="w-full h-10 px-3 rounded-field border border-border/60 bg-muted/20 text-foreground text-xs outline-none focus:border-brand transition-colors cursor-pointer"
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
                    <label className="block font-semibold text-foreground mb-1.5">
                      اتصال به سفارش مرتبط (اختیاری)
                    </label>
                    <select
                      value={newRelatedOrder}
                      onChange={(e) => setNewRelatedOrder(e.target.value)}
                      className="w-full h-10 px-3 rounded-field border border-border/60 bg-muted/20 text-foreground text-xs font-mono font-latin outline-none focus:border-brand transition-colors cursor-pointer"
                    >
                      <option value="">بدون اتصال به سفارش مشخص</option>
                      {orders && orders.length > 0 && (
                        <optgroup label="سفارش‌های اشتراک و اکانت هوش مصنوعی">
                          {orders.map((o) => (
                            <option key={o.order_no} value={o.order_no}>
                              #{o.order_no} — {o.product_title} (
                              {o.amount_toman?.toLocaleString('fa-IR')} تومان)
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
                    <p className="text-[11px] text-muted-foreground mt-1">
                      اتصال تیکت به شماره سفارش، سرعت پردازش درخواست را تا ۳
                      برابر افزایش می‌دهد.
                    </p>
                  </div>

                  {/* Message Box with Paste Support */}
                  <div>
                    <label className="block font-semibold text-foreground mb-1.5">
                      شرح مشکل یا سوال با جزئیات{' '}
                      <span className="text-destructive">*</span>
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
                      className="w-full p-3.5 rounded-field border border-border/60 bg-muted/20 text-foreground text-xs outline-none focus:border-brand leading-relaxed transition-colors"
                      required
                    />
                  </div>

                  {/* File / Screenshot Attachment Uploader */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="font-semibold text-foreground">
                        پیوست اسکرین‌شات از خطا یا فاکتور
                      </label>
                      <span className="text-[11px] text-muted-foreground">
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
                            (att) =>
                              setNewAttachments([...newAttachments, att]),
                            setIsUploadingNewAtt,
                          )
                        }
                      }}
                    />

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        disabled={isUploadingNewAtt}
                        onClick={() => newFileInputRef.current?.click()}
                        className="h-9 px-3.5 rounded-control border border-dashed border-border text-xs font-semibold hover:border-foreground/50 text-muted-foreground hover:text-foreground flex items-center gap-1.5 cursor-pointer duration-motion active:scale-[0.98]"
                      >
                        <Paperclip className="w-3.5 h-3.5" />
                        <span>
                          {isUploadingNewAtt
                            ? 'در حال آپلود...'
                            : 'افزودن فایل پیوست'}
                        </span>
                      </button>

                      {newAttachments.map((att, idx) => (
                        <div
                          key={att.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-control bg-secondary border border-border/80 text-[11px] text-foreground font-mono font-latin"
                        >
                          {att.is_image ? (
                            <ImageIcon className="w-3.5 h-3.5 text-brand" />
                          ) : (
                            <FileText className="w-3.5 h-3.5 text-muted-foreground" />
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
                            className="text-muted-foreground hover:text-destructive mr-1 cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Notification Toggles */}
                  <div className="p-3.5 rounded-control bg-muted/20 border border-border/60 space-y-2">
                    <span className="text-[11px] font-bold text-foreground block">
                      تنظیمات اطلاع‌رسانی خودکار:
                    </span>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2 select-none">
                        <ToggleSwitch
                          size="sm"
                          checked={newNotifySMS}
                          onChange={setNewNotifySMS}
                          ariaLabel="ارسال پیامک به محض پاسخ کارشناس"
                        />
                        <span className="text-foreground flex items-center gap-1 font-medium">
                          <Phone className="w-3.5 h-3.5 text-emerald-400" />
                          ارسال پیامک به محض پاسخ کارشناس پشتیبانی
                        </span>
                      </div>

                      <div className="flex items-center gap-2 select-none">
                        <ToggleSwitch
                          size="sm"
                          checked={newNotifyEmail}
                          onChange={setNewNotifyEmail}
                          ariaLabel="ارسال ایمیل"
                        />
                        <span className="text-foreground font-medium">
                          ارسال ایمیل
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Modal Buttons */}
                  <div className="pt-2 flex items-center justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => setIsCreateOpen(false)}
                      className="h-10 text-xs rounded-control px-4 border border-border/60 bg-card hover:bg-muted text-muted-foreground hover:text-foreground font-bold cursor-pointer duration-motion active:scale-[0.98]"
                    >
                      انصراف
                    </button>
                    <button
                      type="submit"
                      disabled={submittingTicket || isUploadingNewAtt}
                      className="h-10 px-6 text-xs rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black shadow-control active:scale-[0.98] duration-motion ease-motion cursor-pointer disabled:opacity-50"
                    >
                      {submittingTicket ? 'در حال ثبت...' : 'ثبت و ارسال تیکت'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* 6. Lightbox Zoom Modal for Images (Portal to document.body with z-[999999] so it never renders under ticket modal) */}
      {zoomImage &&
        createPortal(
          <div
            onClick={() => setZoomImage(null)}
            className="fixed inset-0 z-[999999] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
          >
            <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-surface border border-white/20 shadow-2xl">
              <button
                type="button"
                onClick={() => setZoomImage(null)}
                className="absolute top-3 right-3 w-9 h-9 rounded-control bg-black/80 hover:bg-black text-white flex items-center justify-center transition-colors z-10 cursor-pointer"
              >
                <X className="w-4 h-4" />
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

      {/* Close Ticket Confirmation Modal */}
      <ConfirmModal
        isOpen={closeTicketConfirm}
        title="بستن تیکت پشتیبانی"
        message="آیا از بستن و پایان رسیدگی به این تیکت اطمینان دارید؟ در صورت نیاز می‌توانید در آینده تیکت جدید ثبت نمایید."
        confirmText="بله، تیکت بسته شود"
        cancelText="انصراف"
        loading={closingTicketLoading}
        onConfirm={confirmCloseTicket}
        onClose={() => setCloseTicketConfirm(false)}
      />
    </div>
  )
}
