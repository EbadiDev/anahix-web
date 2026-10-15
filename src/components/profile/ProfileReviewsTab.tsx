import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  Headphones,
  MessageSquare,
  RefreshCw,
  Star,
  XCircle,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiService } from '../../services/api'
import type { ReviewItem } from '../../types'
import { Button } from '../ui/button'

export const ProfileReviewsTab: React.FC = () => {
  const [reviews, setReviews] = useState<ReviewItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadReviews = async () => {
    setLoading(true)
    setError(null)
    try {
      const items = await apiService.getCustomerReviews()
      setReviews(items)
    } catch (err: any) {
      setError(err.message || 'خطا در بارگذاری نظرات')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReviews()
  }, [])

  const pendingCount = reviews.filter((r) => r.status === 'pending').length
  const approvedCount = reviews.filter((r) => r.status === 'approved').length

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-foreground">
            نظرات، امتیازها و بازخوردهای من
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            مشاهده وضعیت بررسی نظرات ارسالی، برچسب‌های تجربه خرید و پاسخ‌های تیم
            پشتیبانی
          </p>
        </div>
        <Button
          type="button"
          onClick={loadReviews}
          variant="outline"
          disabled={loading}
          className="rounded-xl text-xs h-9 px-3 gap-2"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`}
          />
          <span>بروزرسانی</span>
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="p-4 rounded-2xl bg-card border border-border space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>کل نظرات ثبت‌شده</span>
            <MessageSquare className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-foreground">
            {reviews.length}
          </div>
          <p className="text-[10px] text-muted-foreground">تجربه خرید ثبت‌شده</p>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-1">
          <div className="flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-400 font-bold">
            <span>تایید شده و منتشر شده</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400">
            {approvedCount}
          </div>
          <p className="text-[10px] text-emerald-600/80">
            نمایش عمومی در صفحه محصول
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-1">
          <div className="flex items-center justify-between text-xs text-amber-700 dark:text-amber-400 font-bold">
            <span>در انتظار تایید مدیریت</span>
            <Clock className="h-4 w-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-700 dark:text-amber-400">
            {pendingCount}
          </div>
          <p className="text-[10px] text-amber-600/80">در صف بررسی کارشناسان</p>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-16 text-center text-xs text-muted-foreground space-y-2">
            <RefreshCw className="h-6 w-6 text-blue-600 animate-spin mx-auto" />
            <p>در حال بارگذاری سوابق نظرات شما...</p>
          </div>
        ) : error ? (
          <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : reviews.length > 0 ? (
          reviews.map((rev) => (
            <div
              key={rev.id}
              className="rounded-2xl border border-border bg-card p-5 space-y-3.5"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/50 pb-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/product/${rev.product_slug}`}
                      className="font-bold text-sm text-foreground hover:text-blue-600 transition flex items-center gap-1.5"
                    >
                      <span>{rev.product_title}</span>
                      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                    </Link>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    {rev.order_number && (
                      <span className="font-mono text-[10px] bg-muted px-1.5 py-0.2 rounded">
                        سفارش #{rev.order_number}
                      </span>
                    )}
                    <span>•</span>
                    <span>
                      {new Date(rev.created_at).toLocaleDateString('fa-IR')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Rating Stars */}
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

                  {/* Status Badge */}
                  <div>
                    {rev.status === 'pending' && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-xl">
                        <Clock className="h-3.5 w-3.5 text-amber-600" />
                        <span>در انتظار بررسی مدیریت</span>
                      </span>
                    )}
                    {rev.status === 'approved' && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-xl">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        <span>تایید شده و منتشر شده</span>
                      </span>
                    )}
                    {rev.status === 'rejected' && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 dark:text-rose-400 bg-rose-500/10 border border-rose-500/30 px-2.5 py-1 rounded-xl">
                        <XCircle className="h-3.5 w-3.5 text-rose-600" />
                        <span>رد شده</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Tags */}
              {rev.experience_tags && rev.experience_tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {rev.experience_tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 text-[11px] font-medium bg-blue-50/50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-900/40 px-2.5 py-1 rounded-xl"
                    >
                      <Check className="h-3 w-3 stroke-[3]" />
                      <span>{tag}</span>
                    </span>
                  ))}
                </div>
              )}

              {/* Comment text */}
              {rev.comment && (
                <div className="p-3.5 rounded-xl bg-muted/30 border border-border/50 text-xs text-foreground leading-relaxed">
                  {rev.comment}
                </div>
              )}

              {/* Admin reply if present */}
              {rev.admin_reply && (
                <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/70 dark:border-blue-900/60 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-blue-700 dark:text-blue-300">
                    <div className="flex items-center gap-1.5">
                      <Headphones className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                      <span>
                        {rev.admin_reply_author || 'پاسخ رسمی پشتیبانی آناهیکس'}
                      </span>
                    </div>
                    {rev.admin_replied_at && (
                      <span className="text-[10px] text-muted-foreground font-normal">
                        {new Date(rev.admin_replied_at).toLocaleDateString(
                          'fa-IR',
                        )}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-foreground/90 leading-relaxed pr-4 border-r-2 border-blue-600">
                    {rev.admin_reply}
                  </p>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="py-16 text-center bg-card border border-border rounded-2xl p-8 space-y-3">
            <MessageSquare className="h-10 w-10 text-muted-foreground mx-auto" />
            <h4 className="font-bold text-sm text-foreground">
              شما هنوز نظری برای سفارش‌های خود ثبت نکرده‌اید
            </h4>
            <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
              با مراجعه به تب «سفارش‌های من»، می‌توانید روی سفارش‌های تکمیل‌شده کلیک
              کرده و نظر و برچسب‌های تجربه خرید خود را ثبت نمایید.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
