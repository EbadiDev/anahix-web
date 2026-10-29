import { Bell, CheckCircle2, Loader2, Smartphone } from 'lucide-react'
import type React from 'react'
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { apiService } from '../services/api'
import type { Product } from '../types'
import { ModalCloseButton } from './vibefarsi/ModalCloseButton'
import { useNotification } from './vibefarsi/NotificationContext'

interface StockAlertModalProps {
  isOpen: boolean
  onClose: () => void
  product: Product
  planTitle?: string
}

export const StockAlertModal: React.FC<StockAlertModalProps> = ({
  isOpen,
  onClose,
  product,
  planTitle,
}) => {
  const { success: notifySuccess, error: notifyError } = useNotification()
  const [mobile, setMobile] = useState('')
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!mobile.trim() && !email.trim()) {
      notifyError('خطا', 'لطفاً شماره موبایل یا ایمیل خود را وارد نمایید.')
      return
    }

    setSubmitting(true)
    try {
      await apiService.createStockAlert({
        product_id: String(product.id),
        mobile: mobile.trim() || undefined,
        email: email.trim() || undefined,
      })
      setSubmitted(true)
      notifySuccess(
        'درخواست ثبت شد',
        'به محض موجود شدن مجدد، از طریق پیامک به شما اطلاع داده خواهد شد.',
      )
      setTimeout(() => {
        setSubmitted(false)
        onClose()
      }, 2000)
    } catch (err: any) {
      notifyError('خطا در ثبت درخواست', err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-background/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        dir="rtl"
        className="w-full max-w-md bg-card rounded-surface border border-border/80 shadow-surface p-5 sm:p-6 space-y-4 text-right animate-in zoom-in-95 duration-200 text-foreground"
      >
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-control bg-brand/10 text-brand flex items-center justify-center font-bold">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-foreground">
                موجود شد به من اطلاع بده
              </h4>
              <p className="text-[11px] text-muted-foreground truncate max-w-[220px]">
                {product.title_fa} {planTitle ? `(${planTitle})` : ''}
              </p>
            </div>
          </div>
          <ModalCloseButton onClick={onClose} size="sm" />
        </div>

        {submitted ? (
          <div className="py-8 text-center space-y-2 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-sm text-foreground">
              درخواست شما ثبت شد!
            </h4>
            <p className="text-xs text-muted-foreground">
              به محض شارژ مجدد موجودی در انبار، بلافاصله پیامک اطلاع‌رسانی برای
              شما ارسال خواهد شد.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <p className="text-muted-foreground leading-relaxed">
              با ثبت شماره تماس خود، به محض تامین و شارژ موجودی این سرویس توسط
              تامین‌کننده، پیامک اطلاع‌رسانی خودکار برای شما ارسال می‌گردد.
            </p>

            <div className="space-y-1.5">
              <label className="font-bold text-foreground block">
                شماره موبایل جهت پیامک (SMS.ir){' '}
                <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  dir="ltr"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="09123456789"
                  className="w-full h-10 px-3 pl-9 rounded-field border border-border/60 bg-muted/20 text-foreground font-mono font-latin outline-none focus:border-brand"
                />
                <Smartphone className="w-4 h-4 text-muted-foreground absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-foreground block">
                آدرس ایمیل (اختیاری):
              </label>
              <input
                type="email"
                dir="ltr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full h-10 px-3 rounded-field border border-border/60 bg-muted/20 text-foreground font-mono font-latin outline-none focus:border-brand"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
              <button
                type="button"
                onClick={onClose}
                className="h-9 px-4 rounded-control border border-border/60 bg-secondary hover:bg-muted text-xs font-bold transition shadow-xs cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="h-9 px-5 rounded-control bg-primary hover:bg-primary-hover text-primary-foreground font-black text-xs shadow-control flex items-center gap-1.5 cursor-pointer duration-motion active:scale-[0.98] disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Bell className="w-3.5 h-3.5" />
                )}
                <span>ثبت اطلاع‌رسانی موجودی</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body,
  )
}
