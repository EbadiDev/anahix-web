import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clock,
  Loader2,
  ShieldCheck,
  Star,
  Tag,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { apiService } from '../../services/api'
import type { CustomerProfile, SubmitReviewRequest } from '../../types'
import { ModalCloseButton } from '../vibefarsi/ModalCloseButton'

export const AVAILABLE_EXPERIENCE_TAGS = [
  'تحویل زیر ۱ دقیقه',
  'پشتیبانی عالی و صبور',
  'کیفیت بدون قطعی',
  'فعالسازی سریع و آسان',
  'قیمت منصفانه و رقابتی',
  'تضمین اصالت قانونی',
  'پاسخگویی سریع ۲FA',
  'برخورد محترمانه اپراتور',
]

const RATING_LABELS: Record<number, { text: string; color: string }> = {
  5: { text: 'فوق‌العاده و بی‌نقص (۵ از ۵)', color: 'text-amber-500' },
  4: { text: 'خیلی خوب و راضی‌کننده (۴ از ۵)', color: 'text-amber-400' },
  3: { text: 'متوسط و معمولی (۳ از ۵)', color: 'text-yellow-500' },
  2: { text: 'ضعیف‌تر از انتظار (۲ از ۵)', color: 'text-orange-500' },
  1: { text: 'بسیار ضعیف و ناراضی (۱ از ۵)', color: 'text-rose-500' },
}

interface SubmitReviewModalProps {
  isOpen: boolean
  onClose: () => void
  productSlug: string
  productTitle: string
  productId?: string
  orderId?: string
  orderNumber?: string
  customer?: CustomerProfile | null
  onSuccess?: () => void
}

export const SubmitReviewModal: React.FC<SubmitReviewModalProps> = ({
  isOpen,
  onClose,
  productSlug,
  productTitle,
  productId,
  orderId,
  orderNumber,
  customer,
  onSuccess,
}) => {
  const [rating, setRating] = useState<number>(5)
  const [hoverRating, setHoverRating] = useState<number | null>(null)
  const [selectedTags, setSelectedTags] = useState<string[]>([
    'تحویل زیر ۱ دقیقه',
    'کیفیت بدون قطعی',
  ])
  const [comment, setComment] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [phoneInput, setPhoneInput] = useState('')
  const [accessTokenInput, _setAccessTokenInput] = useState('')
  const [orderNoInput, setOrderNoInput] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resultMsg, setResultMsg] = useState<{
    text: string
    type: 'success' | 'pending'
  } | null>(null)

  useEffect(() => {
    if (customer) {
      setCustomerName(customer.full_name || '')
      setPhoneInput(customer.phone || '')
    }
    if (orderNumber) {
      setOrderNoInput(orderNumber)
    }
  }, [customer, orderNumber])

  if (!isOpen) return null

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResultMsg(null)

    try {
      const payload: SubmitReviewRequest = {
        product_slug: productSlug,
        product_id: productId,
        order_id: orderId,
        order_number: orderNoInput || orderNumber,
        order_access_token: accessTokenInput,
        customer_phone: phoneInput || customer?.phone,
        customer_name: customerName || customer?.full_name,
        rating,
        comment: comment.trim(),
        experience_tags: selectedTags,
      }

      const res = await apiService.submitReview(payload)

      if (res.requires_approval) {
        setResultMsg({
          text: res.message,
          type: 'pending',
        })
      } else {
        setResultMsg({
          text: res.message,
          type: 'success',
        })
      }

      setTimeout(() => {
        if (onSuccess) onSuccess()
        onClose()
      }, 2500)
    } catch (err: any) {
      setError(err.message || 'خطا در ثبت نظر')
      setTimeout(() => {
        setError(null)
      }, 4000)
    } finally {
      setLoading(false)
    }
  }

  const activeRating = hoverRating || rating

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
      style={{ top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <div
        className="w-full max-w-xl bg-card border border-border/80 rounded-surface shadow-overlay overflow-hidden flex flex-col max-h-[90vh] text-right"
        dir="rtl"
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-border/60 bg-muted/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-control bg-secondary text-brand flex items-center justify-center border border-border/60 shadow-xs">
              <Star className="h-5 w-5 fill-current" />
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg text-foreground">
                ثبت نظر و امتیاز خریدار
              </h3>
              <p className="text-xs text-muted-foreground line-clamp-1">
                برای محصول: {productTitle}
              </p>
            </div>
          </div>
          <ModalCloseButton onClick={onClose} size="sm" />
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* Result Alert */}
          {resultMsg && (
            <div
              className={`p-3.5 rounded-control border flex items-start gap-3 animate-in fade-in duration-200 ${
                resultMsg.type === 'pending'
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-500'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
              }`}
            >
              {resultMsg.type === 'pending' ? (
                <Clock className="h-4 w-4 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
              )}
              <div className="space-y-0.5 text-xs">
                <p className="font-bold">{resultMsg.text}</p>
                {resultMsg.type === 'pending' && (
                  <p className="text-[11px] opacity-80 leading-relaxed">
                    نظر شما در صف بررسی قرار گرفت و پس از تایید در صفحه محصول
                    منتشر می‌شود.
                  </p>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="p-3.5 rounded-control bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs flex items-center gap-2 animate-in fade-in duration-200">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Verified Buyer Badge notice */}
            <div className="p-3 rounded-control bg-muted/20 border border-border/60 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-brand font-bold">
                <ShieldCheck className="h-4 w-4 text-brand" />
                <span>ثبت بازخورد خریدار قطعی (Verified Buyer)</span>
              </div>
              {(orderNoInput || orderNumber) && (
                <span className="text-[11px] font-mono text-muted-foreground font-latin">
                  سفارش #{orderNoInput || orderNumber}
                </span>
              )}
            </div>

            {/* Step 1: Star Rating */}
            <div className="space-y-2 text-center bg-muted/20 p-4 rounded-control border border-border/50">
              <label className="block text-xs font-bold text-foreground">
                امتیاز کلی شما به این محصول و خدمات آناهیکس
              </label>
              <div className="flex items-center justify-center gap-2 py-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(null)}
                    className="p-1 rounded-control transition-transform hover:scale-125 focus:outline-none cursor-pointer"
                  >
                    <Star
                      className={`h-7 w-7 sm:h-8 sm:w-8 transition-colors ${
                        star <= activeRating
                          ? 'text-amber-400 fill-amber-400 drop-shadow-sm'
                          : 'text-muted-foreground/30'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <p
                className={`text-xs font-bold ${RATING_LABELS[activeRating]?.color}`}
              >
                {RATING_LABELS[activeRating]?.text}
              </p>
            </div>

            {/* Step 2: Experience Tags (برچسب‌های تجربه خرید) */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5 text-brand" />
                  <span>
                    برچسب‌های تجربه خرید (یک یا چند مورد را انتخاب کنید)
                  </span>
                </label>
                <span className="text-[11px] text-muted-foreground">
                  {selectedTags.length} مورد انتخاب شده
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_EXPERIENCE_TAGS.map((tag) => {
                  const isSelected = selectedTags.includes(tag)
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1.5 rounded-control text-xs font-bold transition flex items-center gap-1.5 border cursor-pointer ${
                        isSelected
                          ? 'bg-primary text-primary-foreground border-primary shadow-control'
                          : 'bg-muted/30 hover:bg-muted text-muted-foreground border-border/60'
                      }`}
                    >
                      {isSelected ? (
                        <Check className="h-3 w-3 stroke-[3]" />
                      ) : (
                        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
                      )}
                      <span>{tag}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Step 3: Text Comment with Moderation Warning */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-foreground">
                متن تجربه و توضیحات شما (اختیاری)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="از کیفیت اکانت، سرعت تحویل، برخورد پشتیبانی یا هر نکته‌ای که به دیگر خریداران کمک می‌کند بنویسید..."
                rows={3}
                className="w-full rounded-field border border-border/60 bg-muted/20 p-3.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-brand transition resize-none leading-relaxed"
              />
              <p className="text-[11px] text-muted-foreground bg-muted/30 p-2.5 rounded-control border border-border/40 flex items-start gap-2">
                <Clock className="h-3.5 w-3.5 text-brand shrink-0 mt-0.5" />
                <span>
                  نکته اعتبارسنجی: نظرات حاوی متن، ابتدا توسط تیم پشتیبانی بررسی
                  و ظرف چند دقیقه در صفحه محصول تایید و منتشر می‌شوند.
                </span>
              </p>
            </div>

            {/* Optional Customer Identification if unauthenticated */}
            {!customer && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-border/60">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-foreground">
                    نام نمایشی
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="مثال: علیرضا ک."
                    className="w-full rounded-field border border-border/60 bg-muted/20 px-3 py-2 text-xs text-foreground outline-none focus:border-brand"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-foreground">
                    شماره موبایل ثبت سفارش
                  </label>
                  <input
                    type="tel"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    placeholder="0912..."
                    dir="ltr"
                    className="w-full rounded-field border border-border/60 bg-muted/20 px-3 py-2 text-xs text-foreground outline-none focus:border-brand text-left font-latin font-mono"
                  />
                </div>
              </div>
            )}

            {/* Modal Actions - Full width action button without cancel button per user instruction */}
            <div className="pt-3 border-t border-border/60">
              <button
                type="submit"
                disabled={loading || !!resultMsg}
                className="w-full h-11 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs sm:text-sm duration-motion active:scale-[0.98] shadow-control flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>در حال اعتبارسنجی و ثبت نظر...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>ثبت نهایی نظر و امتیاز</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body,
  )
}
