import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  Headphones,
  MessageSquare,
  RefreshCw,
  Search,
  Star,
  XCircle,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiService } from '../../services/api'
import type { ReviewItem } from '../../types'
import { toPersianDigits } from '../../utils/formatters'

export const ProfileReviewsTab: React.FC = () => {
  const [reviews, setReviews] = useState<ReviewItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [visibleCount, setVisibleCount] = useState<number>(4)

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

  const filteredReviews = useMemo(() => {
    if (!searchQuery.trim()) return reviews
    const q = searchQuery.toLowerCase().trim()
    return reviews.filter(
      (r) =>
        r.product_title?.toLowerCase().includes(q) ||
        r.comment?.toLowerCase().includes(q) ||
        r.order_number?.toLowerCase().includes(q),
    )
  }, [reviews, searchQuery])

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
        <div className="flex items-center gap-2">
          <div className="relative w-48 sm:w-60">
            <input
              type="text"
              placeholder="جستجو در نظرات من..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setVisibleCount(4)
              }}
              className="w-full h-9 pr-8 pl-3 text-xs rounded-field bg-muted/20 border border-border/60 text-foreground outline-none focus:border-foreground/40 transition-colors"
            />
            <Search className="w-3.5 h-3.5 absolute right-2.5 top-2.5 text-muted-foreground pointer-events-none" />
          </div>

          <button
            type="button"
            onClick={loadReviews}
            disabled={loading}
            className="h-9 px-3.5 rounded-control border border-border/60 bg-card hover:bg-muted text-foreground text-xs font-bold flex items-center gap-1.5 duration-motion ease-motion active:scale-[0.98] cursor-pointer disabled:opacity-50 shrink-0"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-brand' : 'text-muted-foreground'}`}
            />
            <span className="hidden sm:inline">بروزرسانی</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="p-4 rounded-surface bg-card border border-border/60 space-y-1 shadow-surface">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>کل نظرات ثبت‌شده</span>
            <MessageSquare className="h-4 w-4 text-brand" />
          </div>
          <div className="text-2xl font-black text-foreground font-latin">
            {toPersianDigits(reviews.length)}
          </div>
          <p className="text-[10px] text-muted-foreground">تجربه خرید ثبت‌شده</p>
        </div>

        <div className="p-4 rounded-surface bg-emerald-500/10 border border-emerald-500/30 space-y-1 shadow-surface">
          <div className="flex items-center justify-between text-xs text-emerald-400 font-bold">
            <span>تایید شده و منتشر شده</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 font-latin">
            {toPersianDigits(approvedCount)}
          </div>
          <p className="text-[10px] text-emerald-400/80">
            نمایش عمومی در صفحه محصول
          </p>
        </div>

        <div className="p-4 rounded-surface bg-brand/10 border border-brand/30 space-y-1 shadow-surface">
          <div className="flex items-center justify-between text-xs text-brand font-bold">
            <span>در انتظار تایید مدیریت</span>
            <Clock className="h-4 w-4 text-brand" />
          </div>
          <div className="text-2xl font-black text-brand font-latin">
            {toPersianDigits(pendingCount)}
          </div>
          <p className="text-[10px] text-brand/80">در صف بررسی کارشناسان</p>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-16 text-center text-xs text-muted-foreground space-y-2">
            <RefreshCw className="h-6 w-6 text-foreground animate-spin mx-auto" />
            <p>در حال بارگذاری سوابق نظرات شما...</p>
          </div>
        ) : error ? (
          <div className="p-4 rounded-surface bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : filteredReviews.length > 0 ? (
          <div className="space-y-4">
            {filteredReviews.slice(0, visibleCount).map((rev) => (
              <div
                key={rev.id}
                className="rounded-surface border border-border/60 bg-card p-5 space-y-3.5 shadow-surface duration-motion ease-motion"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/products/${rev.product_slug}`}
                        className="font-bold text-sm text-foreground hover:text-brand transition-colors flex items-center gap-1.5"
                      >
                        <span>{rev.product_title}</span>
                        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                      </Link>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      {rev.order_number && (
                        <span className="font-mono text-[10px] bg-muted px-1.5 py-0.5 rounded-control">
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
                    <div className="flex items-center gap-1 text-brand">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`h-4 w-4 ${
                            s <= rev.rating
                              ? 'fill-brand text-brand'
                              : 'text-muted-foreground/20'
                          }`}
                        />
                      ))}
                    </div>

                    {/* Status Badge */}
                    <div>
                      {rev.status === 'pending' && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-brand bg-brand/10 border border-brand/30 px-2.5 py-1 rounded-control">
                          <Clock className="h-3.5 w-3.5 text-brand" />
                          <span>در انتظار بررسی مدیریت</span>
                        </span>
                      )}
                      {rev.status === 'approved' && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-control">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                          <span>تایید و منتشر شده</span>
                        </span>
                      )}
                      {rev.status === 'rejected' && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-destructive bg-destructive/10 border border-destructive/30 px-2.5 py-1 rounded-control">
                          <XCircle className="h-3.5 w-3.5 text-destructive" />
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
                        className="inline-flex items-center gap-1 text-[11px] font-medium bg-muted/40 text-muted-foreground border border-border/40 px-2.5 py-1 rounded-control"
                      >
                        <Check className="h-3 w-3 text-brand stroke-[3]" />
                        <span>{tag}</span>
                      </span>
                    ))}
                  </div>
                )}

                {/* Comment text */}
                {rev.comment && (
                  <div className="p-3.5 rounded-control bg-muted/20 border border-border/40 text-xs text-foreground leading-relaxed">
                    {rev.comment}
                  </div>
                )}

                {/* Admin reply if present */}
                {rev.admin_reply && (
                  <div className="p-4 rounded-control bg-muted/30 border border-border/60 space-y-1.5 mt-2">
                    <div className="flex items-center justify-between text-xs font-bold text-foreground">
                      <div className="flex items-center gap-1.5">
                        <Headphones className="h-3.5 w-3.5 text-brand" />
                        <span>
                          {rev.admin_reply_author ||
                            'پاسخ رسمی پشتیبانی آناهیکس'}
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
                    <p className="text-xs text-foreground/90 leading-relaxed pr-3 border-r-2 border-brand">
                      {rev.admin_reply}
                    </p>
                  </div>
                )}
              </div>
            ))}

            {/* Load More Reviews Button */}
            {visibleCount < filteredReviews.length && (
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setVisibleCount((prev) => prev + 4)}
                  className="h-10 px-5 rounded-control border border-border/60 bg-card hover:bg-muted text-foreground font-black text-xs duration-motion ease-motion active:scale-[0.98] shadow-control cursor-pointer inline-flex items-center gap-2"
                >
                  <span>بارگذاری نظرات بیشتر</span>
                  <span className="text-[11px] text-muted-foreground font-latin">
                    (نمایش{' '}
                    {toPersianDigits(
                      Math.min(visibleCount, filteredReviews.length),
                    )}{' '}
                    از {toPersianDigits(filteredReviews.length)})
                  </span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="py-16 text-center bg-card border border-border/60 rounded-surface p-8 space-y-3 shadow-surface">
            <MessageSquare className="h-10 w-10 text-muted-foreground/60 mx-auto" />
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
