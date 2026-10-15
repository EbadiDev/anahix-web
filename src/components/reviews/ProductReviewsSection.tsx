import {
  AlertCircle,
  Check,
  Filter,
  Headphones,
  MessageSquare,
  Plus,
  ShieldCheck,
  Sparkles,
  Star,
  ThumbsUp,
  User,
  Zap,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useState } from 'react'
import { apiService } from '../../services/api'
import type {
  CustomerProfile,
  ProductDetail,
  ProductReviewsResponse,
} from '../../types'
import { Button } from '../ui/button'
import { SubmitReviewModal } from './SubmitReviewModal'

interface ProductReviewsSectionProps {
  product: ProductDetail
  customer?: CustomerProfile | null
}

export const ProductReviewsSection: React.FC<ProductReviewsSectionProps> = ({
  product,
  customer,
}) => {
  const [data, setData] = useState<ProductReviewsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters & Sorting state
  const [selectedRating, setSelectedRating] = useState<number>(0) // 0 = all
  const [sortOrder, setSortOrder] = useState<string>('newest') // newest, highest, helpful
  const [onlyWithComments, setOnlyWithComments] = useState<boolean>(false)

  // Review modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [eligibility, setEligibility] = useState<{
    eligible: boolean
    reason?: string
    orderNumber?: string
  } | null>(null)

  // Helpful votes state (tracked in local component state for instant UI update)
  const [votedMap, setVotedMap] = useState<Record<string, boolean>>({})
  const [voteCountMap, setVoteCountMap] = useState<Record<string, number>>({})

  // Fetch reviews from API
  const loadReviews = async () => {
    if (!product.slug) return
    setLoading(true)
    setError(null)
    try {
      const res = await apiService.getProductReviews(product.slug, {
        rating: selectedRating,
        sort: sortOrder,
        has_comment: onlyWithComments ? true : undefined,
        page: 1,
        page_size: 50,
      })
      setData(res)
    } catch (err: any) {
      setError(err.message || 'خطا در بارگذاری نظرات')
    } finally {
      setLoading(false)
    }
  }

  // Check eligibility on mount or customer change
  useEffect(() => {
    let active = true
    async function checkUserEligibility() {
      if (!product.slug) return
      try {
        const res = await apiService.checkReviewEligibility(product.slug)
        if (active) {
          setEligibility({
            eligible: res.eligible,
            reason: res.reason,
            orderNumber: res.order_number,
          })
        }
      } catch {
        if (active) setEligibility(null)
      }
    }
    checkUserEligibility()
    return () => {
      active = false
    }
  }, [product.slug, customer])

  // Trigger load on filter change
  useEffect(() => {
    loadReviews()
  }, [product.slug, selectedRating, sortOrder, onlyWithComments])

  const handleHelpfulClick = async (reviewId: string) => {
    if (votedMap[reviewId]) return

    // Optimistic UI update
    setVotedMap((prev) => ({ ...prev, [reviewId]: true }))
    setVoteCountMap((prev) => ({
      ...prev,
      [reviewId]: (prev[reviewId] ?? 0) + 1,
    }))

    try {
      const newCount = await apiService.voteReviewHelpful(reviewId)
      setVoteCountMap((prev) => ({ ...prev, [reviewId]: newCount }))
    } catch {
      // Revert if error
      setVotedMap((prev) => ({ ...prev, [reviewId]: false }))
    }
  }

  const summary = data?.summary || {
    average_rating: 5.0,
    total_reviews: 0,
    rating_breakdown: {
      star_5: 0,
      star_4: 0,
      star_3: 0,
      star_2: 0,
      star_1: 0,
      star_5_percent: 100,
      star_4_percent: 0,
      star_3_percent: 0,
      star_2_percent: 0,
      star_1_percent: 0,
    },
    top_tags: [],
    verified_buyers_count: 0,
    satisfaction_rate: 100,
  }

  const reviews = data?.reviews || []

  return (
    <section
      id="product-reviews"
      className="rounded-3xl border border-border bg-card p-6 sm:p-8 space-y-8 scroll-mt-24 text-right"
      dir="rtl"
    >
      {/* SECTION HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
            <ShieldCheck className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            <span>شفافیت و اثبات اجتماعی (Social Proof)</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-foreground">
            نظرات، امتیازها و بازخورد خریداران {product.title_fa}
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground">
            ثبت نظر و امتیاز ستاره‌ای منحصراً توسط خریداران تاییدشده با
            راستی‌آزمایی سفارش انجام می‌شود.
          </p>
        </div>

        {/* CTA Button */}
        <div>
          <Button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto h-11 px-5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/20 flex items-center gap-2"
          >
            <Plus className="h-4 w-4 stroke-[3]" />
            <span>ثبت نظر و امتیاز شما</span>
          </Button>
        </div>
      </div>

      {/* RATING SUMMARY & STATS CARD */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-muted/20 border border-border/60 rounded-3xl p-6 sm:p-7">
        {/* Left: Overall Big Score */}
        <div className="lg:col-span-4 flex flex-col items-center justify-center p-6 bg-card border border-border/80 rounded-2xl text-center space-y-3 shadow-sm">
          <div className="flex items-baseline gap-1">
            <span className="text-5xl sm:text-6xl font-black text-foreground tracking-tight">
              {summary.average_rating > 0
                ? summary.average_rating.toFixed(1)
                : '۵.۰'}
            </span>
            <span className="text-lg font-bold text-muted-foreground">
              از ۵
            </span>
          </div>

          <div className="flex items-center gap-1 text-amber-400">
            {[1, 2, 3, 4, 5].map((star) => {
              const full = star <= Math.round(summary.average_rating)
              return (
                <Star
                  key={star}
                  className={`h-5 w-5 ${
                    full
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-muted-foreground/30'
                  }`}
                />
              )
            })}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
              {summary.satisfaction_rate}% رضایت کامل خریداران
            </span>
            <span className="text-xs font-medium text-muted-foreground">
              بر اساس {summary.total_reviews} تجربه خرید واقعی
            </span>
          </div>

          <div className="pt-2 text-[11px] text-muted-foreground flex items-center gap-1.5 opacity-85">
            <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
            <span>۱۰۰٪ خریداران قطعی (Verified Buyers)</span>
          </div>
        </div>

        {/* Middle: Rating Breakdown Bars */}
        <div className="lg:col-span-4 flex flex-col justify-center space-y-2.5 bg-card border border-border/80 rounded-2xl p-5">
          <h4 className="text-xs font-bold text-foreground mb-1">
            تفکیک امتیازدهی خریداران
          </h4>
          {[
            {
              star: 5,
              count: summary.rating_breakdown.star_5,
              percent: summary.rating_breakdown.star_5_percent,
            },
            {
              star: 4,
              count: summary.rating_breakdown.star_4,
              percent: summary.rating_breakdown.star_4_percent,
            },
            {
              star: 3,
              count: summary.rating_breakdown.star_3,
              percent: summary.rating_breakdown.star_3_percent,
            },
            {
              star: 2,
              count: summary.rating_breakdown.star_2,
              percent: summary.rating_breakdown.star_2_percent,
            },
            {
              star: 1,
              count: summary.rating_breakdown.star_1,
              percent: summary.rating_breakdown.star_1_percent,
            },
          ].map((item) => (
            <button
              key={item.star}
              type="button"
              onClick={() =>
                setSelectedRating(selectedRating === item.star ? 0 : item.star)
              }
              className={`flex items-center gap-2.5 w-full text-right hover:opacity-80 transition py-0.5 rounded-lg ${
                selectedRating === item.star ? 'bg-blue-500/10 px-2' : ''
              }`}
            >
              <span className="text-[11px] font-bold text-muted-foreground w-12 shrink-0 flex items-center gap-1">
                <span>{item.star}</span>
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              </span>
              <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden relative">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all duration-500"
                  style={{ width: `${item.percent}%` }}
                />
              </div>
              <span className="text-[11px] font-medium text-muted-foreground w-8 text-left shrink-0">
                {item.percent}%
              </span>
            </button>
          ))}
        </div>

        {/* Right: Top Experience Badges Grid */}
        <div className="lg:col-span-4 flex flex-col justify-center bg-card border border-border/80 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              <span>شاخص‌های تجربه خرید خریداران</span>
            </h4>
            <span className="text-[10px] text-muted-foreground">
              درصد تایید
            </span>
          </div>

          {summary.top_tags && summary.top_tags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {summary.top_tags.map((tag) => (
                <div
                  key={tag.tag}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/40 text-xs font-bold text-blue-700 dark:text-blue-300 shadow-sm"
                >
                  <Check className="h-3 w-3 text-blue-600 dark:text-blue-400 stroke-[3]" />
                  <span>{tag.tag}</span>
                  <span className="text-[10px] bg-blue-600/10 dark:bg-blue-400/20 px-1.5 py-0.5 rounded-md text-blue-600 dark:text-blue-300 font-mono">
                    {tag.percent}%
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-muted-foreground py-4 text-center">
              خریداران هنوز برچسبی برای این محصول ثبت نکرده‌اند.
            </div>
          )}
        </div>
      </div>

      {/* FILTERS & SORTING TOOLBAR */}
      {error && (
        <div className="p-3.5 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-muted/30 border border-border/60">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-bold text-muted-foreground ml-2 flex items-center gap-1">
            <Filter className="h-3.5 w-3.5" />
            <span>فیلتر امتیاز:</span>
          </span>
          <button
            type="button"
            onClick={() => setSelectedRating(0)}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
              selectedRating === 0
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-card hover:bg-muted text-muted-foreground border border-border/60'
            }`}
          >
            همه نظرات
          </button>
          {[5, 4, 3, 2, 1].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSelectedRating(s)}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                selectedRating === s
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-card hover:bg-muted text-muted-foreground border border-border/60'
              }`}
            >
              <span>{s}</span>
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Only with comments checkbox */}
          <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-muted-foreground hover:text-foreground">
            <input
              type="checkbox"
              checked={onlyWithComments}
              onChange={(e) =>
                setOnlyWithComments(
                  e.target.value === 'true' || e.target.checked,
                )
              }
              className="rounded border-input text-blue-600 focus:ring-blue-600 h-3.5 w-3.5"
            />
            <span>فقط نظرات متنی</span>
          </label>

          {/* Sort selector */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-muted-foreground">مرتب‌سازی:</span>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="bg-card border border-border rounded-xl px-2.5 py-1 text-xs text-foreground font-medium focus:outline-none focus:ring-1 focus:ring-blue-600"
            >
              <option value="newest">جدیدترین</option>
              <option value="highest">بیشترین امتیاز</option>
              <option value="helpful">مفیدترین بازخوردها</option>
            </select>
          </div>
        </div>
      </div>

      {/* REVIEWS LIST */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-12 text-center text-xs text-muted-foreground space-y-2">
            <div className="h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p>در حال بارگذاری نظرات و امتیازهای خریداران...</p>
          </div>
        ) : reviews.length > 0 ? (
          reviews.map((rev) => {
            const isHelpfulVoted = votedMap[rev.id]
            const currentHelpfulCount =
              voteCountMap[rev.id] !== undefined
                ? voteCountMap[rev.id]
                : rev.helpful_count

            return (
              <div
                key={rev.id}
                className={`rounded-2xl border bg-card p-5 sm:p-6 space-y-4 transition-all duration-200 hover:border-border/80 ${
                  rev.is_featured
                    ? 'border-blue-500/40 bg-gradient-to-br from-blue-500/[0.02] to-card shadow-sm'
                    : 'border-border/70'
                }`}
              >
                {/* Review Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/50 pb-3.5">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center text-muted-foreground font-bold text-xs border border-border">
                      <User className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs sm:text-sm text-foreground">
                          {rev.customer_name}
                        </span>
                        {rev.is_verified_buyer && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                            <ShieldCheck className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                            <span>خریدار قطعی</span>
                          </span>
                        )}
                        {rev.is_featured && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full">
                            <Sparkles className="h-3 w-3 text-amber-500" />
                            <span>نظر برگزیده</span>
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                        {rev.order_number && (
                          <span className="font-mono text-[10px] bg-muted/60 px-1.5 py-0.5 rounded">
                            #{rev.order_number}
                          </span>
                        )}
                        <span>•</span>
                        <span>
                          {new Date(rev.created_at).toLocaleDateString('fa-IR')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Stars Rating */}
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
                </div>

                {/* Experience Tags Chosen by Customer */}
                {rev.experience_tags && rev.experience_tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {rev.experience_tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 text-[11px] font-medium bg-muted/60 text-muted-foreground px-2.5 py-1 rounded-xl border border-border/40"
                      >
                        <Check className="h-3 w-3 text-blue-600 stroke-[3]" />
                        <span>{tag}</span>
                      </span>
                    ))}
                  </div>
                )}

                {/* Text Comment */}
                {rev.comment && (
                  <p className="text-xs sm:text-sm text-foreground leading-relaxed whitespace-pre-line">
                    {rev.comment}
                  </p>
                )}

                {/* Official Admin / Support Reply Card */}
                {rev.admin_reply && (
                  <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/50 space-y-2 mt-3">
                    <div className="flex items-center justify-between text-xs font-bold text-blue-700 dark:text-blue-300">
                      <div className="flex items-center gap-1.5">
                        <Headphones className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <span>
                          {rev.admin_reply_author ||
                            'پاسخ پشتیبانی رسمی آناهیکس'}
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
                    <p className="text-xs text-foreground/90 leading-relaxed pr-5 border-r-2 border-blue-600/40">
                      {rev.admin_reply}
                    </p>
                  </div>
                )}

                {/* Review Card Footer: Helpful button */}
                <div className="flex items-center justify-end gap-3 pt-2 text-xs text-muted-foreground border-t border-border/40">
                  <span className="text-[11px]">
                    آیا این نظر برای شما مفید بود؟
                  </span>
                  <button
                    type="button"
                    onClick={() => handleHelpfulClick(rev.id)}
                    disabled={isHelpfulVoted}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-medium transition border ${
                      isHelpfulVoted
                        ? 'bg-blue-500/10 text-blue-600 border-blue-500/30 font-bold'
                        : 'bg-muted/40 hover:bg-muted text-muted-foreground border-border/60 hover:text-foreground'
                    }`}
                  >
                    <ThumbsUp
                      className={`h-3.5 w-3.5 ${
                        isHelpfulVoted ? 'fill-current text-blue-600' : ''
                      }`}
                    />
                    <span>مفید بود</span>
                    {currentHelpfulCount > 0 && (
                      <span className="font-mono text-[11px]">
                        ({currentHelpfulCount})
                      </span>
                    )}
                  </button>
                </div>
              </div>
            )
          })
        ) : (
          <div className="py-12 text-center bg-muted/10 border border-dashed border-border rounded-3xl p-8 space-y-3">
            <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center mx-auto text-muted-foreground">
              <MessageSquare className="h-6 w-6" />
            </div>
            <h4 className="font-bold text-sm text-foreground">
              هنوز نظری با این فیلتر ثبت نشده است
            </h4>
            <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
              شما اولین نفری باشید که تجربه خرید، سرعت فعال‌سازی و کیفیت این
              اکانت را با سایر کاربران به اشتراک می‌گذارد!
            </p>
            <Button
              type="button"
              onClick={() => setIsModalOpen(true)}
              variant="outline"
              className="rounded-2xl text-xs h-9 px-4 mt-2"
            >
              ثبت نظر و امتیاز خریدار
            </Button>
          </div>
        )}
      </div>

      {/* Review Submission Modal */}
      <SubmitReviewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        productSlug={product.slug || ''}
        productTitle={product.title_fa}
        productId={String(product.id)}
        orderNumber={eligibility?.orderNumber}
        customer={customer}
        onSuccess={loadReviews}
      />
    </section>
  )
}
