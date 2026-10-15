import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clock,
  Loader2,
  ShieldCheck,
  Star,
  Tag,
  X,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useState } from 'react'
import { apiService } from '../../services/api'
import type { CustomerProfile, SubmitReviewRequest } from '../../types'
import { Button } from '../ui/button'

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
    } finally {
      setLoading(false)
    }
  }

  const activeRating = hoverRating || rating

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-xl bg-card border border-border rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-right"
        dir="rtl"
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-border bg-muted/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-600/20">
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
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          {/* Result Alert */}
          {resultMsg && (
            <div
              className={`p-4 rounded-2xl border flex items-start gap-3 animate-in zoom-in-95 ${
                resultMsg.type === 'pending'
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200'
              }`}
            >
              {resultMsg.type === 'pending' ? (
                <Clock className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <p className="font-bold text-xs sm:text-sm">{resultMsg.text}</p>
                {resultMsg.type === 'pending' && (
                  <p className="text-[11px] opacity-80 leading-relaxed">
                    نظر شما در صف تایید مدیریت قرار گرفت و تا دقایقی دیگر پس از
                    بررسی در صفحه محصول نمایش داده خواهد شد.
                  </p>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Verified Buyer Badge notice */}
            <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/40 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-bold">
                <ShieldCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span>ثبت بازخورد خریدار قطعی (Verified Buyer)</span>
              </div>
              {(orderNoInput || orderNumber) && (
                <span className="text-[11px] font-mono text-muted-foreground">
                  سفارش #{orderNoInput || orderNumber}
                </span>
              )}
            </div>

            {/* Step 1: Star Rating */}
            <div className="space-y-2 text-center bg-muted/20 p-4 rounded-2xl border border-border/50">
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
                    className="p-1 rounded-xl transition-transform hover:scale-125 focus:outline-none"
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
                  <Tag className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
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
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-1.5 border ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/20 font-bold'
                          : 'bg-background hover:bg-muted text-muted-foreground border-border'
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
                className="w-full rounded-2xl border border-input bg-background p-3.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-600 transition resize-none leading-relaxed"
              />
              <p className="text-[11px] text-muted-foreground bg-muted/40 p-2.5 rounded-xl border border-border/40 flex items-start gap-2">
                <Clock className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />
                <span>
                  نکته اعتبارسنجی: نظرات حاوی متن، ابتدا توسط تیم پشتیبانی بررسی
                  و ظرف چند دقیقه در صفحه محصول تایید و منتشر می‌شوند.
                </span>
              </p>
            </div>

            {/* Optional Customer Identification if unauthenticated */}
            {!customer && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-border">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-foreground">
                    نام نمایشی
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="مثال: علیرضا ک."
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs"
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
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs text-left"
                  />
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="pt-2 flex items-center justify-end gap-3 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
                className="rounded-xl text-xs h-9 px-4"
              >
                انصراف
              </Button>
              <Button
                type="submit"
                disabled={loading || !!resultMsg}
                className="rounded-xl text-xs h-9 px-6 font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 ml-2 animate-spin" />
                    در حال ثبت نظر...
                  </>
                ) : (
                  'ثبت نهایی نظر و امتیاز'
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
