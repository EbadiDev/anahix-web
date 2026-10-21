import {
  Check,
  CheckCircle2,
  Clock,
  Headphones,
  MessageSquare,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  Trash2,
  User,
  X,
  XCircle,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useState } from 'react'
import { apiService } from '../../services/api'
import type { AdminReviewStats, ReviewItem } from '../../types'
import { Button } from '../ui/button'
import { useNotification } from '../vibefarsi/NotificationContext'
import { SearchInput } from '../vibefarsi/SearchInput'

interface AdminReviewsViewProps {
  onStatsUpdated?: (stats: AdminReviewStats) => void
}

export const AdminReviewsView: React.FC<AdminReviewsViewProps> = ({
  onStatsUpdated,
}) => {
  const { success: notifySuccess, error: notifyError } = useNotification()
  const [reviews, setReviews] = useState<ReviewItem[]>([])
  const [stats, setStats] = useState<AdminReviewStats>({
    total_reviews: 0,
    pending_reviews: 0,
    approved_reviews: 0,
    rejected_reviews: 0,
    average_rating: 5.0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState<string>('pending') // default to pending for operator convenience
  const [searchQuery, setSearchQuery] = useState('')

  // Action states
  const [replyingReviewId, setReplyingReviewId] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [replyAuthor, setReplyAuthor] = useState('پشتیبانی رسمی آناهیکس')
  const [rejectingReviewId, setRejectingReviewId] = useState<string | null>(
    null,
  )
  const [rejectReason, setRejectReason] = useState('')
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>(
    {},
  )

  const fetchReviews = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiService.getAdminReviews({
        status: statusFilter === 'all' ? undefined : statusFilter,
        search: searchQuery || undefined,
        page: 1,
        page_size: 50,
      })

      if (res) {
        setReviews(res.items || [])
        setStats(res.stats)
        if (onStatsUpdated) onStatsUpdated(res.stats)
      }
    } catch (err: any) {
      setError(err.message || 'خطا در بارگذاری نظرات')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReviews()
  }, [statusFilter, searchQuery])

  const handleSearchSubmit = (val?: string) => {
    if (val !== undefined) setSearchQuery(val)
    fetchReviews()
  }

  // Action handlers
  const handleApprove = async (id: string) => {
    setActionLoading((prev) => ({ ...prev, [id]: true }))
    try {
      await apiService.updateAdminReviewStatus(id, 'approved')
      notifySuccess('تایید نظر', 'نظر با موفقیت تایید و در سایت منتشر شد.')
      await fetchReviews()
    } catch (err: any) {
      notifyError('خطا در تایید نظر', err.message)
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: false }))
    }
  }

  const handleRejectSubmit = async (id: string) => {
    setActionLoading((prev) => ({ ...prev, [id]: true }))
    try {
      await apiService.updateAdminReviewStatus(id, 'rejected', rejectReason)
      notifySuccess('رد نظر', 'نظر خریدار رد شد.')
      setRejectingReviewId(null)
      setRejectReason('')
      await fetchReviews()
    } catch (err: any) {
      notifyError('خطا در رد نظر', err.message)
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: false }))
    }
  }

  const handleReplySubmit = async (id: string) => {
    if (!replyText.trim()) return
    setActionLoading((prev) => ({ ...prev, [id]: true }))
    try {
      await apiService.replyAdminReview(id, replyText, replyAuthor)
      notifySuccess('ثبت پاسخ رسمی', 'پاسخ شما با موفقیت ثبت شد.')
      setReplyingReviewId(null)
      setReplyText('')
      await fetchReviews()
    } catch (err: any) {
      notifyError('خطا در ثبت پاسخ', err.message)
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: false }))
    }
  }

  const handleToggleFeature = async (id: string, current: boolean) => {
    setActionLoading((prev) => ({ ...prev, [id]: true }))
    try {
      await apiService.featureAdminReview(id, !current)
      notifySuccess(
        'وضعیت برگزیده',
        `نظر به عنوان ${!current ? 'برگزیده' : 'عادی'} تنظیم شد.`,
      )
      await fetchReviews()
    } catch (err: any) {
      notifyError('خطا در تغییر وضعیت برگزیده', err.message)
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: false }))
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('آیا از حذف کامل این نظر اطمینان دارید؟')) return
    setActionLoading((prev) => ({ ...prev, [id]: true }))
    try {
      await apiService.deleteAdminReview(id)
      notifySuccess('حذف نظر', 'نظر خریدار با موفقیت حذف شد.')
      await fetchReviews()
    } catch (err: any) {
      notifyError('خطا در حذف نظر', err.message)
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: false }))
    }
  }

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* HEADER & TOP STATS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-foreground">
            میز مدیریت نظرات و بازخورد خریداران (Social Proof)
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            بررسی و تایید نظرات متنی، ارسال پاسخ رسمی پشتیبانی و مدیریت نظرات
            برگزیده
          </p>
        </div>
        <Button
          type="button"
          onClick={fetchReviews}
          variant="outline"
          disabled={loading}
          className="rounded-xl text-xs h-9 px-3 gap-2"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`}
          />
          <span>بروزرسانی لیست</span>
        </Button>
      </div>

      {/* KPI METRIC CARDS */}
      {error && (
        <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-2xl bg-card border border-border space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>کل نظرات</span>
            <MessageSquare className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-foreground">
            {stats.total_reviews}
          </div>
          <p className="text-[10px] text-muted-foreground">ثبت شده در سیستم</p>
        </div>

        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-1">
          <div className="flex items-center justify-between text-xs text-amber-700 dark:text-amber-400 font-bold">
            <span>در انتظار تایید</span>
            <Clock className="h-4 w-4 text-amber-600 animate-pulse" />
          </div>
          <div className="text-2xl font-black text-amber-700 dark:text-amber-400">
            {stats.pending_reviews}
          </div>
          <p className="text-[10px] text-amber-600/80">نیازمند بررسی اپراتور</p>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-1">
          <div className="flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-400 font-bold">
            <span>تایید شده</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400">
            {stats.approved_reviews}
          </div>
          <p className="text-[10px] text-emerald-600/80">
            منتشر شده در فروشگاه
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>رد شده</span>
            <XCircle className="h-4 w-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-foreground">
            {stats.rejected_reviews}
          </div>
          <p className="text-[10px] text-muted-foreground">اسپم یا نامعتبر</p>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border space-y-1 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>میانگین رضایت</span>
            <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
          </div>
          <div className="text-2xl font-black text-foreground">
            {stats.average_rating > 0 ? stats.average_rating.toFixed(1) : '۵.۰'}
            <span className="text-xs font-normal text-muted-foreground mr-1">
              از ۵
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground">امتیاز کلی پلتفرم</p>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="p-4 rounded-2xl bg-card border border-border flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {[
            {
              id: 'pending',
              label: 'در انتظار تایید',
              badge: stats.pending_reviews,
            },
            { id: 'all', label: 'همه نظرات', badge: stats.total_reviews },
            {
              id: 'approved',
              label: 'تایید شده',
              badge: stats.approved_reviews,
            },
            { id: 'rejected', label: 'رد شده', badge: stats.rejected_reviews },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                statusFilter === tab.id
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                  : 'bg-muted/60 hover:bg-muted text-muted-foreground border border-border/50'
              }`}
            >
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    statusFilter === tab.id
                      ? 'bg-white/20 text-white'
                      : tab.id === 'pending'
                        ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold'
                        : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="w-full md:w-72">
          <SearchInput
            value={searchQuery}
            onChange={(val) => setSearchQuery(val)}
            onSearch={handleSearchSubmit}
            placeholder="جستجو در نام، موبایل، نظر..."
            debounceMs={350}
          />
        </div>
      </div>

      {/* REVIEWS LIST */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-16 text-center text-xs text-muted-foreground space-y-2">
            <RefreshCw className="h-6 w-6 text-blue-600 animate-spin mx-auto" />
            <p>در حال بارگذاری نظرات خریداران...</p>
          </div>
        ) : reviews.length > 0 ? (
          reviews.map((rev) => {
            const isReplying = replyingReviewId === rev.id
            const isRejecting = rejectingReviewId === rev.id
            const isBusy = actionLoading[rev.id]

            return (
              <div
                key={rev.id}
                className={`rounded-2xl border bg-card p-5 space-y-4 transition ${
                  rev.status === 'pending'
                    ? 'border-amber-500/40 bg-amber-500/[0.01]'
                    : rev.status === 'rejected'
                      ? 'border-rose-500/30 opacity-75'
                      : 'border-border'
                }`}
              >
                {/* Review Top Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/50 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground font-bold border border-border">
                      <User className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-foreground">
                          {rev.customer_name}
                        </span>
                        {rev.customer_phone && (
                          <span className="text-[11px] font-mono text-muted-foreground">
                            ({rev.customer_phone})
                          </span>
                        )}
                        {rev.is_verified_buyer && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                            <ShieldCheck className="h-3 w-3 text-emerald-600" />
                            <span>خریدار تاییدشده</span>
                          </span>
                        )}
                        {rev.is_featured && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20 px-2 py-0.5 rounded-full">
                            <Sparkles className="h-3 w-3 text-amber-500" />
                            <span>برگزیده</span>
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                        <span className="font-bold text-foreground/80">
                          محصول: {rev.product_title}
                        </span>
                        {rev.order_number && (
                          <>
                            <span>•</span>
                            <span className="font-mono text-[10px] bg-muted px-1.5 py-0.2 rounded">
                              #{rev.order_number}
                            </span>
                          </>
                        )}
                        <span>•</span>
                        <span>
                          {new Date(rev.created_at).toLocaleDateString('fa-IR')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status & Rating */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-amber-400">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`h-4 w-4 ${
                            s <= rev.rating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-muted-foreground/20'
                          }`}
                        />
                      ))}
                    </div>

                    <div>
                      {rev.status === 'pending' && (
                        <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-xl">
                          در انتظار تایید
                        </span>
                      )}
                      {rev.status === 'approved' && (
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-xl">
                          تایید شده
                        </span>
                      )}
                      {rev.status === 'rejected' && (
                        <span className="text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/30 px-2.5 py-1 rounded-xl">
                          رد شده
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Experience Tags */}
                {rev.experience_tags && rev.experience_tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {rev.experience_tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 text-xs font-medium bg-blue-50/50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-900/40 px-2.5 py-1 rounded-xl"
                      >
                        <Check className="h-3 w-3 stroke-[3]" />
                        <span>{tag}</span>
                      </span>
                    ))}
                  </div>
                )}

                {/* Review Text */}
                {rev.comment ? (
                  <div className="p-3.5 rounded-xl bg-muted/30 border border-border/50 text-xs sm:text-sm text-foreground leading-relaxed whitespace-pre-line">
                    {rev.comment}
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground italic">
                    (این نظر بدون متن و فقط با امتیاز و برچسب‌های تجربه خرید ثبت
                    شده است)
                  </div>
                )}

                {/* Rejection Reason if any */}
                {rev.rejection_reason && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-700 dark:text-rose-300 space-y-0.5">
                    <span className="font-bold">علت رد نظر:</span>
                    <p>{rev.rejection_reason}</p>
                  </div>
                )}

                {/* Existing Admin Reply */}
                {rev.admin_reply && !isReplying && (
                  <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/70 dark:border-blue-900/60 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold text-blue-700 dark:text-blue-300">
                      <div className="flex items-center gap-1.5">
                        <Headphones className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                        <span>
                          {rev.admin_reply_author ||
                            'پاسخ رسمی پشتیبانی آناهیکس'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {rev.admin_replied_at && (
                          <span className="text-[10px] text-muted-foreground font-normal">
                            {new Date(rev.admin_replied_at).toLocaleDateString(
                              'fa-IR',
                            )}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setReplyingReviewId(rev.id)
                            setReplyText(rev.admin_reply || '')
                          }}
                          className="text-[11px] text-blue-600 hover:underline"
                        >
                          ویرایش پاسخ
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-foreground/90 leading-relaxed pr-4 border-r-2 border-blue-600">
                      {rev.admin_reply}
                    </p>
                  </div>
                )}

                {/* Inline Reply Form */}
                {isReplying && (
                  <div className="p-4 rounded-2xl bg-muted/40 border border-blue-500/40 space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-foreground">
                      <span className="flex items-center gap-1.5">
                        <Headphones className="h-4 w-4 text-blue-600" />
                        <span>ارسال پاسخ مستقیم پشتیبانی به نظر خریدار</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setReplyingReviewId(null)}
                        className="text-muted-foreground hover:text-foreground text-xs"
                      >
                        انصراف
                      </button>
                    </div>
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="متن پاسخ رسمی پشتیبانی آناهیکس به این نظر را بنویسید..."
                      rows={3}
                      className="w-full rounded-xl border border-input bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-blue-600 leading-relaxed"
                    />
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        value={replyAuthor}
                        onChange={(e) => setReplyAuthor(e.target.value)}
                        placeholder="نام پاسخ‌دهنده (مثال: پشتیبانی رسمی آناهیکس)"
                        className="rounded-xl border border-input bg-background px-3 py-1.5 text-xs text-foreground w-64"
                      />
                      <Button
                        type="button"
                        onClick={() => handleReplySubmit(rev.id)}
                        disabled={isBusy || !replyText.trim()}
                        className="rounded-xl text-xs h-8 px-4 bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
                      >
                        <Send className="h-3.5 w-3.5" />
                        <span>ثبت و انتشار پاسخ</span>
                      </Button>
                    </div>
                  </div>
                )}

                {/* Inline Reject Reason Form */}
                {isRejecting && (
                  <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-rose-700 dark:text-rose-300">
                      <span>علت رد نظر (داخلی / جهت اطلاع)</span>
                      <button
                        type="button"
                        onClick={() => setRejectingReviewId(null)}
                        className="text-muted-foreground hover:text-foreground text-xs"
                      >
                        انصراف
                      </button>
                    </div>
                    <input
                      type="text"
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="دلیل رد نظر (مثال: حاوی شماره تماس یا اسپم، ادعای کذب بدون سفارش)"
                      className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs text-foreground"
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        onClick={() => handleRejectSubmit(rev.id)}
                        disabled={isBusy}
                        className="rounded-xl text-xs h-8 px-4 bg-rose-600 hover:bg-rose-700 text-white"
                      >
                        تایید و رد نظر
                      </Button>
                    </div>
                  </div>
                )}

                {/* MODERATION ACTION BUTTONS */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/50 text-xs">
                  <div className="flex items-center gap-2">
                    {/* Approve Button */}
                    {rev.status !== 'approved' && (
                      <Button
                        type="button"
                        onClick={() => handleApprove(rev.id)}
                        disabled={isBusy}
                        className="h-8 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1.5"
                      >
                        <Check className="h-3.5 w-3.5 stroke-[3]" />
                        <span>تایید و انتشار</span>
                      </Button>
                    )}

                    {/* Reject Button */}
                    {rev.status !== 'rejected' && (
                      <Button
                        type="button"
                        onClick={() => setRejectingReviewId(rev.id)}
                        disabled={isBusy}
                        variant="outline"
                        className="h-8 px-3 rounded-xl border-rose-500/30 hover:bg-rose-500/10 text-rose-600 text-xs font-bold gap-1.5"
                      >
                        <X className="h-3.5 w-3.5" />
                        <span>رد نظر</span>
                      </Button>
                    )}

                    {/* Reply Button */}
                    {!isReplying && (
                      <Button
                        type="button"
                        onClick={() => {
                          setReplyingReviewId(rev.id)
                          setReplyText(rev.admin_reply || '')
                        }}
                        disabled={isBusy}
                        variant="outline"
                        className="h-8 px-3 rounded-xl text-xs font-medium gap-1.5"
                      >
                        <MessageSquare className="h-3.5 w-3.5 text-blue-600" />
                        <span>
                          {rev.admin_reply ? 'ویرایش پاسخ' : 'پاسخ پشتیبانی'}
                        </span>
                      </Button>
                    )}

                    {/* Feature / Pin Toggle */}
                    <button
                      type="button"
                      onClick={() =>
                        handleToggleFeature(rev.id, rev.is_featured)
                      }
                      disabled={isBusy}
                      className={`h-8 px-3 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition ${
                        rev.is_featured
                          ? 'bg-amber-500/10 text-amber-600 border-amber-500/30 font-bold'
                          : 'bg-muted/30 hover:bg-muted text-muted-foreground border-border/60'
                      }`}
                    >
                      <Sparkles
                        className={`h-3.5 w-3.5 ${
                          rev.is_featured ? 'text-amber-500 fill-amber-500' : ''
                        }`}
                      />
                      <span>
                        {rev.is_featured ? 'برگزیده شده' : 'برگزیده کردن'}
                      </span>
                    </button>
                  </div>

                  {/* Delete Button */}
                  <div>
                    <button
                      type="button"
                      onClick={() => handleDelete(rev.id)}
                      disabled={isBusy}
                      className="h-8 px-2.5 rounded-xl hover:bg-rose-500/10 text-muted-foreground hover:text-rose-600 transition flex items-center gap-1 text-xs"
                      title="حذف دائمی نظر"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>حذف</span>
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        ) : (
          <div className="py-16 text-center bg-card border border-border rounded-2xl p-8 space-y-2">
            <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto" />
            <h4 className="font-bold text-sm text-foreground">
              هیچ نظری با وضعیت انتخابی یافت نشد
            </h4>
            <p className="text-xs text-muted-foreground">
              می‌توانید فیلتر وضعیت را به «همه نظرات» تغییر دهید.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
