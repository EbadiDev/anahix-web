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
import { AuthModal } from '../AuthModal'
import { Button } from '../ui/button'
import { useNotification } from '../vibefarsi/NotificationContext'
import { ToggleSwitch } from '../vibefarsi/ToggleSwitch'
import { SubmitReviewModal } from './SubmitReviewModal'

function toPersianDigits(n: number | string): string {
  const f = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']
  return String(n).replace(/\d/g, (d) => f[Number(d)])
}

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

  // Progressive rendering count
  const [visibleReviewsCount, setVisibleReviewsCount] = useState<number>(4)

  // Review modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const {
    success: notifySuccess,
    info: notifyInfo,
    warning: notifyWarning,
    error: notifyError,
  } = useNotification()

  const handleOpenReviewModal = () => {
    if (!apiService.isCustomerLoggedIn()) {
      notifyWarning(
        'نیاز به ورود به حساب کاربری',
        'برای ثبت نظر و امتیاز درباره این محصول، لطفاً ابتدا وارد حساب کاربری خود شوید یا ثبت‌نام کنید.',
      )
      setIsAuthOpen(true)
      return
    }
    setIsModalOpen(true)
  }
  const [eligibility, setEligibility] = useState<{
    eligible: boolean
    reason?: string
    orderNumber?: string
  } | null>(null)

  // Helpful votes state (persisted in localStorage and synced with DB)
  const [votedMap, setVotedMap] = useState<Record<string, boolean>>(() => {
    try {
      const raw = localStorage.getItem('anahix_helpful_reviews')
      return raw ? JSON.parse(raw) : {}
    } catch {
      return {}
    }
  })
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
    setVisibleReviewsCount(4)
    loadReviews()
  }, [product.slug, selectedRating, sortOrder, onlyWithComments])

  const handleHelpfulClick = async (reviewId: string) => {
    const currentlyVoted = Boolean(votedMap[reviewId])
    try {
      const newCount = await apiService.voteReviewHelpful(reviewId)
      const nextVoted = !currentlyVoted
      setVotedMap((prev) => {
        const next = { ...prev, [reviewId]: nextVoted }
        try {
          localStorage.setItem('anahix_helpful_reviews', JSON.stringify(next))
        } catch {}
        return next
      })
      setVoteCountMap((prev) => ({ ...prev, [reviewId]: newCount }))
      if (nextVoted) {
        notifySuccess('دیدگاه مفید ثبت شد', 'دیدگاه شما در سیستم ثبت گردید.')
      } else {
        notifyInfo('لغو بازخورد', 'امتیاز مفید بودن این نظر برداشته شد.')
      }
    } catch (err: any) {
      notifyError('خطا', err.message || 'خطا در ثبت بازخورد')
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
      className="rounded-surface border border-border/80 bg-card p-6 sm:p-8 space-y-6 shadow-surface scroll-mt-24 text-right"
      dir="rtl"
    >
      {/* SECTION HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div className="space-y-1">
          <h3 className="text-xl sm:text-2xl font-black text-foreground">
            نظرات، امتیازها و بازخورد خریداران {product.title_fa}
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground">
            ثبت نظر و امتیاز ستاره‌ای منحصراً توسط خریداران تاییدشده با
            راستی‌آزمایی سفارش انجام می‌شود.
          </p>
        </div>

        {/* CTA Button (100% Responsive, No Wrap) */}
        <div className="shrink-0">
          <button
            type="button"
            onClick={handleOpenReviewModal}
            className="w-full sm:w-auto h-10 px-5 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs sm:text-sm shadow-control flex items-center justify-center gap-2 cursor-pointer duration-motion active:scale-[0.98] whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            <span>ثبت نظر و امتیاز شما</span>
          </button>
        </div>
      </div>

      {/* RATING SUMMARY & STATS CARD */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 bg-muted/20 border border-border/60 rounded-surface p-5 sm:p-6">
        {/* Left: Overall Big Score */}
        <div className="lg:col-span-4 flex flex-col items-center justify-center p-6 bg-card border border-border/80 rounded-surface text-center space-y-3 shadow-xs">
          <div className="flex items-baseline gap-1">
            <span className="text-4xl sm:text-5xl font-black text-foreground tracking-tight font-latin">
              {(() => {
                const r = summary.average_rating
                return r % 1 === 0 ? r.toLocaleString('fa-IR') : r.toFixed(1)
              })()}
            </span>
            <span className="text-sm font-bold text-muted-foreground">
              از ۵
            </span>
          </div>

          <div className="flex items-center gap-1 text-amber-500">
            {[1, 2, 3, 4, 5].map((star) => {
              const full = star <= Math.round(summary.average_rating)
              return (
                <Star
                  key={star}
                  className={`h-5 w-5 ${
                    full
                      ? 'fill-amber-500 text-amber-500'
                      : 'text-muted-foreground/30'
                  }`}
                />
              )
            })}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-control">
              {Number(summary.satisfaction_rate).toLocaleString('fa-IR')}٪ رضایت
              کامل خریداران
            </span>
            <span className="text-xs font-medium text-muted-foreground">
              بر اساس {Number(summary.total_reviews).toLocaleString('fa-IR')}{' '}
              تجربه خرید واقعی
            </span>
          </div>

          <div className="pt-2 text-[11px] text-muted-foreground flex items-center gap-1.5 opacity-85">
            <ShieldCheck className="h-3.5 w-3.5 text-brand" />
            <span>۱۰۰٪ خریداران قطعی (Verified Buyers)</span>
          </div>
        </div>

        {/* Middle: Rating Breakdown Bars */}
        <div className="lg:col-span-4 flex flex-col justify-center space-y-2.5 bg-card border border-border/80 rounded-surface p-5">
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
        <div className="lg:col-span-4 flex flex-col justify-center bg-card border border-border/80 rounded-surface p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-brand" />
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
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-control bg-secondary text-foreground border border-border/60 text-xs font-bold shadow-xs"
                >
                  <Check className="h-3 w-3 text-emerald-500 stroke-[3]" />
                  <span>{tag.tag}</span>
                  <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-control text-muted-foreground font-mono font-latin">
                    {Number(tag.percent).toLocaleString('fa-IR')}٪
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

      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-surface bg-muted/20 border border-border/60">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-bold text-muted-foreground ml-2 flex items-center gap-1">
            <Filter className="h-3.5 w-3.5" />
            <span>فیلتر امتیاز:</span>
          </span>
          <button
            type="button"
            onClick={() => setSelectedRating(0)}
            className={`px-3.5 py-1.5 rounded-control text-xs font-bold transition cursor-pointer ${
              selectedRating === 0
                ? 'bg-primary text-primary-foreground font-black shadow-control'
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
              className={`px-2.5 py-1.5 rounded-control text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                selectedRating === s
                  ? 'bg-primary text-primary-foreground font-black shadow-control'
                  : 'bg-card hover:bg-muted text-muted-foreground border border-border/60'
              }`}
            >
              <span>{s}</span>
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Only with comments toggle */}
          <div className="flex items-center gap-2 select-none text-xs text-muted-foreground hover:text-foreground">
            <ToggleSwitch
              size="sm"
              checked={onlyWithComments}
              onChange={setOnlyWithComments}
              ariaLabel="فقط نظرات متنی"
            />
            <span>فقط نظرات متنی</span>
          </div>

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
          <>
            {reviews.slice(0, visibleReviewsCount).map((rev) => {
              const isHelpfulVoted = votedMap[rev.id]
              const currentHelpfulCount =
                voteCountMap[rev.id] !== undefined
                  ? voteCountMap[rev.id]
                  : rev.helpful_count

              return (
                <div
                  key={rev.id}
                  className={`rounded-surface border bg-card p-5 sm:p-6 space-y-4 duration-motion ease-motion transition-all shadow-surface ${
                    rev.is_featured
                      ? 'border-brand/40 bg-card shadow-control'
                      : 'border-border/60'
                  }`}
                >
                  {/* Review Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-3.5">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-control bg-secondary text-secondary-foreground flex items-center justify-center font-bold text-xs border border-border/60 shadow-control">
                        <User className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs sm:text-sm text-foreground">
                            {rev.customer_name}
                          </span>
                          {rev.is_verified_buyer && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-control">
                              <ShieldCheck className="h-3 w-3 text-emerald-400" />
                              <span>خریدار قطعی</span>
                            </span>
                          )}
                          {rev.is_featured && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-brand/10 text-brand border border-brand/20 px-2 py-0.5 rounded-control">
                              <Sparkles className="h-3 w-3 text-brand" />
                              <span>نظر برگزیده</span>
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                          {rev.order_number && (
                            <span className="font-mono text-[10px] bg-muted/60 px-1.5 py-0.5 rounded-control">
                              #{rev.order_number}
                            </span>
                          )}
                          <span>•</span>
                          <span>
                            {new Date(rev.created_at).toLocaleDateString(
                              'fa-IR',
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Stars Rating */}
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
                  </div>

                  {/* Experience Tags Chosen by Customer */}
                  {rev.experience_tags && rev.experience_tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {rev.experience_tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 text-[11px] font-medium bg-muted/40 text-muted-foreground px-2.5 py-1 rounded-control border border-border/40"
                        >
                          <Check className="h-3 w-3 text-brand stroke-[3]" />
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
                    <div className="p-4 rounded-control bg-muted/30 border border-border/60 space-y-2 mt-3">
                      <div className="flex items-center justify-between text-xs font-bold text-foreground">
                        <div className="flex items-center gap-1.5">
                          <Headphones className="h-4 w-4 text-brand" />
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
                      <p className="text-xs text-foreground/90 leading-relaxed pr-3 border-r-2 border-brand/60">
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
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-control text-xs font-medium duration-motion ease-motion active:scale-[0.98] transition border cursor-pointer ${
                        isHelpfulVoted
                          ? 'bg-brand/10 text-brand border-brand/30 font-bold'
                          : 'bg-muted/40 hover:bg-muted text-muted-foreground border-border/60 hover:text-foreground'
                      }`}
                    >
                      <ThumbsUp
                        className={`h-3.5 w-3.5 ${
                          isHelpfulVoted ? 'fill-current text-brand' : ''
                        }`}
                      />
                      <span>مفید بود</span>
                      {currentHelpfulCount > 0 && (
                        <span className="font-mono text-[11px]">
                          ({toPersianDigits(currentHelpfulCount)})
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              )
            })}

            {/* Progressive Load More Reviews */}
            {reviews.length > visibleReviewsCount && (
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setVisibleReviewsCount((prev) => prev + 4)}
                  className="h-10 px-6 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs duration-motion ease-motion active:scale-[0.98] shadow-control flex items-center gap-2 cursor-pointer"
                >
                  <span>
                    بارگذاری نظرات بیشتر (نمایش{' '}
                    {toPersianDigits(
                      Math.min(visibleReviewsCount, reviews.length),
                    )}{' '}
                    از {toPersianDigits(reviews.length)} نظر)
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setVisibleReviewsCount(reviews.length)}
                  className="h-10 px-5 rounded-control border border-border/60 bg-card hover:bg-muted text-xs font-bold text-foreground duration-motion ease-motion active:scale-[0.98] cursor-pointer"
                >
                  نمایش تمامی {toPersianDigits(reviews.length)} نظر
                </button>
              </div>
            )}
          </>
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
              onClick={handleOpenReviewModal}
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

      {/* Customer Auth Modal for Gated Review Action */}
      <AuthModal
        isOpen={isAuthOpen}
        initialMode="login"
        onClose={() => setIsAuthOpen(false)}
        onSuccess={() => {
          setIsAuthOpen(false)
          setIsModalOpen(true)
        }}
      />
    </section>
  )
}
