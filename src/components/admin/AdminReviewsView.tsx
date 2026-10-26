import {
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Headphones,
  Mail,
  MessageSquare,
  Phone,
  RefreshCw,
  Send,
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
import type { AdminProduct, AdminReviewStats, ReviewItem } from '../../types'
import { ConfirmModal } from '../vibefarsi/ConfirmModal'
import { useNotification } from '../vibefarsi/NotificationContext'
import { SearchInput } from '../vibefarsi/SearchInput'

interface AdminReviewsViewProps {
  onStatsUpdated?: (stats: AdminReviewStats) => void
  refreshTrigger?: number
}

export const AdminReviewsView: React.FC<AdminReviewsViewProps> = ({
  onStatsUpdated,
  refreshTrigger,
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
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [selectedProduct, setSelectedProduct] = useState<string>('all')

  // Action states
  const [replyingReviewId, setReplyingReviewId] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [replyAuthor, setReplyAuthor] = useState('پشتیبانی رسمی آناهیکس')
  const [rejectingReviewId, setRejectingReviewId] = useState<string | null>(
    null,
  )
  const [rejectReason, setRejectReason] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean
    reviewId: string | null
    loading: boolean
  }>({
    isOpen: false,
    reviewId: null,
    loading: false,
  })
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>(
    {},
  )

  const fetchReviews = async (quiet = false) => {
    if (!quiet) setLoading(true)
    setError(null)
    try {
      const res = await apiService.getAdminReviews({
        status: statusFilter === 'all' ? undefined : statusFilter,
        product_id: selectedProduct === 'all' ? undefined : selectedProduct,
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
      if (!quiet) setLoading(false)
    }
  }

  useEffect(() => {
    apiService
      .adminListProducts()
      .then((prods) => {
        if (prods) setProducts(prods)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetchReviews()
  }, [statusFilter, selectedProduct, searchQuery, refreshTrigger])

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
      await fetchReviews(true)
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
      await fetchReviews(true)
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
      await fetchReviews(true)
    } catch (err: any) {
      notifyError('خطا در ثبت پاسخ', err.message)
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: false }))
    }
  }

  const handleToggleFeature = async (id: string, current: boolean) => {
    setActionLoading((prev) => ({ ...prev, [id]: true }))
    const nextState = !current
    // Optimistic local update to preserve scroll position perfectly
    setReviews((prev) =>
      prev.map((r) => (r.id === id ? { ...r, is_featured: nextState } : r)),
    )
    try {
      await apiService.featureAdminReview(id, nextState)
      notifySuccess(
        'وضعیت برگزیده',
        `نظر به عنوان ${nextState ? 'برگزیده' : 'عادی'} تنظیم شد.`,
      )
      await fetchReviews(true)
    } catch (err: any) {
      // Revert optimistic update
      setReviews((prev) =>
        prev.map((r) => (r.id === id ? { ...r, is_featured: current } : r)),
      )
      notifyError('خطا در تغییر وضعیت برگزیده', err.message)
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: false }))
    }
  }

  const handleDelete = (id: string) => {
    setDeleteConfirm({ isOpen: true, reviewId: id, loading: false })
  }

  const confirmDelete = async () => {
    if (!deleteConfirm.reviewId) return
    setDeleteConfirm((prev) => ({ ...prev, loading: true }))
    try {
      await apiService.deleteAdminReview(deleteConfirm.reviewId)
      notifySuccess('حذف نظر', 'نظر خریدار با موفقیت حذف شد.')
      setDeleteConfirm({ isOpen: false, reviewId: null, loading: false })
      await fetchReviews()
    } catch (err: any) {
      notifyError('خطا در حذف نظر', err.message)
      setDeleteConfirm((prev) => ({ ...prev, loading: false }))
    }
  }

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* TOP TITLE */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-foreground">
          میز مدیریت نظرات و بازخورد خریداران (Social Proof)
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          بررسی امتیازات، تایید، رد، برگزیده‌سازی و ارسال پاسخ رسمی پشتیبانی به
          خریداران
        </p>
      </div>

      {/* KPI METRIC CARDS */}
      {error && (
        <div className="p-3.5 rounded-control bg-destructive/10 border border-destructive/20 text-destructive text-xs font-bold">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-surface bg-card border border-border/80 shadow-surface space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-bold">
            <span>کل نظرات</span>
            <MessageSquare className="h-4 w-4 text-brand" />
          </div>
          <div className="text-2xl font-black text-foreground font-mono font-latin">
            {stats.total_reviews}
          </div>
          <p className="text-[10px] text-muted-foreground">ثبت شده در سیستم</p>
        </div>

        <div className="p-4 rounded-surface bg-card border border-amber-500/30 bg-amber-500/5 shadow-surface space-y-1">
          <div className="flex items-center justify-between text-xs text-amber-500 font-bold">
            <span>در انتظار تایید</span>
            <Clock className="h-4 w-4 text-amber-500 animate-pulse" />
          </div>
          <div className="text-2xl font-black text-amber-500 font-mono font-latin">
            {stats.pending_reviews}
          </div>
          <p className="text-[10px] text-muted-foreground">
            نیازمند بررسی اپراتور
          </p>
        </div>

        <div className="p-4 rounded-surface bg-card border border-emerald-500/30 bg-emerald-500/5 shadow-surface space-y-1">
          <div className="flex items-center justify-between text-xs text-emerald-500 font-bold">
            <span>تایید شده</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-500 font-mono font-latin">
            {stats.approved_reviews}
          </div>
          <p className="text-[10px] text-muted-foreground">
            منتشر شده در فروشگاه
          </p>
        </div>

        <div className="p-4 rounded-surface bg-card border border-border/80 shadow-surface space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-bold">
            <span>رد شده</span>
            <XCircle className="h-4 w-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-foreground font-mono font-latin">
            {stats.rejected_reviews}
          </div>
          <p className="text-[10px] text-muted-foreground">اسپم یا نامعتبر</p>
        </div>

        <div className="p-4 rounded-surface bg-card border border-border/80 shadow-surface space-y-1 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-bold">
            <span>میانگین رضایت</span>
            <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
          </div>
          <div className="text-2xl font-black text-foreground font-mono font-latin">
            {stats.average_rating > 0 ? stats.average_rating.toFixed(1) : '۵.۰'}
            <span className="text-xs font-normal text-muted-foreground mr-1 font-sans">
              از ۵
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground">امتیاز کلی پلتفرم</p>
        </div>
      </div>

      {/* FILTER & SEARCH BAR WITH PRODUCT SELECTOR */}
      <div className="p-4 rounded-surface bg-card border border-border/80 shadow-surface flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none shrink-0">
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
              className={`px-3.5 py-1.5 rounded-control text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer duration-motion active:scale-[0.98] ${
                statusFilter === tab.id
                  ? 'bg-primary text-primary-foreground shadow-control'
                  : 'bg-secondary hover:bg-muted text-foreground border border-border/60'
              }`}
            >
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-control font-mono font-latin ${
                    statusFilter === tab.id
                      ? 'bg-primary-foreground/20 text-primary-foreground'
                      : tab.id === 'pending'
                        ? 'bg-amber-500/15 text-amber-500 border border-amber-500/30 font-bold'
                        : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Product Filter & Search Input */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 lg:max-w-xl justify-end">
          {/* Product Filter Dropdown */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-bold text-muted-foreground whitespace-nowrap hidden sm:inline">
              محصول:
            </span>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="h-10 px-3 rounded-field border border-border/60 bg-muted/20 text-foreground text-xs font-bold outline-none focus:border-brand cursor-pointer w-full sm:w-56 truncate"
              title="فیلتر بر اساس محصول"
            >
              <option value="all">همه محصولات کاتالوگ</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title_fa} ({p.slug})
                </option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <SearchInput
              value={searchQuery}
              onChange={(val) => setSearchQuery(val)}
              onSearch={handleSearchSubmit}
              placeholder="جستجو در نام، موبایل، نظر..."
              debounceMs={350}
            />
          </div>
        </div>
      </div>

      {/* REVIEWS LIST */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-20 text-center text-xs text-muted-foreground space-y-3 rounded-surface border border-border/80 bg-card p-12 shadow-surface">
            <RefreshCw className="h-8 w-8 text-brand animate-spin mx-auto" />
            <p className="font-bold">در حال بارگذاری نظرات خریداران...</p>
          </div>
        ) : reviews.length > 0 ? (
          reviews.map((rev) => {
            const isReplying = replyingReviewId === rev.id
            const isRejecting = rejectingReviewId === rev.id
            const isBusy = actionLoading[rev.id]

            return (
              <div
                key={rev.id}
                className={`rounded-surface border bg-card p-5 space-y-4 shadow-surface transition ${
                  rev.status === 'pending'
                    ? 'border-amber-500/40 bg-amber-500/5'
                    : rev.status === 'rejected'
                      ? 'border-rose-500/40 bg-rose-500/5 opacity-80'
                      : 'border-border/80'
                }`}
              >
                {/* Review Top Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-control bg-secondary text-brand font-black flex items-center justify-center text-sm border border-border/60 shadow-xs shrink-0 font-latin overflow-hidden">
                      {rev.customer_avatar ? (
                        <img
                          src={rev.customer_avatar}
                          alt={rev.customer_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>{rev.customer_name?.charAt(0) || 'ک'}</span>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="relative inline-block group/user">
                          <span className="font-black text-sm text-foreground cursor-pointer hover:text-brand transition-colors py-1">
                            {rev.customer_name}
                          </span>
                          {/* VibeFarsi Interactive Tooltip on Hover */}
                          <div className="absolute top-full right-0 pt-1 hidden group-hover/user:block z-50 animate-in fade-in zoom-in-95 duration-150">
                            <div className="w-64 p-3 rounded-surface bg-card border border-border/80 shadow-overlay text-right space-y-2 select-text pointer-events-auto">
                              <div className="font-bold text-foreground border-b border-border/40 pb-1.5 flex items-center justify-between text-xs">
                                <span>اطلاعات تماس خریدار</span>
                                <User className="w-3.5 h-3.5 text-brand" />
                              </div>
                              <div className="flex items-center justify-between gap-2 p-1.5 rounded-control bg-secondary/50 border border-border/40 text-xs">
                                <div className="flex items-center gap-1.5 font-mono font-latin font-bold text-foreground">
                                  <Phone className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                  <span>{rev.customer_phone || '—'}</span>
                                </div>
                                {rev.customer_phone && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      if (rev.customer_phone) {
                                        navigator.clipboard.writeText(
                                          rev.customer_phone,
                                        )
                                        notifySuccess(
                                          'کپی شد',
                                          'شماره موبایل در کلیپ‌بورد کپی شد',
                                        )
                                      }
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
                                    title={
                                      rev.customer_email || 'ایمیل ثبت نشده'
                                    }
                                  >
                                    {rev.customer_email || 'ایمیل ثبت نشده'}
                                  </span>
                                </div>
                                {rev.customer_email && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      if (rev.customer_email) {
                                        navigator.clipboard.writeText(
                                          rev.customer_email,
                                        )
                                        notifySuccess(
                                          'کپی شد',
                                          'ایمیل در کلیپ‌بورد کپی شد',
                                        )
                                      }
                                    }}
                                    className="p-1 rounded-control hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition shrink-0"
                                    title="کپی ایمیل"
                                  >
                                    <Copy className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                              <div className="absolute bottom-full right-4 border-4 border-transparent border-b-card" />
                            </div>
                          </div>
                        </div>

                        {rev.is_featured && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded-control">
                            <Sparkles className="h-3 w-3 text-amber-500" />
                            <span>برگزیده</span>
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5 flex-wrap">
                        <span className="font-bold text-foreground">
                          محصول: {rev.product_title}
                        </span>
                        {rev.order_number && (
                          <>
                            <span>•</span>
                            <span className="font-mono font-latin text-[10px] bg-secondary px-1.5 py-0.2 rounded-control border border-border/40 text-brand font-bold">
                              #{rev.order_number}
                            </span>
                          </>
                        )}
                        <span>•</span>
                        <span className="font-mono font-latin">
                          {new Date(rev.created_at).toLocaleDateString('fa-IR')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status & Rating */}
                  <div className="flex items-center gap-3 shrink-0">
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
                        <span className="text-xs font-bold text-amber-500 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-control">
                          در انتظار تایید
                        </span>
                      )}
                      {rev.status === 'approved' && (
                        <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-control">
                          تایید شده
                        </span>
                      )}
                      {rev.status === 'rejected' && (
                        <span className="text-xs font-bold text-rose-500 bg-rose-500/10 border border-rose-500/30 px-2.5 py-1 rounded-control">
                          رد شده
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Experience Tags */}
                {rev.experience_tags && rev.experience_tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {rev.experience_tags.map((tag: string) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 text-xs font-bold bg-secondary text-secondary-foreground border border-border/60 px-2.5 py-0.5 rounded-control shadow-xs"
                      >
                        <Check className="h-3 w-3 text-brand stroke-[3]" />
                        <span>{tag}</span>
                      </span>
                    ))}
                  </div>
                )}

                {/* Review Text */}
                {rev.comment ? (
                  <div className="p-3.5 rounded-control bg-muted/20 border border-border/60 text-xs sm:text-sm text-foreground leading-relaxed whitespace-pre-line">
                    {rev.comment}
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground italic p-2 bg-muted/10 rounded-control border border-border/40">
                    (این نظر بدون متن و فقط با امتیاز و برچسب‌های تجربه خرید ثبت
                    شده است)
                  </div>
                )}

                {/* Rejection Reason if any */}
                {rev.rejection_reason && (
                  <div className="p-3 rounded-control bg-rose-500/10 border border-rose-500/20 text-xs text-rose-500 space-y-0.5">
                    <span className="font-bold">علت رد نظر:</span>
                    <p>{rev.rejection_reason}</p>
                  </div>
                )}

                {/* Existing Admin Reply */}
                {rev.admin_reply && !isReplying && (
                  <div className="p-4 rounded-surface bg-muted/30 border border-border/60 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold text-brand">
                      <div className="flex items-center gap-1.5">
                        <Headphones className="h-3.5 w-3.5 text-brand" />
                        <span>
                          {rev.admin_reply_author ||
                            'پاسخ رسمی پشتیبانی آناهیکس'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {rev.admin_replied_at && (
                          <span className="text-[10px] text-muted-foreground font-normal font-mono font-latin">
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
                          className="text-[11px] text-brand hover:underline cursor-pointer"
                        >
                          ویرایش پاسخ
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-foreground leading-relaxed pr-4 border-r-2 border-brand">
                      {rev.admin_reply}
                    </p>
                  </div>
                )}

                {/* Inline Reply Form */}
                {isReplying && (
                  <div className="p-4 rounded-surface bg-muted/30 border border-border/80 shadow-surface space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-foreground">
                      <span className="flex items-center gap-1.5">
                        <Headphones className="h-4 w-4 text-brand" />
                        <span>ارسال پاسخ مستقیم پشتیبانی به نظر خریدار</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setReplyingReviewId(null)}
                        className="text-muted-foreground hover:text-foreground text-xs cursor-pointer"
                      >
                        انصراف
                      </button>
                    </div>
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="متن پاسخ رسمی پشتیبانی آناهیکس به این نظر را بنویسید..."
                      rows={3}
                      className="w-full rounded-field border border-border/60 bg-card p-3 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-brand leading-relaxed resize-none"
                    />
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                      <input
                        type="text"
                        value={replyAuthor}
                        onChange={(e) => setReplyAuthor(e.target.value)}
                        placeholder="نام پاسخ‌دهنده (مثال: پشتیبانی رسمی آناهیکس)"
                        className="rounded-field border border-border/60 bg-card px-3 py-1.5 text-xs text-foreground w-full sm:w-64 outline-none focus:border-brand"
                      />
                      <button
                        type="button"
                        onClick={() => handleReplySubmit(rev.id)}
                        disabled={isBusy || !replyText.trim()}
                        className="h-9 px-5 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs gap-1.5 shadow-control flex items-center justify-center cursor-pointer duration-motion active:scale-[0.98] disabled:opacity-50"
                      >
                        <Send className="h-3.5 w-3.5" />
                        <span>ثبت و انتشار پاسخ</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Inline Reject Reason Form */}
                {isRejecting && (
                  <div className="p-4 rounded-surface bg-rose-500/10 border border-rose-500/30 space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-rose-500">
                      <span>علت رد نظر (داخلی / جهت اطلاع)</span>
                      <button
                        type="button"
                        onClick={() => setRejectingReviewId(null)}
                        className="text-muted-foreground hover:text-foreground text-xs cursor-pointer"
                      >
                        انصراف
                      </button>
                    </div>
                    <input
                      type="text"
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="دلیل رد نظر (مثال: حاوی شماره تماس یا اسپم، ادعای کذب بدون سفارش)"
                      className="w-full h-10 rounded-field border border-rose-500/30 bg-card px-3 text-xs text-foreground outline-none focus:border-rose-500"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleRejectSubmit(rev.id)}
                        disabled={isBusy}
                        className="h-8 px-4 rounded-control bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs cursor-pointer duration-motion active:scale-[0.98]"
                      >
                        تایید و رد نظر
                      </button>
                    </div>
                  </div>
                )}

                {/* MODERATION ACTION BUTTONS */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/60 text-xs">
                  <div className="flex items-center gap-2">
                    {/* Approve Button */}
                    {rev.status !== 'approved' && (
                      <button
                        type="button"
                        onClick={() => handleApprove(rev.id)}
                        disabled={isBusy}
                        className="h-8 px-3 rounded-control bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold gap-1.5 flex items-center shadow-xs cursor-pointer duration-motion active:scale-[0.98]"
                      >
                        <Check className="h-3.5 w-3.5 stroke-[3]" />
                        <span>تایید و انتشار</span>
                      </button>
                    )}

                    {/* Reject Button */}
                    {rev.status !== 'rejected' && (
                      <button
                        type="button"
                        onClick={() => setRejectingReviewId(rev.id)}
                        disabled={isBusy}
                        className="h-8 px-3 rounded-control border border-rose-500/30 hover:bg-rose-500/10 text-rose-500 text-xs font-bold gap-1.5 flex items-center cursor-pointer duration-motion active:scale-[0.98]"
                      >
                        <X className="h-3.5 w-3.5" />
                        <span>رد نظر</span>
                      </button>
                    )}

                    {/* Reply Button */}
                    {!isReplying && (
                      <button
                        type="button"
                        onClick={() => {
                          setReplyingReviewId(rev.id)
                          setReplyText(rev.admin_reply || '')
                        }}
                        disabled={isBusy}
                        className="h-8 px-3 rounded-control border border-border/60 bg-secondary hover:bg-muted text-foreground text-xs font-bold gap-1.5 flex items-center cursor-pointer shadow-xs duration-motion active:scale-[0.98]"
                      >
                        <MessageSquare className="h-3.5 w-3.5 text-brand" />
                        <span>
                          {rev.admin_reply ? 'ویرایش پاسخ' : 'پاسخ پشتیبانی'}
                        </span>
                      </button>
                    )}

                    {/* Feature / Pin Toggle */}
                    <button
                      type="button"
                      onClick={() =>
                        handleToggleFeature(rev.id, rev.is_featured)
                      }
                      disabled={isBusy}
                      className={`h-8 px-3 rounded-control border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs duration-motion active:scale-[0.98] ${
                        rev.is_featured
                          ? 'bg-amber-500/10 text-amber-500 border-amber-500/30 font-bold'
                          : 'bg-secondary hover:bg-muted text-muted-foreground border-border/60'
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
                      className="h-8 px-2.5 rounded-control border border-destructive/20 text-destructive hover:bg-destructive/10 transition-colors flex items-center gap-1 text-xs font-bold cursor-pointer shadow-xs duration-motion active:scale-[0.98]"
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
          <div className="py-16 text-center bg-card border border-border/80 rounded-surface p-8 space-y-2 shadow-surface">
            <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto" />
            <h4 className="font-bold text-sm text-foreground">
              هیچ نظری با فیلترهای مشخص‌شده یافت نشد
            </h4>
            <p className="text-xs text-muted-foreground">
              می‌توانید فیلتر وضعیت یا فیلتر محصول را تغییر دهید.
            </p>
          </div>
        )}
      </div>

      {/* DELETE CONFIRMATION MODAL */}
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        title="حذف نظر خریدار"
        message="آیا از حذف کامل این نظر و امتیاز آن از فروشگاه اطمینان دارید؟ این عملیات غیرقابل بازگشت است."
        confirmText="بله، نظر حذف شود"
        cancelText="انصراف"
        loading={deleteConfirm.loading}
        onConfirm={confirmDelete}
        onClose={() =>
          setDeleteConfirm({ isOpen: false, reviewId: null, loading: false })
        }
      />
    </div>
  )
}
